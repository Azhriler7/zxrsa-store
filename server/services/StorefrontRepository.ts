// ============================================================================
// FILE: server/services/StorefrontRepository.ts
// DESKRIPSI: Repository OOP untuk Katalog Publik (dengan Icon Produk & Jadwal
//            Promo Multi-Mode), Atomic Stock Locking, & Dynamic Invoice.
// ============================================================================

import type { DbProduct, DbProductVariant, TransactionStatus } from '../types/database'
import { BaseRepository } from './BaseRepository'
import { CryptoService } from './CryptoService'
import { QrisDynamicService } from './QrisDynamicService'
import { StockParserService } from './StockParserService'
import { AdminInvoiceRepository } from './AdminInvoiceRepository'
import type { AdminTransactionRow } from './AdminInvoiceRepository'

export interface PublicVariantItem {
  id: string
  product_id: string
  name: string
  duration: string
  original_price: number
  effective_price: number
  is_promo_active: boolean
  is_custom_gmail: boolean
  available_stock: number
}

export interface PublicProductCatalog {
  id: string
  name: string
  slug: string
  description: string | null
  usage_rules: string
  image_url: string | null
  promo_badge: string | null
  variants: PublicVariantItem[]
}

export class StorefrontRepository extends BaseRepository {
  public async releaseExpiredLocks(): Promise<void> {
    await this.db
      .prepare(
        `UPDATE account_stocks
         SET status = 'available', reserved_until = NULL
         WHERE status = 'reserved'
           AND reserved_until IS NOT NULL
           AND datetime(reserved_until) <= datetime('now')`
      )
      .run()

    await this.db
      .prepare(
        `UPDATE transactions
         SET status = 'expired', updated_at = datetime('now')
         WHERE status = 'pending'
           AND datetime(expires_at) <= datetime('now')`
      )
      .run()
  }

  // --------------------------------------------------------------------------
  // [SECTION: CEK JADWAL PROMO (HARIAN BERULANG / TANGGAL SPESIFIK / RENTANG)]
  // Menggunakan zona waktu WIB (UTC+7) agar akurat dengan waktu Indonesia
  // --------------------------------------------------------------------------
  private isPromoCurrentlyActive(variant: DbProductVariant): boolean {
    if (!variant.promo_price || variant.promo_price <= 0 || variant.promo_price >= variant.price) {
      return false
    }

    const nowUtc = new Date()
    // Konversi ke waktu WIB (UTC+7) untuk pengecekan hari & tanggal lokal Indonesia
    const wibDate = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000)
    const currentDayIndex = String(wibDate.getUTCDay()) // '0' (Minggu) s/d '6' (Sabtu)
    const currentYmd = wibDate.toISOString().slice(0, 10) // 'YYYY-MM-DD'
    const currentMonthDay = currentYmd.slice(5, 10) // 'MM-DD' (misal '08-01' untuk 1 Agustus)

    const hasRecurringDayRule = Boolean(variant.promo_day_of_week && variant.promo_day_of_week.trim() !== '')
    const hasSpecificDateRule = Boolean(variant.promo_specific_date && variant.promo_specific_date.trim() !== '')
    const hasRangeRule = Boolean(variant.promo_start_at || variant.promo_end_at)

    // Jika Admin menyalakan Harga Promo tanpa membatasi hari/tanggal, berarti promo menyala terus
    if (!hasRecurringDayRule && !hasSpecificDateRule && !hasRangeRule) {
      return true
    }

    // Jika ada salah satu jadwal yang dinyalakan, cek apakah hari/jam sekarang memenuhi salah satu jadwal yang aktif:
    let matchedAnyActiveSchedule = false

    // 1. Cek Promo Harian Berulang (misal '5' untuk Jumat, atau '0,5,6' untuk Minggu, Jumat, Sabtu)
    if (hasRecurringDayRule) {
      const activeDays = (variant.promo_day_of_week || '').split(',').map(d => d.trim())
      if (activeDays.includes(currentDayIndex)) {
        matchedAnyActiveSchedule = true
      }
    }

    // 2. Cek Promo Tanggal Spesifik (bisa format 'YYYY-MM-DD' atau 'MM-DD' seperti 1 Agustus)
    if (hasSpecificDateRule) {
      const targetDate = (variant.promo_specific_date || '').trim()
      if (targetDate === currentYmd || targetDate.slice(-5) === currentMonthDay) {
        matchedAnyActiveSchedule = true
      }
    }

    // 3. Cek Promo Rentang Tanggal/Waktu (Start s/d End)
    if (hasRangeRule) {
      const afterStart = variant.promo_start_at ? nowUtc >= new Date(variant.promo_start_at) : true
      const beforeEnd = variant.promo_end_at ? nowUtc <= new Date(variant.promo_end_at) : true
      if (afterStart && beforeEnd) {
        matchedAnyActiveSchedule = true
      }
    }

    return matchedAnyActiveSchedule
  }

  public async getPublicCatalog(): Promise<PublicProductCatalog[]> {
    await this.releaseExpiredLocks()

    const { results: products } = await this.db
      .prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC')
      .all<DbProduct>()

    const { results: variants } = await this.db
      .prepare(
        `SELECT 
           pv.*,
           SUM(CASE WHEN s.status = 'available' THEN 1 ELSE 0 END) as available_stock
         FROM product_variants pv
         LEFT JOIN account_stocks s ON s.variant_id = pv.id
         WHERE pv.is_active = 1
         GROUP BY pv.id
         ORDER BY pv.price ASC`
      )
      .all<DbProductVariant & { available_stock: number }>()

    return (products || []).map(prod => ({
      id: prod.id,
      name: prod.name,
      slug: prod.slug,
      description: prod.description,
      usage_rules: prod.usage_rules,
      image_url: prod.image_url,
      promo_badge: prod.promo_badge,
      variants: (variants || [])
        .filter(v => v.product_id === prod.id)
        .map((v) => {
          const promoActive = this.isPromoCurrentlyActive(v)
          return {
            id: v.id,
            product_id: v.product_id,
            name: v.name,
            duration: v.duration,
            original_price: v.price,
            effective_price: promoActive && v.promo_price ? v.promo_price : v.price,
            is_promo_active: promoActive,
            is_custom_gmail: v.is_custom_gmail === 1,
            available_stock: v.is_custom_gmail === 1 ? 999 : Number(v.available_stock || 0)
          }
        })
    }))
  }

  public async createCheckoutInvoice(payload: {
    variantId: string
    customerEmail: string
    customGmailAccount?: string | null
  }): Promise<{ invoiceId: string, invoiceToken: string }> {
    await this.releaseExpiredLocks()

    const variant = await this.db
      .prepare(
        `SELECT pv.*, p.name as product_name
         FROM product_variants pv
         JOIN products p ON p.id = pv.product_id
         WHERE pv.id = ?1 AND pv.is_active = 1 AND p.is_active = 1
         LIMIT 1`
      )
      .bind(payload.variantId)
      .first<DbProductVariant & { product_name: string }>()

    if (!variant) {
      throw createError({ statusCode: 404, statusMessage: 'Paket yang dipilih tidak tersedia.' })
    }

    const isCustomGmail = variant.is_custom_gmail === 1
    if (isCustomGmail && !payload.customGmailAccount) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Untuk paket Custom Gmail, Anda wajib memasukkan alamat Gmail yang ingin dijadikan premium.'
      })
    }

    const expiresDate = new Date(Date.now() + 10 * 60 * 1000)
    const expiresIso = expiresDate.toISOString()

    let lockedStockId: number | null = null

    if (!isCustomGmail) {
      const lockedStock = await this.db
        .prepare(
          `UPDATE account_stocks
           SET status = 'reserved',
               reserved_until = ?1
           WHERE id = (
             SELECT id FROM account_stocks
             WHERE variant_id = ?2 AND status = 'available'
             ORDER BY id ASC
             LIMIT 1
           )
           RETURNING id`
        )
        .bind(expiresIso, variant.id)
        .first<{ id: number }>()

      if (!lockedStock) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Maaf, stok untuk paket ini baru saja habis atau sedang dibayar pembeli lain. Silakan coba beberapa saat lagi.'
        })
      }

      lockedStockId = lockedStock.id
    }

    const promoActive = this.isPromoCurrentlyActive(variant)
    const baseAmount = promoActive && variant.promo_price ? variant.promo_price : variant.price
    const uniqueCode = QrisDynamicService.generateUniqueCode(1, 299)
    const totalAmount = baseAmount + uniqueCode

    const config = useRuntimeConfig(this.event)
    let qrisDynamicString = `00020101021226580014ID.CO.QRIS.WWW01189360091431234567890215ID10200211123450303UMI51440014ID.CO.QRIS.WWW0215ID10200211123450303UMI52045499530336054${totalAmount.toString().length.toString().padStart(2, '0')}${totalAmount}5802ID5911ZXRSA STORE6007JAKARTA6304ABCD`

    if (config.qrisStaticString && config.qrisStaticString.includes('5802ID')) {
      const qrisService = new QrisDynamicService(config.qrisStaticString)
      qrisDynamicString = qrisService.generateDynamicString(totalAmount)
    }

    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomShort = crypto.randomUUID().slice(0, 6).toUpperCase()
    const invoiceId = `INV-${datePart}-${randomShort}`
    const invoiceToken = CryptoService.generateInvoiceToken()

    await this.db
      .prepare(
        `INSERT INTO transactions (
           id, invoice_token, customer_email, custom_gmail_account,
           variant_id, account_stock_id, base_amount, unique_code,
           total_amount, status, custom_gmail_status, qris_dynamic_string, expires_at
         )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'pending', ?10, ?11, ?12)`
      )
      .bind(
        invoiceId,
        invoiceToken,
        payload.customerEmail.trim().toLowerCase(),
        payload.customGmailAccount ? payload.customGmailAccount.trim().toLowerCase() : null,
        variant.id,
        lockedStockId,
        baseAmount,
        uniqueCode,
        totalAmount,
        isCustomGmail ? 'waiting_admin' : 'not_applicable',
        qrisDynamicString,
        expiresIso
      )
      .run()

    return { invoiceId, invoiceToken }
  }

  public async getInvoiceByToken(token: string) {
    await this.releaseExpiredLocks()

    const tx = await this.db
      .prepare(
        `SELECT 
           t.*, p.name as product_name, p.usage_rules,
           pv.name as variant_name, pv.duration, pv.is_custom_gmail
         FROM transactions t
         JOIN product_variants pv ON pv.id = t.variant_id
         JOIN products p ON p.id = pv.product_id
         WHERE t.invoice_token = ?1
         LIMIT 1`
      )
      .bind(token)
      .first<AdminTransactionRow & {
        qris_dynamic_string: string | null
        delivered_account_data: string | null
      }>()

    if (!tx) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invoice tidak ditemukan atau token tidak sah.'
      })
    }

    let decryptedAccount: {
      email: string
      password: string
      extraInfoLink: string | null
    } | null = null

    if (tx.status === 'lunas' && tx.is_custom_gmail === 0 && tx.delivered_account_data) {
      const config = useRuntimeConfig(this.event)
      const cryptoService = new CryptoService(config.encryptionKey)
      const rawPlain = await cryptoService.decryptAccountData(tx.delivered_account_data)
      const parsed = new StockParserService().parseSingleDecryptedString(rawPlain)

      decryptedAccount = {
        email: parsed.email,
        password: parsed.password,
        extraInfoLink: parsed.extraInfoLink
      }
    }

    const reviewRow = await this.db
      .prepare('SELECT id FROM testimonials WHERE transaction_id = ?1 LIMIT 1')
      .bind(tx.id)
      .first<{ id: string }>()

    return {
      id: tx.id,
      invoice_token: tx.invoice_token,
      customer_email: tx.customer_email,
      custom_gmail_account: tx.custom_gmail_account,
      product_name: tx.product_name,
      variant_name: tx.variant_name,
      duration: tx.duration,
      usage_rules: tx.usage_rules,
      is_custom_gmail: tx.is_custom_gmail === 1,
      custom_gmail_status: tx.custom_gmail_status,
      base_amount: tx.base_amount,
      unique_code: tx.unique_code,
      total_amount: tx.total_amount,
      status: tx.status as TransactionStatus,
      qris_dynamic_string: tx.qris_dynamic_string || '',
      expires_at: tx.expires_at,
      paid_at: tx.paid_at,
      created_at: tx.created_at,
      delivered_account: decryptedAccount,
      has_reviewed: Boolean(reviewRow)
    }
  }

  public async processQrisWebhookMutation(amountPaid: number, externalRefId: string): Promise<string> {
    await this.releaseExpiredLocks()

    const matchedTx = await this.db
      .prepare(
        `SELECT 
           t.*, p.name as product_name, p.usage_rules,
           pv.name as variant_name, pv.duration, pv.is_custom_gmail
         FROM transactions t
         JOIN product_variants pv ON pv.id = t.variant_id
         JOIN products p ON p.id = pv.product_id
         WHERE t.status = 'pending'
           AND t.total_amount = ?1
           AND datetime(t.expires_at) > datetime('now')
         ORDER BY t.created_at DESC
         LIMIT 1`
      )
      .bind(Math.floor(amountPaid))
      .first<AdminTransactionRow & { delivered_account_data: string | null }>()

    if (!matchedTx) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Tidak ada transaksi pending yang cocok dengan nominal tersebut.'
      })
    }

    await this.db
      .prepare('UPDATE transactions SET payment_gateway_ref = ?1 WHERE id = ?2')
      .bind(externalRefId, matchedTx.id)
      .run()

    const adminInvoiceRepo = new AdminInvoiceRepository(this.event)
    await adminInvoiceRepo.settleTransactionAndDeliver(matchedTx)

    return matchedTx.id
  }
}
