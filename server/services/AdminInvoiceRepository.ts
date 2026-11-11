// ============================================================================
// FILE: server/services/AdminInvoiceRepository.ts
// DESKRIPSI: Repository OOP Manajemen Invoice Admin & Instant Settlement
//            (Menggunakan Cloudflare waitUntil agar Webhook merespons < 50ms).
// ============================================================================

import type { CustomGmailStatus, TransactionStatus } from '../types/database'
import { BaseRepository } from './BaseRepository'
import { CryptoService } from './CryptoService'
import { EmailService } from './EmailService'
import { StockParserService } from './StockParserService'

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
  custom_gmail_status: CustomGmailStatus
  expires_at: string
  paid_at: string | null
  email_sent_at: string | null
  created_at: string
  product_name: string
  usage_rules: string
  tutorial_text: string | null
  variant_name: string
  duration: string
  is_custom_gmail: 0 | 1
}

export class AdminInvoiceRepository extends BaseRepository {
  public async getAllInvoices(statusFilter?: string): Promise<AdminTransactionRow[]> {
    const baseQuery = `
      SELECT 
        t.id, t.invoice_token, t.customer_email, t.custom_gmail_account,
        t.variant_id, t.account_stock_id, t.base_amount, t.unique_code,
        t.total_amount, t.status, t.custom_gmail_status, t.expires_at,
        t.paid_at, t.email_sent_at, t.created_at,
        COALESCE(p.name, 'Produk Dihapus') as product_name,
        COALESCE(pv.usage_rules, p.usage_rules, '-') as usage_rules,
        pv.tutorial_text as tutorial_text,
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

  public async getCustomGmailQueue(): Promise<AdminTransactionRow[]> {
    const { results } = await this.db
      .prepare(
        `SELECT 
           t.id, t.invoice_token, t.customer_email, t.custom_gmail_account,
           t.variant_id, t.account_stock_id, t.base_amount, t.unique_code,
           t.total_amount, t.status, t.custom_gmail_status, t.expires_at,
           t.paid_at, t.email_sent_at, t.created_at,
           COALESCE(p.name, 'Produk Custom Gmail') as product_name,
           COALESCE(pv.usage_rules, p.usage_rules, '-') as usage_rules,
           pv.tutorial_text as tutorial_text,
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

  public async updateInvoiceStatus(transactionId: string, newStatus: TransactionStatus): Promise<void> {
    const tx = await this.db
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
         WHERE t.id = ?1 LIMIT 1`
      )
      .bind(transactionId)
      .first<AdminTransactionRow & { delivered_account_data: string | null }>()

    if (!tx) {
      throw createError({ statusCode: 404, statusMessage: 'Invoice tidak ditemukan.' })
    }

    if (newStatus === 'lunas' && tx.status !== 'lunas') {
      await this.settleTransactionAndDeliver(tx)
      return
    }

    if ((newStatus === 'dibatalkan' || newStatus === 'expired' || newStatus === 'failed') && tx.account_stock_id) {
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
      .bind(newStatus, transactionId)
      .run()

    await this.writeSystemLog('warn', 'INVOICE_STATUS', `Admin ubah status ${transactionId} -> ${newStatus}`)
  }

  // --------------------------------------------------------------------------
  // [SECTION: INSTANT SETTLEMENT & NON-BLOCKING BACKGROUND EMAIL]
  // Status di D1 langsung berubah ke 'lunas' seketika, sementara pengiriman
  // email ke Resend dijalankan di latar belakang via event.waitUntil().
  // --------------------------------------------------------------------------
  public async settleTransactionAndDeliver(
    tx: AdminTransactionRow & { delivered_account_data?: string | null }
  ): Promise<void> {
    const config = useRuntimeConfig(this.event)
    const cryptoService = new CryptoService(config.encryptionKey)
    const emailService = new EmailService({
      apiKey: config.mailApiKey,
      fromAddress: config.mailFrom,
      mainDomain: config.public.mainDomain
    })

    let encryptedStockToSnapshot: string | null = tx.delivered_account_data || null
    let parsedAccount: { email: string, password: string, extraInfoLink: string | null } | null = null

    if (Number(tx.is_custom_gmail) === 0) {
      let stockId = tx.account_stock_id

      if (!stockId) {
        const fallbackStock = await this.db
          .prepare(
            `SELECT id, encrypted_account_data FROM account_stocks
             WHERE variant_id = ?1 AND status = 'available'
             ORDER BY id ASC LIMIT 1`
          )
          .bind(tx.variant_id)
          .first<{ id: number, encrypted_account_data: string }>()

        if (!fallbackStock) {
          throw createError({
            statusCode: 409,
            statusMessage: 'Stok akun untuk varian ini habis, tidak dapat menyelesaikan pengiriman otomatis.'
          })
        }
        stockId = fallbackStock.id
        encryptedStockToSnapshot = fallbackStock.encrypted_account_data
      } else {
        const reservedStock = await this.db
          .prepare('SELECT encrypted_account_data FROM account_stocks WHERE id = ?1 LIMIT 1')
          .bind(stockId)
          .first<{ encrypted_account_data: string }>()

        encryptedStockToSnapshot = reservedStock?.encrypted_account_data || null
      }

      await this.db
        .prepare(`UPDATE account_stocks SET status = 'sold', reserved_until = NULL WHERE id = ?1`)
        .bind(stockId)
        .run()

      if (encryptedStockToSnapshot) {
        const decryptedPlain = await cryptoService.decryptAccountData(encryptedStockToSnapshot)
        const parser = new StockParserService()
        parsedAccount = parser.parseSingleDecryptedString(decryptedPlain)
      }
    }

    // 1. Langsung simpan status LUNAS & kredensial akun ke database D1 detik ini juga!
    await this.db
      .prepare(
        `UPDATE transactions
         SET status = 'lunas',
             delivered_account_data = COALESCE(?1, delivered_account_data),
             paid_at = COALESCE(paid_at, datetime('now')),
             updated_at = datetime('now')
         WHERE id = ?2`
      )
      .bind(encryptedStockToSnapshot, tx.id)
      .run()

    // 2. Kirim email secara asinkron (Non-Blocking) agar Webhook langsung selesai & layar pembeli langsung berubah LUNAS
    if (Number(tx.is_custom_gmail) === 0 && parsedAccount) {
      const accountToSend = parsedAccount
      const sendEmailTask = async () => {
        try {
          await emailService.sendInvoiceEmail({
            toEmail: tx.customer_email,
            invoiceId: tx.id,
            invoiceToken: tx.invoice_token,
            productName: tx.product_name,
            variantName: tx.variant_name,
            duration: tx.duration,
            totalAmount: Number(tx.total_amount || 0),
            isCustomGmail: false,
            accountEmail: accountToSend.email,
            accountPassword: accountToSend.password,
            accountExtraLink: accountToSend.extraInfoLink,
            usageRules: tx.usage_rules || '-',
            tutorialText: tx.tutorial_text || null
          })

          await this.db
            .prepare(`UPDATE transactions SET email_sent_at = datetime('now') WHERE id = ?1`)
            .bind(tx.id)
            .run()
        } catch (err) {
          await this.writeSystemLog('error', 'EMAIL_SEND', `Gagal kirim email otomatis untuk ${tx.id}`, {
            error: err instanceof Error ? err.message : 'Unknown error'
          })
        }
      }

      if (typeof this.event.waitUntil === 'function') {
        this.event.waitUntil(sendEmailTask())
      } else {
        await sendEmailTask()
      }
    }
  }

  public async confirmCustomGmailCompleted(transactionId: string): Promise<{ emailSent: boolean, emailError: string | null }> {
    const tx = await this.db
      .prepare(
        `SELECT 
           t.*,
           COALESCE(p.name, 'Aplikasi Premium') as product_name,
           COALESCE(pv.usage_rules, p.usage_rules, '-') as usage_rules,
           pv.tutorial_text as tutorial_text,
           COALESCE(pv.name, 'Paket Custom Gmail') as variant_name,
           COALESCE(pv.duration, '-') as duration,
           COALESCE(pv.is_custom_gmail, 1) as is_custom_gmail
         FROM transactions t
         LEFT JOIN product_variants pv ON pv.id = t.variant_id
         LEFT JOIN products p ON p.id = pv.product_id
         WHERE t.id = ?1 LIMIT 1`
      )
      .bind(transactionId)
      .first<AdminTransactionRow>()

    if (!tx) {
      throw createError({ statusCode: 404, statusMessage: 'Transaksi tidak ditemukan.' })
    }

    await this.db
      .prepare(
        `UPDATE transactions
         SET custom_gmail_status = 'completed',
             updated_at = datetime('now')
         WHERE id = ?1`
      )
      .bind(transactionId)
      .run()

    const config = useRuntimeConfig(this.event)
    const emailService = new EmailService({
      apiKey: config.mailApiKey,
      fromAddress: config.mailFrom,
      mainDomain: config.public.mainDomain
    })

    let emailSent = false
    let emailError: string | null = null

    try {
      await emailService.sendInvoiceEmail({
        toEmail: tx.customer_email,
        invoiceId: tx.id,
        invoiceToken: tx.invoice_token,
        productName: tx.product_name,
        variantName: tx.variant_name,
        duration: tx.duration,
        totalAmount: Number(tx.total_amount || 0),
        isCustomGmail: true,
        customGmailTarget: tx.custom_gmail_account,
        usageRules: tx.usage_rules || '-',
        tutorialText: tx.tutorial_text || null
      })

      emailSent = true
      await this.db
        .prepare(`UPDATE transactions SET email_sent_at = datetime('now') WHERE id = ?1`)
        .bind(transactionId)
        .run()

      await this.writeSystemLog('info', 'CUSTOM_GMAIL_CONFIRM', `Admin konfirmasi selesai & email terkirim: ${tx.id}`)
    } catch (err) {
      emailError = err instanceof Error ? err.message : 'Gagal mengirim email via Resend'
      await this.writeSystemLog('error', 'CUSTOM_GMAIL_EMAIL_ERROR', `Pesanan ${tx.id} selesai dikonfirmasi, namun email gagal terkirim`, {
        error: emailError,
        toEmail: tx.customer_email
      })
    }

    return { emailSent, emailError }
  }

  public async confirmCustomGmailOrder(transactionId: string) {
    return await this.confirmCustomGmailCompleted(transactionId)
  }

  public async resendInvoiceEmailById(transactionId: string): Promise<void> {
    const tx = await this.db
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
         WHERE t.id = ?1 LIMIT 1`
      )
      .bind(transactionId)
      .first<AdminTransactionRow & { delivered_account_data: string | null }>()

    if (!tx || tx.status !== 'lunas') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Hanya invoice berstatus LUNAS yang dapat dikirimkan ulang emailnya.'
      })
    }

    const config = useRuntimeConfig(this.event)
    const emailService = new EmailService({
      apiKey: config.mailApiKey,
      fromAddress: config.mailFrom,
      mainDomain: config.public.mainDomain
    })

    try {
      if (Number(tx.is_custom_gmail) === 1) {
        await emailService.sendInvoiceEmail({
          toEmail: tx.customer_email,
          invoiceId: tx.id,
          invoiceToken: tx.invoice_token,
          productName: tx.product_name,
          variantName: tx.variant_name,
          duration: tx.duration,
          totalAmount: Number(tx.total_amount || 0),
          isCustomGmail: true,
          customGmailTarget: tx.custom_gmail_account,
          usageRules: tx.usage_rules || '-',
          tutorialText: tx.tutorial_text || null
        })
      } else if (tx.delivered_account_data) {
        const cryptoService = new CryptoService(config.encryptionKey)
        let plain: string
        try {
          plain = await cryptoService.decryptAccountData(tx.delivered_account_data)
        } catch {
          plain = tx.delivered_account_data
        }
        const parsed = new StockParserService().parseSingleDecryptedString(plain)

        await emailService.sendInvoiceEmail({
          toEmail: tx.customer_email,
          invoiceId: tx.id,
          invoiceToken: tx.invoice_token,
          productName: tx.product_name,
          variantName: tx.variant_name,
          duration: tx.duration,
          totalAmount: Number(tx.total_amount || 0),
          isCustomGmail: false,
          accountEmail: parsed.email,
          accountPassword: parsed.password,
          accountExtraLink: parsed.extraInfoLink,
          usageRules: tx.usage_rules || '-',
          tutorialText: tx.tutorial_text || null
        })
      }

      await this.db
        .prepare(`UPDATE transactions SET email_sent_at = datetime('now') WHERE id = ?1`)
        .bind(transactionId)
        .run()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim email via Resend.'
      await this.writeSystemLog('error', 'EMAIL_RESEND_ERROR', `Gagal kirim ulang email ${transactionId}: ${msg}`)
      throw createError({
        statusCode: 400,
        statusMessage: msg
      })
    }
  }

  public async deleteInvoice(transactionId: string): Promise<void> {
    await this.db.prepare('DELETE FROM transactions WHERE id = ?1').bind(transactionId).run()
    await this.writeSystemLog('warn', 'INVOICE_DELETE', `Admin hapus invoice: ${transactionId}`)
  }
}
