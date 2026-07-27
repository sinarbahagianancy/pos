// Regression test for the SNPickerModal crash:
//   TypeError: Cannot read properties of undefined (reading 'forEach')
//   at makeFuse (fuzzy.ts) -> new Fuse(...)
//
// makeFuse() is documented to be called WITHOUT `keys` for arrays of
// plain strings (e.g. serial numbers). SNPickerModal does exactly that:
//   makeFuse(visibleSNs)  // no keys arg
//
// The original implementation passed `keys: undefined` explicitly, which
// spread OVER Fuse's default `keys: []` and replaced it with `undefined`.
// Fuse then builds a KeyStore on `undefined` and calls
// `undefined.forEach(...)`, throwing the error above. Every keyed caller
// (SearchableCombobox, POS, Suppliers, ...) passed keys and never hit it.

import { describe, it, expect } from "vite-plus/test";
import { makeFuse, fuzzyRanked } from "../app/utils/fuzzy";

describe("makeFuse without keys (plain string arrays)", () => {
  it("builds a Fuse instance for an array of strings without throwing", () => {
    // This is the exact call shape used by SNPickerModal.
    expect(() => makeFuse(["SN001", "SN002", "SN003"])).not.toThrow();
  });

  it("ranks string-array docs by query", () => {
    const fuse = makeFuse(["SN001", "SN002", "SN003"]);
    const ranked = fuzzyRanked(fuse, "SN002");
    expect(ranked).toContain("SN002");
    expect(ranked.length).toBeGreaterThan(0);
  });

  it("handles an empty array", () => {
    expect(() => makeFuse([])).not.toThrow();
    expect(fuzzyRanked(makeFuse([]), "x")).toEqual([]);
  });
});
