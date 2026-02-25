import type { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL || '';

const client = postgres(connectionString, { prepare: false });

// Inline schema definitions for API route
const productsTable = {
  tableName: 'products',
  columns: {
    id: { name: 'id' },
    brand: { name: 'brand' },
    model: { name: 'model' },
    category: { name: 'category' },
    mount: { name: 'mount' },
    condition: { name: 'condition' },
    price: { name: 'price' },
    cogs: { name: 'cogs' },
    warrantyMonths: { name: 'warranty_months' },
    warrantyType: { name: 'warranty_type' },
    stock: { name: 'stock' },
    createdAt: { name: 'created_at' },
    updatedAt: { name: 'updated_at' },
  }
};

const serialNumbersTable = {
  tableName: 'serial_numbers',
  columns: {
    sn: { name: 'sn' },
    productId: { name: 'product_id' },
    status: { name: 'status' },
    createdAt: { name: 'created_at' },
  }
};

const auditLogsTable = {
  tableName: 'audit_logs',
  columns: {
    id: { name: 'id' },
    staffName: { name: 'staff_name' },
    action: { name: 'action' },
    details: { name: 'details' },
    relatedId: { name: 'related_id' },
    timestamp: { name: 'timestamp' },
  }
};

type ProductCategory = 'Body' | 'Lens' | 'Accessory';
type ConditionType = 'New' | 'Used';
type WarrantyType = 'Official Sony Indonesia' | 'Official Canon Indonesia' | 'Official Fujifilm Indonesia' | 'Distributor' | 'Store Warranty';
type MountType = 'E-mount' | 'RF-mount' | 'X-mount' | 'L-mount' | 'Z-mount' | 'M-mount' | undefined;
type SNStatus = 'In Stock' | 'Sold' | 'Claimed';

interface Product {
  id: string;
  brand: string;
  model: string;
  category: ProductCategory;
  mount?: MountType;
  condition: ConditionType;
  price: number;
  cogs: number;
  warrantyMonths: number;
  warrantyType: WarrantyType;
  stock: number;
}

interface SerialNumber {
  sn: string;
  productId: string;
  status: SNStatus;
}

const parseDbProduct = (row: Record<string, unknown>): Product => ({
  id: row.id as string,
  brand: row.brand as string,
  model: row.model as string,
  category: row.category as ProductCategory,
  mount: row.mount as MountType,
  condition: row.condition as ConditionType,
  price: typeof row.price === 'string' ? parseFloat(row.price) : (row.price as number),
  cogs: typeof row.cogs === 'string' ? parseFloat(row.cogs) : (row.cogs as number),
  warrantyMonths: row.warranty_months as number,
  warrantyType: row.warranty_type as WarrantyType,
  stock: row.stock as number,
});

const parseDbSerialNumber = (row: Record<string, unknown>): SerialNumber => ({
  sn: row.sn as string,
  productId: row.product_id as string,
  status: row.status as SNStatus,
});

// Validation functions
const ProductCategories: ProductCategory[] = ['Body', 'Lens', 'Accessory'];
const ConditionTypes: ConditionType[] = ['New', 'Used'];
const WarrantyTypes: WarrantyType[] = ['Official Sony Indonesia', 'Official Canon Indonesia', 'Official Fujifilm Indonesia', 'Distributor', 'Store Warranty'];
const MountTypes: MountType[] = ['E-mount', 'RF-mount', 'X-mount', 'L-mount', 'Z-mount', 'M-mount'];

const isProductCategory = (v: unknown): v is ProductCategory => ProductCategories.includes(v as ProductCategory);
const isConditionType = (v: unknown): v is ConditionType => ConditionTypes.includes(v as ConditionType);
const isWarrantyType = (v: unknown): v is WarrantyType => WarrantyTypes.includes(v as WarrantyType);
const isMountType = (v: unknown): v is MountType => v === undefined || MountTypes.includes(v as MountType);

interface CreateProductInput {
  id: string;
  brand: string;
  model: string;
  category: ProductCategory;
  mount?: MountType;
  condition: ConditionType;
  price: number;
  cogs: number;
  warrantyMonths: number;
  warrantyType: WarrantyType;
  stock: number;
}

interface UpdateProductInput {
  brand?: string;
  model?: string;
  category?: ProductCategory;
  mount?: MountType;
  condition?: ConditionType;
  price?: number;
  cogs?: number;
  warrantyMonths?: number;
  warrantyType?: WarrantyType;
  stock?: number;
}

interface StockAdjustmentInput {
  productId: string;
  newStock: number;
  reason: string;
}

interface CreateSerialNumberInput {
  sn: string;
  productId: string;
}

const validateCreateProductInput = (input: unknown): CreateProductInput => {
  if (!input || typeof input !== 'object') throw new Error('Invalid input');
  const obj = input as Record<string, unknown>;
  
  if (typeof obj.id !== 'string' || !obj.id) throw new Error('Invalid id');
  if (typeof obj.brand !== 'string' || !obj.brand) throw new Error('Invalid brand');
  if (typeof obj.model !== 'string' || !obj.model) throw new Error('Invalid model');
  if (!isProductCategory(obj.category)) throw new Error('Invalid category');
  if (!isConditionType(obj.condition)) throw new Error('Invalid condition');
  if (typeof obj.price !== 'number' || obj.price <= 0) throw new Error('Invalid price');
  if (typeof obj.cogs !== 'number' || obj.cogs < 0) throw new Error('Invalid cogs');
  if (typeof obj.warrantyMonths !== 'number' || obj.warrantyMonths < 0) throw new Error('Invalid warrantyMonths');
  if (!isWarrantyType(obj.warrantyType)) throw new Error('Invalid warrantyType');
  if (typeof obj.stock !== 'number' || obj.stock < 0) throw new Error('Invalid stock');
  
  return {
    id: obj.id as string,
    brand: obj.brand as string,
    model: obj.model as string,
    category: obj.category as ProductCategory,
    mount: obj.mount as MountType,
    condition: obj.condition as ConditionType,
    price: obj.price as number,
    cogs: obj.cogs as number,
    warrantyMonths: obj.warrantyMonths as number,
    warrantyType: obj.warrantyType,
    stock: obj.stock,
  };
};

const validateUpdateProductInput = (input: unknown): UpdateProductInput => {
  if (!input || typeof input !== 'object') throw new Error('Invalid input');
  const obj = input as Record<string, unknown>;
  const result: UpdateProductInput = {};
  
  if (obj.brand !== undefined) result.brand = obj.brand as string;
  if (obj.model !== undefined) result.model = obj.model as string;
  if (obj.category !== undefined) result.category = obj.category as ProductCategory;
  if (obj.mount !== undefined) result.mount = obj.mount as MountType;
  if (obj.condition !== undefined) result.condition = obj.condition as ConditionType;
  if (obj.price !== undefined) result.price = obj.price as number;
  if (obj.cogs !== undefined) result.cogs = obj.cogs as number;
  if (obj.warrantyMonths !== undefined) result.warrantyMonths = obj.warrantyMonths as number;
  if (obj.warrantyType !== undefined) result.warrantyType = obj.warrantyType as WarrantyType;
  if (obj.stock !== undefined) result.stock = obj.stock as number;
  
  return result;
};

const validateStockAdjustmentInput = (input: unknown): StockAdjustmentInput => {
  if (!input || typeof input !== 'object') throw new Error('Invalid input');
  const obj = input as Record<string, unknown>;
  
  if (typeof obj.productId !== 'string' || !obj.productId) throw new Error('Invalid productId');
  if (typeof obj.newStock !== 'number' || obj.newStock < 0) throw new Error('Invalid newStock');
  if (typeof obj.reason !== 'string' || !obj.reason) throw new Error('Invalid reason');
  
  return { productId: obj.productId, newStock: obj.newStock, reason: obj.reason };
};

const validateCreateSerialNumberInput = (input: unknown): CreateSerialNumberInput => {
  if (!input || typeof input !== 'object') throw new Error('Invalid input');
  const obj = input as Record<string, unknown>;
  
  if (typeof obj.sn !== 'string' || !obj.sn) throw new Error('Invalid sn');
  if (typeof obj.productId !== 'string' || !obj.productId) throw new Error('Invalid productId');
  
  return { sn: obj.sn, productId: obj.productId };
};

// DB Query helpers
const db = {
  select: async (table: string, columns: string[] = ['*'], where?: { column: string; value: unknown }) => {
    const cols = columns.join(', ');
    let query = `SELECT ${cols} FROM ${table}`;
    const params: (string | number | boolean | null)[] = [];
    
    if (where) {
      params.push(where.value as string | number | boolean | null);
      query += ` WHERE ${where.column} = $${params.length}`;
    }
    
    const result = await client.unsafe(query, params);
    return result;
  },
  
  insert: async (table: string, data: Record<string, unknown>[]) => {
    if (data.length === 0) return [];
    
    const keys = Object.keys(data[0]);
    const values = data.map(d => keys.map(k => d[k]));
    const placeholders = values.map((_, i) => 
      `(${keys.map((_, j) => `$${i * keys.length + j + 1}`).join(', ')})`
    ).join(', ');
    
    const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES ${placeholders} RETURNING *`;
    const flatValues = values.flat() as (string | number | boolean | null)[];
    const result = await client.unsafe(query, flatValues);
    return result;
  },
  
  update: async (table: string, data: Record<string, unknown>, where: { column: string; value: unknown }) => {
    const sets = Object.keys(data).map((k, i) => `${k} = $${i + 1}`).join(', ');
    const query = `UPDATE ${table} SET ${sets}, updated_at = NOW() WHERE ${where.column} = $${Object.keys(data).length + 1} RETURNING *`;
    const result = await client.unsafe(query, [...Object.values(data) as (string | number | boolean | null)[], where.value as string | number | boolean | null]);
    return result;
  },
  
  delete: async (table: string, where: { column: string; value: unknown }) => {
    const query = `DELETE FROM ${table} WHERE ${where.column} = $1`;
    await client.unsafe(query, [where.value as string | number | boolean | null]);
    return [];
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;

  try {
    // GET /api/products
    if (method === 'GET' && url === '/api/products') {
      const result = await db.select('products');
      return res.status(200).json(result.map(parseDbProduct));
    }

    // POST /api/products
    if (method === 'POST' && url === '/api/products') {
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const validated = validateCreateProductInput(input);
      
      const result = await db.insert('products', [{
        id: validated.id,
        brand: validated.brand,
        model: validated.model,
        category: validated.category,
        mount: validated.mount,
        condition: validated.condition,
        price: validated.price.toString(),
        cogs: validated.cogs.toString(),
        warranty_months: validated.warrantyMonths,
        warranty_type: validated.warrantyType,
        stock: validated.stock,
      }]);
      
      return res.status(201).json(parseDbProduct(result[0]));
    }

    // PUT /api/products/:id
    if (method === 'PUT' && url?.startsWith('/api/products/')) {
      const productId = url.replace('/api/products/', '');
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const validated = validateUpdateProductInput(input);
      
      const updateData: Record<string, unknown> = { ...validated };
      if (validated.price !== undefined) updateData.price = validated.price.toString();
      if (validated.cogs !== undefined) updateData.cogs = validated.cogs.toString();
      if (validated.warrantyMonths !== undefined) { updateData.warranty_months = validated.warrantyMonths; delete updateData.warrantyMonths; }
      if (validated.warrantyType !== undefined) { updateData.warranty_type = validated.warrantyType; delete updateData.warrantyType; }
      
      const result = await db.update('products', updateData, { column: 'id', value: productId });
      
      if (!result[0]) {
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.status(200).json(parseDbProduct(result[0]));
    }

    // POST /api/products/adjust-stock
    if (method === 'POST' && url === '/api/products/adjust-stock') {
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      validateStockAdjustmentInput(input);
      
      const { productId, newStock, reason, staffName = 'System' } = input;
      
      const [product] = await db.select('products', ['*'], { column: 'id', value: productId });
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      const diff = newStock - Number(product.stock);
      const actionType = diff > 0 ? 'Stock Addition' : 'Manual Correction';
      
      const [result] = await db.update('products', { stock: newStock }, { column: 'id', value: productId });
      
      await db.insert('audit_logs', [{
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        staff_name: staffName,
        action: actionType,
        details: `Manual adjust ${product.brand} ${product.model}: ${product.stock} -> ${newStock}. Reason: ${reason}`,
        related_id: productId,
      }]);
      
      return res.status(200).json(parseDbProduct(result));
    }

    // DELETE /api/products/:id
    if (method === 'DELETE' && url?.startsWith('/api/products/')) {
      const productId = url.replace('/api/products/', '');
      await db.delete('products', { column: 'id', value: productId });
      return res.status(204).send(null);
    }

    // GET /api/serial-numbers
    if (method === 'GET' && url === '/api/serial-numbers') {
      const result = await db.select('serial_numbers');
      return res.status(200).json(result.map(parseDbSerialNumber));
    }

    // POST /api/serial-numbers/bulk
    if (method === 'POST' && url === '/api/serial-numbers/bulk') {
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const validated = input.map((v: CreateSerialNumberInput) => validateCreateSerialNumberInput(v));
      
      const values = validated.map((v: CreateSerialNumberInput) => ({
        sn: v.sn,
        product_id: v.productId,
        status: 'In Stock',
      }));
      
      const result = await db.insert('serial_numbers', values);
      return res.status(201).json(result.map(parseDbSerialNumber));
    }

    // PUT /api/serial-numbers/:sn/status
    if (method === 'PUT' && url?.startsWith('/api/serial-numbers/') && url?.includes('/status')) {
      const sn = url.replace('/api/serial-numbers/', '').replace('/status', '');
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { status } = input;
      
      const [result] = await db.update('serial_numbers', { status }, { column: 'sn', value: sn });
      
      if (!result) {
        return res.status(404).json({ error: 'Serial number not found' });
      }
      return res.status(200).json(parseDbSerialNumber(result));
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: String(error) });
  }
}
