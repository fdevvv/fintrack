-- ============================================================
-- Migration 002: Sections (tarjetas), Installments (cuotas),
-- USD tracking, and yearly data support
-- ============================================================

-- Add section (tarjeta) to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS section TEXT DEFAULT 'OTROS'
  CHECK (section IN ('VISA', 'MASTERCARD', 'OTROS', 'PRESTAMOS'));

-- Add installment (cuota) fields
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_current INT DEFAULT 1;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_total INT DEFAULT 1;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_group_id UUID; -- links related installments

-- Add USD tracking
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS usd_amount NUMERIC(12,2);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS usd_rate NUMERIC(12,2);

-- Add year field for quick filtering
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS year INT;

-- Update existing rows
UPDATE transactions SET year = EXTRACT(YEAR FROM transaction_date) WHERE year IS NULL;

-- Index for year-based queries
CREATE INDEX IF NOT EXISTS idx_tx_user_year ON transactions(user_id, year, section)
  WHERE deleted_at IS NULL;

-- ============================================================
-- YEARLY INCOME TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INT NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  amount_cents BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ARS' CHECK (currency IN ('ARS', 'USD')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, year, month, currency)
);

ALTER TABLE monthly_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY monthly_income_all ON monthly_income FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_income_user_year ON monthly_income(user_id, year);

-- ============================================================
-- USER YEARS TABLE (track which years a user has data for)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INT NOT NULL CHECK (year >= 2020 AND year <= 2100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, year)
);

ALTER TABLE user_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_years_all ON user_years FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Update categories with control-g defaults
-- ============================================================
CREATE OR REPLACE FUNCTION seed_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, color, type, is_default) VALUES
    (p_user_id, 'Ropa',              '👕', '#e070b0', 'expense', true),
    (p_user_id, 'Calzado',           '👟', '#7c6cf0', 'expense', true),
    (p_user_id, 'Verdulería',        '🥬', '#2dd4a8', 'expense', true),
    (p_user_id, 'Carnicería',        '🥩', '#f06070', 'expense', true),
    (p_user_id, 'Supermercado',      '🛒', '#22c55e', 'expense', true),
    (p_user_id, 'Perfumería',        '🧴', '#a8a0f8', 'expense', true),
    (p_user_id, 'Delivery',          '🛵', '#f0a848', 'expense', true),
    (p_user_id, 'Suplementos',       '💊', '#60a8f0', 'expense', true),
    (p_user_id, 'Electrodoméstico',  '🔌', '#40d8b0', 'expense', true),
    (p_user_id, 'Salidas',           '🍻', '#f0a080', 'expense', true),
    (p_user_id, 'Entradas fiestas',  '🎟️', '#70d8d8', 'expense', true),
    (p_user_id, 'Servicios',         '🛡️', '#b0b8c8', 'expense', true),
    (p_user_id, 'Otros',             '📦', '#707888', 'expense', true),
    (p_user_id, 'Suscripciones',     '💳', '#7c6cf0', 'expense', true),
    (p_user_id, 'Prestamos',         '🏦', '#f06070', 'expense', true),
    (p_user_id, 'Combustible',       '⛽', '#e08060', 'expense', true),
    (p_user_id, 'Sueldo',            '💰', '#2dd4a8', 'income',  true),
    (p_user_id, 'Freelance',         '💻', '#60a8f0', 'income',  true),
    (p_user_id, 'Otros ingresos',    '💵', '#707888', 'income',  true)
  ON CONFLICT (user_id, name, type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Updated views with sections
-- ============================================================
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  user_id,
  currency,
  year,
  EXTRACT(MONTH FROM transaction_date)::INT AS month,
  SUM(CASE WHEN type = 'income' THEN amount_cents ELSE 0 END) AS total_income_cents,
  SUM(CASE WHEN type = 'expense' THEN amount_cents ELSE 0 END) AS total_expense_cents,
  SUM(CASE WHEN type = 'income' THEN amount_cents ELSE -amount_cents END) AS balance_cents,
  COUNT(*) AS transaction_count
FROM transactions
WHERE deleted_at IS NULL
GROUP BY user_id, currency, year, EXTRACT(MONTH FROM transaction_date);

CREATE OR REPLACE VIEW section_monthly_totals AS
SELECT
  user_id,
  currency,
  year,
  section,
  EXTRACT(MONTH FROM transaction_date)::INT AS month,
  SUM(amount_cents) AS total_cents,
  COUNT(*) AS transaction_count
FROM transactions
WHERE deleted_at IS NULL AND type = 'expense'
GROUP BY user_id, currency, year, section, EXTRACT(MONTH FROM transaction_date);

CREATE OR REPLACE VIEW category_monthly_spending AS
SELECT
  t.user_id,
  t.currency,
  t.category_id,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  t.year,
  EXTRACT(MONTH FROM t.transaction_date)::INT AS month,
  SUM(t.amount_cents) AS total_cents,
  COUNT(*) AS transaction_count
FROM transactions t
LEFT JOIN categories c ON c.id = t.category_id
WHERE t.deleted_at IS NULL AND t.type = 'expense'
GROUP BY t.user_id, t.currency, t.category_id, c.name, c.icon, c.color,
         t.year, EXTRACT(MONTH FROM t.transaction_date);
