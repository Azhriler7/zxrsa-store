// ============================================================================
// FILE: server/api/admin/stocks.post.ts
// DESKRIPSI: Endpoint API Tambah Stok Massal (.txt) & Kurangi Stok Akun
// ============================================================================

import { z } from 'zod'
import { ProductStockRepository } from '../../services/ProductStockRepository'

const stockActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add_txt'),
    variant_id: z.string().min(1, 'Pilih paket terlebih dahulu'),
    raw_txt_content: z.string().min(3, 'Isi file .txt tidak boleh kosong')
  }),
  z.object({
    action: z.literal('reduce'),
    variant_id: z.string().min(1, 'Pilih paket terlebih dahulu'),
    amount: z.number().int().positive('Jumlah pengurangan minimal 1')
  })
])

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, r => stockActionSchema.safeParse(r))

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: body.error.issues[0]?.message || 'Input manajemen stok tidak valid.'
    })
  }

  const repo = new ProductStockRepository(event)

  if (body.data.action === 'add_txt') {
    const result = await repo.bulkAddStocksFromTxt(
      body.data.variant_id,
      body.data.raw_txt_content
    )
    return {
      success: true,
      insertedCount: result.insertedCount,
      reducedCount: 0,
      invalidLines: result.invalidLines
    }
  }

  const reduced = await repo.reduceAvailableStock(body.data.variant_id, body.data.amount)
  return {
    success: true,
    insertedCount: 0,
    reducedCount: reduced,
    invalidLines: []
  }
})
