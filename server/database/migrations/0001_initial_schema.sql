-- Migration number: 0001 	 2026-10-31T18:13:00.120Z
-- ============================================================================
-- FILE: server/database/migrations/0001_initial_schema.sql
-- DESKRIPSI: Skema Database Utama Toko Akun Aplikasi Premium (Wink, AM, CapCut)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- 1. TABEL USERS (Khusus Admin & Staff - Tanpa Fitur Register Publik)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, -- Format: salt:hash (PBKDF2 / Scrypt Web Crypto)
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'staff')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------------------
-- 2. TABEL PRODUCTS (Aplikasi Premium: Alight Motion, CapCut, Wink, dll.)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  usage_rules TEXT NOT NULL DEFAULT '1. Dilarang mengubah password atau profil akun.\n2. Gunakan sesuai batas perangkat yang ditentukan.\n3. Melanggar aturan akan menghanguskan garansi.',
  image_url TEXT,
  promo_badge TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------------------
-- 3. TABEL PRODUCT VARIANTS (Pilihan Paket Durasi, Harga Integer, & Promo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,                   -- Contoh: "Sharing 1 Bulan", "Private 1 Tahun"
  duration TEXT NOT NULL,               -- Contoh: "30 Hari", "365 Hari"
  price INTEGER NOT NULL,               -- Harga normal dalam Rupiah penuh (INTEGER)
  promo_price INTEGER,                  -- Harga promo dalam Rupiah penuh (INTEGER)
  promo_day_of_week TEXT,               -- 'Monday'..'Sunday' | NULL
  promo_specific_date TEXT,             -- Format 'MM-DD' (contoh: '11-11') | NULL
  promo_start_at TEXT,                  -- ISO Datetime mulai promo bebas | NULL
  promo_end_at TEXT,                    -- ISO Datetime selesai promo bebas | NULL
  is_custom_gmail INTEGER NOT NULL DEFAULT 0 CHECK (is_custom_gmail IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 4. TABEL ACCOUNT STOCKS (Stok Akun Terenkripsi AES-256-GCM & Anti-Race Lock)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS account_stocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  variant_id TEXT NOT NULL,
  encrypted_account_data TEXT NOT NULL, -- Terenkripsi AES-256-GCM (email|pw atau email|pw|link)
  format_type TEXT NOT NULL DEFAULT 'two_columns' CHECK (format_type IN ('two_columns', 'three_columns')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
  reserved_until TEXT,                  -- ISO Timestamp batas waktu lock 10 menit
  sold_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE
);

-- ----------------------------------------------------------------------------
-- 5. TABEL TRANSACTIONS / INVOICES (Pembayaran QRIS Dinamis & Pengiriman)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,                  -- Internal ID: INV-YYYYMMDD-XXXX
  invoice_token TEXT NOT NULL UNIQUE,   -- UUID v4 / 64-char Crypto Token untuk URL Invoice
  customer_email TEXT NOT NULL,         -- Gmail pembeli untuk pengiriman invoice otomatis
  custom_gmail_account TEXT,            -- Diisi pembeli jika memilih paket Custom Gmail
  variant_id TEXT NOT NULL,
  account_stock_id INTEGER,             -- Merujuk ke account_stocks.id yang di-lock/terjual
  base_amount INTEGER NOT NULL,         -- Harga paket saat checkout (INTEGER)
  unique_code INTEGER NOT NULL DEFAULT 0, -- Kode unik mutasi QRIS (1 s/d 299)
  total_amount INTEGER NOT NULL,        -- base_amount + unique_code (INTEGER)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('lunas', 'pending', 'expired', 'dibatalkan', 'failed')),
  custom_gmail_status TEXT NOT NULL DEFAULT 'not_applicable' CHECK (custom_gmail_status IN ('not_applicable', 'waiting_admin', 'completed')),
  payment_gateway_ref TEXT,             -- ID referensi dari webhook mutasi / payment listener
  qris_dynamic_string TEXT,             -- String payload QRIS Dinamis
  delivered_account_data TEXT,          -- Data akun terenkripsi yang disalin saat lunas
  expires_at TEXT NOT NULL,             -- Waktu kedaluwarsa QRIS (created_at + 10 menit)
  paid_at TEXT,
  email_sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT,
  FOREIGN KEY (account_stock_id) REFERENCES account_stocks(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- 6. TABEL SYSTEM LOGS (Audit Trail untuk Keamanan, Webhook, & Aktivitas Admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error', 'security')),
  module TEXT NOT NULL,                 -- Contoh: 'AUTH', 'WEBHOOK_QRIS', 'STOCK_UPLOAD', 'INVOICE'
  message TEXT NOT NULL,
  metadata TEXT,                        -- JSON string untuk detail payload/debug
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- INDEXING (Optimasi Kecepatan Query SQLite / Cloudflare D1)
-- ============================================================================

-- Index pencarian stok ready & pelepasan stok expired (Anti-Race Condition)
CREATE INDEX IF NOT EXISTS idx_account_stocks_lookup 
  ON account_stocks(variant_id, status, reserved_until);

-- Index pencocokan pembayaran QRIS otomatis via Webhook (berdasarkan status & nominal unik)
CREATE INDEX IF NOT EXISTS idx_transactions_webhook_match 
  ON transactions(status, total_amount, expires_at);

-- Index pencarian URL Invoice menggunakan Token Kriptografi
CREATE INDEX IF NOT EXISTS idx_transactions_token 
  ON transactions(invoice_token);

-- Index halaman Admin: Antrean Custom Gmail & History Pembelian
CREATE INDEX IF NOT EXISTS idx_transactions_custom_gmail 
  ON transactions(custom_gmail_status, status);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
  ON transactions(created_at DESC);

-- Index referensi eksternal mutasi (mencegah replay attack / double webhook)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_gateway_ref 
  ON transactions(payment_gateway_ref) WHERE payment_gateway_ref IS NOT NULL;
  