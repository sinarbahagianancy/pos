# Product

## Register

product

## Users

Shop staff at **Sinar Bahagia** — a family-run camera shop in Surabaya that has been operating since 1960. The tagline is "Cutting Edge Photography" and the store has exactly one branch ("TIDAK BUKA CABANG"). Users are cashiers and an admin/staff role who:

- Ring up sales and print `Faktur Penjualan` (sales invoices)
- Issue `Quotation` documents and convert them to invoices on approval
- Manage a photography-equipment catalog (cameras, lenses, accessories) with serial-number-level tracking
- Print `Surat Jalan` (delivery notes), `Surat Penarikan Barang` (internal write-off notes), and `Batch Input Barang` (supplier-introduced catalog batches)
- Track warranty claims and customer/supplier records
- Run a small set of financial reports

Domain expertise is high (the shop has been doing this for 60+ years); software-tool expertise is moderate. The working language is Indonesian, with English/Indonesian labels per the term glossary in `CONTEXT.md`. The interface is internal-tool-grade: one seat-class per staff role, single location, no multi-tenant concerns.

## Product Purpose

Run the daily operations of a 60+ year-old Indonesian camera shop end-to-end: sell gear, track every serial number from intake to warranty expiry, issue the right document for the right situation, and keep an audit trail the staff can trust. Success means a cashier can complete a multi-SN sale, print the right invoice variant, deduct stock, log the audit action, and keep working — without fighting the system.

## Brand Personality

- **Trustworthy, traditional, precise.** The store has been on the same street since 1960; the interface should feel like a reliable counter, not a startup deck.
- **Indonesian-first vocabulary.** Domain terms are preserved in Indonesian (`Faktur Penjualan`, `Quotation`, `Terbilang`, `Keterangan`, `Tanda Terima`, `Perhatian`, `Penarikan`, `Batch Input`, `Utang`, `SN`). English is acceptable only for terms the staff already use in English (`Quotation`, `SN`, `COGS`, `PO`).
- **Calm, dense, workmanlike.** This is a tool used at a counter, all day, by people who know what they're doing. Confidence comes from restraint, not flourish.

Three-word personality: **terpercaya · teliti · tenang** (trusted · precise · calm).

## Anti-references

- **No SaaS-cream / warm-neutral / paper-toned body backgrounds.** The 2026 saturated AI default of "creamy off-white with one accent" is the wrong register for a 60-year-old Indonesian camera shop. Stick to the existing cool-slate neutral.
- **No gradient text, no glassmorphism, no hero-metric template with a big number + small label + supporting stats** (the existing `Dashboard` already borders on this — preserve substance, drop the `+X%` decorative badges).
- **No anglicized domain terms.** Never translate `Faktur Penjualan` to "Sales Invoice" in user-facing chrome, never call `Surat Penarikan Barang` a "Write-off Form", never call `Batch Input Barang` "Restock" or "Stock Addition".
- **No "Rp" prefix on numbers in tables/totals** (existing rule from `CONTEXT.md`); the Indonesian dot-thousands format stands on its own.
- **No display fonts or multi-family typography.** Inter at one or two weights only; preserve the existing voice.
- **No general-ecommerce-admin look** (Shopify, WooCommerce, Stripe Dashboard chrome). This is a bespoke counter tool for a single shop.

## Design Principles

1. **The tool disappears into the task.** A cashier mid-sale should not be reading UI; they should be reading prices, serial numbers, and the customer. UI is scaffolding, not content.
2. **Audit the data, not the chrome.** The product is "did the stock go down?", "is this SN the right SN?", "did the right document get printed?". The interface should make the answer obvious and the trail verifiable.
3. **Indonesian vocabulary is a feature, not friction.** When a cashier thinks in `Faktur Penjualan`, the UI must say `Faktur Penjualan`. Translation is a bug, not a polish item.
4. **One role, one screen, one decision at a time.** The shop has one branch, one admin, and a handful of cashiers. Multi-tenant, multi-role, multi-currency complexity is the wrong move; keep the cognitive surface small.
5. **Restraint reads as confidence.** This shop has been here since 1960. The interface should look like it intends to be here in 2046, not like it shipped this quarter.

## Accessibility & Inclusion

- **WCAG 2.1 AA** as the floor (this is a workplace tool, used daily; accessibility is required, not aspirational).
- **Keyboard-navigable flows** for the cashier path: scan input → SN picker → payment → confirm. The barcode-scan-on-Enter behavior in `POS.tsx` already presumes keyboard reach.
- **Color is not the only state carrier.** Status colours (green = success, red = error/destructive, amber = warning) must be paired with text or iconography; never colour-alone.
- **High-contrast body text** — the existing `slate-900` on `slate-50` palette is sufficient; do not introduce muted-gray body copy.
- **Touch targets ≥ 44×44 px** for any action reachable from a till environment (the current product-list rows and cart rows are already close, but spacing should not regress).
- **Reduced-motion respected** for any future motion additions (the current interface is largely motion-free, so this is a guardrail not a refactor).
