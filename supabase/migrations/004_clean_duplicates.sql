-- Clean duplicate transactions (from running seed twice)
-- Keeps only the FIRST transaction per unique combination
DELETE FROM transactions
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, item_name, section, amount_cents, transaction_date, installment_current)
    id
  FROM transactions
  WHERE deleted_at IS NULL
  ORDER BY user_id, item_name, section, amount_cents, transaction_date, installment_current, created_at ASC
);
