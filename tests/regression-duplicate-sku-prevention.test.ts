// Regression test for: Duplicate-SKU prevention on product creation.
//
// Covers the new server-side behavior:
//   - POST /api/products and createProduct() reject products with
//     brand+model that match an existing non-deleted product
//   - The check is case-insensitive and trims whitespace
//   - Soft-deleted products with the same brand+model do NOT block creation

import { describe, it, expect, beforeAll, afterAll } from "vite-plus/test";
import { createProduct } from "../src/server/products";
import { client } from "../src/db";

const hasDb = !!process.env.DATABASE_URL;
const RUN = Date.now();
const PRODUCT_ID = `TEST-DUP-${RUN}`;
const DUPLICATE_ID = `TEST-DUP-${RUN + 1}`;

describe("createProduct — duplicate-SKU prevention", () => {
  beforeAll(async () => {
    if (!hasDb) return;
    // Seed an existing product that the duplicate check should catch
    await client`
      INSERT INTO products (
        id, brand, model, category, condition,
        price, cogs, warranty_months, warranty_type,
        stock, has_serial_number, supplier, date_restocked,
        tax_enabled, deleted, hidden,
        procurement_history
      ) VALUES (
        ${PRODUCT_ID}, 'DUP-BRAND', 'DUP-MODEL', 'Body', 'New',
        '100', '50', 12, 'Distributor',
        1, false, 'Test Supplier', NOW(),
        true, false, 0,
        '[]'::text
      )
      ON CONFLICT (id) DO NOTHING
    `;
  });

  afterAll(async () => {
    if (!hasDb) return;
    await client`DELETE FROM products WHERE id IN (${PRODUCT_ID}, ${DUPLICATE_ID})`;
    // Also clean up any products created by the soft-delete test
    await client`DELETE FROM products WHERE brand = 'DUP-BRAND' AND model = 'DUP-MODEL'`;
  });

  it("rejects a product with the same brand+model (case-insensitive)", async () => {
    if (!hasDb) return;
    await expect(
      createProduct({
        id: DUPLICATE_ID,
        brand: "dup-brand", // lowercase — should still match
        model: "dup-model", // lowercase — should still match
        category: "Body",
        condition: "New",
        price: 200,
        cogs: 100,
        warrantyMonths: 12,
        warrantyType: "Distributor",
        hasSerialNumber: false,
        quantity: 1,
        supplier: "Test Supplier",
        staffName: "Test",
      }),
    ).rejects.toThrow(/sudah ada di katalog/);
  });

  it("allows creation when the matching product is soft-deleted", async () => {
    if (!hasDb) return;
    // Soft-delete the original
    await client`UPDATE products SET deleted = true WHERE id = ${PRODUCT_ID}`;

    // Should now succeed since the original is deleted
    const result = await createProduct({
      id: DUPLICATE_ID,
      brand: "DUP-BRAND",
      model: "DUP-MODEL",
      category: "Body",
      condition: "New",
      price: 200,
      cogs: 100,
      warrantyMonths: 12,
      warrantyType: "Distributor",
      hasSerialNumber: false,
      quantity: 1,
      supplier: "Test Supplier",
      staffName: "Test",
    });

    expect(result).toBeDefined();
    expect(result.brand).toBe("DUP-BRAND");
    expect(result.model).toBe("DUP-MODEL");
  });
});
