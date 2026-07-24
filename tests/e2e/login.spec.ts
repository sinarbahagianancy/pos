import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("shows login form on /login", async ({ page }) => {
    // Clear any existing auth state (must happen after a same-origin navigation,
    // otherwise localStorage.clear() throws on the initial about:blank document)
    await page.context().clearCookies();
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await expect(page.getByText("Sinar Bahagia POS")).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible();
    await expect(page.getByPlaceholder("Enter password")).toBeVisible();
    await expect(page.getByRole("button", { name: /Access Dashboard/i })).toBeVisible();
  });

  test("rejects invalid password", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    const staffPicker = page.getByRole("combobox");
    await staffPicker.click();
    await page.getByRole("option", { name: "Nancy" }).click();
    await page.getByPlaceholder("Enter password").fill("wrongpassword");
    await page.getByRole("button", { name: /Access Dashboard/i }).click();

    await expect(page.getByText(/invalid/i)).toBeVisible();
  });

  test("logs in successfully with valid credentials", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    const staffPicker = page.getByRole("combobox");
    await staffPicker.click();
    await page.getByRole("option", { name: "Nancy" }).click();
    await page.getByPlaceholder("Enter password").fill("nancy123");
    await page.getByRole("button", { name: /Access Dashboard/i }).click();

    // Should redirect to main app
    await expect(page.getByText("Sinar Bahagia Surabaya")).toBeVisible({ timeout: 15_000 });
  });

  test("requires name and password", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("button", { name: /Access Dashboard/i }).click();

    // Should show validation error
    await expect(page.getByText(/select.*name.*password/i)).toBeVisible();
  });
});
