---
target: src/routes/__root.tsx (sidebar — organization focus)
total_score: 22
p0_count: 1
p1_count: 1
timestamp: 2026-06-15T16-59-13Z
slug: src-routes-root-tsx
---

# Sidebar Critique — Organization Focus (Round 2)

> **Round 2 for `src-routes-root-tsx`.** Round 1 identified the issue; this round proposes the fix. See chat for the full report.

## The actual problem

- 6 of 13 routes are unreachable from the nav: SalesLogs, BatchInput, Suppliers, SuratJalan, SuratPenarikan, WarrantyTracker.
- 7 visible items have no grouping.
- 3 different naming conventions in 7 labels ("Cashier (POS)" / "Financial Reports" / "Activity Logs" / "System Config").
- CONTEXT.md explicitly specifies top-level sidebar placement for SuratJalan, SuratPenarikan, BatchInput (between Inventory and SuratJalan).

## Proposed reorganization

Section labels use the existing text-[10px] font-black uppercase tracking-widest voice (same as the tagline under the logo and every stat label in the app). No dividers, no tinted backgrounds, no visual change to the active state.

```
(no group)  Dashboard
OPERASIONAL  Cashier (POS) · Surat Jalan · Surat Penarikan Barang · Sales Logs
KATALOG      Inventory · Batch Input Barang · Suppliers
CATATAN      Customers · Warranty Tracker
LAPORAN & PENGATURAN  Financial Reports · Activity Logs · System Config
```

Order: BatchInput goes between Inventory and SuratJalan per CONTEXT.md.

## What this changes (concretely)

- +6 menu items
- +4 section labels
- No colour, no radii, no typography, no icon, no spacing change to existing items
- No new dependencies
- No header changes (Admin hard-code is a separate issue)

## What this does NOT change

- Visual chrome is preserved (slate-900 rail, indigo-600 active state with shadow-indigo-500/20, rounded-xl items).
- Section label is just a <p> with the existing label class string.
- Icons stay as inline SVGs (lucide cleanup is P3, separate pass).
- Header is untouched (P2 hard-coded Admin is separate).

## Priority issues (organization only)

### P0 — Six routes are unreachable from the sidebar

Add menu items for: SalesLogs, BatchInput, Suppliers, SuratJalan, SuratPenarikan, WarrantyTracker. CONTEXT.md specifies BatchInput goes between Inventory and SuratJalan.

### P1 — No visual grouping

Add 4 lightweight section labels (Operasional / Katalog / Catatan / Laporan & Pengaturan) using the project's existing label voice. No dividers, no tinted backgrounds.

### P2 — Section ordering is opinionated

Grouping reflects a workflow reading. If a senior staff member has a different mental order, the order can be swapped without changing the structure.

## Score impact

| Heuristic                           | Before | After |
| ----------------------------------- | ------ | ----- |
| Match Between System and Real World | 1      | 4     |
| Recognition Rather Than Recall      | 1      | 4     |
| Aesthetic and Minimalist Design     | 2      | 3     |

Overall sidebar score moves from 14/40 to ~22/40 (Acceptable range); the rest of the gap is header/mobile issues that are out of scope for "more organized".

## Persona red flags (organization)

- **Pak Djoko (cashier)**: with the fix, finds Sales Logs next to Cashier (POS) because that's where the workflow takes him. Memory requirement drops from "remember 6 URLs" to "follow the workflow".
- **Sam (screen reader)**: group labels should carry role="region" + aria-label for screen-reader discovery.
- **Alex (power user)**: still no Cmd+K palette; grouping is a partial mitigation. Out of scope for "more organized".
