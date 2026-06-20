# 0004 - Batch Input Barang absorbs the supplier-papered restock path

`Batch Input Barang` (the multi-row supplier intake page) used to be restricted to introducing _brand-new_ products to the catalog. It now also handles **supplier-papered restocks** of existing products within the same batch, as a second row-mode (`Tipe: Restock`) on the existing page. The Inventory page's per-row `Tambah Stok` button stays as the **ad-hoc restock** path (no supplier, no invoice). The two restock surfaces are explicitly distinct — they encode two different domain events, not two UX shortcuts for the same event.

## Why not the obvious alternative

The obvious alternative is to leave the boundary alone. `CONTEXT.md` deliberately drew a line: Batch Input is for _new products_, Inventory's `Tambah Stok` is for _restocks_. The line was written to keep the two events separate and to prevent staff from "restocking" a product by accident when they meant to introduce a new one. The line was reasonable in the abstract, but it didn't survive contact with real supplier invoices.

A real supplier delivery in a camera shop is rarely all-new _or_ all-restock — it's almost always a mix. "We bought 3 new Sony lenses and restocked 2 carryover Canon bodies under the same supplier invoice." Forcing staff to split one paper delivery across two pages is exactly the friction that erodes discipline: people stop logging the restock, or they fake a restock as a "new product" with a typo'd model name to avoid the friction. Both outcomes are worse than the boundary was protecting against.

## Considered Options

Three plausible shapes were considered for "Batch Input + restock":

- **A. Merge into one canonical restock path; remove the Inventory's `Tambah Stok` button.** Rejected: it makes a one-row ad-hoc restock (e.g., found 3 units in the back room) require fabricating a supplier invoice and picking a supplier, which is friction that invites workarounds. The two events _are_ different facts; collapsing them loses information.
- **B. Keep Batch Input as-is; add a separate new feature somewhere for multi-row restock.** Rejected: a real supplier delivery is one physical event, and modelling it as two separate database events (one for the new products, one for the restocks) leaves the paper trail in two places. When an auditor reads "what did we receive from supplier X on date Y?" they should find one batch, not two.
- **C. Add a second row mode (`Tipe: Restock`) to the existing Batch Input page, keeping the Inventory's `Tambah Stok` button as the ad-hoc path.** Chosen. The form's `Baru` rows introduce new products as before. The new `Restock` rows add stock to existing products in the same batch, sharing the same Nomor Invoice Masuk and supplier header. Server-side dedup consolidates same-product restock rows into a single per-product `UPDATE` and one `procurement_history` append, so the user's literal form shape is preserved in `batch_input_items` while the side-effects on the product are consolidated.

## What changed in the model

- **`products.invoice_number` is renamed to `products.procurement_history`**, and each entry gains a `supplier` field (the per-event supplier, which may differ from the product's introducing supplier). The rename is a breaking schema change requiring a migration.
- **`products.supplier` is frozen at first introduction** — it represents the _introducing_ supplier. Restocks from other suppliers do not overwrite it; their supplier is captured in `procurement_history` instead.
- **The `CreateBatchInputItemInput` type becomes a discriminated union on `mode: "new" | "restock"`.** Restock rows carry `existingProductId` and `quantity` (plus `sns` if the picked product is SN). New-product rows carry the existing attribute set.
- **The Batch Input Log table splits `Total Units` into two columns: `Baru` and `Restock`**, so the staff can scan the log and see acquisition vs replenishment batches at a glance. The `View` modal (and the post-submit summary) shows two sub-tables: `Barang Baru` (with `BRC-{timestamp}` IDs) and `Restock` (consolidated per product, with `Stok Akhir`).
- **The audit log message format becomes mode-specific** while keeping the same `Stock Addition` action enum value. New-product rows: `"Created product X (qty, harga, cogs) from supplier Y, invoice Z..."`. Restock rows: `"Restocked X (+qty, total stock: N) from supplier Y, invoice Z..."`. The Inventory's ad-hoc `Tambah Stok` gets a third format: `"Tambah stok ad-hoc: X (+qty units, stok: N)..."`. The action enum value stays the same; the message text is the disambiguator. The summary log message gets a conditional clause for the restock count: `"BI X — N barang baru, M restock dari supplier Y"` (the `, M restock` clause is dropped when M is 0).

## Trade-offs accepted

- **Two restock surfaces, two audit signatures.** The Inventory's `Tambah Stok` button and the Batch Input's `Restock` row both increment stock, but they produce different audit log messages and update different fields (`procurement_history` is touched only for supplier-papered restocks). The split is deliberate — the two events _are_ different facts — but it does mean staff have to know which one to use for a given scenario. The chrome labels (`Tambah Stok` on Inventory, `Tipe: Restock` on the Batch Input row) make the distinction visible.
- **The `procurement_history` rename is a breaking schema change.** All code reading `products.invoice_number` must be updated. Old entries without a `supplier` field are treated as having a `null` supplier.
- **Server-side dedup logic adds complexity to the transaction.** Multiple restock rows for the same product in one batch are consolidated before the per-product `UPDATE` and `procurement_history` append, but the `batch_input_items` table still gets one row per submitted form row. The audit log emits one `Stock Addition` entry per _product_, not per _row_. This is the right trade-off (consolidated product state, faithful form record) but the consolidation rule must be documented and tested.
- **The form's per-row mode toggle wipes data on switch.** Switching a row from `Baru` to `Restock` mid-fill discards typed brand/model/qty (with a confirm if non-empty), and vice versa. The two modes have non-overlapping field sets, so any other behavior is either lossy (best-effort carry that can silently mask typos) or expensive (per-row dual state). Wipe-with-confirm is the standard pattern for destructive form-mode switches.

## Reversibility

**Hard to reverse.** The changes touch the schema (`products.invoice_number` → `procurement_history`, plus the new `supplier` field per entry), the audit log message format (existing rows in `audit_log` keep their old message text — the new format only applies to new entries), the form's row-mode UX, and the Batch Input Log's column shape. Reverting the feature would require a migration to undo the column rename, a way to distinguish new-mode entries from restock-mode entries in the audit log, and a feature deprecation. The boundary that was relaxed (Batch Input = new-only) is documented in this ADR as the prior state, so future readers will know what was deliberately undone and why.

The two-restock-surfaces decision (ad-hoc vs supplier-papered) is _medium_-reversibility — both surfaces exist as distinct code paths and could in principle be collapsed, but the user-facing distinction (one is a button, the other is a form mode) would have to be reconciled. We do not anticipate needing to reverse either decision.
