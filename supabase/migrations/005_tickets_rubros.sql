-- ============================================================
-- Migration 005: Gastos del Mes + Rubro management
-- (ticket_items, ticket_image_url, ticket_total removed in 009)
-- ============================================================

-- Index for "gastos del mes" queries (payment method filtering)
CREATE INDEX IF NOT EXISTS idx_tx_payment_method ON transactions(user_id, payment_method, transaction_date DESC)
  WHERE deleted_at IS NULL;

-- Allow categories to be edited (remove is_default constraint for user-created ones)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS editable BOOLEAN DEFAULT TRUE;

-- Update existing default categories to be non-editable
UPDATE categories SET editable = FALSE WHERE is_default = TRUE;

-- Enable Supabase Storage bucket for ticket images (run in Supabase dashboard > Storage > New Bucket)
-- Bucket name: tickets
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp
