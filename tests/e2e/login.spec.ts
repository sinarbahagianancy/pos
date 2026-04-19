import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("shows login form on /login", async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto("/login");
    await expect(page.getByText("Sinar Bahagia POS")).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible();
    await expect(page.getByPlaceholder("Enter password")).toBeVisible();
    await expect(page.getByRole("button", { name: /Access Dashboard/i })).toBeVisible();
  });

  test("rejects invalid password", async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto("/login");
    await page.getByRole("combobox").selectOption({ label: "Nancy" });
    await page.getByPlaceholder("Enter password").fill("wrongpassword");
    await page.getByRole("button", { name: /Access Dashboard/i }).click();

    await expect(page.getByText(/invalid/i)).toBeVisible();
  });

  test("logs in successfully with valid credentials", async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto("/login");
    await page.getByRole("combobox").selectOption({ label: "Nancy" });
    await page.getByPlaceholder("Enter password").fill("nancy123");
    await page.getByRole("button", { name: /Access Dashboard/i }).click();

    // Should redirect to main app
    await expect(page.getByText("Sinar Bahagia Surabaya")).toBeVisible({ timeout: 15_000 });
  });

  test("requires name and password", async ({ page }) => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    await page.goto("/login");
    await page.getByRole("button", { name: /Access Dashboard/i }).click();

    // Should show validation error
    await expect(page.getByText(/select.*name.*password/i)).toBeVisible();
  });
});
