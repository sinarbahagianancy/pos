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
  } catch { installments = []; }
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    customerName: row.customer_name as string,
    items: [],
    subtotal: typeof row.subtotal === "string" ? parseFloat(row.subtotal) : (row.subtotal as number),
    tax: typeof row.tax === "string" ? parseFloat(row.tax) : (row.tax as number),
    taxEnabled: row.tax_enabled as boolean,
    total: typeof row.total === "string" ? parseFloat(row.total) : (row.total as number),
    paymentMethod: row.payment_method as string,
    staffName: row.staff_name as string,
    notes: row.notes as string | undefined,
    dueDate: row.due_date as string | undefined,
    isPaid: row.is_paid as boolean,
    paidAt: row.paid_at as string | undefined,
    amountPaid: typeof row.amount_paid === "string" ? parseFloat(row.amount_paid) || 0 : (row.amount_paid as number) || 0,
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
    `SELECT * FROM customers WHERE deleted = false ORDER BY name LIMIT ${limit} OFFSET ${offset}`,
  );
  const countResult = await client.unsafe(
    `SELECT COUNT(*) as count FROM customers WHERE deleted = false`,
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
  let paramIndex = 1;

  if (data.name !== undefined && data.name !== oldCustomer.name) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.phone !== undefined && data.phone !== oldCustomer.phone) {
    updates.push(`phone = $${paramIndex++}`);
    values.push(data.phone);
  }
  if (data.email !== undefined && data.email !== oldCustomer.email) {
    updates.push(`email = $${paramIndex++}`);
    values.push(data.email);
  }
  if (data.address !== undefined && data.address !== oldCustomer.address) {
    updates.push(`address = $${paramIndex++}`);
    values.push(data.address);
  }
  if (data.npwp !== undefined && data.npwp !== oldCustomer.npwp) {
    updates.push(`npwp = $${paramIndex++}`);
    values.push(data.npwp);
  }
  if (
    data.loyaltyPoints !== undefined &&
    data.loyaltyPoints !== parseInt(oldCustomer.loyalty_points || "0")
  ) {
    updates.push(`loyalty_points = $${paramIndex++}`);
    values.push(data.loyaltyPoints);
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
      "General",
      `Updated customer: ${updates.filter((u) => !u.includes("updated_at")).join(", ")}`,
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
      "General",
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

  const salesResult = await client.unsafe(
    `SELECT * FROM sales ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`,
  );
  const countResult = await client.unsafe("SELECT COUNT(*) as count FROM sales");
  const total = Number(countResult[0]?.count) || 0;

  const salesWithItems = await Promise.all(
    salesResult.map(async (sale: Record<string, unknown>) => {
      const itemsResult = await client.unsafe("SELECT * FROM sale_items WHERE sale_id = $1", [
        sale.id,
      ]);
      const items = itemsResult.map((item: Record<string, unknown>) => ({
        productId: item.product_id as string,
        model: item.model as string,
        sn: item.sn as string,
        price: typeof item.price === "string" ? parseFloat(item.price) : (item.price as number),
        cogs: typeof item.cogs === "string" ? parseFloat(item.cogs) : (item.cogs as number),
        warrantyExpiry: item.warranty_expiry as string,
      }));

      return {
        ...parseDbSale(sale),
        items,
      };
    }),
  );

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
  const installmentsJson = amountPaid > 0
    ? JSON.stringify([{ amount: amountPaid, timestamp: new Date().toISOString() }])
    : "[]";
  try {
    await client.unsafe(
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
      await client.unsafe(
        "INSERT INTO sale_items (sale_id, product_id, model, sn, price, cogs, warranty_expiry) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [
          data.id,
          item.productId,
          item.model,
          item.sn,
          String(item.price),
          String(item.cogs),
          item.warrantyExpiry,
        ],
      );

      // Only update SN status if it's a real serial number (not NOSN-xxx)
      if (!item.sn.startsWith("NOSN-")) {
        await client.unsafe("UPDATE serial_numbers SET status = $1 WHERE sn = $2", [
          "Sold",
          item.sn,
        ]);
      }

      // Always deduct stock
      await client.unsafe("UPDATE products SET stock = stock - 1 WHERE id = $1", [item.productId]);

      // Audit log - differentiate between SN and non-SN items
      const snLabel = item.sn.startsWith("NOSN-") ? "tanpa SN" : `SN: ${item.sn}`;
      await client.unsafe(
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

    await client.unsafe(
      "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
      [
        `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        data.staffName,
        "Sale Created",
        `Sale ${data.id} - ${data.items.length} item(s), Total: ${data.total}, Customer: ${data.customerName}`,
        data.id,
      ],
    );

    const pointsEarned = Math.floor(data.total / 1000);
    await client.unsafe(
      "UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2",
      [pointsEarned, data.customerId],
    );

    const result = await client.unsafe("SELECT * FROM sales WHERE id = $1", [data.id]);
    return parseDbSale(result[0]);
  } catch (err) {
    console.error("Sale creation failed:", err);
    throw err;
  }
};

export const getAllSaleItemsHandler = async () => {
  const result = await client.unsafe("SELECT * FROM sale_items ORDER BY id DESC");
  return result.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    saleId: row.sale_id as string,
    productId: row.product_id as string,
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
    `SELECT * FROM warranty_claims ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
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
}) => {
  const result = await client.unsafe(
    "INSERT INTO warranty_claims (id, sn, product_model, issue, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [data.id, data.sn, data.productModel, data.issue, data.status || "Pending"],
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

export const updateWarrantyClaimHandler = async (id: string, status: string) => {
  const result = await client.unsafe(
    "UPDATE warranty_claims SET status = $1 WHERE id = $2 RETURNING *",
    [status, id],
  );
  if (result.length === 0) {
    throw new Error("Claim not found");
  }
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
  const now = new Date().toISOString();

  const result = await client.unsafe(
    "UPDATE sales SET is_paid = true, paid_at = $1 WHERE id = $2 RETURNING *",
    [now, saleId],
  );

  if (result.length === 0) {
    throw new Error("Sale not found");
  }

  const sale = result[0];

  const pointsEarned = Math.floor(Number(sale.total) / 1000);
  if (pointsEarned > 0) {
    await client.unsafe(
      "UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2",
      [pointsEarned, sale.customer_id],
    );
  }

  await client.unsafe(
    "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
    [
      `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      staffName,
      "General",
      `Marked sale ${saleId} as paid. Loyalty points awarded: ${pointsEarned}`,
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

export const recordInstallmentHandler = async (saleId: string, amount: number, staffName: string) => {
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
  } catch { installments = []; }

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

  // Audit log
  await client.unsafe(
    "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
    [
      `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      staffName,
      "General",
      `Installment of ${amount} recorded for sale ${saleId}. Total paid: ${newTotalPaid}/${saleTotal}${isNowPaid ? " (FULLY PAID)" : ""}`,
      saleId,
    ],
  );

  const updated = updateResult[0];
  let parsedInstallments: { amount: number; timestamp: string }[] = [];
  try {
    parsedInstallments = JSON.parse(updated.installments || "[]");
  } catch { parsedInstallments = []; }

  return {
    id: updated.id as string,
    customerId: updated.customer_id as string,
    customerName: updated.customer_name as string,
    subtotal: typeof updated.subtotal === "string" ? parseFloat(updated.subtotal) : (updated.subtotal as number),
    tax: typeof updated.tax === "string" ? parseFloat(updated.tax) : (updated.tax as number),
    total: typeof updated.total === "string" ? parseFloat(updated.total) : (updated.total as number),
    paymentMethod: updated.payment_method as string,
    staffName: updated.staff_name as string,
    dueDate: updated.due_date as string | undefined,
    isPaid: updated.is_paid as boolean,
    paidAt: updated.paid_at as string | undefined,
    amountPaid: typeof updated.amount_paid === "string" ? parseFloat(updated.amount_paid) || 0 : (updated.amount_paid as number) || 0,
    installments: parsedInstallments,
    timestamp: updated.timestamp as string,
  };
};
