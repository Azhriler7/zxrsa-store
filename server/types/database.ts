// ============================================================================
// FILE: server/types/database.ts
// DESKRIPSI: Definisi Tipe Data TypeScript Murni untuk Tabel Cloudflare D1
// ============================================================================

export type DayOfWeek
  = | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday'
    | 'Friday' | 'Saturday' | 'Sunday'

// Sesuai spesifikasi status pembayaran di halaman Invoice
export type TransactionStatus
  = | 'lunas'
    | 'pending'
    | 'expired'
    | 'dibatalkan'
    | 'failed'

export type CustomGmailStatus
  = | 'not_applicable'
    | 'waiting_admin'
    | 'completed'

export type StockStatus
  = | 'available'
    | 'reserved'
    | 'sold'

export type StockFormatType
  = | 'two_columns' // Contoh: email|password
    | 'three_columns' // Contoh: email | password | link_generator

export type UserRole = 'admin' | 'staff'

export type LogLevel = 'info' | 'warn' | 'error' | 'security'

// ─── Entitas Tabel Database (Row Interfaces) ──────────────────────────────────

export interface DbUser {
  id: string
  email: string
  password_hash: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface DbProduct {
  id: string
  name: string
  slug: string
  description: string | null
  usage_rules: string
  image_url: string | null
  promo_badge: string | null
  is_active: 0 | 1
  created_at: string
  updated_at: string
}

export interface DbProductVariant {
  id: string
  product_id: string
  name: string
  duration: string
  price: number // Disimpan sebagai INTEGER (Rupiah penuh)
  promo_price: number | null // Disimpan sebagai INTEGER (Rupiah penuh)
  promo_day_of_week: DayOfWeek | null
  promo_specific_date: string | null // 'MM-DD'
  promo_start_at: string | null
  promo_end_at: string | null
  is_custom_gmail: 0 | 1
  is_active: 0 | 1
  created_at: string
  updated_at: string
}

export interface DbAccountStock {
  id: number
  variant_id: string
  encrypted_account_data: string
  format_type: StockFormatType
  status: StockStatus
  reserved_until: string | null
  sold_at: string | null
  created_at: string
}

export interface DbTransaction {
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
  payment_gateway_ref: string | null
  qris_dynamic_string: string | null
  delivered_account_data: string | null
  expires_at: string
  paid_at: string | null
  email_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface DbSystemLog {
  id: number
  level: LogLevel
  module: string
  message: string
  metadata: string | null
  ip_address: string | null
  created_at: string
}

export interface DbTestimonial {
  id: string
  transaction_id: string | null
  customer_email: string
  masked_email: string
  product_package_name: string
  rating: number
  comment: string
  is_approved: 0 | 1
  source: 'customer' | 'admin'
  created_at: string
}

export interface DbFaq {
  id: string
  question: string
  answer: string
  sort_order: number
  is_active: 0 | 1
  created_at: string
  updated_at: string
}
