import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { customers, sales, saleItems, serialNumbers, auditLogs, products } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema: { customers, sales, saleItems, serialNumbers, auditLogs } });

const parseDbCustomer = (row: Record<string, unknown>) => ({
  id: row.id as string,
  name: row.name as string,
  phone: row.phone as string | undefined,
  email: row.email as string | undefined,
  address: row.address as string | undefined,
  npwp: row.npwp as string | undefined,
  loyaltyPoints: typeof row.loyalty_points === 'string' ? parseInt(row.loyalty_points) : (row.loyalty_points as number),
  deleted: row.deleted as boolean | undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

const parseDbSale = (row: Record<string, unknown>) => ({
  id: row.id as string,
  customerId: row.customer_id as string,
  customerName: row.customer_name as string,
  items: [],
  subtotal: typeof row.subtotal === 'string' ? parseFloat(row.subtotal) : (row.subtotal as number),
  tax: typeof row.tax === 'string' ? parseFloat(row.tax) : (row.tax as number),
  taxEnabled: row.tax_enabled as boolean,
  total: typeof row.total === 'string' ? parseFloat(row.total) : (row.total as number),
  paymentMethod: row.payment_method as string,
  staffName: row.staff_name as string,
  notes: row.notes as string | undefined,
  timestamp: row.timestamp as string,
});

export interface PaginatedCustomersResult {
  customers: ReturnType<typeof parseDbCustomer>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllCustomersHandler = async (page: number = 1, limit: number = 20): Promise<PaginatedCustomersResult> => {
  const offset = (page - 1) * limit;
  
  const result = await client.unsafe(`SELECT * FROM customers WHERE deleted = false ORDER BY name LIMIT ${limit} OFFSET ${offset}`);
  const countResult = await client.unsafe(`SELECT COUNT(*) as count FROM customers WHERE deleted = false`);
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
  const result = await client.unsafe('SELECT * FROM customers WHERE id = $1', [id]);
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
    'INSERT INTO customers (id, name, phone, email, address, npwp, loyalty_points) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [data.id, data.name, data.phone || null, data.email || null, data.address || null, data.npwp || null, data.loyaltyPoints || 0]
  );
  return parseDbCustomer(result[0]);
};

export const updateCustomerHandler = async (id: string, data: {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  npwp?: string;
  loyaltyPoints?: number;
  staffName?: string;
}) => {
  // Get old customer for audit logging
  const [oldCustomer] = await client.unsafe('SELECT * FROM customers WHERE id = $1', [id]);
  if (!oldCustomer) {
    throw new Error('Customer not found');
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
  if (data.loyaltyPoints !== undefined && data.loyaltyPoints !== parseInt(oldCustomer.loyalty_points || '0')) {
    updates.push(`loyalty_points = $${paramIndex++}`);
    values.push(data.loyaltyPoints);
  }

  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await client.unsafe(
    `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.length === 0) {
    throw new Error('Customer not found');
  }

  // Audit log for customer update
  const staffName = data.staffName || 'System';
  await client.unsafe(
    'INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())',
    [`LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`, staffName, 'General', `Updated customer: ${updates.filter(u => !u.includes('updated_at')).join(', ')}`, id]
  );

  return parseDbCustomer(result[0]);
};

export const deleteCustomerHandler = async (id: string, staffName: string = 'System') => {
  // Get customer name for audit logging
  const [customer] = await client.unsafe('SELECT name FROM customers WHERE id = $1', [id]);
  if (!customer) {
    throw new Error('Customer not found');
  }
  
  // Soft delete - set deleted = true
  await client.unsafe('UPDATE customers SET deleted = true, updated_at = NOW() WHERE id = $1', [id]);
  
  // Audit log for customer deletion
  await client.unsafe(
    'INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())',
    [`LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`, staffName, 'General', `Deleted customer: ${customer.name}`, id]
  );
};

export interface PaginatedSalesResult {
  sales: ReturnType<typeof parseDbSale>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllSalesHandler = async (page: number = 1, limit: number = 20): Promise<PaginatedSalesResult> => {
  const offset = (page - 1) * limit;
  
  const salesResult = await client.unsafe(`SELECT * FROM sales ORDER BY timestamp DESC LIMIT ${limit} OFFSET ${offset}`);
  const countResult = await client.unsafe('SELECT COUNT(*) as count FROM sales');
  const total = Number(countResult[0]?.count) || 0;

  const salesWithItems = await Promise.all(salesResult.map(async (sale: Record<string, unknown>) => {
    const itemsResult = await client.unsafe(
      'SELECT * FROM sale_items WHERE sale_id = $1',
      [sale.id]
    );
    const items = itemsResult.map((item: Record<string, unknown>) => ({
      productId: item.product_id as string,
      model: item.model as string,
      sn: item.sn as string,
      price: typeof item.price === 'string' ? parseFloat(item.price) : (item.price as number),
      cogs: typeof item.cogs === 'string' ? parseFloat(item.cogs) : (item.cogs as number),
      warrantyExpiry: item.warranty_expiry as string
    }));

    return {
      id: sale.id as string,
      customerId: sale.customer_id as string,
      customerName: sale.customer_name as string,
      items,
      subtotal: typeof sale.subtotal === 'string' ? parseFloat(sale.subtotal) : (sale.subtotal as number),
      tax: typeof sale.tax === 'string' ? parseFloat(sale.tax) : (sale.tax as number),
      taxEnabled: sale.tax_enabled as boolean,
      total: typeof sale.total === 'string' ? parseFloat(sale.total) : (sale.total as number),
      paymentMethod: sale.payment_method as string,
      staffName: sale.staff_name as string,
      notes: sale.notes as string | undefined,
      dueDate: sale.due_date as string | undefined,
      isPaid: sale.is_paid as boolean,
      paidAt: sale.paid_at as string | undefined,
      timestamp: sale.timestamp as string,
    };
  }));

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
    'SELECT * FROM sales WHERE customer_id = $1 ORDER BY timestamp DESC',
    [customerId]
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
}) => {
  try {
    await client.unsafe(
      'INSERT INTO sales (id, customer_id, customer_name, subtotal, tax, tax_enabled, total, payment_method, staff_name, notes, due_date, is_paid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
      [data.id, data.customerId, data.customerName, String(data.subtotal), String(data.tax), data.taxEnabled, String(data.total), data.paymentMethod, data.staffName, data.notes || null, data.dueDate || null, data.isPaid ?? false]
    );

    for (const item of data.items) {
      await client.unsafe(
        'INSERT INTO sale_items (sale_id, product_id, model, sn, price, cogs, warranty_expiry) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [data.id, item.productId, item.model, item.sn, String(item.price), String(item.cogs), item.warrantyExpiry]
      );

      // Only update SN status if it's a real serial number (not NOSN-xxx)
      if (!item.sn.startsWith('NOSN-')) {
        await client.unsafe(
          'UPDATE serial_numbers SET status = $1 WHERE sn = $2',
          ['Sold', item.sn]
        );
      }

      // Always deduct stock
      await client.unsafe(
        'UPDATE products SET stock = stock - 1 WHERE id = $1',
        [item.productId]
      );

      // Audit log - differentiate between SN and non-SN items
      const snLabel = item.sn.startsWith('NOSN-') ? 'tanpa SN' : `SN: ${item.sn}`;
      await client.unsafe(
        'INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())',
        [`LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`, data.staffName, 'Sales Deduction', `Sold 1 unit of ${item.model} (${snLabel}) to ${data.customerName}`, item.productId]
      );
    }

    await client.unsafe(
      'INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())',
      [`LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`, data.staffName, 'Sale Created', `Sale ${data.id} - ${data.items.length} item(s), Total: ${data.total}, Customer: ${data.customerName}`, data.id]
    );

    const pointsEarned = Math.floor(data.total / 1000);
    await client.unsafe(
      'UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2',
      [pointsEarned, data.customerId]
    );

    const result = await client.unsafe('SELECT * FROM sales WHERE id = $1', [data.id]);
    return parseDbSale(result[0]);
  } catch (err) {
    console.error('Sale creation failed:', err);
    throw err;
  }
};

export const getAllSaleItemsHandler = async () => {
  const result = await client.unsafe('SELECT * FROM sale_items ORDER BY id DESC');
  return result.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    saleId: row.sale_id as string,
    productId: row.product_id as string,
    model: row.model as string,
    sn: row.sn as string,
    price: typeof row.price === 'string' ? parseFloat(row.price) : (row.price as number),
    cogs: typeof row.cogs === 'string' ? parseFloat(row.cogs) : (row.cogs as number),
    warrantyExpiry: row.warranty_expiry as string,
  }));
};

export const getSaleItemsBySaleIdHandler = async (saleId: string) => {
  const result = await client.unsafe('SELECT * FROM sale_items WHERE sale_id = $1', [saleId]);
  return result.map((row: Record<string, unknown>) => ({
    id: row.id as string,
    saleId: row.sale_id as string,
    productId: row.product_id as string,
    model: row.model as string,
    sn: row.sn as string,
    price: typeof row.price === 'string' ? parseFloat(row.price) : (row.price as number),
    cogs: typeof row.cogs === 'string' ? parseFloat(row.cogs) : (row.cogs as number),
    warrantyExpiry: row.warranty_expiry as string,
  }));
};

export interface PaginatedWarrantyClaimsResult {
  claims: { id: string; sn: string; productModel: string; issue: string; status: string; createdAt: string }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllWarrantyClaimsHandler = async (page: number = 1, limit: number = 20): Promise<PaginatedWarrantyClaimsResult> => {
  const offset = (page - 1) * limit;
  
  const result = await client.unsafe(`SELECT * FROM warranty_claims ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
  const countResult = await client.unsafe('SELECT COUNT(*) as count FROM warranty_claims');
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
    'INSERT INTO warranty_claims (id, sn, product_model, issue, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [data.id, data.sn, data.productModel, data.issue, data.status || 'Pending']
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
    'UPDATE warranty_claims SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  if (result.length === 0) {
    throw new Error('Claim not found');
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
    'UPDATE sales SET is_paid = true, paid_at = $1 WHERE id = $2 RETURNING *',
    [now, saleId]
  );
  
  if (result.length === 0) {
    throw new Error('Sale not found');
  }
  
  const sale = result[0];
  
  const pointsEarned = Math.floor(Number(sale.total) / 1000);
  if (pointsEarned > 0) {
    await client.unsafe(
      'UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2',
      [pointsEarned, sale.customer_id]
    );
  }
  
  await client.unsafe(
    'INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())',
    [`LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`, staffName, 'General', `Marked sale ${saleId} as paid. Loyalty points awarded: ${pointsEarned}`, saleId]
  );
  
  return {
    id: sale.id as string,
    customerId: sale.customer_id as string,
    customerName: sale.customer_name as string,
    subtotal: typeof sale.subtotal === 'string' ? parseFloat(sale.subtotal) : (sale.subtotal as number),
    tax: typeof sale.tax === 'string' ? parseFloat(sale.tax) : (sale.tax as number),
    total: typeof sale.total === 'string' ? parseFloat(sale.total) : (sale.total as number),
    paymentMethod: sale.payment_method as string,
    staffName: sale.staff_name as string,
    dueDate: sale.due_date as string | undefined,
    isPaid: true,
    paidAt: sale.paid_at as string,
    timestamp: sale.timestamp as string,
  };
};
