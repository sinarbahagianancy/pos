import { db } from '../../src/db';
import { products, serialNumbers } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

export async function getAllProducts() {
  return db.select().from(products);
}

export async function getProductById(id: string) {
  const result = await db.select().from(products).where(eq(products.id, id));
  return result[0] || null;
}

export async function createProduct(data: {
  id: string;
  brand: string;
  model: string;
  category: 'Body' | 'Lens' | 'Accessory';
  mount?: string;
  condition: 'New' | 'Used';
  price: number;
  cogs: number;
  warrantyMonths: number;
  warrantyType: string;
  stock: number;
}) {
  const result = await db.insert(products).values(data as any).returning();
  return result[0];
}

export async function updateProductStock(id: string, stock: number) {
  const result = await db
    .update(products)
    .set({ stock, updatedAt: new Date() })
    .where(eq(products.id, id))
    .returning();
  return result[0];
}

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id));
}

export async function getAllSerialNumbers() {
  return db.select().from(serialNumbers);
}

export async function getAvailableSerialNumbers() {
  return db
    .select()
    .from(serialNumbers)
    .where(eq(serialNumbers.status, 'In Stock'));
}

export async function getSerialNumbersByProduct(productId: string) {
  return db
    .select()
    .from(serialNumbers)
    .where(eq(serialNumbers.productId, productId));
}

export async function createSerialNumber(data: { sn: string; productId: string }) {
  const result = await db.insert(serialNumbers).values(data as any).returning();
  return result[0];
}

export async function updateSerialNumberStatus(sn: string, status: 'In Stock' | 'Sold' | 'Claimed') {
  const result = await db
    .update(serialNumbers)
    .set({ status })
    .where(eq(serialNumbers.sn, sn))
    .returning();
  return result[0];
}
