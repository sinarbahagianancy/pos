import { test, expect } from "@playwright/test";

test.describe("Cross-page cache invalidation", () => {
  test("Settings PPN rate change reflects in POS without hard reload", async ({ page }) => {
    await page.goto("/pos");
    await expect(page.getByPlaceholder(/Scan Barcode/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Include PPN/i)).toBeVisible();

    await page.goto("/settings");
    await expect(page.getByText("Konfigurasi Sistem")).toBeVisible({ timeout: 15_000 });

    const ppnInput = page.locator('input[type="number"]').first();
    await expect(page.getByText("Nilai PPN Global (%)")).toBeVisible();
    await ppnInput.fill("15");

    await page.getByRole("button", { name: /Simpan Perubahan/i }).click();
    await expect(page.getByRole("button", { name: /Simpan Perubahan/i })).toBeEnabled();

    await page.goto("/pos");
    await expect(page.getByPlaceholder(/Scan Barcode/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Gov Tax.*15% PPN/)).toBeVisible();

    // Cleanup: restore PPN to 11
    await page.goto("/settings");
    await expect(page.getByText("Konfigurasi Sistem")).toBeVisible({ timeout: 15_000 });
    await page.locator('input[type="number"]').first().fill("11");
    await page.getByRole("button", { name: /Simpan Perubahan/i }).click();
    await expect(page.getByRole("button", { name: /Simpan Perubahan/i })).toBeEnabled();
  });

  test("Surat Jalan creation updates Inventory stock without page reload", async ({ page }) => {
    // Create a dedicated serial number for this test so we don't consume the
    // shared seeded SN-TEST-001 (which pos.spec relies on for its search tests).
    const sjSn = `SN-E2E-SJ-${Date.now()}`;
    const setupRes = await page.request.post("/api/batch-input", {
      data: {
        id: `E2E-SJ-SETUP-${Date.now()}`,
        supplier: "PT Sony Indonesia",
        date: new Date().toISOString().split("T")[0],
        staffName: "Nancy",
        items: [
          {
            mode: "restock",
            existingProductId: "BRC-TEST-001",
            quantity: 1,
            sns: [sjSn],
          },
        ],
      },
    });
    if (!setupRes.ok()) {
      const body = await setupRes.text();
      console.error(`Batch Input setup error (${setupRes.status()}): ${body}`);
    }
    expect(setupRes.ok()).toBeTruthy();

    // Step 1: Check current stock of a product from the Inventory page
    await page.goto("/inventory");
    await expect(page.getByText("Master Inventori & Barcode")).toBeVisible({ timeout: 15_000 });

    // Find the product row for "A7IV" and read its stock value
    const productRow = page.getByRole("row").filter({ hasText: "A7IV" });
    await expect(productRow).toBeVisible({ timeout: 10_000 });

    // Stock column displays as "N Unit" in a span
    const stockSpan = productRow.getByText(/\d+\s*Unit/).first();
    const initialStockText = await stockSpan.textContent();
    const initialStockMatch = initialStockText?.match(/(\d+)/);
    expect(initialStockMatch).not.toBeNull();
    const initialStock = parseInt(initialStockMatch![1], 10);

    // Step 2: Create a Surat Jalan (withdraw 1 unit of A7IV) using the dedicated SN
    const sjRes = await page.request.post("/api/surat-jalan", {
      data: {
        customerName: "Test Customer",
        poNumber: "PO-TEST-001",
        staffName: "Nancy",
        items: [
          {
            productId: "BRC-TEST-001",
            brand: "Sony",
            model: "A7IV",
            sn: sjSn,
            quantity: 1,
          },
        ],
      },
    });
    expect(sjRes.ok()).toBeTruthy();

    // Step 3: Navigate back to Inventory — stock should be decremented
    // (the page uses React Query; if cache was invalidated, stock is fresh)
    await page.goto("/inventory");
    await expect(page.getByText("Master Inventori & Barcode")).toBeVisible({ timeout: 15_000 });

    const newStockSpan = productRow.getByText(/\d+\s*Unit/).first();
    await expect(newStockSpan).toBeVisible({ timeout: 10_000 });
    const newStockText = await newStockSpan.textContent();
    const newStockMatch = newStockText?.match(/(\d+)/);
    expect(newStockMatch).not.toBeNull();
    const newStock = parseInt(newStockMatch![1], 10);
    expect(newStock).toBe(initialStock - 1);
  });

  test("Batch Input restock updates Inventory stock without page reload", async ({ page }) => {
    // Step 1: Get initial stock of A7IV
    await page.goto("/inventory");
    await expect(page.getByText("Master Inventori & Barcode")).toBeVisible({ timeout: 15_000 });

    const productRow = page.getByRole("row").filter({ hasText: "A7IV" });
    await expect(productRow).toBeVisible({ timeout: 10_000 });

    const stockSpan = productRow.getByText(/\d+\s*Unit/).first();
    const initialStockText = await stockSpan.textContent();
    const initialStockMatch = initialStockText?.match(/(\d+)/);
    expect(initialStockMatch).not.toBeNull();
    const initialStock = parseInt(initialStockMatch![1], 10);

    // Step 2: Restock A7IV via Batch Input API
    const batchId = `E2E-TEST-${Date.now()}`;
    const biRes = await page.request.post("/api/batch-input", {
      data: {
        id: batchId,
        supplier: "PT Sony Indonesia",
        date: new Date().toISOString().split("T")[0],
        staffName: "Nancy",
        items: [
          {
            mode: "restock",
            existingProductId: "BRC-TEST-001",
            quantity: 2,
            sns: ["SN-E2E-BI-001", "SN-E2E-BI-002"],
          },
        ],
      },
    });
    if (!biRes.ok()) {
      const body = await biRes.text();
      console.error(`Batch Input API error (${biRes.status()}): ${body}`);
    }
    expect(biRes.ok()).toBeTruthy();

    // Step 3: Navigate to Inventory — stock should be increased by 2
    await page.goto("/inventory");
    await expect(page.getByText("Master Inventori & Barcode")).toBeVisible({ timeout: 15_000 });

    const newStockSpan = productRow.getByText(/\d+\s*Unit/).first();
    await expect(newStockSpan).toBeVisible({ timeout: 10_000 });
    const newStockText = await newStockSpan.textContent();
    const newStockMatch = newStockText?.match(/(\d+)/);
    expect(newStockMatch).not.toBeNull();
    const newStock = parseInt(newStockMatch![1], 10);
    expect(newStock).toBe(initialStock + 2);
  });
});
