import { ContentRepository } from '../../services/ContentRepository'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = String(getQuery(event).id || '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID wajib diisi' })

  const repo = new ContentRepository(event)
  await repo.deleteTestimonial(id)
  return { success: true }
})
