// ============================================================================
// FILE: server/api/admin/stocks-list.get.ts
// DESKRIPSI: Endpoint GET Daftar Akun Available per Paket untuk Pop-Up Kurangi Stok
// ============================================================================

import { ProductStockRepository } from '../../services/ProductStockRepository'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const variantId = String(getQuery(event).variant_id || '')

  if (!variantId) {
    return { stocks: [] }
  }

  const repo = new ProductStockRepository(event)
  const stocks = await repo.getAvailableStocksByVariant(variantId)

  return {
    stocks
  }
})
