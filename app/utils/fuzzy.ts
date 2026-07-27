import Fuse from "fuse.js";

/**
 * Shared client-side fuzzy-search config (ADR 0008). Typo-tolerant and
 * ranked by score. The threshold mirrors the server-side `pg_trgm`
 * similarity threshold (0.3) so behavior is consistent across surfaces.
 */
export const FUZZY_THRESHOLD = 0.3;

/**
 * Build a memoizable Fuse instance. Pass `keys` for object arrays; omit
 * for arrays of plain strings (e.g. serial numbers, SN pairs).
 */
export function makeFuse<T>(items: T[], keys?: string[]): Fuse<T> {
  // IMPORTANT: only pass `keys` when it is provided. Passing
  // `keys: undefined` explicitly OVERWRITES Fuse's own default
  // `keys: []`, leaving Fuse to build a KeyStore on `undefined`
  // (`undefined.forEach(...)`) and throw. For plain-string arrays
  // (e.g. serial numbers) callers omit `keys`; we must let Fuse's
  // default empty-array keys apply so it treats each item as a string.
  return new Fuse<T>(items, {
    ...(keys ? { keys } : {}),
    threshold: FUZZY_THRESHOLD,
    ignoreLocation: true,
    minMatchCharLength: 1,
  });
}

/**
 * Return `items` ranked by fuzzy score for `query`. Callers return the
 * unfiltered list themselves when the query is empty (preserving the
 * original ordering).
 */
export function fuzzyRanked<T>(fuse: Fuse<T>, query: string): T[] {
  return fuse.search(query.trim()).map((r) => r.item);
}
