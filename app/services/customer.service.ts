import { db } from '../../src/db';
import { customers } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

export async function getAllCustomers() {
  return db.select().from(customers);
}

export async function getCustomerById(id: string) {
  const result = await db.select().from(customers).where(eq(customers.id, id));
  return result[0] || null;
}

export async function createCustomer(data: {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  npwp?: string;
  loyaltyPoints?: number;
}) {
  const result = await db.insert(customers).values(data).returning();
  return result[0];
}

export async function updateCustomer(
  id: string,
  data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    npwp?: string;
    loyaltyPoints?: number;
  }
) {
  const result = await db
    .update(customers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning();
  return result[0];
}

export async function updateCustomerPoints(id: string, points: number) {
  const result = await db
    .update(customers)
    .set({ loyaltyPoints: points, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning();
  return result[0];
}

export async function deleteCustomer(id: string) {
  await db.delete(customers).where(eq(customers.id, id));
}
