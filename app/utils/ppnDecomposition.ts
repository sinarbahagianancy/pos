/**
 * Fake PPN display decomposition (see ADR 0005 + CONTEXT.md PPN entry).
 *
 * Background: the "Include PPN (11%)" toggle on the POS used to add a real
 * 11% tax on top of the subtotal. It is now a **display-only decomposition**
 * of the canonical sale total: when enabled, the printed invoice and the
 * cashier UI show a `Sub Total = total / 1.11` line and a `PPN (11%) = total -
 * subtotal` line, but the actual amount the customer pays is unchanged.
 *
 * Math (per ADR 0005, rounding strategy `a` — subtraction-first):
 *   - displayedSubtotal = round(total / (1 + taxRate), 2)
 *   - displayedTax      = total - displayedSubtotal   (exact by subtraction)
 *   - displayedTotal    = total                       (unchanged)
 *
 * Sum invariant: `displayedSubtotal + displayedTax === total` always holds
 * to the cent. The displayed `displayedTax` may differ from `displayedSubtotal
 * × taxRate` by ±0.01 IDR, but this is invisible because both display
 * formatters (`formatIDR`, `formatNumber` in `InvoicePDF.tsx`) round to whole
 * Rupiah at print time.
 *
 * Persistence contract: the canonical values stored in `sales` (and
 * `quotations`) are `subtotal = sum of items`, `tax = 0`, `total = subtotal`.
 * The fake decomposition is a *render-time* concern; this function is the
 * single source of truth for that decomposition. Accounting consumers
 * (e.g. profit calculation in `Reports.tsx`) deliberately do **not** call
 * this function — they use the canonical `sale.tax` (= 0 for new sales).
 */

/**
 * The result of applying the fake PPN decomposition at render time. All
 * three fields are in IDR with up to 2 decimal places of precision
 * (matching the `numeric(15, 2)` column precision).
 */
export interface FakePpnDisplay {
  /** The displayed "Sub Total" line on the invoice / cashier UI. */
  displayedSubtotal: number;
  /** The displayed "PPN (X%)" line. Equals `displayedTotal - displayedSubtotal`. */
  displayedTax: number;
  /** Always equals the input `total` — never changes with the toggle. */
  displayedTotal: number;
}

/**
 * Apply the fake PPN display decomposition to a canonical sale total.
 *
 * @param total     The canonical sale total (= sum of line items). Always
 *                  passed through to `displayedTotal` unchanged.
 * @param taxRate   The PPN rate as a decimal (e.g. `0.11` for 11%).
 *                  Default `0.11` matches the default `storeConfig.ppnRate`.
 * @param taxEnabled Whether the (fake) PPN line should be shown on the
 *                  invoice and cashier UI. When `false`, this function is
 *                  a passthrough.
 * @returns The triple to render as Sub Total / PPN / Total.
 */
export function applyFakePpnDisplay(
  total: number,
  taxRate: number = 0.11,
  taxEnabled: boolean,
): FakePpnDisplay {
  if (!taxEnabled) {
    return { displayedSubtotal: total, displayedTax: 0, displayedTotal: total };
  }
  // 2-decimal precision (matches the `numeric(15, 2)` DB column). The
  // displayed PPN is then derived by subtraction so the sum invariant
  // (`displayedSubtotal + displayedTax === total`) holds exactly. The
  // post-subtraction `Math.round` is necessary: `total - displayedSubtotal`
  // in floating-point can leave a trailing `…0004` (e.g. `20000 - 18018.02`
  // = `1981.9799999999996`), and the displayed value must look clean when
  // read off the screen or persisted.
  const displayedSubtotal = Math.round((total / (1 + taxRate)) * 100) / 100;
  const displayedTax = Math.round((total - displayedSubtotal) * 100) / 100;
  return { displayedSubtotal, displayedTax, displayedTotal: total };
}
