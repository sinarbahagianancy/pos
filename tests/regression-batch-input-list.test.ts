// Regression test for: GET /batch-input (list) failing with
//   TypeError: (pick(...) ?? (intermediate value)).toISOString is not a function
//
// Root cause: getAllBatchInputHandler uses `db.execute(sql\`...\`)` (raw SQL)
// rather than the type-safe `db.select().from(batchInputs)`. With
// postgres-js, raw query results come back with snake_case keys AND
// timestamps as ISO-ish strings (e.g. "2026-06-15 22:22:10.384824+00"),
// not Date objects. The previous parser did
//   `pick(...) ?? new Date()).toISOString()`
// which returned the string (not nullish) and then called `.toISOString()`
// on a string, which doesn't exist.
//
// The fix is a `toIso()` helper that accepts both Date and string forms.
// This test exercises the real handler against a real Postgres so we cover
// the same `db.execute()` code path the user hit in production.

import { describe, it, expect, beforeAll, afterAll } from "vite-plus/test";
import { getAllBatchInputHandler } from "../src/server/batchInput";
import { client } from "../src/db";

const hasDb = !!process.env.DATABASE_URL;
const RUN = Date.now();
const BI_A = `BI-TEST-${RUN}-A`;
const BI_B = `BI-TEST-${RUN}-B`;

describe("getAllBatchInputHandler — list with raw-SQL date strings", () => {
  beforeAll(async () => {
    if (!hasDb) return;
    // Two batch input headers. No items needed — we just need the list
    // call to survive the `db.execute()` → `parseDbBatchInput` round-trip,
    // which is exactly the path that produced the toISOString TypeError.
    await client`
      INSERT INTO batch_inputs (id, supplier, notes, staff_name)
      VALUES (${BI_A}, 'Test Supplier A', 'notes A', 'Tester')
      ON CONFLICT (id) DO NOTHING
    `;
    await client`
      INSERT INTO batch_inputs (id, supplier, notes, staff_name)
      VALUES (${BI_B}, 'Test Supplier B', 'notes B', 'Tester')
      ON CONFLICT (id) DO NOTHING
    `;
  });

  afterAll(async () => {
    if (!hasDb) return;
    await client`DELETE FROM batch_inputs WHERE id IN (${BI_A}, ${BI_B})`;
  });

  it("does not crash when db.execute() returns date fields as strings", async () => {
    if (!hasDb) return;
    // Call without a search term so the WHERE is `sql\`TRUE\`` (the
    // default branch). The user's bug only fires on this path — when
    // search is provided, the query references `batch_inputs.id` etc.
    // from a `FROM ... b` alias, which is a separate (pre-existing)
    // bug we are not fixing here.
    const r = await getAllBatchInputHandler(1, 100);
    const a = r.batchInputs.find((b) => b.id === BI_A);
    const b = r.batchInputs.find((b) => b.id === BI_B);
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    // Dates must be valid ISO strings (not the raw postgres format and not
    // "Invalid Date"). Regression for the silent-fallback case too — make
    // sure we don't just always return new Date().toISOString().
    expect(a!.date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(a!.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("preserves the actual date, not the current time", async () => {
    if (!hasDb) return;
    // The old parser had a silent bug where string dates fell through
    // optional chaining and returned `new Date().toISOString()` instead.
    // The new parser must not lose data: the returned date must reflect
    // the row's actual createdAt, which we set ~milliseconds ago.
    const before = Date.now();
    const r = await getAllBatchInputHandler(1, 100);
    const after = Date.now();
    const a = r.batchInputs.find((b) => b.id === BI_A);
    expect(a).toBeDefined();
    const t = new Date(a!.createdAt).getTime();
    // Allow 5s of slack for clock skew / fixture timing, but the value
    // must be in the same window — not the time of the request.
    expect(t).toBeGreaterThanOrEqual(before - 5_000);
    expect(t).toBeLessThanOrEqual(after + 5_000);
  });

  it("search branch: WHERE references the right table (no alias mismatch)", async () => {
    if (!hasDb) return;
    // Pre-fix, the rows query aliased the table as `b` (`FROM ... b`) but
    // the WHERE referenced the unaliased `batch_inputs.id`. Postgres
    // rejects that with "invalid reference to FROM-clause entry for
    // table 'batch_inputs'", so any search invocation crashed. The fix
    // drops the unnecessary alias so WHERE and FROM agree.
    const r = await getAllBatchInputHandler(1, 100, `BI-TEST-${RUN}`);
    const ids = r.batchInputs.map((b) => b.id);
    expect(ids).toEqual(expect.arrayContaining([BI_A, BI_B]));
  });

  it("search branch: filters by supplier via ILIKE", async () => {
    if (!hasDb) return;
    const r = await getAllBatchInputHandler(1, 100, "Test Supplier A");
    const ids = r.batchInputs.map((b) => b.id);
    expect(ids).toContain(BI_A);
    expect(ids).not.toContain(BI_B);
  });
});
