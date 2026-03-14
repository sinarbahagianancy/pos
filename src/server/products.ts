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
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set! Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')));
  throw new Error('DATABASE_URL is not set');
}

console.log('Connecting to database with URL:', connectionString.substring(0, 50) + '...');

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema: { products, serialNumbers, auditLogs } });

console.log('Database client initialized');

// Ensure has_serial_number column exists and fix all products based on actual serial numbers
try {
  await client.unsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS has_serial_number boolean DEFAULT true`);
  
  // Fix ALL products based on whether they have serial numbers in the serial_numbers table
  await client.unsafe(`
    UPDATE products 
    SET has_serial_number = true 
    WHERE EXISTS (SELECT 1 FROM serial_numbers WHERE serial_numbers.product_id = products.id)
  `);
  
  await client.unsafe(`
    UPDATE products 
    SET has_serial_number = false 
    WHERE NOT EXISTS (SELECT 1 FROM serial_numbers WHERE serial_numbers.product_id = products.id)
  `);
} catch (e) {
  console.log('Migration check (may be ok):', e);
}

export const getAllProducts = async () => {
  // Use direct SQL to avoid any Drizzle ORM issues
  const rawResult = await client.unsafe(`
    SELECT 
      p.id, p.brand, p.model, p.category, p.mount, p.condition,
      p.price, p.cogs, p.warranty_months, p.warranty_type, p.stock,
      p.has_serial_number, p.supplier, p.date_restocked, p.hidden, p.deleted,
      (SELECT COUNT(*) FROM serial_numbers sn WHERE sn.product_id = p.id) as sn_count
    FROM products p
    WHERE p.deleted = false
  `);
  
  return rawResult.map((row: any) => parseDbProduct(row));
};

export const getProductById = async (id: string) => {
  const result = await db.select().from(products).where(eq(products.id, id));
  return result[0] ? parseDbProduct(result[0]) : null;
};

export const createProduct = async (input: unknown) => {
  const validated = validateCreateProductInput(input);
  
  const hasSerialNumber = validated.hasSerialNumber === true;
  const stockCount = hasSerialNumber 
    ? (validated.serialNumbers?.length || 0) 
    : (validated.quantity || 0);
  
  const result = await db.insert(products).values({
    id: validated.id,
    brand: validated.brand,
    model: validated.model,
    category: validated.category,
    mount: validated.mount ?? null,
    condition: validated.condition,
    price: validated.price.toString(),
    cogs: validated.cogs.toString(),
    warrantyMonths: validated.warrantyMonths,
    warrantyType: validated.warrantyType,
    stock: stockCount,
    hasSerialNumber: hasSerialNumber,
    supplier: validated.supplier || null,
    dateRestocked: validated.dateRestocked ? new Date(validated.dateRestocked) : new Date(),
  }).returning();
  
  const newProduct = result[0];
  
  if (hasSerialNumber && validated.serialNumbers && validated.serialNumbers.length > 0) {
    for (const sn of validated.serialNumbers) {
      // Check if SN already exists
      const existing = await db.select().from(serialNumbers).where(eq(serialNumbers.sn, sn));
      if (existing.length > 0) {
        console.error('SN already exists:', sn, 'belongs to product:', existing[0].productId);
        throw new Error(`Serial number ${sn} already exists in the system`);
      }
      try {
        await db.insert(serialNumbers).values({
          sn: sn,
          productId: newProduct.id,
          status: 'In Stock',
        });
      } catch (err: any) {
        console.error('Error inserting SN:', sn, err);
        throw new Error(`Failed to insert serial number ${sn}: ${err.message}`);
      }
    }
    
    await db.insert(auditLogs).values({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName: 'System',
      action: 'Stock Addition',
      details: `Created product ${validated.brand} ${validated.model} with ${validated.serialNumbers.length} serial numbers from supplier ${validated.supplier}`,
      relatedId: newProduct.id,
    });
  } else if (!hasSerialNumber && validated.quantity && validated.quantity > 0) {
    await db.insert(auditLogs).values({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName: 'System',
      action: 'Stock Addition',
      details: `Created product ${validated.brand} ${validated.model} with ${validated.quantity} units from supplier ${validated.supplier}`,
      relatedId: newProduct.id,
    });
  }
  
  return parseDbProduct(newProduct);
};

export const updateProduct = async (id: string, input: unknown, staffName: string = 'System') => {
  const validated = validateUpdateProductInput(input);
  
  // Get old product for audit logging
  const [oldProduct] = await db.select().from(products).where(eq(products.id, id));
  if (!oldProduct) {
    throw new Error('Product not found');
  }
  
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  const changes: string[] = [];
  
  if (validated.brand !== undefined && validated.brand !== oldProduct.brand) {
    updateData.brand = validated.brand;
    changes.push(`brand: ${oldProduct.brand} -> ${validated.brand}`);
  }
  if (validated.model !== undefined && validated.model !== oldProduct.model) {
    updateData.model = validated.model;
    changes.push(`model: ${oldProduct.model} -> ${validated.model}`);
  }
  if (validated.category !== undefined && validated.category !== oldProduct.category) {
    updateData.category = validated.category;
    changes.push(`category: ${oldProduct.category} -> ${validated.category}`);
  }
  if (validated.mount !== undefined && validated.mount !== oldProduct.mount) {
    updateData.mount = validated.mount;
    changes.push(`mount: ${oldProduct.mount} -> ${validated.mount}`);
  }
  if (validated.condition !== undefined && validated.condition !== oldProduct.condition) {
    updateData.condition = validated.condition;
    changes.push(`condition: ${oldProduct.condition} -> ${validated.condition}`);
  }
  if (validated.price !== undefined) {
    const newPrice = validated.price.toString();
    if (newPrice !== oldProduct.price) {
      updateData.price = newPrice;
      changes.push(`price: ${oldProduct.price} -> ${newPrice}`);
    }
  }
  if (validated.cogs !== undefined) {
    const newCogs = validated.cogs.toString();
    if (newCogs !== oldProduct.cogs) {
      updateData.cogs = newCogs;
      changes.push(`cogs: ${oldProduct.cogs} -> ${newCogs}`);
    }
  }
  if (validated.warrantyMonths !== undefined && validated.warrantyMonths !== oldProduct.warrantyMonths) {
    updateData.warrantyMonths = validated.warrantyMonths;
    changes.push(`warrantyMonths: ${oldProduct.warrantyMonths} -> ${validated.warrantyMonths}`);
  }
  if (validated.warrantyType !== undefined && validated.warrantyType !== oldProduct.warrantyType) {
    updateData.warrantyType = validated.warrantyType;
    changes.push(`warrantyType: ${oldProduct.warrantyType} -> ${validated.warrantyType}`);
  }
  
  if (changes.length > 0) {
    await db.insert(auditLogs).values({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName,
      action: 'Product Update',
      details: `Updated ${oldProduct.brand} ${oldProduct.model}: ${changes.join(', ')}`,
      relatedId: id,
    });
  }
  
  const result = await db.update(products).set(updateData).where(eq(products.id, id)).returning();
  
  return result[0] ? parseDbProduct(result[0]) : null;
};

export const adjustStock = async (
  productId: string, 
  newStock: number, 
  reason: string, 
  staffName: string = 'System',
  supplier?: string,
  dateRestocked?: string
) => {
  validateStockAdjustmentInput({ productId, newStock, reason });
  
  const [product] = await db.select().from(products).where(eq(products.id, productId));
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  const diff = newStock - Number(product.stock);
  const actionType = diff > 0 ? 'Stock Addition' : 'Manual Correction';
  
  // Update fields - only update supplier and dateRestocked when adding stock (positive diff)
  const updateData: any = { stock: newStock, updatedAt: new Date() };
  if (diff > 0 && supplier) {
    updateData.supplier = supplier;
  }
  if (diff > 0 && dateRestocked) {
    updateData.dateRestocked = new Date(dateRestocked);
  }
  
  const [result] = await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, productId))
    .returning();
  
  // Build audit log details with supplier and date info
  let auditDetails = `Manual adjust ${product.brand} ${product.model}: ${product.stock} -> ${newStock}. Reason: ${reason}`;
  if (diff > 0) {
    if (supplier) {
      auditDetails += `. Supplier: ${supplier}`;
    }
    if (dateRestocked) {
      auditDetails += `. Date: ${dateRestocked}`;
    }
  }
  
  await db.insert(auditLogs).values({
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    staffName,
    action: actionType,
    details: auditDetails,
    relatedId: productId,
  });
  
  return result ? parseDbProduct(result) : null;
};

export const deleteProduct = async (id: string) => {
  // Soft delete - mark as deleted
  await db.update(products).set({ deleted: true }).where(eq(products.id, id));
};

export const toggleProductHidden = async (id: string, hidden: boolean) => {
  const result = await db.update(products).set({ hidden: hidden ? 1 : 0 }).where(eq(products.id, id)).returning();
  return result[0] ? parseDbProduct(result[0]) : null;
};

export const restoreProduct = async (id: string) => {
  const result = await db.update(products).set({ deleted: false }).where(eq(products.id, id)).returning();
  return result[0] ? parseDbProduct(result[0]) : null;
};

export const getAllSerialNumbers = async () => {
  const result = await db.select({
    sn: serialNumbers.sn,
    productId: serialNumbers.productId,
    status: serialNumbers.status,
    createdAt: serialNumbers.createdAt,
  }).from(serialNumbers);
  
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

export const createSerialNumbersBulk = async (
  inputs: unknown[],
  supplier?: string,
  date?: string,
  reason?: string
) => {
  const validated = inputs.map(validateCreateSerialNumberInput);
  
  const values = validated.map(v => ({
    sn: v.sn,
    productId: v.productId,
    status: 'In Stock' as const,
  }));
  
  const result = await db.insert(serialNumbers).values(values).returning();
  
  // Create audit log with supplier, date, and reason info
  if (validated.length > 0 && validated[0].productId) {
    const [product] = await db.select().from(products).where(eq(products.id, validated[0].productId));
    const snList = validated.map(v => v.sn).join(', ');
    const supplierInfo = supplier || 'Unknown';
    const dateInfo = date || new Date().toISOString().split('T')[0];
    const reasonInfo = reason || 'Not specified';
    
    await db.insert(auditLogs).values({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName: 'System',
      action: 'Stock Addition',
      details: `Added ${validated.length} serial number(s) to ${product?.brand || ''} ${product?.model || ''} from supplier ${supplierInfo} on ${dateInfo}, reason: ${reasonInfo}. SN: ${snList}`,
      relatedId: validated[0].productId,
    });
  }
  
  return result.map(parseDbSerialNumber);
};

export const updateSerialNumberStatus = async (
  sn: string, 
  status: 'In Stock' | 'Sold' | 'Claimed' | 'Damaged',
  reason?: string
) => {
  // Get the SN to find product info before updating
  const [existingSN] = await db.select().from(serialNumbers).where(eq(serialNumbers.sn, sn));
  
  const [result] = await db
    .update(serialNumbers)
    .set({ status })
    .where(eq(serialNumbers.sn, sn))
    .returning();
  
  // Create audit log for status change
  if (existingSN) {
    const [product] = await db.select().from(products).where(eq(products.id, existingSN.productId));
    const reasonInfo = reason || 'Not specified';
    
    await db.insert(auditLogs).values({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName: 'System',
      action: 'Manual Correction',
      details: `Marked serial number ${sn} as ${status} for ${product?.brand || ''} ${product?.model || ''}, reason: ${reasonInfo}`,
      relatedId: existingSN.productId,
    });
  }
  
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

export const getAllAuditLogs = async () => {
  const result = await db
    .select()
    .from(auditLogs)
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
