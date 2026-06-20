// Unit tests for the fake PPN display decomposition (see ADR 0005 +
// CONTEXT.md PPN entry). Pure function, no DB dependency, runs in any env.
//
// Covers:
//   - passthrough when taxEnabled is false (no fake line shown)
//   - sum invariant: displayedSubtotal + displayedTax === total to the cent
//   - 2-decimal precision (matches `numeric(15, 2)` column shape)
//   - the canonical example from the ADR (T = 20000 -> 18018.02 / 1981.98)
//   - small, awkward totals (12349) where rounding creates a 0.01 delta
//     between `subtotal × rate` and the displayed tax
//   - empty cart edge case (T = 0)
//   - non-default tax rate (e.g. 12%) still produces a valid decomposition

import { describe, it, expect } from "vite-plus/test";
import { applyFakePpnDisplay } from "../app/utils/ppnDecomposition";

describe("applyFakePpnDisplay", () => {
  describe("when taxEnabled is false", () => {
    it("passes the canonical total through unchanged", () => {
      const r = applyFakePpnDisplay(20000, 0.11, false);
      expect(r.displayedSubtotal).toBe(20000);
      expect(r.displayedTax).toBe(0);
      expect(r.displayedTotal).toBe(20000);
    });

    it("passes through regardless of rate", () => {
      const r = applyFakePpnDisplay(12345, 0.12, false);
      expect(r.displayedSubtotal).toBe(12345);
      expect(r.displayedTax).toBe(0);
      expect(r.displayedTotal).toBe(12345);
    });

    it("passes through zero without producing NaN", () => {
      const r = applyFakePpnDisplay(0, 0.11, false);
      expect(r.displayedSubtotal).toBe(0);
      expect(r.displayedTax).toBe(0);
      expect(r.displayedTotal).toBe(0);
    });
  });

  describe("when taxEnabled is true (the fake decomposition fires)", () => {
    it("matches the canonical ADR example: T=20000 -> 18018.02 / 1981.98", () => {
      const r = applyFakePpnDisplay(20000, 0.11, true);
      expect(r.displayedSubtotal).toBe(18018.02);
      expect(r.displayedTax).toBe(1981.98);
      expect(r.displayedTotal).toBe(20000);
    });

    it("preserves the sum invariant to the cent for clean multiples of 11", () => {
      // For T such that T/1.11 lands on a clean 2-decimal value, the
      // displayed tax must be exactly subtotal × 0.11 to the cent.
      const cases = [10000, 11100, 22200, 33300];
      for (const t of cases) {
        const r = applyFakePpnDisplay(t, 0.11, true);
        expect(r.displayedSubtotal + r.displayedTax).toBeCloseTo(t, 2);
        // And the displayed tax must equal subtotal × rate exactly here:
        expect(r.displayedTax).toBeCloseTo(r.displayedSubtotal * 0.11, 2);
      }
    });

    it("preserves the sum invariant for awkward totals (rounding-tolerant)", () => {
      // T = 12349: T/1.11 = 11125.225..., rounds to 11125.23.
      // 11125.23 × 0.11 = 1223.7753, would round to 1223.78.
      // Subtraction-first instead derives PPN = 12349 - 11125.23 = 1223.77.
      // Sum invariant: 11125.23 + 1223.77 = 12349.00 exactly.
      const r = applyFakePpnDisplay(12349, 0.11, true);
      expect(r.displayedSubtotal).toBe(11125.23);
      expect(r.displayedTax).toBe(1223.77);
      expect(r.displayedSubtotal + r.displayedTax).toBe(12349);
      expect(r.displayedTotal).toBe(12349);
    });

    it("sum invariant holds for a sample of random-ish totals", () => {
      const totals = [1, 7, 100, 999, 1234, 5678, 99999, 123456, 1000000];
      for (const t of totals) {
        const r = applyFakePpnDisplay(t, 0.11, true);
        // The displayed tax is derived by subtraction, so the sum is
        // exact to the cent (no floating-point drift here because we use
        // round-then-subtract, not multiply).
        expect(r.displayedSubtotal + r.displayedTax).toBeCloseTo(t, 2);
        expect(r.displayedTotal).toBe(t);
        // 2-decimal precision on the decomposed values. We check via
        // `toBeCloseTo` because `displayedX * 100` can have a tiny
        // floating-point drift (e.g. 562.68 * 100 = 56267.99999999999).
        expect(r.displayedSubtotal).toBeCloseTo(Math.round(r.displayedSubtotal * 100) / 100, 10);
        expect(r.displayedTax).toBeCloseTo(Math.round(r.displayedTax * 100) / 100, 10);
      }
    });

    it("handles the empty-cart edge case (T = 0)", () => {
      const r = applyFakePpnDisplay(0, 0.11, true);
      expect(r.displayedSubtotal).toBe(0);
      expect(r.displayedTax).toBe(0);
      expect(r.displayedTotal).toBe(0);
    });

    it("respects a non-default tax rate (12%)", () => {
      const r = applyFakePpnDisplay(20000, 0.12, true);
      // 20000 / 1.12 = 17857.142857... -> 17857.14 (round-half-up via Math.round).
      expect(r.displayedSubtotal).toBe(17857.14);
      expect(r.displayedTax).toBe(2142.86);
      expect(r.displayedSubtotal + r.displayedTax).toBe(20000);
      expect(r.displayedTotal).toBe(20000);
    });

    it("does not mutate the input total", () => {
      const total = 20000;
      const snapshot = total;
      applyFakePpnDisplay(total, 0.11, true);
      expect(total).toBe(snapshot);
    });
  });

  describe("default tax rate", () => {
    it("defaults to 0.11 when omitted", () => {
      // Should match the explicit 0.11 case for T = 20000.
      const r = applyFakePpnDisplay(20000, undefined, true);
      expect(r.displayedSubtotal).toBe(18018.02);
      expect(r.displayedTax).toBe(1981.98);
      expect(r.displayedTotal).toBe(20000);
    });
  });
});
