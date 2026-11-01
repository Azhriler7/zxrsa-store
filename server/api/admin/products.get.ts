// ============================================================================
// FILE: server/api/admin/products.get.ts
// DESKRIPSI: Endpoint GET Daftar Produk & Varian Paket Beserta Jumlah Stok
// ============================================================================

import { ProductStockRepository } from '../../services/ProductStockRepository'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const repo = new ProductStockRepository(event)
  const products = await repo.getAllProductsWithVariants()

  return {
    products
  }
})
