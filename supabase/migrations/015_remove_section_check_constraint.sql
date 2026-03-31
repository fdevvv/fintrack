-- ============================================================
-- Migration 015: Remove hardcoded section CHECK constraint
-- Allows custom user sections (e.g. "Naranja X") beyond the
-- original fixed set (VISA, MASTERCARD, OTROS, PRESTAMOS).
-- The user_sections table (migration 012) already handles
-- validation at the application level.
-- ============================================================

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_section_check;
