# Nancy POS - Context

## Domain Glossary

### Invoice Terms

| Term                 | Definition                                      |
| -------------------- | ----------------------------------------------- |
| **Faktur Penjualan** | Sales invoice document issued to customers      |
| **Quotation**        | Price estimate document, not a proof of payment |
| **Terbilang**        | Amount in words (Indonesian language)           |
| **Keterangan**       | Notes/remarks section on the invoice            |
| **Tanda Terima**     | Receipt acknowledgement / signature area        |
| **Perhatian**        | Warning/disclaimer section                      |
| **PPN**              | Pajak Pertambahan Nilai (Value Added Tax)       |
| **NIK**              | Nomor Induk Kependudukan (National ID Number)   |
| **NPWP**             | Nomor Pokok Wajib Pajak (Tax ID Number)         |
| **Seria**            | Serial number of the product                    |
| **PO**               | Purchase Order                                  |

### Document Types

| Term                       | Definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Faktur Penjualan**       | Sales invoice document issued to customers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Quotation**              | Price estimate document, not a proof of payment                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Surat Jalan**            | Delivery note accompanying goods sent to a customer. Same format as Faktur Penjualan, but no price columns are printed. Items must come from Inventory.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Surat Penarikan Barang** | Internal goods-removal note (damaged / expired / used internally / etc.). Same format as Faktur Penjualan, but no price columns are printed. Items are NOT required to exist in Inventory. Carries both a recipient (person or department) and a reason.                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Batch Input Barang**     | A **catalog-introduction** batch: a single supplier invoice (Nomor Invoice Masuk) that introduces one or more brand-new products to the catalog in a single transaction. Each row is a distinct SKU (not in the catalog yet) with full product attributes (brand, model, category, condition, mount, warranty type + months, tax enabled, COGS, price, qty, has*serial_number, SNs). One supplier per batch. The Nomor Invoice Masuk itself is the batch's ID (free-form text, no auto-generation, no counter table). The batch lives on a dedicated top-level page (not a tab inside Inventory). For adding stock to an \_existing* product, the user uses the per-row "Tambah Stok" button on the Inventory page, NOT Batch Input. |
| **Input Barang Baru**      | Create a single brand-new product in the catalog (one SKU at a time). The Inventory page header always shows this action, regardless of which tab is active. Use this when adding a single product; use **Batch Input Barang** when introducing multiple new products via one supplier invoice.                                                                                                                                                                                                                                                                                                                                                                                                                                      |

_Avoid_ for Surat Jalan: Delivery Order, DO, Surat Pengiriman, Delivery Note.
_Avoid_ for Surat Penarikan Barang: Write-off Form, Barang Keluar Form, BKB.
_Avoid_ for Input Barang Baru: Add Product (use the Indonesian term — it matches the existing button label). Do NOT confuse with Batch Input Barang, which introduces new products, not restocks existing ones.
_Avoid_ for Batch Input Barang: Restock, Stock Addition, Penerimaan Barang (all of these imply adding stock to existing products, which is the Inventory page's job, not Batch Input's). Do NOT call it a tab inside Inventory — it's a top-level page.

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
- **Batch Input Barang**: introduces brand-new products to the catalog on creation. Each row INSERTs a new product in `products` (with `id = BRC-{timestamp}` from the existing `createProduct` pattern), with the supplier invoice appended to the new product's `invoice_number` history and the new product's `supplier` + `date_restocked` set from the batch header. For SN rows, the SNs are inserted into `serial_numbers` (status `In Stock`). Audit per row: `Stock Addition` (matches the existing `createProduct` precedent — this is a pre-existing semantic smell, not something to fix in this session). Audit summary: `Batch Input Created`.

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

### Penarikan Reason (Alasan) Structure

- New Postgres enum `penarikan_reason` with values: `Rusak`, `Expired`, `Dipakai Internal`, `Sample/Display`, `Employee Sale`, `Hilang`, `Recall`, `Lainnya`.
- Form presents a radio-button set of these; selecting `Lainnya` reveals a free-form text input.
- Free-form text is stored in a separate `alasan_lainnya text` column when `Lainnya` is chosen. The audit log entry always reads e.g. `Penarikan: Sony A7 IV — Rusak` (or `Lainnya: dikembalikan ke supplier`).

### Batch Input Form Design

- **Single header (batch-level fields)**: Nomor Invoice Masuk (text, free-form — becomes the batch ID), Supplier (dropdown of existing suppliers), Date, Notes (textarea, optional).
- **Per-row table**: each row is a brand-new product (distinct SKU). Columns: Brand, Model, Category, Condition, Mount, Warranty Type (see note below), Warranty Months, Tax Enabled, COGS, Price Jual, Qty, Has Serial Number (checkbox), Serial Numbers (textarea, one per line, N lines for N units — only shown when Has Serial Number is checked).
- **Warranty Type options**: only `Distributor`, `Toko`, `No Warranty` (default: `Distributor`). The DB `warranty_type` enum has six values including the three `Official ... Indonesia` ones, but Batch Input restricts to these three because a batch-from-supplier introduction never has a branded official warranty. (The Inventory page's `Input Barang Baru` form still offers all six, since staff may add an officially-warrantied product via a single-supplier procurement.)
- **Validation per row** (before submit):
  - Required: Brand, Model, Qty > 0.
  - For SN rows: SN textarea must contain exactly Qty non-empty unique lines, no duplicates with other SNs in the same batch, no duplicates with existing SNs in the `serial_numbers` table.
  - For non-SN rows: SN textarea hidden.
  - **Duplicate-SKU check**: if `brand+model` (case-insensitive, trimmed) already exists in `products`, the row gets an inline red error: `"Konflik dengan 'Sony A7 IV' yang sudah ada di katalog (stok: 2). Hapus baris ini atau perbaiki SKU."`. User can delete the conflicting row; other rows proceed.
- **Empty rows** (no brand, no model) are silently skipped on submit — the user can leave them in the form to indicate "I'm still filling this in."
- **`+ Tambah Baris`** button below the table adds a new empty row.
- **Sticky footer**: `Batal` (cancels and returns to list) and `Simpan` (submits the batch).
- **No new product creation inline** — wait, that was the old rule. In the new design, the WHOLE POINT is to create new products inline. Strike that.
- **One supplier per batch.**

### Batch Input Page Lifecycle

The Batch Input page has **four modes** (in-page state, not separate routes — matches `SuratJalan.tsx` pattern):

1. `list` (default): the Batch Input Log table. Shows: ID (= Nomor Invoice Masuk), Date, Supplier, Total Units (sum of quantities across rows), Staff, [View] button. The page has one button: `Tambah Batch Input` (top right).
2. `create`: the form. Clicking `Tambah Batch Input` switches to this mode. Shows: batch-level header (supplier, date, invoice number, notes) + per-row table.
3. `summary` (post-submit): after a successful save, this mode shows a "Batch Berhasil Dibuat" hero with a checkmark and a table of the newly-created products (with their `BRC-{timestamp}` IDs). One button: `Kembali ke Log` returns to `list` mode.
4. `detail-modal` (overlay on `list`): clicking a log row's `View` button opens a modal with the same per-row read-only table as `summary`, but for a historical batch.

No "edit" or "delete" mode in v1 — batches are terminal on creation (consistent with the SJ/SPB terminal-on-creation rule).

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
- **Product dropdown is grouped with `<optgroup>` by row type**, labeled `Nomor Seri` (SN) and `Tanpa Nomor Seri` (non-SN) in Indonesian to match the rest of the form's voice. Empty optgroups (when a category has no available products) are omitted. The category is shown to the user as part of the dropdown's structure, not just as a label suffix, because the row's behavior diverges significantly after a pick (card+modal+chip list vs plain grid+qty) and the user benefits from seeing the distinction upfront.
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
- **Batch Input Barang**: table, paginated, sorted by date DESC, search by supplier/invoice Masuk. Each row has a `View Details` action that opens a modal showing the batch contents (product, qty, list of SNs, COGS, price).
- **No PDF for Batch Input in v1.** The table + detail modal is the artifact.

### New Document Audit Action Enums

- Three new values added to the `audit_action` enum via `ALTER TYPE`: `Surat Jalan Created`, `Surat Penarikan Created`, `Batch Input Created`.
- Two-tier write pattern matches the existing `createSaleHandler`:
  - Per-item log: reuses existing enum values (`Sales Deduction` for SJ/SPB, `Stock Addition` for BI)
  - Summary log: uses the new enum value, links to the parent document via `related_id`

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
