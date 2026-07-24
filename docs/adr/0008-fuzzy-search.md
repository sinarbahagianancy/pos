# Make all search fuzzy (typo-tolerant), client + server

Every search surface in the app is made typo-tolerant ("fuzzy"): the 7 client-side JS filters (SearchableCombobox, SN picker, Suppliers, Customers, SalesLogs, POS, WarrantyTracker) and the 4 server-side SQL `ILIKE` queries (Products, Surat Jalan, Batch Input, Surat Penarikan).

**Client side:** `fuse.js` (new dependency), wrapped in one shared `fuzzy.ts` helper with a consistent threshold; results are ranked by Fuse score (best match first). **Server side:** also `fuse.js`, but run **in TypeScript inside the API handlers** (`src/server/search.ts`), not in SQL. Each search endpoint fetches its candidate rows (no `pg_trgm`/`%`) and ranks them with the same `fuzzyRank()` helper and threshold as the client, then paginates in memory. This is DB-agnostic and works on managed Postgres (e.g. Supabase) with no extension or GUC tuning.

**Why not `pg_trgm`:** the original implementation used Postgres `pg_trgm` trigram similarity (`%` operator + GIN index, `ORDER BY similarity DESC`), as CONTEXT §164 anticipated. It was reverted because the `%` operator's default `similarity_threshold` (0.3) makes similarity between a _short query_ (`'dji'`) and a _long concatenated field_ (`'dji osmo pocket 3 creator combo ...'`) fall well below the threshold, so **every search returned empty**. `pg_trgm` is also not reliably creatable on managed Supabase (no superuser / pooler restrictions). Fuse-in-TS avoids both problems.

**Considered Options**

- _Definition_: typo-tolerant (A) / looser-exactness (B) / both (C) → **A**
- _Scope_: all 11 incl. migration (A) / client-first (B) / combobox+Inventory only (C) → **A**
- _Client engine_: hand-rolled (A) / `fuse.js` (B) / filter-only (C) → **B**
- _Server shape_: concatenated GIN + `%` (A) / per-column indexes (B) / ranking-only (C) → **A**

**Consequences**: adds the `fuse.js` dependency (used on both client and server). No DB extension or migration is required. Substring matches still rank highest, so existing exact-match e2e stays green; misspelled queries now match. Server results are now ranked by Fuse score rather than insertion order. The `runFuzzySearchMigrations()` `pg_trgm` migration was removed. See CONTEXT "Fuzzy Search".
