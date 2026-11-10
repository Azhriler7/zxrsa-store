// ============================================================================
// FILE: server/api/webhooks/qris.post.ts
// DESKRIPSI: Dual-Gateway Webhook Engine (Mutasiku.co + PayHook v1.11 Resmi)
//            - Rumus HMAC PayHook: HMAC-SHA256("{timestamp}.{raw_body}", secret)
//            - Rumus HMAC Mutasiku: HMAC-SHA256(JSON.stringify(payload.data), secret)
//            - Mendukung CORS Web Simulator PayHook, Heartbeat, & Idempotency event_id
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

function cleanSecretValue(val: unknown): string {
  return String(val || '')
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .trim()
}

export default defineEventHandler(async (event) => {
  // 1. Dukungan CORS agar tombol "Kirim Test (Live)" dari Web Simulator PayHook tidak diblokir browser
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Webhook-Signature, X-Payhook-Timestamp, X-Payhook-Nonce, X-Payhook-Signature'
  })

  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }

  const config = useRuntimeConfig(event)
  const cfEnv = (event.context.cloudflare?.env || {}) as Record<string, unknown>

  const rawBody = (await readRawBody(event, 'utf-8')) || '{}'
  const query = getQuery(event)

  // Kumpulkan semua Secret aktif (Mutasiku & PayHook)
  const candidateSecrets = Array.from(
    new Set(
      [
        cleanSecretValue(config.payhookSecret),
        cleanSecretValue(config.webhookHmacSecret),
        cleanSecretValue(config.mutasikuApiKey),
        cleanSecretValue(cfEnv['NUXT_PAYHOOK_SECRET']),
        cleanSecretValue(cfEnv['NUXT_WEBHOOK_HMAC_SECRET']),
        cleanSecretValue(process.env.NUXT_PAYHOOK_SECRET),
        cleanSecretValue(process.env.NUXT_WEBHOOK_HMAC_SECRET)
      ].filter(Boolean)
    )
  )

  let parsedPayload: Record<string, unknown>
  try {
    parsedPayload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid JSON payload'
    })
  }

  // --------------------------------------------------------------------------
  // [SECTION: VERIFIKASI AUTENTIKASI & HMAC (PAYHOOK & MUTASIKU)]
  // --------------------------------------------------------------------------
  const payhookTimestamp = String(getHeader(event, 'x-payhook-timestamp') || '').trim()
  const payhookSignature = String(getHeader(event, 'x-payhook-signature') || '')
    .replace(/^sha256=/i, '')
    .trim()
    .toLowerCase()

  const mutasikuSignature = String(
    getHeader(event, 'x-webhook-signature')
    || getHeader(event, 'x-mutasiku-signature')
    || getHeader(event, 'x-signature')
    || ''
  )
    .replace(/^sha256=/i, '')
    .trim()
    .toLowerCase()

  const authHeader = String(getHeader(event, 'authorization') || '').trim()
  const bearerToken = cleanSecretValue(authHeader.replace(/^Bearer\s+/i, ''))
  const apiKeyHeader = cleanSecretValue(getHeader(event, 'x-api-key') || getHeader(event, 'x-webhook-key') || '')
  const queryKey = cleanSecretValue(query.key || query.secret || query.token)

  // Anti-replay PayHook: tolak jika timestamp PayHook terpaut lebih dari 5 menit (300 detik)
  if (payhookTimestamp) {
    const tsSeconds = Number(payhookTimestamp)
    const nowSeconds = Math.floor(Date.now() / 1000)
    if (!Number.isNaN(tsSeconds) && Math.abs(nowSeconds - tsSeconds) > 300) {
      throw createError({
        statusCode: 408,
        statusMessage: 'PayHook timestamp expired (> 5 minutes).'
      })
    }
  }

  let isVerified = false
  if (candidateSecrets.length === 0) {
    isVerified = true
  } else {
    const dataJsonString = JSON.stringify(parsedPayload['data'] ?? {})

    for (const secret of candidateSecrets) {
      // A. Cek Verifikasi HMAC Resmi PayHook: HMAC-SHA256("{timestamp}.{raw_body}", secret)
      if (payhookSignature && payhookTimestamp) {
        const expectedPayhookHmac = (
          await computeHmacSha256Hex(`${payhookTimestamp}.${rawBody}`, secret)
        ).toLowerCase()
        if (payhookSignature === expectedPayhookHmac) {
          isVerified = true
          break
        }
      }

      // B. Cek Verifikasi Bearer Token / X-API-Key PayHook
      if (
        (bearerToken && bearerToken === secret)
        || (apiKeyHeader && apiKeyHeader === secret)
        || (queryKey && queryKey === secret)
      ) {
        isVerified = true
        break
      }

      // C. Cek Verifikasi HMAC Resmi Mutasiku: HMAC-SHA256(JSON.stringify(payload.data), secret)
      if (mutasikuSignature) {
        const expectedMutasikuDataSig = (await computeHmacSha256Hex(dataJsonString, secret)).toLowerCase()
        if (mutasikuSignature === expectedMutasikuDataSig) {
          isVerified = true
          break
        }
      }
    }
  }

  if (!isVerified) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized Webhook Token or HMAC Signature.'
    })
  }

  // --------------------------------------------------------------------------
  // [SECTION: DETEKSI HEARTBEAT PAYHOOK]
  // --------------------------------------------------------------------------
  if (parsedPayload['type'] === 'heartbeat') {
    return {
      status: 'ok',
      received: true,
      type: 'heartbeat',
      device_id: parsedPayload['device_id'] || null
    }
  }

  // Deteksi apakah payload berasal dari PayHook atau Mutasiku
  const isPayHook = parsedPayload['sent_by'] === 'PayHook' || Boolean(parsedPayload['event_id'])
  const gatewaySource = isPayHook ? 'PAYHOOK' : 'MUTASIKU'

  // --------------------------------------------------------------------------
  // [SECTION: FILTER ARAH DANA MASUK (ABAIKAN DANA KELUAR)]
  // --------------------------------------------------------------------------
  if (isPayHook) {
    const direction = String(parsedPayload['direction'] || 'in').toLowerCase()
    const eventType = String(parsedPayload['event_type'] || 'payment.incoming').toLowerCase()
    if (direction === 'out' || eventType === 'payment.outgoing') {
      return {
        status: 'ok',
        received: true,
        ignored: true,
        gateway: 'PAYHOOK',
        reason: 'Notifikasi uang keluar (payment.outgoing) diabaikan.'
      }
    }
  } else if (parsedPayload['type'] === 'mutations.created') {
    const mutData = (parsedPayload['data'] || {}) as Record<string, unknown>
    const mutDir = String(mutData['type'] || 'CREDIT').toUpperCase()
    if (mutDir !== 'CREDIT' && mutDir !== 'CR' && mutDir !== 'IN') {
      return {
        received: true,
        ignored: true,
        gateway: 'MUTASIKU',
        reason: `Mutasi bertipe ${mutDir} diabaikan.`
      }
    }
  }

  // --------------------------------------------------------------------------
  // [SECTION: EKSTRAKSI NOMINAL & IDEMPOTENCY KEY]
  // PayHook mengirim: { event_id: "evt_...", amount: 300000, reference: "PH-..." }
  // Mutasiku mengirim: { type: "mutations.created", data: { accountId, amount: 300000 } }
  // --------------------------------------------------------------------------
  const payloadData = (parsedPayload['data'] && typeof parsedPayload['data'] === 'object')
    ? (parsedPayload['data'] as Record<string, unknown>)
    : parsedPayload

  const transactionNested = (payloadData['transaction'] && typeof payloadData['transaction'] === 'object')
    ? (payloadData['transaction'] as Record<string, unknown>)
    : null

  const detectedAmount = Math.floor(
    Number(
      parsedPayload['amount']
      || payloadData['amount']
      || (transactionNested && transactionNested['amount'])
      || 0
    )
  )

  // Gunakan event_id dari PayHook sebagai Idempotency Key agar retry tidak dobel
  const externalRef = String(
    parsedPayload['event_id']
    || parsedPayload['reference']
    || payloadData['id']
    || payloadData['paymentId']
    || payloadData['accountId']
    || `${gatewaySource}-${Date.now()}`
  )

  if (!detectedAmount || detectedAmount <= 0) {
    return {
      status: 'ok',
      received: true,
      gateway: gatewaySource,
      message: 'Webhook diterima, namun nominal 0.'
    }
  }

  const repo = new StorefrontRepository(event)

  try {
    const settledInvoiceId = await repo.processQrisWebhookMutation(detectedAmount, externalRef)
    return {
      status: 'ok',
      received: true,
      matched: true,
      gateway: gatewaySource,
      settledInvoiceId,
      amount: detectedAmount
    }
  } catch {
    return {
      status: 'ok',
      received: true,
      matched: false,
      gateway: gatewaySource,
      amount: detectedAmount,
      is_test: Boolean(parsedPayload['is_test']),
      message: `Webhook ${gatewaySource} diterima (Rp ${detectedAmount}), namun tidak ada invoice pending dengan nominal tersebut.`
    }
  }
})
