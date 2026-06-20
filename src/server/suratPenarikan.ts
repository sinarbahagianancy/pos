import { client, db } from "../db";
import { suratPenarikan, suratPenarikanItems, auditLogs } from "../db/schema";
import { eq, sql, desc, or, ilike, inArray } from "drizzle-orm";
import { validateCreateSuratPenarikanInput } from "../../app/schemas/document.schema";
import type { SuratPenarikan, SuratPenarikanItem, PenarikanReason } from "../../app/types";

// ============================================================
// Types
// ============================================================

export interface PaginatedSuratPenarikanResult {
  suratPenarikan: SuratPenarikan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// Parsers
// ============================================================

// ============================================================
// Parsers
//
// These parsers see rows from two different sources:
//   - raw SQL via `client.unsafe(...)` / `tx.unsafe(...)`  → snake_case keys
//   - Drizzle via `db.select().from(...)`                   → camelCase keys
// `pick()` falls back from snake_case to camelCase so the same parser works
// for both code paths. New callers should prefer the typed Drizzle column
// reference over `pick()`, but the existing raw-SQL callers (create flows)
// rely on this fallback.
// ============================================================
const pick = <T = unknown>(row: Record<string, unknown>, snake: string, camel: string): T => {
  const v = row[snake] ?? row[camel];
  return v === undefined ? (undefined as unknown as T) : (v as T);
};

// Drizzle's typed `db.select().from(table)` returns timestamps as `Date`,
// while raw SQL via `db.execute()` / `client.unsafe()` / `tx.unsafe()` returns
// them as ISO-ish strings (postgres-js default). Normalise both to ISO.
const toIso = (v: unknown): string => {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
};

const parseDbSuratPenarikanItem = (row: Record<string, unknown>): SuratPenarikanItem => ({
  id: pick(row, "id", "id"),
  suratPenarikanId: pick(row, "surat_penarikan_id", "suratPenarikanId"),
  productId: pick(row, "product_id", "productId"),
  brand: pick(row, "brand", "brand"),
  model: pick(row, "model", "model"),
  sn: pick(row, "sn", "sn"),
  quantity: pick(row, "quantity", "quantity"),
  isManual: pick(row, "is_manual", "isManual"),
});

const parseDbSuratPenarikan = (
  row: Record<string, unknown>,
  items: SuratPenarikanItem[] = [],
): SuratPenarikan => ({
  id: pick(row, "id", "id"),
  recipient: pick(row, "recipient", "recipient"),
  reason: pick(row, "reason", "reason"),
  alasanLainnya: pick(row, "alasan_lainnya", "alasanLainnya"),
  customerName: (pick(row, "customer_name", "customerName") ?? "") as string,
  poNumber: (pick(row, "po_number", "poNumber") ?? "") as string,
  notes: pick(row, "notes", "notes"),
  staffName: pick(row, "staff_name", "staffName"),
  items,
  createdAt: toIso(pick(row, "created_at", "createdAt")),
});

// ============================================================
// Allocate next Surat Penarikan ID (per-day counter)
// ============================================================
const allocateSuratPenarikanId = async (tx: any): Promise<string> => {
  const result = await tx.unsafe(
    `INSERT INTO surat_penarikan_counters (date, last_number) VALUES (CURRENT_DATE, 1)
     ON CONFLICT (date) DO UPDATE SET last_number = surat_penarikan_counters.last_number + 1
     RETURNING last_number`,
  );
  const seq = (result[0] as any).last_number;
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `SPB/${dd}/${mm}/${yyyy}-${String(seq).padStart(3, "0")}`;
};

// ============================================================
// Handlers
// ============================================================

export const createSuratPenarikanHandler = async (raw: unknown): Promise<SuratPenarikan> => {
  const data = validateCreateSuratPenarikanInput(raw);

  return await client.begin(async (tx) => {
    // Allocate ID
    const spbId = await allocateSuratPenarikanId(tx);

    // Insert header
    await tx.unsafe(
      `INSERT INTO surat_penarikan (id, recipient, reason, alasan_lainnya, customer_name, po_number, notes, staff_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        spbId,
        data.recipient,
        data.reason,
        data.alasanLainnya || null,
        data.customerName || "",
        data.poNumber || "",
        data.notes || null,
        data.staffName,
      ],
    );

    // Insert items, deduct stock (capped at available), mark SNs Damaged.
    // Manual rows (free-text items not in the catalog) are inserted with
    // product_id NULL, is_manual = true, and skip the stock/SN side-effects
    // entirely — they're pure record-keeping lines.
    const reasonLabel =
      data.reason === "Lainnya" && data.alasanLainnya
        ? `Lainnya: ${data.alasanLainnya}`
        : data.reason;

    for (const item of data.items) {
      const isManual = item.isManual === true;

      if (isManual) {
        // Manual row: no product lookup, no stock deduction, no SN status
        // change. Just record the free-text line as-is.
        await tx.unsafe(
          `INSERT INTO surat_penarikan_items (surat_penarikan_id, product_id, brand, model, sn, quantity, is_manual)
           VALUES ($1, NULL, $2, $3, '', 1, true)`,
          [spbId, item.brand || null, item.model],
        );
        await tx.unsafe(
          `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            data.staffName,
            "Sales Deduction",
            `Penarikan (manual): 1 unit of "${item.model}" by ${data.recipient}, reason: ${reasonLabel}`,
            null,
          ],
        );
        continue;
      }

      // Catalog branch — validator guarantees productId is set for
      // non-manual rows, so the `!` is safe.
      const productId = item.productId!;
      const requestedQty = item.quantity ?? 1;
      // Look up current stock with lock
      const [product] = await tx.unsafe(
        "SELECT stock, model FROM products WHERE id = $1 FOR UPDATE",
        [productId],
      );
      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }
      const available = Number((product as any).stock);
      const actualQty = Math.min(requestedQty, available);
      const shortfall = requestedQty - actualQty;

      // Look up brand if not provided
      let brand = item.brand;
      if (!brand) {
        const [prodBrand] = await tx.unsafe("SELECT brand FROM products WHERE id = $1", [
          productId,
        ]);
        brand = (prodBrand as any)?.brand;
      }

      // For SN items with shortage, only deduct up to available (skip non-existent SNs)
      let sn = item.sn || "";
      if (sn && !sn.startsWith("NOSN-")) {
        const [snRow] = await tx.unsafe(
          "SELECT status FROM serial_numbers WHERE sn = $1 FOR UPDATE",
          [sn],
        );
        if (!snRow || (snRow as any).status !== "In Stock") {
          // SN not available; this item can't be deducted. Skip.
          sn = "";
        } else {
          // Mark SN as Damaged (it left inventory as a write-off)
          await tx.unsafe("UPDATE serial_numbers SET status = 'Damaged' WHERE sn = $1", [sn]);
        }
      }

      // Insert line item (record the actual quantity deducted, not the requested)
      await tx.unsafe(
        `INSERT INTO surat_penarikan_items (surat_penarikan_id, product_id, brand, model, sn, quantity, is_manual)
         VALUES ($1, $2, $3, $4, $5, $6, false)`,
        [spbId, productId, brand || null, item.model, sn, actualQty],
      );

      // Deduct stock (up to available)
      if (actualQty > 0) {
        await tx.unsafe(
          "UPDATE products SET stock = GREATEST(stock - $1, 0), updated_at = NOW() WHERE id = $2",
          [actualQty, productId],
        );
      }

      // Per-item audit log
      const snLabel = !sn || sn.startsWith("NOSN-") ? "tanpa SN" : `SN: ${sn}`;
      const detailShort =
        shortfall > 0 ? ` (capped: requested ${requestedQty}, available ${available})` : "";
      await tx.unsafe(
        `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          data.staffName,
          "Sales Deduction",
          `Penarikan: ${actualQty} unit(s) of ${item.model} (${snLabel}) by ${data.recipient}, reason: ${reasonLabel}${detailShort}`,
          productId,
        ],
      );
    }

    // Summary audit log
    await tx.unsafe(
      `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        data.staffName,
        "Surat Penarikan Created",
        `SPB ${spbId} — ${data.items.length} item(s), Penarik: ${data.recipient}, Alasan: ${reasonLabel}`,
        spbId,
      ],
    );

    // Fetch and return
    const [header] = await tx.unsafe("SELECT * FROM surat_penarikan WHERE id = $1", [spbId]);
    const items = await tx.unsafe(
      "SELECT * FROM surat_penarikan_items WHERE surat_penarikan_id = $1 ORDER BY id",
      [spbId],
    );
    return parseDbSuratPenarikan(
      header as Record<string, unknown>,
      items.map((r) => parseDbSuratPenarikanItem(r as Record<string, unknown>)),
    );
  });
};

export const getSuratPenarikanByIdHandler = async (id: string): Promise<SuratPenarikan | null> => {
  const [header] = await db.select().from(suratPenarikan).where(eq(suratPenarikan.id, id));
  if (!header) return null;
  const items = await db
    .select()
    .from(suratPenarikanItems)
    .where(eq(suratPenarikanItems.suratPenarikanId, id));
  return parseDbSuratPenarikan(
    header as unknown as Record<string, unknown>,
    items.map((i) => parseDbSuratPenarikanItem(i as unknown as Record<string, unknown>)),
  );
};

export const getAllSuratPenarikanHandler = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
): Promise<PaginatedSuratPenarikanResult> => {
  const offset = (page - 1) * limit;

  const whereClause = search
    ? or(ilike(suratPenarikan.id, `%${search}%`), ilike(suratPenarikan.recipient, `%${search}%`))
    : undefined;

  const rows = await db
    .select()
    .from(suratPenarikan)
    .where(whereClause)
    .orderBy(desc(suratPenarikan.createdAt))
    .limit(limit)
    .offset(offset);

  const countQuery = whereClause
    ? db
        .select({ count: sql<number>`count(*)` })
        .from(suratPenarikan)
        .where(whereClause)
    : db.select({ count: sql<number>`count(*)` }).from(suratPenarikan);
  const countResult = await countQuery;
  const total = Number(countResult[0]?.count) || 0;

  const spbIds = rows.map((r) => r.id);
  let items: SuratPenarikanItem[] = [];
  if (spbIds.length > 0) {
    const itemsRaw = await db
      .select()
      .from(suratPenarikanItems)
      .where(inArray(suratPenarikanItems.suratPenarikanId, spbIds))
      .orderBy(suratPenarikanItems.id);
    items = itemsRaw.map((i) => parseDbSuratPenarikanItem(i as unknown as Record<string, unknown>));
  }
  const itemsBySpb = new Map<string, SuratPenarikanItem[]>();
  for (const it of items) {
    if (!itemsBySpb.has(it.suratPenarikanId)) itemsBySpb.set(it.suratPenarikanId, []);
    itemsBySpb.get(it.suratPenarikanId)!.push(it);
  }

  return {
    suratPenarikan: rows.map((r) =>
      parseDbSuratPenarikan(r as unknown as Record<string, unknown>, itemsBySpb.get(r.id) || []),
    ),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
