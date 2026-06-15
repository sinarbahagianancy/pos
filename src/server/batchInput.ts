import { client, db } from "../db";
import { batchInputs, batchInputItems, products, serialNumbers, auditLogs } from "../db/schema";
import { eq, sql, desc, or, ilike } from "drizzle-orm";
import { validateCreateBatchInputInput } from "../../app/schemas/document.schema";
import type { BatchInput, BatchInputItem } from "../../app/types";

// ============================================================
// Types
// ============================================================

export interface PaginatedBatchInputResult {
  batchInputs: BatchInput[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// Parsers
// ============================================================

const parseDbBatchInputItem = (row: Record<string, unknown>): BatchInputItem => {
  const snsRaw = row.sns as string;
  let sns: string[] = [];
  try {
    sns = JSON.parse(snsRaw);
  } catch {
    sns = [];
  }
  return {
    id: row.id as string,
    batchInputId: row.batch_input_id as string,
    productId: row.product_id as string,
    brand: (row.brand as string | undefined) ?? undefined,
    model: row.model as string,
    quantity: row.quantity as number,
    sns,
    cogs: typeof row.cogs === "string" ? parseFloat(row.cogs) : (row.cogs as number),
    price: typeof row.price === "string" ? parseFloat(row.price) : (row.price as number),
  };
};

const parseDbBatchInput = (
  row: Record<string, unknown>,
  items: BatchInputItem[] = [],
): BatchInput => ({
  id: row.id as string,
  supplier: row.supplier as string,
  date: (row.date as Date | null)?.toISOString() ?? new Date().toISOString(),
  notes: (row.notes as string | undefined) ?? undefined,
  staffName: row.staff_name as string,
  items,
  createdAt: (row.created_at as Date | null)?.toISOString() ?? new Date().toISOString(),
});

// ============================================================
// Handlers
// ============================================================

export const createBatchInputHandler = async (raw: unknown): Promise<BatchInput> => {
  const data = validateCreateBatchInputInput(raw);

  return await client.begin(async (tx) => {
    // Check for duplicate supplier invoice (id is the supplier invoice number)
    const [existing] = await tx.unsafe("SELECT id FROM batch_inputs WHERE id = $1", [data.id]);
    if (existing) {
      throw new Error(`Batch with supplier invoice '${data.id}' already exists`);
    }

    // Insert header
    await tx.unsafe(
      `INSERT INTO batch_inputs (id, supplier, date, notes, staff_name)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        data.id,
        data.supplier,
        data.date ? new Date(data.date) : new Date(),
        data.notes || null,
        data.staffName,
      ],
    );

    // For each item:
    //  - For SN items: validate SNs not already in DB, insert into serial_numbers,
    //    append to product's restock history, increment product stock
    //  - For non-SN items: increment product stock, append to product's restock history
    //  - Also update product's cogs/price to the new values
    for (const item of data.items) {
      // Verify product exists
      const [product] = await tx.unsafe(
        "SELECT id, model, has_serial_number, invoice_number FROM products WHERE id = $1 FOR UPDATE",
        [item.productId],
      );
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      const hasSerialNumber = (product as { has_serial_number: boolean }).has_serial_number;

      // Validate SNs for SN products
      if (hasSerialNumber) {
        if (item.sns.length !== item.quantity) {
          throw new Error(
            `SN count mismatch for ${item.model}: need ${item.quantity} SNs, got ${item.sns.length}`,
          );
        }
        // Check duplicates within the batch
        const seen = new Set<string>();
        for (const sn of item.sns) {
          if (seen.has(sn)) {
            throw new Error(`Duplicate SN '${sn}' in batch for ${item.model}`);
          }
          seen.add(sn);
        }
        // Check SNs don't already exist
        for (const sn of item.sns) {
          const [existingSn] = await tx.unsafe("SELECT sn FROM serial_numbers WHERE sn = $1", [sn]);
          if (existingSn) {
            throw new Error(`SN '${sn}' already exists in inventory`);
          }
        }
        // Insert new serial numbers
        for (const sn of item.sns) {
          await tx.unsafe(
            `INSERT INTO serial_numbers (sn, product_id, status) VALUES ($1, $2, 'In Stock')`,
            [sn, item.productId],
          );
        }
      }

      // Look up brand if not provided
      let brand = item.brand;
      if (!brand) {
        brand = (product as { brand?: string }).brand;
      }

      // Insert batch_input_item
      await tx.unsafe(
        `INSERT INTO batch_input_items (batch_input_id, product_id, brand, model, quantity, sns, cogs, price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          data.id,
          item.productId,
          brand || null,
          item.model,
          item.quantity,
          JSON.stringify(item.sns),
          String(item.cogs),
          String(item.price),
        ],
      );

      // Update product: stock, cogs, price, supplier, date_restocked, invoice_number (restock history)
      const existingInvoice = (product as { invoice_number: string | null }).invoice_number;
      let restockHistory: Array<{ sn: string[]; inv: string; timestamp: string }> = [];
      if (existingInvoice) {
        try {
          restockHistory = JSON.parse(existingInvoice);
        } catch {
          restockHistory = [];
        }
      }
      restockHistory.push({
        sn: item.sns,
        inv: data.id,
        timestamp: new Date().toISOString(),
      });

      await tx.unsafe(
        `UPDATE products
         SET stock = stock + $1,
             cogs = $2,
             price = $3,
             supplier = $4,
             date_restocked = $5,
             invoice_number = $6,
             updated_at = NOW()
         WHERE id = $7`,
        [
          item.quantity,
          String(item.cogs),
          String(item.price),
          data.supplier,
          data.date ? new Date(data.date) : new Date(),
          JSON.stringify(restockHistory),
          item.productId,
        ],
      );

      // Per-item audit log
      const snDetail = item.sns.length > 0 ? ` SN: ${item.sns.join(", ")}` : "";
      await tx.unsafe(
        `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          data.staffName,
          "Stock Addition",
          `Added ${item.quantity} unit(s) of ${item.model} from supplier ${data.supplier}, invoice: ${data.id}.${snDetail}`,
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
        "Batch Input Created",
        `BI ${data.id} — ${data.items.length} item(s) from ${data.supplier}`,
        data.id,
      ],
    );

    // Fetch and return
    const [header] = await tx.unsafe("SELECT * FROM batch_inputs WHERE id = $1", [data.id]);
    const items = await tx.unsafe(
      "SELECT * FROM batch_input_items WHERE batch_input_id = $1 ORDER BY id",
      [data.id],
    );
    return parseDbBatchInput(
      header as Record<string, unknown>,
      items.map((r) => parseDbBatchInputItem(r as Record<string, unknown>)),
    );
  });
};

export const getBatchInputByIdHandler = async (id: string): Promise<BatchInput | null> => {
  const [header] = await db.select().from(batchInputs).where(eq(batchInputs.id, id));
  if (!header) return null;
  const items = await db.select().from(batchInputItems).where(eq(batchInputItems.batchInputId, id));
  return parseDbBatchInput(
    header as unknown as Record<string, unknown>,
    items.map((i) => parseDbBatchInputItem(i as unknown as Record<string, unknown>)),
  );
};

export const getAllBatchInputHandler = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
): Promise<PaginatedBatchInputResult> => {
  const offset = (page - 1) * limit;

  const whereClause = search
    ? or(ilike(batchInputs.id, `%${search}%`), ilike(batchInputs.supplier, `%${search}%`))
    : undefined;

  const rows = await db
    .select()
    .from(batchInputs)
    .where(whereClause)
    .orderBy(desc(batchInputs.createdAt))
    .limit(limit)
    .offset(offset);

  const countQuery = whereClause
    ? db
        .select({ count: sql<number>`count(*)` })
        .from(batchInputs)
        .where(whereClause)
    : db.select({ count: sql<number>`count(*)` }).from(batchInputs);
  const countResult = await countQuery;
  const total = Number(countResult[0]?.count) || 0;

  const batchIds = rows.map((r) => r.id);
  let items: BatchInputItem[] = [];
  if (batchIds.length > 0) {
    const itemsRaw = await db
      .select()
      .from(batchInputItems)
      .where(sql`${batchInputItems.batchInputId} = ANY(${batchIds})`)
      .orderBy(batchInputItems.id);
    items = itemsRaw.map((i) => parseDbBatchInputItem(i as unknown as Record<string, unknown>));
  }
  const itemsByBatch = new Map<string, BatchInputItem[]>();
  for (const it of items) {
    if (!itemsByBatch.has(it.batchInputId)) itemsByBatch.set(it.batchInputId, []);
    itemsByBatch.get(it.batchInputId)!.push(it);
  }

  return {
    batchInputs: rows.map((r) =>
      parseDbBatchInput(r as unknown as Record<string, unknown>, itemsByBatch.get(r.id) || []),
    ),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
