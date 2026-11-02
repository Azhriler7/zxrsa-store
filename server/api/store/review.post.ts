// ============================================================================
// FILE: server/api/store/review.post.ts
// DESKRIPSI: Endpoint POST Pembeli Kirim Rating Bintang & Ulasan Setelah Lunas
// ============================================================================

import { z } from 'zod'
import { ContentRepository } from '../../services/ContentRepository'

const reviewSchema = z.object({
  invoice_token: z.string().min(20, 'Token invoice tidak valid'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5, 'Ulasan minimal 5 karakter').max(300, 'Ulasan maksimal 300 karakter')
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, r => reviewSchema.safeParse(r))
  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: body.error.issues[0]?.message || 'Ulasan tidak valid.'
    })
  }

  const repo = new ContentRepository(event)
  await repo.submitCustomerReview({
    invoiceToken: body.data.invoice_token,
    rating: body.data.rating,
    comment: body.data.comment
  })

  return {
    success: true
  }
})
