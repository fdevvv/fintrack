-- ============================================================
-- FinTrack Database Schema
-- PostgreSQL (Supabase)
-- 
-- Design decisions:
-- 1. BIGINT for money (cents) — never floats
-- 2. RLS on every table — multi-tenant security at DB level
-- 3. Composite indexes on (user_id, date) for query perf
-- 4. Soft-delete via deleted_at for audit trail
-- 5. CHECK constraints for data integrity
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  preferred_currency TEXT NOT NULL DEFAULT 'ARS' 
    CHECK (preferred_currency IN ('ARS', 'USD')),
  monthly_income_cents BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#6366f1',
  type TEXT NOT NULL DEFAULT 'expense' 
    CHECK (type IN ('income', 'expense')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, name, type)
);

CREATE INDEX idx_categories_user ON categories(user_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Money: stored as integer cents. $150.50 = 15050
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'ARS' 
    CHECK (currency IN ('ARS', 'USD')),
  
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  payment_method TEXT NOT NULL DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'transfer', 'qr_debit', 'credit_card', 'debit_card')),
  
  description TEXT,
  item_name TEXT, -- for price tracking over time
  
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- soft delete
);

-- Critical indexes for performance
CREATE INDEX idx_tx_user_date ON transactions(user_id, transaction_date DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_tx_user_category ON transactions(user_id, category_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_tx_user_type ON transactions(user_id, type, transaction_date DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_tx_item_name ON transactions(user_id, item_name, transaction_date DESC)
  WHERE deleted_at IS NULL AND item_name IS NOT NULL;

-- ============================================================
-- BUDGETS (monthly limits per category)
-- ============================================================
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  
  limit_cents BIGINT NOT NULL CHECK (limit_cents > 0),
  currency TEXT NOT NULL DEFAULT 'ARS'
    CHECK (currency IN ('ARS', 'USD')),
  
  year INT NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month INT NOT NULL CHECK (month >= 1 AND month <= 12),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, category_id, year, month, currency)
);

CREATE INDEX idx_budgets_user_period ON budgets(user_id, year, month);

-- ============================================================
-- PRICE_HISTORY (track item prices over time)
-- ============================================================
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  
  item_name TEXT NOT NULL,
  unit_price_cents BIGINT NOT NULL CHECK (unit_price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'ARS'
    CHECK (currency IN ('ARS', 'USD')),
  
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_user_item ON price_history(user_id, item_name, recorded_date DESC);

-- Auto-track prices when transaction has item_name
CREATE OR REPLACE FUNCTION track_item_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.item_name IS NOT NULL AND NEW.type = 'expense' THEN
    INSERT INTO price_history (user_id, transaction_id, item_name, unit_price_cents, currency, recorded_date)
    VALUES (NEW.user_id, NEW.id, NEW.item_name, NEW.amount_cents, NEW.currency, NEW.transaction_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_insert
  AFTER INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION track_item_price();

-- ============================================================
-- UPDATED_AT TRIGGER (reusable)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (critical for multi-tenant)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Categories: users own their categories
CREATE POLICY categories_all ON categories FOR ALL
  USING (auth.uid() = user_id);

-- Transactions: users own their transactions
CREATE POLICY transactions_all ON transactions FOR ALL
  USING (auth.uid() = user_id);

-- Budgets: users own their budgets
CREATE POLICY budgets_all ON budgets FOR ALL
  USING (auth.uid() = user_id);

-- Price history: users own their price data
CREATE POLICY price_history_all ON price_history FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- DEFAULT CATEGORIES (seeded per user via function)
-- ============================================================
CREATE OR REPLACE FUNCTION seed_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, color, type, is_default) VALUES
    (p_user_id, 'Supermercado',    '🛒', '#22c55e', 'expense', true),
    (p_user_id, 'Transporte',      '🚌', '#3b82f6', 'expense', true),
    (p_user_id, 'Entretenimiento', '🎬', '#a855f7', 'expense', true),
    (p_user_id, 'Comida afuera',   '🍔', '#f97316', 'expense', true),
    (p_user_id, 'Servicios',       '💡', '#eab308', 'expense', true),
    (p_user_id, 'Salud',           '🏥', '#ef4444', 'expense', true),
    (p_user_id, 'Ropa',            '👕', '#ec4899', 'expense', true),
    (p_user_id, 'Hogar',           '🏠', '#14b8a6', 'expense', true),
    (p_user_id, 'Educación',       '📚', '#6366f1', 'expense', true),
    (p_user_id, 'Otros',           '📦', '#64748b', 'expense', true),
    (p_user_id, 'Sueldo',          '💰', '#22c55e', 'income',  true),
    (p_user_id, 'Freelance',       '💻', '#3b82f6', 'income',  true),
    (p_user_id, 'Inversiones',     '📈', '#a855f7', 'income',  true),
    (p_user_id, 'Otros ingresos',  '💵', '#64748b', 'income',  true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ANALYTICS VIEWS (pre-computed for dashboard performance)
-- ============================================================

-- Monthly summary per user
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  user_id,
  currency,
  DATE_TRUNC('month', transaction_date)::DATE AS month,
  SUM(CASE WHEN type = 'income' THEN amount_cents ELSE 0 END) AS total_income_cents,
  SUM(CASE WHEN type = 'expense' THEN amount_cents ELSE 0 END) AS total_expense_cents,
  SUM(CASE WHEN type = 'income' THEN amount_cents ELSE -amount_cents END) AS balance_cents,
  COUNT(*) AS transaction_count
FROM transactions
WHERE deleted_at IS NULL
GROUP BY user_id, currency, DATE_TRUNC('month', transaction_date);

-- Category spending per month
CREATE OR REPLACE VIEW category_monthly_spending AS
SELECT
  t.user_id,
  t.currency,
  t.category_id,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  DATE_TRUNC('month', t.transaction_date)::DATE AS month,
  SUM(t.amount_cents) AS total_cents,
  COUNT(*) AS transaction_count
FROM transactions t
LEFT JOIN categories c ON c.id = t.category_id
WHERE t.deleted_at IS NULL AND t.type = 'expense'
GROUP BY t.user_id, t.currency, t.category_id, c.name, c.icon, c.color,
         DATE_TRUNC('month', t.transaction_date);
