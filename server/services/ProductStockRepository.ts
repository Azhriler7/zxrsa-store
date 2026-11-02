// ============================================================================
// FILE: server/services/ProductStockRepository.ts
// DESKRIPSI: Repository OOP untuk CRUD Produk (Auto-Slug), Paket/Promo,
//            Proteksi Hapus Saat Stok Masih Ada, & Enkripsi Stok .txt.
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
    const { results: products } = await this.db
      .prepare('SELECT * FROM products ORDER BY created_at DESC')
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

  // --------------------------------------------------------------------------
  // [SECTION: CREATE OR UPDATE PRODUCT (AUTO-GENERATE SLUG DARI NAMA)]
  // --------------------------------------------------------------------------
  public async upsertProduct(payload: {
    id?: string
    name: string
    description?: string | null
    usage_rules: string
    image_url?: string | null
    promo_badge?: string | null
    is_active: boolean
  }): Promise<string> {
    const productId = payload.id || `prd_${crypto.randomUUID().slice(0, 8)}`
    const activeInt = payload.is_active ? 1 : 0

    // Auto-generate slug bersih dari nama aplikasi + akhiran ID singkat agar tidak pernah bentrok
    const baseSlug = payload.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const autoSlug = `${baseSlug}-${productId.slice(-4)}`

    await this.db
      .prepare(
        `INSERT INTO products (id, name, slug, description, usage_rules, image_url, promo_badge, is_active, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           slug = excluded.slug,
           description = excluded.description,
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
        payload.description || null,
        payload.usage_rules.trim(),
        payload.image_url || null,
        payload.promo_badge || null,
        activeInt
      )
      .run()

    await this.writeSystemLog('info', 'PRODUCT_CRUD', `Simpan produk: ${payload.name}`, {
      productId
    })

    return productId
  }

  // --------------------------------------------------------------------------
  // [SECTION: DELETE PRODUCT DENGAN PROTEKSI STOK & PEMBERSIHAN RELASI]
  // --------------------------------------------------------------------------
  public async deleteProduct(productId: string): Promise<void> {
    // 1. Cek apakah masih ada stok 'available' di salah satu paket produk ini
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
        statusMessage: `Gagal menghapus! Produk ini masih memiliki ${readyStock} stok akun tersedia. Kosongkan stok terlebih dahulu di menu Input Stok (.txt).`
      })
    }

    // 2. Jika stok available sudah 0, bersihkan relasi di transactions & account_stocks agar tidak terkena Foreign Key Error
    await this.db
      .prepare(
        `DELETE FROM transactions
         WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ?1)`
      )
      .bind(productId)
      .run()

    await this.db
      .prepare(
        `DELETE FROM account_stocks
         WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ?1)`
      )
      .bind(productId)
      .run()

    await this.db
      .prepare('DELETE FROM product_variants WHERE product_id = ?1')
      .bind(productId)
      .run()

    await this.db
      .prepare('DELETE FROM products WHERE id = ?1')
      .bind(productId)
      .run()

    await this.writeSystemLog('warn', 'PRODUCT_CRUD', `Hapus produk ID: ${productId}`)
  }

  // --------------------------------------------------------------------------
  // [SECTION: CREATE OR UPDATE VARIANT]
  // --------------------------------------------------------------------------
  public async upsertVariant(payload: {
    id?: string
    product_id: string
    name: string
    duration: string
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
           id, product_id, name, duration, price, promo_price,
           promo_day_of_week, promo_specific_date, promo_start_at, promo_end_at,
           is_custom_gmail, is_active, updated_at
         )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           duration = excluded.duration,
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

  // --------------------------------------------------------------------------
  // [SECTION: DELETE VARIANT DENGAN PROTEKSI STOK]
  // --------------------------------------------------------------------------
  public async deleteVariant(variantId: string): Promise<void> {
    const stockCheck = await this.db
      .prepare(
        `SELECT COUNT(id) as ready_count
         FROM account_stocks
         WHERE variant_id = ?1 AND status = 'available'`
      )
      .bind(variantId)
      .first<{ ready_count: number }>()

    const readyStock = Number(stockCheck?.ready_count ?? 0)
    if (readyStock > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Paket ini masih memiliki ${readyStock} stok tersedia! Kosongkan stok terlebih dahulu di menu Input Stok (.txt) sebelum menghapus paket.`
      })
    }

    await this.db.prepare('DELETE FROM transactions WHERE variant_id = ?1').bind(variantId).run()
    await this.db.prepare('DELETE FROM account_stocks WHERE variant_id = ?1').bind(variantId).run()
    await this.db.prepare('DELETE FROM product_variants WHERE id = ?1').bind(variantId).run()

    await this.writeSystemLog('warn', 'VARIANT_CRUD', `Hapus varian paket ID: ${variantId}`)
  }

  public async bulkAddStocksFromTxt(variantId: string, rawTxtContent: string) {
    const config = useRuntimeConfig(this.event)
    const cryptoService = new CryptoService(config.encryptionKey)
    const parser = new StockParserService()

    const parsedResult = parser.parseTxtContent(rawTxtContent)

    if (parsedResult.validItems.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tidak ada baris akun valid yang ditemukan dalam teks/file .txt.'
      })
    }

    let insertedCount = 0
    for (const item of parsedResult.validItems) {
      const encryptedData = await cryptoService.encryptAccountData(item.normalizedRawString)

      await this.db
        .prepare(
          `INSERT INTO account_stocks (variant_id, encrypted_account_data, format_type, status)
           VALUES (?1, ?2, ?3, 'available')`
        )
        .bind(variantId, encryptedData, item.formatType)
        .run()

      insertedCount++
    }

    return {
      insertedCount,
      invalidLines: parsedResult.invalidLines
    }
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
