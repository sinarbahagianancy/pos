# Fix 504 Gateway Timeout on `/api/store-config`

## Problem

Every Vercel serverless cold start resets the in-memory `initialized` flag to `false`. This forces [initializeDatabase()](file:///home/edward/Documents/pos/api/index.ts#403-609) to run **30+ sequential `ALTER TABLE` / `ALTER TYPE` SQL statements** before the actual business query executes. With Neon Postgres over the network, 30+ round-trips easily exceed Vercel's 10-second function timeout → **504**.

```
Cold start → initialized = false
→ initializeDatabase() runs ~30 sequential SQL ALTER statements
→ Each round-trip ~100–300 ms
→ Total ~3–9 seconds of migrations BEFORE the real query
→ 504 if the DB is slow or connection pools under load
```

## Fix: DB-Level Sentinel (One-Time Migration Guard)

Replace the in-memory `initialized` flag with a two-step check:

1. Create a `migrations_log` table with `IF NOT EXISTS` (single fast DDL).
2. Try to insert a row with a unique migration key. If it already exists (conflict), skip all migrations immediately.
3. If the insert succeeded, run all migrations, then commit the row.

This means:

- **First ever call:** runs all migrations (~3–9 s) — acceptable one-off.
- **Every subsequent cold start:** does 2 fast queries (create table + insert-on-conflict) and exits immediately — **< 50 ms overhead**.

### Secondary Fix: Remove [initializeDatabase()](file:///home/edward/Documents/pos/api/index.ts#403-609) from routes that don't need it

Currently [initializeDatabase()](file:///home/edward/Documents/pos/api/index.ts#403-609) is called inside routes like `GET /api/store-config` which do not depend on any of the optional columns being added. We should move it out of those route handlers, or better, call it at the **top of the module** (outside the handler function) so it runs once per instance warm-up in the background.

## Proposed Changes

---

### API Layer

#### [MODIFY] [index.ts](file:///home/edward/Documents/pos/api/index.ts)

**Change 1 — Replace in-memory flag with DB-level sentinel:**

```diff
-let initialized = false;
+// DB-level migration sentinel key
+const MIGRATION_KEY = "v1-init";

 const initializeDatabase = async () => {
-  if (initialized) return;
+  // Fast DB-level check: create sentinel table then try to insert
+  await client.unsafe(`
+    CREATE TABLE IF NOT EXISTS migrations_log (
+      key text PRIMARY KEY,
+      ran_at timestamp DEFAULT NOW()
+    )
+  `);
+  const result = await client.unsafe(
+    `INSERT INTO migrations_log (key) VALUES ($1) ON CONFLICT (key) DO NOTHING RETURNING key`,
+    [MIGRATION_KEY]
+  );
+  // If nothing was inserted, migrations already ran — skip
+  if (!result || result.length === 0) return;

   try {
     // ... existing ALTER TABLE statements ...
```

**Change 2 — Call [initializeDatabase()](file:///home/edward/Documents/pos/api/index.ts#403-609) once at module level (outside the request handler):**

```diff
+// Kick off initialization in the background on cold start.
+// This way the first warm call will await the promise,
+// and subsequent calls skip it via the DB sentinel.
+let initPromise: Promise<void> | null = null;

 export default async function handler(req: VercelRequest, res: VercelResponse) {
+  if (!initPromise) {
+    initPromise = initializeDatabase();
+  }
+  await initPromise;
+
   // ... route handlers ...
   // Remove all per-route calls to `await initializeDatabase();`
```

This ensures:

- All routes benefit from initialization without duplicating the call.
- The `initPromise` caches the in-flight / resolved promise, so parallel requests on the same warm instance don't double-initialize.
- The DB sentinel handles cross-instance deduplication.

## Verification Plan

### Automated Tests

No existing test suite was found for this project. The test is done via a direct HTTP call:

```bash
# Should respond in < 3 seconds instead of timing out
time curl -s https://pos-sinar-bahagia.vercel.app/api/store-config
```

Expected: JSON with store config data, response time < 3 s.

### Manual Verification

After deploying to Vercel:

1. Open a browser or Postman and hit `https://pos-sinar-bahagia.vercel.app/api/store-config`
2. Response should come back in under 3 seconds with JSON (not a 504).
3. Check Vercel Function logs to confirm `"Database initialized"` appears only once across cold starts (subsequent calls show nothing / return immediately).
