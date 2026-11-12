// ============================================================================
// FILE: server/services/ProductStockRepository.ts
// DESKRIPSI: Repository OOP untuk CRUD Produk (Prioritas Urutan Badge di Awal),
//            Paket, & Penyimpanan Stok (Password & Link Opsional).
// ============================================================================

import type { DbProduct, DbProductVariant } from '../types/database'
import { BaseRepository } from './BaseRepository'
import { CryptoService } from './CryptoService'
import { StockParserService } from './StockParserService'

export interface VariantWithStockCount extends DbProductVariant {
  available_stock: number
  sold_stock: number
}

export interface ProductWithVariants extends DbProduct {
  variants: VariantWithStockCount[]
}

export class ProductStockRepository extends BaseRepository {
  public async getAllProductsWithVariants(): Promise<ProductWithVariants[]> {
    // Produk yang memiliki promo_badge otomatis diurutkan paling awal
    const { results: products } = await this.db
      .prepare(
        `SELECT * FROM products
         ORDER BY
           CASE WHEN promo_badge IS NOT NULL AND TRIM(promo_badge) != '' THEN 0 ELSE 1 END ASC,
           updated_at DESC,
           created_at DESC`
      )
      .all<DbProduct>()

    const { results: variants } = await this.db
      .prepare(
        `SELECT 
           pv.*,
           SUM(CASE WHEN s.status = 'available' THEN 1 ELSE 0 END) as available_stock,
           SUM(CASE WHEN s.status = 'sold' THEN 1 ELSE 0 END) as sold_stock
         FROM product_variants pv
         LEFT JOIN account_stocks s ON s.variant_id = pv.id
         GROUP BY pv.id
         ORDER BY pv.price ASC`
      )
      .all<VariantWithStockCount>()

    return (products || []).map(prod => ({
      ...prod,
      variants: (variants || [])
        .filter(v => v.product_id === prod.id)
        .map(v => ({
          ...v,
          available_stock: Number(v.available_stock || 0),
          sold_stock: Number(v.sold_stock || 0)
        }))
    }))
  }

  public async upsertProduct(payload: {
    id?: string
    name: string
    usage_rules?: string
    image_url?: string | null
    promo_badge?: string | null
    is_active: boolean
  }): Promise<string> {
    const productId = payload.id || `prd_${crypto.randomUUID().slice(0, 8)}`
    const activeInt = payload.is_active ? 1 : 0

    const baseSlug = payload.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const autoSlug = `${baseSlug}-${productId.slice(-4)}`

    const defaultRules = payload.usage_rules?.trim() || 'Patuhi aturan pemakaian sesuai paket yang dipilih.'
    const cleanBadge = payload.promo_badge?.trim() || null

    await this.db
      .prepare(
        `INSERT INTO products (id, name, slug, description, usage_rules, image_url, promo_badge, is_active, updated_at)
         VALUES (?1, ?2, ?3, NULL, ?4, ?5, ?6, ?7, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           slug = excluded.slug,
           description = NULL,
           usage_rules = excluded.usage_rules,
           image_url = excluded.image_url,
           promo_badge = excluded.promo_badge,
           is_active = excluded.is_active,
           updated_at = datetime('now')`
      )
      .bind(
        productId,
        payload.name.trim(),
        autoSlug,
        defaultRules,
        payload.image_url || null,
        cleanBadge,
        activeInt
      )
      .run()

    try {
      await this.writeSystemLog('info', 'PRODUCT_CRUD', `Simpan produk: ${payload.name}`, {
        productId
      })
    } catch {
      // Abaikan jika gagal tulis log
    }

    return productId
  }

  public async deleteProduct(productId: string): Promise<void> {
    const stockCheck = await this.db
      .prepare(
        `SELECT COUNT(s.id) as ready_count
         FROM account_stocks s
         JOIN product_variants pv ON pv.id = s.variant_id
         WHERE pv.product_id = ?1 AND s.status = 'available'`
      )
      .bind(productId)
      .first<{ ready_count: number }>()

    const readyStock = Number(stockCheck?.ready_count ?? 0)
    if (readyStock > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Gagal menghapus! Produk ini masih memiliki ${readyStock} stok akun tersedia. Kosongkan stok terlebih dahulu di menu Input Stok.`
      })
    }

    await this.db
      .prepare(`DELETE FROM transactions WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ?1)`)
      .bind(productId)
      .run()

    await this.db
      .prepare(`DELETE FROM account_stocks WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ?1)`)
      .bind(productId)
      .run()

    await this.db.prepare('DELETE FROM product_variants WHERE product_id = ?1').bind(productId).run()
    await this.db.prepare('DELETE FROM products WHERE id = ?1').bind(productId).run()
  }

  public async upsertVariant(payload: {
    id?: string
    product_id: string
    name: string
    duration: string
    description?: string | null
    usage_rules?: string | null
    tutorial_text?: string | null
    price: number
    promo_price?: number | null
    promo_day_of_week?: string | null
    promo_specific_date?: string | null
    promo_start_at?: string | null
    promo_end_at?: string | null
    is_custom_gmail: boolean
    is_active: boolean
  }): Promise<string> {
    const variantId = payload.id || `var_${crypto.randomUUID().slice(0, 8)}`

    await this.db
      .prepare(
        `INSERT INTO product_variants (
           id, product_id, name, duration, description, usage_rules, tutorial_text,
           price, promo_price, promo_day_of_week, promo_specific_date,
           promo_start_at, promo_end_at, is_custom_gmail, is_active, updated_at
         )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           duration = excluded.duration,
           description = excluded.description,
           usage_rules = excluded.usage_rules,
           tutorial_text = excluded.tutorial_text,
           price = excluded.price,
           promo_price = excluded.promo_price,
           promo_day_of_week = excluded.promo_day_of_week,
           promo_specific_date = excluded.promo_specific_date,
           promo_start_at = excluded.promo_start_at,
           promo_end_at = excluded.promo_end_at,
           is_custom_gmail = excluded.is_custom_gmail,
           is_active = excluded.is_active,
           updated_at = datetime('now')`
      )
      .bind(
        variantId,
        payload.product_id,
        payload.name.trim(),
        payload.duration.trim(),
        payload.description?.trim() || null,
        payload.usage_rules?.trim() || null,
        payload.tutorial_text?.trim() || null,
        Math.floor(payload.price),
        payload.promo_price ? Math.floor(payload.promo_price) : null,
        payload.promo_day_of_week || null,
        payload.promo_specific_date || null,
        payload.promo_start_at || null,
        payload.promo_end_at || null,
        payload.is_custom_gmail ? 1 : 0,
        payload.is_active ? 1 : 0
      )
      .run()

    return variantId
  }

  public async deleteVariant(variantId: string): Promise<void> {
    const stockCheck = await this.db
      .prepare(`SELECT COUNT(id) as ready_count FROM account_stocks WHERE variant_id = ?1 AND status = 'available'`)
      .bind(variantId)
      .first<{ ready_count: number }>()

    const readyStock = Number(stockCheck?.ready_count ?? 0)
    if (readyStock > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Paket ini masih memiliki ${readyStock} stok tersedia! Kosongkan stok terlebih dahulu di menu Input Stok sebelum menghapus paket.`
      })
    }

    await this.db.prepare('DELETE FROM transactions WHERE variant_id = ?1').bind(variantId).run()
    await this.db.prepare('DELETE FROM account_stocks WHERE variant_id = ?1').bind(variantId).run()
    await this.db.prepare('DELETE FROM product_variants WHERE id = ?1').bind(variantId).run()
  }

  private async insertSingleEncryptedStock(
    variantId: string,
    encryptedData: string,
    hasLink: boolean
  ): Promise<void> {
    const candidateFormats = Array.from(
      new Set([
        hasLink ? 'three_col' : 'two_col',
        hasLink ? 'three_col_link' : 'two_col',
        'two_col'
      ])
    )

    let lastError: unknown = null
    for (const fmt of candidateFormats) {
      try {
        await this.db
          .prepare(
            `INSERT INTO account_stocks (variant_id, encrypted_account_data, format_type, status)
             VALUES (?1, ?2, ?3, 'available')`
          )
          .bind(variantId, encryptedData, fmt)
          .run()
        return
      } catch (err) {
        lastError = err
      }
    }

    throw createError({
      statusCode: 400,
      statusMessage: `Gagal menyimpan ke tabel account_stocks: ${lastError instanceof Error ? lastError.message : 'Database constraint error'}`
    })
  }

  // --------------------------------------------------------------------------
  // [SECTION: BULK ADD STRUCTURED STOCKS (EMAIL WAJIB, PASSWORD & LINK OPSIONAL)]
  // --------------------------------------------------------------------------
  public async bulkAddStructuredStocks(
    variantId: string,
    items: { email: string, password?: string | null, link?: string | null }[]
  ) {
    const config = useRuntimeConfig(this.event)
    const cryptoService = new CryptoService(config.encryptionKey)

    const variantExists = await this.db
      .prepare('SELECT id FROM product_variants WHERE id = ?1 LIMIT 1')
      .bind(variantId)
      .first<{ id: string }>()

    if (!variantExists) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Paket tujuan tidak ditemukan. Silakan muat ulang halaman dan pilih paket kembali.'
      })
    }

    let insertedCount = 0
    for (const item of items) {
      const cleanEmail = (item.email || '').trim()
      const cleanPass = (item.password || '').trim()
      const cleanLink = (item.link || '').trim()

      // Hanya Email yang wajib diisi; Password dan Link bersifat opsional
      if (!cleanEmail) continue

      const normalizedRawString = cleanLink
        ? `${cleanEmail}|${cleanPass}|${cleanLink}`
        : `${cleanEmail}|${cleanPass}`

      const encryptedData = await cryptoService.encryptAccountData(normalizedRawString)
      await this.insertSingleEncryptedStock(variantId, encryptedData, Boolean(cleanLink))
      insertedCount++
    }

    if (insertedCount === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tidak ada baris akun valid (Email wajib diisi).'
      })
    }

    try {
      await this.writeSystemLog('info', 'STOCK_ADD', `Admin menambahkan ${insertedCount} stok ke paket ${variantId}`)
    } catch {
      // Abaikan jika log gagal
    }

    return {
      insertedCount
    }
  }

  public async bulkAddStocksFromTxt(variantId: string, rawTxtContent: string) {
    const parser = new StockParserService()
    const parsedResult = parser.parseTxtContent(rawTxtContent)

    if (parsedResult.validItems.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tidak ada baris akun valid yang ditemukan dalam file .txt.'
      })
    }

    const structured = parsedResult.validItems.map(v => ({
      email: v.email,
      password: v.password,
      link: v.extraInfoLink
    }))

    const res = await this.bulkAddStructuredStocks(variantId, structured)
    return {
      insertedCount: res.insertedCount,
      invalidLines: parsedResult.invalidLines
    }
  }

  public async getAvailableStocksByVariant(variantId: string): Promise<{
    id: number
    accountLabel: string
    formatType: string
    createdAt: string
  }[]> {
    const config = useRuntimeConfig(this.event)
    const cryptoService = new CryptoService(config.encryptionKey)

    const { results } = await this.db
      .prepare(
        `SELECT id, encrypted_account_data, format_type, created_at
         FROM account_stocks
         WHERE variant_id = ?1 AND status = 'available'
         ORDER BY id ASC`
      )
      .bind(variantId)
      .all<{
      id: number
      encrypted_account_data: string
      format_type: string
      created_at: string
    }>()

    const items: {
      id: number
      accountLabel: string
      formatType: string
      createdAt: string
    }[] = []

    for (const row of results || []) {
      let decryptedLabel: string
      try {
        decryptedLabel = await cryptoService.decryptAccountData(row.encrypted_account_data)
      } catch {
        decryptedLabel = `Stok Terenkripsi #${row.id}`
      }

      items.push({
        id: row.id,
        accountLabel: decryptedLabel,
        formatType: row.format_type,
        createdAt: row.created_at
      })
    }

    return items
  }

  public async deleteSpecificStockIds(variantId: string, stockIds: number[]): Promise<number> {
    if (!stockIds.length) return 0

    let deletedCount = 0
    for (const stockId of stockIds) {
      await this.db
        .prepare(`DELETE FROM account_stocks WHERE id = ?1 AND variant_id = ?2 AND status = 'available'`)
        .bind(stockId, variantId)
        .run()
      deletedCount++
    }

    try {
      await this.writeSystemLog(
        'warn',
        'STOCK_REDUCE',
        `Admin mengeluarkan ${deletedCount} stok terpilih dari paket ${variantId}`,
        { variantId, deletedCount, stockIds }
      )
    } catch {
      // Abaikan jika log gagal
    }

    return deletedCount
  }

  public async reduceAvailableStock(variantId: string, amountToReduce: number): Promise<number> {
    await this.db
      .prepare(
        `DELETE FROM account_stocks
         WHERE id IN (
           SELECT id FROM account_stocks
           WHERE variant_id = ?1 AND status = 'available'
           ORDER BY id DESC
           LIMIT ?2
         )`
      )
      .bind(variantId, Math.floor(amountToReduce))
      .run()

    return amountToReduce
  }
}
