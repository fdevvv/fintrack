-- ============================================================
-- Seed: foschi250@gmail.com
-- Gastos en tarjeta con cuotas variadas para testing.
-- Convención: amount = pesos ARS directos ($1.000 = 1000)
--
-- Cómo ejecutar:
--   1. Supabase SQL Editor → pegar y ejecutar
--
-- Para limpiar antes de re-ejecutar:
--   DELETE FROM transactions WHERE user_id = (SELECT id FROM profiles WHERE email = 'foschi250@gmail.com') AND source = 'seed';
--   DELETE FROM monthly_income WHERE user_id = (SELECT id FROM profiles WHERE email = 'foschi250@gmail.com');
-- ============================================================

SELECT seed_default_categories(id)
FROM profiles
WHERE email = 'foschi250@gmail.com';

DO $$
DECLARE
  uid                  UUID;
  cat_ropa             UUID;
  cat_calzado          UUID;
  cat_supermercado     UUID;
  cat_perfumeria       UUID;
  cat_electrodomestico UUID;
  cat_servicios        UUID;
  cat_suscripciones    UUID;
  cat_salidas          UUID;
  cat_combustible      UUID;
  cat_prestamos        UUID;
  cat_otros            UUID;
  grp                  UUID;
BEGIN

  SELECT id INTO uid FROM profiles WHERE email = 'foschi250@gmail.com';
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Usuario foschi250@gmail.com no encontrado.';
  END IF;
  RAISE NOTICE 'Seeding para user_id: %', uid;

  INSERT INTO user_years (user_id, year)
  VALUES (uid, 2025), (uid, 2026), (uid, 2027)
  ON CONFLICT DO NOTHING;

  SELECT id INTO cat_ropa             FROM categories WHERE user_id = uid AND name = 'Ropa'             LIMIT 1;
  SELECT id INTO cat_calzado          FROM categories WHERE user_id = uid AND name = 'Calzado'          LIMIT 1;
  SELECT id INTO cat_supermercado     FROM categories WHERE user_id = uid AND name = 'Supermercado'     LIMIT 1;
  SELECT id INTO cat_perfumeria       FROM categories WHERE user_id = uid AND name = 'Perfumería'       LIMIT 1;
  SELECT id INTO cat_electrodomestico FROM categories WHERE user_id = uid AND name = 'Electrodoméstico' LIMIT 1;
  SELECT id INTO cat_servicios        FROM categories WHERE user_id = uid AND name = 'Servicios'        LIMIT 1;
  SELECT id INTO cat_suscripciones    FROM categories WHERE user_id = uid AND name = 'Suscripciones'    LIMIT 1;
  SELECT id INTO cat_salidas          FROM categories WHERE user_id = uid AND name = 'Salidas'          LIMIT 1;
  SELECT id INTO cat_combustible      FROM categories WHERE user_id = uid AND name = 'Combustible'      LIMIT 1;
  SELECT id INTO cat_prestamos        FROM categories WHERE user_id = uid AND name = 'Prestamos'        LIMIT 1;
  SELECT id INTO cat_otros            FROM categories WHERE user_id = uid AND name = 'Otros'            LIMIT 1;

  -- ── Ingreso neto mensual ─────────────────────────────────────
  INSERT INTO monthly_income (user_id, year, month, amount_cents, currency) VALUES
    (uid, 2026, 1, 1580000, 'ARS'),
    (uid, 2026, 2, 1620000, 'ARS'),
    (uid, 2026, 3, 1750000, 'ARS'),
    (uid, 2026, 4, 1850000, 'ARS'),
    (uid, 2026, 5, 1920000, 'ARS'),
    (uid, 2026, 6, 2000000, 'ARS')
  ON CONFLICT (user_id, year, month, currency)
  DO UPDATE SET amount_cents = EXCLUDED.amount_cents;

  -- ================================================================
  -- VISA
  -- ================================================================

  -- iPhone 15 Pro Max — 12c × $125.000 (ene → dic 2026)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id, source) VALUES
    (uid, cat_electrodomestico, 125000, 'ARS', 'expense', 'credit_card', 'VISA', 'IPHONE 15 PRO MAX', 'IPHONE 15 PRO MAX', '2026-01-10', 2026,  1, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 125000, 'ARS', 'expense', 'credit_card', 'VISA', 'IPHONE 15 PRO MAX', 'IPHONE 15 PRO MAX', '2026-02-10', 2026,  2, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 125000, 'ARS', 'expense', 'credit_card', 'VISA', 'IPHONE 15 PRO MAX', 'IPHONE 15 PRO MAX', '2026-03-10', 2026,  3, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 125000, 'ARS', 'expense', 'credit_card', 'VISA', 'IPHONE 15 PRO MAX', 'IPHONE 15 PRO MAX', '2026-04-10', 2026,  4, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 125000, 'ARS', 'expense', 'credit_card', 'VISA', 'IPHONE 15 PRO MAX', 'IPHONE 15 PRO MAX', '2026-05-10', 2026,  5, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 125000, 'ARS', 'expense', 'credit_card', 'VISA', 'IPHONE 15 PRO MAX', 'IPHONE 15 PRO MAX', '2026-06-10', 2026,  6, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 125000, 'ARS', 'expense', 'credit_card', 'VISA', 'IPHONE 15 PRO MAX', 'IPHONE 15 PRO MAX', '2026-07-10', 2026,  7, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 125000, 'ARS', 'expense', 'credit_card', 'VISA', 'IPHONE 15 PRO MAX', 'IPHONE 15 PRO MAX', '2026-08-10', 2026,  8, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 125000, 'ARS', 'expense', 'credit_card', 'VISA', 'IPHONE 15 PRO MAX', 'IPHONE 15 PRO MAX', '2026-09-10', 2026,  9, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 125000, 'ARS', 'expense', 'credit_card', 'VISA', 'IPHONE 15 PRO MAX', 'IPHONE 15 PRO MAX', '2026-10-10', 2026, 10, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 125000, 'ARS', 'expense', 'credit_card', 'VISA', 'IPHONE 15 PRO MAX', 'IPHONE 15 PRO MAX', '2026-11-10', 2026, 11, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 125000, 'ARS', 'expense', 'credit_card', 'VISA', 'IPHONE 15 PRO MAX', 'IPHONE 15 PRO MAX', '2026-12-10', 2026, 12, 12, grp, 'seed');

  -- Zapatillas Adidas — 6c × $42.500 (ene → jun 2026)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id, source) VALUES
    (uid, cat_calzado, 42500, 'ARS', 'expense', 'credit_card', 'VISA', 'ZAPATILLAS ADIDAS', 'ZAPATILLAS ADIDAS', '2026-01-10', 2026, 1, 6, grp, 'seed'),
    (uid, cat_calzado, 42500, 'ARS', 'expense', 'credit_card', 'VISA', 'ZAPATILLAS ADIDAS', 'ZAPATILLAS ADIDAS', '2026-02-10', 2026, 2, 6, grp, 'seed'),
    (uid, cat_calzado, 42500, 'ARS', 'expense', 'credit_card', 'VISA', 'ZAPATILLAS ADIDAS', 'ZAPATILLAS ADIDAS', '2026-03-10', 2026, 3, 6, grp, 'seed'),
    (uid, cat_calzado, 42500, 'ARS', 'expense', 'credit_card', 'VISA', 'ZAPATILLAS ADIDAS', 'ZAPATILLAS ADIDAS', '2026-04-10', 2026, 4, 6, grp, 'seed'),
    (uid, cat_calzado, 42500, 'ARS', 'expense', 'credit_card', 'VISA', 'ZAPATILLAS ADIDAS', 'ZAPATILLAS ADIDAS', '2026-05-10', 2026, 5, 6, grp, 'seed'),
    (uid, cat_calzado, 42500, 'ARS', 'expense', 'credit_card', 'VISA', 'ZAPATILLAS ADIDAS', 'ZAPATILLAS ADIDAS', '2026-06-10', 2026, 6, 6, grp, 'seed');

  -- Ropa Zara — 3c × $38.333 (feb → abr 2026)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id, source) VALUES
    (uid, cat_ropa, 38333, 'ARS', 'expense', 'credit_card', 'VISA', 'ZARA ROPA', 'ZARA ROPA', '2026-02-10', 2026, 1, 3, grp, 'seed'),
    (uid, cat_ropa, 38333, 'ARS', 'expense', 'credit_card', 'VISA', 'ZARA ROPA', 'ZARA ROPA', '2026-03-10', 2026, 2, 3, grp, 'seed'),
    (uid, cat_ropa, 38333, 'ARS', 'expense', 'credit_card', 'VISA', 'ZARA ROPA', 'ZARA ROPA', '2026-04-10', 2026, 3, 3, grp, 'seed');

  -- Perfumería Don Cosméticos — 4c × $31.250 (mar → jun 2026)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id, source) VALUES
    (uid, cat_perfumeria, 31250, 'ARS', 'expense', 'credit_card', 'VISA', 'DON COSMETICOS', 'DON COSMETICOS', '2026-03-10', 2026, 1, 4, grp, 'seed'),
    (uid, cat_perfumeria, 31250, 'ARS', 'expense', 'credit_card', 'VISA', 'DON COSMETICOS', 'DON COSMETICOS', '2026-04-10', 2026, 2, 4, grp, 'seed'),
    (uid, cat_perfumeria, 31250, 'ARS', 'expense', 'credit_card', 'VISA', 'DON COSMETICOS', 'DON COSMETICOS', '2026-05-10', 2026, 3, 4, grp, 'seed'),
    (uid, cat_perfumeria, 31250, 'ARS', 'expense', 'credit_card', 'VISA', 'DON COSMETICOS', 'DON COSMETICOS', '2026-06-10', 2026, 4, 4, grp, 'seed');

  -- Netflix — $22.500/mes (ene → jun 2026)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, source) VALUES
    (uid, cat_suscripciones, 22500, 'ARS', 'expense', 'credit_card', 'VISA', 'NETFLIX', 'NETFLIX', '2026-01-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 22500, 'ARS', 'expense', 'credit_card', 'VISA', 'NETFLIX', 'NETFLIX', '2026-02-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 22500, 'ARS', 'expense', 'credit_card', 'VISA', 'NETFLIX', 'NETFLIX', '2026-03-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 22500, 'ARS', 'expense', 'credit_card', 'VISA', 'NETFLIX', 'NETFLIX', '2026-04-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 22500, 'ARS', 'expense', 'credit_card', 'VISA', 'NETFLIX', 'NETFLIX', '2026-05-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 22500, 'ARS', 'expense', 'credit_card', 'VISA', 'NETFLIX', 'NETFLIX', '2026-06-10', 2026, 1, 1, 'seed');

  -- Spotify — $18.000/mes (ene → jun 2026)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, source) VALUES
    (uid, cat_suscripciones, 18000, 'ARS', 'expense', 'credit_card', 'VISA', 'SPOTIFY', 'SPOTIFY', '2026-01-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 18000, 'ARS', 'expense', 'credit_card', 'VISA', 'SPOTIFY', 'SPOTIFY', '2026-02-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 18000, 'ARS', 'expense', 'credit_card', 'VISA', 'SPOTIFY', 'SPOTIFY', '2026-03-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 18000, 'ARS', 'expense', 'credit_card', 'VISA', 'SPOTIFY', 'SPOTIFY', '2026-04-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 18000, 'ARS', 'expense', 'credit_card', 'VISA', 'SPOTIFY', 'SPOTIFY', '2026-05-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 18000, 'ARS', 'expense', 'credit_card', 'VISA', 'SPOTIFY', 'SPOTIFY', '2026-06-10', 2026, 1, 1, 'seed');

  -- YPF Combustible — mensual con leve aumento (ene → abr 2026)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, source) VALUES
    (uid, cat_combustible, 38000, 'ARS', 'expense', 'credit_card', 'VISA', 'YPF COMBUSTIBLE', 'YPF COMBUSTIBLE', '2026-01-10', 2026, 1, 1, 'seed'),
    (uid, cat_combustible, 39000, 'ARS', 'expense', 'credit_card', 'VISA', 'YPF COMBUSTIBLE', 'YPF COMBUSTIBLE', '2026-02-10', 2026, 1, 1, 'seed'),
    (uid, cat_combustible, 41000, 'ARS', 'expense', 'credit_card', 'VISA', 'YPF COMBUSTIBLE', 'YPF COMBUSTIBLE', '2026-03-10', 2026, 1, 1, 'seed'),
    (uid, cat_combustible, 42000, 'ARS', 'expense', 'credit_card', 'VISA', 'YPF COMBUSTIBLE', 'YPF COMBUSTIBLE', '2026-04-10', 2026, 1, 1, 'seed');

  -- Cena La Biela — 1c (feb 2026)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, source)
  VALUES (uid, cat_salidas, 45000, 'ARS', 'expense', 'credit_card', 'VISA', 'CENA LA BIELA', 'CENA LA BIELA', '2026-02-10', 2026, 1, 1, 'seed');

  -- Ropa Mango — 1c (abr 2026)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, source)
  VALUES (uid, cat_ropa, 58000, 'ARS', 'expense', 'credit_card', 'VISA', 'MANGO ROPA', 'MANGO ROPA', '2026-04-10', 2026, 1, 1, 'seed');

  -- ================================================================
  -- MASTERCARD
  -- ================================================================

  -- Smart TV Samsung 55" — 18c × $58.000 (ene 2026 → jun 2027)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id, source) VALUES
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2026-01-10', 2026,  1, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2026-02-10', 2026,  2, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2026-03-10', 2026,  3, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2026-04-10', 2026,  4, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2026-05-10', 2026,  5, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2026-06-10', 2026,  6, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2026-07-10', 2026,  7, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2026-08-10', 2026,  8, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2026-09-10', 2026,  9, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2026-10-10', 2026, 10, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2026-11-10', 2026, 11, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2026-12-10', 2026, 12, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2027-01-10', 2027, 13, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2027-02-10', 2027, 14, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2027-03-10', 2027, 15, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2027-04-10', 2027, 16, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2027-05-10', 2027, 17, 18, grp, 'seed'),
    (uid, cat_electrodomestico, 58000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SMART TV SAMSUNG 55', 'SMART TV SAMSUNG 55', '2027-06-10', 2027, 18, 18, grp, 'seed');

  -- Notebook Lenovo — 12c × $65.000 (feb 2026 → ene 2027)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id, source) VALUES
    (uid, cat_electrodomestico, 65000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'NOTEBOOK LENOVO', 'NOTEBOOK LENOVO', '2026-02-10', 2026,  1, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 65000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'NOTEBOOK LENOVO', 'NOTEBOOK LENOVO', '2026-03-10', 2026,  2, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 65000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'NOTEBOOK LENOVO', 'NOTEBOOK LENOVO', '2026-04-10', 2026,  3, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 65000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'NOTEBOOK LENOVO', 'NOTEBOOK LENOVO', '2026-05-10', 2026,  4, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 65000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'NOTEBOOK LENOVO', 'NOTEBOOK LENOVO', '2026-06-10', 2026,  5, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 65000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'NOTEBOOK LENOVO', 'NOTEBOOK LENOVO', '2026-07-10', 2026,  6, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 65000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'NOTEBOOK LENOVO', 'NOTEBOOK LENOVO', '2026-08-10', 2026,  7, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 65000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'NOTEBOOK LENOVO', 'NOTEBOOK LENOVO', '2026-09-10', 2026,  8, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 65000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'NOTEBOOK LENOVO', 'NOTEBOOK LENOVO', '2026-10-10', 2026,  9, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 65000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'NOTEBOOK LENOVO', 'NOTEBOOK LENOVO', '2026-11-10', 2026, 10, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 65000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'NOTEBOOK LENOVO', 'NOTEBOOK LENOVO', '2026-12-10', 2026, 11, 12, grp, 'seed'),
    (uid, cat_electrodomestico, 65000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'NOTEBOOK LENOVO', 'NOTEBOOK LENOVO', '2027-01-10', 2027, 12, 12, grp, 'seed');

  -- Seguro Médico Swiss Medical — $95.000/mes (ene → jun 2026)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, source) VALUES
    (uid, cat_servicios, 95000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO MEDICO SWISS', 'SEGURO MEDICO SWISS', '2026-01-10', 2026, 1, 1, 'seed'),
    (uid, cat_servicios, 95000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO MEDICO SWISS', 'SEGURO MEDICO SWISS', '2026-02-10', 2026, 1, 1, 'seed'),
    (uid, cat_servicios, 95000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO MEDICO SWISS', 'SEGURO MEDICO SWISS', '2026-03-10', 2026, 1, 1, 'seed'),
    (uid, cat_servicios, 95000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO MEDICO SWISS', 'SEGURO MEDICO SWISS', '2026-04-10', 2026, 1, 1, 'seed'),
    (uid, cat_servicios, 95000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO MEDICO SWISS', 'SEGURO MEDICO SWISS', '2026-05-10', 2026, 1, 1, 'seed'),
    (uid, cat_servicios, 95000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO MEDICO SWISS', 'SEGURO MEDICO SWISS', '2026-06-10', 2026, 1, 1, 'seed');

  -- Seguro Auto Sancor — $115.000/mes (ene → jun 2026)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, source) VALUES
    (uid, cat_servicios, 115000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO AUTO SANCOR', 'SEGURO AUTO SANCOR', '2026-01-10', 2026, 1, 1, 'seed'),
    (uid, cat_servicios, 115000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO AUTO SANCOR', 'SEGURO AUTO SANCOR', '2026-02-10', 2026, 1, 1, 'seed'),
    (uid, cat_servicios, 115000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO AUTO SANCOR', 'SEGURO AUTO SANCOR', '2026-03-10', 2026, 1, 1, 'seed'),
    (uid, cat_servicios, 115000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO AUTO SANCOR', 'SEGURO AUTO SANCOR', '2026-04-10', 2026, 1, 1, 'seed'),
    (uid, cat_servicios, 115000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO AUTO SANCOR', 'SEGURO AUTO SANCOR', '2026-05-10', 2026, 1, 1, 'seed'),
    (uid, cat_servicios, 115000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO AUTO SANCOR', 'SEGURO AUTO SANCOR', '2026-06-10', 2026, 1, 1, 'seed');

  -- Viaje Bariloche — 6c × $80.000 (mar → ago 2026)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id, source) VALUES
    (uid, cat_salidas, 80000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'VIAJE BARILOCHE', 'VIAJE BARILOCHE', '2026-03-10', 2026, 1, 6, grp, 'seed'),
    (uid, cat_salidas, 80000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'VIAJE BARILOCHE', 'VIAJE BARILOCHE', '2026-04-10', 2026, 2, 6, grp, 'seed'),
    (uid, cat_salidas, 80000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'VIAJE BARILOCHE', 'VIAJE BARILOCHE', '2026-05-10', 2026, 3, 6, grp, 'seed'),
    (uid, cat_salidas, 80000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'VIAJE BARILOCHE', 'VIAJE BARILOCHE', '2026-06-10', 2026, 4, 6, grp, 'seed'),
    (uid, cat_salidas, 80000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'VIAJE BARILOCHE', 'VIAJE BARILOCHE', '2026-07-10', 2026, 5, 6, grp, 'seed'),
    (uid, cat_salidas, 80000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'VIAJE BARILOCHE', 'VIAJE BARILOCHE', '2026-08-10', 2026, 6, 6, grp, 'seed');

  -- HBO Max — $18.500/mes (ene → jun 2026)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, source) VALUES
    (uid, cat_suscripciones, 18500, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'HBO MAX', 'HBO MAX', '2026-01-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 18500, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'HBO MAX', 'HBO MAX', '2026-02-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 18500, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'HBO MAX', 'HBO MAX', '2026-03-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 18500, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'HBO MAX', 'HBO MAX', '2026-04-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 18500, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'HBO MAX', 'HBO MAX', '2026-05-10', 2026, 1, 1, 'seed'),
    (uid, cat_suscripciones, 18500, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'HBO MAX', 'HBO MAX', '2026-06-10', 2026, 1, 1, 'seed');

  -- ================================================================
  -- PRESTAMOS
  -- ================================================================

  -- Préstamo Naranja X — 6c × $180.000 (ene → jun 2026)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id, source) VALUES
    (uid, cat_prestamos, 180000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO NARANJA X', 'PRESTAMO NARANJA X', '2026-01-10', 2026, 1, 6, grp, 'seed'),
    (uid, cat_prestamos, 180000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO NARANJA X', 'PRESTAMO NARANJA X', '2026-02-10', 2026, 2, 6, grp, 'seed'),
    (uid, cat_prestamos, 180000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO NARANJA X', 'PRESTAMO NARANJA X', '2026-03-10', 2026, 3, 6, grp, 'seed'),
    (uid, cat_prestamos, 180000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO NARANJA X', 'PRESTAMO NARANJA X', '2026-04-10', 2026, 4, 6, grp, 'seed'),
    (uid, cat_prestamos, 180000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO NARANJA X', 'PRESTAMO NARANJA X', '2026-05-10', 2026, 5, 6, grp, 'seed'),
    (uid, cat_prestamos, 180000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO NARANJA X', 'PRESTAMO NARANJA X', '2026-06-10', 2026, 6, 6, grp, 'seed');

  -- Préstamo Personal BBVA — 12c × $125.000 (feb 2026 → ene 2027)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id, source) VALUES
    (uid, cat_prestamos, 125000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO BBVA', 'PRESTAMO BBVA', '2026-02-10', 2026,  1, 12, grp, 'seed'),
    (uid, cat_prestamos, 125000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO BBVA', 'PRESTAMO BBVA', '2026-03-10', 2026,  2, 12, grp, 'seed'),
    (uid, cat_prestamos, 125000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO BBVA', 'PRESTAMO BBVA', '2026-04-10', 2026,  3, 12, grp, 'seed'),
    (uid, cat_prestamos, 125000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO BBVA', 'PRESTAMO BBVA', '2026-05-10', 2026,  4, 12, grp, 'seed'),
    (uid, cat_prestamos, 125000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO BBVA', 'PRESTAMO BBVA', '2026-06-10', 2026,  5, 12, grp, 'seed'),
    (uid, cat_prestamos, 125000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO BBVA', 'PRESTAMO BBVA', '2026-07-10', 2026,  6, 12, grp, 'seed'),
    (uid, cat_prestamos, 125000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO BBVA', 'PRESTAMO BBVA', '2026-08-10', 2026,  7, 12, grp, 'seed'),
    (uid, cat_prestamos, 125000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO BBVA', 'PRESTAMO BBVA', '2026-09-10', 2026,  8, 12, grp, 'seed'),
    (uid, cat_prestamos, 125000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO BBVA', 'PRESTAMO BBVA', '2026-10-10', 2026,  9, 12, grp, 'seed'),
    (uid, cat_prestamos, 125000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO BBVA', 'PRESTAMO BBVA', '2026-11-10', 2026, 10, 12, grp, 'seed'),
    (uid, cat_prestamos, 125000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO BBVA', 'PRESTAMO BBVA', '2026-12-10', 2026, 11, 12, grp, 'seed'),
    (uid, cat_prestamos, 125000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO BBVA', 'PRESTAMO BBVA', '2027-01-10', 2027, 12, 12, grp, 'seed');

  -- ================================================================
  -- OTROS (débito)
  -- ================================================================

  -- Supermercado DÍA — débito mensual
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, source) VALUES
    (uid, cat_supermercado, 85000, 'ARS', 'expense', 'debit_card', 'OTROS', 'SUPERMERCADO DIA', 'SUPERMERCADO DIA', '2026-01-20', 2026, 1, 1, 'seed'),
    (uid, cat_supermercado, 92000, 'ARS', 'expense', 'debit_card', 'OTROS', 'SUPERMERCADO DIA', 'SUPERMERCADO DIA', '2026-02-20', 2026, 1, 1, 'seed'),
    (uid, cat_supermercado, 89000, 'ARS', 'expense', 'debit_card', 'OTROS', 'SUPERMERCADO DIA', 'SUPERMERCADO DIA', '2026-03-20', 2026, 1, 1, 'seed'),
    (uid, cat_supermercado, 95000, 'ARS', 'expense', 'debit_card', 'OTROS', 'SUPERMERCADO DIA', 'SUPERMERCADO DIA', '2026-04-20', 2026, 1, 1, 'seed'),
    (uid, cat_supermercado, 98000, 'ARS', 'expense', 'debit_card', 'OTROS', 'SUPERMERCADO DIA', 'SUPERMERCADO DIA', '2026-05-20', 2026, 1, 1, 'seed'),
    (uid, cat_supermercado, 98000, 'ARS', 'expense', 'debit_card', 'OTROS', 'SUPERMERCADO DIA', 'SUPERMERCADO DIA', '2026-06-20', 2026, 1, 1, 'seed');

  RAISE NOTICE '✓ Seed completo para foschi250@gmail.com';

END $$;
