import { test, expect } from "@playwright/test";

test.describe("POS (Cashier) Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pos");
    // Wait for POS to load
    await expect(page.getByPlaceholder(/Scan Barcode/i)).toBeVisible({ timeout: 15_000 });
  });

  test("displays POS search bar and cart", async ({ page }) => {
    await expect(page.getByPlaceholder(/Scan Barcode/i)).toBeVisible();
    await expect(page.getByText("Current Cart")).toBeVisible();
    await expect(page.getByText("Register Empty")).toBeVisible();
  });

  test("can search for products by brand/model", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Scan Barcode/i);
    await searchInput.fill("Sony");

    // Should show search results dropdown
    await expect(page.getByText("Products")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("A7IV")).toBeVisible();
  });

  test("can search by serial number", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Scan Barcode/i);
    await searchInput.fill("SN-TEST");

    // Should show serial number results
    await expect(page.getByText("Serial Numbers")).toBeVisible({ timeout: 5_000 });
  });

  test("can add product to cart via search results", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Scan Barcode/i);
    await searchInput.fill("Sony");

    // Wait for results and click on the Sony A7IV product
    await expect(page.getByText("A7IV")).toBeVisible({ timeout: 5_000 });
    await page.locator("button").filter({ hasText: "A7IV" }).first().click();

    // Cart should now have an item
    await expect(page.getByText("1 Unit(s)")).toBeVisible();
  });

  test("can search for customer", async ({ page }) => {
    const customerInput = page.getByPlaceholder("Search name...");
    await customerInput.fill("John");

    // Should show customer suggestion
    await expect(page.getByText("John Test")).toBeVisible({ timeout: 5_000 });
  });

  test("shows settlement methods", async ({ page }) => {
    await expect(page.getByText("Cash")).toBeVisible();
    await expect(page.getByText("Debit")).toBeVisible();
    await expect(page.getByText("QRIS")).toBeVisible();
  });

  test("shows PPN toggle", async ({ page }) => {
    const ppnLabel = page.getByText("Include PPN (11%)");
    await expect(ppnLabel).toBeVisible();
  });

  test("cart shows subtotal and total", async ({ page }) => {
    // Add a product first
    const searchInput = page.getByPlaceholder(/Scan Barcode/i);
    await searchInput.fill("Sony");
    await expect(page.getByText("A7IV")).toBeVisible({ timeout: 5_000 });
    await page.locator("button").filter({ hasText: "A7IV" }).first().click();

    // Should show subtotal
    await expect(page.getByText("Subtotal")).toBeVisible();
    await expect(page.getByText("Final Amount")).toBeVisible();
  });

  test("checkout button requires customer selection", async ({ page }) => {
    // Add a product
    const searchInput = page.getByPlaceholder(/Scan Barcode/i);
    await searchInput.fill("Sony");
    await expect(page.getByText("A7IV")).toBeVisible({ timeout: 5_000 });
    await page.locator("button").filter({ hasText: "A7IV" }).first().click();

    // Checkout button should be disabled without customer
    const checkoutBtn = page.getByRole("button", { name: /Selesaikan Transaksi/i });
    await expect(checkoutBtn).toBeDisabled();

    // Should show hint
    await expect(page.getByText(/Pilih customer/i)).toBeVisible();
  });
});
