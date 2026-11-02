-- ============================================================================
-- FILE: server/database/seed.sql
-- DESKRIPSI: Master Seed Data Bersih untuk ZXRSA Store (D1 Database)
-- ============================================================================

-- 1. AKUN ADMINISTRATOR UTAMA
-- Email   : admin@zxrsa.store
-- Password: ZxrsaAdmin123
INSERT OR REPLACE INTO users (id, email, password_hash, role, created_at, updated_at)
VALUES (
  'usr_admin_01',
  'admin@zxrsa.store',
  'zxrsasalt2026:f0d2fe428193583f2e998ccb3d41e7974004f04ca3767d9f1b547622614666a1',
  'admin',
  datetime('now'),
  datetime('now')
);

-- 2. PRODUK APLIKASI PREMIUM AWAL (Tanpa Stok Dummy agar mudah dihapus/diedit)
INSERT OR REPLACE INTO products (id, name, slug, description, usage_rules, image_url, promo_badge, is_active, created_at, updated_at)
VALUES
  (
    'prd_am_01',
    'Alight Motion Pro',
    'alight-motion-pro-am01',
    'Akses penuh seluruh efek premium, tanpa watermark, dan ekspor kualitas 4K 60fps.',
    '1. Dilarang mengubah password atau informasi profil akun.\n2. Maksimal login pada 1 perangkat.\n3. Melanggar aturan akan menghanguskan garansi.',
    NULL,
    'BEST SELLER',
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'prd_wink_02',
    'Wink VIP',
    'wink-vip-wk02',
    'Fitur AI Video Enhancer, HD Retouch, dan penghapus objek otomatis tanpa batas.',
    '1. Hanya untuk penggunaan pribadi (1 perangkat).\n2. Dilarang melakukan log out atau mengutak-atik pengaturan keamanan akun.\n3. Klaim garansi wajib menyertakan bukti nomor Invoice.',
    NULL,
    'HOT PROMO',
    1,
    datetime('now'),
    datetime('now')
  ),
  (
    'prd_cc_03',
    'CapCut Pro',
    'capcut-pro-cc03',
    'Buka seluruh template Pro, efek transisi eksklusif, auto-captions, dan penyimpanan Cloud.',
    '1. Untuk paket Sharing dilarang menghapus proyek pengguna lain.\n2. Untuk paket Custom Gmail pastikan alamat Gmail yang dikirim sudah benar.\n3. Garansi penuh sesuai durasi paket.',
    NULL,
    NULL,
    1,
    datetime('now'),
    datetime('now')
  );

-- 3. VARIAN PAKET & JADWAL PROMO AWAL
INSERT OR REPLACE INTO product_variants (
  id, product_id, name, duration, price, promo_price,
  promo_day_of_week, promo_specific_date, promo_start_at, promo_end_at,
  is_custom_gmail, is_active, created_at, updated_at
)
VALUES
  ('var_am_priv_1y', 'prd_am_01', 'Private 1 Tahun', '1 Tahun', 25000, 18000, '5', NULL, NULL, NULL, 0, 1, datetime('now'), datetime('now')),
  ('var_am_custom_1y', 'prd_am_01', 'Custom Gmail 1 Tahun', '1 Tahun', 35000, NULL, NULL, NULL, NULL, NULL, 1, 1, datetime('now'), datetime('now')),
  ('var_wink_priv_1m', 'prd_wink_02', 'Private 1 Bulan', '30 Hari', 20000, 15000, NULL, NULL, NULL, NULL, 0, 1, datetime('now'), datetime('now')),
  ('var_cc_custom_1m', 'prd_cc_03', 'Custom Gmail 1 Bulan', '30 Hari', 30000, NULL, NULL, NULL, NULL, NULL, 1, 1, datetime('now'), datetime('now'));

-- 4. DATA TESTIMONI AWAL (Tampil di Infinite Marquee Homepage)
INSERT OR REPLACE INTO testimonials (id, transaction_id, customer_email, masked_email, product_package_name, rating, comment, is_approved, source, created_at)
VALUES
  ('tst_01', NULL, 'rizkypratama99@gmail.com', 'riz***@gmail.com', 'Alight Motion Pro — Private 1 Tahun', 5, 'Bayar pakai QRIS gak sampai 3 detik langsung berubah Lunas dan akun langsung masuk ke Gmail. Anti ribet!', 1, 'admin', datetime('now')),
  ('tst_02', NULL, 'nadiaputri.id@gmail.com', 'nad***@gmail.com', 'Wink VIP — Private 1 Bulan', 5, 'Awalnya ragu, ternyata beneran otomatis tengah malam pun langsung dikirim akunnya. Fitur HD Enhancer jalan lancar.', 1, 'admin', datetime('now')),
  ('tst_03', NULL, 'dimasanggara21@gmail.com', 'dim***@gmail.com', 'CapCut Pro — Custom Gmail 1 Bulan', 5, 'Pesan paket Custom Gmail buat akun pribadi, adminnya gercep banget konfirmasinya dan langsung dapat email invoice resmi.', 1, 'admin', datetime('now')),
  ('tst_04', NULL, 'fajar.kurniawan@gmail.com', 'faj***@gmail.com', 'Alight Motion Pro — Custom Gmail 1 Tahun', 4, 'Harga paling terjangkau dan bergaransi resmi. Sangat terbantu buat kebutuhan edit konten harian.', 1, 'admin', datetime('now'));

-- 5. DATA FAQ AWAL
INSERT OR REPLACE INTO faqs (id, question, answer, sort_order, is_active, created_at, updated_at)
VALUES
  ('faq_01', 'Bagaimana cara kerja pembayaran QRIS Dinamis di ZXRSA Store?', 'Saat Anda menekan tombol bayar, sistem membuat kode QRIS Dinamis yang sudah berisi nominal harga beserta kode unik otomatis. Anda cukup scan dari m-banking atau e-wallet tanpa perlu mengetik nominal lagi.', 1, 1, datetime('now'), datetime('now')),
  ('faq_02', 'Berapa lama akun dikirim setelah saya membayar?', 'Untuk paket reguler (Stok Toko), akun akan langsung muncul di layar halaman Invoice Anda dan dikirim otomatis ke Gmail Anda detik itu juga setelah status pembayaran berubah menjadi LUNAS. Untuk paket Custom Gmail, Admin akan memproses aktivasi terlebih dahulu lalu mengirimkan email konfirmasi.', 2, 1, datetime('now'), datetime('now')),
  ('faq_03', 'Bagaimana jika waktu pembayaran QRIS 10 menit habis (Expired)?', 'Jika lewat 10 menit belum dibayar, status invoice otomatis berubah menjadi EXPIRED dan stok akun dilepas kembali. Silakan buat pesanan baru di halaman Pilih Paket.', 3, 1, datetime('now'), datetime('now')),
  ('faq_04', 'Apakah akun memiliki garansi?', 'Ya, seluruh akun bergaransi penuh sesuai durasi paket selama Anda mematuhi Aturan Pemakaian yang tertera di halaman Invoice dan Email.', 4, 1, datetime('now'), datetime('now'));