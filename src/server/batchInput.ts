import { client, db } from "../db";
import { batchInputs, batchInputItems, auditLogs, products, serialNumbers } from "../db/schema";
import { eq, sql, desc, or, ilike, inArray } from "drizzle-orm";
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

const parseDbBatchInputItem = (row: Record<string, unknown>): BatchInputItem => {
  const snsRaw = (pick(row, "sns", "sns") as string) ?? "[]";
  let sns: string[] = [];
  try {
    sns = JSON.parse(snsRaw);
  } catch {
    sns = [];
  }
  const cogsRaw = pick(row, "cogs", "cogs");
  const priceRaw = pick(row, "price", "price");
  return {
    id: pick(row, "id", "id"),
    batchInputId: pick(row, "batch_input_id", "batchInputId"),
    productId: pick(row, "product_id", "productId"),
    brand: pick(row, "brand", "brand"),
    model: pick(row, "model", "model"),
    category: (pick(row, "category", "category") as string) ?? "Body",
    condition: (pick(row, "condition", "condition") as string) ?? "New",
    mount: pick(row, "mount", "mount"),
    warrantyType:
      (pick(row, "warranty_type", "warrantyType") as string) ?? "Official Sony Indonesia",
    warrantyMonths: (pick(row, "warranty_months", "warrantyMonths") as number) ?? 12,
    cogs: typeof cogsRaw === "string" ? parseFloat(cogsRaw) : ((cogsRaw as number) ?? 0),
    price: typeof priceRaw === "string" ? parseFloat(priceRaw) : ((priceRaw as number) ?? 0),
    hasSerialNumber: Boolean(pick(row, "has_serial_number", "hasSerialNumber")),
    taxEnabled:
      pick(row, "tax_enabled", "taxEnabled") === undefined
        ? true
        : Boolean(pick(row, "tax_enabled", "taxEnabled")),
    quantity: (pick(row, "quantity", "quantity") as number) ?? 1,
    sns,
  };
};

const parseDbBatchInput = (
  row: Record<string, unknown>,
  items: BatchInputItem[] = [],
): BatchInput => ({
  id: pick(row, "id", "id"),
  supplier: pick(row, "supplier", "supplier"),
  date: toIso(pick(row, "date", "date")),
  notes: pick(row, "notes", "notes"),
  staffName: pick(row, "staff_name", "staffName"),
  items,
  createdAt: toIso(pick(row, "created_at", "createdAt")),
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

    // ============================================================
    // 2. Pre-flight: validate each row against the existing catalog
    //    - new rows: brand+model must not exist
    //    - restock rows: existingProductId must exist and not be deleted
    // ============================================================
    const newItems = data.items.filter(
      (it): it is Extract<typeof it, { mode: "new" }> => it.mode === "new",
    );
    const restockItems = data.items.filter(
      (it): it is Extract<typeof it, { mode: "restock" }> => it.mode === "restock",
    );

    // 2a. Duplicate-SKU check for new rows (against the existing catalog)
    for (let i = 0; i < newItems.length; i++) {
      const it = newItems[i];
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
            `Gunakan mode 'Restock' di baris ini untuk menambah stok barang yang sudah ada.`,
        );
      }
    }

    // 2b. Existence check for restock rows: existingProductId must exist and not be deleted
    let restockProducts: Map<
      string,
      {
        id: string;
        brand?: string;
        model: string;
        stock: number;
        cogs: string;
        price: string;
        has_serial_number: boolean;
        procurement_history: string | null;
      }
    > = new Map();
    if (restockItems.length > 0) {
      const productIds = Array.from(new Set(restockItems.map((it) => it.existingProductId)));
      const rows = await tx.unsafe(
        `SELECT id, brand, model, stock, cogs, price, has_serial_number, procurement_history, deleted
         FROM products WHERE id = ANY($1::text[])`,
        [productIds],
      );
      const byId = new Map<
        string,
        {
          id: string;
          brand?: string;
          model: string;
          stock: number;
          cogs: string;
          price: string;
          has_serial_number: boolean;
          procurement_history: string | null;
          deleted: boolean;
        }
      >();
      for (const r of rows as unknown as Array<{
        id: string;
        brand?: string;
        model: string;
        stock: number;
        cogs: string;
        price: string;
        has_serial_number: boolean;
        procurement_history: string | null;
        deleted: boolean;
      }>) {
        byId.set(r.id, r);
      }
      for (let i = 0; i < restockItems.length; i++) {
        const it = restockItems[i];
        const p = byId.get(it.existingProductId);
        if (!p) {
          throw new Error(
            `Item #${i + 1}: produk '${it.existingProductId}' tidak ditemukan di katalog.`,
          );
        }
        if (p.deleted) {
          throw new Error(
            `Item #${i + 1}: produk '${it.existingProductId}' sudah di-soft-delete dan tidak bisa di-restock.`,
          );
        }
        restockProducts.set(it.existingProductId, p);
      }
    }

    // 2c. Duplicate-SKU check WITHIN the batch (no two NEW rows share brand+model,
    //     and no NEW row's brand+model matches any restock product in the same batch)
    const seenInBatch = new Set<string>();
    for (let i = 0; i < newItems.length; i++) {
      const it = newItems[i];
      const key = `${(it.brand ?? "").toLowerCase().trim()}|${it.model.toLowerCase().trim()}`;
      if (seenInBatch.has(key)) {
        throw new Error(`Item #${i + 1}: duplikat SKU dalam batch (sama dengan baris sebelumnya)`);
      }
      // Also check against any restock product in the same batch
      for (const p of restockProducts.values()) {
        const pKey = `${(p.brand ?? "").toLowerCase().trim()}|${p.model.toLowerCase().trim()}`;
        if (pKey === key) {
          throw new Error(
            `Item #${i + 1}: "${p.brand ?? ""} ${p.model}" sudah ada di mode Restock pada batch ini. ` +
              `Hapus salah satu baris.`,
          );
        }
      }
      seenInBatch.add(key);
    }

    // ============================================================
    // 3. SN uniqueness checks: across the batch, and against the existing
    //    serial_numbers table. Applies to BOTH new-product SN rows and
    //    restock rows on SN products.
    // ============================================================
    const allBatchSNs: string[] = [];
    for (const it of data.items) {
      for (const sn of it.sns) {
        if (allBatchSNs.includes(sn)) {
          throw new Error(`SN '${sn}' muncul lebih dari sekali dalam batch`);
        }
        allBatchSNs.push(sn);
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

    // 3a. For restock rows on SN products, also validate: SN count must equal
    //     quantity, and (defensively) no SN may be a duplicate of an existing
    //     SN for that product with a different status. (The global SN
    //     uniqueness check above already covers 'In Stock' collisions.)
    for (let i = 0; i < restockItems.length; i++) {
      const it = restockItems[i];
      const p = restockProducts.get(it.existingProductId);
      if (!p) continue; // already validated above
      if (p.has_serial_number && it.sns.length !== it.quantity) {
        throw new Error(
          `Item #${i + 1}: produk '${p.brand ?? ""} ${p.model}' adalah produk SN, ` +
            `tapi baris restock punya ${it.sns.length} SN untuk ${it.quantity} unit. ` +
            `Satu SN per unit.`,
        );
      }
      if (!p.has_serial_number && it.sns.length > 0) {
        throw new Error(
          `Item #${i + 1}: produk '${p.brand ?? ""} ${p.model}' bukan produk SN, ` +
            `tapi baris restock punya daftar SN. Kosongkan daftar SN.`,
        );
      }
    }

    // 4. Insert header FIRST so the FK from batch_input_items has a target
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

    // ============================================================
    // 5. Insert NEW-product rows: products -> batch_input_items -> serial_numbers
    // ============================================================
    for (const it of newItems) {
      const productId = newProductId();
      const stockForNewProduct = it.hasSerialNumber ? it.sns.length : it.quantity;

      await tx.unsafe(
        `INSERT INTO products (
          id, brand, model, category, mount, condition,
          price, cogs, warranty_months, warranty_type,
          stock, has_serial_number, supplier, date_restocked,
          tax_enabled, deleted, hidden,
          procurement_history, created_at, updated_at
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
          JSON.stringify([
            {
              sns: it.sns,
              inv: data.id,
              supplier: data.supplier,
              timestamp: new Date().toISOString(),
            },
          ]),
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

      // Per-row audit log (NEW-product format)
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

    // ============================================================
    // 6. RESTOCK rows: server-side dedup by existingProductId.
    //    - group restockItems by existingProductId
    //    - for each group, run a single UPDATE products + a single
    //      batch_input_items INSERT per submitted row (preserves the
    //      user's literal row count) + a single audit log entry.
    //    - the new SNs are inserted into serial_numbers with status
    //      'In Stock'.
    //    - the product's `supplier` field is the *introducing* supplier
    //      (frozen at first introduction); the per-event supplier is
    //      captured in the appended procurement_history entry instead.
    // ============================================================
    type RestockGroup = {
      productId: string;
      brand: string | undefined;
      model: string;
      totalQty: number;
      allSns: string[];
      hasSN: boolean;
      firstItemIndex: number;
      itemIds: number[]; // item indices in the original data.items list, for error messages
    };
    const restockGroups = new Map<string, RestockGroup>();
    // Map the original item index (across all items) so we can preserve order
    // in the consolidated audit entry and use the first item's index for errors.
    const itemIndexByRef = new Map<unknown, number>();
    for (let i = 0; i < data.items.length; i++) {
      itemIndexByRef.set(data.items[i], i);
    }
    for (const it of restockItems) {
      const productId = it.existingProductId;
      const product = restockProducts.get(productId)!;
      const existing = restockGroups.get(productId);
      if (existing) {
        existing.totalQty += it.quantity;
        existing.allSns.push(...it.sns);
        existing.itemIds.push(itemIndexByRef.get(it) ?? 0);
      } else {
        restockGroups.set(productId, {
          productId,
          brand: product.brand,
          model: product.model,
          totalQty: it.quantity,
          allSns: [...it.sns],
          hasSN: product.has_serial_number,
          firstItemIndex: itemIndexByRef.get(it) ?? 0,
          itemIds: [itemIndexByRef.get(it) ?? 0],
        });
      }
    }

    for (const group of restockGroups.values()) {
      const product = restockProducts.get(group.productId)!;
      // 6a. Insert one batch_input_items row per submitted form row.
      //     This preserves the user's literal form shape in the database.
      for (const it of restockItems.filter((r) => r.existingProductId === group.productId)) {
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
            group.productId,
            product.brand || null,
            product.model,
            product.has_serial_number ? "Body" : "Body", // not used; we don't restock on a per-row basis
            "New", // not used
            null, // mount not used in restock rows
            "Distributor", // not used; the product's existing warranty is preserved
            12, // not used
            String(product.cogs),
            String(product.price),
            product.has_serial_number,
            true, // not used
            it.quantity,
            JSON.stringify(it.sns),
          ],
        );
      }

      // 6b. Update the product's stock + date_restocked in a single UPDATE.
      //     For SN products, stock is incremented by the count of new SNs.
      //     For non-SN products, stock is incremented by the total qty.
      const stockIncrement = group.hasSN ? group.allSns.length : group.totalQty;
      // 6c. Append a procurement_history entry capturing the per-event
      //     supplier (which may differ from the product's introducing
      //     supplier). The product's `supplier` column is NOT changed.
      let existingHistory: unknown[] = [];
      if (product.procurement_history) {
        try {
          const parsed = JSON.parse(product.procurement_history);
          if (Array.isArray(parsed)) existingHistory = parsed;
        } catch {
          existingHistory = [];
        }
      }
      const newEntry = {
        sns: group.allSns,
        inv: data.id,
        supplier: data.supplier,
        timestamp: new Date().toISOString(),
        qty: group.hasSN ? undefined : group.totalQty,
      };
      existingHistory.push(newEntry);

      await tx.unsafe(
        `UPDATE products
         SET stock = stock + $1,
             date_restocked = $2,
             procurement_history = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [
          stockIncrement,
          data.date ? new Date(data.date) : new Date(),
          JSON.stringify(existingHistory),
          group.productId,
        ],
      );

      // 6d. Insert new SNs (if any) into serial_numbers with status 'In Stock'
      if (group.hasSN && group.allSns.length > 0) {
        for (const sn of group.allSns) {
          await tx.unsafe(
            `INSERT INTO serial_numbers (sn, product_id, status) VALUES ($1, $2, 'In Stock')`,
            [sn, group.productId],
          );
        }
      }

      // 6e. Consolidated per-product audit log entry
      const snDetail = group.allSns.length > 0 ? ` SN: ${group.allSns.join(", ")}` : "";
      // Fetch the post-update stock to record in the message
      const [updated] = await tx.unsafe(`SELECT stock FROM products WHERE id = $1`, [
        group.productId,
      ]);
      const stockAfter =
        (updated as { stock: number } | undefined)?.stock ?? product.stock + stockIncrement;
      await tx.unsafe(
        `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          newLogId(),
          data.staffName,
          "Stock Addition",
          `Restocked ${group.brand ?? ""} ${group.model} (+${group.totalQty} units, total stock: ${stockAfter}) from supplier ${data.supplier}, invoice: ${data.id}.${snDetail}`,
          group.productId,
        ],
      );
    }

    // 7. Summary audit log
    const newCount = newItems.length;
    const restockCount = restockItems.length;
    const summaryParts = [`${newCount} barang baru`];
    if (restockCount > 0) {
      summaryParts.push(`${restockCount} restock`);
    }
    await tx.unsafe(
      `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        newLogId(),
        data.staffName,
        "Batch Input Created",
        `BI ${data.id} — ${summaryParts.join(", ")} dari ${data.supplier}`,
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
      items.map((r: unknown) => parseDbBatchInputItem(r as Record<string, unknown>)),
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
    SELECT ${batchInputs}.*
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
    ORDER BY ${batchInputs.createdAt} DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  // For each batch, fetch its items (so the log table can show total units)
  const batchIds = (rows as unknown as Array<{ id: string }>).map((r) => r.id);
  const itemsByBatchId = new Map<string, BatchInputItem[]>();
  if (batchIds.length > 0) {
    const allItems = await db
      .select()
      .from(batchInputItems)
      .where(inArray(batchInputItems.batchInputId, batchIds));
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
