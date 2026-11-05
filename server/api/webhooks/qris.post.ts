// ============================================================================
// FILE: server/api/webhooks/qris.post.ts
// DESKRIPSI: Endpoint Webhook Instan untuk Mutasiku.co.id / Mutasi QRIS
//            (Bebas Error ESLint & Mendukung Callback Instan 1 Detik).
// ============================================================================

import { StorefrontRepository } from '../../services/StorefrontRepository'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const rawBody = (await readRawBody(event, 'utf-8')) || '{}'
  const query = getQuery(event)

  // Ambil secret dari NUXT_WEBHOOK_HMAC_SECRET di .env / Cloudflare Secrets
  const secretKey = (config.webhookHmacSecret || '').trim()

  // Mutasiku bisa mengirim token via Query (?key=...), Header (x-api-key / Authorization), atau di dalam Body JSON
  const queryKey = String(query.key || query.token || query.secret || '').trim()
  const headerKey = (
    getHeader(event, 'x-webhook-key')
    || getHeader(event, 'x-api-key')
    || getHeader(event, 'x-callback-token')
    || getHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '')
    || ''
  ).trim()

  // Deklarasi tanpa nilai awal '= {}' agar 100% lulus ESLint no-useless-assignment
  let parsedPayload: Record<string, unknown>
  try {
    parsedPayload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    parsedPayload = { text: rawBody }
  }

  const bodyKey = String(parsedPayload.api_key || parsedPayload.token || parsedPayload.secret || '').trim()

  // Validasi Keamanan Webhook Mutasiku
  if (secretKey && queryKey !== secretKey && headerKey !== secretKey && bodyKey !== secretKey) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized Mutasiku Webhook Key.'
    })
  }

  // --------------------------------------------------------------------------
  // [SECTION: EKSTRAKSI NOMINAL MUTASIKU (MENDUKUNG FORMAT OBJECT, ARRAY, & TEKS)]
  // Mutasiku mengirimkan field 'amount' / 'kredit' / 'nominal' atau array 'data'
  // --------------------------------------------------------------------------
  let detectedAmount = 0

  // Cek jika Mutasiku mengirim dalam bentuk array mutasi: { data: [{ amount: 15123, type: 'CR' }] }
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

  // Jika dikirim langsung di root JSON: { amount: 15123, kredit: "15123" }
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

  // Fallback ekstraksi dari teks notifikasi mentah jika dikirim dari forwarder notifikasi Mutasiku
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
    throw createError({
      statusCode: 400,
      statusMessage: 'Nominal pembayaran tidak ditemukan dalam payload Mutasiku.'
    })
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
