// ============================================================================
// FILE: server/api/admin/products.delete.ts
// DESKRIPSI: Endpoint DELETE Hapus Produk Aplikasi Premium
// ============================================================================

import { ProductStockRepository } from '../../services/ProductStockRepository'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const query = getQuery(event)
  const id = String(query.id || '')

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID produk wajib disertakan.' })
  }

  const repo = new ProductStockRepository(event)
  await repo.deleteProduct(id)

  return {
    success: true
  }
})
