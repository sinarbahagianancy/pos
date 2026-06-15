-- Migration: Add po_number column to sales table
-- PO Number is a mandatory custom input on every sale (Sale + Quotation)
-- Nullable with default empty string so existing rows backfill cleanly

ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "po_number" text DEFAULT '';
