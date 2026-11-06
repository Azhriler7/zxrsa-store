// ============================================================================
// FILE: server/api/admin/custom-gmail-confirm.post.ts
// DESKRIPSI: Endpoint POST Konfirmasi Pesanan Custom Gmail Selesai & Kirim Email
// ============================================================================

import { AdminInvoiceRepository } from '../../services/AdminInvoiceRepository'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const rawBody: Record<string, unknown> = (
    await readBody<Record<string, unknown>>(event).catch((): Record<string, unknown> => ({}))
  ) || {}

  const query = getQuery(event)

  const targetTxId = String(
    rawBody['transaction_id']
    || rawBody['id']
    || rawBody['transactionId']
    || rawBody['invoice_id']
    || rawBody['invoiceId']
    || query.id
    || query.transaction_id
    || ''
  ).trim()

  if (!targetTxId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID Transaksi tidak ditemukan dalam request.'
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
