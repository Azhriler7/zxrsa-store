import { ContentRepository } from '../../services/ContentRepository'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const repo = new ContentRepository(event)
  const faqs = await repo.getAllFaqsAdmin()
  return { faqs }
})
