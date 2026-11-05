// ============================================================================
// FILE: server/api/admin/variants.post.ts
// DESKRIPSI: Endpoint POST Tambah / Update Varian Paket (Dengan Deskripsi,
//            Aturan / usage_rules, dan Tutorial / tutorial_text).
// ============================================================================

import { z } from 'zod'
import { ProductStockRepository } from '../../services/ProductStockRepository'

const upsertVariantSchema = z.object({
  id: z.string().optional(),
  product_id: z.string().min(1, 'Product ID wajib diisi'),
  name: z.string().min(2, 'Nama paket minimal 2 karakter'),
  duration: z.string().min(2, 'Durasi wajib diisi'),
  description: z.string().nullable().optional(),
  usage_rules: z.string().nullable().optional(),
  tutorial_text: z.string().nullable().optional(),
  price: z.coerce.number().int().positive('Harga normal harus lebih dari Rp 0'),
  promo_price: z.coerce.number().int().positive().nullable().optional(),
  promo_day_of_week: z.string().nullable().optional(),
  promo_specific_date: z.string().nullable().optional(),
  promo_start_at: z.string().nullable().optional(),
  promo_end_at: z.string().nullable().optional(),
  is_custom_gmail: z.boolean().default(false),
  is_active: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, r => upsertVariantSchema.safeParse(r))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: body.error.issues[0]?.message || 'Input varian paket tidak valid.'
    })
  }

  const repo = new ProductStockRepository(event)
  const id = await repo.upsertVariant(body.data)

  return {
    success: true,
    id
  }
})
