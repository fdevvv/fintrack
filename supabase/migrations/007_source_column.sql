-- Add source column to distinguish manual vs imported
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
  CHECK (source IN ('manual', 'imported', 'seed'));

-- Mark all SEED_DATA (migrated) transactions as 'seed'
UPDATE transactions
SET source = 'seed'
WHERE deleted_at IS NULL
  AND source = 'manual'
  AND (installment_total > 1 OR section IN ('VISA', 'MASTERCARD', 'PRESTAMOS'));

-- Mark any PDF-imported ones as 'imported'
UPDATE transactions
SET source = 'imported'
WHERE deleted_at IS NULL
  AND source = 'manual'
  AND payment_method = 'credit_card'
  AND section IN ('VISA', 'MASTERCARD');

-- Result: only truly manual gastos (cash/QR/transfer daily) keep source = 'manual'
