-- ============================================================
-- Migration 010: monthly_balance view
-- Implementa la lógica Detalle (tarjeta/cuotas) vs Mes (manual)
--
-- Regla de negocio:
--   "Detalle" impacta en el mes SIGUIENTE al gasto
--   → las cuotas de tarjeta de Marzo se descuentan del ingreso de Abril
--
-- Fórmulas:
--   disponible_inicial = ingreso_neto - cuotas_mes_anterior
--   disponible_actual  = disponible_inicial - gastos_mes
--
-- Tablas reales del proyecto:
--   transactions (type='expense', source='imported'|'manual')
--   monthly_income (year INT, month INT 1-12, amount_cents BIGINT)
-- ============================================================

CREATE OR REPLACE VIEW monthly_balance AS
WITH
-- Todos los meses donde hay datos del usuario
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
-- Mes anterior para el JOIN de cuotas (maneja cruce de año ene→dic)
meses_con_prev AS (
  SELECT
    user_id,
    year,
    month,
    CASE WHEN month = 1 THEN year - 1 ELSE year END AS prev_year,
    CASE WHEN month = 1 THEN 12   ELSE month - 1 END AS prev_month
  FROM meses
),
-- Ingresos netos del mes
ingresos AS (
  SELECT user_id, year, month, amount_cents AS ingreso_neto
  FROM monthly_income
),
-- Gastos de tarjeta/cuotas (source='imported' o 'seed') — impactan el mes siguiente
cuotas AS (
  SELECT
    user_id,
    year,
    EXTRACT(MONTH FROM transaction_date)::INT AS month,
    SUM(amount_cents) AS total_cuotas
  FROM transactions
  WHERE deleted_at IS NULL
    AND type = 'expense'
    AND source IN ('imported', 'seed')
  GROUP BY user_id, year, EXTRACT(MONTH FROM transaction_date)::INT
),
-- Gastos directos/manuales (source='manual') — impactan el mes actual
gastos AS (
  SELECT
    user_id,
    year,
    EXTRACT(MONTH FROM transaction_date)::INT AS month,
    SUM(amount_cents) AS gastos_mes
  FROM transactions
  WHERE deleted_at IS NULL
    AND type = 'expense'
    AND source = 'manual'
  GROUP BY user_id, year, EXTRACT(MONTH FROM transaction_date)::INT
)
SELECT
  mp.user_id,
  mp.year,
  mp.month,
  COALESCE(i.ingreso_neto,     0) AS ingreso_neto,
  COALESCE(c_prev.total_cuotas, 0) AS cuotas_mes_anterior,
  (COALESCE(i.ingreso_neto, 0) - COALESCE(c_prev.total_cuotas, 0))
    AS disponible_inicial,
  COALESCE(g.gastos_mes, 0) AS gastos_mes,
  (COALESCE(i.ingreso_neto, 0) - COALESCE(c_prev.total_cuotas, 0) - COALESCE(g.gastos_mes, 0))
    AS disponible_actual
FROM meses_con_prev mp
LEFT JOIN ingresos i
  ON  i.user_id = mp.user_id
  AND i.year    = mp.year
  AND i.month   = mp.month
LEFT JOIN cuotas c_prev
  ON  c_prev.user_id = mp.user_id
  AND c_prev.year    = mp.prev_year
  AND c_prev.month   = mp.prev_month
LEFT JOIN gastos g
  ON  g.user_id = mp.user_id
  AND g.year    = mp.year
  AND g.month   = mp.month
ORDER BY mp.year, mp.month;

-- Permisos para el rol authenticated (PostgREST / Supabase)
GRANT SELECT ON monthly_balance TO authenticated;
GRANT SELECT ON monthly_balance TO anon;
