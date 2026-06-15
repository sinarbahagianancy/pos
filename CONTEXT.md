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

| Term                       | Definition                                                                                                                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Faktur Penjualan**       | Sales invoice document issued to customers                                                                                                                                                                                                                                            |
| **Quotation**              | Price estimate document, not a proof of payment                                                                                                                                                                                                                                       |
| **Surat Jalan**            | Delivery note accompanying goods sent to a customer. Same format as Faktur Penjualan, but no price columns are printed. Items must come from Inventory.                                                                                                                               |
| **Surat Penarikan Barang** | Internal goods-removal note (damaged / expired / used internally / etc.). Same format as Faktur Penjualan, but no price columns are printed. Items are NOT required to exist in Inventory. Carries both a recipient (person or department) and a reason.                              |
| **Batch Input Barang**     | A restock batch: one supplier invoice (Nomor Invoice Masuk) bringing in multiple product lines in a single transaction, supporting SN and non-SN items, integrated to Inventory.                                                                                                      |
| **Input Barang Baru**      | Create a brand-new product in the catalog. Operates on the product definition itself (no stock, no supplier invoice). Distinct from Batch Input Barang, which is restocking existing products. The Inventory page header always shows this action, regardless of which tab is active. |

_Avoid_ for Surat Jalan: Delivery Order, DO, Surat Pengiriman, Delivery Note.
_Avoid_ for Surat Penarikan Barang: Write-off Form, Barang Keluar Form, BKB.
_Avoid_ for Input Barang Baru: Add Product (use the Indonesian term — it matches the existing button label). Do NOT confuse with Batch Input Barang, which is restocking, not catalog creation.
_Avoid_ for Batch Input Barang: Restock, Stock Addition, Penerimaan Barang.

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
- **Batch Input Barang**: adds to stock on creation. Each item line either appends to `products.invoice_number` (restock history, for non-SN lines) or inserts new rows into `serial_numbers` (for SN lines, status `In Stock`). Audit action: `Stock Addition`.

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
  - **Batch Input Barang**: **free-form** — the supplier's invoice number (Nomor Invoice Masuk), supplied by the user
- **PO Number field**:
  - **Surat Jalan**: yes, mandatory, custom-typed (matches existing `sales.po_number` rule)
  - **Surat Penarikan Barang**: **no** — not a customer-facing commercial document
  - **Batch Input Barang**: **no** — the `supplier_invoice` field plays a similar role

### Document Customer / Recipient / Supplier

- **Surat Jalan**: `customer_id` is nullable; `customer_name` is NOT NULL text. Mirrors the Quotation model. If the user picks a customer from the list, address/NPWP auto-fill; if not, just a free-form name.
- **Surat Penarikan Barang**: `recipient` is free-form text (person or department). No link to `customers` or `staff_members` table. v1 has no autocomplete.
- **Batch Input Barang**: `supplier` is a dropdown of existing `suppliers` (must be added via the Suppliers page first; no inline supplier creation in v1).

### Penarikan Reason (Alasan) Structure

- New Postgres enum `penarikan_reason` with values: `Rusak`, `Expired`, `Dipakai Internal`, `Sample/Display`, `Employee Sale`, `Hilang`, `Recall`, `Lainnya`.
- Form presents a radio-button set of these; selecting `Lainnya` reveals a free-form text input.
- Free-form text is stored in a separate `alasan_lainnya text` column when `Lainnya` is chosen. The audit log entry always reads e.g. `Penarikan: Sony A7 IV — Rusak` (or `Lainnya: dikembalikan ke supplier`).

### Batch Input Form Design

- Single header (Nomor Invoice Masuk, Supplier dropdown, Date, Notes) + unified product-row table.
- Each row has a product picker; once chosen, the row "knows" whether it's SN or non-SN via `products.has_serial_number` and shows the appropriate input.
- **SN row**: `Qty` editable, `SNs` textarea appears. Validation: line-count must equal `Qty`, no duplicates, no SNs already in the system. Empty lines ignored.
- **Non-SN row**: `Qty` editable, `SNs` textarea hidden.
- `COGS` and `Harga Jual` pre-filled from the product record, editable inline. On batch submit, products get `cogs` and `price` updated to these values (consistent with the existing `adjustStock` flow).
- **New products can NOT be created inline** — they must be added via the existing Inventory → Add Product flow first. Batch Input only accepts _existing_ products.
- **One supplier per batch**.

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

### Document UI Placement

- **Surat Jalan**: new top-level sidebar item
- **Surat Penarikan Barang**: new top-level sidebar item
- **Batch Input Barang**: **tab inside the existing Inventory page** (tab 1 _Catalog_ existing, tab 2 _Batch Input_ new). The Batch Input form + history co-locate with the product catalog.

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
