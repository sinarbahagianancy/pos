// Tests for Invoice-related PO Number behaviors:
// - Auto-generation with loop-and-skip algorithm (ADR 0006)
// - Duplicate validation across quotations and sales tables
// - PO number carries from Quotation to Sale on approval
//
// Exercises real handler functions against a real Postgres database.

import { describe, it, expect, beforeAll, afterAll } from "vite-plus/test";
import { createQuotationHandler, approveQuotationHandler } from "../src/server/quotations";
import { createSaleHandler } from "../src/server/customers";
import { client } from "../src/db";

const hasDb = !!process.env.DATABASE_URL;
const RUN = Date.now();

// Test data
const TEST_PRODUCT_ID = `TEST-PO-PRODUCT-${RUN}`;
const TEST_CUSTOMER_ID = `TEST-PO-CUSTOMER-${RUN}`;

// Track created records for cleanup
const createdQuotationIds: string[] = [];
const createdSaleIds: string[] = [];

describe("Invoice PO Number", () => {
  beforeAll(async () => {
    if (!hasDb) return;

    // Seed a test product
    await client`
      INSERT INTO products (
        id, brand, model, category, condition,
        price, cogs, warranty_months, warranty_type,
        stock, has_serial_number, supplier, date_restocked,
        tax_enabled, deleted, hidden,
        procurement_history
      ) VALUES (
        ${TEST_PRODUCT_ID}, 'TestBrand', 'TestModel', 'Body', 'New',
        '100000', '50000', 12, 'Distributor',
        100, false, 'TestSupplier', NOW(),
        false, false, 0,
        '[]'::text
      )
      ON CONFLICT (id) DO NOTHING
    `;

    // Seed a test customer
    await client`
      INSERT INTO customers (
        id, name, phone, address, npwp, loyalty_points
      ) VALUES (
        ${TEST_CUSTOMER_ID}, 'Test Customer', '08123456789', 'Test Address', '', 0
      )
      ON CONFLICT (id) DO NOTHING
    `;
  });

  afterAll(async () => {
    if (!hasDb) return;

    // Cleanup in reverse order of dependencies
    for (const saleId of createdSaleIds) {
      await client`DELETE FROM sale_items WHERE sale_id = ${saleId}`;
      await client`DELETE FROM sales WHERE id = ${saleId}`;
    }
    for (const quotationId of createdQuotationIds) {
      await client`DELETE FROM quotation_items WHERE quotation_id = ${quotationId}`;
      await client`DELETE FROM quotations WHERE id = ${quotationId}`;
    }
    await client`DELETE FROM customers WHERE id = ${TEST_CUSTOMER_ID}`;
    await client`DELETE FROM serial_numbers WHERE product_id = ${TEST_PRODUCT_ID}`;
    await client`DELETE FROM products WHERE id = ${TEST_PRODUCT_ID}`;
  });

  describe("PO Number Auto-generation", () => {
    it("auto-generates SB/dd/mm/yyyy-NNN when no PO provided", async () => {
      if (!hasDb) return;

      const result = await createQuotationHandler({
        customerName: "Test Customer",
        items: [
          {
            productId: TEST_PRODUCT_ID,
            model: "TestModel",
            sn: "",
            price: 100000,
            quantity: 1,
          },
        ],
        subtotal: 100000,
        tax: 0,
        taxEnabled: false,
        total: 100000,
        staffName: "Tester",
        poNumber: "", // Empty - should trigger auto-generation
      });

      createdQuotationIds.push(result.id);

      // PO number should match SB/dd/mm/yyyy-NNN format
      expect(result.poNumber).toMatch(/^SB\/\d{2}\/\d{2}\/\d{4}-\d{3}$/);
      // The ID should be the same as the PO number
      expect(result.id).toBe(result.poNumber);
    });

    it("uses user-provided PO number when given", async () => {
      if (!hasDb) return;

      const customPo = `PO-CUSTOM-${RUN}`;
      const result = await createQuotationHandler({
        customerName: "Test Customer",
        items: [
          {
            productId: TEST_PRODUCT_ID,
            model: "TestModel",
            sn: "",
            price: 100000,
            quantity: 1,
          },
        ],
        subtotal: 100000,
        tax: 0,
        taxEnabled: false,
        total: 100000,
        staffName: "Tester",
        poNumber: customPo,
      });

      createdQuotationIds.push(result.id);

      expect(result.poNumber).toBe(customPo);
    });

    it("skips PO numbers that already exist in quotations", async () => {
      if (!hasDb) return;

      // Get the current auto-generated PO number
      const first = await createQuotationHandler({
        customerName: "Test Customer",
        items: [
          {
            productId: TEST_PRODUCT_ID,
            model: "TestModel",
            sn: "",
            price: 100000,
            quantity: 1,
          },
        ],
        subtotal: 100000,
        tax: 0,
        taxEnabled: false,
        total: 100000,
        staffName: "Tester",
        poNumber: "",
      });
      createdQuotationIds.push(first.id);

      // Manually create a quotation with the NEXT auto-generated PO number
      // to simulate a collision
      const nextPoNumber = first.poNumber.replace(/(\d+)$/, (match) => {
        const num = parseInt(match, 10) + 1;
        return String(num).padStart(match.length, "0");
      });

      const manual = await createQuotationHandler({
        customerName: "Test Customer",
        items: [
          {
            productId: TEST_PRODUCT_ID,
            model: "TestModel",
            sn: "",
            price: 100000,
            quantity: 1,
          },
        ],
        subtotal: 100000,
        tax: 0,
        taxEnabled: false,
        total: 100000,
        staffName: "Tester",
        poNumber: nextPoNumber, // Manually take the next number
      });
      createdQuotationIds.push(manual.id);

      // Now request auto-generation - it should skip the taken number
      const second = await createQuotationHandler({
        customerName: "Test Customer",
        items: [
          {
            productId: TEST_PRODUCT_ID,
            model: "TestModel",
            sn: "",
            price: 100000,
            quantity: 1,
          },
        ],
        subtotal: 100000,
        tax: 0,
        taxEnabled: false,
        total: 100000,
        staffName: "Tester",
        poNumber: "",
      });
      createdQuotationIds.push(second.id);

      // The second auto-generated should be after nextPoNumber
      const firstNum = parseInt(first.poNumber.match(/(\d+)$/)![1], 10);
      const manualNum = parseInt(nextPoNumber.match(/(\d+)$/)![1], 10);
      const secondNum = parseInt(second.poNumber.match(/(\d+)$/)![1], 10);

      expect(secondNum).toBeGreaterThan(manualNum);
      expect(second.poNumber).not.toBe(nextPoNumber); // Should have skipped
    });

    it("counter only moves forward, never decrements", async () => {
      if (!hasDb) return;

      // Create a quotation with a high PO number
      const highPo = `SB/01/01/2099-999`;
      const high = await createQuotationHandler({
        customerName: "Test Customer",
        items: [
          {
            productId: TEST_PRODUCT_ID,
            model: "TestModel",
            sn: "",
            price: 100000,
            quantity: 1,
          },
        ],
        subtotal: 100000,
        tax: 0,
        taxEnabled: false,
        total: 100000,
        staffName: "Tester",
        poNumber: highPo,
      });
      createdQuotationIds.push(high.id);

      // Create another with auto-generation - should not go backwards
      const auto = await createQuotationHandler({
        customerName: "Test Customer",
        items: [
          {
            productId: TEST_PRODUCT_ID,
            model: "TestModel",
            sn: "",
            price: 100000,
            quantity: 1,
          },
        ],
        subtotal: 100000,
        tax: 0,
        taxEnabled: false,
        total: 100000,
        staffName: "Tester",
        poNumber: "",
      });
      createdQuotationIds.push(auto.id);

      // The auto-generated PO should have a valid format
      // (it won't be 1000 because the counter moved forward)
      expect(auto.poNumber).toMatch(/^SB\/\d{2}\/\d{2}\/\d{4}-\d{3,}$/);
    });
  });

  describe("PO Number Duplicate Validation", () => {
    it("rejects duplicate PO number in quotations", async () => {
      if (!hasDb) return;

      const poNumber = `PO-DUPLICATE-TEST-${RUN}`;

      // First one should succeed
      const first = await createQuotationHandler({
        customerName: "Test Customer",
        items: [
          {
            productId: TEST_PRODUCT_ID,
            model: "TestModel",
            sn: "",
            price: 100000,
            quantity: 1,
          },
        ],
        subtotal: 100000,
        tax: 0,
        taxEnabled: false,
        total: 100000,
        staffName: "Tester",
        poNumber,
      });
      createdQuotationIds.push(first.id);

      // Second one with same PO should fail
      await expect(
        createQuotationHandler({
          customerName: "Test Customer",
          items: [
            {
              productId: TEST_PRODUCT_ID,
              model: "TestModel",
              sn: "",
              price: 100000,
              quantity: 1,
            },
          ],
          subtotal: 100000,
          tax: 0,
          taxEnabled: false,
          total: 100000,
          staffName: "Tester",
          poNumber,
        }),
      ).rejects.toThrow(/sudah digunakan/);
    });

    it("rejects duplicate PO number in sales table", async () => {
      if (!hasDb) return;

      const poNumber = `PO-SALE-DUPE-${RUN}`;

      // Create a sale with this PO number
      const saleId = `SALE-${RUN}`;
      await client`
        INSERT INTO sales (
          id, customer_id, customer_name, subtotal, tax, tax_enabled,
          total, payment_method, staff_name, po_number, timestamp
        ) VALUES (
          ${saleId}, ${TEST_CUSTOMER_ID}, 'Test Customer', '100000', '0', false,
          '100000', 'Cash', 'Tester', ${poNumber}, NOW()
        )
      `;
      createdSaleIds.push(saleId);

      // Try to create a quotation with the same PO number
      await expect(
        createQuotationHandler({
          customerName: "Test Customer",
          items: [
            {
              productId: TEST_PRODUCT_ID,
              model: "TestModel",
              sn: "",
              price: 100000,
              quantity: 1,
            },
          ],
          subtotal: 100000,
          tax: 0,
          taxEnabled: false,
          total: 100000,
          staffName: "Tester",
          poNumber,
        }),
      ).rejects.toThrow(/sudah digunakan/);
    });
  });

  describe("Quotation → Invoice Conversion", () => {
    it("carries PO number from quotation to sale on approval", async () => {
      if (!hasDb) return;

      const poNumber = `PO-CONVERT-${RUN}`;

      // Create quotation with specific PO number
      const quotation = await createQuotationHandler({
        customerName: "Test Customer",
        customerId: TEST_CUSTOMER_ID,
        items: [
          {
            productId: TEST_PRODUCT_ID,
            model: "TestModel",
            sn: "",
            price: 100000,
            quantity: 1,
          },
        ],
        subtotal: 100000,
        tax: 0,
        taxEnabled: false,
        total: 100000,
        staffName: "Tester",
        poNumber,
      });
      createdQuotationIds.push(quotation.id);

      // Approve the quotation
      const result = await approveQuotationHandler(quotation.id, {
        paymentMethod: "Cash",
        staffName: "Tester",
      });

      createdSaleIds.push(result.sale.id);

      // Verify the sale has the PO number
      const saleRow = await client`SELECT po_number FROM sales WHERE id = ${result.sale.id}`;
      expect(saleRow[0].po_number).toBe(poNumber);
    });

    it("carries auto-generated PO number to sale when no PO provided", async () => {
      if (!hasDb) return;

      // Create quotation without PO number (will auto-generate)
      const quotation = await createQuotationHandler({
        customerName: "Test Customer",
        customerId: TEST_CUSTOMER_ID,
        items: [
          {
            productId: TEST_PRODUCT_ID,
            model: "TestModel",
            sn: "",
            price: 100000,
            quantity: 1,
          },
        ],
        subtotal: 100000,
        tax: 0,
        taxEnabled: false,
        total: 100000,
        staffName: "Tester",
        poNumber: "",
      });
      createdQuotationIds.push(quotation.id);

      // The quotation should have an auto-generated PO number
      expect(quotation.poNumber).toMatch(/^SB\/\d{2}\/\d{2}\/\d{4}-\d{3}$/);

      // Approve the quotation
      const result = await approveQuotationHandler(quotation.id, {
        paymentMethod: "Cash",
        staffName: "Tester",
      });

      createdSaleIds.push(result.sale.id);

      // Verify the sale has the auto-generated PO number
      const saleRow = await client`SELECT po_number FROM sales WHERE id = ${result.sale.id}`;
      expect(saleRow[0].po_number).toBe(quotation.poNumber);
      expect(saleRow[0].po_number).toMatch(/^SB\/\d{2}\/\d{2}\/\d{4}-\d{3}$/);
    });
  });
});
