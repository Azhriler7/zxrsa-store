-- ============================================================================
-- FILE: server/database/seed.sql
-- DESKRIPSI: Data Awal Akun Admin & Contoh Produk Aplikasi Premium
-- ============================================================================

-- 1. Seed Akun Admin Default
-- Catatan: Password default di bawah adalah hash untuk "AdminZxrsa2026!" 
-- (Nanti bisa diubah via script/dashboard)
INSERT OR IGNORE INTO users (id, email, password_hash, role)
VALUES (
  'usr_admin_01',
  'admin@zxrsa.store',
  'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f:8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  'admin'
);

-- 2. Seed Produk Aplikasi Premium (Alight Motion, CapCut, Wink)
INSERT OR IGNORE INTO products (id, name, slug, description, usage_rules, promo_badge, is_active)
VALUES 
  (
    'prd_am_pro',
    'Alight Motion Pro',
    'alight-motion-pro',
    'Akses penuh fitur efek premium, tanpa watermark, ekspor XML/4K 60fps untuk Android & iOS.',
    '1. Login hanya melalui metode yang diberikan pada detail akun.\n2. Dilarang membagikan akses akun ke orang lain.\n3. Garansi penuh selama masa aktif berjalan.',
    'BEST SELLER',
    1
  ),
  (
    'prd_wink_vip',
    'Wink VIP Premium',
    'wink-vip-premium',
    'Fitur AI Video Restoration, HD Quality Enhancer, dan seluruh template VIP tanpa batas.',
    '1. Maksimal login pada 1 perangkat.\n2. Dilarang mengubah kata sandi akun.\n3. Klaim garansi wajib menyertakan nomor Invoice.',
    'HOT PROMO',
    1
  ),
  (
    'prd_capcut_pro',
    'CapCut Pro',
    'capcut-pro',
    'Buka semua efek Pro, transisi eksklusif, Auto Captions, dan penyimpanan Cloud.',
    '1. Akun Private/Sharing sesuai paket yang dipilih.\n2. Dilarang melakukan perubahan email/password pada akun.\n3. Simpan bukti invoice untuk klaim garansi.',
    NULL,
    1
  );

-- 3. Seed Varian Paket (Termasuk Paket Biasa dari Stok .txt & Paket Custom Gmail)
INSERT OR IGNORE INTO product_variants (id, product_id, name, duration, price, promo_price, is_custom_gmail, is_active)
VALUES
  ('var_am_1y_stock', 'prd_am_pro', 'Private 1 Tahun (Akun Toko)', '1 Tahun', 25000, 18000, 0, 1),
  ('var_am_1y_custom', 'prd_am_pro', 'Private 1 Tahun (Custom Gmail Pembeli)', '1 Tahun', 35000, 29000, 1, 1),
  ('var_wink_1m_stock', 'prd_wink_vip', 'VIP 1 Bulan (Akun Toko)', '30 Hari', 20000, NULL, 0, 1),
  ('var_cc_1m_stock', 'prd_capcut_pro', 'Pro 1 Bulan (Akun Toko)', '30 Hari', 22000, 19000, 0, 1);