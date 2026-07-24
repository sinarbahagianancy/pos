import Fuse from "fuse.js";

// Shared threshold with the client-side fuzzy search (app/utils/fuzzy.ts) so
// behaviour is identical everywhere.
export const FUZZY_THRESHOLD = 0.3;

/**
 * Rank/filter `items` by a typo-tolerant fuzzy match over `keys`.
 *
 * Used server-side in place of SQL `ILIKE`/`pg_trgm` so search works on any
 * Postgres (including managed ones like Supabase where `pg_trgm`'s `%` operator
 * is a poor fit for short-query-vs-long-field matching and can't always be
 * enabled). Fetches candidates in SQL, then ranks them here.
 */
export function fuzzyRank<T>(items: T[], keys: string[], query: string): T[] {
  const q = query.trim();
  if (!q) return items;
  const fuse = new Fuse(items, {
    keys,
    threshold: FUZZY_THRESHOLD,
    ignoreLocation: true,
    minMatchCharLength: 1,
  });
  return fuse.search(q).map((r) => r.item);
}
