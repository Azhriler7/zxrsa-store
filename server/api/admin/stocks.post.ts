// ============================================================================
// FILE: server/api/admin/stocks.post.ts
// DESKRIPSI: Endpoint API Tambah Stok (Email Wajib, Password & Link Opsional)
//            & Keluarkan Stok Terpilih.
// ============================================================================

import { z } from 'zod'
import { ProductStockRepository } from '../../services/ProductStockRepository'

const stockActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('add_structured'),
    variant_id: z.string().min(1, 'Pilih paket terlebih dahulu'),
    items: z
      .array(
        z.object({
          email: z.string().trim().min(3, 'Email wajib diisi'),
          password: z.string().trim().nullable().optional(),
          link: z.string().trim().nullable().optional()
        })
      )
      .min(1, 'Minimal harus ada 1 baris stok akun')
  }),
  z.object({
    action: z.literal('add_txt'),
    variant_id: z.string().min(1, 'Pilih paket terlebih dahulu'),
    raw_txt_content: z.string().min(3, 'Isi file .txt tidak boleh kosong')
  }),
  z.object({
    action: z.literal('reduce_selected'),
    variant_id: z.string().min(1, 'Pilih paket terlebih dahulu'),
    stock_ids: z.array(z.number().int().positive()).min(1, 'Pilih minimal 1 akun untuk dikeluarkan')
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

  if (body.data.action === 'add_structured') {
    const result = await repo.bulkAddStructuredStocks(body.data.variant_id, body.data.items)
    return {
      success: true,
      insertedCount: result.insertedCount,
      reducedCount: 0,
      invalidLines: []
    }
  }

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

  const reduced = await repo.deleteSpecificStockIds(
    body.data.variant_id,
    body.data.stock_ids
  )

  return {
    success: true,
    insertedCount: 0,
    reducedCount: reduced,
    invalidLines: []
  }
})
