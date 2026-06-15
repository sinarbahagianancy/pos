# Design

> Captures the current visual system of the Sinar Bahagia POS as it ships. This document describes what's in the code today, so any future change has a baseline to compare against. Refactor toward this; do not invent new tokens.

---

## Theme

|                      |                                                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Surface strategy** | Restrained. Cool neutral (slate) carries the page; a single accent (indigo) marks primary actions and the active nav state. No warm-tinted body backgrounds.                 |
| **Light / dark**     | Light only. The product runs at a counter under shop lighting; dark mode is out of scope.                                                                                    |
| **Brand color**      | Indigo (`indigo-600` ≈ `#4F46E5`) — the only saturated accent on the page. Carries: active sidebar item, primary CTA, focus rings, focus borders.                            |
| **Body background**  | `slate-50` (`#F8FAFC`).                                                                                                                                                      |
| **Sidebar**          | `slate-900` (`#0F172A`) — a deep cool neutral. One tier darker than the body.                                                                                                |
| **Surfaces / cards** | White (`#FFFFFF`) with `border-slate-200` + `shadow-sm`.                                                                                                                     |
| **Ink**              | `slate-900` headings and primary text; `slate-500`/`slate-400` for labels and meta; `slate-300` for disabled.                                                                |
| **Status colors**    | `green-500/600` success · `red-500/600/700` error / destructive · `amber-500/600` warning · `indigo-600` info. Always paired with a text label or icon — never colour-alone. |

## Color tokens

Token names follow the Tailwind v4 palette as used in the codebase. Sample values are the most common occurrences; the full ramps (50–950) of each family are available.

| Token                | Value                               | Where it appears                                      |
| -------------------- | ----------------------------------- | ----------------------------------------------------- |
| `--bg-canvas`        | `bg-slate-50` (`#F8FAFC`)           | App background, login background, pagination footer   |
| `--bg-sidebar`       | `bg-slate-900` (`#0F172A`)          | Left navigation rail                                  |
| `--bg-sidebar-hover` | `bg-slate-800` (`#1E293B`)          | Inactive nav item hover                               |
| `--bg-surface`       | `bg-white` (`#FFFFFF`)              | Cards, modals, header, popovers                       |
| `--bg-surface-tint`  | `bg-slate-100`                      | Empty rows, soft separators                           |
| `--border-subtle`    | `border-slate-200`                  | Card borders, input borders, table dividers           |
| `--text-primary`     | `text-slate-900`                    | Headings, prices, totals                              |
| `--text-body`        | `text-slate-800`                    | Body copy, table cells                                |
| `--text-muted`       | `text-slate-500` / `text-slate-400` | Eyebrow labels, helper text, placeholder              |
| `--text-inverse`     | `text-white`                        | Text on dark sidebar, on primary CTAs                 |
| `--accent`           | `bg-indigo-600` (`#4F46E5`)         | Active nav, primary buttons, current page, focus ring |
| `--accent-hover`     | `bg-indigo-700`                     | Primary button hover                                  |
| `--accent-soft`      | `bg-indigo-50`                      | Active-row tint, soft accent surfaces                 |
| `--success`          | `bg-green-600` / `text-green-600`   | Success badges, in-stock SN counts                    |
| `--warning`          | `bg-amber-500` / `text-amber-600`   | Stock-critical, action-needed                         |
| `--danger`           | `bg-red-600` / `text-red-700`       | Delete, low-stock, validation errors                  |
| `--danger-soft`      | `bg-red-50`                         | Inline error surfaces                                 |
| `--info-soft`        | `bg-blue-500` / `bg-indigo-100`     | Info chips                                            |

## Typography

|                      |                                                                                                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Family**           | Inter (loaded via `@fontsource/inter` and the Google Fonts preconnect in `index.html`). System fallback `ui-sans-serif, system-ui, sans-serif`. No second family.                                                  |
| **Weights in use**   | `font-medium` (500) · `font-bold` (700) · `font-black` (900). `font-black` is the dominant display weight (≈454 occurrences in `src/routes`); do not introduce `font-extrabold` or `font-semibold` as a new voice. |
| **Tracking**         | `tracking-tight` on display titles · `tracking-tighter` on hero numbers · `tracking-widest` on all uppercase eyebrows/labels.                                                                                      |
| **Tabular numerals** | `tabular-nums` is applied to every monetary and count value. Keep it on every `formatIDR()` render.                                                                                                                |

### Scale (px, observed)

| Role                          | Size                      | Weight                       | Tracking                      | Notes                                                                     |
| ----------------------------- | ------------------------- | ---------------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| Hero number (dashboard tiles) | `text-2xl` (24)           | `font-black`                 | `tracking-tighter`            | With `tabular-nums`                                                       |
| Section title (page)          | `text-xl` (20)            | `font-bold`                  | `tracking-tight`              |                                                                           |
| Card title                    | `text-sm` (14)            | `font-black`                 | `tracking-widest` + UPPERCASE | Used as section eyebrows inside cards                                     |
| Body / table cell             | `text-sm` (14)            | `font-medium` or `font-bold` | default                       |                                                                           |
| Label / meta                  | `text-[10px]`             | `font-black`                 | `tracking-widest` + UPPERCASE | The signature "tiny tracked eyebrow" used for stat labels and form labels |
| Helper / error                | `text-[10px]` – `text-xs` | `font-medium`                | default                       | Inline form errors                                                        |
| Button label                  | `text-xs` (12)            | `font-black`                 | `tracking-widest` + UPPERCASE | Verb-object phrases                                                       |

The `text-[10px] font-black uppercase tracking-widest` pattern is the project's signature label voice. Use it for: stat labels, form labels, section eyebrows, button text. Do not use sentence-case body copy where this pattern is expected.

## Iconography

- **Source**: `lucide-react` for any newly added icon (already a dependency). Inline SVGs are used in `__root.tsx` for sidebar + header icons; new screens should prefer `lucide-react` for consistency.
- **Size**: 20px (`w-5 h-5`) in the sidebar; 24px (`w-6 h-6`) in the header logout button.
- **Stroke**: 2px (`strokeWidth="2"`); `strokeLinecap="round"`, `strokeLinejoin="round"`.
- **Colour**: `currentColor` — icons inherit the text colour of their parent so they pick up hover/active states automatically.

## Spacing & layout

- **Grid**: Tailwind v4 utilities; no custom spacing tokens beyond the framework.
- **Sidebar width**: `w-72` (288px), `fixed inset-y-0 left-0`, `z-50`. The main pane is offset by `ml-72`.
- **Header height**: `h-16` (64px), white, `border-b border-slate-200`.
- **Main gutter**: `p-4` on mobile, `lg:p-8` on `lg+`.
- **Card padding**: `p-6` (default) and `lg:p-8` on spacious hero cards.
- **Vertical rhythm**: card stacks use `space-y-6` to `space-y-8`; inside cards, `space-y-4` for tight groupings.
- **Section breaks**: 32–48px (`gap-6` / `gap-8`) between major page sections, 16px (`gap-4`) between items in a group.

## Radii

The product runs **very rounded** — there is no sharp-cornered element in the system.

| Token            | Value | Use                                                          |
| ---------------- | ----- | ------------------------------------------------------------ |
| `rounded-lg`     | 8px   | Pagination buttons, small chips                              |
| `rounded-xl`     | 12px  | Sidebar nav items, table cells, medium buttons, input fields |
| `rounded-2xl`    | 16px  | Buttons (primary), search inputs, small cards                |
| `rounded-3xl`    | 24px  | Large form controls, hero metric tiles                       |
| `rounded-[32px]` | 32px  | Big page-level cards (Dashboard tiles)                       |
| `rounded-[40px]` | 40px  | Login card, container-level surfaces                         |
| `rounded-full`   | pill  | Avatars, status badges                                       |

## Shadows

- **Card default**: `shadow-sm` (Tailwind default, 1 layer).
- **Primary button / active state**: `shadow-lg shadow-indigo-500/20` (tinted, never neutral grey).
- **Login card**: `shadow-2xl` + `border-slate-100`.
- **Header**: no shadow; separation comes from `border-b border-slate-200`.

Avoid: neutral grey drop shadows on dark surfaces; multiple stacked shadows on the same element; shadows without an accompanying border on white surfaces.

## Components

### Buttons

| Variant           | Class pattern                                                                                                                                                                   | Use                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| **Primary**       | `bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all` | Form submit, "Tambah …", confirm checkout |
| **Dark primary**  | `bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest py-5 rounded-2xl shadow-xl shadow-slate-900/10`                                        | Login submit                              |
| **Secondary**     | `border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-sm rounded-xl px-4 py-2.5`                                                                    | Cancel, back, secondary actions           |
| **Danger (icon)** | `p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl`                                                                                                              | Row delete, sign-out icon                 |
| **Disabled**      | `disabled:opacity-50 disabled:cursor-not-allowed` (added to any of the above)                                                                                                   | —                                         |

All buttons: verb-object labels, UPPERCASE for primary/dark, sentence-case allowed for tertiary/icon buttons. No icon-only buttons except the sign-out and row-delete cases.

### Inputs

- `border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none rounded-2xl px-6 py-4`
- Hover lifts to `bg-white`.
- `transition-all` on every input.
- Labels above the input: `text-[10px] font-black text-slate-400 uppercase tracking-widest`.
- Inline error: red border + `text-red-600 text-sm font-medium` helper text directly under the field.

### Card / surface

- `bg-white border border-slate-200 shadow-sm rounded-2xl` (default) or `rounded-3xl` (large tiles) or `rounded-[40px]` (container).
- Optional interactive lift: `hover:border-indigo-200 transition-all` for tile-style cards.
- Card title uses the `text-[10px] font-black uppercase tracking-widest` label pattern, not a section heading.

### Sidebar nav item

- Container: `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200`.
- **Active**: `bg-indigo-600 text-white shadow-lg shadow-indigo-500/20`.
- **Inactive**: `text-slate-400 hover:bg-slate-800 hover:text-slate-200`.
- Icon: `w-5 h-5 shrink-0`, 2px stroke.
- Label: `font-bold text-sm tracking-tight`.

### Table

- Container: `bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden`.
- Header row: `text-[10px] font-black text-slate-400 uppercase tracking-widest`.
- Cell: `text-sm text-slate-700 font-medium`, `py-4 px-6`.
- Numeric cells: `tabular-nums`, right-aligned.
- Hover row: `hover:bg-slate-50 transition-colors`.
- Pagination footer: `bg-slate-50 border-t border-slate-200` (see `Pagination.tsx`).

### Modal / dialog

- Backdrop: `fixed inset-0 bg-slate-900/50 backdrop-blur-sm`.
- Container: `bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-…`.
- Header: `p-6 lg:p-8 border-b border-slate-100` with title in `text-lg font-bold`.
- Body: `p-6 lg:p-8` with `space-y-6`.
- Footer: `p-6 border-t border-slate-100 flex justify-end gap-3`.

### Toast

- Floating top-right: `fixed top-6 right-6 z-[100]`.
- Success: `bg-white border-l-4 border-green-500 rounded-xl shadow-2xl p-4`.
- Error: `bg-white border-l-4 border-red-500 …`.
- Auto-dismiss ~3s; manual close button.

## Motion

- **Default transition**: `transition-all duration-200` on interactive elements (nav items, buttons, inputs).
- **Button press**: `active:scale-95` on primary CTAs.
- **Login card entrance**: one-shot `transition-all duration-700` from `opacity-0 scale-95 translate-y-10` to default on mount. This is the only choreographed motion in the system; it does not repeat.
- **No bounce, no elastic, no orchestrated page-load sequences.** State changes only.

## Accessibility patterns

- **Active state uses colour + background + shadow**, not colour alone (the indigo-on-white active state is also positionally distinct in the nav).
- **Focus rings**: `focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500` on inputs; the sidebar nav uses native browser focus.
- **Touch targets**: nav items are `py-3` × `px-4` (≥ 44px tall); primary buttons are `py-3` × `px-6` (well above 44px).
- **Icon-only buttons** (sign-out, row delete) always carry a `title` attribute.

## Layout regions

```
┌──────────┬───────────────────────────────────────┐
│          │  Header (h-16, white, border-b)       │
│ Sidebar  ├───────────────────────────────────────┤
│ (w-72,   │                                       │
│  slate-  │  Main                                 │
│  900,    │  (flex-1, bg-slate-50,                │
│  fixed)  │   p-4 lg:p-8)                         │
│          │                                       │
└──────────┴───────────────────────────────────────┘
```

The sidebar is `fixed` (not flex-relative) so it survives scroll within the main pane. The header is inside the main flex column, not absolutely positioned.

## Don'ts (project-specific)

- Do not add a second accent colour. Indigo is the only saturated hue on the page.
- Do not introduce a warm-tinted body background. The `slate-50` cool neutral is intentional.
- Do not use `font-extrabold` (800) or `font-semibold` (600). The voice is 500 / 700 / 900 only.
- Do not pair Inter with a second font family. One family, multiple weights.
- Do not anglicize `Faktur Penjualan`, `Surat Jalan`, `Surat Penarikan Barang`, `Batch Input Barang`, `Utang`, `Terbilang`, `Keterangan`, `Tanda Terima`, or `Perhatian` in user-facing chrome.
- Do not prefix monetary values with "Rp" in tables or totals. Use the Indonesian dot-thousands format with `tabular-nums`.
- Do not use side-stripe borders (`border-l-4`, `border-r-4`) as decorative accents on cards, callouts, or alerts.
- Do not use gradient text (`bg-clip-text`) anywhere.
- Do not introduce a dark theme variant. The product is light-only.
