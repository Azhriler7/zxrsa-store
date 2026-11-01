// ============================================================================
// FILE: server/services/ProductStockRepository.ts
// DESKRIPSI: Repository OOP untuk CRUD Produk, Paket/Promo, & Manajemen Stok
//            Terenkripsi AES-256-GCM dari file .txt.
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
  // --------------------------------------------------------------------------
  // [SECTION: GET ALL PRODUCTS & VARIANTS WITH STOCK COUNTS]
  // Mengambil daftar aplikasi premium beserta paket dan jumlah stok ready
  // --------------------------------------------------------------------------
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

    return products.map(prod => ({
      ...prod,
      variants: variants
        .filter(v => v.product_id === prod.id)
        .map(v => ({
          ...v,
          available_stock: Number(v.available_stock || 0),
          sold_stock: Number(v.sold_stock || 0)
        }))
    }))
  }

  // --------------------------------------------------------------------------
  // [SECTION: CREATE OR UPDATE PRODUCT (CRUD PRODUK & ATURAN PAKAI)]
  // --------------------------------------------------------------------------
  public async upsertProduct(payload: {
    id?: string
    name: string
    slug: string
    description?: string | null
    usage_rules: string
    image_url?: string | null
    promo_badge?: string | null
    is_active: boolean
  }): Promise<string> {
    const productId = payload.id || `prd_${crypto.randomUUID().slice(0, 8)}`
    const activeInt = payload.is_active ? 1 : 0

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
        payload.slug.trim().toLowerCase(),
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
  // [SECTION: DELETE PRODUCT]
  // --------------------------------------------------------------------------
  public async deleteProduct(productId: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM products WHERE id = ?1')
      .bind(productId)
      .run()

    await this.writeSystemLog('warn', 'PRODUCT_CRUD', `Hapus produk ID: ${productId}`)
  }

  // --------------------------------------------------------------------------
  // [SECTION: CREATE OR UPDATE VARIANT (CRUD PAKET & WAKTU PROMO)]
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

    await this.writeSystemLog('info', 'VARIANT_CRUD', `Simpan paket: ${payload.name}`, {
      variantId,
      price: payload.price,
      promoPrice: payload.promo_price
    })

    return variantId
  }

  // --------------------------------------------------------------------------
  // [SECTION: DELETE VARIANT]
  // --------------------------------------------------------------------------
  public async deleteVariant(variantId: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM product_variants WHERE id = ?1')
      .bind(variantId)
      .run()

    await this.writeSystemLog('warn', 'VARIANT_CRUD', `Hapus varian paket ID: ${variantId}`)
  }

  // --------------------------------------------------------------------------
  // [SECTION: BULK UPLOAD & ENCRYPT STOCKS FROM .TXT]
  // Membaca banyak akun dari teks .txt, memisahkan dengan Polymorphic Parser,
  // lalu mengenkripsi masing-masing akun dengan AES-256-GCM sebelum masuk D1.
  // --------------------------------------------------------------------------
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

    await this.writeSystemLog(
      'info',
      'STOCK_UPLOAD',
      `Berhasil menambahkan ${insertedCount} stok akun terenkripsi ke paket ${variantId}`,
      {
        variantId,
        insertedCount,
        rejectedLinesCount: parsedResult.invalidLines.length
      }
    )

    return {
      insertedCount,
      invalidLines: parsedResult.invalidLines
    }
  }

  // --------------------------------------------------------------------------
  // [SECTION: REDUCE / CLEAR AVAILABLE STOCKS]
  // Mengurangi jumlah stok 'available' pada varian paket tertentu
  // --------------------------------------------------------------------------
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

    await this.writeSystemLog(
      'warn',
      'STOCK_REDUCE',
      `Mengurangi maksimal ${amountToReduce} stok available pada paket ${variantId}`,
      { variantId, amountToReduce }
    )

    return amountToReduce
  }
}
