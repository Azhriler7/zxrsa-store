// ============================================================================
// FILE: server/api/admin/custom-gmail.get.ts
// DESKRIPSI: Endpoint GET Daftar Antrean Pembelian Paket Custom Gmail
// ============================================================================

import { AdminInvoiceRepository } from '../../services/AdminInvoiceRepository'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const repo = new AdminInvoiceRepository(event)
  const queue = await repo.getCustomGmailQueue()

  return {
    queue
  }
})
