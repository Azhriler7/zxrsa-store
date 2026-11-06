// ============================================================================
// FILE: server/api/admin/custom-gmail-confirm.post.ts
// DESKRIPSI: Endpoint POST Konfirmasi Pesanan Custom Gmail Selesai & Kirim Email
//            (Mendukung field 'id' maupun 'transaction_id').
// ============================================================================

import { z } from 'zod'
import { AdminInvoiceRepository } from '../../services/AdminInvoiceRepository'

const confirmSchema = z.object({
  id: z.string().optional(),
  transaction_id: z.string().optional()
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, r => confirmSchema.safeParse(r))

  const targetTxId = (body.data?.transaction_id || body.data?.id || '').trim()

  if (!body.success || targetTxId.length < 3) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID Transaksi tidak valid.'
    })
  }

  const repo = new AdminInvoiceRepository(event)
  const result = await repo.confirmCustomGmailCompleted(targetTxId)

  return {
    success: true,
    emailSent: result.emailSent,
    emailError: result.emailError
  }
})
