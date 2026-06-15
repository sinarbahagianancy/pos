// Regression test for: createSerialNumbersBulk crashes with
//   "ERR_INVALID_ARG_TYPE: The 'string' argument must be of type string or
//    an instance of Buffer or ArrayBuffer. Received an instance of Date"
// when a `date` argument is supplied.
//
// Root cause: Drizzle's postgres-js driver (node_modules/drizzle-orm/postgres-js/driver.js)
// overrides the default date serializer for PG OIDs 1184/1114/1082/... with a
// transparent `(val) => val`. So `client.unsafe(sql, [..., new Date(d), ...])`
// passes the Date straight to `Buffer.byteLength` and crashes.
//
// Also covers: a retry with SNs that were inserted during a previous failed
// attempt used to fail with an opaque "Failed query" message. After the fix
// the function throws a clear "Serial number ... already exists" error.
//
// Requires a running test DB. Skipped if DATABASE_URL is not set.

import { describe, it, expect, beforeAll, afterAll } from "vite-plus/test";
import { eq } from "drizzle-orm";
import { createSerialNumbersBulk } from "../src/server/products";
import { client, db } from "../src/db";
import { products } from "../src/db/schema";

const TEST_PRODUCT_ID = "reg-sn-bulk-date-test";
const TEST_SN = `REG-SN-${Date.now()}`;
const hasDb = !!process.env.DATABASE_URL;

describe("createSerialNumbersBulk — date param regression", () => {
  beforeAll(async () => {
    if (!hasDb) return;
    await client`
      INSERT INTO products ${client({
        id: TEST_PRODUCT_ID,
        brand: "Reg",
        model: "Test",
        category: "Body",
        condition: "New",
        price: "100",
        cogs: "50",
        warranty_type: "Toko",
        stock: 0,
      } as any)}
      ON CONFLICT (id) DO NOTHING
    `;
  });

  afterAll(async () => {
    if (!hasDb) return;
    await client`DELETE FROM serial_numbers WHERE product_id = ${TEST_PRODUCT_ID}`;
    await client`DELETE FROM audit_logs WHERE related_id = ${TEST_PRODUCT_ID}`;
    await client`DELETE FROM products WHERE id = ${TEST_PRODUCT_ID}`;
    await client.end();
  });

  it("accepts a date string without crashing on Date→Buffer.byteLength", async () => {
    if (!hasDb) {
      // No DATABASE_URL set — document what we're protecting against so a
      // future reader can wire up the test DB and exercise the assertion.
      throw new Error(
        "DATABASE_URL not set — run with the test DB (docker compose -f docker-compose.test.yml up -d) " +
          "and DATABASE_URL=postgresql://postgres:postgres@localhost:5433/pos_test",
      );
    }

    // Before the fix this throws:
    //   TypeError [ERR_INVALID_ARG_TYPE]: The "string" argument must be of
    //   type string or an instance of Buffer or ArrayBuffer. Received an
    //   instance of Date
    const result = await createSerialNumbersBulk(
      [{ sn: TEST_SN, productId: TEST_PRODUCT_ID }],
      "Reg Supplier",
      "2024-01-15",
      "Reg reason",
      "REG-INV-001",
    );

    expect(result).toHaveLength(1);
    expect(result[0].sn).toBe(TEST_SN);
    expect(result[0].status).toBe("In Stock");

    // Verify the date was actually persisted as a timestamp
    const [updated] = await db
      .select({
        dateRestocked: products.dateRestocked,
        stock: products.stock,
        supplier: products.supplier,
      })
      .from(products)
      .where(eq(products.id, TEST_PRODUCT_ID));

    expect(updated.supplier).toBe("Reg Supplier");
    expect(updated.stock).toBe(1);
    expect(updated.dateRestocked).toBeInstanceOf(Date);
    expect((updated.dateRestocked as Date).getUTCFullYear()).toBe(2024);
    expect((updated.dateRestocked as Date).getUTCMonth()).toBe(0); // Jan = 0
    expect((updated.dateRestocked as Date).getUTCDate()).toBe(15);
  }, 20_000);

  it("throws a clear error when any SN already exists (no opaque DB error)", async () => {
    if (!hasDb) {
      throw new Error(
        "DATABASE_URL not set — run with the test DB (docker compose -f docker-compose.test.yml up -d) " +
          "and DATABASE_URL=postgresql://postgres:postgres@localhost:5433/pos_test",
      );
    }

    // First call (the test above) already inserted TEST_SN. A second call with
    // the same SN + a new one should throw an error that names the duplicate —
    // not a generic "Failed query" string. The new SN must not be inserted.
    const newSn = `REG-SN-NEW-${Date.now()}`;
    await expect(
      createSerialNumbersBulk(
        [
          { sn: TEST_SN, productId: TEST_PRODUCT_ID },
          { sn: newSn, productId: TEST_PRODUCT_ID },
        ],
        "Reg Supplier",
        "2024-01-15",
        "Reg reason",
        "REG-INV-002",
      ),
    ).rejects.toThrow(/already exists.*TEST_SN|already exists.*REG-SN-/);

    // Atomicity: the new SN must not have been inserted.
    const stillThere = await client`SELECT sn FROM serial_numbers WHERE sn = ${newSn}`;
    expect(stillThere).toHaveLength(0);
  }, 20_000);
});
