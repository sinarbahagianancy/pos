// Runtime DB migrations for the restock feature.
//
// These run on cold start to bring the DB schema in line with what the
// rest of the server code assumes. Each is idempotent (IF NOT EXISTS or
// a guarded check) and runs in a try/catch so a partial-failure on one
// migration doesn't break the whole server.
//
// They mirror the canonical Drizzle migrations in supabase/drizzle/
// (0009_procurement_history_rename.sql, 0010_batch_input_items_mode.sql)
// but don't depend on the operator having run `drizzle-kit migrate`
// after pulling new code. Production databases will get the canonical
// migrations too, but the runtime versions are the safety net for
// "I just deployed and the DB is still on the old shape" cases.
//
// IMPORTANT: this module is imported once at server startup (see
// src/server/index.ts or wherever the dev server is wired up). It MUST
// NOT be imported as a side effect of a handler module, because the
// top-level await in this module would be re-evaluated on every
// dynamic import of the handler.

import { client } from "../db/index.js";

export async function runBatchInputMigrations(): Promise<void> {
  // Rename products.invoice_number to products.procurement_history
  // (idempotent: skipped if the column is already renamed).
  try {
    await client.unsafe(
      `DO $$
       BEGIN
         IF EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'invoice_number'
         ) THEN
           ALTER TABLE "products" RENAME COLUMN "invoice_number" TO "procurement_history";
         END IF;
       END $$`,
    );
  } catch (e) {
    console.error("Failed to rename invoice_number → procurement_history:", e);
  }

  // Migrate legacy JSON entries' `sn` key to `sns` (matches the new schema
  // spec). The legacy `sn` value was always an array, so the pattern
  // `"sn":[` only matches the legacy key.
  try {
    await client.unsafe(
      `UPDATE "products"
       SET "procurement_history" = REPLACE("procurement_history", '"sn":[', '"sns":[')
       WHERE "procurement_history" LIKE '%"sn":[%'`,
    );
  } catch (e) {
    console.error("Failed to migrate procurement_history sn→sns:", e);
  }

  // Add the `mode` column to batch_input_items (idempotent).
  try {
    await client.unsafe(
      `ALTER TABLE "batch_input_items" ADD COLUMN IF NOT EXISTS "mode" text NOT NULL DEFAULT 'new'`,
    );
  } catch (e) {
    console.error("Failed to add batch_input_items.mode:", e);
  }

  // Add surat_penarikan.customer_name / po_number (idempotent).
  try {
    await client.unsafe(
      `ALTER TABLE "surat_penarikan" ADD COLUMN IF NOT EXISTS "customer_name" text NOT NULL DEFAULT ''`,
    );
    await client.unsafe(
      `ALTER TABLE "surat_penarikan" ADD COLUMN IF NOT EXISTS "po_number" text NOT NULL DEFAULT ''`,
    );
  } catch (e) {
    console.error("Failed to add surat_penarikan customer_name/po_number:", e);
  }

  // Allow NULL product_id and add is_manual flag on surat_penarikan_items
  // (idempotent: ALTER ... DROP NOT NULL is safe to repeat; column-add is
  // guarded with IF NOT EXISTS).
  try {
    await client.unsafe(
      `ALTER TABLE "surat_penarikan_items" ALTER COLUMN "product_id" DROP NOT NULL`,
    );
    await client.unsafe(
      `ALTER TABLE "surat_penarikan_items" ADD COLUMN IF NOT EXISTS "is_manual" boolean NOT NULL DEFAULT false`,
    );
  } catch (e) {
    console.error("Failed to alter surat_penarikan_items for manual rows:", e);
  }
}
