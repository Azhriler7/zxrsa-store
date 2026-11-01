// ============================================================================
// FILE: server/api/admin/custom-gmail-confirm.post.ts
// DESKRIPSI: Endpoint POST Konfirmasi Pesanan Custom Gmail & Kirim Email Invoice
// ============================================================================

import { z } from 'zod'
import { AdminInvoiceRepository } from '../../services/AdminInvoiceRepository'

const confirmSchema = z.object({
  invoice_id: z.string().min(1, 'ID Invoice wajib diisi')
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, r => confirmSchema.safeParse(r))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID Invoice tidak valid.'
    })
  }

  const repo = new AdminInvoiceRepository(event)
  await repo.confirmCustomGmailOrder(body.data.invoice_id)

  return {
    success: true
  }
})
