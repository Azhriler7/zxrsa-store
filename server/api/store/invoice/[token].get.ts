// ============================================================================
// FILE: server/api/store/invoice/[token].get.ts
// DESKRIPSI: Endpoint GET Detail Invoice Berdasarkan Token Kriptografi URL
// ============================================================================

import { StorefrontRepository } from '../../../services/StorefrontRepository'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token || token.length < 20) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token invoice tidak valid.'
    })
  }

  const repo = new StorefrontRepository(event)
  const invoice = await repo.getInvoiceByToken(token)

  return {
    invoice
  }
})
