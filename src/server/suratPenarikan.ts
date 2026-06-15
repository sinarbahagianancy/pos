import { client, db } from "../db";
import { suratPenarikan, suratPenarikanItems, auditLogs } from "../db/schema";
import { eq, sql, desc, or, ilike } from "drizzle-orm";
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

const parseDbSuratPenarikanItem = (row: Record<string, unknown>): SuratPenarikanItem => ({
  id: row.id as string,
  suratPenarikanId: row.surat_penarikan_id as string,
  productId: row.product_id as string,
  brand: (row.brand as string | undefined) ?? undefined,
  model: row.model as string,
  sn: row.sn as string,
  quantity: row.quantity as number,
});

const parseDbSuratPenarikan = (
  row: Record<string, unknown>,
  items: SuratPenarikanItem[] = [],
): SuratPenarikan => ({
  id: row.id as string,
  recipient: row.recipient as string,
  reason: row.reason as PenarikanReason,
  alasanLainnya: (row.alasan_lainnya as string | undefined) ?? undefined,
  notes: (row.notes as string | undefined) ?? undefined,
  staffName: row.staff_name as string,
  items,
  createdAt: (row.created_at as Date | null)?.toISOString() ?? new Date().toISOString(),
});

// ============================================================
// Allocate next Surat Penarikan ID (per-day counter)
// ============================================================
const allocateSuratPenarikanId = async (tx: typeof client): Promise<string> => {
  const result = await tx.unsafe(
    `INSERT INTO surat_penarikan_counters (date, last_number) VALUES (CURRENT_DATE, 1)
     ON CONFLICT (date) DO UPDATE SET last_number = surat_penarikan_counters.last_number + 1
     RETURNING last_number`,
  );
  const seq = (result[0] as { last_number: number }).last_number;
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
      `INSERT INTO surat_penarikan (id, recipient, reason, alasan_lainnya, notes, staff_name)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        spbId,
        data.recipient,
        data.reason,
        data.alasanLainnya || null,
        data.notes || null,
        data.staffName,
      ],
    );

    // Insert items, deduct stock (capped at available), mark SNs Damaged
    const reasonLabel =
      data.reason === "Lainnya" && data.alasanLainnya
        ? `Lainnya: ${data.alasanLainnya}`
        : data.reason;

    for (const item of data.items) {
      const requestedQty = item.quantity ?? 1;
      // Look up current stock with lock
      const [product] = await tx.unsafe(
        "SELECT stock, model FROM products WHERE id = $1 FOR UPDATE",
        [item.productId],
      );
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      const available = Number((product as { stock: number }).stock);
      const actualQty = Math.min(requestedQty, available);
      const shortfall = requestedQty - actualQty;

      // Look up brand if not provided
      let brand = item.brand;
      if (!brand) {
        const [prodBrand] = await tx.unsafe("SELECT brand FROM products WHERE id = $1", [
          item.productId,
        ]);
        brand = (prodBrand as { brand?: string } | undefined)?.brand;
      }

      // For SN items with shortage, only deduct up to available (skip non-existent SNs)
      let sn = item.sn || "";
      if (sn && !sn.startsWith("NOSN-")) {
        const [snRow] = await tx.unsafe(
          "SELECT status FROM serial_numbers WHERE sn = $1 FOR UPDATE",
          [sn],
        );
        if (!snRow || (snRow as { status: string }).status !== "In Stock") {
          // SN not available; this item can't be deducted. Skip.
          sn = "";
        } else {
          // Mark SN as Damaged (it left inventory as a write-off)
          await tx.unsafe("UPDATE serial_numbers SET status = 'Damaged' WHERE sn = $1", [sn]);
        }
      }

      // Insert line item (record the actual quantity deducted, not the requested)
      await tx.unsafe(
        `INSERT INTO surat_penarikan_items (surat_penarikan_id, product_id, brand, model, sn, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [spbId, item.productId, brand || null, item.model, sn, actualQty],
      );

      // Deduct stock (up to available)
      if (actualQty > 0) {
        await tx.unsafe(
          "UPDATE products SET stock = GREATEST(stock - $1, 0), updated_at = NOW() WHERE id = $2",
          [actualQty, item.productId],
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
      .where(sql`${suratPenarikanItems.suratPenarikanId} = ANY(${spbIds})`)
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
