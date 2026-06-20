-- ============================================================
-- Surat Penarikan Barang — extend with customer_name, po_number, manual items
-- ============================================================
-- Brings surat_penarikan in line with Surat Jalan's header fields
-- (customer_name, po_number), both optional for SPB because most
-- Penarikan events are internal write-offs with no customer.
--
-- Adds support for "manual" line items on SPB: rows whose item is not
-- in the inventory catalog (free-text name). For manual rows:
--   - product_id is NULL
--   - is_manual = true
--   - no stock deduction (there's no product to deduct from)
--   - no SN-status change (no SN is registered)
-- This matches the SPB feature requirement that items can come from
-- inventory OR be a free-text non-existing item name.

-- 1. surat_penarikan: optional header fields
ALTER TABLE "surat_penarikan"
  ADD COLUMN IF NOT EXISTS "customer_name" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "po_number" text NOT NULL DEFAULT '';

-- 2. surat_penarikan_items: allow NULL product_id for manual rows,
--    and flag them with is_manual so downstream readers can branch.
--    The FK on product_id is intentionally LEFT IN PLACE: NULL values
--    bypass FK checks in Postgres, so manual rows (product_id IS NULL)
--    coexist fine with the constraint. Catalog rows still get the
--    ON DELETE RESTRICT guard against orphan references.
ALTER TABLE "surat_penarikan_items"
  ALTER COLUMN "product_id" DROP NOT NULL;

ALTER TABLE "surat_penarikan_items"
  ADD COLUMN IF NOT EXISTS "is_manual" boolean NOT NULL DEFAULT false;

-- 3. Index for the manual-flag filter (audit/reporting queries that
--    want to isolate "items not from inventory" benefit from this).
CREATE INDEX IF NOT EXISTS "idx_surat_penarikan_items_is_manual"
  ON "surat_penarikan_items"("is_manual");
