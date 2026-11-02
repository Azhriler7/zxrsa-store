// ============================================================================
// FILE: server/api/store/catalog.get.ts
// DESKRIPSI: Endpoint GET Katalog Produk, Testimoni Approved, & FAQ Aktif
// ============================================================================

import { StorefrontRepository } from '../../services/StorefrontRepository'
import { ContentRepository } from '../../services/ContentRepository'

export default defineEventHandler(async (event) => {
  const storeRepo = new StorefrontRepository(event)
  const contentRepo = new ContentRepository(event)

  const [catalog, testimonials, faqs] = await Promise.all([
    storeRepo.getPublicCatalog(),
    contentRepo.getApprovedTestimonials(),
    contentRepo.getActiveFaqs()
  ])

  return {
    catalog,
    testimonials,
    faqs
  }
})
