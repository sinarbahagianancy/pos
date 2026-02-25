import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { products, serialNumbers, auditLogs } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { 
  validateCreateProductInput,
  validateUpdateProductInput,
  validateStockAdjustmentInput,
  validateCreateSerialNumberInput,
  parseDbProduct,
  parseDbSerialNumber
} from '../../app/schemas/product.schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set! Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
  throw new Error('DATABASE_URL is not set');
}

console.log('Connecting to database with URL:', connectionString.substring(0, 50) + '...');

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema: { products, serialNumbers, auditLogs } });

console.log('Database client initialized');

export const getAllProducts = async () => {
  const result = await db.select().from(products);
  return result.map(parseDbProduct);
};

export const getProductById = async (id: string) => {
  const result = await db.select().from(products).where(eq(products.id, id));
  return result[0] ? parseDbProduct(result[0]) : null;
};

export const createProduct = async (input: unknown) => {
  const validated = validateCreateProductInput(input);
  
  const result = await db.insert(products).values({
    id: validated.id,
    brand: validated.brand,
    model: validated.model,
    category: validated.category,
    mount: validated.mount,
    condition: validated.condition,
    price: validated.price.toString(),
    cogs: validated.cogs.toString(),
    warrantyMonths: validated.warrantyMonths,
    warrantyType: validated.warrantyType,
    stock: validated.stock,
  }).returning();
  
  return parseDbProduct(result[0]);
};

export const updateProduct = async (id: string, input: unknown) => {
  const validated = validateUpdateProductInput(input);
  
  const updateData: Record<string, unknown> = { ...validated, updatedAt: new Date() };
  
  if (validated.price !== undefined) {
    updateData.price = validated.price.toString();
  }
  if (validated.cogs !== undefined) {
    updateData.cogs = validated.cogs.toString();
  }
  
  const result = await db.update(products).set(updateData).where(eq(products.id, id)).returning();
  
  return result[0] ? parseDbProduct(result[0]) : null;
};

export const adjustStock = async (
  productId: string, 
  newStock: number, 
  reason: string, 
  staffName: string = 'System'
) => {
  validateStockAdjustmentInput({ productId, newStock, reason });
  
  const [product] = await db.select().from(products).where(eq(products.id, productId));
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  const diff = newStock - Number(product.stock);
  const actionType = diff > 0 ? 'Stock Addition' : 'Manual Correction';
  
  const [result] = await db
    .update(products)
    .set({ stock: newStock, updatedAt: new Date() })
    .where(eq(products.id, productId))
    .returning();
  
  await db.insert(auditLogs).values({
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    staffName,
    action: actionType,
    details: `Manual adjust ${product.brand} ${product.model}: ${product.stock} -> ${newStock}. Reason: ${reason}`,
    relatedId: productId,
  });
  
  return result ? parseDbProduct(result) : null;
};

export const deleteProduct = async (id: string) => {
  await db.delete(products).where(eq(products.id, id));
};

export const getAllSerialNumbers = async () => {
  const result = await db.select().from(serialNumbers);
  return result.map(parseDbSerialNumber);
};

export const getAvailableSerialNumbers = async () => {
  const result = await db
    .select()
    .from(serialNumbers)
    .where(eq(serialNumbers.status, 'In Stock'));
  return result.map(parseDbSerialNumber);
};

export const getSerialNumbersByProduct = async (productId: string) => {
  const result = await db
    .select()
    .from(serialNumbers)
    .where(eq(serialNumbers.productId, productId));
  return result.map(parseDbSerialNumber);
};

export const createSerialNumber = async (input: unknown) => {
  const validated = validateCreateSerialNumberInput(input);
  
  const result = await db.insert(serialNumbers).values({
    sn: validated.sn,
    productId: validated.productId,
    status: 'In Stock',
  }).returning();
  
  return parseDbSerialNumber(result[0]);
};

export const createSerialNumbersBulk = async (inputs: unknown[]) => {
  const validated = inputs.map(validateCreateSerialNumberInput);
  
  const values = validated.map(v => ({
    sn: v.sn,
    productId: v.productId,
    status: 'In Stock' as const,
  }));
  
  const result = await db.insert(serialNumbers).values(values).returning();
  return result.map(parseDbSerialNumber);
};

export const updateSerialNumberStatus = async (
  sn: string, 
  status: 'In Stock' | 'Sold' | 'Claimed'
) => {
  const [result] = await db
    .update(serialNumbers)
    .set({ status })
    .where(eq(serialNumbers.sn, sn))
    .returning();
  
  return result ? parseDbSerialNumber(result) : null;
};

export const getAuditLogsByProduct = async (productId: string) => {
  const result = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.relatedId, productId))
    .orderBy(desc(auditLogs.timestamp));
  
  return result.map(r => ({
    id: r.id,
    staffName: r.staffName,
    action: r.action,
    details: r.details,
    timestamp: r.timestamp ?? null,
    relatedId: r.relatedId,
  }));
};
