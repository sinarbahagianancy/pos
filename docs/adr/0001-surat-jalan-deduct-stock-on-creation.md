# 0001 - Surat Jalan and Surat Penarikan deduct stock on creation

A Surat Jalan (delivery note) and a Surat Penarikan Barang (goods withdrawal) both deduct stock from Inventory the moment they are created, instead of waiting for a matching Faktur Penjualan or a separate stock adjustment.

**Why not the obvious alternative.** The natural reading of a delivery note is "a piece of paper that travels with the goods" — not a stock event. The alternative would be to keep stock untouched on SJ creation and only deduct it when a Faktur Penjualan is later issued. Likewise, a Surat Penarikan could be modelled as a "record of a removal that already happened" rather than the removal itself.

**Why we don't.** The shop's reported Inventory has to match what's physically on the shelf. A Surat Jalan travels with goods that _have left_; if we don't deduct, Inventory overstates availability and staff will promise customers items that aren't there. The matching Faktur Penjualan is a _financial_ event, not a logistics one — a single Faktur may consolidate goods from multiple Surat Jalan, and a Surat Jalan can be issued (delivered) days before the Faktur is billed. Decoupling logistics from finance means stock must follow the logistics document. The same logic applies to Surat Penarikan: the form _is_ the write-off event; asking the user to perform a second action (stock adjustment) after creating the form invites the form and the stock to drift.

**Trade-off accepted.** There is no reverse-action for either document. A typo on a Penarikan (e.g., wrong quantity) must be corrected by creating a second Penarikan with reason `Lainnya: Koreksi SPB <original-id>`. This is annoying in practice but keeps the data model terminal-on-creation and makes the audit log append-only.

**Reversibility.** Hard to reverse. Both documents write stock-deduction audit logs that downstream reports (Inventory snapshots, Financial Reports) consume. Changing this decision later would require a data migration to recompute stock and a way to distinguish SJ-driven deductions from Sale-driven ones.
