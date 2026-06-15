# 0003 - Server-side, case-insensitive, token-AND search on the Inventory page

The Inventory page's search box (placeholder: `"Cari produk..."`) runs on the database, not in the browser. The query is case-insensitive, tokenized on whitespace, and matches with a per-token cross-column AND over the columns `brand`, `model`, `id`, `supplier`. Sort order is preserved as `created_at DESC` (newest first) regardless of whether a search is active.

**Why not the obvious alternative.** The Inventory page used to filter the loaded page of products in the browser, with a simple `String.includes` over `model`, `brand`, and `id`. Lifting the filter to the server (a) makes search work across pagination boundaries, (b) is the only viable approach once the catalog grows past a few hundred products, and (c) keeps the API contract centralized.

**Why not trigram similarity (`pg_trgm`) now.** The trigram strategy gives typo tolerance (e.g. `"sonny a7v"` finds `"Sony A7 IV"`), which is the next thing a non-technical staff member will ask for. We deferred it because:

- It requires enabling a Postgres extension and adding a GIN index on the concatenated search column — both are real production changes.
- It drags in a ranking question (do we re-order results by similarity, breaking the `created_at DESC` order users are used to?).
- B (token-AND) handles the higher-traffic case staff actually hit today: typing partial model strings like `"rf 50"` for `"Canon RF 50mm f/1.2L"`. A trigram strategy without token-AND would still return noise on multi-word queries.

The current implementation is structured so the matching rule is the only piece that has to change to move to C: swap the ILIKE chain for a `similarity(...) > threshold` clause and add the GIN index. The API contract (`q` query param, debouncing, empty-state UX) stays the same.

**Why a 300ms debounce and not 0ms.** The search runs on every keystroke against the DB. Without a debounce, a user typing `"canon"` produces 5 requests and the in-flight results can race. 300ms is the standard middle ground between "feels instant" and "doesn't hammer the server". React Query's `placeholderData: keepPreviousData` keeps the previous results on screen while the new request is in flight, so the table doesn't flash empty during the gap.

**Trade-off accepted.** No typo tolerance in v1. A user who misspells a brand has to retry. The cost is bounded — the same misspelling is a problem on every e-commerce search box, and the migration path to C is clear.

**Reversibility.** Medium. The API contract is additive (a new optional `q` param), the client state is local, and the SQL lives in one place (`api/index.ts` GET /api/products, with a parallel call in `src/server/products.ts` for dev parity). The matching rule is a single function, so swapping B for C is contained. The harder-to-reverse part is the UX contract (placeholder, debounce timing, sort-preserved-during-search) — those are visible to staff, and changing them later is a small migration but a real one (re-train users, update E2E tests).
