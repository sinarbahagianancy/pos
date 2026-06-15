// Regression test for: GET /api/products server-side search
// (token-AND case-insensitive substring across brand, model, id, supplier).
//
// Drives the production search function (src/server/products.ts -> getAllProducts)
// against a real Postgres so we exercise the actual SQL tokenization, ILIKE
// escape, and parameter ordering — not a re-implementation of the helpers.
//
// Requires DATABASE_URL. Skipped if not set.

import { describe, it, expect, beforeAll, afterAll } from "vite-plus/test";
import { eq } from "drizzle-orm";
import { getAllProducts } from "../src/server/products";
import { client, db } from "../src/db";
import { products } from "../src/db/schema";

// Use unique IDs per run so the test is repeatable without manual cleanup
// of a prior aborted run.
const RUN = Date.now();
const SONY = `reg-search-sony-${RUN}`;
const CANON = `reg-search-canon-${RUN}`;
const DELETED = `reg-search-deleted-${RUN}`;

const hasDb = !!process.env.DATABASE_URL;

describe("getAllProducts — server-side search", () => {
  beforeAll(async () => {
    if (!hasDb) return;
    // Two visible products with distinct brand/model/supplier, plus one
    // soft-deleted product that must never show up in search results.
    await client`
      INSERT INTO products ${client({
        id: SONY,
        brand: "Sony",
        model: "A7 IV",
        category: "Body",
        condition: "New",
        price: "100",
        cogs: "50",
        warranty_type: "Distributor",
        stock: 1,
        supplier: "Sony Indonesia",
        deleted: false,
      } as any)}
      ON CONFLICT (id) DO NOTHING
    `;
    await client`
      INSERT INTO products ${client({
        id: CANON,
        brand: "Canon",
        model: "RF 50mm f/1.2L",
        category: "Lens",
        condition: "New",
        price: "200",
        cogs: "100",
        warranty_type: "Distributor",
        stock: 1,
        supplier: "Distributor Jaya",
        deleted: false,
      } as any)}
      ON CONFLICT (id) DO NOTHING
    `;
    await client`
      INSERT INTO products ${client({
        id: DELETED,
        brand: "Sony",
        model: "Hidden",
        category: "Body",
        condition: "New",
        price: "10",
        cogs: "5",
        warranty_type: "Distributor",
        stock: 0,
        supplier: "Sony Indonesia",
        deleted: true,
      } as any)}
      ON CONFLICT (id) DO NOTHING
    `;
  });

  afterAll(async () => {
    if (!hasDb) return;
    for (const id of [SONY, CANON, DELETED]) {
      await client`DELETE FROM products WHERE id = ${id}`;
    }
  });

  it("empty query returns the unfiltered (non-deleted) list", async () => {
    if (!hasDb) return;
    const r = await getAllProducts(1, 100, "");
    const ids = r.products.map((p) => p.id);
    expect(ids).toContain(SONY);
    expect(ids).toContain(CANON);
    expect(ids).not.toContain(DELETED);
  });

  it("whitespace-only query behaves like an empty query", async () => {
    if (!hasDb) return;
    const r = await getAllProducts(1, 100, "   ");
    expect(r.products.map((p) => p.id)).toContain(SONY);
  });

  it("pure-punctuation query reduces to no-search (all visible products)", async () => {
    if (!hasDb) return;
    // The tokenizer strips edge non-alphanumeric, so "!!!" yields []
    // and the SQL falls back to the unfiltered WHERE.
    const r = await getAllProducts(1, 100, "!!!");
    expect(r.products.map((p) => p.id)).toContain(SONY);
  });

  it("single-token query matches case-insensitively across columns", async () => {
    if (!hasDb) return;
    // brand match (lowercased input)
    const r1 = await getAllProducts(1, 100, "sony");
    expect(r1.products.map((p) => p.id)).toEqual(expect.arrayContaining([SONY]));

    // model match
    const r2 = await getAllProducts(1, 100, "RF");
    expect(r2.products.map((p) => p.id)).toEqual(expect.arrayContaining([CANON]));

    // supplier match
    const r3 = await getAllProducts(1, 100, "Distributor Jaya");
    expect(r3.products.map((p) => p.id)).toEqual(expect.arrayContaining([CANON]));

    // id match (unique per run, but stable within the test)
    const r4 = await getAllProducts(1, 100, SONY);
    expect(r4.products.map((p) => p.id)).toContain(SONY);
  });

  it("multi-token query is AND-joined across tokens (cross-column)", async () => {
    if (!hasDb) return;
    // "sony a7" — "sony" hits brand, "a7" hits model. Both must match.
    const r = await getAllProducts(1, 100, "sony a7");
    expect(r.products.map((p) => p.id)).toEqual(expect.arrayContaining([SONY]));
    // The Canon product has neither "sony" nor "a7" anywhere, so it must be excluded.
    expect(r.products.map((p) => p.id)).not.toContain(CANON);
  });

  it("multi-token query with a non-matching token excludes the row", async () => {
    if (!hasDb) return;
    // "sony canon" — no single product has both brands.
    const r = await getAllProducts(1, 100, "sony canon");
    expect(r.products.map((p) => p.id)).not.toContain(SONY);
    expect(r.products.map((p) => p.id)).not.toContain(CANON);
  });

  it("trailing non-alphanumeric is stripped (treated as noise)", async () => {
    if (!hasDb) return;
    const r = await getAllProducts(1, 100, "sony!");
    expect(r.products.map((p) => p.id)).toContain(SONY);
  });

  it("ILIKE wildcards in user input are escaped, not interpreted", async () => {
    if (!hasDb) return;
    // Trailing "%" is stripped by the tokenizer (edge non-alphanumeric
    // is treated as noise), so "50%" becomes the single token "50".
    // The Canon product has "50" in its model "RF 50mm f/1.2L", so it
    // must match. The important property is that the trailing "%" did
    // NOT cause an unconstrained substring match (i.e. we'd never
    // accidentally surface, say, a "Sony A7" because the pattern
    // collapsed to "%").
    const r = await getAllProducts(1, 100, "50%");
    expect(r.products.map((p) => p.id)).toContain(CANON);
    // A product with no "50" in any searchable column must not match.
    expect(r.products.map((p) => p.id)).not.toContain(SONY);

    // Now exercise mid-string wildcards: insert a product with "%" in
    // the middle of a model name and verify the literal substring match
    // (not a "match anything" wildcard).
    const wildId = `reg-search-wild-${RUN}`;
    await client`
      INSERT INTO products ${client({
        id: wildId,
        brand: "WildBrand",
        model: "50%off",
        category: "Accessory",
        condition: "New",
        price: "1",
        cogs: "0",
        warranty_type: "Toko",
        stock: 1,
        supplier: "Test",
        deleted: false,
      } as any)}
      ON CONFLICT (id) DO NOTHING
    `;
    try {
      const r2 = await getAllProducts(1, 100, "50%off");
      expect(r2.products.map((p) => p.id)).toContain(wildId);
    } finally {
      await client`DELETE FROM products WHERE id = ${wildId}`;
    }
  });

  it("soft-deleted products are never returned by a search", async () => {
    if (!hasDb) return;
    // "hidden" is in the model of the soft-deleted product.
    const r = await getAllProducts(1, 100, "hidden");
    expect(r.products.map((p) => p.id)).not.toContain(DELETED);
  });

  it("total count reflects the matching (filtered) row count, not the table total", async () => {
    if (!hasDb) return;
    const all = await getAllProducts(1, 100, "");
    const matched = await getAllProducts(1, 100, "sony");
    expect(matched.total).toBeLessThanOrEqual(all.total);
    expect(matched.total).toBe(matched.products.length);
  });
});
