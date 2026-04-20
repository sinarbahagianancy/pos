-- Migration: Data transformations and seeding
-- Previously these ran on every cold start via initializeDatabase()

-- 1. Migrate 'Store Warranty' -> 'Toko' in products table
UPDATE products SET warranty_type = 'Toko' WHERE warranty_type = 'Store Warranty';

-- 2. Migrate invoice_number to structured JSON format
-- Wrapped in DO block to handle malformed JSON gracefully
DO $$ BEGIN
  -- Step 1: Wrap legacy plain strings into JSON array
  UPDATE products
  SET invoice_number = json_build_array(invoice_number)::text
  WHERE invoice_number IS NOT NULL
    AND invoice_number != ''
    AND invoice_number NOT LIKE '[%'
    AND invoice_number NOT LIKE '{%';

  -- Step 2: Convert array-of-strings format to array-of-objects format
  UPDATE products
  SET invoice_number = (
    SELECT json_agg(json_build_object('sn', '[]'::json, 'inv', elem, 'timestamp', NOW()::text))::text
    FROM json_array_elements_text(invoice_number::json) elem
  )
  WHERE invoice_number IS NOT NULL
    AND invoice_number != '[]'
    AND invoice_number LIKE '[%'
    AND invoice_number NOT LIKE '%"inv"%';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'invoice_number migration skipped: %', SQLERRM;
END $$;

-- 3. Seed default admin accounts (upsert with role update)
INSERT INTO staff_members (name, role, password_hash)
VALUES
  ('Nancy', 'Admin', 'bmFuY3kxMjM='),
  ('Mami', 'Admin', 'bWFtaTEyMw=='),
  ('Vita', 'Admin', 'dml0YTEyMw==')
ON CONFLICT (name) DO UPDATE SET role = EXCLUDED.role;

-- 4. Seed default store config if not exists
INSERT INTO store_config (id, store_name, address, ppn_rate, currency, monthly_target)
VALUES (1, 'Sinar Bahagia Surabaya', 'Jl. Kramat Gantung No. 63, Genteng, Surabaya, Jawa Timur 60174, Indonesia', 11.00, 'IDR', 500000000)
ON CONFLICT (id) DO NOTHING;
