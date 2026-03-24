-- ============================================================
-- Migration 011: simplify monthly_balance view
-- Elimina la lógica de cuotas/tarjeta.
-- Fórmula: disponible_actual = ingreso_neto - gastos_mes
-- gastos_mes = todos los gastos del mes (manual + importado)
-- ============================================================

DROP VIEW IF EXISTS monthly_balance;

CREATE VIEW monthly_balance AS
WITH
meses AS (
  SELECT DISTINCT
    user_id,
    year,
    EXTRACT(MONTH FROM transaction_date)::INT AS month
  FROM transactions
  WHERE deleted_at IS NULL
    AND type = 'expense'
  UNION
  SELECT user_id, year, month
  FROM monthly_income
),
ingresos AS (
  SELECT user_id, year, month, amount_cents AS ingreso_neto
  FROM monthly_income
),
gastos AS (
  SELECT
    user_id,
    year,
    EXTRACT(MONTH FROM transaction_date)::INT AS month,
    SUM(amount_cents) AS gastos_mes
  FROM transactions
  WHERE deleted_at IS NULL
    AND type = 'expense'
  GROUP BY user_id, year, EXTRACT(MONTH FROM transaction_date)::INT
)
SELECT
  m.user_id,
  m.year,
  m.month,
  COALESCE(i.ingreso_neto, 0) AS ingreso_neto,
  COALESCE(g.gastos_mes,   0) AS gastos_mes,
  (COALESCE(i.ingreso_neto, 0) - COALESCE(g.gastos_mes, 0)) AS disponible_actual
FROM meses m
LEFT JOIN ingresos i
  ON  i.user_id = m.user_id
  AND i.year    = m.year
  AND i.month   = m.month
LEFT JOIN gastos g
  ON  g.user_id = m.user_id
  AND g.year    = m.year
  AND g.month   = m.month
ORDER BY m.year, m.month;

GRANT SELECT ON monthly_balance TO authenticated;
GRANT SELECT ON monthly_balance TO anon;
