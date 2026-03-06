-- Add deleted column to customers for soft deletion
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "deleted" boolean DEFAULT false;
