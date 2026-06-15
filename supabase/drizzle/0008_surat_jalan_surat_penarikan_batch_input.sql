-- Migration: Surat Jalan, Surat Penarikan Barang, Batch Input Barang
-- New tables: surat_jalan_counters, surat_jalan, surat_jalan_items,
--              surat_penarikan_counters, surat_penarikan, surat_penarikan_items,
--              batch_inputs, batch_input_items
-- New enum: penarikan_reason
-- Extended audit_action enum values: Surat Jalan Created, Surat Penarikan Created, Batch Input Created
--
-- ORDER MATTERS:
--   1. New enum (penarikan_reason) must exist before surat_penarikan can reference it
--   2. ALTER TYPE audit_action ADD VALUE cannot run in a transaction with subsequent
--      INSERTs that use the new value, so we add it last (and the application
--      uses the new value only on subsequent requests)
--   3. All tables that don't depend on the new enums come first

-- ============================================================
-- 1. New enum: penarikan_reason (used by surat_penarikan.reason)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'penarikan_reason') THEN
    CREATE TYPE "penarikan_reason" AS ENUM (
      'Rusak',
      'Expired',
      'Dipakai Internal',
      'Sample/Display',
      'Employee Sale',
      'Hilang',
      'Recall',
      'Lainnya'
    );
  END IF;
END
$$;

-- ============================================================
-- 2. Per-day counter tables for auto-generated IDs
-- ============================================================
CREATE TABLE IF NOT EXISTS "surat_jalan_counters" (
  "date" text PRIMARY KEY,
  "last_number" integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "surat_penarikan_counters" (
  "date" text PRIMARY KEY,
  "last_number" integer NOT NULL DEFAULT 0
);

-- ============================================================
-- 3. Surat Jalan (delivery note to a customer)
-- ============================================================
CREATE TABLE IF NOT EXISTS "surat_jalan" (
  "id" text PRIMARY KEY,                                -- "SJ/dd/mm/yyyy-NNN"
  "customer_id" text REFERENCES "customers"("id") ON DELETE RESTRICT,
  "customer_name" text NOT NULL,
  "po_number" text NOT NULL DEFAULT '',
  "notes" text,
  "staff_name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "surat_jalan_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "surat_jalan_id" text NOT NULL REFERENCES "surat_jalan"("id") ON DELETE CASCADE,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "brand" text,
  "model" text NOT NULL,
  "sn" text NOT NULL DEFAULT '',
  "quantity" integer NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS "idx_surat_jalan_created_at" ON "surat_jalan"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_surat_jalan_items_surat_jalan_id" ON "surat_jalan_items"("surat_jalan_id");
CREATE INDEX IF NOT EXISTS "idx_surat_jalan_items_product_id" ON "surat_jalan_items"("product_id");
CREATE INDEX IF NOT EXISTS "idx_surat_jalan_customer_id" ON "surat_jalan"("customer_id");

-- ============================================================
-- 4. Surat Penarikan Barang (internal goods removal)
-- ============================================================
CREATE TABLE IF NOT EXISTS "surat_penarikan" (
  "id" text PRIMARY KEY,                                -- "SPB/dd/mm/yyyy-NNN"
  "recipient" text NOT NULL,                            -- person or department
  "reason" penarikan_reason NOT NULL,
  "alasan_lainnya" text,                                -- free-form when reason = 'Lainnya'
  "notes" text,
  "staff_name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "surat_penarikan_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "surat_penarikan_id" text NOT NULL REFERENCES "surat_penarikan"("id") ON DELETE CASCADE,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "brand" text,
  "model" text NOT NULL,
  "sn" text NOT NULL DEFAULT '',
  "quantity" integer NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS "idx_surat_penarikan_created_at" ON "surat_penarikan"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_surat_penarikan_items_surat_penarikan_id" ON "surat_penarikan_items"("surat_penarikan_id");
CREATE INDEX IF NOT EXISTS "idx_surat_penarikan_items_product_id" ON "surat_penarikan_items"("product_id");
CREATE INDEX IF NOT EXISTS "idx_surat_penarikan_reason" ON "surat_penarikan"("reason");

-- ============================================================
-- 5. Batch Input Barang (restock from a supplier)
-- ============================================================
CREATE TABLE IF NOT EXISTS "batch_inputs" (
  "id" text PRIMARY KEY,                                -- supplier's invoice number (Nomor Invoice Masuk)
  "supplier" text NOT NULL,
  "date" timestamptz NOT NULL DEFAULT now(),
  "notes" text,
  "staff_name" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "batch_input_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "batch_input_id" text NOT NULL REFERENCES "batch_inputs"("id") ON DELETE CASCADE,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "brand" text,
  "model" text NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  "sns" text NOT NULL DEFAULT '[]',                      -- JSON array of SNs
  "cogs" numeric(15, 2) NOT NULL,
  "price" numeric(15, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_batch_inputs_created_at" ON "batch_inputs"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_batch_input_items_batch_input_id" ON "batch_input_items"("batch_input_id");
CREATE INDEX IF NOT EXISTS "idx_batch_input_items_product_id" ON "batch_input_items"("product_id");
CREATE INDEX IF NOT EXISTS "idx_batch_inputs_supplier" ON "batch_inputs"("supplier");

-- ============================================================
-- 6. Extend audit_action enum with the three new document actions
-- ============================================================
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Surat Jalan Created';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Surat Penarikan Created';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Batch Input Created';
