-- Migration: Add payment_method to quotations
-- Stores the payment method chosen when the quotation is created,
-- so it can be used automatically when approving (no re-selection needed).

ALTER TABLE "quotations" ADD COLUMN IF NOT EXISTS "payment_method" text NOT NULL DEFAULT 'Cash';
