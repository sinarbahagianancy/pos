import { test as setup, expect } from "@playwright/test";

/**
 * Authentication setup for E2E tests.
 * Logs in as the admin user (Nancy) and saves the auth state
 * so subsequent tests don't need to re-login.
 *
 * This runs as part of the "setup" project in playwright.config.ts.
 */

const ADMIN_PASSWORD = "nancy123";

setup("authenticate as admin", async ({ page }) => {
  // Navigate to login page
  await page.goto("/login");

  // Wait for the login form to appear
  await expect(page.getByText("Sinar Bahagia POS")).toBeVisible();

  // Select Nancy from the dropdown
  await page.getByRole("combobox").selectOption({ label: "Nancy" });

  // Enter password
  await page.getByPlaceholder("Enter password").fill(ADMIN_PASSWORD);

  // Click login button
  await page.getByRole("button", { name: /Access Dashboard/i }).click();

  // Wait for redirect to main app (sidebar should appear)
  await expect(page.getByText("Sinar Bahagia Surabaya")).toBeVisible();

  // Save auth state (localStorage with currentUser)
  await page.context().storageState({ path: "tests/e2e/.auth/admin.json" });
});
