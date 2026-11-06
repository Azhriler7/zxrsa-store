// ============================================================================
// FILE: server/api/webhooks/qris.post.ts
// DESKRIPSI: Endpoint Webhook Resmi Mutasiku (Mendukung Verifikasi Signature
//            HMAC-SHA256 & Event "New Mutations" / "Payment Completed").
// ============================================================================

import { StorefrontRepository } from '../../services/StorefrontRepository'

async function verifyHmacSha256(payload: string, signatureHeaderValue: string, secret: string): Promise<boolean> {
  try {
    // Bersihkan awalan 'sha256=' jika Mutasiku menyertakannya di header signature
    const cleanSignatureHex = signatureHeaderValue.replace(/^sha256=/i, '').trim()

    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret) as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload) as BufferSource)
    const computedHex = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    return computedHex.toLowerCase() === cleanSignatureHex.toLowerCase()
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const rawBody = (await readRawBody(event, 'utf-8')) || '{}'
  const query = getQuery(event)

  const webhookSecret = String(config.webhookHmacSecret || '').trim()
  const mutasikuApiKey = String(config.mutasikuApiKey || '').trim()

  const queryKey = String(query.key || query.token || query.secret || '').trim()
  const headerKey = (
    getHeader(event, 'x-webhook-key')
    || getHeader(event, 'x-api-key')
    || getHeader(event, 'x-callback-token')
    || getHeader(event, 'x-mutasiku-token')
    || getHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '')
    || ''
  ).trim()

  // Tangkap semua kemungkinan nama header signature dari Mutasiku
  const signatureHeader = (
    getHeader(event, 'x-mutasiku-signature')
    || getHeader(event, 'x-webhook-signature')
    || getHeader(event, 'x-signature')
    || getHeader(event, 'signature')
    || ''
  ).trim()

  let parsedPayload: Record<string, unknown>
  try {
    parsedPayload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    parsedPayload = { text: rawBody }
  }

  const bodyKey = String(
    parsedPayload['api_key'] || parsedPayload['token'] || parsedPayload['secret'] || parsedPayload['webhook_secret'] || ''
  ).trim()

  // Verifikasi Signature HMAC-SHA256 atau Secret Token
  const validSecrets = [webhookSecret, mutasikuApiKey].filter(Boolean)
  let isAuthorized = validSecrets.length === 0

  for (const sec of validSecrets) {
    if (queryKey === sec || headerKey === sec || bodyKey === sec) {
      isAuthorized = true
      break
    }
    if (signatureHeader && (await verifyHmacSha256(rawBody, signatureHeader, sec))) {
      isAuthorized = true
      break
    }
  }

  if (!isAuthorized) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized Mutasiku Webhook Signature.'
    })
  }

  // --------------------------------------------------------------------------
  // [SECTION: EKSTRAKSI NOMINAL DARI EVENT "New Mutations" / "Payment Completed"]
  // --------------------------------------------------------------------------
  const candidateAmounts: number[] = []

  // 1. Jika payload memiliki array 'mutations' atau 'data' (Event: New Mutations)
  const listSource = Array.isArray(parsedPayload['mutations'])
    ? (parsedPayload['mutations'] as Record<string, unknown>[])
    : Array.isArray(parsedPayload['data'])
      ? (parsedPayload['data'] as Record<string, unknown>[])
      : []

  for (const item of listSource) {
    if (item && typeof item === 'object') {
      const amt = Number(item['amount'] || item['kredit'] || item['credit'] || item['nominal'] || item['total'] || 0)
      if (amt > 0) candidateAmounts.push(amt)
    }
  }

  // 2. Jika payload memiliki objek tunggal 'data' atau 'mutation' atau 'payment'
  const singleObj = (parsedPayload['data'] || parsedPayload['mutation'] || parsedPayload['payment']) as Record<string, unknown> | undefined
  if (singleObj && typeof singleObj === 'object' && !Array.isArray(singleObj)) {
    const amt = Number(
      singleObj['amount'] || singleObj['kredit'] || singleObj['credit'] || singleObj['nominal'] || singleObj['total'] || 0
    )
    if (amt > 0) candidateAmounts.push(amt)
  }

  // 3. Jika nominal berada langsung di root JSON
  if (candidateAmounts.length === 0) {
    const rawNum = String(
      parsedPayload['amount']
      || parsedPayload['kredit']
      || parsedPayload['credit']
      || parsedPayload['nominal']
      || parsedPayload['total']
      || '0'
    ).replace(/[^0-9]/g, '')
    const amt = Number(rawNum)
    if (amt > 0) candidateAmounts.push(amt)
  }

  if (candidateAmounts.length === 0) {
    return {
      success: true,
      message: 'Webhook diterima, namun tidak ada nominal transaksi yang perlu diproses.'
    }
  }

  const externalRef = String(
    parsedPayload['id']
    || parsedPayload['mutation_id']
    || parsedPayload['trx_id']
    || (singleObj && singleObj['id'])
    || `MUTASIKU-${Date.now()}`
  )

  const repo = new StorefrontRepository(event)
  const settledInvoices: string[] = []

  // Proses setiap mutasi yang masuk di dalam batch New Mutations
  for (const amount of candidateAmounts) {
    try {
      const settledId = await repo.processQrisWebhookMutation(amount, externalRef)
      settledInvoices.push(settledId)
    } catch {
      // Lanjut cek item mutasi berikutnya jika ada lebih dari 1 mutasi dalam 1 webhook
    }
  }

  return {
    success: true,
    settledInvoices,
    processedAmounts: candidateAmounts
  }
})
