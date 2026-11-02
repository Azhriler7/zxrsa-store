import { z } from 'zod'
import { ContentRepository } from '../../services/ContentRepository'

const schema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('upsert'),
    id: z.string().optional(),
    customer_email: z.string().email('Format email tidak valid'),
    product_package_name: z.string().min(2, 'Nama paket wajib diisi'),
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(3, 'Ulasan minimal 3 karakter'),
    is_approved: z.boolean()
  }),
  z.object({
    action: z.literal('toggle_approval'),
    id: z.string().min(1),
    is_approved: z.boolean()
  })
])

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, r => schema.safeParse(r))
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: body.error.issues[0]?.message || 'Data tidak valid.' })
  }

  const repo = new ContentRepository(event)
  if (body.data.action === 'toggle_approval') {
    await repo.toggleTestimonialApproval(body.data.id, body.data.is_approved)
    return { success: true }
  }

  await repo.upsertTestimonialAdmin(body.data)
  return { success: true }
})
