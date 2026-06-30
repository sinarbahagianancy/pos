# PO Number as Quotation Identifier

## Status

Accepted

## Context

Quotations need a unique identifier. Previously, the system used an auto-generated `SB/dd/mm/yyyy-NNN` format as the "Quotation Number" (primary key), and treated PO Number as a separate optional field. This created confusion — users saw two IDs on the quotation PDF, and it was unclear which one mattered.

The business reality: there is no "Quotation Number." There is only **PO Number**. When a customer provides a PO number, that's what goes on the document. When they don't, the system auto-generates one using the `SB/dd/mm/yyyy-NNN` format as the PO Number.

## Decision

1. **PO Number is the only identifier** — there is no separate "Quotation Number" concept.

2. **Auto-generation uses a loop-and-skip algorithm**:
   - Start with `last_number + 1` from the daily counter
   - Build candidate PO: `SB/dd/mm/yyyy-{counter}`
   - Check `quotations.po_number` for existence
   - If exists → increment counter, retry
   - If available → use it, update counter
   - This ensures no collisions even if users manually enter PO numbers that match the auto-generated format

3. **Counter only moves forward** — never decrements. If a user manually enters `SB/01/07/2026-005` when the counter is at 3, the counter stays at 3. The next auto-generated PO will be `004`, then `006` (skipping `005` which already exists).

4. **Manual entry validation** — when a user types a PO number, the system only checks for duplicates. No format validation, no date portion check. Any string is valid as long as it's unique.

5. **PO Number carries to Invoice** — when a Quotation is approved and converted to a Sale, the PO Number is copied to `sales.po_number`.

## Consequences

- The quotation's `id` field (database primary key) still stores the `SB/dd/mm/yyyy-NNN` value, but it's understood as the PO Number, not a separate concept.
- Counter numbers may have gaps if users manually enter PO numbers matching the auto-generated format. This is acceptable — the counter is a hint, not a guarantee of sequential order.
- The PDF shows "No. PO" (not "No. Quotation") to reflect this.
