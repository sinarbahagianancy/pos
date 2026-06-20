-- Migration: Add 'mode' column to batch_input_items.
--
-- Why:
--   ADR 0004 introduces a per-row mode ('new' | 'restock') on batch input
--   items. The previous implementation inferred the mode at parse time from
--   the productId shape (BRC-{ts}-{rand} = new), but that heuristic is
--   fragile (it depends on the server's id-generation scheme). Storing the
--   mode explicitly in the DB makes the data model self-describing and
--   future-proof.
--
-- Safe to run on existing databases: the new column has a NOT NULL DEFAULT
-- 'new', so existing rows are backfilled with 'new' (which matches the
-- pre-restock behavior — all existing batch input items introduced new
-- products). New rows with restock mode will set the column explicitly.

ALTER TABLE "batch_input_items"
  ADD COLUMN IF NOT EXISTS "mode" text NOT NULL DEFAULT 'new';
