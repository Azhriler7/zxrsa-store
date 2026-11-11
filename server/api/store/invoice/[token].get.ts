// ============================================================================
// FILE: server/api/store/invoice/[token].get.ts
// DESKRIPSI: Endpoint GET Detail Invoice Real-time (No-Cache Header agar
//            Perubahan Status ke LUNAS Terbaca Instan).
// ============================================================================

import { StorefrontRepository } from '../../../services/StorefrontRepository'

export default defineEventHandler(async (event) => {
  // Paksa browser & CDN tidak pernah menyimpan cache status invoice
  setResponseHeaders(event, {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  })

  const token = getRouterParam(event, 'token')
  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Token invoice wajib disertakan.'
    })
  }

  const repo = new StorefrontRepository(event)
  const invoice = await repo.getInvoiceByToken(token)

  return {
    invoice
  }
})
