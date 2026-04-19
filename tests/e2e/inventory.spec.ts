import { test, expect } from "@playwright/test";

test.describe("Inventory Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/inventory");
    // Wait for inventory table to load
    await expect(page.getByText("Master Inventori & Barcode")).toBeVisible({ timeout: 15_000 });
  });

  test("displays inventory table with seeded products", async ({ page }) => {
    // Should see the Sony A7IV product from seed data
    await expect(page.getByText("Sony")).toBeVisible();
    await expect(page.getByText("A7IV")).toBeVisible();
  });

  test("shows stock status indicators", async ({ page }) => {
    // The seeded product has 1 unit (low stock → red indicator)
    const stockCells = page.locator("tr").filter({ hasText: "A7IV" });
    await expect(stockCells).toBeVisible();
  });

  test("can search/filter products", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Ketik Merk / Model...");
    await searchInput.fill("Sony");
    // Should still show Sony products
    await expect(page.getByText("A7IV")).toBeVisible();
  });

  test("search with no results shows empty state", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Ketik Merk / Model...");
    await searchInput.fill("ZZZNONEXISTENT");
    // Table should be empty or show no results
    await expect(page.getByText("A7IV")).not.toBeVisible();
  });

  test("can open add product modal", async ({ page }) => {
    await page.getByRole("button", { name: /Input Barang Baru/i }).click();
    await expect(page.getByText("Penerimaan Barang Baru")).toBeVisible();
  });

  test("add product modal has required fields", async ({ page }) => {
    await page.getByRole("button", { name: /Input Barang Baru/i }).click();
    await expect(page.getByPlaceholder("Merk")).toBeVisible();
    await expect(page.getByPlaceholder("Model")).toBeVisible();
    await expect(page.getByText("Harga Jual (Retail)")).toBeVisible();
  });

  test("can open edit modal for a product", async ({ page }) => {
    // Find the edit button for the first product row
    const editButton = page.locator("tr").filter({ hasText: "A7IV" }).getByTitle("Edit Produk");
    await editButton.click();
    await expect(page.getByText("Edit Produk")).toBeVisible();
  });

  test("pagination controls are visible", async ({ page }) => {
    // Should show pagination controls at the bottom
    await expect(page.getByText(/dari.*produk/i)).toBeVisible();
  });
});
