// ============================================================================
// FILE: server/api/store/catalog.get.ts
// DESKRIPSI: Endpoint GET Katalog Produk Aplikasi Premium & Varian Paket Aktif
// ============================================================================

import { StorefrontRepository } from '../../services/StorefrontRepository'

export default defineEventHandler(async (event) => {
  const repo = new StorefrontRepository(event)
  const catalog = await repo.getPublicCatalog()

  return {
    catalog
  }
})
