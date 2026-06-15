---
target: src/routes/__root.tsx (sidebar)
total_score: 14
p0_count: 1
p1_count: 1
timestamp: 2026-06-15T09-04-02Z
slug: src-routes-root-tsx
---

# Sidebar Critique — src/routes/\_\_root.tsx

> **First run for this target.** Score: **14/40 (Poor)**. Driven by content gap, not visual style. See chat for the full report.

## Design Health Score

| #   | Heuristic                           | Score | Key Issue                                                                                                                                                                                                                                                                |
| --- | ----------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Visibility of System Status         | 3     | Active nav item is clearly highlighted. No breadcrumb of where you are beyond the URL — fine for a 7-item nav, will get worse as items grow.                                                                                                                             |
| 2   | Match Between System and Real World | 1     | The sidebar doesn't match the real app. Six of the routes the staff need (SalesLogs, BatchInput, Suppliers, SuratJalan, SuratPenarikan, WarrantyTracker) are not in the nav. Per CONTEXT.md, three of these are explicitly committed to as "new top-level sidebar item". |
| 3   | User Control and Freedom            | 1     | No way to navigate to 6 of 13 routes without typing the URL. No sidebar collapse; no mobile pattern at all (w-72 fixed takes 77% of a 375px screen).                                                                                                                     |
| 4   | Consistency and Standards           | 2     | Visual style is internally consistent with the rest of the app. But the content is inconsistent: it shows Cashier (POS) as one item, missing the other 12 routes.                                                                                                        |
| 5   | Error Prevention                    | 3     | Active-state styling is unambiguous; not a footgun.                                                                                                                                                                                                                      |
| 6   | Recognition Rather Than Recall      | 1     | Staff must memorize direct URLs for sales logs, warranty tracker, suppliers, surat jalan, surat penarikan, batch input. New staff will not discover these.                                                                                                               |
| 7   | Flexibility and Efficiency of Use   | 1     | No keyboard shortcut to switch sections. No recent or favourites. A 60-year-old shop's admin doing 50 sales a day has no acceleration path through the nav.                                                                                                              |
| 8   | Aesthetic and Minimalist Design     | 2     | The list is fine aesthetically but it is unhelpfully flat — a single column of 7 items with no visual rhythm. As the app grows, this becomes a wall.                                                                                                                     |
| 9   | Error Recovery                      | n/a   | Sidebar doesn't surface errors.                                                                                                                                                                                                                                          |
| 10  | Help and Documentation              | 0     | Nothing in the nav hints at the new document types (Surat Jalan, Surat Penarikan, Batch Input).                                                                                                                                                                          |

**Total: 14/40 — Poor**

## Anti-Patterns Verdict

- Visual style is on-brand and consistent with DESIGN.md. No gradient text, no glassmorphism, no eyebrow-on-every-section, no hero-metric chrome.
- The disorganization is structural (missing entries + flat list), not visual.
- 1 detector warning: `text-slate-400 on bg-red-50` at line 121 — false positive in practice (the slate-400 sits on the white header in default state; bg-red-50 only appears on :hover with text-red-600).

## Priority Issues

### P0 — Six routes are unreachable from the sidebar

Add menu items for: SalesLogs, BatchInput, Suppliers, SuratJalan, SuratPenarikan, WarrantyTracker. CONTEXT.md specifies BatchInput goes between Inventory and SuratJalan.

### P1 — No visual grouping — flat list of 7 (soon 13) items

After P0 lands, add 4 lightweight section labels (Operasional / Katalog / Catatan / Laporan & Pengaturan) using the project's existing text-[10px] font-black uppercase tracking-widest voice. No dividers, no tinted backgrounds.

### P2 — No mobile / tablet pattern

w-72 fixed sidebar with no collapse. On a 768px tablet that's 38% of the screen; on a phone it's 77%. Add a hamburger toggle in the header (left edge).

### P2 — Hard-coded "Admin" in the header

\_\_root.tsx:134 hard-codes the staff name as "Admin" and the avatar as "A". Will lie the moment a second staff logs in.

### P3 — Inline SVG icons vs lucide-react

The sidebar uses inline <svg> path strings; lucide-react is already a dependency and used elsewhere. Worth doing if P0/P1 work is already touching this file.

## Persona Red Flags

- **Pak Djoko (cashier)**: Tries to print Surat Jalan for a waiting customer. The menu doesn't show it. Has to ask for the URL.
- **Sam (screen reader)**: Tabs through 7 items and falls off. The 6 missing routes are not announced via assistive tech. The active state is colour-only; no aria-current.
- **Alex (power user)**: No Cmd+K command palette. With 13 routes, fuzzy-searchable jump-to-route would be a 5-minute keyboard-driven path to any surface.

## Minor Observations

- ml-72 on the main pane is duplicated in DOM and CSS; a data-collapsed attribute on the layout root would let it switch cleanly when the P2 collapse is added.
- No keyboard shortcut for sign-out (e.g. Shift+L). Small a11y win.
- The Cutting Edge Photography tagline under the logo correctly uses the signature text-[10px] font-black uppercase tracking-widest voice.

## Questions to Consider

1. CONTEXT.md specifies an order (BatchInput between Inventory and SuratJalan). Is that the order staff already expect, or a planning-time guess?
2. The header hard-codes "Admin" today. Is multi-staff login a near-term roadmap item (fix now) or a later concern (defer to P3)?
3. Section labels in Indonesian (Operasional, Katalog, Catatan, Laporan & Pengaturan) — is that the right register, or does the shop use English headings for internal tools?
