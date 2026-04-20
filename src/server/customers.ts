import { client, db } from "../db";
import { customers, sales, saleItems, serialNumbers, auditLogs, products } from "../db/schema";
import { eq, sql } from "drizzle-orm";

const parseDbCustomer = (row: Record<string, unknown>) => ({
  id: row.id as string,
  name: row.name as string,
  phone: row.phone as string | undefined,
  email: row.email as string | undefined,
  address: row.address as string | undefined,
  npwp: row.npwp as string | undefined,
  loyaltyPoints:
    typeof row.loyalty_points === "string"
      ? parseInt(row.loyalty_points)
      : (row.loyalty_points as number),
  deleted: row.deleted as boolean | undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

const parseDbSale = (row: Record<string, unknown>) => {
  let installments: { amount: number; timestamp: string }[] = [];
  try {
    installments = JSON.parse((row.installments as string) || "[]");
  } catch {
    installments = [];
  }
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    customerName: row.customer_name as string,
    items: [],
    subtotal:
      typeof row.subtotal === "string" ? parseFloat(row.subtotal) : (row.subtotal as number),
    tax: typeof row.tax === "string" ? parseFloat(row.tax) : (row.tax as number),
    taxEnabled: row.tax_enabled as boolean,
    total: typeof row.total === "string" ? parseFloat(row.total) : (row.total as number),
    paymentMethod: row.payment_method as string,
    staffName: row.staff_name as string,
    notes: row.notes as string | undefined,
    dueDate: row.due_date as string | undefined,
    isPaid: row.is_paid as boolean,
    paidAt: row.paid_at as string | undefined,
    amountPaid:
      typeof row.amount_paid === "string"
        ? parseFloat(row.amount_paid) || 0
        : (row.amount_paid as number) || 0,
    installments,
    timestamp: row.timestamp as string,
  };
};

export interface PaginatedCustomersResult {
  customers: ReturnType<typeof parseDbCustomer>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllCustomersHandler = async (
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedCustomersResult> => {
  const offset = (page - 1) * limit;

  const result = await client.unsafe(
    "SELECT * FROM customers WHERE deleted = false ORDER BY name LIMIT $1 OFFSET $2",
    [limit, offset],
  );
  const countResult = await client.unsafe(
    "SELECT COUNT(*) as count FROM customers WHERE deleted = false",
  );
  const total = Number(countResult[0]?.count) || 0;

  return {
    customers: result.map(parseDbCustomer),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getCustomerByIdHandler = async (id: string) => {
  const result = await client.unsafe("SELECT * FROM customers WHERE id = $1", [id]);
  if (result.length === 0) return null;
  return parseDbCustomer(result[0]);
};

export const createCustomerHandler = async (data: {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  npwp?: string;
  loyaltyPoints?: number;
  staffName?: string;
}) => {
  const result = await client.unsafe(
    "INSERT INTO customers (id, name, phone, email, address, npwp, loyalty_points) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [
      data.id,
      data.name,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.npwp || null,
      data.loyaltyPoints || 0,
    ],
  );

  // Audit log for customer creation
  const staffName = data.staffName || "System";
  await client.unsafe(
    "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
    [
      `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName,
      "Customer Created",
      `Created customer: ${data.name}${data.phone ? `, phone: ${data.phone}` : ""}${data.email ? `, email: ${data.email}` : ""}`,
      data.id,
    ],
  );

  return parseDbCustomer(result[0]);
};

export const updateCustomerHandler = async (
  id: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    npwp?: string;
    loyaltyPoints?: number;
    staffName?: string;
  },
) => {
  // Get old customer for audit logging
  const [oldCustomer] = await client.unsafe("SELECT * FROM customers WHERE id = $1", [id]);
  if (!oldCustomer) {
    throw new Error("Customer not found");
  }

  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  const changeDescriptions: string[] = [];
  let paramIndex = 1;

  if (data.name !== undefined && data.name !== oldCustomer.name) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
    changeDescriptions.push(`name: ${oldCustomer.name} -> ${data.name}`);
  }
  if (data.phone !== undefined && data.phone !== oldCustomer.phone) {
    updates.push(`phone = $${paramIndex++}`);
    values.push(data.phone);
    changeDescriptions.push(`phone: ${oldCustomer.phone || "-"} -> ${data.phone || "-"}`);
  }
  if (data.email !== undefined && data.email !== oldCustomer.email) {
    updates.push(`email = $${paramIndex++}`);
    values.push(data.email);
    changeDescriptions.push(`email: ${oldCustomer.email || "-"} -> ${data.email || "-"}`);
  }
  if (data.address !== undefined && data.address !== oldCustomer.address) {
    updates.push(`address = $${paramIndex++}`);
    values.push(data.address);
    changeDescriptions.push(`address: ${oldCustomer.address || "-"} -> ${data.address || "-"}`);
  }
  if (data.npwp !== undefined && data.npwp !== oldCustomer.npwp) {
    updates.push(`npwp = $${paramIndex++}`);
    values.push(data.npwp);
    changeDescriptions.push(`npwp: ${oldCustomer.npwp || "-"} -> ${data.npwp || "-"}`);
  }
  if (
    data.loyaltyPoints !== undefined &&
    data.loyaltyPoints !== parseInt(oldCustomer.loyalty_points || "0")
  ) {
    updates.push(`loyalty_points = $${paramIndex++}`);
    values.push(data.loyaltyPoints);
    changeDescriptions.push(
      `loyaltyPoints: ${oldCustomer.loyalty_points || 0} -> ${data.loyaltyPoints}`,
    );
  }

  if (updates.length === 0) {
    throw new Error("No fields to update");
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await client.unsafe(
    `UPDATE customers SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  );

  if (result.length === 0) {
    throw new Error("Customer not found");
  }

  // Audit log for customer update
  const staffName = data.staffName || "System";
  await client.unsafe(
    "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
    [
      `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName,
      "Customer Updated",
      `Updated customer: ${changeDescriptions.join(", ")}`,
      id,
    ],
  );

  return parseDbCustomer(result[0]);
};

export const deleteCustomerHandler = async (id: string, staffName: string = "System") => {
  // Get customer name for audit logging
  const [customer] = await client.unsafe("SELECT name FROM customers WHERE id = $1", [id]);
  if (!customer) {
    throw new Error("Customer not found");
  }

  // Soft delete - set deleted = true
  await client.unsafe("UPDATE customers SET deleted = true, updated_at = NOW() WHERE id = $1", [
    id,
  ]);

  // Audit log for customer deletion
  await client.unsafe(
    "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
    [
      `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName,
      "Customer Deleted",
      `Deleted customer: ${customer.name}`,
      id,
    ],
  );
};

export interface PaginatedSalesResult {
  sales: ReturnType<typeof parseDbSale>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllSalesHandler = async (
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedSalesResult> => {
  const offset = (page - 1) * limit;

  // Get paginated sale IDs first (lightweight)
  const saleIds = await client.unsafe(
    "SELECT id FROM sales ORDER BY timestamp DESC LIMIT $1 OFFSET $2",
    [limit, offset],
  );
  const countResult = await client.unsafe("SELECT COUNT(*) as count FROM sales");
  const total = Number(countResult[0]?.count) || 0;

  if (saleIds.length === 0) {
    return { sales: [], total: 0, page, limit, totalPages: 0 };
  }

  // Fetch all sales + their items in ONE query using JOIN
  const idList = saleIds.map((r: Record<string, unknown>) => r.id as string);
  const placeholders = idList.map((_: string, i: number) => `$${i + 1}`).join(", ");
  const joinedRows = await client.unsafe(
    `SELECT s.*, si.id as si_id, si.product_id as si_product_id, si.brand as si_brand,
            si.model as si_model, si.sn as si_sn, si.price as si_price,
            si.cogs as si_cogs, si.warranty_expiry as si_warranty_expiry
     FROM sales s
     LEFT JOIN sale_items si ON s.id = si.sale_id
     WHERE s.id IN (${placeholders})
     ORDER BY s.timestamp DESC`,
    idList,
  );

  // Group joined rows back into sales with items
  const salesMap = new Map<string, Record<string, unknown>>();
  const itemsMap = new Map<string, Record<string, unknown>[]>();

  for (const row of joinedRows) {
    const saleId = row.id as string;
    if (!salesMap.has(saleId)) {
      salesMap.set(saleId, row);
      itemsMap.set(saleId, []);
    }
    if (row.si_id) {
      itemsMap.get(saleId)!.push({
        id: row.si_id,
        sale_id: saleId,
        product_id: row.si_product_id,
        brand: row.si_brand,
        model: row.si_model,
        sn: row.si_sn,
        price: row.si_price,
        cogs: row.si_cogs,
        warranty_expiry: row.si_warranty_expiry,
      });
    }
  }

  // Build response in original order
  const salesWithItems = idList.map((saleId: string) => {
    const sale = salesMap.get(saleId)!;
    const items = (itemsMap.get(saleId) || []).map((item) => {
      const r = item as Record<string, unknown>;
      return {
        productId: r.product_id as string,
        brand: r.brand as string | undefined,
        model: r.model as string,
        sn: r.sn as string,
        price: typeof r.price === "string" ? parseFloat(r.price) : (r.price as number),
        cogs: typeof r.cogs === "string" ? parseFloat(r.cogs) : (r.cogs as number),
        warrantyExpiry: r.warranty_expiry as string,
      };
    });

    return {
      ...parseDbSale(sale),
      items,
    };
  });

  return {
    sales: salesWithItems,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getSalesByCustomerHandler = async (customerId: string) => {
  const result = await client.unsafe(
    "SELECT * FROM sales WHERE customer_id = $1 ORDER BY timestamp DESC",
    [customerId],
  );
  return result.map(parseDbSale);
};

export const createSaleHandler = async (data: {
  id: string;
  customerId: string;
  customerName: string;
  items: {
    productId: string;
    brand?: string;
    model: string;
    sn: string;
    price: number;
    cogs: number;
    warrantyExpiry: string;
  }[];
  subtotal: number;
  tax: number;
  taxEnabled: boolean;
  total: number;
  paymentMethod: string;
  staffName: string;
  notes?: string;
  dueDate?: string;
  isPaid?: boolean;
  amountPaid?: number;
}) => {
  const amountPaid = data.amountPaid || 0;
  const installmentsJson =
    amountPaid > 0
      ? JSON.stringify([{ amount: amountPaid, timestamp: new Date().toISOString() }])
      : "[]";

  // Use a transaction to ensure atomicity of the entire sale creation.
  // postgres.js requires the callback-based API: client.begin(async sql => { ... })
  // The library commits automatically on success and rolls back on any thrown error.
  return await client.begin(async (tx) => {
    // --- Pre-flight checks: validate stock & SN status before any writes ---

    // Aggregate quantities by product to handle duplicate productIds correctly
    const productQuantities = new Map<string, number>();
    for (const item of data.items) {
      productQuantities.set(item.productId, (productQuantities.get(item.productId) || 0) + 1);
    }

    for (const [productId, quantity] of productQuantities) {
      // Lock and check product stock (FOR UPDATE prevents concurrent races)
      const [product] = await tx.unsafe(
        "SELECT stock, model FROM products WHERE id = $1 FOR UPDATE",
        [productId],
      );
      if (!product || Number(product.stock) < quantity) {
        throw new Error(
          `Insufficient stock for ${product?.model || productId}: need ${quantity}, have ${product?.stock ?? 0}`,
        );
      }
    }

    // Check each serial number is In Stock
    for (const item of data.items) {
      if (!item.sn.startsWith("NOSN-")) {
        const [snRow] = await tx.unsafe(
          "SELECT status FROM serial_numbers WHERE sn = $1 FOR UPDATE",
          [item.sn],
        );
        if (!snRow || snRow.status !== "In Stock") {
          throw new Error(
            `Serial number ${item.sn} is not available (status: ${snRow?.status || "not found"})`,
          );
        }
      }
    }

    // --- All checks passed — proceed with writes ---
    await tx.unsafe(
      "INSERT INTO sales (id, customer_id, customer_name, subtotal, tax, tax_enabled, total, payment_method, staff_name, notes, due_date, is_paid, amount_paid, installments) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)",
      [
        data.id,
        data.customerId,
        data.customerName,
        String(data.subtotal),
        String(data.tax),
        data.taxEnabled,
        String(data.total),
        data.paymentMethod,
        data.staffName,
        data.notes || null,
        data.dueDate || null,
        data.isPaid ?? false,
        String(amountPaid),
        installmentsJson,
      ],
    );

    for (const item of data.items) {
      // Look up product brand if not provided
      let brand = item.brand;
      if (!brand) {
        const [product] = await tx.unsafe("SELECT brand FROM products WHERE id = $1", [
          item.productId,
        ]);
        brand = product?.brand as string | undefined;
      }
      await tx.unsafe(
        "INSERT INTO sale_items (sale_id, product_id, brand, model, sn, price, cogs, warranty_expiry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          data.id,
          item.productId,
          brand || null,
          item.model,
          item.sn,
          String(item.price),
          String(item.cogs),
          item.warrantyExpiry,
        ],
      );

      // Only update SN status if it's a real serial number (not NOSN-xxx)
      if (!item.sn.startsWith("NOSN-")) {
        await tx.unsafe("UPDATE serial_numbers SET status = $1 WHERE sn = $2", ["Sold", item.sn]);
      }

      // Deduct stock — safe because we already verified stock > 0 with FOR UPDATE
      await tx.unsafe("UPDATE products SET stock = stock - 1 WHERE id = $1", [item.productId]);

      // Audit log - differentiate between SN and non-SN items
      const snLabel = item.sn.startsWith("NOSN-") ? "tanpa SN" : `SN: ${item.sn}`;
      await tx.unsafe(
        "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
        [
          `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          data.staffName,
          "Sales Deduction",
          `Sold 1 unit of ${item.model} (${snLabel}) to ${data.customerName}`,
          item.productId,
        ],
      );
    }

    await tx.unsafe(
      "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
      [
        `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        data.staffName,
        "Sale Created",
        `Sale ${data.id} - ${data.items.length} item(s), Total: Rp ${new Intl.NumberFormat("id-ID").format(data.total)}, Customer: ${data.customerName}`,
        data.id,
      ],
    );

    // Award loyalty points only for immediate-payment sales (Cash/Debit/QRIS/Transfer).
    // Utang sales get points when marked as paid (markSaleAsPaid / recordInstallment).
    if (data.isPaid !== false) {
      const pointsEarned = Math.floor(data.total / 1000);
      await tx.unsafe(
        "UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2",
        [pointsEarned, data.customerId],
      );
    }

    // The transaction commits automatically when the callback returns.
    // Fetch and return the newly created sale.
    const result = await tx.unsafe("SELECT * FROM sales WHERE id = $1", [data.id]);
    return parseDbSale(result[0]);
  });
};

export const getAllSaleItemsHandler = async () => {
  const result = await client.unsafe("SELECT * FROM sale_items ORDER BY id DESC");
  return result.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    saleId: row.sale_id as string,
    productId: row.product_id as string,
    brand: row.brand as string | undefined,
    model: row.model as string,
    sn: row.sn as string,
    price: typeof row.price === "string" ? parseFloat(row.price) : (row.price as number),
    cogs: typeof row.cogs === "string" ? parseFloat(row.cogs) : (row.cogs as number),
    warrantyExpiry: row.warranty_expiry as string,
  }));
};

export const getSaleItemsBySaleIdHandler = async (saleId: string) => {
  const result = await client.unsafe("SELECT * FROM sale_items WHERE sale_id = $1", [saleId]);
  return result.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    saleId: row.sale_id as string,
    productId: row.product_id as string,
    brand: row.brand as string | undefined,
    model: row.model as string,
    sn: row.sn as string,
    price: typeof row.price === "string" ? parseFloat(row.price) : (row.price as number),
    cogs: typeof row.cogs === "string" ? parseFloat(row.cogs) : (row.cogs as number),
    warrantyExpiry: row.warranty_expiry as string,
  }));
};

export interface PaginatedWarrantyClaimsResult {
  claims: {
    id: string;
    sn: string;
    productModel: string;
    issue: string;
    status: string;
    createdAt: string;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllWarrantyClaimsHandler = async (
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedWarrantyClaimsResult> => {
  const offset = (page - 1) * limit;

  const result = await client.unsafe(
    "SELECT * FROM warranty_claims ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [limit, offset],
  );
  const countResult = await client.unsafe("SELECT COUNT(*) as count FROM warranty_claims");
  const total = Number(countResult[0]?.count) || 0;

  return {
    claims: result.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      sn: row.sn as string,
      productModel: row.product_model as string,
      issue: row.issue as string,
      status: row.status as string,
      createdAt: row.created_at as string,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const createWarrantyClaimHandler = async (data: {
  id: string;
  sn: string;
  productModel: string;
  issue: string;
  status?: string;
  staffName?: string;
}) => {
  const result = await client.unsafe(
    "INSERT INTO warranty_claims (id, sn, product_model, issue, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [data.id, data.sn, data.productModel, data.issue, data.status || "Pending"],
  );

  // Audit log for warranty claim creation
  const staffName = data.staffName || "System";
  await client.unsafe(
    "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
    [
      `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName,
      "Warranty Created",
      `Created warranty claim for ${data.productModel} (SN: ${data.sn}), issue: ${data.issue}`,
      data.id,
    ],
  );

  return {
    id: result[0].id as string,
    sn: result[0].sn as string,
    productModel: result[0].product_model as string,
    issue: result[0].issue as string,
    status: result[0].status as string,
    createdAt: result[0].created_at as string,
  };
};

export const updateWarrantyClaimHandler = async (
  id: string,
  status: string,
  staffName: string = "System",
) => {
  // Get old claim for audit logging
  const [oldClaim] = await client.unsafe("SELECT * FROM warranty_claims WHERE id = $1", [id]);
  if (!oldClaim) {
    throw new Error("Claim not found");
  }

  const result = await client.unsafe(
    "UPDATE warranty_claims SET status = $1 WHERE id = $2 RETURNING *",
    [status, id],
  );
  if (result.length === 0) {
    throw new Error("Claim not found");
  }

  // Audit log for warranty claim update
  await client.unsafe(
    "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
    [
      `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName,
      "Warranty Updated",
      `Updated warranty claim for ${oldClaim.product_model} (SN: ${oldClaim.sn}): status ${oldClaim.status} -> ${status}`,
      id,
    ],
  );

  return {
    id: result[0].id as string,
    sn: result[0].sn as string,
    productModel: result[0].product_model as string,
    issue: result[0].issue as string,
    status: result[0].status as string,
    createdAt: result[0].created_at as string,
  };
};

export const markSaleAsPaidHandler = async (saleId: string, staffName: string) => {
  // Fetch pre-update state to check if sale was already paid
  const [preUpdate] = await client.unsafe(
    "SELECT is_paid, customer_id, total FROM sales WHERE id = $1",
    [saleId],
  );
  if (!preUpdate) {
    throw new Error("Sale not found");
  }
  const wasAlreadyPaid = preUpdate.is_paid === true;

  const now = new Date().toISOString();

  const result = await client.unsafe(
    "UPDATE sales SET is_paid = true, paid_at = $1 WHERE id = $2 RETURNING *",
    [now, saleId],
  );

  if (result.length === 0) {
    throw new Error("Sale not found");
  }

  const sale = result[0];

  // Award loyalty points only if transitioning from unpaid → paid.
  // Prevents double-counting: immediate-payment sales already got points at creation.
  let pointsAwarded = 0;
  if (!wasAlreadyPaid) {
    pointsAwarded = Math.floor(Number(sale.total) / 1000);
    if (pointsAwarded > 0) {
      await client.unsafe(
        "UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2",
        [pointsAwarded, sale.customer_id],
      );
    }
  }

  const pointsLogMsg = wasAlreadyPaid
    ? "Loyalty points: already awarded at sale creation"
    : `Loyalty points awarded: ${pointsAwarded}`;

  await client.unsafe(
    "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
    [
      `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      staffName,
      "General",
      `Marked sale ${saleId} as paid. ${pointsLogMsg}`,
      saleId,
    ],
  );

  return {
    id: sale.id as string,
    customerId: sale.customer_id as string,
    customerName: sale.customer_name as string,
    subtotal:
      typeof sale.subtotal === "string" ? parseFloat(sale.subtotal) : (sale.subtotal as number),
    tax: typeof sale.tax === "string" ? parseFloat(sale.tax) : (sale.tax as number),
    total: typeof sale.total === "string" ? parseFloat(sale.total) : (sale.total as number),
    paymentMethod: sale.payment_method as string,
    staffName: sale.staff_name as string,
    dueDate: sale.due_date as string | undefined,
    isPaid: true,
    paidAt: sale.paid_at as string,
    timestamp: sale.timestamp as string,
  };
};

export const recordInstallmentHandler = async (
  saleId: string,
  amount: number,
  staffName: string,
) => {
  // Get current sale
  const saleResult = await client.unsafe("SELECT * FROM sales WHERE id = $1", [saleId]);
  if (saleResult.length === 0) {
    throw new Error("Sale not found");
  }
  const sale = saleResult[0];

  // Parse existing installments
  let installments: { amount: number; timestamp: string }[] = [];
  try {
    installments = JSON.parse(sale.installments || "[]");
  } catch {
    installments = [];
  }

  // Add new installment
  const now = new Date().toISOString();
  installments.push({ amount, timestamp: now });

  // Calculate new total paid
  const oldTotal = parseFloat(sale.amount_paid || "0");
  const newTotalPaid = oldTotal + amount;
  const saleTotal = parseFloat(sale.total);
  const isNowPaid = newTotalPaid >= saleTotal;

  const updateFields = isNowPaid
    ? "installments = $1, amount_paid = $2, is_paid = true, paid_at = $3"
    : "installments = $1, amount_paid = $2";
  const params = isNowPaid
    ? [JSON.stringify(installments), String(newTotalPaid), now, saleId]
    : [JSON.stringify(installments), String(newTotalPaid), saleId];

  const updateResult = await client.unsafe(
    `UPDATE sales SET ${updateFields} WHERE id = $${isNowPaid ? 4 : 3} RETURNING *`,
    params,
  );

  // Award loyalty points when installment completes payment (unpaid → paid transition).
  // Prevents double-counting: points are only awarded once, at the moment the sale becomes fully paid.
  let pointsAwarded = 0;
  if (isNowPaid && !sale.is_paid) {
    pointsAwarded = Math.floor(parseFloat(sale.total) / 1000);
    if (pointsAwarded > 0) {
      await client.unsafe(
        "UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2",
        [pointsAwarded, sale.customer_id],
      );
    }
  }

  // Audit log
  const pointsLogSuffix = isNowPaid ? `. Loyalty points awarded: ${pointsAwarded}` : "";
  await client.unsafe(
    "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
    [
      `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      staffName,
      "General",
      `Installment of Rp ${new Intl.NumberFormat("id-ID").format(amount)} recorded for sale ${saleId}. Total paid: Rp ${new Intl.NumberFormat("id-ID").format(newTotalPaid)}/Rp ${new Intl.NumberFormat("id-ID").format(saleTotal)}${isNowPaid ? " (FULLY PAID)" : ""}${pointsLogSuffix}`,
      saleId,
    ],
  );

  const updated = updateResult[0];
  let parsedInstallments: { amount: number; timestamp: string }[] = [];
  try {
    parsedInstallments = JSON.parse(updated.installments || "[]");
  } catch {
    parsedInstallments = [];
  }

  return {
    id: updated.id as string,
    customerId: updated.customer_id as string,
    customerName: updated.customer_name as string,
    subtotal:
      typeof updated.subtotal === "string"
        ? parseFloat(updated.subtotal)
        : (updated.subtotal as number),
    tax: typeof updated.tax === "string" ? parseFloat(updated.tax) : (updated.tax as number),
    total:
      typeof updated.total === "string" ? parseFloat(updated.total) : (updated.total as number),
    paymentMethod: updated.payment_method as string,
    staffName: updated.staff_name as string,
    dueDate: updated.due_date as string | undefined,
    isPaid: updated.is_paid as boolean,
    paidAt: updated.paid_at as string | undefined,
    amountPaid:
      typeof updated.amount_paid === "string"
        ? parseFloat(updated.amount_paid) || 0
        : (updated.amount_paid as number) || 0,
    installments: parsedInstallments,
    timestamp: updated.timestamp as string,
  };
};
