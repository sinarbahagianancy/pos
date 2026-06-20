-- Migration: Rename products.invoice_number to products.procurement_history
--   and migrate legacy JSON entries' `sn` key to `sns` to match the new schema.
--
-- Why:
--   CONTEXT.md + ADR 0004 (Batch Input becomes the supplier-papered restock
--   surface) renamed the field to procurement_history because it captures all
--   supplier procurement events for a product, not just invoices. Each entry
--   gains a per-event `supplier` field going forward; old entries have a
--   null supplier, which the new code treats as a legacy entry from before
--   the rename.
--
--   The JSON key `sn` is renamed to `sns` (plural) to match the new schema
--   spec ({ inv, supplier, timestamp, sns, qty? }). The legacy `sn` value
--   was already an array; only the key name changes.
--
-- Order:
--   1. Rename the column (this migration file)
--   2. Migrate JSON keys: "sn":[  ->  "sns":[
--   3. (Future entries write the new format with `supplier` field.)
--
-- Safe to run multiple times: the rename is a no-op the second time
-- (column already renamed), and the JSON key migration is gated on the
-- presence of the legacy `"sn":[` pattern.

-- 1. Rename the column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE "products" RENAME COLUMN "invoice_number" TO "procurement_history";
  END IF;
END
$$;

-- 2. Migrate JSON keys: "sn" -> "sns" in legacy entries.
--    Legacy shape: [{"sn":[...], "inv":"...", "timestamp":"..."}]
--    New shape:    [{"sns":[...], "inv":"...", "supplier":"...", "timestamp":"..."}]
--    The legacy `sn` value is always an array (starts with `[`), so the
--    pattern `"sn":[` only matches the legacy key, not any other text.
UPDATE "products"
SET "procurement_history" = REPLACE("procurement_history", '"sn":[', '"sns":[')
WHERE "procurement_history" LIKE '%"sn":[%';
