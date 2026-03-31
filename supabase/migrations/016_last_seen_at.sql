-- ============================================================
-- Migration 016: last_seen_at en profiles para rastrear
-- el último acceso real (incluyendo restauración de sesión).
-- auth.users.last_sign_in_at solo se actualiza en logins
-- explícitos, no en token refresh.
-- ============================================================

-- Columna en profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Función para que cada usuario actualice su propio last_seen_at
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles SET last_seen_at = NOW() WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION update_last_seen() TO authenticated;

-- Actualizar get_users_admin para incluir last_seen_at
DROP FUNCTION IF EXISTS get_users_admin();
CREATE OR REPLACE FUNCTION get_users_admin()
RETURNS TABLE(
  id            uuid,
  email         text,
  created_at    timestamptz,
  last_sign_in  timestamptz,
  last_seen_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()) != 'foschi246@gmail.com' THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    p.last_seen_at
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
