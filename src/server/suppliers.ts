import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { suppliers } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
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

export interface PaginatedSuppliersResult {
  suppliers: ReturnType<typeof parseDbSupplier>[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllSuppliers = async (page: number = 1, limit: number = 20): Promise<PaginatedSuppliersResult> => {
  const offset = (page - 1) * limit;
  
  const result = await db.select().from(suppliers).where(eq(suppliers.deleted, false)).orderBy(suppliers.name).limit(limit).offset(offset);
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(suppliers).where(eq(suppliers.deleted, false));
  const total = Number(countResult[0]?.count) || 0;
  
  return {
    suppliers: result.map(parseDbSupplier),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
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
  const result = await db.insert(suppliers).values({
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
