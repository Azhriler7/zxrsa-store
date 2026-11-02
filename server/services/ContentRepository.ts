// ============================================================================
// FILE: server/services/ContentRepository.ts
// DESKRIPSI: Repository OOP untuk CRUD Testimoni (dengan Privacy Masking Email)
//            dan CRUD FAQ Dinamis.
// ============================================================================

import type { DbFaq, DbTestimonial } from '../types/database'
import { BaseRepository } from './BaseRepository'

export class ContentRepository extends BaseRepository {
  // --------------------------------------------------------------------------
  // [SECTION: HELPER PRIVACY EMAIL MASKING]
  // Mengubah "azhrielagb712@gmail.com" menjadi "azh***@gmail.com"
  // --------------------------------------------------------------------------
  public static maskEmailPrivacy(email: string): string {
    const clean = email.trim().toLowerCase()
    const [localPart, domainPart] = clean.split('@')
    if (!localPart || !domainPart) return 'usr***@gmail.com'

    const visibleChars = localPart.length <= 3
      ? localPart.slice(0, 1)
      : localPart.slice(0, 3)

    return `${visibleChars}***@${domainPart}`
  }

  // --------------------------------------------------------------------------
  // [SECTION: PUBLIC STOREFRONT QUERIES]
  // --------------------------------------------------------------------------
  public async getApprovedTestimonials(): Promise<DbTestimonial[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM testimonials
         WHERE is_approved = 1
         ORDER BY created_at DESC
         LIMIT 30`
      )
      .all<DbTestimonial>()

    return results
  }

  public async getActiveFaqs(): Promise<DbFaq[]> {
    const { results } = await this.db
      .prepare(
        `SELECT * FROM faqs
         WHERE is_active = 1
         ORDER BY sort_order ASC, created_at ASC`
      )
      .all<DbFaq>()

    return results
  }

  // --------------------------------------------------------------------------
  // [SECTION: CUSTOMER SUBMIT REVIEW AFTER PAYMENT]
  // Pembeli kirim bintang & ulasan setelah status Invoice LUNAS
  // --------------------------------------------------------------------------
  public async submitCustomerReview(payload: {
    invoiceToken: string
    rating: number
    comment: string
  }): Promise<void> {
    const tx = await this.db
      .prepare(
        `SELECT t.id, t.customer_email, t.status, p.name as product_name, pv.name as variant_name
         FROM transactions t
         JOIN product_variants pv ON pv.id = t.variant_id
         JOIN products p ON p.id = pv.product_id
         WHERE t.invoice_token = ?1 LIMIT 1`
      )
      .bind(payload.invoiceToken)
      .first<{
      id: string
      customer_email: string
      status: string
      product_name: string
      variant_name: string
    }>()

    if (!tx || tx.status !== 'lunas') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Ulasan hanya dapat dikirim untuk transaksi yang sudah LUNAS.'
      })
    }

    const existing = await this.db
      .prepare('SELECT id FROM testimonials WHERE transaction_id = ?1 LIMIT 1')
      .bind(tx.id)
      .first<{ id: string }>()

    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Anda sudah memberikan ulasan untuk transaksi ini. Terima kasih!'
      })
    }

    const id = `tst_${crypto.randomUUID().slice(0, 8)}`
    const maskedEmail = ContentRepository.maskEmailPrivacy(tx.customer_email)
    const packageName = `${tx.product_name} — ${tx.variant_name}`

    await this.db
      .prepare(
        `INSERT INTO testimonials (
           id, transaction_id, customer_email, masked_email,
           product_package_name, rating, comment, is_approved, source
         )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 0, 'customer')`
      )
      .bind(
        id,
        tx.id,
        tx.customer_email,
        maskedEmail,
        packageName,
        Math.min(5, Math.max(1, Math.floor(payload.rating))),
        payload.comment.trim()
      )
      .run()

    await this.writeSystemLog('info', 'TESTIMONIAL_SUBMIT', `Ulasan baru bintang ${payload.rating} dari ${maskedEmail}`, {
      transactionId: tx.id,
      rating: payload.rating
    })
  }

  public async hasTransactionReviewed(transactionId: string): Promise<boolean> {
    const row = await this.db
      .prepare('SELECT id FROM testimonials WHERE transaction_id = ?1 LIMIT 1')
      .bind(transactionId)
      .first<{ id: string }>()
    return Boolean(row)
  }

  // --------------------------------------------------------------------------
  // [SECTION: ADMIN TESTIMONIALS CRUD]
  // --------------------------------------------------------------------------
  public async getAllTestimonialsAdmin(): Promise<DbTestimonial[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM testimonials ORDER BY created_at DESC')
      .all<DbTestimonial>()
    return results
  }

  public async upsertTestimonialAdmin(payload: {
    id?: string
    customer_email: string
    product_package_name: string
    rating: number
    comment: string
    is_approved: boolean
  }): Promise<string> {
    const id = payload.id || `tst_${crypto.randomUUID().slice(0, 8)}`
    const maskedEmail = ContentRepository.maskEmailPrivacy(payload.customer_email)

    await this.db
      .prepare(
        `INSERT INTO testimonials (
           id, customer_email, masked_email, product_package_name,
           rating, comment, is_approved, source
         )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'admin')
         ON CONFLICT(id) DO UPDATE SET
           customer_email = excluded.customer_email,
           masked_email = excluded.masked_email,
           product_package_name = excluded.product_package_name,
           rating = excluded.rating,
           comment = excluded.comment,
           is_approved = excluded.is_approved`
      )
      .bind(
        id,
        payload.customer_email.trim(),
        maskedEmail,
        payload.product_package_name.trim(),
        Math.min(5, Math.max(1, Math.floor(payload.rating))),
        payload.comment.trim(),
        payload.is_approved ? 1 : 0
      )
      .run()

    return id
  }

  public async toggleTestimonialApproval(id: string, isApproved: boolean): Promise<void> {
    await this.db
      .prepare('UPDATE testimonials SET is_approved = ?1 WHERE id = ?2')
      .bind(isApproved ? 1 : 0, id)
      .run()
  }

  public async deleteTestimonial(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM testimonials WHERE id = ?1').bind(id).run()
  }

  // --------------------------------------------------------------------------
  // [SECTION: ADMIN FAQ CRUD]
  // --------------------------------------------------------------------------
  public async getAllFaqsAdmin(): Promise<DbFaq[]> {
    const { results } = await this.db
      .prepare('SELECT * FROM faqs ORDER BY sort_order ASC, created_at ASC')
      .all<DbFaq>()
    return results
  }

  public async upsertFaqAdmin(payload: {
    id?: string
    question: string
    answer: string
    sort_order: number
    is_active: boolean
  }): Promise<string> {
    const id = payload.id || `faq_${crypto.randomUUID().slice(0, 8)}`

    await this.db
      .prepare(
        `INSERT INTO faqs (id, question, answer, sort_order, is_active, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           question = excluded.question,
           answer = excluded.answer,
           sort_order = excluded.sort_order,
           is_active = excluded.is_active,
           updated_at = datetime('now')`
      )
      .bind(
        id,
        payload.question.trim(),
        payload.answer.trim(),
        Math.floor(payload.sort_order),
        payload.is_active ? 1 : 0
      )
      .run()

    return id
  }

  public async deleteFaq(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM faqs WHERE id = ?1').bind(id).run()
  }
}
