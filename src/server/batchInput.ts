import { client, db } from "../db";
import { batchInputs, batchInputItems, auditLogs, products, serialNumbers } from "../db/schema";
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
  const snsRaw = (row.sns as string) ?? "[]";
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
    category: (row.category as string) ?? "Body",
    condition: (row.condition as string) ?? "New",
    mount: (row.mount as string | null) ?? undefined,
    warrantyType: (row.warranty_type as string) ?? "Official Sony Indonesia",
    warrantyMonths: (row.warranty_months as number) ?? 12,
    cogs: typeof row.cogs === "string" ? parseFloat(row.cogs) : (row.cogs as number),
    price: typeof row.price === "string" ? parseFloat(row.price) : (row.price as number),
    hasSerialNumber: Boolean(row.has_serial_number),
    taxEnabled: row.tax_enabled === undefined ? true : Boolean(row.tax_enabled),
    quantity: (row.quantity as number) ?? 1,
    sns,
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
// ID generation
// ============================================================

// Generates a fresh BRC-{ts}-{rand} id. Mirrors the BRC-{ts} shape used by
// the existing createProduct flow in src/server/products.ts, with a short
// random suffix so multiple rows in the same millisecond don't collide.
const newProductId = (): string => `BRC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const newLogId = (): string => `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ============================================================
// Handlers
// ============================================================

export const createBatchInputHandler = async (raw: unknown): Promise<BatchInput> => {
  const data = validateCreateBatchInputInput(raw);

  return await client.begin(async (tx: any) => {
    // 1. Header uniqueness: the supplier invoice number IS the batch id
    const [existing] = await tx.unsafe("SELECT id FROM batch_inputs WHERE id = $1", [data.id]);
    if (existing) {
      throw new Error(`Batch dengan nomor invoice '${data.id}' sudah ada`);
    }

    // 2. Duplicate-SKU check against the existing catalog
    //    (case-insensitive, trimmed brand+model match)
    for (let i = 0; i < data.items.length; i++) {
      const it = data.items[i];
      const [clash] = await tx.unsafe(
        `SELECT id, brand, model, stock FROM products
         WHERE LOWER(TRIM(COALESCE(brand, ''))) = LOWER(TRIM($1))
           AND LOWER(TRIM(model)) = LOWER(TRIM($2))
           AND deleted = false
         LIMIT 1`,
        [it.brand ?? "", it.model],
      );
      if (clash) {
        const c = clash as { brand?: string; model: string; stock: number };
        throw new Error(
          `Item #${i + 1}: "${c.brand ?? ""} ${c.model}" sudah ada di katalog (stok: ${c.stock}). ` +
            `Gunakan Inventory > Tambah Stok untuk menambah stok barang yang sudah ada.`,
        );
      }
    }

    // 3. Duplicate-SKU check WITHIN the batch (no two rows share brand+model)
    const seenInBatch = new Set<string>();
    for (let i = 0; i < data.items.length; i++) {
      const it = data.items[i];
      const key = `${(it.brand ?? "").toLowerCase().trim()}|${it.model.toLowerCase().trim()}`;
      if (seenInBatch.has(key)) {
        throw new Error(`Item #${i + 1}: duplikat SKU dalam batch (sama dengan baris sebelumnya)`);
      }
      seenInBatch.add(key);
    }

    // 4. SN uniqueness checks: across the batch, and against the existing
    //    serial_numbers table
    const allBatchSNs: string[] = [];
    for (const it of data.items) {
      if (it.hasSerialNumber) {
        for (const sn of it.sns) {
          if (allBatchSNs.includes(sn)) {
            throw new Error(`SN '${sn}' muncul lebih dari sekali dalam batch`);
          }
          allBatchSNs.push(sn);
        }
      }
    }
    if (allBatchSNs.length > 0) {
      const [clash] = await tx.unsafe(`SELECT sn FROM serial_numbers WHERE sn = ANY($1::text[])`, [
        allBatchSNs,
      ]);
      if (clash) {
        throw new Error(`SN '${(clash as { sn: string }).sn}' sudah ada di sistem`);
      }
    }

    // 5. Insert header FIRST so the FK from batch_input_items has a target
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

    // 6. Insert each row: products -> batch_input_items -> serial_numbers
    const newProductIds: string[] = [];
    for (const it of data.items) {
      const productId = newProductId();
      newProductIds.push(productId);

      const stockForNewProduct = it.hasSerialNumber ? it.sns.length : it.quantity;

      const restockEntry = {
        sn: it.sns,
        inv: data.id,
        timestamp: new Date().toISOString(),
      };

      await tx.unsafe(
        `INSERT INTO products (
          id, brand, model, category, mount, condition,
          price, cogs, warranty_months, warranty_type,
          stock, has_serial_number, supplier, date_restocked,
          tax_enabled, deleted, hidden,
          invoice_number, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, false, 0,
          $16, NOW(), NOW()
        )`,
        [
          productId,
          it.brand || "N/A",
          it.model,
          it.category,
          it.mount || null,
          it.condition,
          String(it.price),
          String(it.cogs),
          it.warrantyMonths,
          it.warrantyType,
          stockForNewProduct,
          it.hasSerialNumber,
          data.supplier,
          data.date ? new Date(data.date) : new Date(),
          it.taxEnabled,
          JSON.stringify([restockEntry]),
        ],
      );

      await tx.unsafe(
        `INSERT INTO batch_input_items (
          batch_input_id, product_id, brand, model,
          category, condition, mount, warranty_type, warranty_months,
          cogs, price, has_serial_number, tax_enabled,
          quantity, sns
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15
        )`,
        [
          data.id,
          productId,
          it.brand || null,
          it.model,
          it.category,
          it.condition,
          it.mount || null,
          it.warrantyType,
          it.warrantyMonths,
          String(it.cogs),
          String(it.price),
          it.hasSerialNumber,
          it.taxEnabled,
          it.quantity,
          JSON.stringify(it.sns),
        ],
      );

      if (it.hasSerialNumber) {
        for (const sn of it.sns) {
          await tx.unsafe(
            `INSERT INTO serial_numbers (sn, product_id, status) VALUES ($1, $2, 'In Stock')`,
            [sn, productId],
          );
        }
      }

      // Per-row audit log
      const snDetail = it.sns.length > 0 ? ` SN: ${it.sns.join(", ")}` : "";
      await tx.unsafe(
        `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          newLogId(),
          data.staffName,
          "Stock Addition",
          `Created product ${it.brand ?? ""} ${it.model} (${it.quantity} unit(s), harga: ${it.price}, cogs: ${it.cogs}) from supplier ${data.supplier}, invoice: ${data.id}.${snDetail}`,
          productId,
        ],
      );
    }

    // 7. Summary audit log
    await tx.unsafe(
      `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        newLogId(),
        data.staffName,
        "Batch Input Created",
        `BI ${data.id} — ${data.items.length} produk baru dari ${data.supplier}`,
        data.id,
      ],
    );

    // 8. Return the new batch with its items
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
  const [header] = await db.select().from(batchInputs).where(eq(batchInputs.id, id)).limit(1);
  if (!header) return null;
  const items = await db.select().from(batchInputItems).where(eq(batchInputItems.batchInputId, id));
  return parseDbBatchInput(
    header as unknown as Record<string, unknown>,
    items.map((r) => parseDbBatchInputItem(r as unknown as Record<string, unknown>)),
  );
};

export const getAllBatchInputHandler = async (
  page: number = 1,
  limit: number = 20,
  search: string = "",
): Promise<PaginatedBatchInputResult> => {
  const offset = (page - 1) * limit;
  const searchPattern = `%${search}%`;

  // Total count (with search filter)
  const [countRow] = await db.execute(sql`
    SELECT COUNT(*)::int AS total
    FROM ${batchInputs}
    WHERE ${
      search
        ? or(
            ilike(batchInputs.id, searchPattern),
            ilike(batchInputs.supplier, searchPattern),
            ilike(batchInputs.notes, searchPattern),
          )
        : sql`TRUE`
    }
  `);
  const total = (countRow as unknown as { total: number }).total;

  // Paginated rows
  const rows = await db.execute(sql`
    SELECT b.*
    FROM ${batchInputs} b
    WHERE ${
      search
        ? or(
            ilike(batchInputs.id, searchPattern),
            ilike(batchInputs.supplier, searchPattern),
            ilike(batchInputs.notes, searchPattern),
          )
        : sql`TRUE`
    }
    ORDER BY b.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  // For each batch, fetch its items (so the log table can show total units)
  const batchIds = (rows as unknown as Array<{ id: string }>).map((r) => r.id);
  const itemsByBatchId = new Map<string, BatchInputItem[]>();
  if (batchIds.length > 0) {
    const allItems = await db
      .select()
      .from(batchInputItems)
      .where(sql`${batchInputItems.batchInputId} = ANY(${batchIds})`);
    for (const item of allItems) {
      const bi = item.batchInputId;
      if (!itemsByBatchId.has(bi)) itemsByBatchId.set(bi, []);
      itemsByBatchId
        .get(bi)!
        .push(parseDbBatchInputItem(item as unknown as Record<string, unknown>));
    }
  }

  const batchInputs_ = (rows as unknown as Array<Record<string, unknown>>).map((r) =>
    parseDbBatchInput(r, itemsByBatchId.get(r.id as string) ?? []),
  );

  return {
    batchInputs: batchInputs_,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
};
