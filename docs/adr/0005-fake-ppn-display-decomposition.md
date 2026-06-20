# 0005 - PPN becomes a display-only decomposition

The `Include PPN (11%)` toggle on the POS used to add a real 11% tax on top of the subtotal: `subtotal = 20000`, `PPN = 2200`, `total = 22200`. Per client request, the toggle now controls **only whether the printed invoice and the cashier UI show a "PPN 11%" line as a display decomposition of the total**. The actual amount the customer pays is identical regardless of the toggle's position: `total = sum of line items`, always. The PPN line is a presentation artefact, not a tax event; no tax is collected or remitted. Mathematically, when PPN is enabled: `displayed_subtotal = round(total / 1.11, 2)`, `displayed_tax = total - displayed_subtotal`, `displayed_total = total`.

## Why not the obvious alternative

The obvious alternative is to leave PPN as a real tax (the current behaviour). The client rejected that because their invoices must show a PPN line for customer-facing record-keeping, but the customer-facing price is the negotiated gross amount — adding 11% on top of it is not what the shop charges, and the prior behaviour was forcing an inflated invoice total. The shop is below the PPN remittance threshold (or otherwise not collecting PPN), so the only honest invoice is one whose printed total matches what the customer actually pays. Showing a "fake" PPN line on the invoice — a decomposition of the real total — is the desired end state.

## Considered Options

Three plausible shapes were considered for the persistence model:

- **A. Store the display values as-is.** `subtotal = T/1.11`, `tax = (T/1.11) × 0.11`, `total = T`. Rejected: it quietly redefines the `subtotal` column to mean "amount before fake tax" instead of "sum of line items". Reports that `SUM(subtotal)` would under-count revenue, and old rows would be inconsistent with new rows (old = sum of items, new = `total / 1.11`). The schema accumulates ambiguity we can't undo without a migration.
- **B. Store canonical values; derive the decomposition at render time.** `subtotal = sum of items`, `tax = 0` always, `total = subtotal` always. The renderer (POS UI, `InvoiceDocument` callers, `SalesLogs` re-print, `QuotationDetailModal` re-print) computes the displayed decomposition from `total` and `taxEnabled` when needed. **Chosen.** The DB records what really happened: a sale of N items at list prices, with `taxEnabled` as a presentation toggle. Reports keep their meaning. The decomposition is a pure render-time function.
- **C. Store both** (canonical + a new `displayed_subtotal` / `displayed_tax` column). Rejected: most flexible but most invasive — adds columns that exist purely to mirror values derivable from `total`. Future readers would not know which column is the source of truth.

Three cashier UI shapes were considered:

- **1. Cashier UI mirrors the printed invoice exactly (fake breakdown at the till).** Cashier sees `Subtotal = T/1.11`, `Gov Tax = T - subtotal`, `Final Amount = T`. **Chosen.** Visually consistent with what the customer will see on the printed invoice. The cashier's typed sum-of-items is `T`, which matches the cashier's `Final Amount`, so the cashier's mental model of "amount to collect" is preserved even though the displayed `Subtotal` line is less than the sum of items.
- **2. Cashier UI shows only canonical sum; invoice PDF shows the fake breakdown.** Rejected: visually inconsistent. The cashier types items summing to T, the POS shows T, the printed invoice shows a different breakdown. The cashier cannot pre-check what the customer will see.
- **3. Show both canonical sum and fake breakdown.** Rejected: cluttered, no operational benefit.

Two rounding strategies were considered:

- **a. Subtraction-first: `subtotal = round(T / 1.11, 2)`, `PPN = T - subtotal`.** **Chosen.** Sum is always exact by construction (`subtotal + PPN = total` to the cent). The displayed `PPN` may differ from `subtotal × 0.11` by up to ±0.01 — hidden by `formatIDR` / `formatNumber` rounding to whole Rupiah at print time.
- **b. Compute PPN as `round(subtotal × 0.11, 2)`, derive `subtotal = T - PPN`.** Rejected: the "11%" relationship is exact, but `subtotal + PPN` may be ±0.01 off from `total`. The customer-facing invariant is the sum, so (a) wins.

## What changed in the model

- **`sales.tax` is now `0` for every new sale**, regardless of `taxEnabled`. The column is preserved (not dropped) for backward compatibility with existing rows and to keep the `Sale` type stable. `quotations.tax` follows the same rule.
- **`taxEnabled` semantically shifts** from "is 11% tax added to this sale" to "should the printed invoice and cashier UI render the fake PPN decomposition line". The column name is unchanged; the meaning is updated in `CONTEXT.md`.
- **A pure decomposition function** lives at `app/utils/ppnDecomposition.ts` (or wherever the implementation chooses), exposing at minimum:
  - `displayedPpnBreakdown(total, taxRate, taxEnabled) → { displayedSubtotal, displayedTax, displayedTotal }`
  - When `taxEnabled` is `false`, returns the canonical triple: `{ displayedSubtotal: total, displayedTax: 0, displayedTotal: total }`.
  - When `taxEnabled` is `true`, computes `displayedSubtotal = Math.round((total / (1 + taxRate)) * 100) / 100` and `displayedTax = total - displayedSubtotal` (subtraction-first, 2-decimal precision).
- **Callers apply the function at render time** before passing numbers to the `InvoiceDocument` PDF component or to UI panels that show the breakdown. Callers that consume `sale.tax` for **accounting** purposes (e.g., the profit calculation in `Reports.tsx`) deliberately do **not** apply the function — they use canonical values, which now give `tax = 0` and a profit equal to `total - cogs`.
- **The cashier's persisted `Sale` object** carries canonical values: `subtotal = sum of items`, `tax = 0`, `total = subtotal`, `taxEnabled = ppnEnabled`. The cashier's **displayed** breakdown uses the decomposition function.

## Trade-offs accepted

- **The "Subtotal" line shown to the cashier can be less than the sum of line items when PPN is enabled.** E.g., for a cart of Rp 20.000 with PPN on, the cashier sees `Subtotal = 18.018` and `Final = 20.000`. This looks like a bug at first glance. The ADR is the disambiguator; the renderer and the cashier UI both call the decomposition function, so the behaviour is consistent across surfaces.
- **`sales.tax = 0` for new sales is a permanent data shape.** Any future feature that wanted "real PPN" would need a migration to backfill `tax` values and a separate code path. The schema column is kept (not dropped) to make that future migration less painful, but the value is meaningless for new rows.
- **The displayed `PPN` value is approximate by ±0.01 IDR relative to `subtotal × 0.11`.** In practice this is invisible because both display formatters (`formatIDR`, `formatNumber` in `InvoicePDF.tsx`) round to whole Rupiah. The approximation is documented so a future reader doesn't "fix" it by switching to multiplication-first.
- **The cashier UI label `Include PPN (11%)` keeps the existing phrasing.** It now reads as "include the (fake) PPN line on the printed invoice", not "include 11% tax in the total". The label is acceptable as-is given the ADR's existence; a UX-driven label refinement is out of scope.
- **Historical re-prints use the current `storeConfig.ppnRate`, not the rate at sale time.** This is a pre-existing issue (the rate was never stored per-sale), not introduced by this change. If the rate changes between sale creation and re-print, the `PPN (X%)` label on the printed invoice reflects the new rate, not the historical one.

## Reversibility

**Hard to reverse.** The semantics of `sales.tax` and `sales.subtotal` are now load-bearing — switching back to real PPN would require a data migration to compute and store historical `tax = round(subtotal × 0.11)` for existing rows, plus a code path that interprets `taxEnabled` as "apply real tax" again. The decomposition function in `app/utils/ppnDecomposition.ts` would be removed. The cashier UI's displayed `Subtotal` would become `sum of items` again. Quotation re-prints would also need to revert. None of these are conceptually hard, but they touch every surface that renders a sale.

**Medium:** the cashier UI's choice of "mirror the invoice" (option 1) is medium-reversibility — it's a UI decision only and could flip to option 2 without a schema change.

**Easy:** the rounding strategy (subtraction-first vs multiplication-first) is easy to reverse — it lives in one pure function and changes zero persisted data.
