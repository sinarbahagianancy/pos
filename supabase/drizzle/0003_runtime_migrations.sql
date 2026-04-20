-- Migration: Move all runtime ALTER TABLE/TYPE statements into proper migration
-- Previously these ran on every cold start via initializeDatabase()

-- 1. Create suppliers table
CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL UNIQUE,
  "phone" text,
  "address" text,
  "deleted" boolean DEFAULT false,
  "created_at" timestamp DEFAULT NOW()
);

-- 2. Add columns to products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "deleted" boolean DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "has_serial_number" boolean DEFAULT true;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "supplier" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "date_restocked" timestamp;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tax_enabled" boolean DEFAULT true;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "invoice_number" text;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "hidden" INTEGER DEFAULT 0;

-- 3. Add columns to sales
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "tax_enabled" boolean DEFAULT true;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "notes" text;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "due_date" timestamp with time zone;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "is_paid" boolean DEFAULT false;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "paid_at" timestamp with time zone;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "amount_paid" numeric(15,2) DEFAULT 0;
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "installments" text DEFAULT '[]';

-- 4. Add column to sale_items
ALTER TABLE "sale_items" ADD COLUMN IF NOT EXISTS "brand" text;

-- 5. Add column to warranty_claims
ALTER TABLE "warranty_claims" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now();

-- 6. Add column to staff_members
ALTER TABLE "staff_members" ADD COLUMN IF NOT EXISTS "password_hash" text;

-- 7. Add to payment_method enum: 'Utang' (also rename 'Credit' -> 'Transfer')
ALTER TYPE "public"."payment_method" ADD VALUE IF NOT EXISTS 'Utang';
ALTER TYPE "public"."payment_method" ADD VALUE IF NOT EXISTS 'Transfer';

-- 8. Add to warranty_type enum
ALTER TYPE "public"."warranty_type" ADD VALUE IF NOT EXISTS 'Toko';
ALTER TYPE "public"."warranty_type" ADD VALUE IF NOT EXISTS 'No Warranty';

-- 9. Add to audit_action enum
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Product Update';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Login';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Logout';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Product Deleted';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Product Restored';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Product Hidden';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Customer Created';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Customer Updated';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Customer Deleted';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Supplier Created';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Supplier Updated';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Supplier Deleted';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Staff Created';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Staff Updated';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Staff Deleted';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Warranty Created';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Warranty Updated';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Sale Created';

-- 10. Add monthly_target to store_config
ALTER TABLE "store_config" ADD COLUMN IF NOT EXISTS "monthly_target" integer DEFAULT 500000000;
