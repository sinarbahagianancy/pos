import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration for Sinar Bahagia POS
 *
 * Test database: Local Postgres via Docker (docker-compose.test.yml)
 * Auth: Pre-authenticated state saved in tests/e2e/.auth/admin.json
 *
 * Usage:
 *   vp run test:e2e          # Run all E2E tests
 *   vp run test:e2e --ui     # Run with Playwright UI
 *   vp run test:e2e --debug  # Debug mode
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Sequential to avoid DB conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker — shared test DB can't handle parallel writes
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // Setup project: runs auth setup to save login state
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    // Chromium with admin auth
    {
      name: "admin-chrome",
      testDir: "./tests/e2e",
      testIgnore: /login\.spec\.ts/, // Login tests don't need auth
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/admin.json",
      },
      dependencies: ["setup"],
    },

    // Login tests (no auth state)
    {
      name: "login",
      testMatch: /login\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  // Global setup: Docker Postgres + schema + seed
  globalSetup: require.resolve("./tests/e2e/global-setup"),

  // Start dev server before tests
  webServer: {
    command: "vp dev --port 3000",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      // Point the app at the test database
      DATABASE_URL:
        process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/pos_test",
    },
  },
});
