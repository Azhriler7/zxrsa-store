// ============================================================================
// FILE: server/api/admin/invoices-status.post.ts
// DESKRIPSI: Endpoint POST Ubah Status Invoice (lunas, pending, expired, dll)
// ============================================================================

import { z } from 'zod'
import { AdminInvoiceRepository } from '../../services/AdminInvoiceRepository'

const updateStatusSchema = z.object({
  invoice_id: z.string().min(1, 'ID Invoice wajib diisi'),
  status: z.enum(['lunas', 'pending', 'expired', 'dibatalkan', 'failed'])
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, r => updateStatusSchema.safeParse(r))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: body.error.issues[0]?.message || 'Status invoice tidak valid.'
    })
  }

  const repo = new AdminInvoiceRepository(event)
  await repo.updateInvoiceStatus(body.data.invoice_id, body.data.status)

  return {
    success: true
  }
})
