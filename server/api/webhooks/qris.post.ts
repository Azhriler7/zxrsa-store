// ============================================================================
// FILE: server/api/webhooks/qris.post.ts
// DESKRIPSI: Endpoint Webhook Resmi untuk Mutasiku.co (Mendukung Webhook Secret,
//            API Key Secret, & HMAC Signature Verification).
// ============================================================================

import { StorefrontRepository } from '../../services/StorefrontRepository'

async function verifyHmacSha256(payload: string, signatureHex: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const computedHex = Array.from(new Uint8Array(sigBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    return computedHex.toLowerCase() === signatureHex.toLowerCase()
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

  const signatureHeader = (
    getHeader(event, 'x-mutasiku-signature')
    || getHeader(event, 'x-webhook-signature')
    || getHeader(event, 'x-signature')
    || ''
  ).trim()

  let parsedPayload: Record<string, unknown>
  try {
    parsedPayload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    parsedPayload = { text: rawBody }
  }

  const bodyKey = String(
    parsedPayload.api_key || parsedPayload.token || parsedPayload.secret || parsedPayload.webhook_secret || ''
  ).trim()

  // Verifikasi kecocokan dengan Webhook Secret ATAU API Key Mutasiku
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
      statusMessage: 'Unauthorized Mutasiku Webhook Secret.'
    })
  }

  let detectedAmount = 0

  if (Array.isArray(parsedPayload.data) && parsedPayload.data.length > 0) {
    const firstMutation = parsedPayload.data[0] as Record<string, unknown>
    detectedAmount = Number(
      firstMutation.amount || firstMutation.kredit || firstMutation.nominal || firstMutation.total || 0
    )
  } else if (parsedPayload.data && typeof parsedPayload.data === 'object') {
    const dataObj = parsedPayload.data as Record<string, unknown>
    detectedAmount = Number(
      dataObj.amount || dataObj.kredit || dataObj.nominal || dataObj.total || 0
    )
  }

  if (!detectedAmount || detectedAmount <= 0) {
    const rawNum = String(
      parsedPayload.amount
      || parsedPayload.kredit
      || parsedPayload.credit
      || parsedPayload.nominal
      || parsedPayload.total
      || '0'
    ).replace(/[^0-9]/g, '')
    detectedAmount = Number(rawNum)
  }

  if (!detectedAmount || detectedAmount <= 0) {
    const combinedText = [
      parsedPayload.text,
      parsedPayload.message,
      parsedPayload.description,
      parsedPayload.keterangan,
      rawBody
    ]
      .filter(Boolean)
      .join(' ')

    const rpMatch = combinedText.match(/(?:Rp|IDR)\.?\s*([0-9]{1,3}(?:[.,][0-9]{3})+|[0-9]{4,9})/i)
    if (rpMatch && rpMatch[1]) {
      detectedAmount = Number(rpMatch[1].replace(/[.,]/g, ''))
    }
  }

  if (!detectedAmount || detectedAmount <= 0) {
    return {
      success: false,
      message: 'Ping/Event diterima, namun tidak ada nominal transaksi yang perlu diproses.'
    }
  }

  const externalRef = String(
    parsedPayload.id || parsedPayload.mutation_id || parsedPayload.trx_id || `MUTASIKU-${Date.now()}`
  )

  const repo = new StorefrontRepository(event)
  const settledInvoiceId = await repo.processQrisWebhookMutation(detectedAmount, externalRef)

  return {
    success: true,
    settledInvoiceId,
    detectedAmount
  }
})
