-- Migration: Add Quotation feature
-- New tables: quotation_counters, quotations, quotation_items
-- New column: sales.quotation_id (links Sale back to source Quotation)
-- New audit_action enum values: Quotation Created, Quotation Approved, Quotation Rejected, Quotation Canceled

-- 1. Per-day counter for auto-generated Quotation numbers (SB/dd/mm/yyyy-NNN)
CREATE TABLE IF NOT EXISTS "quotation_counters" (
  "date" date PRIMARY KEY,
  "last_number" integer NOT NULL DEFAULT 0
);

-- 2. Quotations table — separate from sales for independent lifecycle
CREATE TABLE IF NOT EXISTS "quotations" (
  "id" text PRIMARY KEY,                                -- "SB/14/06/2026-001"
  "customer_id" text REFERENCES "customers"("id") ON DELETE RESTRICT,
  "customer_name" text NOT NULL,
  "subtotal" numeric(15, 2) NOT NULL,
  "tax" numeric(15, 2) NOT NULL,
  "tax_enabled" boolean NOT NULL DEFAULT true,
  "total" numeric(15, 2) NOT NULL,
  "staff_name" text NOT NULL,
  "notes" text,
  "po_number" text NOT NULL DEFAULT '',
  "status" text NOT NULL DEFAULT 'Pending',             -- Pending | Approved | Rejected | Canceled
  "rejection_reason" text,                              -- shared for Rejected and Canceled
  "converted_sale_id" text,                             -- set on Approve, FK to sales.id (added below)
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "decided_at" timestamptz,                             -- when status was set to Approved/Rejected/Canceled
  "decided_by" text                                     -- staff name who made the decision
);

-- 3. Quotation items — mirror of sale_items structure
CREATE TABLE IF NOT EXISTS "quotation_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "quotation_id" text NOT NULL REFERENCES "quotations"("id") ON DELETE CASCADE,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE RESTRICT,
  "brand" text,
  "model" text NOT NULL,
  "sn" text NOT NULL DEFAULT '',
  "price" numeric(15, 2) NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS "idx_quotations_status" ON "quotations"("status");
CREATE INDEX IF NOT EXISTS "idx_quotations_created_at" ON "quotations"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_quotation_items_quotation_id" ON "quotation_items"("quotation_id");
CREATE INDEX IF NOT EXISTS "idx_quotation_items_product_id" ON "quotation_items"("product_id");

-- 4. Add quotation_id to sales (links Sale back to source Quotation)
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "quotation_id" text REFERENCES "quotations"("id") ON DELETE SET NULL;

-- 5. Add FK on quotations.converted_sale_id now that sales.quotation_id exists (circular dependency resolved)
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_converted_sale_id_fk"
  FOREIGN KEY ("converted_sale_id") REFERENCES "sales"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_sales_quotation_id" ON "sales"("quotation_id");

-- 6. Extend audit_action enum with quotation-specific actions
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Quotation Created';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Quotation Approved';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Quotation Rejected';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Quotation Canceled';
