---
target: src/router.tsx (AppLayout — corrected target)
total_score: 22
p0_count: 1
p1_count: 1
timestamp: 2026-06-15T17-00-37Z
slug: src-routes-root-tsx
---

# Sidebar Critique — Corrected Target

> **Round 3 / corrected.** Target was the dead `src/routes/__root.tsx` file in round 1+2. The real sidebar is the `AppLayout` inside `src/router.tsx` (lines 167-348). This snapshot reflects the corrected target.

## What changed vs. round 1+2

- Real target: `src/router.tsx`'s `AppLayout`, not `src/routes/__root.tsx`.
- `__root.tsx` is dead code (nothing imports it). Misleading future agents — see P3 below.
- Real sidebar has 12 items, not 7. Only **1 route is missing**: `WarrantyTracker` (`/warranty`).
- The hard-coded "Admin" issue in \_\_root.tsx does not exist in the live code — the live sidebar uses `getCurrentUser()` and renders the actual staff name + initial.
- The label issues I described (`Penarikan Barang`, `Batch Input`, etc.) are real and visible in the live code.

## The actual current sidebar (live)

12 items, all sibling, no grouping, mixed workflow order. Order in the code:

1. Dashboard
2. Cashier (POS)
3. Sales Logs
4. Surat Jalan
5. Penarikan Barang
6. Batch Input
7. Inventory
8. Suppliers
9. Customers
10. Financial Reports
11. Activity Logs
12. System Config

## What the product actually contains

| Route               | In sidebar? | Path             |
| ------------------- | ----------- | ---------------- |
| Dashboard           | yes         | /                |
| POS                 | yes         | /pos             |
| SalesLogs           | yes         | /sales-logs      |
| SuratJalan          | yes         | /surat-jalan     |
| SuratPenarikan      | yes         | /surat-penarikan |
| BatchInput          | yes         | /batch-input     |
| Inventory           | yes         | /inventory       |
| Suppliers           | yes         | /suppliers       |
| Customers           | yes         | /customers       |
| **WarrantyTracker** | **NO**      | /warranty        |
| Reports             | yes         | /reports         |
| AuditLogs           | yes         | /audit           |
| Settings            | yes         | /settings        |

**1 of 13 routes is unreachable from the nav.**

## Priority issues (organization only)

### P0 — Warranty Tracker is unreachable from the sidebar

Add a menu item for `/warranty` (path confirmed in router.tsx line ~1400). Camera shop, warranty is a primary concern.

### P1 — No visual grouping

13 items in a flat list, no workflow cue. Add 4 section labels (Operasional / Katalog / Catatan / Laporan & Pengaturan) using the project's existing text-[10px] font-black uppercase tracking-widest voice. No dividers, no tinted backgrounds.

### P2 — Section ordering is opinionated

Grouping reflects a workflow reading. If a senior staff member has a different mental order, the order can be swapped without changing the structure.

### P3 — Dead code: src/routes/\_\_root.tsx

Exports an unused AppLayout. Confused this agent (round 1+2). Rename to .legacy.tsx with a one-line comment, or delete.

## Score impact (organization only)

| Heuristic                           | Before | After |
| ----------------------------------- | ------ | ----- |
| Match Between System and Real World | 2      | 4     |
| Recognition Rather Than Recall      | 2      | 4     |
| Aesthetic and Minimalist Design     | 2      | 3     |

Sidebar moves from ~17/40 to ~22/40.

## Grouping proposal (final)

```
(no group)    Dashboard
OPERASIONAL   Cashier (POS) · Sales Logs · Surat Jalan · Penarikan Barang
KATALOG       Inventory · Batch Input · Suppliers
CATATAN       Customers · Warranty Tracker
LAPORAN & PENGATURAN   Financial Reports · Activity Logs · System Config
```

## Implementation notes

- All changes in `src/router.tsx`, in the `AppLayout` component.
- `menuItems` array → `menuStructure: MenuGroup[]`.
- `Warranty` icon: inline SVG, w-5 h-5, strokeWidth 2, currentColor. Shield-check or similar.
- `src/routes/__root.tsx`: rename to .legacy.tsx (safer than delete).

## Process note for future agents

`main.tsx` imports `router` from `./router`. The active `AppLayout` is the one inside `router.tsx`. `src/routes/__root.tsx` is dead.
