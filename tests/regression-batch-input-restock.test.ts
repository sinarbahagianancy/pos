// Regression test for: Batch Input restock mode (per ADR 0004 + CONTEXT.md).
//
// Covers the new server-side behavior:
//   - mode: "restock" rows update an existing product's stock (not INSERT a new one)
//   - the product's `supplier` field is NOT overwritten on restock (frozen
//     at first introduction); the per-event supplier goes to
//     procurement_history
//   - the per-row audit message is mode-specific ("Restocked ... (+N units, total stock: M) ...")
//   - the summary audit message has a conditional restock-count clause
//   - the BatchInputItem response carries a `mode: "new" | "restock"` field,
//     inferred by the parser from the productId shape (BRC-{ts}-{rand} = new)
//
// Exercises the real handler against a real Postgres so the test covers the
// same transaction code path the user will hit in production.

import { describe, it, expect, beforeAll, afterAll } from "vite-plus/test";
import { createBatchInputHandler } from "../src/server/batchInput";
import { client } from "../src/db";

const hasDb = !!process.env.DATABASE_URL;
const RUN = Date.now();
const BI_ID = `BI-TEST-RESTOCK-${RUN}`;
const PRODUCT_ID = `TEST-RESTOCK-${RUN}`;

describe("createBatchInputHandler — restock mode", () => {
  beforeAll(async () => {
    if (!hasDb) return;
    // Seed a product that the restock row will target. Note: the
    // introducing supplier is 'ORIGINAL Supplier' (this is the frozen
    // value); the restock will come from a DIFFERENT supplier to prove
    // the supplier field is NOT overwritten.
    await client`
      INSERT INTO products (
        id, brand, model, category, condition,
        price, cogs, warranty_months, warranty_type,
        stock, has_serial_number, supplier, date_restocked,
        tax_enabled, deleted, hidden,
        procurement_history
      ) VALUES (
        ${PRODUCT_ID}, 'TestBrand', 'TestModel', 'Body', 'New',
        '100', '50', 12, 'Distributor',
        5, false, 'ORIGINAL Supplier', NOW(),
        true, false, 0,
        '[]'::text
      )
      ON CONFLICT (id) DO NOTHING
    `;
  });

  afterAll(async () => {
    if (!hasDb) return;
    await client`DELETE FROM serial_numbers WHERE product_id = ${PRODUCT_ID}`;
    await client`DELETE FROM batch_input_items WHERE batch_input_id = ${BI_ID}`;
    await client`DELETE FROM batch_inputs WHERE id = ${BI_ID}`;
    await client`DELETE FROM products WHERE id = ${PRODUCT_ID}`;
  });

  it("restock row increments stock without overwriting the product's supplier", async () => {
    if (!hasDb) return;
    const result = await createBatchInputHandler({
      id: BI_ID,
      supplier: "NEW Supplier",
      staffName: "Tester",
      items: [
        {
          mode: "restock",
          existingProductId: PRODUCT_ID,
          quantity: 7,
          sns: [],
        },
      ],
    });

    // The result batch should have exactly one item, with mode=restock
    expect(result.items.length).toBe(1);
    expect(result.items[0].mode).toBe("restock");
    expect(result.items[0].productId).toBe(PRODUCT_ID);
    expect(result.items[0].quantity).toBe(7);

    // The product's stock should be 5 + 7 = 12
    const [product] = (await client.unsafe(
      `SELECT stock, supplier, procurement_history FROM products WHERE id = $1`,
      [PRODUCT_ID],
    )) as Array<{ stock: number; supplier: string; procurement_history: string }>;
    expect(product.stock).toBe(12);
    // The supplier field is FROZEN — it should still be the introducing
    // supplier, not 'NEW Supplier'. The per-event supplier lives in
    // procurement_history.
    expect(product.supplier).toBe("ORIGINAL Supplier");
    // The procurement_history should have one entry, with supplier=NEW
    const history = JSON.parse(product.procurement_history);
    expect(history.length).toBe(1);
    expect(history[0].inv).toBe(BI_ID);
    expect(history[0].supplier).toBe("NEW Supplier");
  });

  it("per-row audit message uses the restock format", async () => {
    if (!hasDb) return;
    const [row] = (await client.unsafe(
      `SELECT details, action FROM audit_logs
       WHERE related_id = $1 AND action = 'Stock Addition'
         AND details LIKE 'Restocked%'
       ORDER BY timestamp DESC LIMIT 1`,
      [PRODUCT_ID],
    )) as Array<{ details: string; action: string }>;
    expect(row).toBeDefined();
    expect(row.details).toMatch(
      /^Restocked TestBrand TestModel \(\+7 units, total stock: 12\) from supplier NEW Supplier, invoice: BI-TEST-RESTOCK-/,
    );
  });

  it("summary audit message includes the restock clause (no new count)", async () => {
    if (!hasDb) return;
    const [row] = (await client.unsafe(
      `SELECT details FROM audit_logs
       WHERE related_id = $1 AND action = 'Batch Input Created'
       ORDER BY timestamp DESC LIMIT 1`,
      [BI_ID],
    )) as Array<{ details: string }>;
    expect(row).toBeDefined();
    // 0 barang baru, 1 restock — the restock clause is shown, the new
    // count is implicit (0).
    expect(row.details).toContain("0 barang baru");
    expect(row.details).toContain("1 restock");
    expect(row.details).toContain("dari NEW Supplier");
  });
});

describe("createBatchInputHandler — mixed new + restock in one batch", () => {
  const RUN2 = Date.now();
  const BI_MIXED = `BI-TEST-MIXED-${RUN2}`;
  const PRODUCT_TO_RESTOCK = `TEST-MIXED-RESTOCK-${RUN2}`;
  const NEW_PRODUCT_1 = `BRC-`; // server will append timestamp; we just check it appears

  beforeAll(async () => {
    if (!hasDb) return;
    await client`
      INSERT INTO products (
        id, brand, model, category, condition,
        price, cogs, warranty_months, warranty_type,
        stock, has_serial_number, supplier, date_restocked,
        tax_enabled, deleted, hidden,
        procurement_history
      ) VALUES (
        ${PRODUCT_TO_RESTOCK}, 'MixedBrand', 'MixedModel', 'Body', 'New',
        '100', '50', 12, 'Distributor',
        3, false, 'Mixed Introducing Supplier', NOW(),
        true, false, 0,
        '[]'::text
      )
      ON CONFLICT (id) DO NOTHING
    `;
  });

  afterAll(async () => {
    if (!hasDb) return;
    await client`DELETE FROM batch_input_items WHERE batch_input_id = ${BI_MIXED}`;
    await client`DELETE FROM batch_inputs WHERE id = ${BI_MIXED}`;
    // Cascade via the product_id is fine: the test cleans up the seed
    // product and the new products are matched by the LIKE pattern below.
    await client`DELETE FROM products WHERE id = ${PRODUCT_TO_RESTOCK}`;
    await client`DELETE FROM products WHERE id LIKE 'BRC-%' AND brand = 'NewBrand'`;
  });

  it("handles a mixed batch (1 new + 1 restock) and reports both counts in the summary", async () => {
    if (!hasDb) return;
    const result = await createBatchInputHandler({
      id: BI_MIXED,
      supplier: "Mixed Batch Supplier",
      staffName: "Tester",
      items: [
        {
          mode: "new",
          brand: "NewBrand",
          model: "NewModel",
          category: "Body",
          condition: "New",
          warrantyType: "Distributor",
          warrantyMonths: 12,
          cogs: 10,
          price: 20,
          hasSerialNumber: false,
          taxEnabled: true,
          quantity: 2,
          sns: [],
        },
        {
          mode: "restock",
          existingProductId: PRODUCT_TO_RESTOCK,
          quantity: 4,
          sns: [],
        },
      ],
    });

    expect(result.items.length).toBe(2);

    // The new product should have been created with a BRC-{ts}-{rand} id
    const newItems = result.items.filter((it) => it.mode === "new");
    const restockItems = result.items.filter((it) => it.mode === "restock");
    expect(newItems.length).toBe(1);
    expect(restockItems.length).toBe(1);
    expect(newItems[0].productId).toMatch(/^BRC-\d+-[a-z0-9]+$/i);
    expect(restockItems[0].productId).toBe(PRODUCT_TO_RESTOCK);

    // The restock target's stock should be 3 + 4 = 7
    const [product] = (await client.unsafe(`SELECT stock, supplier FROM products WHERE id = $1`, [
      PRODUCT_TO_RESTOCK,
    ])) as Array<{ stock: number; supplier: string }>;
    expect(product.stock).toBe(7);
    // supplier field is still the introducing supplier
    expect(product.supplier).toBe("Mixed Introducing Supplier");

    // The summary audit message should report both counts
    const [row] = (await client.unsafe(
      `SELECT details FROM audit_logs
       WHERE related_id = $1 AND action = 'Batch Input Created'
       ORDER BY timestamp DESC LIMIT 1`,
      [BI_MIXED],
    )) as Array<{ details: string }>;
    expect(row.details).toContain("1 barang baru");
    expect(row.details).toContain("1 restock");
  });
});
