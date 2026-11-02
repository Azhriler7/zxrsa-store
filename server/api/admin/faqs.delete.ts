import { ContentRepository } from '../../services/ContentRepository'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = String(getQuery(event).id || '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID FAQ wajib diisi' })

  const repo = new ContentRepository(event)
  await repo.deleteFaq(id)
  return { success: true }
})
