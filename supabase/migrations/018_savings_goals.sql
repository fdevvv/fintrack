-- ============================================================
-- Migration 018: tabla savings_goals
-- Metas de ahorro con nombre, objetivo, monto ahorrado y fecha límite.
-- ============================================================

CREATE TABLE IF NOT EXISTS savings_goals (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  target_amount BIGINT NOT NULL,
  saved_amount  BIGINT NOT NULL DEFAULT 0,
  deadline      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own savings goals"
  ON savings_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
