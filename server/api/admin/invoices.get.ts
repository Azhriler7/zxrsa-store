// ============================================================================
// FILE: server/api/admin/invoices.get.ts
// DESKRIPSI: Endpoint GET Daftar Seluruh Invoice & History Pembelian
// ============================================================================

import { AdminInvoiceRepository } from '../../services/AdminInvoiceRepository'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const query = getQuery(event)
  const statusFilter = query.status ? String(query.status) : 'all'

  const repo = new AdminInvoiceRepository(event)
  const invoices = await repo.getAllInvoices(statusFilter)

  return {
    invoices
  }
})
