// ============================================================================
// FILE: server/api/admin/custom-gmail-confirm.post.ts
// DESKRIPSI: Endpoint POST Konfirmasi Pesanan Custom Gmail Selesai & Kirim Email
// ============================================================================

import { z } from 'zod'
import { AdminInvoiceRepository } from '../../services/AdminInvoiceRepository'

const confirmSchema = z.object({
  transaction_id: z.string().min(3, 'ID Transaksi tidak valid')
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, r => confirmSchema.safeParse(r))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: body.error.issues[0]?.message || 'ID Transaksi tidak valid.'
    })
  }

  const repo = new AdminInvoiceRepository(event)
  const result = await repo.confirmCustomGmailCompleted(body.data.transaction_id)

  return {
    success: true,
    emailSent: result.emailSent,
    emailError: result.emailError
  }
})
