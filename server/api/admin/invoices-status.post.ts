// ============================================================================
// FILE: server/api/admin/invoices-status.post.ts
// DESKRIPSI: Endpoint POST Update Status Invoice, Kirim Ulang Email, & Hapus
// ============================================================================

import { AdminInvoiceRepository } from '../../services/AdminInvoiceRepository'
import type { TransactionStatus } from '../../types/database'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const rawBody: Record<string, unknown> = (
    await readBody<Record<string, unknown>>(event).catch((): Record<string, unknown> => ({}))
  ) || {}

  const txId = String(
    rawBody['transaction_id']
    || rawBody['id']
    || rawBody['invoice_id']
    || ''
  ).trim()

  const action = String(rawBody['action'] || 'update_status').trim()

  if (!txId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID Transaksi wajib disertakan.'
    })
  }

  const repo = new AdminInvoiceRepository(event)

  if (action === 'delete') {
    await repo.deleteInvoice(txId)
    return { success: true }
  }

  if (action === 'resend_email') {
    await repo.resendInvoiceEmailById(txId)
    return { success: true }
  }

  const newStatus = String(rawBody['status'] || 'pending').trim() as TransactionStatus
  await repo.updateInvoiceStatus(txId, newStatus)

  return {
    success: true
  }
})
