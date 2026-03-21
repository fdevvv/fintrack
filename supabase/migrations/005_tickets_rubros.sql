-- ============================================================
-- Migration 005: Ticket OCR + Gastos del Mes + Rubro management
-- ============================================================

-- Add ticket data to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS ticket_items JSONB;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS ticket_image_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS ticket_total BIGINT;

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
