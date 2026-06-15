// Regression test for: GET /surat-penarikan (list) failing with
// "Failed query: ... = ANY(($1))" when there are any rows to hydrate.
//
// Root cause: src/server/suratPenarikan.ts used
//   sql`${col} = ANY(${spbIds})`
// with a raw JS array. Drizzle's `sql` template tag does not expand a JS
// array as an `ANY` argument — it wraps the elements in parens, producing
//   "col" = ANY(($1))
// which Postgres rejects (ANY expects an array, not a 1-tuple row literal).
// The fix is `inArray(col, spbIds)` which generates `col in ($1, $2, ...)`.
//
// This test also exercises the parser, which previously read snake_case
// keys (`row.surat_penarikan_id`) but Drizzle returns camelCase
// (`row.suratPenarikanId`) — without the `pick()` fallback the items
// hydrate as `suratPenarikanId: undefined` and never match the parent.
//
// This test exercises the real handler against a real Postgres so we cover
// the same Drizzle-driver code path the user hit in production.

import { describe, it, expect, beforeAll, afterAll } from "vite-plus/test";
import { getAllSuratPenarikanHandler } from "../src/server/suratPenarikan";
import { client } from "../src/db";

const hasDb = !!process.env.DATABASE_URL;
const RUN = Date.now();
const SPB_A = `SPB-TEST-${RUN}-A`;
const SPB_B = `SPB-TEST-${RUN}-B`;

describe("getAllSuratPenarikanHandler — list hydration", () => {
  beforeAll(async () => {
    if (!hasDb) return;
    // Minimal fixture: one product, two SPB headers, one line item each.
    // The list endpoint fans out to surat_penarikan_items with the broken
    // `= ANY($1)` query, which is exactly the call site that produced the
    // user's "Failed query" error before the fix.
    const prodId = `reg-spb-prod-${RUN}`;
    await client`
      INSERT INTO products (id, brand, model, category, condition, price, cogs, warranty_months, warranty_type, stock, has_serial_number, deleted)
      VALUES (${prodId}, 'RegBrand', 'RegModel', 'Body', 'New', 100, 50, 12, 'Distributor', 5, false, false)
      ON CONFLICT (id) DO NOTHING
    `;
    await client`
      INSERT INTO surat_penarikan (id, recipient, reason, staff_name)
      VALUES (${SPB_A}, 'Test Recipient A', 'Rusak', 'Tester')
      ON CONFLICT (id) DO NOTHING
    `;
    await client`
      INSERT INTO surat_penarikan (id, recipient, reason, staff_name)
      VALUES (${SPB_B}, 'Test Recipient B', 'Expired', 'Tester')
      ON CONFLICT (id) DO NOTHING
    `;
    await client`
      INSERT INTO surat_penarikan_items (surat_penarikan_id, product_id, brand, model, sn, quantity)
      VALUES (${SPB_A}, ${prodId}, 'RegBrand', 'RegModel', '', 1)
    `;
    await client`
      INSERT INTO surat_penarikan_items (surat_penarikan_id, product_id, brand, model, sn, quantity)
      VALUES (${SPB_B}, ${prodId}, 'RegBrand', 'RegModel', '', 2)
    `;
  });

  afterAll(async () => {
    if (!hasDb) return;
    await client`DELETE FROM surat_penarikan_items WHERE surat_penarikan_id IN (${SPB_A}, ${SPB_B})`;
    await client`DELETE FROM surat_penarikan WHERE id IN (${SPB_A}, ${SPB_B})`;
    await client`DELETE FROM products WHERE id = ${`reg-spb-prod-${RUN}`}`;
  });

  it("returns rows without throwing the = ANY($1) query error", async () => {
    if (!hasDb) return;
    // Before the fix this throws "Failed query: ... = ANY(($1))".
    // After the fix it returns the paginated result cleanly.
    const r = await getAllSuratPenarikanHandler(1, 100, SPB_A);
    const a = r.suratPenarikan.find((s) => s.id === SPB_A);
    expect(a).toBeDefined();
    expect(a!.items).toHaveLength(1);
    expect(a!.items[0].quantity).toBe(1);
  });

  it("hydrates items across multiple SPB ids in a single query", async () => {
    if (!hasDb) return;
    // Use a broad search so the handler hits the items fan-out for both
    // SPB_A and SPB_B in one call. This guards against the parser bug too:
    // the items must be parented to the right SPB, not lost under an
    // `undefined` key.
    const r = await getAllSuratPenarikanHandler(1, 100, `SPB-TEST-${RUN}`);
    const ids = r.suratPenarikan.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining([SPB_A, SPB_B]));
    const a = r.suratPenarikan.find((s) => s.id === SPB_A)!;
    const b = r.suratPenarikan.find((s) => s.id === SPB_B)!;
    expect(a.items).toHaveLength(1);
    expect(b.items).toHaveLength(1);
    expect(a.items[0].quantity).toBe(1);
    expect(b.items[0].quantity).toBe(2);
  });
});
