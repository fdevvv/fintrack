-- ============================================================
-- Migration 017: columna is_card en user_sections
-- Distingue tarjetas de crédito (para importar PDF) de
-- secciones de gasto (Otros, Préstamos, etc).
-- ============================================================

ALTER TABLE user_sections ADD COLUMN IF NOT EXISTS is_card BOOLEAN NOT NULL DEFAULT false;

-- Marcar VISA y MASTERCARD existentes como tarjetas
UPDATE user_sections SET is_card = true WHERE key IN ('VISA', 'MASTERCARD');
