ALTER TYPE "public"."audit_action" ADD VALUE 'Product Update';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Product Deleted';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Product Restored';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Product Hidden';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Customer Created';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Customer Updated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Customer Deleted';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Supplier Created';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Supplier Updated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Supplier Deleted';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Staff Created';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Staff Updated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Staff Deleted';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Warranty Created';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Warranty Updated';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Sale Created';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Login';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'Logout';--> statement-breakpoint
ALTER TYPE "public"."sn_status" ADD VALUE 'Damaged';--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"address" text,
	"deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "suppliers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "payment_method" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."payment_method";--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('Cash', 'Debit', 'QRIS', 'Transfer', 'Utang');--> statement-breakpoint
ALTER TABLE "sales" ALTER COLUMN "payment_method" SET DATA TYPE "public"."payment_method" USING "payment_method"::"public"."payment_method";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "warranty_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."warranty_type";--> statement-breakpoint
CREATE TYPE "public"."warranty_type" AS ENUM('Official Sony Indonesia', 'Official Canon Indonesia', 'Official Fujifilm Indonesia', 'Distributor', 'Toko', 'No Warranty');--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "warranty_type" SET DATA TYPE "public"."warranty_type" USING "warranty_type"::"public"."warranty_type";--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "deleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "has_serial_number" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "supplier" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "date_restocked" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "hidden" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tax_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "deleted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "invoice_number" text;--> statement-breakpoint
ALTER TABLE "sale_items" ADD COLUMN "brand" text;--> statement-breakpoint
ALTER TABLE "sale_items" ADD COLUMN "quantity" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "tax_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "due_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "is_paid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "amount_paid" numeric(15, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "installments" text DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "store_config" ADD COLUMN "monthly_target" numeric(15, 0) DEFAULT '500000000' NOT NULL;