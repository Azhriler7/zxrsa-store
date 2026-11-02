import { z } from 'zod'
import { ContentRepository } from '../../services/ContentRepository'

const faqSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(5, 'Pertanyaan minimal 5 karakter'),
  answer: z.string().min(5, 'Jawaban minimal 5 karakter'),
  sort_order: z.coerce.number().int().default(1),
  is_active: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, r => faqSchema.safeParse(r))
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: body.error.issues[0]?.message || 'Input FAQ tidak valid.' })
  }

  const repo = new ContentRepository(event)
  await repo.upsertFaqAdmin(body.data)
  return { success: true }
})
