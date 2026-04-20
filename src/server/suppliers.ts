import { client, db } from "../db";
import { suppliers, auditLogs } from "../db/schema";
import { eq, sql } from "drizzle-orm";

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

export const getAllSuppliers = async (
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedSuppliersResult> => {
  const offset = (page - 1) * limit;

  const result = await db
    .select()
    .from(suppliers)
    .where(eq(suppliers.deleted, false))
    .orderBy(suppliers.name)
    .limit(limit)
    .offset(offset);
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(suppliers)
    .where(eq(suppliers.deleted, false));
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

export const createSupplier = async (
  data: { name: string; phone?: string; address?: string },
  staffName: string = "System",
) => {
  const result = await db
    .insert(suppliers)
    .values({
      name: data.name,
      phone: data.phone,
      address: data.address,
    })
    .returning();

  const supplier = parseDbSupplier(result[0]);

  await db.insert(auditLogs).values({
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    staffName,
    action: "Supplier Created",
    details: `Created supplier: ${data.name}${data.phone ? `, phone: ${data.phone}` : ""}${data.address ? `, address: ${data.address}` : ""}`,
    relatedId: supplier.id,
  });

  return supplier;
};

export const updateSupplier = async (
  id: string,
  data: {
    name?: string;
    phone?: string;
    address?: string;
  },
  staffName: string = "System",
) => {
  // Get old supplier for audit logging
  const [oldSupplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
  if (!oldSupplier) return null;

  const updates: Record<string, unknown> = {};
  const changes: string[] = [];

  if (data.name !== undefined && data.name !== oldSupplier.name) {
    updates.name = data.name;
    changes.push(`name: ${oldSupplier.name} -> ${data.name}`);
  }
  if (data.phone !== undefined && data.phone !== oldSupplier.phone) {
    updates.phone = data.phone;
    changes.push(`phone: ${oldSupplier.phone || "-"} -> ${data.phone || "-"}`);
  }
  if (data.address !== undefined && data.address !== oldSupplier.address) {
    updates.address = data.address;
    changes.push(`address: ${oldSupplier.address || "-"} -> ${data.address || "-"}`);
  }

  if (Object.keys(updates).length === 0) {
    return parseDbSupplier(oldSupplier);
  }

  const result = await db.update(suppliers).set(updates).where(eq(suppliers.id, id)).returning();

  if (changes.length > 0) {
    await db.insert(auditLogs).values({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName,
      action: "Supplier Updated",
      details: `Updated supplier ${oldSupplier.name}: ${changes.join(", ")}`,
      relatedId: id,
    });
  }

  return result.length > 0 ? parseDbSupplier(result[0]) : null;
};

export const deleteSupplier = async (id: string, staffName: string = "System") => {
  // Get supplier name for audit logging
  const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
  if (!supplier) return;

  await db.update(suppliers).set({ deleted: true }).where(eq(suppliers.id, id));

  await db.insert(auditLogs).values({
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    staffName,
    action: "Supplier Deleted",
    details: `Deleted supplier: ${supplier.name}`,
    relatedId: id,
  });
};
