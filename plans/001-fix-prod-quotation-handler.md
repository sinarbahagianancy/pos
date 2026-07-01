# Plan 001: Fix Production PO Number Bug — Unify api/index.ts with Server Handlers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8950b85..HEAD -- api/index.ts src/server/quotations.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P0 (production bug)
- **Effort**: S
- **Risk**: MED (changes production API handler)
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `8950b85`, 2026-07-01
- **Completed at**: commit `bdb73bb`, 2026-07-01

## Why this matters

The production Vercel handler (`api/index.ts`) has its own inline implementation of quotation creation and approval that is **separate from** `src/server/quotations.ts`. The loop-and-skip PO number generation, duplicate PO validation, and other fixes made in this session are NOT active in production. This means:

- Auto-generated PO numbers can collide with manually entered ones
- No duplicate PO validation exists in production
- Future fixes to server handlers won't apply to production

## Current state

**File: `api/index.ts`** (3709 lines)

- Lines 2641-2730: Inline quotation creation with simple counter increment (no loop-and-skip)
- Lines 2731-2900: Inline quotation approval with duplicate sale logic
- Uses `getClient().begin()` directly instead of the exported handlers

**File: `src/server/quotations.ts`** (591 lines)

- Exports: `createQuotationHandler`, `approveQuotationHandler`, `getAllQuotationsHandler`, `getQuotationByIdHandler`, `rejectQuotationHandler`, `cancelQuotationHandler`
- Uses `getDb().begin()` for transactions
- Contains all the fixes: loop-and-skip, duplicate validation, etc.

**Key difference**: Production uses `getClient()` from api/index.ts, server handlers use `getDb()` from `src/db/index.ts`. Both return a postgres client, but they're separate instances.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Install   | `vp install`         | exit 0              |
| Typecheck | `vp check`           | exit 0, no errors   |
| Tests     | `vp test run`        | all pass            |
| Dev start | `vp dev --port 3000` | server starts       |

## Scope

**In scope** (the only files you should modify):

- `api/index.ts`

**Out of scope** (do NOT touch):

- `src/server/quotations.ts` — already correct
- `src/db/index.ts` — database connection
- Any frontend files

## Git workflow

- Branch: `fix/prod-quotation-handler-unification`
- Commit: `fix(api): import quotation handlers from server module`
- Do NOT push unless instructed

## Steps

### Step 1: Verify current state

Read `api/index.ts` lines 2641-2730 and confirm the inline quotation creation code exists.

**Verify**: `grep -n "POST /api/quotations" api/index.ts` → shows line 2641

### Step 2: Add import statement

At the top of `api/index.ts` (after the existing imports around line 2), add:

```typescript
import {
  createQuotationHandler,
  approveQuotationHandler,
  getAllQuotationsHandler,
  getQuotationByIdHandler,
  rejectQuotationHandler,
  cancelQuotationHandler,
  type CreateQuotationInput,
  type ApproveQuotationInput,
} from "../src/server/quotations.js";
```

**Verify**: `grep -n "from.*quotations" api/index.ts` → shows the new import

### Step 3: Replace POST /api/quotation creation handler

Replace the inline code at lines 2641-2730 with a call to `createQuotationHandler`:

```typescript
// POST /api/quotations - Create new quotation
if (method === "POST" && url === "/api/quotations") {
  const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  try {
    const result = await createQuotationHandler(input as CreateQuotationInput);
    return res.status(201).json(result);
  } catch (err) {
    console.error("Quotation create error:", err);
    const message = err instanceof Error ? err.message : "Failed to create quotation";
    return res.status(400).json({ error: message });
  }
}
```

**Verify**: The new code is ~15 lines instead of ~90 lines

### Step 4: Replace PUT /api/quotation approval handler

Replace the inline approval code (lines ~2731-2900) with a call to `approveQuotationHandler`:

```typescript
// PUT /api/quotations/:id/approve - Approve and convert to Sale
if (method === "PUT" && url?.startsWith("/api/quotations/") && url.endsWith("/approve")) {
  const quotationId = decodeURIComponent(
    url.replace("/api/quotations/", "").replace("/approve", ""),
  );
  const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  try {
    const result = await approveQuotationHandler(quotationId, input as ApproveQuotationInput);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Quotation approve error:", err);
    const message = err instanceof Error ? err.message : "Failed to approve quotation";
    return res.status(400).json({ error: message });
  }
}
```

**Verify**: The new code is ~20 lines instead of ~170 lines

### Step 5: Replace other quotation endpoints

Similarly replace:

- GET /api/quotations → `getAllQuotationsHandler`
- GET /api/quotations/:id → `getQuotationByIdHandler`
- PUT /api/quotations/:id/reject → `rejectQuotationHandler`
- PUT /api/quotations/:id/cancel → `cancelQuotationHandler`

**Verify**: All quotation endpoints now use imported handlers

### Step 6: Run typecheck

```bash
vp check
```

**Verify**: exit 0, no errors

### Step 7: Run tests

```bash
vp test run
```

**Verify**: all tests pass

### Step 8: Manual verification

1. Start dev server: `vp dev --port 3000`
2. Create a quotation via POS → verify PO number is auto-generated
3. Create another quotation → verify PO number increments
4. Approve a quotation → verify sale is created with PO number

**Verify**: All operations work correctly

## Test plan

- Existing tests in `tests/invoice-po-number.test.ts` should continue to pass
- No new tests needed (the behavior is the same, just using shared code)

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `vp check` exits 0
- [ ] `vp test run` exits 0
- [ ] `grep -n "INSERT INTO quotation_counters" api/index.ts` returns no matches (inline code removed)
- [ ] `grep -n "createQuotationHandler" api/index.ts` returns at least 1 match (import used)
- [ ] No files outside `api/index.ts` are modified (`git status`)

## STOP conditions

Stop and report back (do not improvise) if:

- The import path `../src/server/quotations.js` doesn't resolve in Vercel's environment
- The `getDb()` function in `src/server/quotations.ts` uses a different connection than `getClient()` in api/index.ts (check if they share the same `DATABASE_URL`)
- The handler functions expect different input shapes than what the frontend sends
- Typecheck fails after the changes

## Maintenance notes

- After this change, ALL quotation logic lives in `src/server/quotations.ts`
- Future changes to quotation handling only need to modify one file
- The `api/index.ts` file should eventually be slimmed down to just routing logic
- Consider doing the same for other endpoints (products, customers, sales) to eliminate duplication
