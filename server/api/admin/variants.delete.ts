// ============================================================================
// FILE: server/api/admin/variants.delete.ts
// DESKRIPSI: Endpoint DELETE Hapus Varian Paket
// ============================================================================

import { ProductStockRepository } from '../../services/ProductStockRepository'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const query = getQuery(event)
  const id = String(query.id || '')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID paket wajib disertakan.' })
  }

  const repo = new ProductStockRepository(event)
  await repo.deleteVariant(id)

  return {
    success: true
  }
})
