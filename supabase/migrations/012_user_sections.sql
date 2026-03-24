-- ============================================================
-- Migration 012: user_sections
-- Permite a cada usuario crear sus propias secciones de tarjeta.
-- Usuarios existentes: no se pre-cargan filas (backward compat vía fallback en frontend).
-- Usuarios nuevos: parten vacíos y crean sus propias secciones.
-- ============================================================

CREATE TABLE user_sections (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key        text NOT NULL,
  label      text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, key)
);

ALTER TABLE user_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_sections_own" ON user_sections
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON user_sections TO authenticated;
