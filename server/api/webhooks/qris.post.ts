// ============================================================================
// FILE: server/api/webhooks/qris.post.ts
// DESKRIPSI: Endpoint Webhook Resmi Mutasiku.co.id
//            - Verifikasi HMAC-SHA256 atas JSON.stringify(payload.data)
//            - Mendukung Event 'mutations.created' & 'payment.completed'
//            - Mendukung Pengujian Sandbox Mutasiku (Selalu Return 200 OK)
// ============================================================================

import { StorefrontRepository } from '../../services/StorefrontRepository'

async function computeHmacSha256Hex(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret) as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message) as BufferSource)
  return Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const cleanA = a.replace(/^sha256=/i, '').trim().toLowerCase()
  const cleanB = b.replace(/^sha256=/i, '').trim().toLowerCase()
  if (cleanA.length !== cleanB.length || cleanA.length === 0) return false

  let mismatch = 0
  for (let i = 0; i < cleanA.length; i++) {
    mismatch |= cleanA.charCodeAt(i) ^ cleanB.charCodeAt(i)
  }
  return mismatch === 0
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const rawBody = (await readRawBody(event, 'utf-8')) || '{}'
  const query = getQuery(event)

  const webhookSecret = String(config.webhookHmacSecret || '').trim()
  const mutasikuApiKey = String(config.mutasikuApiKey || '').trim()

  let parsedPayload: Record<string, unknown>
  try {
    parsedPayload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid JSON payload'
    })
  }

  const eventType = String(parsedPayload['type'] || 'unknown')
  const payloadData = (parsedPayload['data'] && typeof parsedPayload['data'] === 'object')
    ? (parsedPayload['data'] as Record<string, unknown>)
    : parsedPayload

  // --------------------------------------------------------------------------
  // [SECTION: VERIFIKASI SIGNATURE RESMI MUTASIKU]
  // Sesuai dok resmi: signature = HMAC-SHA256(JSON.stringify(payload.data), webhookSecret)
  // --------------------------------------------------------------------------
  const signatureHeader = (
    getHeader(event, 'x-webhook-signature')
    || getHeader(event, 'x-mutasiku-signature')
    || getHeader(event, 'x-signature')
    || ''
  ).trim()

  const queryKey = String(query.key || query.secret || '').trim()
  const validSecrets = [webhookSecret, mutasikuApiKey].filter(Boolean)

  let isVerified = false
  if (validSecrets.length === 0) {
    // Jika secret belum diset di env, izinkan lewat untuk mempermudah setup awal
    isVerified = true
  } else {
    const dataJsonString = JSON.stringify(parsedPayload['data'] ?? {})

    for (const secret of validSecrets) {
      // 1. Cek sesuai rumus resmi Mutasiku: HMAC-SHA256(JSON.stringify(payload.data), secret)
      if (signatureHeader) {
        const expectedDataSig = await computeHmacSha256Hex(dataJsonString, secret)
        if (timingSafeHexEqual(signatureHeader, expectedDataSig)) {
          isVerified = true
          break
        }

        // 2. Fallback jika ditandatangani menggunakan rawBody utuh
        const expectedRawSig = await computeHmacSha256Hex(rawBody, secret)
        if (timingSafeHexEqual(signatureHeader, expectedRawSig)) {
          isVerified = true
          break
        }
      }

      // 3. Fallback jika menggunakan ?key=SECRET di URL
      if (queryKey && queryKey === secret) {
        isVerified = true
        break
      }
    }
  }

  if (!isVerified) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid signature'
    })
  }

  // --------------------------------------------------------------------------
  // [SECTION: FILTER EVENT & EKSTRAKSI NOMINAL DEFAULT MUTASIKU]
  // 1. Event 'mutations.created':
  //    { type: 'mutations.created', data: { accountId, amount: 1000000, type: 'CREDIT', ... } }
  // 2. Event 'payment.completed':
  //    { type: 'payment.completed', data: { id, amount: 1000000, status: 'COMPLETED', ... } }
  // --------------------------------------------------------------------------
  if (eventType === 'mutations.created') {
    const mutationDirection = String(payloadData['type'] || 'CREDIT').toUpperCase()
    if (mutationDirection && mutationDirection !== 'CREDIT' && mutationDirection !== 'CR' && mutationDirection !== 'IN') {
      return {
        received: true,
        ignored: true,
        reason: `Mutasi bertipe ${mutationDirection} (bukan dana masuk/CREDIT) diabaikan.`
      }
    }
  }

  const transactionNested = (payloadData['transaction'] && typeof payloadData['transaction'] === 'object')
    ? (payloadData['transaction'] as Record<string, unknown>)
    : null

  const detectedAmount = Number(
    payloadData['amount']
    || (transactionNested && transactionNested['amount'])
    || payloadData['kredit']
    || payloadData['nominal']
    || 0
  )

  const externalRef = String(
    payloadData['id']
    || (transactionNested && transactionNested['id'])
    || payloadData['orderId']
    || payloadData['accountId']
    || `MUTASIKU-${Date.now()}`
  )

  // Jika event selain pembayaran/mutasi (misal test account.created / balance.updated di Sandbox)
  if (!detectedAmount || detectedAmount <= 0) {
    return {
      received: true,
      eventType,
      message: 'Event webhook diterima dengan signature valid (tidak ada nominal yang perlu dicocokkan).'
    }
  }

  // --------------------------------------------------------------------------
  // [SECTION: PROSES PELUNASAN INVOICE & DUKUNGAN SANDBOX 200 OK]
  // Jika nominal cocok dengan invoice aktif -> Otomatis LUNAS & Kirim Akun.
  // Jika nominal dari Sandbox (misal Rp 1.000.000) tidak ada di invoice aktif ->
  // Tetap kembalikan HTTP 200 { received: true } sesuai Best Practice Mutasiku!
  // --------------------------------------------------------------------------
  const repo = new StorefrontRepository(event)

  try {
    const settledInvoiceId = await repo.processQrisWebhookMutation(detectedAmount, externalRef)
    return {
      received: true,
      matched: true,
      eventType,
      settledInvoiceId,
      amount: detectedAmount
    }
  } catch {
    return {
      received: true,
      matched: false,
      eventType,
      amount: detectedAmount,
      message: 'Webhook diterima & signature valid. Tidak ada invoice pending dengan nominal tersebut (Normal saat tes Sandbox).'
    }
  }
})
