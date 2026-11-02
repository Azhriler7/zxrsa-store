-- ============================================================================
-- FILE: server/database/migrations/0002_testimonies_and_faqs.sql
-- DESKRIPSI: Tabel Testimoni (Review Pembeli + Input Admin) & Tabel FAQ Dinamis
-- ============================================================================

CREATE TABLE IF NOT EXISTS testimonials (
  id TEXT PRIMARY KEY,
  transaction_id TEXT UNIQUE,
  customer_email TEXT NOT NULL,
  masked_email TEXT NOT NULL,
  product_package_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_approved INTEGER NOT NULL DEFAULT 0, -- 1 = Tampil di Homepage, 0 = Sembunyikan
  source TEXT NOT NULL DEFAULT 'customer', -- 'customer' | 'admin'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed Data Awal FAQ agar halaman depan langsung terisi
INSERT OR IGNORE INTO faqs (id, question, answer, sort_order, is_active) VALUES
('faq_01', 'Bagaimana cara kerja pembayaran QRIS Dinamis di ZXRSA Store?', 'Saat Anda menekan tombol bayar, sistem membuat kode QRIS Dinamis yang sudah berisi nominal harga beserta kode unik otomatis. Anda cukup scan dari m-banking atau e-wallet tanpa perlu mengetik nominal lagi.', 1, 1),
('faq_02', 'Berapa lama akun dikirim setelah saya membayar?', 'Untuk paket reguler (Stok Toko), akun akan langsung muncul di layar halaman Invoice Anda dan dikirim otomatis ke Gmail Anda detik itu juga setelah status pembayaran berubah menjadi LUNAS.', 2, 1),
('faq_03', 'Bagaimana jika waktu pembayaran QRIS 10 menit habis (Expired)?', 'Jika lewat 10 menit belum dibayar, status invoice otomatis berubah menjadi EXPIRED dan stok akun dilepas kembali. Silakan buat pesanan baru di halaman Pilih Paket.', 3, 1),
('faq_04', 'Apakah akun memiliki garansi?', 'Ya, seluruh akun bergaransi penuh sesuai durasi paket selama Anda mematuhi Aturan Pemakaian yang tertera di halaman Invoice dan Email.', 4, 1);

-- Seed Data Awal Testimoni
INSERT OR IGNORE INTO testimonials (id, customer_email, masked_email, product_package_name, rating, comment, is_approved, source) VALUES
('tst_01', 'rizkypratama99@gmail.com', 'riz***@gmail.com', 'Alight Motion Pro — Private 1 Tahun', 5, 'Bayar pakai QRIS gak sampai 3 detik langsung berubah Lunas dan akun langsung masuk ke Gmail. Anti ribet!', 1, 'admin'),
('tst_02', 'nadiaputri.id@gmail.com', 'nad***@gmail.com', 'Wink VIP — Sharing 1 Bulan', 5, 'Awalnya ragu, ternyata beneran otomatis tengah malam pun langsung dikirim akunnya. Fitur HD Enhancer jalan lancar.', 1, 'admin'),
('tst_03', 'dimasanggara21@gmail.com', 'dim***@gmail.com', 'CapCut Pro — Custom Gmail 1 Bulan', 4, 'Pesan paket Custom Gmail buat akun pribadi, adminnya gercep banget konfirmasinya dan langsung dapat email invoice resmi.', 1, 'admin');