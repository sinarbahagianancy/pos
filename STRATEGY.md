# Performance & Architecture Improvement Strategy
## sinar-bahagia-pos (React + TanStack Router + Vercel + Supabase)

---

## Current Architecture

```
React (TanStack Router) --> /api/* (Vercel Serverless) --> Supabase Postgres (cloud)
                                |
                          api/index.ts (monolithic handler)
                          2352 lines, all routes in one file
```

- **Client**: React SPA, calls `/api/*` via fetch from `app/services/*.api.ts`
- **API**: Single Vercel serverless function (`api/index.ts`) using `postgres.js` (raw SQL)
- **DB**: Supabase hosted Postgres, connection via Transaction pooler (port 6543)
- **Dev**: Vite plugin (`src/server/api-dev.ts`) mirrors the same routes with Drizzle

---

## Issue #1: N+1 Queries (CRITICAL)

### Status: `/api/sales` FIXED. Other endpoints still affected.

### 1a. GET /api/sales -- FIXED
- **Before**: 1 query for sales + 1 query per sale for items = 501 queries at limit=500
- **After**: 3 queries total (sale IDs, COUNT, JOIN for sales+items)
- **Expected improvement**: 10s+ --> <500ms

### 1b. POST /api/serial-numbers/bulk -- N+1 per product (lines 1015-1068)
**Current**: For each product in the bulk insert, runs 3-4 queries sequentially:
```typescript
for (const [productId, { count, sns }] of productCounts) {
  // Query 1: SELECT invoice_number FROM products WHERE id = $1  (line 1031)
  // Query 2: UPDATE products SET ... WHERE id = $1               (line 1042)
  // Query 3: SELECT brand, model FROM products WHERE id = $1     (line 1048)
  // Query 4: INSERT INTO audit_logs ...                          (line 1057)
}
```
If bulk-inserting SNs for 10 products, that's 30-40 queries.

**Fix strategy**:
1. Batch-fetch ALL product invoice_numbers, brands, models upfront with `WHERE id = ANY($1)`
2. Compute all updates in-memory
3. Use a single batched UPDATE with CASE WHEN or multiple individual UPDATEs in parallel via `Promise.all`
4. Batch all audit log inserts into one multi-row INSERT

### 1c. POST /api/sales (create) -- Minor N+1 (lines 1993-1999)
```typescript
for (const [productId, qty] of productQuantities) {
  await client.unsafe(`UPDATE products SET stock = stock - $1 WHERE id = $2`, [qty, productId]);
}
```
**Impact**: Low (typical sale has 1-3 items). But could be optimized with a single CASE WHEN update.

### 1d. Dev server handler -- Still has N+1
`src/server/customers.ts` `getAllSalesHandler` -- now FIXED to match prod.

---

## Issue #2: Unbounded Queries (HIGH)

### 2a. GET /api/serial-numbers (line 982)
```typescript
const result = await client.unsafe("SELECT * FROM serial_numbers");
```
**Problem**: Returns ALL serial numbers with no pagination. As SN table grows, this will blow up.
**Fix**: Add pagination. Also consider filtering (by status, product, date range).

### 2b. GET /api/sale-items (line 2207)
```typescript
const result = await client.unsafe("SELECT * FROM sale_items ORDER BY id DESC");
```
**Problem**: Returns ALL sale items ever. Completely unbounded.
**Fix**: Add pagination. In practice, this endpoint may not even be needed if the JOIN approach on sales already returns items.

### 2c. COUNT(*) queries on large tables
Multiple endpoints run `SELECT COUNT(*) as count FROM <table>` with no WHERE clause:
- `/api/sales` (line 1792) -- OK for now but will slow as sales grow
- `/api/customers` (line 72 in customers.ts)
- `/api/warranty-claims` (line 2331)

**Fix strategy**: 
- For exact counts on large tables, consider caching or estimated counts
- PostgreSQL's `pg_stat_user_tables.n_live_tup` gives fast estimated row counts
- Or use `COUNT(*)` with the same WHERE filter as the data query

---

## Issue #3: No Transactions on Write Operations (MEDIUM-HIGH)

### POST /api/sales (line 1898)
Comment says: `// Use non-transactional approach for reliability`

**Problem**: If the serverless function crashes mid-operation (after inserting sale but before updating stock), the database is left in an inconsistent state. You could have a sale record with no stock deduction.

**Current flow** (not atomic):
1. INSERT sale
2. INSERT sale_items (batched)
3. UPDATE serial_numbers (batched)
4. UPDATE products stock (loop -- N queries)
5. INSERT audit_logs (batched)
6. UPDATE customer loyalty_points

**Fix**: Use `client.begin()` (postgres.js transaction API). The `customers.ts` dev handler already does this correctly in `createSaleHandler` (line 339: `return await client.begin(async (tx) => { ... })`).

**Why it was removed**: Vercel serverless functions can time out (10s default, 60s max on Pro). Long transactions risk being killed mid-flight, causing rollbacks. But the current approach is WORSE -- partial writes with no rollback.

**Recommendation**: Restore transactions. The sale creation is fast (sub-second with the batched approach). The timeout risk only applies to extremely slow queries, which is a separate problem.

---

## Issue #4: Connection Pooling (MEDIUM)

```typescript
const client = postgres(connectionString, {
  prepare: false,
  max: 1,
  idle_timeout: 30,
  connect_timeout: 10,
});
```

**Current**: max=1 connection per serverless instance. This is correct for Vercel serverless (each function gets its own instance, and instances are reused briefly).

**Additional optimization**: Use Supabase's Transaction pooler (port 6543) instead of the Session pooler (port 5432). The Transaction pooler is designed for serverless -- it handles connection multiplexing on Supabase's side.

**Verify**: Check `DATABASE_URL` in Vercel env vars. It should use port 6543:
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

---

## Issue #5: Missing Database Indexes (MEDIUM)

Check if these indexes exist. They likely don't since Drizzle migrations may not have created them:

```sql
-- sale_items: queried by sale_id in every sales fetch
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- serial_numbers: queried by product_id, filtered by status
CREATE INDEX IF NOT EXISTS idx_serial_numbers_product_id ON serial_numbers(product_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON serial_numbers(status);

-- sales: always ordered by timestamp DESC
CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp DESC);

-- audit_logs: always ordered by timestamp DESC
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
```

**How to apply**: Run via `psql` against the Supabase DB, or add to a migration file.

---

## Issue #6: Monolithic API Handler (LOW priority, HIGH maintainability)

`api/index.ts` is 2352 lines with every route in a single `if/else if` chain.

**Problems**:
- Hard to navigate and maintain
- No per-route middleware (auth checks are inconsistent)
- Duplicated validation logic between `api/index.ts` and `src/server/*.ts`
- Dev server (`api-dev.ts`) and prod (`api/index.ts`) have drifted -- they're separate implementations of the same routes

**Fix strategy** (can be done incrementally):
1. Extract route handlers into separate files: `api/routes/sales.ts`, `api/routes/products.ts`, etc.
2. Create a simple router utility that maps `(method, path)` to handler functions
3. Share validation/parsing logic between dev and prod
4. Consider using Hono or itty-router as a lightweight router inside the Vercel function

---

## Issue #7: No Response Caching (LOW)

Currently, every request hits the database. For read-heavy endpoints like:
- `/api/products` (product catalog changes rarely)
- `/api/store-config` (almost never changes)
- `/api/staff` (changes rarely)

**Options**:
1. **HTTP Cache-Control headers**: `Cache-Control: public, max-age=60` for product listings
2. **Vercel Edge Caching**: Add `s-maxage` and `stale-while-revalidate` headers
3. **In-memory cache**: Use a simple Map with TTL inside the serverless function (lives for the duration of the warm instance)

**Simplest win**: Add `Cache-Control` headers to GET endpoints that don't change frequently.

---

## Issue #8: Numeric String Parsing (LOW)

Every `parseDb*` function has this pattern:
```typescript
price: typeof row.price === "string" ? parseFloat(row.price) : (row.price as number),
```

This is because `postgres.js` returns `numeric` columns as strings by default.

**Fix**: Configure postgres.js to parse numerics automatically:
```typescript
const client = postgres(connectionString, {
  types: {
    numeric: {
      to: 0,
      from: [1700], // PostgreSQL numeric OID
      parse: (x: string) => parseFloat(x),
      serialize: (x: number) => String(x),
    },
  },
});
```

This would eliminate dozens of `typeof ... === "string" ? parseFloat(...)` checks across the codebase.

---

## Implementation Priority

| Priority | Issue | Effort | Impact | Status |
|----------|-------|--------|--------|--------|
| P0 | #1a GET /api/sales N+1 | Done | 10s --> <500ms | DONE |
| P0 | #1b POST /api/serial-numbers/bulk N+1 | Medium | Bulk restock: 30s --> 2s | DONE |
| P0 | #3 Restore transactions on POST /api/sales | Low | Data consistency | DONE |
| P1 | #2a GET /api/serial-numbers status filter | Low | Reduces payload size | DONE |
| P1 | #2b GET /api/sale-items unbounded | Low | Dead code, skipped | CANCELLED |
| P1 | #5 Add missing DB indexes | Low | 2-10x faster queries | DONE (migration file created) |
| P1 | #4 Verify transaction pooler URL | Trivial | Better connection reuse | PENDING |
| P2 | #8 Numeric type auto-parsing | Low | Code cleanliness | PENDING |
| P2 | #7 Response caching headers | Low | Reduced DB load | PENDING |
| P3 | #6 Refactor monolithic handler | High | Maintainability | PENDING |

---

## Architecture Note: Why Separate API Endpoints?

The user asked: *"Why can't the React app just use Drizzle to connect to the DB directly?"*

Answer: It's a **security boundary**. React runs in the browser. If you embedded the DB connection string in React code, it would be visible in DevTools > Network/Sources. Anyone could read/write your database.

The API layer exists to:
1. **Hide credentials** -- DB connection string stays server-side
2. **Enforce business logic** -- validation, stock checks, loyalty points
3. **Control access** -- you decide which queries are allowed

The alternative architecture would be Supabase's **Row Level Security (RLS)** + `@supabase/supabase-js` client directly from React. This works but:
- You lose the ability to run custom business logic (stock validation, loyalty points, audit logs)
- RLS policies get complex fast for multi-table operations
- You can't do transactions from the client

The current architecture (React -> Vercel API -> Postgres) is the right pattern. The issue isn't the architecture -- it's the query efficiency within the API layer.
