import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { suppliers } from '../db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema: { suppliers } });

const parseDbSupplier = (row: Record<string, unknown>) => ({
  id: row.id as string,
  name: row.name as string,
  phone: row.phone as string | undefined,
  address: row.address as string | undefined,
  deleted: row.deleted as boolean,
  createdAt: row.created_at as string,
});

export const getAllSuppliers = async () => {
  const result = await db.select().from(suppliers).where(eq(suppliers.deleted, false)).orderBy(suppliers.name);
  return result.map(parseDbSupplier);
};

export const getSupplierById = async (id: string) => {
  const result = await db.select().from(suppliers).where(eq(suppliers.id, id));
  if (result.length === 0) return null;
  return parseDbSupplier(result[0]);
};

export const createSupplier = async (data: {
  name: string;
  phone?: string;
  address?: string;
}) => {
  const id = `SUP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
  const result = await db.insert(suppliers).values({
    id,
    name: data.name,
    phone: data.phone,
    address: data.address,
  }).returning();
  
  return parseDbSupplier(result[0]);
};

export const updateSupplier = async (id: string, data: {
  name?: string;
  phone?: string;
  address?: string;
}) => {
  const updates: Record<string, unknown> = {};
  
  if (data.name !== undefined) updates.name = data.name;
  if (data.phone !== undefined) updates.phone = data.phone;
  if (data.address !== undefined) updates.address = data.address;
  
  if (Object.keys(updates).length === 0) {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return result.length > 0 ? parseDbSupplier(result[0]) : null;
  }
  
  const result = await db.update(suppliers).set(updates).where(eq(suppliers.id, id)).returning();
  return result.length > 0 ? parseDbSupplier(result[0]) : null;
};

export const deleteSupplier = async (id: string) => {
  await db.update(suppliers).set({ deleted: true }).where(eq(suppliers.id, id));
};
