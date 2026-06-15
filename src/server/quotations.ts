import { client } from "../db";
import { calculateWarrantyExpiry } from "../../app/utils/formatters";

// ============================================================
// Types
// ============================================================

export type QuotationStatus = "Pending" | "Approved" | "Rejected" | "Canceled";

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  brand?: string;
  model: string;
  sn: string;
  price: number;
  quantity: number;
}

export interface Quotation {
  id: string;
  customerId?: string;
  customerName: string;
  items: QuotationItem[];
  subtotal: number;
  tax: number;
  taxEnabled?: boolean;
  total: number;
  staffName: string;
  notes?: string;
  poNumber?: string;
  status: QuotationStatus;
  rejectionReason?: string;
  convertedSaleId?: string;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface CreateQuotationInput {
  customerId?: string;
  customerName: string;
  items: Array<{
    productId: string;
    brand?: string;
    model: string;
    sn: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  taxEnabled: boolean;
  total: number;
  staffName: string;
  notes?: string;
  poNumber: string;
}

export interface ApproveQuotationInput {
  itemSns?: Array<{ itemId: string; sn: string }>;
  paymentMethod: string;
  staffName: string;
  dueDate?: string;
  amountPaid?: number;
  itemPrices?: Array<{ itemId: string; price: number }>;
}

// ============================================================
// Parsers
// ============================================================

const parseDbQuotationItem = (row: Record<string, unknown>): QuotationItem => ({
  id: row.id as string,
  quotationId: row.quotation_id as string,
  productId: row.product_id as string,
  brand: row.brand as string | undefined,
  model: row.model as string,
  sn: row.sn as string,
  price: typeof row.price === "string" ? parseFloat(row.price) : (row.price as number),
  quantity: row.quantity as number,
});

const parseDbQuotation = (
  row: Record<string, unknown>,
  items: QuotationItem[] = [],
): Quotation => ({
  id: row.id as string,
  customerId: (row.customer_id as string | undefined) ?? undefined,
  customerName: row.customer_name as string,
  items,
  subtotal: typeof row.subtotal === "string" ? parseFloat(row.subtotal) : (row.subtotal as number),
  tax: typeof row.tax === "string" ? parseFloat(row.tax) : (row.tax as number),
  taxEnabled: row.tax_enabled as boolean,
  total: typeof row.total === "string" ? parseFloat(row.total) : (row.total as number),
  staffName: row.staff_name as string,
  notes: (row.notes as string | undefined) ?? undefined,
  poNumber: ((row.po_number as string | undefined) ?? "") as string,
  status: (row.status as QuotationStatus) ?? "Pending",
  rejectionReason: (row.rejection_reason as string | undefined) ?? undefined,
  convertedSaleId: (row.converted_sale_id as string | undefined) ?? undefined,
  createdAt: row.created_at as string,
  decidedAt: (row.decided_at as string | undefined) ?? undefined,
  decidedBy: (row.decided_by as string | undefined) ?? undefined,
});

// ============================================================
// Helpers
// ============================================================

/**
 * Atomically allocates the next Quotation number for today.
 * Uses PostgreSQL UPSERT (ON CONFLICT DO UPDATE ... RETURNING) to ensure
 * the counter is incremented exactly once per call, even under concurrent
 * requests.
 */
const allocateQuotationNumber = async (tx: any): Promise<string> => {
  const result = await tx.unsafe(
    `INSERT INTO quotation_counters (date, last_number) VALUES (CURRENT_DATE, 1)
     ON CONFLICT (date) DO UPDATE SET last_number = quotation_counters.last_number + 1
     RETURNING last_number`,
  );
  const seq = result[0].last_number as number;
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `SB/${dd}/${mm}/${yyyy}-${String(seq).padStart(3, "0")}`;
};

// ============================================================
// Handlers
// ============================================================

export interface PaginatedQuotationsResult {
  quotations: Quotation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const fetchItemsForQuotations = async (
  quotationIds: string[],
): Promise<Map<string, QuotationItem[]>> => {
  const itemsMap = new Map<string, QuotationItem[]>();
  if (quotationIds.length === 0) return itemsMap;

  const placeholders = quotationIds.map((_, i) => `$${i + 1}`).join(", ");
  const rows = await client.unsafe(
    `SELECT * FROM quotation_items WHERE quotation_id IN (${placeholders}) ORDER BY id`,
    quotationIds,
  );
  for (const row of rows) {
    const item = parseDbQuotationItem(row);
    if (!itemsMap.has(item.quotationId)) itemsMap.set(item.quotationId, []);
    itemsMap.get(item.quotationId)!.push(item);
  }
  return itemsMap;
};

export const getAllQuotationsHandler = async (
  page: number = 1,
  limit: number = 20,
  status?: QuotationStatus,
): Promise<PaginatedQuotationsResult> => {
  const offset = (page - 1) * limit;

  const hasStatus = !!status;
  const filterClause = hasStatus ? "WHERE status = $3" : "";
  const countParams: unknown[] = [];
  if (hasStatus) countParams.push(status);

  const countResult = await client.unsafe(
    `SELECT COUNT(*) as count FROM quotations ${filterClause}`,
    countParams,
  );
  const total = Number(countResult[0]?.count) || 0;

  const dataParams: unknown[] = [limit, offset];
  if (hasStatus) dataParams.push(status);

  const result = await client.unsafe(
    `SELECT * FROM quotations ${filterClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    dataParams,
  );

  const ids = result.map((r: Record<string, unknown>) => r.id as string);
  const itemsMap = await fetchItemsForQuotations(ids);

  return {
    quotations: result.map((r: Record<string, unknown>) =>
      parseDbQuotation(r, itemsMap.get(r.id as string) || []),
    ),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getQuotationByIdHandler = async (id: string): Promise<Quotation | null> => {
  const result = await client.unsafe("SELECT * FROM quotations WHERE id = $1", [id]);
  if (result.length === 0) return null;
  const itemsMap = await fetchItemsForQuotations([id]);
  return parseDbQuotation(result[0], itemsMap.get(id) || []);
};

export const createQuotationHandler = async (data: CreateQuotationInput): Promise<Quotation> => {
  if (!data.items || data.items.length === 0) {
    throw new Error("Quotation must have at least 1 item");
  }
  if (!data.customerName || !data.customerName.trim()) {
    throw new Error("Customer name is required");
  }
  if (!data.staffName) {
    throw new Error("Staff name is required");
  }
  const trimmedPo = (data.poNumber || "").trim();
  if (!trimmedPo) {
    throw new Error("PO Number is required");
  }

  return await client.begin(async (tx) => {
    // Atomically allocate a Quotation number
    const quotationId = await allocateQuotationNumber(tx);

    await tx.unsafe(
      `INSERT INTO quotations (id, customer_id, customer_name, subtotal, tax, tax_enabled, total, staff_name, notes, po_number, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending')`,
      [
        quotationId,
        data.customerId || null,
        data.customerName,
        String(data.subtotal),
        String(data.tax),
        data.taxEnabled,
        String(data.total),
        data.staffName,
        data.notes || null,
        trimmedPo,
      ],
    );

    for (const item of data.items) {
      await tx.unsafe(
        `INSERT INTO quotation_items (quotation_id, product_id, brand, model, sn, price, quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          quotationId,
          item.productId,
          item.brand || null,
          item.model,
          item.sn || "",
          String(item.price),
          item.quantity || 1,
        ],
      );
    }

    await tx.unsafe(
      `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        data.staffName,
        "Quotation Created",
        `Quotation ${quotationId} created - ${data.items.length} item(s), Total: Rp ${new Intl.NumberFormat("id-ID").format(data.total)}, Customer: ${data.customerName}`,
        quotationId,
      ],
    );

    const created = await tx.unsafe("SELECT * FROM quotations WHERE id = $1", [quotationId]);
    return parseDbQuotation(
      created[0],
      data.items.map((item, idx) => ({
        id: `placeholder-${idx}`,
        quotationId,
        productId: item.productId,
        brand: item.brand,
        model: item.model,
        sn: item.sn || "",
        price: item.price,
        quantity: item.quantity || 1,
      })),
    );
  });
};

export const approveQuotationHandler = async (
  id: string,
  input: ApproveQuotationInput,
): Promise<{ quotation: Quotation; sale: any }> => {
  if (!input.paymentMethod) {
    throw new Error("Payment method is required");
  }
  if (!input.staffName) {
    throw new Error("Staff name is required");
  }

  return await client.begin(async (tx) => {
    // 1) Lock the Quotation row & check status
    const quotationRows = await tx.unsafe("SELECT * FROM quotations WHERE id = $1 FOR UPDATE", [
      id,
    ]);
    if (quotationRows.length === 0) throw new Error("Quotation not found");
    const quotation = quotationRows[0];
    if (quotation.status !== "Pending") {
      throw new Error(`Quotation is already ${quotation.status}`);
    }

    // 2) Fetch all Quotation items
    const itemRows = await tx.unsafe(
      "SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id",
      [id],
    );
    if (itemRows.length === 0) throw new Error("Quotation has no items");

    // Build effective SN map (user may have re-picked SNs at conversion)
    const snOverride = new Map<string, string>();
    for (const o of input.itemSns || []) snOverride.set(o.itemId, o.sn);
    const priceOverride = new Map<string, number>();
    for (const o of input.itemPrices || []) priceOverride.set(o.itemId, o.price);

    // 3) Pre-flight: verify all SNs are still In Stock
    for (const itemRow of itemRows) {
      const itemId = itemRow.id as string;
      const effectiveSn = snOverride.get(itemId) ?? (itemRow.sn as string);
      // NOSN-* placeholders skip SN check
      if (effectiveSn && !effectiveSn.startsWith("NOSN-")) {
        const snCheck = await tx.unsafe(
          "SELECT status FROM serial_numbers WHERE sn = $1 FOR UPDATE",
          [effectiveSn],
        );
        if (!snCheck[0] || snCheck[0].status !== "In Stock") {
          throw new Error(
            `Serial number ${effectiveSn} is no longer available (status: ${snCheck[0]?.status ?? "not found"})`,
          );
        }
      }
      // Verify product stock
      const productId = itemRow.product_id as string;
      const requestedQty = itemRow.quantity as number;
      const productCheck = await tx.unsafe(
        "SELECT stock, model FROM products WHERE id = $1 FOR UPDATE",
        [productId],
      );
      if (!productCheck[0] || Number(productCheck[0].stock) < requestedQty) {
        throw new Error(
          `Insufficient stock for ${productCheck[0]?.model ?? productId}: need ${requestedQty}, have ${productCheck[0]?.stock ?? 0}`,
        );
      }
    }

    // 4) Generate Sale ID
    const saleId = `INV-${Date.now()}`;

    // 5) Compute total (use override prices if any, else Quotation price)
    let subtotal = 0;
    for (const itemRow of itemRows) {
      const itemId = itemRow.id as string;
      const basePrice =
        priceOverride.get(itemId) ??
        (typeof itemRow.price === "string" ? parseFloat(itemRow.price) : (itemRow.price as number));
      const qty = itemRow.quantity as number;
      subtotal += basePrice * qty;
    }
    const tax = quotation.tax_enabled
      ? typeof quotation.tax === "string"
        ? parseFloat(quotation.tax)
        : (quotation.tax as number)
      : 0;
    const total = subtotal + tax;

    const saleAmountPaid = input.amountPaid || 0;
    const installmentsJson =
      saleAmountPaid > 0
        ? JSON.stringify([{ amount: saleAmountPaid, timestamp: new Date().toISOString() }])
        : "[]";

    // 6) Insert the Sale
    await tx.unsafe(
      `INSERT INTO sales (id, customer_id, customer_name, subtotal, tax, tax_enabled, total, payment_method, staff_name, notes, po_number, quotation_id, due_date, is_paid, amount_paid, installments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        saleId,
        quotation.customer_id,
        quotation.customer_name,
        String(subtotal),
        String(tax),
        quotation.tax_enabled,
        String(total),
        input.paymentMethod,
        input.staffName,
        quotation.notes || null,
        quotation.po_number || "",
        id, // quotation_id link
        input.dueDate || null,
        input.paymentMethod !== "Utang" || saleAmountPaid >= total,
        String(saleAmountPaid),
        installmentsJson,
      ],
    );

    // 7) Insert sale_items, mark SNs Sold, deduct stock
    for (const itemRow of itemRows) {
      const itemId = itemRow.id as string;
      const effectiveSn = snOverride.get(itemId) ?? (itemRow.sn as string);
      const effectivePrice =
        priceOverride.get(itemId) ??
        (typeof itemRow.price === "string" ? parseFloat(itemRow.price) : (itemRow.price as number));
      const productId = itemRow.product_id as string;
      const qty = itemRow.quantity as number;

      // Look up product for warranty + cogs
      const productRow = await tx.unsafe("SELECT * FROM products WHERE id = $1", [productId]);
      const product = productRow[0];
      const warrantyMonths = (product?.warranty_months as number) ?? 0;
      const warrantyExpiry = calculateWarrantyExpiry(warrantyMonths);
      const cogs = product?.cogs != null ? String(product.cogs) : "0";

      await tx.unsafe(
        `INSERT INTO sale_items (sale_id, product_id, brand, model, sn, price, cogs, warranty_expiry, quantity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          saleId,
          productId,
          itemRow.brand || product?.brand || null,
          itemRow.model,
          effectiveSn,
          String(effectivePrice),
          cogs,
          warrantyExpiry,
          qty,
        ],
      );

      if (effectiveSn && !effectiveSn.startsWith("NOSN-")) {
        await tx.unsafe("UPDATE serial_numbers SET status = 'Sold' WHERE sn = $1", [effectiveSn]);
      }
      await tx.unsafe("UPDATE products SET stock = stock - $1 WHERE id = $2", [qty, productId]);

      // Audit log per item
      const snLabel =
        effectiveSn && !effectiveSn.startsWith("NOSN-") ? `SN: ${effectiveSn}` : "tanpa SN";
      await tx.unsafe(
        `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          input.staffName,
          "Sales Deduction",
          `Sold ${qty} unit(s) of ${itemRow.model} (${snLabel}) to ${quotation.customer_name} (from Quotation ${id})`,
          productId,
        ],
      );
    }

    // 8) Update Quotation status
    const now = new Date().toISOString();
    await tx.unsafe(
      `UPDATE quotations SET status = 'Approved', converted_sale_id = $1, decided_at = $2, decided_by = $3 WHERE id = $4`,
      [saleId, now, input.staffName, id],
    );

    // 9) Award loyalty points if paid
    if (input.paymentMethod !== "Utang" || saleAmountPaid >= total) {
      const pointsEarned = Math.floor(total / 1000);
      if (pointsEarned > 0 && quotation.customer_id) {
        await tx.unsafe(
          "UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2",
          [pointsEarned, quotation.customer_id],
        );
      }
    }

    // 10) Audit logs
    await tx.unsafe(
      `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        input.staffName,
        "Sale Created",
        `Sale ${saleId} created from Quotation ${id} - ${itemRows.length} item(s), Total: Rp ${new Intl.NumberFormat("id-ID").format(total)}, Customer: ${quotation.customer_name}`,
        saleId,
      ],
    );
    await tx.unsafe(
      `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        input.staffName,
        "Quotation Approved",
        `Quotation ${id} approved → converted to Sale ${saleId}`,
        id,
      ],
    );

    // 11) Return updated Quotation + new Sale
    const updatedQ = await tx.unsafe("SELECT * FROM quotations WHERE id = $1", [id]);
    const itemsForReturn = itemRows.map((r: Record<string, unknown>) =>
      parseDbQuotationItem({
        ...r,
        sn: snOverride.get(r.id as string) ?? r.sn,
        price: priceOverride.get(r.id as string)?.toString() ?? r.price,
      }),
    );
    return {
      quotation: parseDbQuotation(updatedQ[0], itemsForReturn),
      sale: { id: saleId },
    };
  });
};

const setTerminalStatus = async (
  id: string,
  newStatus: "Rejected" | "Canceled",
  reason: string,
  staffName: string,
): Promise<Quotation> => {
  const trimmedReason = (reason || "").trim();
  if (!trimmedReason) {
    throw new Error("Reason is required");
  }
  if (!staffName) {
    throw new Error("Staff name is required");
  }

  return await client.begin(async (tx) => {
    const rows = await tx.unsafe("SELECT * FROM quotations WHERE id = $1 FOR UPDATE", [id]);
    if (rows.length === 0) throw new Error("Quotation not found");
    if (rows[0].status !== "Pending") {
      throw new Error(`Quotation is already ${rows[0].status}`);
    }
    const now = new Date().toISOString();
    await tx.unsafe(
      `UPDATE quotations SET status = $1, rejection_reason = $2, decided_at = $3, decided_by = $4 WHERE id = $5`,
      [newStatus, trimmedReason, now, staffName, id],
    );
    const action = newStatus === "Rejected" ? "Quotation Rejected" : "Quotation Canceled";
    const verb = newStatus === "Rejected" ? "rejected" : "canceled";
    await tx.unsafe(
      `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        staffName,
        action,
        `Quotation ${id} ${verb} - reason: ${trimmedReason}`,
        id,
      ],
    );
    const updated = await tx.unsafe("SELECT * FROM quotations WHERE id = $1", [id]);
    return parseDbQuotation(updated[0], []);
  });
};

export const rejectQuotationHandler = (id: string, reason: string, staffName: string) =>
  setTerminalStatus(id, "Rejected", reason, staffName);

export const cancelQuotationHandler = (id: string, reason: string, staffName: string) =>
  setTerminalStatus(id, "Canceled", reason, staffName);
