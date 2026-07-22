// Unit tests for the Indonesian number-to-words converter (terbilang).
// Pure function, no DB dependency, runs in any env.
//
// Covers:
//   - the canonical bug: 17800000 must read "Tujuh belas juta..." not
//     "Tujuh juta..." (the "belas" was being dropped for the 11-19 range)
//   - all teen (11-19) values inside every scale (ribu / juta / bare)
//   - 10 and 20 boundaries
//   - seribu / seratus special forms
//   - the full 9-digit example from the file header

import { describe, it, expect } from "vite-plus/test";
import { terbilang } from "../app/utils/terbilang";

describe("terbilang", () => {
  it("converts 0", () => {
    expect(terbilang(0)).toBe("nol");
  });

  it("keeps the 'belas' suffix for the teen range (regression)", () => {
    // The original bug: 17 -> "tujuh" instead of "tujuh belas".
    expect(terbilang(17)).toBe("Tujuh belas");
    expect(terbilang(11)).toBe("Sebelas");
    expect(terbilang(12)).toBe("Dua belas");
    expect(terbilang(19)).toBe("Sembilan belas");
  });

  it("handles the reported 17800000 case", () => {
    expect(terbilang(17800000)).toBe("Tujuh belas juta delapan ratus ribu");
  });

  it("handles teens inside the millions scale", () => {
    expect(terbilang(17000000)).toBe("Tujuh belas juta");
    expect(terbilang(1900000)).toBe("Satu juta sembilan ratus ribu");
  });

  it("handles teens inside the thousands scale", () => {
    expect(terbilang(12000)).toBe("Dua belas ribu");
    expect(terbilang(21000)).toBe("Dua puluh satu ribu");
  });

  it("treats 10 and 20 as boundaries correctly", () => {
    expect(terbilang(10)).toBe("Sepuluh");
    expect(terbilang(20)).toBe("Dua puluh");
    expect(terbilang(21)).toBe("Dua puluh satu");
  });

  it("uses seribu / seratus special forms", () => {
    expect(terbilang(1000)).toBe("Seribu");
    expect(terbilang(100)).toBe("Seratus");
    // The 1xx range must be "seratus", not "satu ratus".
    expect(terbilang(115)).toBe("Seratus lima belas");
    expect(terbilang(199)).toBe("Seratus sembilan puluh sembilan");
    expect(terbilang(101)).toBe("Seratus satu");
  });

  it("matches the full 9-digit header example", () => {
    expect(terbilang(123456789)).toBe(
      "Seratus dua puluh tiga juta empat ratus lima puluh enam ribu tujuh ratus delapan puluh sembilan",
    );
  });

  it("handles negative numbers with consistent capitalization", () => {
    expect(terbilang(-500)).toBe("Minus Lima ratus");
  });
});
