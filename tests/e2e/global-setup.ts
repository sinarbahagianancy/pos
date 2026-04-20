import { FullConfig } from "@playwright/test";
import { execSync } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import postgres from "postgres";

/**
 * Global setup for E2E tests:
 * 1. Start test Postgres via Docker
 * 2. Push schema via drizzle-kit
 * 3. Seed test data using Node.js postgres client (no psql dependency)
 *
 * Prerequisites:
 *   - Docker (for test database)
 *   - Run `npx playwright install` once to download browser binaries
 */

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/pos_test";

const SEED_SQL = `
  -- Clean existing data
  TRUNCATE TABLE serial_numbers, sales, sale_items, products, customers, suppliers, audit_logs, staff_members, store_config RESTART IDENTITY CASCADE;

  -- Store config
  INSERT INTO store_config (id, store_name, address, ppn_rate, currency, monthly_target)
  VALUES (1, 'Sinar Bahagia Test', 'Jl. Kramat Gantung No. 63', 11.00, 'IDR', 500000000);

  -- Admin user (password: nancy123 → base64: bmFuY3kxMjM=)
  INSERT INTO staff_members (id, name, role, password_hash)
  VALUES ('staff-admin-001', 'Nancy', 'Admin', 'bmFuY3kxMjM=');

  -- Staff user (password: staff123 → base64: c3RhZmYxMjM=)
  INSERT INTO staff_members (id, name, role, password_hash)
  VALUES ('staff-staff-001', 'StaffTest', 'Staff', 'c3RhZmYxMjM=');

  -- Sample supplier
  INSERT INTO suppliers (id, name, phone, address)
  VALUES ('sup-001', 'PT Sony Indonesia', '021-1234567', 'Jakarta');

  -- Sample product (with SN)
  INSERT INTO products (id, brand, model, category, condition, price, cogs, warranty_months, warranty_type, stock, has_serial_number, supplier, tax_enabled)
  VALUES ('BRC-TEST-001', 'Sony', 'A7IV', 'Body', 'New', 32000000, 28000000, 12, 'Official Sony Indonesia', 1, true, 'PT Sony Indonesia', true);

  -- Sample serial number
  INSERT INTO serial_numbers (sn, product_id, status)
  VALUES ('SN-TEST-001', 'BRC-TEST-001', 'In Stock');

  -- Sample product (non-SN)
  INSERT INTO products (id, brand, model, category, condition, price, cogs, warranty_months, warranty_type, stock, has_serial_number, supplier, tax_enabled)
  VALUES ('BRC-TEST-002', 'Sony', 'FE 50mm f/1.8', 'Lens', 'New', 3500000, 2500000, 6, 'Official Sony Indonesia', 5, false, 'PT Sony Indonesia', true);

  -- Sample customer
  INSERT INTO customers (id, name, phone, address)
  VALUES ('cust-001', 'John Test', '081234567890', 'Surabaya');
`;

async function globalSetup(config: FullConfig) {
  console.log("\n🧪 E2E Global Setup");

  // Step 1: Start Docker test database
  console.log("  → Starting test database...");
  try {
    execSync("docker compose -f docker-compose.test.yml up -d --wait", {
      stdio: "pipe",
      timeout: 30_000,
    });
    console.log("  ✓ Test database started");
  } catch {
    console.warn("  ⚠ Docker compose failed (may already be running). Continuing...");
  }

  // Step 2: Wait for Postgres to be ready using Node.js client
  console.log("  → Waiting for Postgres...");
  let sql: Awaited<ReturnType<typeof postgres>> | null = null;
  let retries = 20;
  while (retries > 0) {
    try {
      sql = postgres(TEST_DB_URL, { prepare: false });
      await sql`SELECT 1`;
      console.log("  ✓ Postgres is ready");
      break;
    } catch {
      if (sql) {
        await sql.end();
        sql = null;
      }
      retries--;
      if (retries === 0) {
        throw new Error("Postgres did not become ready in time");
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Step 3: Push schema via drizzle-kit
  console.log("  → Pushing schema to test database...");
  try {
    execSync(`DATABASE_URL="${TEST_DB_URL}" npx drizzle-kit push --force`, {
      stdio: "pipe",
      timeout: 30_000,
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    });
    console.log("  ✓ Schema pushed");
  } catch (e: any) {
    console.warn("  ⚠ Drizzle push failed (schema may already exist):", e.message?.slice(0, 200));
  }

  // Step 4: Seed test data using Node.js postgres client
  console.log("  → Seeding test data...");
  try {
    if (!sql) {
      sql = postgres(TEST_DB_URL, { prepare: false });
    }
    // Execute each statement separately to avoid issues with multi-statement queries
    const statements = SEED_SQL.split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      await sql.unsafe(stmt);
    }
    console.log("  ✓ Test data seeded");
  } catch (e: any) {
    console.warn("  ⚠ Seed failed:", e.message?.slice(0, 300));
  } finally {
    if (sql) await sql.end();
  }

  // Step 5: Ensure .auth directory exists for storageState
  const authDir = join(__dirname, ".auth");
  mkdirSync(authDir, { recursive: true });

  console.log("  ✅ Global setup complete\n");
}

export default globalSetup;
