-- ============================================================
-- Migration 013: función admin para listar usuarios
-- Solo ejecutable por foschi246@gmail.com (verificado en DB).
-- ============================================================

CREATE OR REPLACE FUNCTION get_users_admin()
RETURNS TABLE(
  id            uuid,
  email         text,
  created_at    timestamptz,
  last_sign_in  timestamptz
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
    u.last_sign_in_at
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_users_admin() TO authenticated;
