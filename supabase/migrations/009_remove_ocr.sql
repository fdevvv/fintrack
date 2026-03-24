-- ============================================================
-- Migration 009: Remove OCR / ticket scanning columns
-- ============================================================

-- Drop ticket data columns from transactions
ALTER TABLE transactions DROP COLUMN IF EXISTS ticket_items;
ALTER TABLE transactions DROP COLUMN IF EXISTS ticket_image_url;
ALTER TABLE transactions DROP COLUMN IF EXISTS ticket_total;

-- Note: the 'tickets' Storage bucket can be deleted manually in
-- Supabase dashboard > Storage > tickets > Delete bucket
-- (only do this after ensuring no other feature uses it)
