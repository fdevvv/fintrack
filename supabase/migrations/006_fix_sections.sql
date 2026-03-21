-- Fix: ensure PRESTAMOS transactions have section = 'PRESTAMOS' (not OTROS)
UPDATE transactions
SET section = 'PRESTAMOS'
WHERE payment_method = 'transfer'
  AND installment_total > 1
  AND section = 'OTROS'
  AND deleted_at IS NULL;

-- Fix: ensure all credit_card transactions have a card section (not OTROS)
UPDATE transactions
SET section = 'VISA'
WHERE payment_method = 'credit_card'
  AND section = 'OTROS'
  AND deleted_at IS NULL
  AND installment_total > 1;

-- Verify: these should return 0 rows (no false positives in "Gastos del Mes")
-- SELECT * FROM transactions
-- WHERE payment_method IN ('cash','transfer','qr_debit','debit_card')
--   AND (section IS NULL OR section = 'OTROS')
--   AND (installment_total IS NULL OR installment_total <= 1)
--   AND deleted_at IS NULL;
