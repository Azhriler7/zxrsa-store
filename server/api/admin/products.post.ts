// ============================================================================
// FILE: server/api/admin/products.post.ts
// DESKRIPSI: Endpoint POST Tambah / Update Produk Aplikasi
// ============================================================================

import { z } from 'zod'
import { ProductStockRepository } from '../../services/ProductStockRepository'

const upsertProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'Nama produk minimal 2 karakter'),
  usage_rules: z.string().optional(),
  image_url: z.string().nullable().optional(),
  promo_badge: z.string().nullable().optional(),
  is_active: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, r => upsertProductSchema.safeParse(r))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: body.error.issues[0]?.message || 'Input produk tidak valid.'
    })
  }

  const repo = new ProductStockRepository(event)
  const id = await repo.upsertProduct(body.data)

  return {
    success: true,
    id
  }
})
