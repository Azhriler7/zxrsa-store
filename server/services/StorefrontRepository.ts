// ============================================================================
// FILE: server/services/StorefrontRepository.ts
// DESKRIPSI: Repository OOP Katalog Publik (Deskripsi, Aturan, & Tutorial
//            per Paket), Timer 5 Menit, & Invoice Setelah Lunas.
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
  description: string | null
  usage_rules: string | null
  tutorial_text: string | null
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

  private isPromoCurrentlyActive(variant: DbProductVariant): boolean {
    if (!variant.promo_price || variant.promo_price <= 0 || variant.promo_price >= variant.price) {
      return false
    }

    const nowUtc = new Date()
    const wibDate = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000)
    const currentDayIndex = String(wibDate.getUTCDay())
    const currentYmd = wibDate.toISOString().slice(0, 10)
    const currentMonthDay = currentYmd.slice(5, 10)

    const hasRecurringDayRule = Boolean(variant.promo_day_of_week && variant.promo_day_of_week.trim() !== '')
    const hasSpecificDateRule = Boolean(variant.promo_specific_date && variant.promo_specific_date.trim() !== '')
    const hasRangeRule = Boolean(variant.promo_start_at || variant.promo_end_at)

    if (!hasRecurringDayRule && !hasSpecificDateRule && !hasRangeRule) {
      return true
    }

    let matchedAnyActiveSchedule = false

    if (hasRecurringDayRule) {
      const activeDays = (variant.promo_day_of_week || '').split(',').map(d => d.trim())
      if (activeDays.includes(currentDayIndex)) {
        matchedAnyActiveSchedule = true
      }
    }

    if (hasSpecificDateRule) {
      const targetDate = (variant.promo_specific_date || '').trim()
      if (targetDate === currentYmd || targetDate.slice(-5) === currentMonthDay) {
        matchedAnyActiveSchedule = true
      }
    }

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
            description: v.description || null,
            usage_rules: v.usage_rules || prod.usage_rules || null,
            tutorial_text: v.tutorial_text || null,
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

    // TIMER PEMBAYARAN QRIS & KUNCI STOK: 10 MENIT
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
    // Rumus: Total Tagihan = Harga Produk + 0,3% Biaya Layanan + Kode Unik (1 s/d 199)
    const serviceFee = Math.ceil(baseAmount * 0.003)
    const uniqueCode = QrisDynamicService.generateUniqueCode(1, 199)
    const totalAmount = baseAmount + serviceFee + uniqueCode

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
    try {
      await this.releaseExpiredLocks()
    } catch {
      // Abaikan jika lock release gagal
    }

    const cleanToken = decodeURIComponent(token || '').trim()

    const tx = await this.db
      .prepare(
        `SELECT 
           t.id,
           t.invoice_token,
           t.customer_email,
           t.custom_gmail_account,
           t.variant_id,
           t.account_stock_id,
           t.base_amount,
           t.unique_code,
           t.total_amount,
           t.status,
           t.custom_gmail_status,
           t.qris_dynamic_string,
           t.delivered_account_data,
           t.expires_at,
           t.paid_at,
           t.created_at,
           COALESCE(p.name, 'Aplikasi Premium ZXRSA') as product_name,
           COALESCE(pv.usage_rules, p.usage_rules, '1. Dilarang mengubah password akun.\n2. Garansi penuh sesuai durasi paket.') as usage_rules,
           pv.tutorial_text as tutorial_text,
           COALESCE(pv.name, 'Paket Premium') as variant_name,
           COALESCE(pv.duration, '30 Hari') as duration,
           pv.description as variant_description,
           COALESCE(pv.is_custom_gmail, CASE WHEN t.custom_gmail_account IS NOT NULL THEN 1 ELSE 0 END) as is_custom_gmail
         FROM transactions t
         LEFT JOIN product_variants pv ON pv.id = t.variant_id
         LEFT JOIN products p ON p.id = pv.product_id
         WHERE TRIM(t.invoice_token) = ?1 OR TRIM(t.id) = ?1
         LIMIT 1`
      )
      .bind(cleanToken)
      .first<AdminTransactionRow & {
        variant_description: string | null
        qris_dynamic_string: string | null
        delivered_account_data: string | null
      }>()

    if (!tx) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invoice tidak ditemukan di database.'
      })
    }

    let decryptedAccount: {
      email: string
      password: string
      extraInfoLink: string | null
    } | null = null

    if (tx.status === 'lunas' && Number(tx.is_custom_gmail) === 0 && tx.delivered_account_data) {
      try {
        const config = useRuntimeConfig(this.event)
        const cryptoService = new CryptoService(config.encryptionKey)
        const rawPlain = await cryptoService.decryptAccountData(tx.delivered_account_data)
        const parsed = new StockParserService().parseSingleDecryptedString(rawPlain)

        decryptedAccount = {
          email: parsed.email,
          password: parsed.password,
          extraInfoLink: parsed.extraInfoLink
        }
      } catch {
        const fallbackParsed = new StockParserService().parseSingleDecryptedString(tx.delivered_account_data)
        decryptedAccount = {
          email: fallbackParsed.email,
          password: fallbackParsed.password,
          extraInfoLink: fallbackParsed.extraInfoLink
        }
      }
    }

    let hasReviewed: boolean
    try {
      const reviewRow = await this.db
        .prepare('SELECT id FROM testimonials WHERE transaction_id = ?1 LIMIT 1')
        .bind(tx.id)
        .first<{ id: string }>()
      hasReviewed = Boolean(reviewRow)
    } catch {
      hasReviewed = false
    }

    const baseAmt = Number(tx.base_amount || 0)
    const uniqueAmt = Number(tx.unique_code || 0)
    const totalAmt = Number(tx.total_amount || 0)
    // Selisih antara totalAmt - baseAmt - uniqueAmt adalah Biaya 0,3%
    const serviceFeeAmt = Math.max(0, totalAmt - baseAmt - uniqueAmt)

    return {
      id: tx.id,
      invoice_token: tx.invoice_token,
      customer_email: tx.customer_email,
      custom_gmail_account: tx.custom_gmail_account,
      product_name: tx.product_name,
      variant_name: tx.variant_name,
      variant_description: tx.variant_description || null,
      duration: tx.duration,
      usage_rules: tx.usage_rules,
      tutorial_text: tx.tutorial_text || null,
      is_custom_gmail: Number(tx.is_custom_gmail) === 1,
      custom_gmail_status: tx.custom_gmail_status,
      base_amount: baseAmt,
      service_fee: serviceFeeAmt,
      unique_code: uniqueAmt,
      total_amount: totalAmt,
      status: tx.status as TransactionStatus,
      qris_dynamic_string: tx.qris_dynamic_string || '',
      expires_at: tx.expires_at,
      paid_at: tx.paid_at,
      created_at: tx.created_at,
      delivered_account: decryptedAccount,
      has_reviewed: hasReviewed
    }
  }

  // --------------------------------------------------------------------------
  // [SECTION: STANDAR INDUSTRI PAYMENT FAIL-SAFE & GRACE WINDOW (30 MENIT)]
  // 1. Mencocokkan transaksi 'pending' terlebih dahulu.
  // 2. GRACE WINDOW: Jika pembeli bayar di detik terakhir dan timer 5 menit
  //    keburu 'expired' beberapa detik lalu, tetap pulihkan & lunaskan selama
  //    masih dalam 30 menit terakhir!
  // 3. IDEMPOTENCY: Mencegah pengiriman akun ganda jika webhook dikirim 2x.
  // --------------------------------------------------------------------------
  public async processQrisWebhookMutation(amountPaid: number, externalRefId: string): Promise<string> {
    const cleanAmount = Math.floor(amountPaid)

    // 1. IDEMPOTENCY CHECK: Cek apakah referensi mutasi ini sudah pernah diproses lunas sebelumnya
    if (externalRefId && !externalRefId.startsWith('MUTASIKU-')) {
      const alreadyProcessed = await this.db
        .prepare(`SELECT id FROM transactions WHERE payment_gateway_ref = ?1 AND status = 'lunas' LIMIT 1`)
        .bind(externalRefId)
        .first<{ id: string }>()

      if (alreadyProcessed) {
        return alreadyProcessed.id
      }
    }

    await this.releaseExpiredLocks()

    // 2. Cari transaksi yang sedang PENDING, atau baru saja EXPIRED dalam 30 menit terakhir (Grace Window)
    const matchedTx = await this.db
      .prepare(
        `SELECT 
           t.*,
           COALESCE(p.name, 'Aplikasi Premium') as product_name,
           COALESCE(pv.usage_rules, p.usage_rules, '-') as usage_rules,
           pv.tutorial_text as tutorial_text,
           COALESCE(pv.name, 'Paket Premium') as variant_name,
           COALESCE(pv.duration, '-') as duration,
           COALESCE(pv.is_custom_gmail, 0) as is_custom_gmail
         FROM transactions t
         LEFT JOIN product_variants pv ON pv.id = t.variant_id
         LEFT JOIN products p ON p.id = pv.product_id
         WHERE t.total_amount = ?1
           AND (
             (t.status = 'pending' AND datetime(t.expires_at) > datetime('now'))
             OR
             (t.status = 'expired' AND datetime(t.created_at) >= datetime('now', '-30 minutes'))
           )
         ORDER BY 
           CASE WHEN t.status = 'pending' THEN 0 ELSE 1 END,
           t.created_at DESC
         LIMIT 1`
      )
      .bind(cleanAmount)
      .first<AdminTransactionRow & { delivered_account_data: string | null }>()

    if (!matchedTx) {
      await this.writeSystemLog(
        'warn',
        'WEBHOOK_UNMATCHED',
        `Mutasi masuk Rp ${cleanAmount} (${externalRefId}), namun tidak ada invoice aktif yang cocok.`,
        { amountPaid: cleanAmount, externalRefId }
      )
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

    await this.writeSystemLog(
      'info',
      'WEBHOOK_SETTLED',
      `Pembayaran QRIS Rp ${cleanAmount} berhasil melunaskan Invoice ${matchedTx.id}`,
      { invoiceId: matchedTx.id, amountPaid: cleanAmount, externalRefId }
    )

    return matchedTx.id
  }
}
