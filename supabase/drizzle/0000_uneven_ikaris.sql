CREATE TYPE "public"."audit_action" AS ENUM('Stock Addition', 'Sales Deduction', 'Manual Correction', 'General', 'Settings Update');--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM('Received', 'Sent to HQ', 'Repairing', 'Ready for Pickup', 'Completed');--> statement-breakpoint
CREATE TYPE "public"."condition_type" AS ENUM('New', 'Used');--> statement-breakpoint
CREATE TYPE "public"."currency_type" AS ENUM('IDR', 'USD');--> statement-breakpoint
CREATE TYPE "public"."mount_type" AS ENUM('E-mount', 'RF-mount', 'X-mount', 'L-mount', 'Z-mount', 'M-mount');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('Cash', 'Debit', 'QRIS', 'Credit');--> statement-breakpoint
CREATE TYPE "public"."product_category" AS ENUM('Body', 'Lens', 'Accessory');--> statement-breakpoint
CREATE TYPE "public"."sn_status" AS ENUM('In Stock', 'Sold', 'Claimed');--> statement-breakpoint
CREATE TYPE "public"."warranty_type" AS ENUM('Official Sony Indonesia', 'Official Canon Indonesia', 'Official Fujifilm Indonesia', 'Distributor', 'Store Warranty');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"staff_name" text NOT NULL,
	"action" "audit_action" NOT NULL,
	"details" text NOT NULL,
	"related_id" text,
	"timestamp" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"npwp" text,
	"loyalty_points" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"category" "product_category" NOT NULL,
	"mount" "mount_type",
	"condition" "condition_type" NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"cogs" numeric(15, 2) NOT NULL,
	"warranty_months" integer DEFAULT 12 NOT NULL,
	"warranty_type" "warranty_type" NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" text NOT NULL,
	"product_id" text NOT NULL,
	"model" text NOT NULL,
	"sn" text NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"cogs" numeric(15, 2) NOT NULL,
	"warranty_expiry" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"customer_name" text NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL,
	"tax" numeric(15, 2) NOT NULL,
	"total" numeric(15, 2) NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"staff_name" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "serial_numbers" (
	"sn" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"status" "sn_status" DEFAULT 'In Stock' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "staff_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'Staff',
	"auth_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "staff_members_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "store_config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"store_name" text NOT NULL,
	"address" text NOT NULL,
	"ppn_rate" numeric(5, 2) DEFAULT '11.00' NOT NULL,
	"currency" "currency_type" DEFAULT 'IDR' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "warranty_claims" (
	"id" text PRIMARY KEY NOT NULL,
	"sn" text NOT NULL,
	"product_model" text NOT NULL,
	"customer_name" text NOT NULL,
	"customer_phone" text,
	"issue" text NOT NULL,
	"status" "claim_status" DEFAULT 'Received' NOT NULL,
	"received_date" timestamp with time zone DEFAULT now(),
	"last_updated" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serial_numbers" ADD CONSTRAINT "serial_numbers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;