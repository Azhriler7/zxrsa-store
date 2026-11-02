// ============================================================================
// FILE: server/services/AdminInvoiceRepository.ts
// DESKRIPSI: Repository OOP untuk CRUD Invoice, History Pembelian, Penyelesaian
//            Transaksi (Atomic Stock Delivery), & Konfirmasi Custom Gmail.
// ============================================================================

import type { TransactionStatus } from '../types/database'
import { BaseRepository } from './BaseRepository'
import { CryptoService } from './CryptoService'
import { StockParserService } from './StockParserService'
import { EmailService } from './EmailService'

export interface AdminTransactionRow {
  id: string
  invoice_token: string
  customer_email: string
  custom_gmail_account: string | null
  variant_id: string
  account_stock_id: number | null
  base_amount: number
  unique_code: number
  total_amount: number
  status: TransactionStatus
  custom_gmail_status: 'not_applicable' | 'waiting_admin' | 'completed'
  expires_at: string
  paid_at: string | null
  email_sent_at: string | null
  created_at: string
  product_name: string
  usage_rules: string
  variant_name: string
  duration: string
  is_custom_gmail: 0 | 1
}

export class AdminInvoiceRepository extends BaseRepository {
  // --------------------------------------------------------------------------
  // [SECTION: GET ALL INVOICES / PURCHASE HISTORY (SAFE LEFT JOIN)]
  // Tetap aman dibuka meskipun tabel kosong atau produk lama telah dihapus
  // --------------------------------------------------------------------------
  public async getAllInvoices(statusFilter?: string): Promise<AdminTransactionRow[]> {
    const baseQuery = `
      SELECT 
        t.id, t.invoice_token, t.customer_email, t.custom_gmail_account,
        t.variant_id, t.account_stock_id, t.base_amount, t.unique_code,
        t.total_amount, t.status, t.custom_gmail_status, t.expires_at,
        t.paid_at, t.email_sent_at, t.created_at,
        COALESCE(p.name, 'Produk Dihapus') as product_name,
        COALESCE(p.usage_rules, '-') as usage_rules,
        COALESCE(pv.name, 'Paket Dihapus') as variant_name,
        COALESCE(pv.duration, '-') as duration,
        COALESCE(pv.is_custom_gmail, 0) as is_custom_gmail
      FROM transactions t
      LEFT JOIN product_variants pv ON pv.id = t.variant_id
      LEFT JOIN products p ON p.id = pv.product_id
    `

    if (statusFilter && statusFilter !== 'all') {
      const { results } = await this.db
        .prepare(`${baseQuery} WHERE t.status = ?1 ORDER BY t.created_at DESC LIMIT 100`)
        .bind(statusFilter)
        .all<AdminTransactionRow>()
      return results || []
    }

    const { results } = await this.db
      .prepare(`${baseQuery} ORDER BY t.created_at DESC LIMIT 100`)
      .all<AdminTransactionRow>()

    return results || []
  }

  // --------------------------------------------------------------------------
  // [SECTION: GET CUSTOM GMAIL QUEUE (SAFE LEFT JOIN)]
  // --------------------------------------------------------------------------
  public async getCustomGmailQueue(): Promise<AdminTransactionRow[]> {
    const { results } = await this.db
      .prepare(
        `SELECT 
           t.id, t.invoice_token, t.customer_email, t.custom_gmail_account,
           t.variant_id, t.account_stock_id, t.base_amount, t.unique_code,
           t.total_amount, t.status, t.custom_gmail_status, t.expires_at,
           t.paid_at, t.email_sent_at, t.created_at,
           COALESCE(p.name, 'Produk Custom Gmail') as product_name,
           COALESCE(p.usage_rules, '-') as usage_rules,
           COALESCE(pv.name, 'Paket Custom Gmail') as variant_name,
           COALESCE(pv.duration, '-') as duration,
           COALESCE(pv.is_custom_gmail, 1) as is_custom_gmail
         FROM transactions t
         LEFT JOIN product_variants pv ON pv.id = t.variant_id
         LEFT JOIN products p ON p.id = pv.product_id
         WHERE (pv.is_custom_gmail = 1 OR t.custom_gmail_account IS NOT NULL)
           AND t.status = 'lunas'
         ORDER BY 
           CASE WHEN t.custom_gmail_status = 'waiting_admin' THEN 0 ELSE 1 END,
           t.created_at DESC`
      )
      .all<AdminTransactionRow>()

    return results || []
  }

  // --------------------------------------------------------------------------
  // [SECTION: UPDATE INVOICE STATUS MANUAL OLEH ADMIN (CRUD INVOICE)]
  // Jika diubah menjadi 'lunas', otomatis menandai stok 'sold' & kirim email
  // Jika diubah menjadi 'expired'/'dibatalkan'/'failed', otomatis lepas stok
  // --------------------------------------------------------------------------
  public async updateInvoiceStatus(invoiceId: string, newStatus: TransactionStatus): Promise<void> {
    const tx = await this.db
      .prepare(
        `SELECT 
           t.*, p.name as product_name, p.usage_rules,
           pv.name as variant_name, pv.duration, pv.is_custom_gmail
         FROM transactions t
         JOIN product_variants pv ON pv.id = t.variant_id
         JOIN products p ON p.id = pv.product_id
         WHERE t.id = ?1 LIMIT 1`
      )
      .bind(invoiceId)
      .first<AdminTransactionRow & { delivered_account_data: string | null }>()

    if (!tx) {
      throw createError({ statusCode: 404, statusMessage: 'Invoice tidak ditemukan.' })
    }

    // KASUS A: Diubah menjadi LUNAS
    if (newStatus === 'lunas' && tx.status !== 'lunas') {
      await this.settleTransactionAndDeliver(tx)
      return
    }

    // KASUS B: Diubah menjadi EXPIRED / DIBATALKAN / FAILED (Lepaskan stok yang di-lock)
    if (['expired', 'dibatalkan', 'failed'].includes(newStatus) && tx.account_stock_id) {
      await this.db
        .prepare(
          `UPDATE account_stocks
           SET status = 'available', reserved_until = NULL
           WHERE id = ?1 AND status = 'reserved'`
        )
        .bind(tx.account_stock_id)
        .run()
    }

    await this.db
      .prepare(`UPDATE transactions SET status = ?1, updated_at = datetime('now') WHERE id = ?2`)
      .bind(newStatus, invoiceId)
      .run()

    await this.writeSystemLog('warn', 'INVOICE_CRUD', `Status invoice ${invoiceId} diubah menjadi ${newStatus}`, {
      invoiceId,
      newStatus
    })
  }

  // --------------------------------------------------------------------------
  // [SECTION: SETTLE TRANSACTION & AUTO DELIVER EMAIL (UNTUK PAKET BIASA)]
  // --------------------------------------------------------------------------
  public async settleTransactionAndDeliver(
    tx: AdminTransactionRow & { delivered_account_data: string | null }
  ): Promise<void> {
    const config = useRuntimeConfig(this.event)

    // 1. Jika Paket Custom Gmail: Ubah status bayar jadi lunas & masuk antrean waiting_admin
    if (tx.is_custom_gmail === 1) {
      await this.db
        .prepare(
          `UPDATE transactions
           SET status = 'lunas',
               custom_gmail_status = 'waiting_admin',
               paid_at = datetime('now'),
               updated_at = datetime('now')
           WHERE id = ?1`
        )
        .bind(tx.id)
        .run()

      await this.writeSystemLog('info', 'INVOICE_SETTLE', `Invoice Custom Gmail ${tx.id} LUNAS (Menunggu Konfirmasi Admin)`)
      return
    }

    // 2. Jika Paket Stok Biasa (.txt): Ambil stok yang sudah di-reserve atau cari stok available
    let stockRow: { id: number, encrypted_account_data: string } | null = null

    if (tx.account_stock_id) {
      stockRow = await this.db
        .prepare('SELECT id, encrypted_account_data FROM account_stocks WHERE id = ?1 LIMIT 1')
        .bind(tx.account_stock_id)
        .first<{ id: number, encrypted_account_data: string }>()
    }

    if (!stockRow) {
      stockRow = await this.db
        .prepare(
          `UPDATE account_stocks
           SET status = 'sold', sold_at = datetime('now')
           WHERE id = (
             SELECT id FROM account_stocks
             WHERE variant_id = ?1 AND status = 'available'
             ORDER BY id ASC LIMIT 1
           )
           RETURNING id, encrypted_account_data`
        )
        .bind(tx.variant_id)
        .first<{ id: number, encrypted_account_data: string }>()
    } else {
      await this.db
        .prepare(`UPDATE account_stocks SET status = 'sold', sold_at = datetime('now') WHERE id = ?1`)
        .bind(stockRow.id)
        .run()
    }

    if (!stockRow) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Stok akun untuk paket ini sedang habis. Tambahkan stok .txt terlebih dahulu.'
      })
    }

    // Update transaksi menjadi lunas & simpan referensi stok
    await this.db
      .prepare(
        `UPDATE transactions
         SET status = 'lunas',
             account_stock_id = ?1,
             delivered_account_data = ?2,
             paid_at = datetime('now'),
             email_sent_at = datetime('now'),
             updated_at = datetime('now')
         WHERE id = ?3`
      )
      .bind(stockRow.id, stockRow.encrypted_account_data, tx.id)
      .run()

    // Dekripsi akun di memori untuk dikirim ke email pembeli
    const cryptoService = new CryptoService(config.encryptionKey)
    const decryptedRaw = await cryptoService.decryptAccountData(stockRow.encrypted_account_data)
    const parsedAccount = new StockParserService().parseSingleDecryptedString(decryptedRaw)

    const emailService = new EmailService({
      apiKey: config.mailApiKey,
      fromAddress: config.mailFrom,
      mainDomain: config.public.mainDomain
    })

    await emailService.sendInvoiceEmail({
      toEmail: tx.customer_email,
      invoiceId: tx.id,
      invoiceToken: tx.invoice_token,
      productName: tx.product_name,
      variantName: tx.variant_name,
      duration: tx.duration,
      totalAmount: tx.total_amount,
      isCustomGmail: false,
      accountEmail: parsedAccount.email,
      accountPassword: parsedAccount.password,
      accountExtraLink: parsedAccount.extraInfoLink,
      usageRules: tx.usage_rules
    })

    await this.writeSystemLog('info', 'INVOICE_SETTLE', `Invoice ${tx.id} LUNAS & akun terkirim ke ${tx.customer_email}`)
  }

  // --------------------------------------------------------------------------
  // [SECTION: KONFIRMASI SELESAI CUSTOM GMAIL OLEH ADMIN]
  // Saat Admin klik Konfirmasi, status menjadi 'completed' & kirim email Invoice
  // --------------------------------------------------------------------------
  public async confirmCustomGmailOrder(invoiceId: string): Promise<void> {
    const config = useRuntimeConfig(this.event)

    const tx = await this.db
      .prepare(
        `SELECT 
           t.*, p.name as product_name, p.usage_rules,
           pv.name as variant_name, pv.duration, pv.is_custom_gmail
         FROM transactions t
         JOIN product_variants pv ON pv.id = t.variant_id
         JOIN products p ON p.id = pv.product_id
         WHERE t.id = ?1 AND pv.is_custom_gmail = 1 LIMIT 1`
      )
      .bind(invoiceId)
      .first<AdminTransactionRow>()

    if (!tx) {
      throw createError({ statusCode: 404, statusMessage: 'Pesanan Custom Gmail tidak ditemukan.' })
    }

    await this.db
      .prepare(
        `UPDATE transactions
         SET custom_gmail_status = 'completed',
             email_sent_at = datetime('now'),
             updated_at = datetime('now')
         WHERE id = ?1`
      )
      .bind(invoiceId)
      .run()

    const emailService = new EmailService({
      apiKey: config.mailApiKey,
      fromAddress: config.mailFrom,
      mainDomain: config.public.mainDomain
    })

    await emailService.sendInvoiceEmail({
      toEmail: tx.customer_email,
      invoiceId: tx.id,
      invoiceToken: tx.invoice_token,
      productName: tx.product_name,
      variantName: tx.variant_name,
      duration: tx.duration,
      totalAmount: tx.total_amount,
      isCustomGmail: true,
      customGmailTarget: tx.custom_gmail_account || tx.customer_email,
      usageRules: tx.usage_rules
    })

    await this.writeSystemLog(
      'info',
      'CUSTOM_GMAIL_CONFIRM',
      `Admin mengonfirmasi aktivasi Custom Gmail untuk Invoice ${tx.id} (${tx.custom_gmail_account})`,
      { invoiceId: tx.id, customerEmail: tx.customer_email }
    )
  }
}
