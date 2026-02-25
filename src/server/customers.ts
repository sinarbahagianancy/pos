import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { customers, sales, saleItems, serialNumbers } from '../db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema: { customers, sales, saleItems, serialNumbers } });

const parseDbCustomer = (row: Record<string, unknown>) => ({
  id: row.id as string,
  name: row.name as string,
  phone: row.phone as string | undefined,
  email: row.email as string | undefined,
  address: row.address as string | undefined,
  npwp: row.npwp as string | undefined,
  loyaltyPoints: typeof row.loyalty_points === 'string' ? parseInt(row.loyalty_points) : (row.loyalty_points as number),
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
  total: typeof row.total === 'string' ? parseFloat(row.total) : (row.total as number),
  paymentMethod: row.payment_method as string,
  staffName: row.staff_name as string,
  timestamp: row.timestamp as string,
});

export const getAllCustomersHandler = async () => {
  const result = await client.unsafe('SELECT * FROM customers ORDER BY name');
  return result.map(parseDbCustomer);
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
}) => {
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`);
    values.push(data.phone);
  }
  if (data.email !== undefined) {
    updates.push(`email = $${paramIndex++}`);
    values.push(data.email);
  }
  if (data.address !== undefined) {
    updates.push(`address = $${paramIndex++}`);
    values.push(data.address);
  }
  if (data.npwp !== undefined) {
    updates.push(`npwp = $${paramIndex++}`);
    values.push(data.npwp);
  }
  if (data.loyaltyPoints !== undefined) {
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

  return parseDbCustomer(result[0]);
};

export const deleteCustomerHandler = async (id: string) => {
  const hasSales = await client.unsafe('SELECT 1 FROM sales WHERE customer_id = $1 LIMIT 1', [id]);
  if (hasSales.length > 0) {
    throw new Error('Cannot delete customer with existing sales');
  }
  await client.unsafe('DELETE FROM customers WHERE id = $1', [id]);
};

export const getAllSalesHandler = async () => {
  const result = await client.unsafe('SELECT * FROM sales ORDER BY timestamp DESC');
  return result.map(parseDbSale);
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
  total: number;
  paymentMethod: string;
  staffName: string;
}) => {
  try {
    await client.unsafe(
      'INSERT INTO sales (id, customer_id, customer_name, subtotal, tax, total, payment_method, staff_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [data.id, data.customerId, data.customerName, String(data.subtotal), String(data.tax), String(data.total), data.paymentMethod, data.staffName]
    );

    for (const item of data.items) {
      await client.unsafe(
        'INSERT INTO sale_items (sale_id, product_id, model, sn, price, cogs, warranty_expiry) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [data.id, item.productId, item.model, item.sn, String(item.price), String(item.cogs), item.warrantyExpiry]
      );

      await client.unsafe(
        'UPDATE serial_numbers SET status = $1 WHERE sn = $2',
        ['Sold', item.sn]
      );
    }

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
