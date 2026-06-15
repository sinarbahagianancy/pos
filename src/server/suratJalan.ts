import { client, db } from "../db";
import { suratJalan, suratJalanItems, auditLogs } from "../db/schema";
import { eq, sql, desc, or, ilike, inArray } from "drizzle-orm";
import { validateCreateSuratJalanInput } from "../../app/schemas/document.schema";
import type { SuratJalan, SuratJalanItem } from "../../app/types";

// ============================================================
// Types
// ============================================================

export interface PaginatedSuratJalanResult {
  suratJalan: SuratJalan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

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

const parseDbSuratJalanItem = (row: Record<string, unknown>): SuratJalanItem => ({
  id: pick(row, "id", "id"),
  suratJalanId: pick(row, "surat_jalan_id", "suratJalanId"),
  productId: pick(row, "product_id", "productId"),
  brand: pick(row, "brand", "brand"),
  model: pick(row, "model", "model"),
  sn: pick(row, "sn", "sn"),
  quantity: pick(row, "quantity", "quantity"),
});

const parseDbSuratJalan = (
  row: Record<string, unknown>,
  items: SuratJalanItem[] = [],
): SuratJalan => ({
  id: pick(row, "id", "id"),
  customerId: pick(row, "customer_id", "customerId"),
  customerName: pick(row, "customer_name", "customerName"),
  poNumber: (pick(row, "po_number", "poNumber") ?? "") as string,
  notes: pick(row, "notes", "notes"),
  staffName: pick(row, "staff_name", "staffName"),
  items,
  createdAt: toIso(pick(row, "created_at", "createdAt")),
});

// ============================================================
// Allocate next Surat Jalan ID (per-day counter)
// ============================================================
const allocateSuratJalanId = async (tx: any): Promise<string> => {
  const result = await tx.unsafe(
    `INSERT INTO surat_jalan_counters (date, last_number) VALUES (CURRENT_DATE, 1)
     ON CONFLICT (date) DO UPDATE SET last_number = surat_jalan_counters.last_number + 1
     RETURNING last_number`,
  );
  const seq = (result[0] as any).last_number;
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `SJ/${dd}/${mm}/${yyyy}-${String(seq).padStart(3, "0")}`;
};

// ============================================================
// Handlers
// ============================================================

export const createSuratJalanHandler = async (raw: unknown): Promise<SuratJalan> => {
  const data = validateCreateSuratJalanInput(raw);

  return await client.begin(async (tx) => {
    // If customerId is provided, verify it exists (and link address/NPWP at PDF time)
    if (data.customerId) {
      const [c] = await tx.unsafe("SELECT id FROM customers WHERE id = $1", [data.customerId]);
      if (!c) throw new Error(`Customer ${data.customerId} not found`);
    }

    // Pre-flight: stock check per product (aggregated by productId for safety)
    const productQuantities = new Map<string, number>();
    for (const item of data.items) {
      const qty = item.quantity ?? 1;
      productQuantities.set(item.productId, (productQuantities.get(item.productId) || 0) + qty);
    }
    for (const [productId, quantity] of productQuantities) {
      const [product] = await tx.unsafe(
        "SELECT stock, model FROM products WHERE id = $1 FOR UPDATE",
        [productId],
      );
      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }
      if (Number(product.stock) < quantity) {
        throw new Error(
          `Insufficient stock for ${(product as any).model}: need ${quantity}, have ${product.stock}`,
        );
      }
    }

    // Pre-flight: SN availability for SN items
    for (const item of data.items) {
      if (item.sn && !item.sn.startsWith("NOSN-")) {
        const [snRow] = await tx.unsafe(
          "SELECT status FROM serial_numbers WHERE sn = $1 FOR UPDATE",
          [item.sn],
        );
        if (!snRow || (snRow as any).status !== "In Stock") {
          throw new Error(
            `Serial number ${item.sn} is not available (status: ${(snRow as any)?.status || "not found"})`,
          );
        }
      }
    }

    // Allocate ID
    const sjId = await allocateSuratJalanId(tx);

    // Insert header
    await tx.unsafe(
      `INSERT INTO surat_jalan (id, customer_id, customer_name, po_number, notes, staff_name)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sjId,
        data.customerId || null,
        data.customerName,
        data.poNumber,
        data.notes || null,
        data.staffName,
      ],
    );

    // Insert items, deduct stock, mark SNs Sold
    for (const item of data.items) {
      const qty = item.quantity ?? 1;
      let brand = item.brand;
      if (!brand) {
        const [product] = await tx.unsafe("SELECT brand FROM products WHERE id = $1", [
          item.productId,
        ]);
        brand = (product as any)?.brand;
      }
      await tx.unsafe(
        `INSERT INTO surat_jalan_items (surat_jalan_id, product_id, brand, model, sn, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sjId, item.productId, brand || null, item.model, item.sn || "", qty],
      );

      // Deduct stock
      await tx.unsafe(
        "UPDATE products SET stock = GREATEST(stock - $1, 0), updated_at = NOW() WHERE id = $2",
        [qty, item.productId],
      );

      // Mark SN as Sold
      if (item.sn && !item.sn.startsWith("NOSN-")) {
        await tx.unsafe("UPDATE serial_numbers SET status = 'Sold' WHERE sn = $1", [item.sn]);
      }

      // Per-item audit log
      const snLabel = !item.sn || item.sn.startsWith("NOSN-") ? "tanpa SN" : `SN: ${item.sn}`;
      await tx.unsafe(
        `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          data.staffName,
          "Sales Deduction",
          `Delivered via SJ ${sjId}: ${qty} unit(s) of ${item.model} (${snLabel}) to ${data.customerName}`,
          item.productId,
        ],
      );
    }

    // Summary audit log
    await tx.unsafe(
      `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        data.staffName,
        "Surat Jalan Created",
        `SJ ${sjId} — ${data.items.length} item(s), Customer: ${data.customerName}, PO: ${data.poNumber}`,
        sjId,
      ],
    );

    // Fetch and return
    const [header] = await tx.unsafe("SELECT * FROM surat_jalan WHERE id = $1", [sjId]);
    const items = await tx.unsafe(
      "SELECT * FROM surat_jalan_items WHERE surat_jalan_id = $1 ORDER BY id",
      [sjId],
    );
    return parseDbSuratJalan(
      header as Record<string, unknown>,
      items.map((r) => parseDbSuratJalanItem(r as Record<string, unknown>)),
    );
  });
};

export const getSuratJalanByIdHandler = async (id: string): Promise<SuratJalan | null> => {
  const [header] = await db.select().from(suratJalan).where(eq(suratJalan.id, id));
  if (!header) return null;
  const items = await db.select().from(suratJalanItems).where(eq(suratJalanItems.suratJalanId, id));
  return parseDbSuratJalan(
    header as unknown as Record<string, unknown>,
    items.map((i) => parseDbSuratJalanItem(i as unknown as Record<string, unknown>)),
  );
};

export const getAllSuratJalanHandler = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
): Promise<PaginatedSuratJalanResult> => {
  const offset = (page - 1) * limit;

  const whereClause = search
    ? or(
        ilike(suratJalan.id, `%${search}%`),
        ilike(suratJalan.customerName, `%${search}%`),
        ilike(suratJalan.poNumber, `%${search}%`),
      )
    : undefined;

  const rows = await db
    .select()
    .from(suratJalan)
    .where(whereClause)
    .orderBy(desc(suratJalan.createdAt))
    .limit(limit)
    .offset(offset);

  const countQuery = whereClause
    ? db
        .select({ count: sql<number>`count(*)` })
        .from(suratJalan)
        .where(whereClause)
    : db.select({ count: sql<number>`count(*)` }).from(suratJalan);
  const countResult = await countQuery;
  const total = Number(countResult[0]?.count) || 0;

  // Fetch all items for these suratJalans in one query
  const sjIds = rows.map((r) => r.id);
  let items: SuratJalanItem[] = [];
  if (sjIds.length > 0) {
    const itemsRaw = await db
      .select()
      .from(suratJalanItems)
      .where(inArray(suratJalanItems.suratJalanId, sjIds))
      .orderBy(suratJalanItems.id);
    items = itemsRaw.map((i) => parseDbSuratJalanItem(i as unknown as Record<string, unknown>));
  }
  const itemsBySj = new Map<string, SuratJalanItem[]>();
  for (const it of items) {
    if (!itemsBySj.has(it.suratJalanId)) itemsBySj.set(it.suratJalanId, []);
    itemsBySj.get(it.suratJalanId)!.push(it);
  }

  return {
    suratJalan: rows.map((r) =>
      parseDbSuratJalan(r as unknown as Record<string, unknown>, itemsBySj.get(r.id) || []),
    ),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
