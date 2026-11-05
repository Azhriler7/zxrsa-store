-- ============================================================================
-- FILE: server/database/migrations/0004_add_variant_rules_and_tutorial.sql
-- DESKRIPSI: Menambahkan kolom usage_rules (Aturan) dan tutorial_text (Tutorial)
--            pada tabel product_variants (tiap paket).
-- ============================================================================

ALTER TABLE product_variants ADD COLUMN usage_rules TEXT;
ALTER TABLE product_variants ADD COLUMN tutorial_text TEXT;