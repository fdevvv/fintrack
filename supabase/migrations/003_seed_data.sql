-- ============================================================
-- Migration 003: Import SEED_DATA from control-g
-- 
-- RUN THIS AFTER signing up and getting your user_id.
-- Replace YOUR_USER_ID_HERE with your actual UUID from profiles table.
--
-- To find your user_id, run:
--   SELECT id FROM profiles LIMIT 1;
-- ============================================================

-- First, ensure user has year 2026
INSERT INTO user_years (user_id, year)
SELECT id, 2026 FROM profiles LIMIT 1
ON CONFLICT DO NOTHING;

-- Seed categories for the user
SELECT seed_default_categories(id) FROM profiles LIMIT 1;

-- ============================================================
-- Helper: get user_id and category_ids
-- ============================================================
DO $$
DECLARE
  uid UUID;
  cat_entradas UUID;
  cat_suscripciones UUID;
  cat_otros UUID;
  cat_perfumeria UUID;
  cat_ropa UUID;
  cat_electrodomestico UUID;
  cat_supermercado UUID;
  cat_servicios UUID;
  cat_combustible UUID;
  cat_prestamos UUID;
  grp UUID;
BEGIN
  SELECT id INTO uid FROM profiles LIMIT 1;
  IF uid IS NULL THEN
    RAISE EXCEPTION 'No user found. Sign up first, then run this migration.';
  END IF;

  -- Get category IDs
  SELECT id INTO cat_entradas FROM categories WHERE user_id = uid AND name = 'Entradas fiestas' LIMIT 1;
  SELECT id INTO cat_suscripciones FROM categories WHERE user_id = uid AND name = 'Suscripciones' LIMIT 1;
  SELECT id INTO cat_otros FROM categories WHERE user_id = uid AND name = 'Otros' LIMIT 1;
  SELECT id INTO cat_perfumeria FROM categories WHERE user_id = uid AND name = 'Perfumería' LIMIT 1;
  SELECT id INTO cat_ropa FROM categories WHERE user_id = uid AND name = 'Ropa' LIMIT 1;
  SELECT id INTO cat_electrodomestico FROM categories WHERE user_id = uid AND name = 'Electrodoméstico' LIMIT 1;
  SELECT id INTO cat_supermercado FROM categories WHERE user_id = uid AND name = 'Supermercado' LIMIT 1;
  SELECT id INTO cat_servicios FROM categories WHERE user_id = uid AND name = 'Servicios' LIMIT 1;
  SELECT id INTO cat_combustible FROM categories WHERE user_id = uid AND name = 'Combustible' LIMIT 1;
  SELECT id INTO cat_prestamos FROM categories WHERE user_id = uid AND name = 'Prestamos' LIMIT 1;

  -- ============================================================
  -- INCOME DATA
  -- ============================================================
  INSERT INTO monthly_income (user_id, year, month, amount_cents, currency) VALUES
    (uid, 2026, 3, 235840000, 'ARS'),
    (uid, 2026, 4, 250043400, 'ARS')
  ON CONFLICT (user_id, year, month, currency) DO UPDATE SET amount_cents = EXCLUDED.amount_cents;

  -- ============================================================
  -- VISA TRANSACTIONS
  -- ============================================================

  -- EZE ARIAS ENTRADA (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total)
  VALUES (uid, cat_entradas, 6325000, 'ARS', 'expense', 'credit_card', 'VISA', 'EZE ARIAS ENTRADA', 'EZE ARIAS ENTRADA', '2026-03-15', 2026, 1, 1);

  -- CLAUDE SUB 20USD (1 cuota per month, Mar-Jun)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id, usd_amount, usd_rate)
  VALUES
    (uid, cat_suscripciones, 2800000, 'ARS', 'expense', 'credit_card', 'VISA', 'CLAUDE SUB (20USD)', 'CLAUDE SUB (20USD)', '2026-03-15', 2026, 1, 4, grp, 20, 1400),
    (uid, cat_suscripciones, 2800000, 'ARS', 'expense', 'credit_card', 'VISA', 'CLAUDE SUB (20USD)', 'CLAUDE SUB (20USD)', '2026-04-15', 2026, 2, 4, grp, 20, 1400),
    (uid, cat_suscripciones, 2800000, 'ARS', 'expense', 'credit_card', 'VISA', 'CLAUDE SUB (20USD)', 'CLAUDE SUB (20USD)', '2026-05-15', 2026, 3, 4, grp, 20, 1400),
    (uid, cat_suscripciones, 2800000, 'ARS', 'expense', 'credit_card', 'VISA', 'CLAUDE SUB (20USD)', 'CLAUDE SUB (20USD)', '2026-06-15', 2026, 4, 4, grp, 20, 1400);

  -- MU ENTRE RIOS (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total)
  VALUES (uid, cat_otros, 6000000, 'ARS', 'expense', 'credit_card', 'VISA', 'MU ENTRE RIOS', 'MU ENTRE RIOS', '2026-03-15', 2026, 1, 1);

  -- PARAMOUNT 0.94 USD (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, usd_amount, usd_rate)
  VALUES (uid, cat_suscripciones, 131400, 'ARS', 'expense', 'credit_card', 'VISA', 'PARAMOUNT 0,94 USD', 'PARAMOUNT 0,94 USD', '2026-03-15', 2026, 1, 1, 0.94, 1397.87);

  -- APPLE TV 6.99 USD (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, usd_amount, usd_rate)
  VALUES (uid, cat_suscripciones, 977300, 'ARS', 'expense', 'credit_card', 'VISA', 'APPLE TV 6.99 USD', 'APPLE TV 6.99 USD', '2026-03-15', 2026, 1, 1, 6.99, 1397.57);

  -- SPOTIFY 2.39 USD (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, usd_amount, usd_rate)
  VALUES (uid, cat_suscripciones, 333700, 'ARS', 'expense', 'credit_card', 'VISA', 'SPOTIFY 2.39 USD', 'SPOTIFY 2.39 USD', '2026-03-15', 2026, 1, 1, 2.39, 1396.23);

  -- CENA CON MARCO (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total)
  VALUES (uid, cat_supermercado, 1200000, 'ARS', 'expense', 'credit_card', 'VISA', 'CENA CON MARCO', 'CENA CON MARCO', '2026-03-15', 2026, 1, 1);

  -- JULERIAQUE (4 cuotas, Mar-Jun)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id)
  VALUES
    (uid, cat_perfumeria, 2947300, 'ARS', 'expense', 'credit_card', 'VISA', 'JULERIAQUE', 'JULERIAQUE', '2026-03-15', 2026, 1, 4, grp),
    (uid, cat_perfumeria, 2947300, 'ARS', 'expense', 'credit_card', 'VISA', 'JULERIAQUE', 'JULERIAQUE', '2026-04-15', 2026, 2, 4, grp),
    (uid, cat_perfumeria, 2947300, 'ARS', 'expense', 'credit_card', 'VISA', 'JULERIAQUE', 'JULERIAQUE', '2026-05-15', 2026, 3, 4, grp),
    (uid, cat_perfumeria, 2947300, 'ARS', 'expense', 'credit_card', 'VISA', 'JULERIAQUE', 'JULERIAQUE', '2026-06-15', 2026, 4, 4, grp);

  -- FARENHEITE (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total)
  VALUES (uid, cat_ropa, 1863300, 'ARS', 'expense', 'credit_card', 'VISA', 'FARENHEITE', 'FARENHEITE', '2026-03-15', 2026, 1, 1);

  -- BIDCOM (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total)
  VALUES (uid, cat_electrodomestico, 1313800, 'ARS', 'expense', 'credit_card', 'VISA', 'BIDCOM', 'BIDCOM', '2026-03-15', 2026, 1, 1);

  -- FLAME BOOST (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total)
  VALUES (uid, cat_electrodomestico, 906700, 'ARS', 'expense', 'credit_card', 'VISA', 'FLAME BOOST', 'FLAME BOOST', '2026-03-15', 2026, 1, 1);

  -- MERCADO LIBRE (4 cuotas, Mar-Jun)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id)
  VALUES
    (uid, cat_electrodomestico, 547300, 'ARS', 'expense', 'credit_card', 'VISA', 'MERCADO LIBRE', 'MERCADO LIBRE', '2026-03-15', 2026, 1, 4, grp),
    (uid, cat_electrodomestico, 547300, 'ARS', 'expense', 'credit_card', 'VISA', 'MERCADO LIBRE', 'MERCADO LIBRE', '2026-04-15', 2026, 2, 4, grp),
    (uid, cat_electrodomestico, 547300, 'ARS', 'expense', 'credit_card', 'VISA', 'MERCADO LIBRE', 'MERCADO LIBRE', '2026-05-15', 2026, 3, 4, grp),
    (uid, cat_electrodomestico, 547300, 'ARS', 'expense', 'credit_card', 'VISA', 'MERCADO LIBRE', 'MERCADO LIBRE', '2026-06-15', 2026, 4, 4, grp);

  -- BIDCOM PISTOLA (8 cuotas, Mar-Oct)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id)
  VALUES
    (uid, cat_electrodomestico, 1003300, 'ARS', 'expense', 'credit_card', 'VISA', 'BIDCOM PISTOLA', 'BIDCOM PISTOLA', '2026-03-15', 2026, 1, 8, grp),
    (uid, cat_electrodomestico, 1003300, 'ARS', 'expense', 'credit_card', 'VISA', 'BIDCOM PISTOLA', 'BIDCOM PISTOLA', '2026-04-15', 2026, 2, 8, grp),
    (uid, cat_electrodomestico, 1003300, 'ARS', 'expense', 'credit_card', 'VISA', 'BIDCOM PISTOLA', 'BIDCOM PISTOLA', '2026-05-15', 2026, 3, 8, grp),
    (uid, cat_electrodomestico, 1003300, 'ARS', 'expense', 'credit_card', 'VISA', 'BIDCOM PISTOLA', 'BIDCOM PISTOLA', '2026-06-15', 2026, 4, 8, grp),
    (uid, cat_electrodomestico, 1003300, 'ARS', 'expense', 'credit_card', 'VISA', 'BIDCOM PISTOLA', 'BIDCOM PISTOLA', '2026-07-15', 2026, 5, 8, grp),
    (uid, cat_electrodomestico, 1003300, 'ARS', 'expense', 'credit_card', 'VISA', 'BIDCOM PISTOLA', 'BIDCOM PISTOLA', '2026-08-15', 2026, 6, 8, grp),
    (uid, cat_electrodomestico, 1003300, 'ARS', 'expense', 'credit_card', 'VISA', 'BIDCOM PISTOLA', 'BIDCOM PISTOLA', '2026-09-15', 2026, 7, 8, grp),
    (uid, cat_electrodomestico, 1003300, 'ARS', 'expense', 'credit_card', 'VISA', 'BIDCOM PISTOLA', 'BIDCOM PISTOLA', '2026-10-15', 2026, 8, 8, grp);

  -- YOUTUBE PREMIUM 4.92 USD (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, usd_amount, usd_rate)
  VALUES (uid, cat_suscripciones, 686900, 'ARS', 'expense', 'credit_card', 'VISA', 'YOUTUBE PREMIUM 4,92 USD', 'YOUTUBE PREMIUM 4,92 USD', '2026-03-15', 2026, 1, 1, 4.92, 1396.14);

  -- INVICTUS (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total)
  VALUES (uid, cat_ropa, 2002000, 'ARS', 'expense', 'credit_card', 'VISA', 'INVICTUS', 'INVICTUS', '2026-03-15', 2026, 1, 1);

  -- ============================================================
  -- MASTERCARD TRANSACTIONS
  -- ============================================================

  -- SEGURO CELULAR (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total)
  VALUES (uid, cat_servicios, 5246500, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO CELULAR', 'SEGURO CELULAR', '2026-03-15', 2026, 1, 1);

  -- INPRO (4 cuotas, Mar-Jun)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id)
  VALUES
    (uid, cat_electrodomestico, 15232800, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'INPRO', 'INPRO', '2026-03-15', 2026, 1, 4, grp),
    (uid, cat_electrodomestico, 15232800, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'INPRO', 'INPRO', '2026-04-15', 2026, 2, 4, grp),
    (uid, cat_electrodomestico, 15232800, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'INPRO', 'INPRO', '2026-05-15', 2026, 3, 4, grp),
    (uid, cat_electrodomestico, 15232800, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'INPRO', 'INPRO', '2026-06-15', 2026, 4, 4, grp);

  -- NETFLIX (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total)
  VALUES (uid, cat_suscripciones, 2250000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'NETFLIX', 'NETFLIX', '2026-03-15', 2026, 1, 1);

  -- SEGURO AUTO (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total)
  VALUES (uid, cat_servicios, 10389000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'SEGURO AUTO', 'SEGURO AUTO', '2026-03-15', 2026, 1, 1);

  -- COMBUSTIBLE (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total)
  VALUES (uid, cat_combustible, 4000000, 'ARS', 'expense', 'credit_card', 'MASTERCARD', 'COMBUSTIBLE', 'COMBUSTIBLE', '2026-03-15', 2026, 1, 1);

  -- ============================================================
  -- OTROS TRANSACTIONS
  -- ============================================================

  -- NALDO TELE SANDRO (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total)
  VALUES (uid, cat_electrodomestico, 5695600, 'ARS', 'expense', 'debit_card', 'OTROS', 'NALDO (TELE SANDRO)', 'NALDO (TELE SANDRO)', '2026-03-15', 2026, 1, 1);

  -- CETROGAR GONZALO (3 cuotas, Mar-May)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id)
  VALUES
    (uid, cat_electrodomestico, 4524900, 'ARS', 'expense', 'debit_card', 'OTROS', 'CETROGAR GONZALO', 'CETROGAR GONZALO', '2026-03-15', 2026, 1, 3, grp),
    (uid, cat_electrodomestico, 4524900, 'ARS', 'expense', 'debit_card', 'OTROS', 'CETROGAR GONZALO', 'CETROGAR GONZALO', '2026-04-15', 2026, 2, 3, grp),
    (uid, cat_electrodomestico, 4524900, 'ARS', 'expense', 'debit_card', 'OTROS', 'CETROGAR GONZALO', 'CETROGAR GONZALO', '2026-05-15', 2026, 3, 3, grp);

  -- TATI CATTANEO (5 cuotas, Mar-Jul)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id)
  VALUES
    (uid, cat_entradas, 3380000, 'ARS', 'expense', 'debit_card', 'OTROS', 'TATI (NOVIA TOMACO) CATTANEO', 'TATI (NOVIA TOMACO) CATTANEO', '2026-03-15', 2026, 1, 5, grp),
    (uid, cat_entradas, 3380000, 'ARS', 'expense', 'debit_card', 'OTROS', 'TATI (NOVIA TOMACO) CATTANEO', 'TATI (NOVIA TOMACO) CATTANEO', '2026-04-15', 2026, 2, 5, grp),
    (uid, cat_entradas, 3380000, 'ARS', 'expense', 'debit_card', 'OTROS', 'TATI (NOVIA TOMACO) CATTANEO', 'TATI (NOVIA TOMACO) CATTANEO', '2026-05-15', 2026, 3, 5, grp),
    (uid, cat_entradas, 3380000, 'ARS', 'expense', 'debit_card', 'OTROS', 'TATI (NOVIA TOMACO) CATTANEO', 'TATI (NOVIA TOMACO) CATTANEO', '2026-06-15', 2026, 4, 5, grp),
    (uid, cat_entradas, 3380000, 'ARS', 'expense', 'debit_card', 'OTROS', 'TATI (NOVIA TOMACO) CATTANEO', 'TATI (NOVIA TOMACO) CATTANEO', '2026-07-15', 2026, 5, 5, grp);

  -- ============================================================
  -- PRESTAMOS TRANSACTIONS
  -- ============================================================

  -- PRESTAMO MP 2c (2 cuotas, Mar-Apr)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id)
  VALUES
    (uid, cat_prestamos, 19044100, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO MP (2c)', 'PRESTAMO MP (2c)', '2026-03-15', 2026, 1, 2, grp),
    (uid, cat_prestamos, 19044100, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO MP (2c)', 'PRESTAMO MP (2c)', '2026-04-15', 2026, 2, 2, grp);

  -- PRESTAMO MP 1c (1 cuota, Mar)
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total)
  VALUES (uid, cat_prestamos, 13792500, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO MP (1c)', 'PRESTAMO MP (1c)', '2026-03-15', 2026, 1, 1);

  -- PRESTAMO MP 6c (6 cuotas, Mar-Aug)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id)
  VALUES
    (uid, cat_prestamos, 11529100, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO MP (6c)', 'PRESTAMO MP (6c)', '2026-03-15', 2026, 1, 6, grp),
    (uid, cat_prestamos, 11529100, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO MP (6c)', 'PRESTAMO MP (6c)', '2026-04-15', 2026, 2, 6, grp),
    (uid, cat_prestamos, 11529100, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO MP (6c)', 'PRESTAMO MP (6c)', '2026-05-15', 2026, 3, 6, grp),
    (uid, cat_prestamos, 11529100, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO MP (6c)', 'PRESTAMO MP (6c)', '2026-06-15', 2026, 4, 6, grp),
    (uid, cat_prestamos, 11529100, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO MP (6c)', 'PRESTAMO MP (6c)', '2026-07-15', 2026, 5, 6, grp),
    (uid, cat_prestamos, 11529100, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO MP (6c)', 'PRESTAMO MP (6c)', '2026-08-15', 2026, 6, 6, grp);

  -- ARCA MP (4 cuotas, Mar-Jun)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id)
  VALUES
    (uid, cat_prestamos, 2440500, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'ARCA MP', 'ARCA MP', '2026-03-15', 2026, 1, 4, grp),
    (uid, cat_prestamos, 2440500, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'ARCA MP', 'ARCA MP', '2026-04-15', 2026, 2, 4, grp),
    (uid, cat_prestamos, 2440500, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'ARCA MP', 'ARCA MP', '2026-05-15', 2026, 3, 4, grp),
    (uid, cat_prestamos, 2440500, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'ARCA MP', 'ARCA MP', '2026-06-15', 2026, 4, 4, grp);

  -- AURIS XIAOMI (4 cuotas, Mar-Jun)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id)
  VALUES
    (uid, cat_prestamos, 2387400, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'AURIS XIAOMI', 'AURIS XIAOMI', '2026-03-15', 2026, 1, 4, grp),
    (uid, cat_prestamos, 2387400, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'AURIS XIAOMI', 'AURIS XIAOMI', '2026-04-15', 2026, 2, 4, grp),
    (uid, cat_prestamos, 2387400, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'AURIS XIAOMI', 'AURIS XIAOMI', '2026-05-15', 2026, 3, 4, grp),
    (uid, cat_prestamos, 2387400, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'AURIS XIAOMI', 'AURIS XIAOMI', '2026-06-15', 2026, 4, 4, grp);

  -- CIRCULO (2 cuotas, Mar-Apr)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id)
  VALUES
    (uid, cat_otros, 12000000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'CIRCULO', 'CIRCULO', '2026-03-15', 2026, 1, 2, grp),
    (uid, cat_otros, 12000000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'CIRCULO', 'CIRCULO', '2026-04-15', 2026, 2, 2, grp);

  -- PLATA DARI (variable amounts per month)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id)
  VALUES
    (uid, cat_otros, 25000000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PLATA DARI', 'PLATA DARI', '2026-03-15', 2026, 1, 4, grp),
    (uid, cat_otros, 30000000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PLATA DARI', 'PLATA DARI', '2026-04-15', 2026, 2, 4, grp),
    (uid, cat_otros, 30000000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PLATA DARI', 'PLATA DARI', '2026-05-15', 2026, 3, 4, grp),
    (uid, cat_otros, 30000000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PLATA DARI', 'PLATA DARI', '2026-06-15', 2026, 4, 4, grp);

  -- PRESTAMO GALICIA (6 cuotas, variable amounts Mar-Aug)
  grp := uuid_generate_v4();
  INSERT INTO transactions (user_id, category_id, amount_cents, currency, type, payment_method, section, description, item_name, transaction_date, year, installment_current, installment_total, installment_group_id)
  VALUES
    (uid, cat_prestamos, 14554000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO GALICIA', 'PRESTAMO GALICIA', '2026-03-15', 2026, 1, 6, grp),
    (uid, cat_prestamos, 14388000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO GALICIA', 'PRESTAMO GALICIA', '2026-04-15', 2026, 2, 6, grp),
    (uid, cat_prestamos, 14268900, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO GALICIA', 'PRESTAMO GALICIA', '2026-05-15', 2026, 3, 6, grp),
    (uid, cat_prestamos, 14140800, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO GALICIA', 'PRESTAMO GALICIA', '2026-06-15', 2026, 4, 6, grp),
    (uid, cat_prestamos, 14009000, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO GALICIA', 'PRESTAMO GALICIA', '2026-07-15', 2026, 5, 6, grp),
    (uid, cat_prestamos, 13869500, 'ARS', 'expense', 'transfer', 'PRESTAMOS', 'PRESTAMO GALICIA', 'PRESTAMO GALICIA', '2026-08-15', 2026, 6, 6, grp);

  RAISE NOTICE 'Migration complete! All SEED_DATA imported for user %', uid;
END $$;
