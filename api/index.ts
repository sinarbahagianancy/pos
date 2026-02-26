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

const customersTable = {
  tableName: 'customers',
  columns: {
    id: { name: 'id' },
    name: { name: 'name' },
    phone: { name: 'phone' },
    email: { name: 'email' },
    address: { name: 'address' },
    npwp: { name: 'npwp' },
    loyaltyPoints: { name: 'loyalty_points' },
    createdAt: { name: 'created_at' },
    updatedAt: { name: 'updated_at' },
  }
};

const salesTable = {
  tableName: 'sales',
  columns: {
    id: { name: 'id' },
    customerId: { name: 'customer_id' },
    customerName: { name: 'customer_name' },
    subtotal: { name: 'subtotal' },
    tax: { name: 'tax' },
    total: { name: 'total' },
    paymentMethod: { name: 'payment_method' },
    staffName: { name: 'staff_name' },
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

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  npwp?: string;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

type PaymentMethod = 'Cash' | 'Debit' | 'Credit Card' | 'QRIS' | 'Transfer';

interface SaleItem {
  productId: string;
  model: string;
  sn: string;
  price: number;
  cogs: number;
}

interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  staffName: string;
  timestamp: string;
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

const parseDbCustomer = (row: Record<string, unknown>): Customer => ({
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

const parseDbSale = (row: Record<string, unknown>): Sale => ({
  id: row.id as string,
  customerId: row.customer_id as string,
  customerName: row.customer_name as string,
  items: [],
  subtotal: typeof row.subtotal === 'string' ? parseFloat(row.subtotal) : (row.subtotal as number),
  tax: typeof row.tax === 'string' ? parseFloat(row.tax) : (row.tax as number),
  total: typeof row.total === 'string' ? parseFloat(row.total) : (row.total as number),
  paymentMethod: row.payment_method as PaymentMethod,
  staffName: row.staff_name as string,
  timestamp: row.timestamp as string,
});

// Staff and Store Config types
interface StaffMember {
  id: string;
  name: string;
  role: 'Admin' | 'Staff';
  createdAt: string;
}

interface StoreConfig {
  id: number;
  storeName: string;
  address: string;
  ppnRate: number;
  currency: 'IDR' | 'USD';
  updatedAt: string;
}

const parseDbStaffMember = (row: Record<string, unknown>): StaffMember => ({
  id: row.id as string,
  name: row.name as string,
  role: row.role as 'Admin' | 'Staff',
  createdAt: row.created_at as string,
});

const parseDbStoreConfig = (row: Record<string, unknown>): StoreConfig => ({
  id: row.id as number,
  storeName: row.store_name as string,
  address: row.address as string,
  ppnRate: typeof row.ppn_rate === 'string' ? parseFloat(row.ppn_rate) : (row.ppn_rate as number),
  currency: row.currency as 'IDR' | 'USD',
  updatedAt: row.updated_at as string,
});

// Initialize database - add password_hash column and default admins
let initialized = false;
const initializeDatabase = async () => {
  if (initialized) return;
  
  try {
    // Add password_hash column if not exists
    await client.unsafe(`ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS password_hash TEXT`).catch(() => {});
    
    // Create default admin accounts if they don't exist
    const defaultAdmins = [
      { name: 'Nancy', password: 'nancy123', role: 'Admin' },
      { name: 'Mami', password: 'mami123', role: 'Admin' },
      { name: 'Vita', password: 'vita123', role: 'Admin' },
    ];
    
    for (const admin of defaultAdmins) {
      const hash = btoa(admin.password); // Simple base64 encoding for demo
      await client.unsafe(`
        INSERT INTO staff_members (name, role, password_hash) 
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET role = EXCLUDED.role
      `, [admin.name, admin.role, hash]).catch(() => {});
    }
    
    // Create default store config if not exists
    await client.unsafe(`
      INSERT INTO store_config (id, store_name, address, ppn_rate, currency)
      VALUES (1, 'Sinar Bahagia Surabaya', 'Jl. Kramat Gantung No. 63, Genteng, Surabaya, Jawa Timur 60174, Indonesia', 11.00, 'IDR')
      ON CONFLICT (id) DO NOTHING
    `).catch(() => {});
    
    initialized = true;
    console.log('Database initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

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
        mount: validated.mount ?? null,
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

    // === AUTH ROUTES ===
    
    // POST /api/auth/login
    if (method === 'POST' && url === '/api/auth/login') {
      await initializeDatabase();
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { name, password } = input;
      
      if (!name || !password) {
        return res.status(400).json({ error: 'Name and password required' });
      }
      
      const passwordHash = btoa(password);
      const result = await client.unsafe(
        'SELECT id, name, role FROM staff_members WHERE name = $1 AND password_hash = $2',
        [name, passwordHash]
      );
      
      if (!result || result.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const user = result[0];
      return res.status(200).json({
        id: user.id,
        name: user.name,
        role: user.role
      });
    }

    // === STAFF ROUTES ===
    
    // GET /api/staff
    if (method === 'GET' && url === '/api/staff') {
      await initializeDatabase();
      const result = await client.unsafe('SELECT id, name, role, created_at FROM staff_members ORDER BY name');
      return res.status(200).json(result.map(parseDbStaffMember));
    }

    // POST /api/staff
    if (method === 'POST' && url === '/api/staff') {
      await initializeDatabase();
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { name, password, role = 'Staff' } = input;
      
      if (!name || !password) {
        return res.status(400).json({ error: 'Name and password required' });
      }
      
      const passwordHash = btoa(password);
      
      try {
        const result = await client.unsafe(
          'INSERT INTO staff_members (name, role, password_hash) VALUES ($1, $2, $3) RETURNING id, name, role, created_at',
          [name, role, passwordHash]
        );
        return res.status(201).json(parseDbStaffMember(result[0]));
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
          return res.status(400).json({ error: 'Staff name already exists' });
        }
        throw error;
      }
    }

    // DELETE /api/staff/:id
    if (method === 'DELETE' && url?.startsWith('/api/staff/')) {
      const staffId = url.replace('/api/staff/', '');
      await client.unsafe('DELETE FROM staff_members WHERE id = $1', [staffId]);
      return res.status(204).send(null);
    }

    // === STORE CONFIG ROUTES ===
    
    // GET /api/store-config
    if (method === 'GET' && url === '/api/store-config') {
      await initializeDatabase();
      const result = await client.unsafe('SELECT * FROM store_config WHERE id = 1');
      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Store config not found' });
      }
      return res.status(200).json(parseDbStoreConfig(result[0]));
    }

    // PUT /api/store-config
    if (method === 'PUT' && url === '/api/store-config') {
      await initializeDatabase();
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { storeName, address, ppnRate, currency } = input;
      
      const result = await client.unsafe(
        'UPDATE store_config SET store_name = $1, address = $2, ppn_rate = $3, currency = $4, updated_at = NOW() WHERE id = 1 RETURNING *',
        [storeName, address, ppnRate, currency]
      );
      
      return res.status(200).json(parseDbStoreConfig(result[0]));
    }

    // === CUSTOMER ROUTES ===

    // GET /api/customers
    if (method === 'GET' && url === '/api/customers') {
      await initializeDatabase();
      const result = await client.unsafe('SELECT * FROM customers ORDER BY name');
      return res.status(200).json(result.map(parseDbCustomer));
    }

    // GET /api/customers/:id
    if (method === 'GET' && url?.startsWith('/api/customers/')) {
      const customerId = url.replace('/api/customers/', '');
      await initializeDatabase();
      const result = await client.unsafe('SELECT * FROM customers WHERE id = $1', [customerId]);
      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      return res.status(200).json(parseDbCustomer(result[0]));
    }

    // POST /api/customers
    if (method === 'POST' && url === '/api/customers') {
      await initializeDatabase();
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, name, phone, email, address, npwp, loyaltyPoints = 0 } = input;

      if (!id || !name) {
        return res.status(400).json({ error: 'ID and name are required' });
      }

      const result = await client.unsafe(
        'INSERT INTO customers (id, name, phone, email, address, npwp, loyalty_points) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [id, name, phone || null, email || null, address || null, npwp || null, loyaltyPoints]
      );

      return res.status(201).json(parseDbCustomer(result[0]));
    }

    // PUT /api/customers/:id
    if (method === 'PUT' && url?.startsWith('/api/customers/')) {
      const customerId = url.replace('/api/customers/', '');
      await initializeDatabase();
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { name, phone, email, address, npwp, loyaltyPoints } = input;

      const updates: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (phone !== undefined) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(phone);
      }
      if (email !== undefined) {
        updates.push(`email = $${paramIndex++}`);
        values.push(email);
      }
      if (address !== undefined) {
        updates.push(`address = $${paramIndex++}`);
        values.push(address);
      }
      if (npwp !== undefined) {
        updates.push(`npwp = $${paramIndex++}`);
        values.push(npwp);
      }
      if (loyaltyPoints !== undefined) {
        updates.push(`loyalty_points = $${paramIndex++}`);
        values.push(loyaltyPoints);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = NOW()`);
      values.push(customerId);

      const result = await client.unsafe(
        `UPDATE customers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values as (string | number | null)[]
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      return res.status(200).json(parseDbCustomer(result[0]));
    }

    // DELETE /api/customers/:id
    if (method === 'DELETE' && url?.startsWith('/api/customers/')) {
      const customerId = url.replace('/api/customers/', '');
      await initializeDatabase();
      
      const hasSales = await client.unsafe('SELECT 1 FROM sales WHERE customer_id = $1 LIMIT 1', [customerId]);
      if (hasSales && hasSales.length > 0) {
        return res.status(400).json({ error: 'Cannot delete customer with existing sales' });
      }
      
      await client.unsafe('DELETE FROM customers WHERE id = $1', [customerId]);
      return res.status(204).send(null);
    }

    // === SALES ROUTES ===

    // GET /api/sales
    if (method === 'GET' && url === '/api/sales') {
      await initializeDatabase();
      const result = await client.unsafe('SELECT * FROM sales ORDER BY timestamp DESC');
      return res.status(200).json(result.map(parseDbSale));
    }

    // GET /api/sales/customer/:customerId
    if (method === 'GET' && url?.startsWith('/api/sales/customer/')) {
      const customerId = url.replace('/api/sales/customer/', '');
      await initializeDatabase();
      const result = await client.unsafe(
        'SELECT * FROM sales WHERE customer_id = $1 ORDER BY timestamp DESC',
        [customerId]
      );
      return res.status(200).json(result.map(parseDbSale));
    }

    // POST /api/sales - Create new sale
    if (method === 'POST' && url === '/api/sales') {
      await initializeDatabase();
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, customerId, customerName, items, subtotal, tax, total, paymentMethod, staffName } = input;

      if (!id || !customerId || !items || items.length === 0 || !paymentMethod || !staffName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      try {
        // Insert sale
        await client.unsafe(
          'INSERT INTO sales (id, customer_id, customer_name, subtotal, tax, total, payment_method, staff_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [id, customerId, customerName, String(subtotal), String(tax), String(total), paymentMethod, staffName]
        );

        // Insert sale items and update serial numbers
        for (const item of items) {
          await client.unsafe(
            'INSERT INTO sale_items (sale_id, product_id, model, sn, price, cogs, warranty_expiry) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [id, item.productId, item.model, item.sn, String(item.price), String(item.cogs), item.warrantyExpiry]
          );

          // Update serial number status to Sold
          await client.unsafe(
            'UPDATE serial_numbers SET status = $1 WHERE sn = $2',
            ['Sold', item.sn]
          );
        }

        // Update customer loyalty points (1 point per 1000 IDR)
        const pointsEarned = Math.floor(total / 1000);
        await client.unsafe(
          'UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2',
          [pointsEarned, customerId]
        );

        // Return the created sale
        const result = await client.unsafe('SELECT * FROM sales WHERE id = $1', [id]);
        return res.status(201).json(parseDbSale(result[0]));
      } catch (err) {
        console.error('Sale error:', err);
        return res.status(500).json({ error: 'Failed to create sale' });
      }
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: String(error) });
  }
}
