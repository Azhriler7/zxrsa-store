-- ============================================================================
-- FILE: server/database/migrations/0003_add_variant_description.sql
-- DESKRIPSI: Menambahkan kolom description pada setiap varian paket
-- ============================================================================

ALTER TABLE product_variants ADD COLUMN description TEXT;