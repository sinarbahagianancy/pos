# Nancy POS - Context

## Domain Glossary

### Invoice Terms

| Term                 | Definition                                                                                                                                                                                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Faktur Penjualan** | Sales invoice document issued to customers                                                                                                                                                                                                                                                                  |
| **Quotation**        | Price estimate document, not a proof of payment                                                                                                                                                                                                                                                             |
| **Terbilang**        | Amount in words (Indonesian language)                                                                                                                                                                                                                                                                       |
| **Keterangan**       | Notes/remarks section on the invoice                                                                                                                                                                                                                                                                        |
| **Tanda Terima**     | Receipt acknowledgement / signature area                                                                                                                                                                                                                                                                    |
| **Perhatian**        | Warning/disclaimer section                                                                                                                                                                                                                                                                                  |
| **PPN**              | On the printed invoice, a **display-only decomposition** of the sale total into a pre-tax line + an 11% PPN line. No tax is collected or remitted — `sales.tax` is always 0 for new sales, and `taxEnabled` controls whether the PPN line appears on the invoice, not whether tax is charged. See ADR 0005. |
| **NIK**              | Nomor Induk Kependudukan (National ID Number)                                                                                                                                                                                                                                                               |
| **NPWP**             | Nomor Pokok Wajib Pajak (Tax ID Number)                                                                                                                                                                                                                                                                     |
| **Seria**            | Serial number of the product                                                                                                                                                                                                                                                                                |
| **PO**               | Purchase Order                                                                                                                                                                                                                                                                                              |

### Document Types

| Term                             | Definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Faktur Penjualan**             | Sales invoice document issued to customers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Quotation**                    | Price estimate document, not a proof of payment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Surat Jalan**                  | Delivery note accompanying goods sent to a customer. Same format as Faktur Penjualan, but no price columns are printed. Items must come from Inventory.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Surat Penarikan Barang**       | Internal goods-removal note (damaged / expired / used internally / etc.). Same format as Faktur Penjualan, but no price columns are printed. Items are NOT required to exist in Inventory. Carries both a recipient (person or department) and a reason.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Batch Input Barang**           | A **supplier-papered stock event** batch: a single supplier invoice (Nomor Invoice Masuk) that, in one transaction, introduces brand-new products to the catalog, restocks existing products, or mixes both. Each row is either a brand-new SKU (with full product attributes — brand, model, category, condition, mount, warranty type + months, tax enabled, COGS, price, qty, has_serial_number, SNs) or an existing product (product picker + qty, with SNs only if the picked product is SN). One supplier per batch. The Nomor Invoice Masuk itself is the batch's ID (free-form text, no auto-generation, no counter table). The batch lives on a dedicated top-level page (not a tab inside Inventory). For ad-hoc restocks with no supplier paper, the user uses the per-row "Tambah Stok" button on the Inventory page (see **Tambah Stok**). |
| **Input Barang Baru**            | Create a single brand-new product in the catalog (one SKU at a time). The Inventory page header always shows this action, regardless of which tab is active. Use this when adding a single product; use **Batch Input Barang** when introducing multiple products — new, restock, or a mix — via one supplier invoice.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Tambah Stok (ad-hoc restock)** | A **single-row, no-paper restock** of an existing product. The Inventory page's per-row `Tambah Stok` button on each product row. Adds qty (or new SNs) to an existing product, with no supplier, no Nomor Invoice Masuk, and no `procurement_history` append. Used for ad-hoc stock additions: found stock, internal transfer, manual correction. The **fast path for single-row informal restocks**. The supplier-papered counterpart (multi-row, with full audit trail and `procurement_history` append) is the restock row in **Batch Input Barang**.                                                                                                                                                                                                                                                                                               |

_Avoid_ for Surat Jalan: Delivery Order, DO, Surat Pengiriman, Delivery Note.
_Avoid_ for Surat Penarikan Barang: Write-off Form, Barang Keluar Form, BKB.
_Avoid_ for Input Barang Baru: Add Product (use the Indonesian term — it matches the existing button label). Do NOT confuse with Batch Input Barang, which handles multi-product supplier batches (new, restock, or mix), not single-product one-at-a-time. Do NOT confuse with Tambah Stok — Input Barang Baru creates a brand-new SKU; Tambah Stok only adds stock to an existing one.
_Avoid_ for Batch Input Barang: Do NOT call it a tab inside Inventory — it's a top-level page. The names "Restock" / "Stock Addition" / "Penerimaan Barang" used to be in this avoid list because they implied only existing-product restock; Batch Input now legitimately handles supplier-papered restocks too, so those terms are no longer _wrong_ — just _incomplete_ (they hide the new-product case). The page is still best called "Batch Input Barang" in chrome, because that name is the only one that covers all three cases (all-new, all-restock, mixed).
_Avoid_ for Tambah Stok: Don't call it "Restock" alone — that's ambiguous with the supplier-papered restock on the Batch Input page. The "ad-hoc" qualifier (or "no-paper" qualifier) is what makes it unambiguous. Don't call it "Stock Addition" alone either — same reason.

### Quotation Status

| Term         | Definition                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------- |
| **Pending**  | Quotation created, awaiting decision. Default state on creation.                            |
| **Approved** | Quotation accepted by customer; auto-converted to a Sale (Invoice) in the same transaction. |
| **Rejected** | Quotation declined (typically by customer). Requires free-text reason.                      |
| **Canceled** | Quotation voided (typically by shop). Requires free-text reason.                            |

**Rejection vs Cancellation trigger:**

- **Rejected** = customer doesn't accept (e.g., "harga kemahalan", "cari di tempat lain")
- **Canceled** = shop voids (e.g., "stok tidak tersedia", "salah hitung")

**Rejection reason storage:** stored on `quotations.rejection_reason` (single column, used for both Rejected and Canceled — the status field distinguishes intent).

**State transitions:**

```
[Dibuat] → Pending → Approved (→ jadi Invoice, terminal)
                    → Rejected (terminal)
                    → Canceled (terminal)
```

- Pending Quotation is **read-only** — no edits; create a new Quotation to amend
- All terminal states are **final** — no re-opening

### Payment Terms

| Term         | Definition                                       |
| ------------ | ------------------------------------------------ |
| **Cash**     | Direct cash payment                              |
| **Debit**    | Debit card payment                               |
| **QRIS**     | Quick Response Code Indonesian Standard          |
| **Transfer** | Bank transfer                                    |
| **Utang**    | Credit/debt (marked as "UTANG (BON)" on invoice) |

### Product Terms

| Term      | Definition                                 |
| --------- | ------------------------------------------ |
| **Merk**  | Brand/manufacturer of the product          |
| **Model** | Product model name                         |
| **SN**    | Serial Number (unique identifier per unit) |
| **COGS**  | Cost of Goods Sold                         |

### Cart Terms

| Term          | Definition                                                                                                                                               |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cart Row**  | A single line item in the POS cart. For Non-SN products it carries a `quantity`; for SN products it represents one specific serial number.               |
| **Quantity**  | The number of units for a Non-SN Cart Row. Adjusted via a stepper in the cart. Does not apply to SN rows (each SN is its own row).                       |
| **SN Picker** | A modal shown when adding an SN product to the cart. Lists all available serial numbers for that product so the user can choose which one(s) to add.     |
| **SN Swap**   | Ability to change the serial number of an SN Cart Row after it's already in the cart, by clicking the SN text and selecting from available alternatives. |

### Store Information

- **Store Name**: Sinar Bahagia
- **Tagline**: TERPERCAYA SEJAK 1960
- **Sub-tagline**: CUTTING EDGE PHOTOGRAPHY
- **Address**: JL. KRAMAT GANTUNG NO.63 SURABAYA 60174 (TIDAK BUKA CABANG) TOKO WARNA KUNING KIRI KANAN JALAN
- **Phone**: 0857. 31. 555. 667
- **Bank**: BCA - 010-5577-988 (DJOKO SUBARDJO DJOHAN)

## Key Decisions

### Document Stock Effects

- **Surat Jalan**: deducts stock immediately on creation. Audit action: `Sales Deduction`. Reason: SJ is a logistics event, the goods have physically left. The companion Faktur Penjualan is the _financial_ event.
- **Surat Penarikan Barang**: deducts stock immediately on creation, capped at the available stock per item. If the form claims more units than are in stock, deduction stops at the available amount; the form still records what was claimed. Audit action: `Sales Deduction`. Reason: the form _is_ the write-off event.
- **Batch Input Barang**: a single batch can contain new-product rows and restock rows (or any mix). Per row, the behavior depends on the row's mode:
  - **New-product row** (`mode: "new"`): INSERTs a new product in `products` (with `id = BRC-{timestamp}` from the existing `createProduct` pattern), with the supplier invoice appended to the new product's `procurement_history` and the new product's `supplier` + `date_restocked` set from the batch header. For SN rows, the SNs are inserted into `serial_numbers` (status `In Stock`).
  - **Restock row** (`mode: "restock"`): UPDATEs the existing product's `stock` (+qty for non-SN, or +count of new SNs for SN) and `date_restocked` (set to batch date). The picked product's `supplier` is **frozen** at first introduction and is NOT overwritten by the restock's supplier. The batch's supplier and Nomor Invoice Masuk are appended to the product's `procurement_history` (a new entry with `inv`, `supplier`, `timestamp`, plus the new SNs). For SN products, the new SNs are inserted into `serial_numbers` (status `In Stock`).
  - **Same product twice on one batch** (multiple restock rows for one product): the server dedupes — one consolidated per-product `UPDATE`, one `procurement_history` append, one `Stock Addition` audit entry. The `batch_input_items` table keeps the literal row count (preserves the user's submitted form shape).
  - **Audit per row**: `Stock Addition` with mode-specific message text. New rows: `"Created product ${brand} ${model} (${qty} unit(s), harga: ${price}, cogs: ${cogs}) from supplier ${supplier}, invoice: ${invoice}.${snDetail}"`. Restock rows (consolidated per product): `"Restocked ${brand} ${model} (+${totalQty} units, total stock: ${stockAfter}) from supplier ${supplier}, invoice: ${invoice}.${snDetail}"`. The action enum value is the same (`Stock Addition`) for both modes — the message text is the disambiguator.
  - **Audit summary**: `Batch Input Created` with `"BI ${id} — ${newCount} barang baru${restockCount > 0 ? `, ${restockCount} restock` : ``} dari ${supplier}"` (the `, X restock` clause is omitted when restockCount is 0).

### Document Lifecycle

- All three new documents (Surat Jalan, Surat Penarikan Barang, Batch Input Barang) are **terminal on creation** — no Pending/Approved/Rejected/Canceled state.
- Creating the document prints the PDF (where applicable), mutates stock, and writes one audit log entry.
- All three are **reprintable** from their respective history/list view.
- No reversal flow. If a document is wrong, the staff creates a corrective new document (e.g., a Penarikan with reason `Lainnya: Koreksi SPB <original-id>`). This keeps the data model simple and audit-friendly.

### Document Storage & Identity

- **Three new tables** (mirrors the existing `sales` vs `quotations` split): `surat_jalan` + `surat_jalan_items`, `surat_penarikan` + `surat_penarikan_items`, `batch_inputs` + `batch_input_items`.
- **Identity (the "No." on the PDF and in the DB)**:
  - **Surat Jalan**: auto-generated, format `SJ/dd/mm/yyyy-NNN` (counter resets daily, like Quotation)
  - **Surat Penarikan Barang**: auto-generated, format `SPB/dd/mm/yyyy-NNN` (same scheme)
  - **Batch Input Barang**: **free-form text** — the supplier's invoice number (Nomor Invoice Masuk) is the batch's primary key. No counter table, no auto-generation. User-typed, unique per batch.
- **PO Number field**:
  - **Surat Jalan**: yes, mandatory, custom-typed (matches existing `sales.po_number` rule)
  - **Surat Penarikan Barang**: **no** — not a customer-facing commercial document
  - **Batch Input Barang**: **no** — the supplier invoice (Nomor Invoice Masuk) plays a similar role and is the batch's own ID

### Document Customer / Recipient / Supplier

- **Surat Jalan**: `customer_id` is nullable; `customer_name` is NOT NULL text. Mirrors the Quotation model. If the user picks a customer from the list, address/NPWP auto-fill; if not, just a free-form name.
- **Surat Penarikan Barang**: `recipient` is free-form text (person or department). No link to `customers` or `staff_members` table. v1 has no autocomplete.
- **Batch Input Barang**: `supplier` is a dropdown of existing `suppliers` (must be added via the Suppliers page first; no inline supplier creation in v1).

### Inventory Search

- **Server-side, case-insensitive, token-AND substring match.** Applied to the Inventory page's search box (placeholder: `"Cari produk..."`). Runs on the DB; the result set is paginated, not loaded into memory.
- **Searchable columns**: `brand`, `model`, `id`, `supplier`. (Not `category` / `condition` / `mount` — those are structured enums, reserved for a future filter dropdown.)
- **Tokenization**: query is split on whitespace, lowercased, and each token has leading/trailing non-alphanumeric characters stripped. Empty tokens are discarded. So `"  Sony A7!  "` → `["sony", "a7"]`.
- **Matching rule (per-token cross-column AND)**: each token must be a substring of at least one of the four searchable columns, and all tokens must match. Tokens may hit different columns. Example: query `"sony a7"` matches a product with `brand="Sony", model="A7 IV"` because `"sony"` hits `brand` and `"a7"` hits `model`.
- **ILIKE wildcard escaping**: `%`, `_`, and `\` in the user input are escaped before being embedded in the SQL pattern, so a user typing `"50%"` matches the literal substring `"50%"`, not `"50<anything>"`.
- **Empty query**: an empty (or whitespace-only) query means no `WHERE` filter beyond the existing `deleted = false` — i.e. the normal unfiltered list, newest first.
- **Sort order with an active search**: results are still ordered `created_at DESC` (newest first). B has no relevance score, so all matches are equally "correct"; preserving the unfiltered order is the only sensible choice.
- **Pagination interaction**: every search change (including clearing) resets the page to 1.
- **Debounce**: 300ms between input stop and API request.
- **Empty state**: when the search returns zero matches, the table body shows a single row with the message `"Tidak ada produk yang cocok dengan pencarian."` (Indonesian, matching the rest of the table's voice).
- **Future migration to typo-tolerant search (Trigram similarity / `pg_trgm`)**: the matching rule can be swapped without changing the API contract or the client. The natural C-strategy migration point adds a GIN index on `lower(brand || ' ' || model || ' ' || supplier || ' ' || id)` with `gin_trgm_ops` and replaces the ILIKE chain with a similarity-ranked query.

_Avoid_ `LIKE '%' || q || '%'` without escaping — a user typing `"50%"` would otherwise match `"50 anything"`. _Avoid_ including `category` / `condition` / `mount` in the free-text search — they're structured enums, not free text. _Avoid_ re-ranking by relevance in v1 — with B there is no relevance score, and the `created_at DESC` order is the only meaningful one.

### Penarikan Reason (Alasan) Structure

- New Postgres enum `penarikan_reason` with values: `Rusak`, `Expired`, `Dipakai Internal`, `Sample/Display`, `Employee Sale`, `Hilang`, `Recall`, `Lainnya`.
- Form presents a radio-button set of these; selecting `Lainnya` reveals a free-form text input.
- Free-form text is stored in a separate `alasan_lainnya text` column when `Lainnya` is chosen. The audit log entry always reads e.g. `Penarikan: Sony A7 IV — Rusak` (or `Lainnya: dikembalikan ke supplier`).

### Batch Input Form Design

- **Single header (batch-level fields)**: Nomor Invoice Masuk (text, free-form — becomes the batch ID), Supplier (dropdown of existing suppliers), Date, Notes (textarea, optional).
- **One table, per-row mode toggle.** Each row has a `Tipe` segmented control at the top with two options: `Baru` (introduce a new product) and `Restock` (add stock to an existing product). The default mode for a new row is `Baru`. Switching mode wipes the row's content (with a confirm dialog if the row is non-empty) — the two modes have non-overlapping field sets.
- **Row mode: `Baru` (new product).** Columns: Brand, Model, Category, Condition, Mount, Warranty Type (see note below), Warranty Months, Tax Enabled, COGS, Price Jual, Qty, Has Serial Number (checkbox), Serial Numbers (textarea, one per line, N lines for N units — only shown when Has Serial Number is checked). The product does not exist in the catalog yet; the form owns all its attributes.
- **Row mode: `Restock` (existing product).** Columns: Product (searchable combobox, non-deleted products only), Qty, Serial Numbers (textarea, one per line — only shown when the picked product is SN). The picked product's category / condition / mount / warranty / COGS / price / tax / has_serial_number are read-only and inherited from the catalog; the row only contributes qty (and SNs for SN products). `products.supplier` is frozen at first introduction and is NOT changed by the restock.
- **Warranty Type options** (only applies to `Baru` rows): only `Distributor`, `Toko`, `No Warranty` (default: `Distributor`). The DB `warranty_type` enum has six values including the three `Official ... Indonesia` ones, but Batch Input restricts to these three because a batch-from-supplier introduction never has a branded official warranty. (The Inventory page's `Input Barang Baru` form still offers all six, since staff may add an officially-warrantied product via a single-supplier procurement.)
- **Validation per row** (before submit):
  - `Baru` rows: required Brand, Model, Qty > 0. For SN rows: SN textarea must contain exactly Qty non-empty unique lines, no duplicates with other SNs in the same batch, no duplicates with existing SNs in the `serial_numbers` table.
  - `Restock` rows: required Product (must exist, must not be soft-deleted), Qty > 0. If the picked product is SN, the SN textarea must contain exactly Qty non-empty unique lines with no global conflicts (same uniqueness rule as `Baru` rows). If the picked product is non-SN, the SN textarea is hidden and must be empty.
  - **Duplicate-SKU pre-flight (cross-mode)**: a `Baru` row's brand+model (case-insensitive, trimmed) must NOT match an existing product in the catalog, AND must NOT match the product of any other `Baru` or `Restock` row in the same batch. Violation produces the existing inline red error: `"Konflik dengan 'Sony A7 IV' yang sudah ada di katalog (stok: 2). Hapus baris ini atau perbaiki SKU."`.
- **Empty rows** (no brand, no model, no picked product) are silently skipped on submit — the user can leave them in the form to indicate "I'm still filling this in."
- **`+ Tambah Baris`** button below the table adds a new empty row in `Baru` mode. To get a `Restock` row, the user adds a `Baru` row and toggles the `Tipe` to `Restock`.
- **Sticky footer**: `Batal` (cancels and returns to list) and `Simpan` (submits the batch).
- **One supplier per batch.**

### Restock Row Validation (server-side)

- The server-side validator runs after the client form's per-row validation, as the final gate before the transaction starts. The `CreateBatchInputItemInput` type is a discriminated union on `mode: "new" | "restock"` so the validator can branch cleanly per row.
- **`Baru` row** validation reuses the existing pre-flight checks (duplicate-SKU against the catalog and against other rows in the batch; SNs match qty; SNs unique globally).
- **`Restock` row** validation: (1) `existingProductId` must reference a non-deleted product; (2) `quantity > 0`; (3) if the product's `has_serial_number = true`, then `sns.length === quantity` and all SNs are unique globally and within the batch; (4) if the product's `has_serial_number = false`, then `sns` must be empty (defensive — the form hides the SN control but a malicious client could send SNs).
- **Server-side dedup for same-product restock rows.** After per-row validation, the server groups `Restock` rows by `existingProductId` and processes each group as a single per-product operation: one `UPDATE products SET stock = stock + (sum of qtys), date_restocked = batch_date`, one append to the product's `procurement_history` (with the batch's `supplier` and Nomor Invoice Masuk), one `Stock Addition` audit entry. The `batch_input_items` table still gets one row per submitted form row (preserves the user's form shape) but the side-effects on the product are consolidated.
- **Transaction shape.** All INSERTs (new products + batch_input_items + new serial_numbers), all UPDATEs (restock products), and all audit log writes run in a single transaction. Any failure rolls back the whole batch — the atomicity matches the existing `createBatchInputHandler` behavior.

### Batch Input Page Lifecycle

The Batch Input page has **four modes** (in-page state, not separate routes — matches `SuratJalan.tsx` pattern):

1. `list` (default): the Batch Input Log table. Shows: ID (= Nomor Invoice Masuk), Date, Supplier, **Baru** (sum of quantities across new-product rows), **Restock** (sum of quantities across restock rows), Staff, [View] button. The page has one button: `Tambah Batch Input` (top right). The two quantity columns let the user scan the log and instantly see which batches were acquisitions vs replenishment vs mixed; either column can be 0.
2. `create`: the form. Clicking `Tambah Batch Input` switches to this mode. Shows: batch-level header (supplier, date, invoice number, notes) + per-row table (one table, per-row `Tipe` toggle).
3. `summary` (post-submit): after a successful save, this mode shows a "Batch Berhasil Dibuat" hero with a checkmark and **two sub-tables** under it. The first is `Barang Baru (N)` with the newly-created products (with their `BRC-{timestamp}` IDs). The second is `Restock (M)` with the **consolidated** per-product restock results (one row per affected product, with `Stok Akhir` showing stock-after). If either sub-table is empty (all-new or all-restock batch), the empty one is hidden. One button: `Kembali ke Log` returns to `list` mode (full unfiltered log, not filtered to this batch).
4. `detail-modal` (overlay on `list`): clicking a log row's `View` button opens a modal with the **same two sub-table layout** as `summary`, but for a historical batch. Same hero, same `Barang Baru` and `Restock` sub-tables, same consolidated restock view; empty sub-table is hidden.

No "edit" or "delete" mode in v1 — batches are terminal on creation (consistent with the SJ/SPB terminal-on-creation rule).

### Restock Surfaces (Ad-hoc vs Supplier-papered)

The system has **two distinct restock surfaces**, encoding two different domain events:

- **Ad-hoc restock** — the Inventory page's per-row `Tambah Stok` button. **No supplier, no Nomor Invoice Masuk, no `procurement_history` append.** Used for: found stock, internal transfer, manual correction. The fast path for single-row informal restocks. Audit message: `"Tambah stok ad-hoc: ${brand} ${model} (+${qty} units, stok: ${stockAfter})${snDetail}"`.
- **Supplier-papered restock** — a `Restock` row in Batch Input Barang. **Has supplier + Nomor Invoice Masuk + `procurement_history` append.** Used for: real procurement events tied to a paper invoice. Multi-row capable (one supplier invoice can restock many products at once). Audit message: `"Restocked ${brand} ${model} (+${qty} units, total stock: ${stockAfter}) from supplier ${supplier}, invoice: ${invoice}${snDetail}"`.

The split is _semantic_, not just UX — a "found extra stock in the back room" event and a "we bought 5 more from Sony under invoice INV-2024-001" event are _different facts_ and produce _different audit signatures_. Conflating them loses information. The Inventory `Tambah Stok` button is _not_ a fast alias for Batch Input restock — it's a different event type that happens to also increment stock.

### Procurement History (`products.invoice_number` rename)

The `products.invoice_number` field is renamed to `products.procurement_history` to reflect that it captures _all_ supplier procurement events for the product, not just invoices. Each entry is a JSON object: `{ inv, supplier, timestamp, sns, qty? }`. The `supplier` field is the per-event supplier (which may differ from the product's introducing supplier).

- **Product's `supplier` field is frozen at first introduction.** It represents the _introducing_ supplier — the one who first brought this SKU into the catalog. Restocks from other suppliers do NOT overwrite it.
- **Each restock (ad-hoc or supplier-papered) appends a new entry to `procurement_history`** with the new `inv` (supplier invoice for supplier-papered restocks; a synthetic key like `"adhoc-{timestamp}"` for ad-hoc restocks), the per-event `supplier` (for supplier-papered restocks; `null` for ad-hoc), the `timestamp`, and the new `sns` (for SN products) or `qty` (for non-SN products). The history is append-only.
- **The rename is a breaking schema change.** A migration script must rename the column, copy data, and update any code that reads the old field name. The new shape is forward-compatible — old entries without `supplier` are treated as having a `null` supplier.

### Document PDF Layout (Surat Jalan & Surat Penarikan)

- **Same as InvoicePDF**, with the following variations (driven by a new `kind` prop: `"surat-jalan" | "surat-penarikan"`, extending the existing `isQuotation` flag pattern):
  - Header title text: `"Surat Jalan"` or `"Surat Penarikan Barang"` (replaces `"Faktur Penjualan"`)
  - Items table: **3 columns** (Serial, Nama Barang, Qty) — `@Harga`, `Diskon`, `Total Harga` columns removed
  - `Terbilang` section: **removed**
  - `Totals` box: **removed**
  - `Pembayaran` column in the bottom row: **removed**
  - `Keterangan` box: **stays**, takes the freed-up space
  - `Tanda Terima` column: **stays** (label works for both "received by" and "withdrawn by")
  - `PERHATIAN` box: **stays** with the same disclaimer text
  - Penarikan only: the customer-section slot on the left is replaced with `Penarik` + `Alasan` block (2 lines, mirroring the customer block's vertical footprint)
  - Penarikan only: the right-side details box drops the `No. PO` row

### Document Item Form Shape (Surat Jalan & Surat Penarikan Barang)

- **Empty rows show all products** (SN and non-SN both) in the dropdown. The user does not have to pre-commit to a row type — they pick the product first, and the row's shape (card vs grid) adapts after the pick based on the product's `hasSerialNumber` flag. The empty row is itself rendered in the grid layout; the card layout only appears _after_ an SN product is picked (because that is when chip-list space is needed).
- **Product dropdown is a searchable combobox grouped by row type**, labeled `Nomor Seri` (SN) and `Tanpa Nomor Seri` (non-SN) in Indonesian to match the rest of the form's voice. The combobox implements the W3C ARIA combobox pattern (text input, type-to-filter, group headers, ArrowUp/Down + Home/End + Enter + Escape keyboard nav, `role="combobox"` / `aria-expanded` / `aria-controls` / `aria-activedescendant` / `role="listbox"` / `aria-selected`). The category is shown to the user as part of the dropdown's structure, not just as a label suffix, because the row's behavior diverges significantly after a pick (card+modal+chip list vs plain grid+qty) and the user benefits from seeing the distinction upfront. The combobox lives at `app/components/SearchableCombobox.tsx` and is also reused by `Inventory.tsx` for the supplier picker.
- **SN products with zero "In Stock" SNs are always excluded from the dropdown**, on both routes. The reasoning: an SN row in this form picks _specific_ units, so an SN product with 0 pickable units is un-submittable in any flow (the modal would open with 0 visible SNs, the row would fail per-row validation, and the user would have to delete the row). The rule is universal — it is not a Surat Penarikan-specific concern. The page's `productFilter` is still applied on top, to handle page-specific rules (SJ excludes 0-stock non-SN products; SPB allows them so the form can record a 0-unit claim for accounting).

- **Two row types, rendered differently based on the picked product's `hasSerialNumber` flag.**
  - **SN row** (`hasSerialNumber = true`): rendered as a **card**. Top line has the product dropdown, a `Pilih SN (N dipilih)` button that opens a modal picker, and a `✕` delete button. Below the top line: a horizontal **chip list** of selected SNs (each chip has its own `X` to remove individually). No qty field — the count of selected SNs _is_ the unit count.
  - **Non-SN row** (`hasSerialNumber = false`): rendered as a **single 12-column grid row** (the existing layout). Product dropdown, qty input, `✕` delete button. **No SN control at all** (the legacy optional SN text field is removed; the `NOSN-` prefix convention in the server handlers is dead code).
- **Multi-select SN picker (modal)**: for SN products, the modal lists all "In Stock" SNs of the picked product as checkboxes, with a search input at the top, `Pilih Semua` / `Hapus Semua` buttons, and a footer `Batal` / `Simpan (N dipilih)` action. Scrollable, handles products with 30+ stock.
- **Form-wide SN dedup**: the form maintains a `Set<string>` of "SNs already picked in this form". When the modal is open, any SN in this Set is **hidden** from the list (not just greyed out — removed from view). Deleting a row that had picked SNs re-adds them to the available pool.
- **SN removal** is symmetric: clicking the `X` on a chip removes that SN from the row's selection **and** makes it available in other rows' modals. The `+ Tambah Item` button always adds a fresh empty row.
- **Per-row validation** (inline, red border + red helper text under the offending control):
  - SN row: at least 1 SN must be selected.
  - Non-SN row: quantity must be ≥ 1.
  - Both: a product must be selected (catches the "+ Tambah Item then forget" case inline rather than at submit).
- **Empty rows on submit are silently skipped** — the form filters out rows with `productId === ""` before sending the request. The `✕` button is always present, so the user can clean up manually.
- **Toast is the final safety net** — inline errors cover everything the form can predict, but a single toast appears on submit if any row-level or server-side validation fails (e.g., stock changed since the form was loaded, or a duplicate SN slipped through somehow).
- **Submit shape**: the form expands each SN row into N items (one per selected SN, each with `quantity: 1, sn: <that SN>`) and each non-SN row into one item (with `quantity: <form qty>, sn: ""`). The server-side items array is the same shape as today — no API change. The server's pre-flight stock check and SN-availability check still work because they aggregate by `productId` and check each `sn` independently.
- **Detail view and PDF are unchanged** — the DB stores one item row per SN (same as today), so the existing detail modal and `InvoicePDF` iterate naturally with no changes.

_Avoid_ showing a qty input for SN rows — the count of selected SNs _is_ the qty. Showing a qty input is misleading and lets the user type a number that decouples from the actual SNs picked. _Avoid_ using a free-text SN input — the modal picker is the only way to pick SNs (prevents typos and out-of-stock selections). _Avoid_ showing any SN control on non-SN rows — if the product is `hasSerialNumber = false`, no SN field is shown.

### Document UI Placement

- **Surat Jalan**: new top-level sidebar item
- **Surat Penarikan Barang**: new top-level sidebar item
- **Batch Input Barang**: **dedicated top-level sidebar item** (between Inventory and Surat Jalan). The Inventory page does NOT have a Batch Input tab. The page has one button (Tambah Batch Input) and one table (Batch Input Log).

### Document List View & Reprint

- **Surat Jalan** & **Surat Penarikan Barang**: table, paginated, sorted by date DESC, search by ID/customer/PO. Each row has a `Reprint` action that opens the PDF in a new tab (same pattern as Quotation reprint).
- **Batch Input Barang**: table, paginated, sorted by date DESC, search by supplier/invoice Masuk. Each row has a `View Details` action that opens a modal showing the batch contents as two sub-tables: `Barang Baru` (one row per new product, with `BRC-{timestamp}` ID, qty, SNs, COGS, price) and `Restock` (one row per _consolidated_ affected product, with qty added, stock-after, supplier, invoice). Empty sub-table is hidden. Log table columns: `ID | Date | Supplier | Baru | Restock | Staff | [View]` — the `Baru` and `Restock` columns show the sum of quantities per row type (either can be 0).
- **No PDF for Batch Input in v1.** The table + detail modal is the artifact.

### New Document Audit Action Enums

- Three new values added to the `audit_action` enum via `ALTER TYPE`: `Surat Jalan Created`, `Surat Penarikan Created`, `Batch Input Created`.
- Two-tier write pattern matches the existing `createSaleHandler`:
  - Per-item log: reuses existing enum values (`Sales Deduction` for SJ/SPB, `Stock Addition` for BI).
  - Summary log: uses the new enum value, links to the parent document via `related_id`.
- **Per-row message format for Batch Input is mode-specific** (same `Stock Addition` action enum value, different message text per row mode):
  - `mode: "new"` rows: `"Created product ${brand} ${model} (${qty} unit(s), harga: ${price}, cogs: ${cogs}) from supplier ${supplier}, invoice: ${invoice}.${snDetail}"`
  - `mode: "restock"` rows (consolidated per product): `"Restocked ${brand} ${model} (+${totalQty} units, total stock: ${stockAfter}) from supplier ${supplier}, invoice: ${invoice}.${snDetail}"`
  - **Ad-hoc restock from the Inventory page's `Tambah Stok` button** writes a separate `Stock Addition` entry with message: `"Tambah stok ad-hoc: ${brand} ${model} (+${qty} units, stok: ${stockAfter})${snDetail}"`. The `Tambah stok ad-hoc:` prefix disambiguates it from supplier-papered restocks when reading the audit log without joining tables.

### Invoice Layout

- A4 portrait only (single invoice format)
- 6-column table for items (Seria, Nama Barang, Qty, @Harga, Diskon, Total Harga)
- 3-column bottom section (Pembayaran | Tanda Terima | PERHATIAN)
- Terbilang (amount in words) above Keterangan/Totals
- PO Number displayed in invoice header (right box, alongside No. Invoice & Tanggal)
- Notes ("Keterangan") displayed in middle section (left box, above Totals)

### Invoice Layout Variants

- Only **A4 Portrait** is offered to users
- The PDF component still defines A5 Landscape and A4 Landscape `<Page>` blocks as inert fallbacks
- Switcher UI removed from `POS.tsx` and `SalesLogs.tsx` print modals

### PO Number (Nomor PO)

- Mandatory on every sale (Sale and Quotation)
- Custom input — not auto-generated, not auto-incremented
- Stored in `sales.po_number` (new column, `text`, nullable; empty string treated as missing)
- Validated in both client (POS form) and server (POST `/api/sales` rejects empty)

### Quotation Numbering

- Auto-generated ID format: `SB/dd/mm/yyyy-NNN` (e.g., `SB/14/06/2026-001`)
- Counter resets at midnight (per-day)
- Generated server-side via atomic UPSERT on `quotation_counters(date, last_number)` table
- Quotation number is the primary key (`quotations.id`)
- Padding: 3 digits minimum (`001`, `012`, `123`); grows as needed (e.g., `1234` after day 1000)

### Quotation Storage

- Stored in dedicated `quotations` + `quotation_items` tables (not in `sales` table)
- Quotation has its own lifecycle (Pending → Approved/Rejected/Canceled), independent of Sale
- `sales.quotation_id` (nullable FK) links a converted Sale back to its source Quotation
- `quotations.converted_sale_id` (nullable FK) is set on Approve, linking the Quotation to the resulting Sale
- Stock is **not** deducted at Quotation creation; it is deducted at Approve → conversion (atomic with sale creation)

### Quotation → Invoice Conversion Flow

- User creates Quotation from POS ("Cetak Quotation") → status `Pending`, PDF printed
- User navigates to Sales Logs → "Quotations" tab
- For Pending Quotation, three actions available:
  - **Approve & Convert** — opens detail modal showing items; for SN items, default SN from cart but user can re-pick via SN Picker; for non-SN items, no picker. On confirm: atomic transaction creates Sale, deducts stock, marks Quotation as `Approved`, sets `converted_sale_id`. Redirects to Sales Logs (Sales tab).
  - **Reject** — opens reason input; on confirm: status → `Rejected`, reason stored
  - **Cancel** — opens reason input; on confirm: status → `Canceled`, reason stored
- For terminal Quotation (Approved/Rejected/Canceled), only **Reprint PDF** action is available
- Race-safe: all PUT endpoints use `SELECT ... FOR UPDATE` on the Quotation row and check status is still `Pending` before mutating

### Number Formatting

- Indonesian format with dots as thousand separators
- No "Rp" prefix in table/totals
- Rounded to integers (no sen/cents)

### Date Format

- DD MMM YYYY (e.g., 05 Jan 2026)

### Icons

- Lucide icons for location (MapPin) and phone (Phone/Smartphone)
- Empty View placeholders for YouTube, Instagram, TikTok, BCA logo
