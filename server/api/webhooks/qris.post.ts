// ============================================================================
// FILE: server/api/webhooks/qris.post.ts
// DESKRIPSI: Endpoint POST Webhook Pelacak Mutasi QRIS dengan Validasi
//            Signature Kriptografi HMAC-SHA256 (Anti-Fraud).
// ============================================================================

import { z } from 'zod'
import { CryptoService } from '../../services/CryptoService'
import { StorefrontRepository } from '../../services/StorefrontRepository'

const webhookPayloadSchema = z.object({
  amount: z.number().int().positive(),
  reference_id: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const rawBody = await readRawBody(event, 'utf-8')
  const signatureHeader = getRequestHeader(event, 'x-webhook-signature') || ''

  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Empty payload' })
  }

  // 1. Verifikasi HMAC-SHA256 Secret Key
  const isSignatureValid = await CryptoService.verifyHmacSignature(
    rawBody,
    signatureHeader,
    config.webhookHmacSecret
  )

  if (!isSignatureValid) {
    const repo = new StorefrontRepository(event)
    await repo.writeSystemLog('security', 'WEBHOOK_QRIS_REJECTED', 'Percobaan tembak webhook dengan signature HMAC palsu!')
    throw createError({
      statusCode: 401,
      statusMessage: '[ANTI_FRAUD] Invalid HMAC-SHA256 Webhook Signature.'
    })
  }

  // 2. Parse & cocokkan nominal pembayaran
  const parsedJson = JSON.parse(rawBody)
  const validated = webhookPayloadSchema.safeParse(parsedJson)

  if (!validated.success) {
    throw createError({ statusCode: 400, statusMessage: 'Format payload webhook tidak sesuai.' })
  }

  const repo = new StorefrontRepository(event)
  const settledInvoiceId = await repo.processQrisWebhookMutation(
    validated.data.amount,
    validated.data.reference_id
  )

  return {
    success: true,
    settledInvoiceId
  }
})
