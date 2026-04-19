import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL || "";

const client = postgres(connectionString, { prepare: false });

// Inline schema definitions for API route
const productsTable = {
  tableName: "products",
  columns: {
    id: { name: "id" },
    brand: { name: "brand" },
    model: { name: "model" },
    category: { name: "category" },
    mount: { name: "mount" },
    condition: { name: "condition" },
    price: { name: "price" },
    cogs: { name: "cogs" },
    warrantyMonths: { name: "warranty_months" },
    warrantyType: { name: "warranty_type" },
    stock: { name: "stock" },
    createdAt: { name: "created_at" },
    updatedAt: { name: "updated_at" },
    invoiceNumber: { name: "invoice_number" },
  },
};

const serialNumbersTable = {
  tableName: "serial_numbers",
  columns: {
    sn: { name: "sn" },
    productId: { name: "product_id" },
    status: { name: "status" },
    createdAt: { name: "created_at" },
  },
};

const auditLogsTable = {
  tableName: "audit_logs",
  columns: {
    id: { name: "id" },
    staffName: { name: "staff_name" },
    action: { name: "action" },
    details: { name: "details" },
    relatedId: { name: "related_id" },
    timestamp: { name: "timestamp" },
  },
};

const customersTable = {
  tableName: "customers",
  columns: {
    id: { name: "id" },
    name: { name: "name" },
    phone: { name: "phone" },
    email: { name: "email" },
    address: { name: "address" },
    npwp: { name: "npwp" },
    loyaltyPoints: { name: "loyalty_points" },
    createdAt: { name: "created_at" },
    updatedAt: { name: "updated_at" },
  },
};

const salesTable = {
  tableName: "sales",
  columns: {
    id: { name: "id" },
    customerId: { name: "customer_id" },
    customerName: { name: "customer_name" },
    subtotal: { name: "subtotal" },
    tax: { name: "tax" },
    total: { name: "total" },
    paymentMethod: { name: "payment_method" },
    staffName: { name: "staff_name" },
    timestamp: { name: "timestamp" },
    amountPaid: { name: "amount_paid" },
    installments: { name: "installments" },
  },
};

const warrantyClaimsTable = {
  tableName: "warranty_claims",
  columns: {
    id: { name: "id" },
    sn: { name: "sn" },
    productModel: { name: "product_model" },
    issue: { name: "issue" },
    status: { name: "status" },
    createdAt: { name: "created_at" },
  },
};

const saleItemsTable = {
  tableName: "sale_items",
  columns: {
    id: { name: "id" },
    saleId: { name: "sale_id" },
    productId: { name: "product_id" },
    brand: { name: "brand" },
    model: { name: "model" },
    sn: { name: "sn" },
    price: { name: "price" },
    cogs: { name: "cogs" },
    warrantyExpiry: { name: "warranty_expiry" },
  },
};

type ProductCategory = "Body" | "Lens" | "Accessory";
type ConditionType = "New" | "Used";
type WarrantyType =
  | "Official Sony Indonesia"
  | "Official Canon Indonesia"
  | "Official Fujifilm Indonesia"
  | "Distributor"
  | "Toko"
  | "No Warranty";
type MountType = "E-mount" | "RF-mount" | "X-mount" | "L-mount" | "Z-mount" | "M-mount" | undefined;
type SNStatus = "In Stock" | "Sold" | "Claimed";

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
  hasSerialNumber?: boolean;
  supplier?: string;
  dateRestocked?: string;
  hidden?: number;
  taxEnabled?: boolean;
  restockHistory?: { sn: string[]; inv: string; timestamp: string }[];
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

type PaymentMethod = "Cash" | "Debit" | "QRIS" | "Transfer" | "Utang";

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
  taxEnabled?: boolean;
  total: number;
  paymentMethod: PaymentMethod;
  staffName: string;
  notes?: string;
  dueDate?: string;
  isPaid?: boolean;
  paidAt?: string;
  amountPaid?: number;
  installments?: { amount: number; timestamp: string }[];
  timestamp: string;
}

type ClaimStatus = "Pending" | "Ongoing" | "Repairing" | "Ready for Pickup" | "Completed";

interface WarrantyClaim {
  id: string;
  sn: string;
  productModel: string;
  issue: string;
  status: ClaimStatus;
  createdAt: string;
}

interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  brand?: string;
  model: string;
  sn: string;
  price: number;
  cogs: number;
  warrantyExpiry: string;
}

/** Parse the restock_history / invoice_number column from DB.
 *  Supports: new format [{sn,inv,timestamp}], legacy string array, legacy plain string
 */
const parseApiRestockHistory = (value: unknown): { sn: string[]; inv: string; timestamp: string }[] => {
  if (!value) return [];
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && typeof parsed[0] === "object" && parsed[0] !== null && "inv" in parsed[0]) {
        return parsed.filter(
          (e: unknown) => typeof e === "object" && e !== null && "inv" in (e as Record<string, unknown>)
        ).map((e: Record<string, unknown>) => ({
          sn: Array.isArray(e.sn) ? e.sn.filter((s: unknown) => typeof s === "string") : [],
          inv: typeof e.inv === "string" ? e.inv : "",
          timestamp: typeof e.timestamp === "string" ? e.timestamp : new Date().toISOString(),
        }));
      }
      // Legacy: array of plain strings
      return parsed
        .filter((v: unknown) => typeof v === "string" && v.length > 0)
        .map((v: string) => ({ sn: [] as string[], inv: v, timestamp: new Date().toISOString() }));
    }
  } catch {
    return [{ sn: [] as string[], inv: trimmed, timestamp: new Date().toISOString() }];
  }
  return [];
};

const fmtIDR = (n: number | string) => `Rp ${new Intl.NumberFormat("id-ID").format(Number(n))}`;

const parseDbProduct = (row: Record<string, unknown>): Product => {
  return {
    id: row.id as string,
    brand: row.brand as string,
    model: row.model as string,
    category: row.category as ProductCategory,
    mount: row.mount as MountType,
    condition: row.condition as ConditionType,
    price: typeof row.price === "string" ? parseFloat(row.price) : (row.price as number),
    cogs: typeof row.cogs === "string" ? parseFloat(row.cogs) : (row.cogs as number),
    warrantyMonths: row.warranty_months as number,
    warrantyType: row.warranty_type as WarrantyType,
    stock: row.stock as number,
    hasSerialNumber:
      row.has_serial_number === true ||
      row.has_serial_number === 1 ||
      row.has_serial_number === "true",
    supplier: row.supplier as string | undefined,
    dateRestocked: row.date_restocked as string | undefined,
    hidden: row.hidden as number | undefined,
    taxEnabled: row.tax_enabled as boolean,
    restockHistory: parseApiRestockHistory(row.invoice_number),
  };
};

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
  loyaltyPoints:
    typeof row.loyalty_points === "string"
      ? parseInt(row.loyalty_points)
      : (row.loyalty_points as number),
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

const parseDbSale = (row: Record<string, unknown>): Sale => {
  let installments: { amount: number; timestamp: string }[] = [];
  try {
    const raw = row.installments;
    installments = typeof raw === "string" ? JSON.parse(raw) : (raw as any[]) || [];
  } catch { installments = []; }
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    customerName: row.customer_name as string,
    items: [],
    subtotal: typeof row.subtotal === "string" ? parseFloat(row.subtotal) : (row.subtotal as number),
    tax: typeof row.tax === "string" ? parseFloat(row.tax) : (row.tax as number),
    taxEnabled: row.tax_enabled as boolean,
    total: typeof row.total === "string" ? parseFloat(row.total) : (row.total as number),
    paymentMethod: row.payment_method as PaymentMethod,
    staffName: row.staff_name as string,
    notes: row.notes as string | undefined,
    dueDate: row.due_date as string | undefined,
    isPaid: row.is_paid as boolean,
    paidAt: row.paid_at as string | undefined,
    amountPaid: typeof row.amount_paid === "string" ? parseFloat(row.amount_paid) || 0 : (row.amount_paid as number) || 0,
    installments,
    timestamp: row.timestamp as string,
  };
};

const parseDbWarrantyClaim = (row: Record<string, unknown>): WarrantyClaim => ({
  id: row.id as string,
  sn: row.sn as string,
  productModel: row.product_model as string,
  issue: row.issue as string,
  status: row.status as ClaimStatus,
  createdAt: row.created_at as string,
});

const parseDbSaleItem = (row: Record<string, unknown>): SaleItem => ({
  id: row.id as string,
  saleId: row.sale_id as string,
  productId: row.product_id as string,
  brand: row.brand as string | undefined,
  model: row.model as string,
  sn: row.sn as string,
  price: typeof row.price === "string" ? parseFloat(row.price) : (row.price as number),
  cogs: typeof row.cogs === "string" ? parseFloat(row.cogs) : (row.cogs as number),
  warrantyExpiry: row.warranty_expiry as string,
});

// Staff and Store Config types
interface StaffMember {
  id: string;
  name: string;
  role: "Admin" | "Staff";
  createdAt: string;
}

interface StoreConfig {
  id: number;
  storeName: string;
  address: string;
  ppnRate: number;
  currency: "IDR" | "USD";
  monthlyTarget: number;
  updatedAt: string;
}

const parseDbStaffMember = (row: Record<string, unknown>): StaffMember => ({
  id: row.id as string,
  name: row.name as string,
  role: row.role as "Admin" | "Staff",
  createdAt: row.created_at as string,
});

const parseDbStoreConfig = (row: Record<string, unknown>): StoreConfig => ({
  id: row.id as number,
  storeName: row.store_name as string,
  address: row.address as string,
  ppnRate: typeof row.ppn_rate === "string" ? parseFloat(row.ppn_rate) : (row.ppn_rate as number),
  currency: row.currency as "IDR" | "USD",
  monthlyTarget:
    typeof row.monthly_target === "string"
      ? parseInt(row.monthly_target)
      : (row.monthly_target as number) || 500000000,
  updatedAt: row.updated_at as string,
});

// Initialize database - add password_hash column and default admins
let initialized = false;
const initializeDatabase = async () => {
  if (initialized) return;

  try {
    // Add password_hash column if not exists
    await client
      .unsafe(`ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS password_hash TEXT`)
      .catch(() => {});

    // Create suppliers table if not exists
    await client
      .unsafe(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL UNIQUE,
        phone text,
        address text,
        deleted boolean DEFAULT false,
        created_at timestamp DEFAULT NOW()
      )
    `)
      .catch(() => {});

    // Add new columns to products if not exists
    await client
      .unsafe(
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS has_serial_number boolean DEFAULT true`,
      )
      .catch(() => {});
    await client
      .unsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier text`)
      .catch(() => {});
    await client
      .unsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS date_restocked timestamp`)
      .catch(() => {});
    await client
      .unsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_enabled boolean DEFAULT true`)
      .catch(() => {});
    await client.unsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS notes text`).catch(() => {});
    await client.unsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS invoice_number text`).catch(() => {});
    await client.unsafe(`ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS brand text`).catch(() => {});

    // Add new columns to sales if not exists
    await client
      .unsafe(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS tax_enabled boolean DEFAULT true`)
      .catch(() => {});
    await client.unsafe(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS notes text`).catch(() => {});
    await client
      .unsafe(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS due_date timestamp with time zone`)
      .catch(() => {});
    await client
      .unsafe(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false`)
      .catch(() => {});
    await client
      .unsafe(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone`)
      .catch(() => {});
    await client
      .unsafe(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS amount_paid numeric(15,2) DEFAULT 0`)
      .catch(() => {});
    await client
      .unsafe(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS installments text DEFAULT '[]'`)
      .catch(() => {});

    // Add Utang to payment_method enum
    await client
      .unsafe(`ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'Utang'`)
      .catch(() => {});

    // Add Toko and No Warranty to warranty_type enum
    await client
      .unsafe(`ALTER TYPE warranty_type ADD VALUE IF NOT EXISTS 'Toko'`)
      .catch(() => {});
    await client
      .unsafe(`ALTER TYPE warranty_type ADD VALUE IF NOT EXISTS 'No Warranty'`)
      .catch(() => {});

    // Migrate existing 'Store Warranty' data to 'Toko'
    await client
      .unsafe(`UPDATE products SET warranty_type = 'Toko' WHERE warranty_type = 'Store Warranty'`)
      .catch((e) => { console.error('Failed to migrate Store Warranty → Toko:', e); });

    // Migrate invoice_number to new structured format [{sn:[], inv:"...", timestamp:"..."}]
    // Step 1: Wrap legacy plain strings into JSON array
    await client
      .unsafe(`
        UPDATE products
        SET invoice_number = json_build_array(invoice_number)::text
        WHERE invoice_number IS NOT NULL
          AND invoice_number != ''
          AND invoice_number NOT LIKE '[%'
      `)
      .catch((e) => { console.error('Failed to migrate invoice_number to array:', e); });
    // Step 2: Convert array-of-strings format to array-of-objects format
    await client
      .unsafe(`
        UPDATE products
        SET invoice_number = (
          SELECT json_agg(json_build_object('sn', '[]'::json, 'inv', elem, 'timestamp', NOW()::text))::text
          FROM json_array_elements_text(invoice_number::json) elem
        )
        WHERE invoice_number IS NOT NULL
          AND invoice_number LIKE '[%'
          AND invoice_number NOT LIKE '%"inv"%'
      `)
      .catch((e) => { console.error('Failed to migrate invoice_number to structured format:', e); });

    // Add Login and Logout to audit_action enum
    await client
      .unsafe(`ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'Login'`)
      .catch(() => {});
    await client
      .unsafe(`ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'Logout'`)
      .catch(() => {});

    // Add created_at to warranty_claims if not exists (missing from original migration)
    await client
      .unsafe(
        `ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,
      )
      .catch(() => {});

    // Create default admin accounts if they don't exist
    const defaultAdmins = [
      { name: "Nancy", password: "nancy123", role: "Admin" },
      { name: "Mami", password: "mami123", role: "Admin" },
      { name: "Vita", password: "vita123", role: "Admin" },
    ];

    for (const admin of defaultAdmins) {
      const hash = btoa(admin.password); // Simple base64 encoding for demo
      await client
        .unsafe(
          `
        INSERT INTO staff_members (name, role, password_hash) 
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO UPDATE SET role = EXCLUDED.role
      `,
          [admin.name, admin.role, hash],
        )
        .catch(() => {});
    }

    // Create default store config if not exists
    await client
      .unsafe(`
      INSERT INTO store_config (id, store_name, address, ppn_rate, currency)
      VALUES (1, 'Sinar Bahagia Surabaya', 'Jl. Kramat Gantung No. 63, Genteng, Surabaya, Jawa Timur 60174, Indonesia', 11.00, 'IDR')
      ON CONFLICT (id) DO NOTHING
    `)
      .catch(() => {});

    initialized = true;
    console.log("Database initialized");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
};

// Validation functions
const ProductCategories: ProductCategory[] = ["Body", "Lens", "Accessory"];
const ConditionTypes: ConditionType[] = ["New", "Used"];
const WarrantyTypes: WarrantyType[] = [
  "Official Sony Indonesia",
  "Official Canon Indonesia",
  "Official Fujifilm Indonesia",
  "Distributor",
  "Toko",
  "No Warranty",
];
const MountTypes: MountType[] = ["E-mount", "RF-mount", "X-mount", "L-mount", "Z-mount", "M-mount"];

const isProductCategory = (v: unknown): v is ProductCategory =>
  ProductCategories.includes(v as ProductCategory);
const isConditionType = (v: unknown): v is ConditionType =>
  ConditionTypes.includes(v as ConditionType);
const isWarrantyType = (v: unknown): v is WarrantyType => WarrantyTypes.includes(v as WarrantyType);
const isMountType = (v: unknown): v is MountType =>
  v === undefined || MountTypes.includes(v as MountType);

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
  hasSerialNumber?: boolean;
  supplier?: string;
  dateRestocked?: string;
  serialNumbers?: string[];
  quantity?: number;
  taxEnabled?: boolean;
  invoiceNumber?: string;
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
  taxEnabled?: boolean;
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
  if (!input || typeof input !== "object") throw new Error("Invalid input");
  const obj = input as Record<string, unknown>;

  if (typeof obj.id !== "string" || !obj.id) throw new Error("Invalid id");
  if (typeof obj.brand !== "string" || !obj.brand) throw new Error("Invalid brand");
  if (typeof obj.model !== "string" || !obj.model) throw new Error("Invalid model");
  if (!isProductCategory(obj.category)) throw new Error("Invalid category");
  if (!isConditionType(obj.condition)) throw new Error("Invalid condition");
  if (typeof obj.price !== "number" || obj.price < 0) throw new Error("Invalid price");
  if (typeof obj.cogs !== "number" || obj.cogs < 0) throw new Error("Invalid cogs");
  if (typeof obj.warrantyMonths !== "number" || obj.warrantyMonths < 0)
    throw new Error("Invalid warrantyMonths");
  if (!isWarrantyType(obj.warrantyType)) throw new Error("Invalid warrantyType");

  const hasSerialNumber = obj.hasSerialNumber === true;

  if (
    hasSerialNumber &&
    (!obj.serialNumbers || !Array.isArray(obj.serialNumbers) || obj.serialNumbers.length === 0)
  ) {
    throw new Error("serialNumbers is required for products with serial numbers");
  }

  if (
    !hasSerialNumber &&
    (!obj.quantity || typeof obj.quantity !== "number" || obj.quantity <= 0)
  ) {
    throw new Error("quantity is required for products without serial numbers");
  }

  if (!obj.supplier) {
    throw new Error("supplier is required");
  }

  return {
    id: obj.id as string,
    brand: obj.brand as string,
    model: obj.model as string,
    category: obj.category as ProductCategory,
    mount: obj.mount === "" || obj.mount === null ? undefined : (obj.mount as MountType),
    condition: obj.condition as ConditionType,
    price: obj.price as number,
    cogs: obj.cogs as number,
    warrantyMonths: obj.warrantyMonths as number,
    warrantyType: obj.warrantyType,
    hasSerialNumber,
    supplier: obj.supplier as string,
    dateRestocked: obj.dateRestocked as string,
    serialNumbers: obj.serialNumbers as string[] | undefined,
    quantity: obj.quantity as number | undefined,
    taxEnabled: obj.taxEnabled as boolean | undefined,
    invoiceNumber: obj.invoiceNumber as string | undefined,
  };
};

const validateUpdateProductInput = (input: unknown): UpdateProductInput => {
  if (!input || typeof input !== "object") throw new Error("Invalid input");
  const obj = input as Record<string, unknown>;
  const result: UpdateProductInput = {};

  if (obj.brand !== undefined) result.brand = obj.brand as string;
  if (obj.model !== undefined) result.model = obj.model as string;
  if (obj.category !== undefined) result.category = obj.category as ProductCategory;
  if (obj.mount !== undefined) {
    // Allow empty string to be treated as undefined (no mount)
    const mountVal = obj.mount;
    result.mount = mountVal === "" || mountVal === null ? undefined : (mountVal as MountType);
  }
  if (obj.condition !== undefined) result.condition = obj.condition as ConditionType;
  if (obj.price !== undefined) result.price = obj.price as number;
  if (obj.cogs !== undefined) result.cogs = obj.cogs as number;
  if (obj.warrantyMonths !== undefined) result.warrantyMonths = obj.warrantyMonths as number;
  if (obj.warrantyType !== undefined) result.warrantyType = obj.warrantyType as WarrantyType;
  if (obj.stock !== undefined) result.stock = obj.stock as number;
  if (obj.taxEnabled !== undefined) result.taxEnabled = obj.taxEnabled as boolean;

  return result;
};

const validateStockAdjustmentInput = (input: unknown): StockAdjustmentInput => {
  if (!input || typeof input !== "object") throw new Error("Invalid input");
  const obj = input as Record<string, unknown>;

  if (typeof obj.productId !== "string" || !obj.productId) throw new Error("Invalid productId");
  if (typeof obj.newStock !== "number" || obj.newStock < 0) throw new Error("Invalid newStock");
  if (typeof obj.reason !== "string" || !obj.reason) throw new Error("Invalid reason");

  return { productId: obj.productId, newStock: obj.newStock, reason: obj.reason };
};

const validateCreateSerialNumberInput = (input: unknown): CreateSerialNumberInput => {
  if (!input || typeof input !== "object") throw new Error("Invalid input");
  const obj = input as Record<string, unknown>;

  if (typeof obj.sn !== "string" || !obj.sn) throw new Error("Invalid sn");
  if (typeof obj.productId !== "string" || !obj.productId) throw new Error("Invalid productId");

  return { sn: obj.sn, productId: obj.productId };
};

// DB Query helpers
const db = {
  select: async (
    table: string,
    columns: string[] = ["*"],
    where?: { column: string; value: unknown },
  ) => {
    const cols = columns.join(", ");
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
    const values = data.map((d) => keys.map((k) => d[k]));
    const placeholders = values
      .map((_, i) => `(${keys.map((_, j) => `$${i * keys.length + j + 1}`).join(", ")})`)
      .join(", ");

    const query = `INSERT INTO ${table} (${keys.join(", ")}) VALUES ${placeholders} RETURNING *`;
    const flatValues = values.flat() as (string | number | boolean | null)[];
    const result = await client.unsafe(query, flatValues);
    return result;
  },

  update: async (
    table: string,
    data: Record<string, unknown>,
    where: { column: string; value: unknown },
  ) => {
    const sets = Object.keys(data)
      .map((k, i) => `${k} = $${i + 1}`)
      .join(", ");
    const query = `UPDATE ${table} SET ${sets}, updated_at = NOW() WHERE ${where.column} = $${Object.keys(data).length + 1} RETURNING *`;
    const result = await client.unsafe(query, [
      ...(Object.values(data) as (string | number | boolean | null)[]),
      where.value as string | number | boolean | null,
    ]);
    return result;
  },

  delete: async (table: string, where: { column: string; value: unknown }) => {
    const query = `DELETE FROM ${table} WHERE ${where.column} = $1`;
    await client.unsafe(query, [where.value as string | number | boolean | null]);
    return [];
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;

  // Helper to parse pagination query params
  const getPageLimit = (req: VercelRequest): { page: number; limit: number } => {
    const query = (req.query as Record<string, string>) || {};
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    return { page, limit };
  };

  // Helper to get paginated results
  const getPaginatedResults = async (
    table: string,
    whereClause: string,
    orderBy: string,
    page: number,
    limit: number,
  ) => {
    const offset = (page - 1) * limit;
    const result = await client.unsafe(
      `SELECT * FROM ${table} WHERE ${whereClause} ORDER BY ${orderBy} LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const countResult = await client.unsafe(
      `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`,
    );
    const total = Number(countResult[0]?.count) || 0;
    return {
      data: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  };

  try {
    // GET /api/products with pagination
    if (method === "GET" && (url === "/api/products" || url?.startsWith("/api/products?"))) {
      const { page, limit } = getPageLimit(req);
      const { data, total, totalPages } = await getPaginatedResults(
        "products",
        "deleted = false",
        "created_at DESC",
        page,
        limit,
      );
      return res.status(200).json({
        products: data.map(parseDbProduct),
        total,
        page,
        limit,
        totalPages,
      });
    }

    // POST /api/products
    if (method === "POST" && url === "/api/products") {
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const validated = validateCreateProductInput(input);
      const staffName = ((input as Record<string, unknown>)?.staffName as string) || "System";

      const hasSerialNumber = validated.hasSerialNumber === true;
      const stockCount = hasSerialNumber
        ? validated.serialNumbers?.length || 0
        : validated.quantity || 0;

      const result = await db.insert("products", [
        {
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
          stock: stockCount,
          has_serial_number: hasSerialNumber,
          supplier: validated.supplier,
          date_restocked: validated.dateRestocked ? new Date(validated.dateRestocked) : new Date(),
          tax_enabled: validated.taxEnabled ?? true,
          invoice_number: validated.invoiceNumber
            ? JSON.stringify([{ sn: validated.serialNumbers || [], inv: validated.invoiceNumber, timestamp: new Date().toISOString() }])
            : null,
        },
      ]);

      const newProduct = result[0];

      if (hasSerialNumber && validated.serialNumbers && validated.serialNumbers.length > 0) {
        for (const sn of validated.serialNumbers) {
          await db.insert("serial_numbers", [
            {
              sn: sn,
              product_id: newProduct.id,
              status: "In Stock",
            },
          ]);
        }
      }

      // Create audit log
      const details =
        hasSerialNumber && validated.serialNumbers
          ? `Created product ${validated.brand} ${validated.model} with ${validated.serialNumbers.length} serial numbers, price: ${fmtIDR(validated.price)}, cogs: ${fmtIDR(validated.cogs)}, from supplier ${validated.supplier}`
          : `Created product ${validated.brand} ${validated.model} with ${validated.quantity || 0} units, price: ${fmtIDR(validated.price)}, cogs: ${fmtIDR(validated.cogs)}, from supplier ${validated.supplier}`;

      await client.unsafe(
        "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
        [
          `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          staffName,
          "Stock Addition",
          details,
          newProduct.id,
        ],
      );

      return res.status(201).json(parseDbProduct(newProduct));
    }

    // PUT /api/products/:id
    if (method === "PUT" && url?.startsWith("/api/products/")) {
      const productId = url.replace("/api/products/", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      console.log("[DEBUG PUT] Input:", JSON.stringify(input));
      const { staffName = "System", ...productInput } = input;
      console.log("[DEBUG PUT] productInput:", JSON.stringify(productInput));
      const validated = validateUpdateProductInput(productInput);
      console.log("[DEBUG PUT] validated:", JSON.stringify(validated));

      // Get old product for audit logging
      const [oldProduct] = await db.select("products", ["*"], { column: "id", value: productId });
      if (!oldProduct) {
        return res.status(404).json({ error: "Product not found" });
      }

      const updateData: Record<string, unknown> = {};
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
          changes.push(`price: ${fmtIDR(oldProduct.price)} -> ${fmtIDR(newPrice)}`);
        }
      }
      if (validated.cogs !== undefined) {
        const newCogs = validated.cogs.toString();
        if (newCogs !== oldProduct.cogs) {
          updateData.cogs = newCogs;
          changes.push(`cogs: ${fmtIDR(oldProduct.cogs)} -> ${fmtIDR(newCogs)}`);
        }
      }
      if (
        validated.warrantyMonths !== undefined &&
        validated.warrantyMonths !== oldProduct.warranty_months
      ) {
        updateData.warranty_months = validated.warrantyMonths;
        changes.push(
          `warrantyMonths: ${oldProduct.warranty_months} -> ${validated.warrantyMonths}`,
        );
      }
      if (
        validated.warrantyType !== undefined &&
        validated.warrantyType !== oldProduct.warranty_type
      ) {
        updateData.warranty_type = validated.warrantyType;
        changes.push(`warrantyType: ${oldProduct.warranty_type} -> ${validated.warrantyType}`);
      }
      if (validated.taxEnabled !== undefined && validated.taxEnabled !== oldProduct.tax_enabled) {
        updateData.tax_enabled = validated.taxEnabled;
        changes.push(`taxEnabled: ${oldProduct.tax_enabled} -> ${validated.taxEnabled}`);
      }

      if (changes.length > 0) {
        await db.insert("audit_logs", [
          {
            id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            staff_name: staffName,
            action: "Product Update",
            details: `Updated ${oldProduct.brand} ${oldProduct.model}: ${changes.join(", ")}`,
            related_id: productId,
          },
        ]);
      }

      const result = await db.update("products", updateData, { column: "id", value: productId });

      if (!result[0]) {
        return res.status(404).json({ error: "Product not found" });
      }
      return res.status(200).json(parseDbProduct(result[0]));
    }

    // POST /api/products/adjust-stock
    if (method === "POST" && url === "/api/products/adjust-stock") {
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      validateStockAdjustmentInput(input);

      const { productId, newStock, reason, staffName = "System", supplier, dateRestocked, invoiceNumber } = input;

      const [product] = await db.select("products", ["*"], { column: "id", value: productId });
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const diff = newStock - Number(product.stock);
      const actionType = diff > 0 ? "Stock Addition" : "Manual Correction";

      // Update fields - only update supplier, dateRestocked, invoiceNumber when adding stock (positive diff)
      const updateData: any = { stock: newStock };
      if (diff > 0 && supplier) {
        updateData.supplier = supplier;
      }
      if (diff > 0 && dateRestocked) {
        updateData.date_restocked = new Date(dateRestocked);
      }
      if (diff > 0 && invoiceNumber) {
        // Append new restock entry to existing history
        const existing = parseApiRestockHistory(product.invoice_number);
        existing.push({ sn: [], inv: invoiceNumber, timestamp: new Date().toISOString() });
        updateData.invoice_number = JSON.stringify(existing);
      }

      const [result] = await db.update("products", updateData, { column: "id", value: productId });

      // Build audit log details with supplier and date info
      let auditDetails = `Manual adjust ${product.brand} ${product.model}: ${product.stock} -> ${newStock}. Price: ${fmtIDR(product.price)}, COGS: ${fmtIDR(product.cogs)}. Reason: ${reason}`;
      if (diff > 0) {
        if (supplier) {
          auditDetails += `. Supplier: ${supplier}`;
        }
        if (dateRestocked) {
          auditDetails += `. Date: ${dateRestocked}`;
        }
        if (invoiceNumber) {
          auditDetails += `. Invoice: ${invoiceNumber}`;
        }
      }

      await db.insert("audit_logs", [
        {
          id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          staff_name: staffName,
          action: actionType,
          details: auditDetails,
          related_id: productId,
        },
      ]);

      return res.status(200).json(parseDbProduct(result));
    }

    // DELETE /api/products/:id
    if (method === "DELETE" && url?.startsWith("/api/products/")) {
      const productId = url.replace("/api/products/", "");

      // Check if there are In Stock serial numbers
      const sns = await client.unsafe(
        "SELECT sn FROM serial_numbers WHERE product_id = $1 AND status = $2",
        [productId, "In Stock"],
      );
      if (sns.length > 0) {
        return res.status(400).json({
          error: `Produk memiliki ${sns.length} nomor seri yang belum terjual. Hapus atau jual nomor seri tersebut terlebih dahulu.`,
        });
      }

      // Check for NOSN stock (stock without serial numbers)
      const product = await client.unsafe("SELECT stock FROM products WHERE id = $1", [productId]);
      if (product.length > 0) {
        const stock = Number(product[0].stock);
        const totalSNs = await client.unsafe(
          "SELECT COUNT(*) as count FROM serial_numbers WHERE product_id = $1",
          [productId],
        );
        const trackedStock = Number(totalSNs[0]?.count || 0);
        const nosnStock = stock - trackedStock;

        if (nosnStock > 0) {
          return res.status(400).json({
            error: `Produk memiliki ${nosnStock} unit stok tanpa nomor seri (NOSN). Kurangi stok terlebih dahulu sebelum menghapus produk.`,
          });
        }
      }

      // Soft delete - mark as deleted (same as dev server)
      await client.unsafe("UPDATE products SET deleted = true, updated_at = NOW() WHERE id = $1", [productId]);
      return res.status(204).send(null);
    }

    // POST /api/products/:id/toggle-hidden
    if (method === "POST" && url?.startsWith("/api/products/") && url.includes("/toggle-hidden")) {
      const productId = url.replace("/api/products/", "").replace("/toggle-hidden", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { hidden } = input;

      try {
        await db.update("products", { hidden: hidden ? 1 : 0 }, { column: "id", value: productId });
      } catch (err) {
        // Column might not exist, try to add it first
        try {
          await client.unsafe(
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden INTEGER DEFAULT 0",
          );
          await db.update(
            "products",
            { hidden: hidden ? 1 : 0 },
            { column: "id", value: productId },
          );
        } catch (addErr) {
          console.error("Failed to toggle hidden:", addErr);
          return res.status(500).json({ error: "Failed to toggle product visibility" });
        }
      }

      const result = await client.unsafe("SELECT * FROM products WHERE id = $1", [productId]);
      return res.status(200).json(parseDbProduct(result[0]));
    }

    // POST /api/products/:id/restore
    if (method === "POST" && url?.startsWith("/api/products/") && url.includes("/restore")) {
      const productId = url.replace("/api/products/", "").replace("/restore", "");

      try {
        await db.update("products", { deleted: false }, { column: "id", value: productId });
      } catch (err) {
        try {
          await client.unsafe(
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false",
          );
          await db.update("products", { deleted: false }, { column: "id", value: productId });
        } catch (addErr) {
          console.error("Failed to restore product:", addErr);
          return res.status(500).json({ error: "Failed to restore product" });
        }
      }

      const result = await client.unsafe("SELECT * FROM products WHERE id = $1", [productId]);
      return res.status(200).json(parseDbProduct(result[0]));
    }

    // GET /api/serial-numbers
    if (method === "GET" && url === "/api/serial-numbers") {
      const result = await client.unsafe("SELECT * FROM serial_numbers");
      return res.status(200).json(result.map(parseDbSerialNumber));
    }

    // POST /api/serial-numbers/bulk
    if (method === "POST" && url === "/api/serial-numbers/bulk") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { inputs, supplier, date, reason, invoiceNumber } = body;
      const validated = inputs.map((v: CreateSerialNumberInput) =>
        validateCreateSerialNumberInput(v),
      );

      const values = validated.map((v: CreateSerialNumberInput) => ({
        sn: v.sn,
        product_id: v.productId,
        status: "In Stock",
      }));

      const result = await db.insert("serial_numbers", values);

      // Increment stock for each product by the number of new SNs added
      const productCounts = new Map<string, { count: number; sns: string[] }>();
      for (const v of validated) {
        const entry = productCounts.get(v.productId);
        if (entry) {
          entry.count++;
          entry.sns.push(v.sn);
        } else {
          productCounts.set(v.productId, { count: 1, sns: [v.sn] });
        }
      }

      for (const [productId, { count, sns }] of productCounts) {
        // Increment stock + update metadata in a single query
        const setClauses = ["stock = stock + $1", "updated_at = NOW()"];
        const params: (string | number | Date | null)[] = [count];
        let paramIdx = 2;

        if (supplier) { setClauses.push(`supplier = $${paramIdx++}`); params.push(supplier); }
        if (date) { setClauses.push(`date_restocked = $${paramIdx++}`); params.push(new Date(date)); }
        if (invoiceNumber) {
          // Append new restock entry to existing history
          const [existingProduct] = await client.unsafe("SELECT invoice_number FROM products WHERE id = $1", [productId]);
          const existing = parseApiRestockHistory(existingProduct?.invoice_number);
          existing.push({ sn: sns, inv: invoiceNumber, timestamp: new Date().toISOString() });
          setClauses.push(`invoice_number = $${paramIdx++}`);
          params.push(JSON.stringify(existing));
        }
        params.push(productId);

        await client.unsafe(
          `UPDATE products SET ${setClauses.join(", ")} WHERE id = $${paramIdx}`,
          params,
        );

        // Create audit log per product
        const [product] = await client.unsafe("SELECT brand, model FROM products WHERE id = $1", [
          productId,
        ]);
        const snList = sns.join(", ");
        const supplierInfo = supplier || "Unknown";
        const dateInfo = date || new Date().toISOString().split("T")[0];
        const reasonInfo = reason || "Not specified";
        const invoiceInfo = invoiceNumber || "-";

        await client.unsafe(
          `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) 
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            "System",
            "Stock Addition",
            `Added ${count} serial number(s) to ${product?.brand || ""} ${product?.model || ""} from supplier ${supplierInfo} on ${dateInfo}, invoice: ${invoiceInfo}, reason: ${reasonInfo}. SN: ${snList}`,
            productId,
          ],
        );
      }

      return res.status(201).json(result.map(parseDbSerialNumber));
    }

    // PUT /api/serial-numbers/:sn/status
    if (method === "PUT" && url?.startsWith("/api/serial-numbers/") && url?.includes("/status")) {
      const sn = url.replace("/api/serial-numbers/", "").replace("/status", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { status, reason } = input;

      // Get the SN to find product info and current status before updating
      const [existingSN] = await client.unsafe(
        "SELECT product_id, status FROM serial_numbers WHERE sn = $1",
        [sn],
      );

      const result = await client.unsafe(
        "UPDATE serial_numbers SET status = $1 WHERE sn = $2 RETURNING *",
        [status, sn],
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Serial number not found" });
      }

      // Sync product stock when SN status changes
      const wasInStock = existingSN?.status === "In Stock";
      const nowInStock = status === "In Stock";
      if (existingSN && existingSN.status !== status) {

        if (wasInStock && !nowInStock) {
          // SN left inventory — decrement stock
          await client.unsafe(
            "UPDATE products SET stock = GREATEST(stock - 1, 0), updated_at = NOW() WHERE id = $1",
            [existingSN.product_id],
          );
        } else if (!wasInStock && nowInStock) {
          // SN returned to inventory — increment stock
          await client.unsafe(
            "UPDATE products SET stock = stock + 1, updated_at = NOW() WHERE id = $1",
            [existingSN.product_id],
          );
        }
      }

      // Create audit log for status change
      if (existingSN) {
        const [product] = await client.unsafe("SELECT brand, model FROM products WHERE id = $1", [
          existingSN.product_id,
        ]);
        const reasonInfo = reason || "Not specified";
        const stockChangeNote = existingSN.status !== status
          ? wasInStock ? " (stock decremented)" : nowInStock ? " (stock incremented)" : ""
          : "";

        await client.unsafe(
          `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) 
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            "System",
            "Manual Correction",
            `Marked serial number ${sn} as ${status} for ${product?.brand || ""} ${product?.model || ""}, reason: ${reasonInfo}${stockChangeNote}`,
            existingSN.product_id,
          ],
        );
      }

      return res.status(200).json(parseDbSerialNumber(result[0]));
    }

    // === AUTH ROUTES ===

    // POST /api/auth/login
    if (method === "POST" && url === "/api/auth/login") {
      await initializeDatabase();
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name, password } = input;

      if (!name || !password) {
        return res.status(400).json({ error: "Name and password required" });
      }

      const passwordHash = btoa(password);
      const result = await client.unsafe(
        "SELECT id, name, role FROM staff_members WHERE name = $1 AND password_hash = $2",
        [name, passwordHash],
      );

      if (!result || result.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result[0];

      // Record login audit log
      try {
        await client.unsafe(
          "INSERT INTO audit_logs (id, staff_name, action, details, timestamp) VALUES ($1, $2, $3, $4, NOW())",
          [`LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`, user.name, "Login", `Staff ${user.name} logged in`],
        );
      } catch (e) {
        console.warn("Failed to record login audit log:", e);
      }

      return res.status(200).json({
        id: user.id,
        name: user.name,
        role: user.role,
      });
    }

    // POST /api/auth/logout
    if (method === "POST" && url === "/api/auth/logout") {
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name } = input;

      if (name) {
        try {
          await client.unsafe(
            "INSERT INTO audit_logs (id, staff_name, action, details, timestamp) VALUES ($1, $2, $3, $4, NOW())",
            [`LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`, name, "Logout", `Staff ${name} logged out`],
          );
        } catch (e) {
          console.warn("Failed to record logout audit log:", e);
        }
      }

      return res.status(200).json({ success: true });
    }

    // === STAFF ROUTES ===

    // GET /api/staff
    if (method === "GET" && url === "/api/staff") {
      await initializeDatabase();
      const result = await client.unsafe(
        "SELECT id, name, role, created_at FROM staff_members ORDER BY name",
      );
      return res.status(200).json(result.map(parseDbStaffMember));
    }

    // POST /api/staff
    if (method === "POST" && url === "/api/staff") {
      await initializeDatabase();
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name, password, role = "Staff" } = input;

      if (!name || !password) {
        return res.status(400).json({ error: "Name and password required" });
      }

      const passwordHash = btoa(password);

      try {
        const result = await client.unsafe(
          "INSERT INTO staff_members (name, role, password_hash) VALUES ($1, $2, $3) RETURNING id, name, role, created_at",
          [name, role, passwordHash],
        );
        return res.status(201).json(parseDbStaffMember(result[0]));
      } catch (error: unknown) {
        if (error && typeof error === "object" && "code" in error && error.code === "23505") {
          return res.status(400).json({ error: "Staff name already exists" });
        }
        throw error;
      }
    }

    // DELETE /api/staff/:id
    if (method === "DELETE" && url?.startsWith("/api/staff/")) {
      const staffId = url.replace("/api/staff/", "");
      await client.unsafe("DELETE FROM staff_members WHERE id = $1", [staffId]);
      return res.status(204).send(null);
    }

    // PUT /api/staff/:id
    if (method === "PUT" && url?.startsWith("/api/staff/")) {
      const staffId = url.replace("/api/staff/", "");
      await initializeDatabase();
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name, role, password } = input;

      const [current] = await client.unsafe("SELECT * FROM staff_members WHERE id = $1", [staffId]);
      if (!current) {
        return res.status(404).json({ error: "Staff not found" });
      }

      const newName = name ?? current.name;
      const newRole = role ?? current.role;
      const newPasswordHash = password ? btoa(password) : current.password_hash;

      const result = await client.unsafe(
        "UPDATE staff_members SET name = $1, role = $2, password_hash = $3 WHERE id = $4 RETURNING id, name, role, created_at",
        [newName, newRole, newPasswordHash, staffId],
      );

      return res.status(200).json({
        id: result[0].id,
        name: result[0].name,
        role: result[0].role,
        createdAt: result[0].created_at,
      });
    }

    // === STORE CONFIG ROUTES ===

    // GET /api/store-config
    if (method === "GET" && url === "/api/store-config") {
      await initializeDatabase();
      const result = await client.unsafe("SELECT * FROM store_config WHERE id = 1");
      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Store config not found" });
      }
      return res.status(200).json(parseDbStoreConfig(result[0]));
    }

    // PUT /api/store-config
    if (method === "PUT" && url === "/api/store-config") {
      await initializeDatabase();
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { storeName, address, ppnRate, currency, monthlyTarget } = input;

      const result = await client.unsafe(
        "UPDATE store_config SET store_name = $1, address = $2, ppn_rate = $3, currency = $4, monthly_target = $5, updated_at = NOW() WHERE id = 1 RETURNING *",
        [storeName, address, ppnRate, currency, monthlyTarget || 500000000],
      );

      return res.status(200).json(parseDbStoreConfig(result[0]));
    }

    // === SUPPLIER ROUTES ===

    // GET /api/suppliers with pagination
    if (method === "GET" && (url === "/api/suppliers" || url?.startsWith("/api/suppliers?"))) {
      await initializeDatabase();
      const { page, limit } = getPageLimit(req);
      const offset = (page - 1) * limit;
      const result = await client.unsafe(
        `SELECT * FROM suppliers WHERE deleted = false ORDER BY name LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      const countResult = await client.unsafe(
        "SELECT COUNT(*) as count FROM suppliers WHERE deleted = false",
      );
      const total = Number(countResult[0]?.count) || 0;
      return res.status(200).json({
        suppliers: result.map((row: Record<string, unknown>) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          address: row.address,
          deleted: row.deleted,
          createdAt: row.created_at,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    // POST /api/suppliers
    if (method === "POST" && url === "/api/suppliers") {
      await initializeDatabase();
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name, phone, address } = input as { name: string; phone?: string; address?: string };

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      try {
        await client.unsafe("INSERT INTO suppliers (name, phone, address) VALUES ($1, $2, $3)", [
          name,
          phone || null,
          address || null,
        ]);

        const result = await client.unsafe("SELECT * FROM suppliers WHERE name = $1", [name]);
        return res.status(201).json({
          id: result[0].id,
          name: result[0].name,
          phone: result[0].phone,
          address: result[0].address,
          deleted: result[0].deleted,
          createdAt: result[0].created_at,
        });
      } catch (err: unknown) {
        console.error("Supplier insert error:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return res.status(500).json({ error: errorMessage });
      }
    }

    // PUT /api/suppliers/:id
    if (method === "PUT" && url?.startsWith("/api/suppliers/")) {
      await initializeDatabase();
      const supplierId = url.replace("/api/suppliers/", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name, phone, address } = input as { name?: string; phone?: string; address?: string };

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
      if (address !== undefined) {
        updates.push(`address = $${paramIndex++}`);
        values.push(address);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      values.push(supplierId);

      await client.unsafe(
        `UPDATE suppliers SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
        values,
      );

      const result = await client.unsafe("SELECT * FROM suppliers WHERE id = $1", [supplierId]);
      return res.status(200).json({
        id: result[0].id,
        name: result[0].name,
        phone: result[0].phone,
        address: result[0].address,
        deleted: result[0].deleted,
        createdAt: result[0].created_at,
      });
    }

    // DELETE /api/suppliers/:id
    if (method === "DELETE" && url?.startsWith("/api/suppliers/")) {
      await initializeDatabase();
      const supplierId = url.replace("/api/suppliers/", "");

      await client.unsafe("UPDATE suppliers SET deleted = true WHERE id = $1", [supplierId]);

      return res.status(200).json({ success: true });
    }

    // === CUSTOMER ROUTES ===

    // GET /api/customers with pagination
    if (method === "GET" && (url === "/api/customers" || url?.startsWith("/api/customers?"))) {
      await initializeDatabase();
      const { page, limit } = getPageLimit(req);
      const offset = (page - 1) * limit;
      const result = await client.unsafe(
        `SELECT * FROM customers WHERE deleted = false ORDER BY name LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      const countResult = await client.unsafe(
        "SELECT COUNT(*) as count FROM customers WHERE deleted = false",
      );
      const total = Number(countResult[0]?.count) || 0;
      return res.status(200).json({
        customers: result.map(parseDbCustomer),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    // GET /api/customers/:id
    if (method === "GET" && url?.startsWith("/api/customers/")) {
      const customerId = url.replace("/api/customers/", "");
      await initializeDatabase();
      const result = await client.unsafe("SELECT * FROM customers WHERE id = $1", [customerId]);
      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }
      return res.status(200).json(parseDbCustomer(result[0]));
    }

    // POST /api/customers
    if (method === "POST" && url === "/api/customers") {
      await initializeDatabase();
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { id, name, phone, email, address, npwp, loyaltyPoints = 0 } = input;

      if (!id || !name) {
        return res.status(400).json({ error: "ID and name are required" });
      }

      const result = await client.unsafe(
        "INSERT INTO customers (id, name, phone, email, address, npwp, loyalty_points) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [id, name, phone || null, email || null, address || null, npwp || null, loyaltyPoints],
      );

      return res.status(201).json(parseDbCustomer(result[0]));
    }

    // PUT /api/customers/:id
    if (method === "PUT" && url?.startsWith("/api/customers/")) {
      const customerId = url.replace("/api/customers/", "");
      await initializeDatabase();
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name, phone, email, address, npwp, loyaltyPoints, staffName = "System" } = input;

      // Get old customer for audit logging
      const [oldCustomer] = await client.unsafe("SELECT * FROM customers WHERE id = $1", [
        customerId,
      ]);
      if (!oldCustomer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      const updates: string[] = [];
      const values: unknown[] = [];
      const changeDescriptions: string[] = [];
      let paramIndex = 1;

      if (name !== undefined && name !== oldCustomer.name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
        changeDescriptions.push(`name: ${oldCustomer.name} -> ${name}`);
      }
      if (phone !== undefined && phone !== oldCustomer.phone) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(phone);
        changeDescriptions.push(`phone: ${oldCustomer.phone || "-"} -> ${phone || "-"}`);
      }
      if (email !== undefined && email !== oldCustomer.email) {
        updates.push(`email = $${paramIndex++}`);
        values.push(email);
        changeDescriptions.push(`email: ${oldCustomer.email || "-"} -> ${email || "-"}`);
      }
      if (address !== undefined && address !== oldCustomer.address) {
        updates.push(`address = $${paramIndex++}`);
        values.push(address);
        changeDescriptions.push(`address: ${oldCustomer.address || "-"} -> ${address || "-"}`);
      }
      if (npwp !== undefined && npwp !== oldCustomer.npwp) {
        updates.push(`npwp = $${paramIndex++}`);
        values.push(npwp);
        changeDescriptions.push(`npwp: ${oldCustomer.npwp || "-"} -> ${npwp || "-"}`);
      }
      if (
        loyaltyPoints !== undefined &&
        loyaltyPoints !== parseInt(oldCustomer.loyalty_points || "0")
      ) {
        updates.push(`loyalty_points = $${paramIndex++}`);
        values.push(loyaltyPoints);
        changeDescriptions.push(`loyaltyPoints: ${oldCustomer.loyalty_points || 0} -> ${loyaltyPoints}`);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      updates.push(`updated_at = NOW()`);
      values.push(customerId);

      const result = await client.unsafe(
        `UPDATE customers SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
        values as (string | number | null)[],
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Audit log for customer update
      await client.unsafe(
        "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
        [
          `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          staffName,
          "General",
          `Updated customer: ${changeDescriptions.join(", ")}`,
          customerId,
        ],
      );

      return res.status(200).json(parseDbCustomer(result[0]));
    }

    // DELETE /api/customers/:id
    if (method === "DELETE" && url?.startsWith("/api/customers/")) {
      const customerId = url.replace("/api/customers/", "");
      await initializeDatabase();
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { staffName = "System" } = input || {};

      // Get customer name for audit logging
      const [customer] = await client.unsafe("SELECT name FROM customers WHERE id = $1", [
        customerId,
      ]);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Soft delete - set deleted = true
      await client.unsafe("UPDATE customers SET deleted = true, updated_at = NOW() WHERE id = $1", [
        customerId,
      ]);

      // Audit log for customer deletion
      await client.unsafe(
        "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
        [
          `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          staffName,
          "General",
          `Deleted customer: ${customer.name}`,
          customerId,
        ],
      );

      return res.status(204).send(null);
    }

    // === SALES ROUTES ===

    // GET /api/sales with pagination
    if (method === "GET" && (url === "/api/sales" || url?.startsWith("/api/sales?"))) {
      await initializeDatabase();
      const { page, limit } = getPageLimit(req);
      const offset = (page - 1) * limit;
      const salesResult = await client.unsafe(
        `SELECT * FROM sales ORDER BY timestamp DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      const countResult = await client.unsafe("SELECT COUNT(*) as count FROM sales");
      const total = Number(countResult[0]?.count) || 0;

      const salesWithItems = await Promise.all(
        salesResult.map(async (sale: Record<string, unknown>) => {
          const itemsResult = await client.unsafe("SELECT * FROM sale_items WHERE sale_id = $1", [
            sale.id,
          ]);
          return {
            ...parseDbSale(sale),
            items: itemsResult.map((item: Record<string, unknown>) => parseDbSaleItem(item)),
          };
        }),
      );

      return res.status(200).json({
        sales: salesWithItems,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    // GET /api/sales/customer/:customerId
    if (method === "GET" && url?.startsWith("/api/sales/customer/")) {
      const customerId = url.replace("/api/sales/customer/", "");
      await initializeDatabase();
      const result = await client.unsafe(
        "SELECT * FROM sales WHERE customer_id = $1 ORDER BY timestamp DESC",
        [customerId],
      );
      return res.status(200).json(result.map(parseDbSale));
    }

    // POST /api/sales - Create new sale
    if (method === "POST" && url === "/api/sales") {
      await initializeDatabase();
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const {
        id,
        customerId,
        customerName,
        items,
        subtotal,
        tax,
        taxEnabled,
        total,
        paymentMethod,
        staffName,
        notes,
        dueDate,
        isPaid,
        amountPaid,
      } = input;

      if (!id || !customerId || !items || items.length === 0 || !paymentMethod || !staffName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const saleAmountPaid = amountPaid || 0;
      const installmentsJson = saleAmountPaid > 0
        ? JSON.stringify([{ amount: saleAmountPaid, timestamp: new Date().toISOString() }])
        : "[]";

      // Use a transaction to ensure atomicity of the entire sale creation
      const tx = await client.begin();
      try {
        // --- Pre-flight checks: validate stock & SN status before any writes ---

        // Aggregate quantities by product to handle duplicate productIds correctly
        const productQuantities = new Map<string, number>();
        for (const item of items) {
          productQuantities.set(
            item.productId,
            (productQuantities.get(item.productId) || 0) + 1,
          );
        }

        for (const [productId, quantity] of productQuantities) {
          // Lock and check product stock (FOR UPDATE prevents concurrent races)
          const [product] = await tx.unsafe(
            "SELECT stock, model FROM products WHERE id = $1 FOR UPDATE",
            [productId],
          );
          if (!product || Number(product.stock) < quantity) {
            await tx.rollback().catch(() => {});
            return res.status(400).json({
              error: `Insufficient stock for ${product?.model || productId}: need ${quantity}, have ${product?.stock ?? 0}`,
            });
          }
        }

        // Check each serial number is In Stock
        for (const item of items) {
          if (!item.sn.startsWith("NOSN-")) {
            const [snRow] = await tx.unsafe(
              "SELECT status FROM serial_numbers WHERE sn = $1 FOR UPDATE",
              [item.sn],
            );
            if (!snRow || snRow.status !== "In Stock") {
              await tx.rollback().catch(() => {});
              return res.status(400).json({
                error: `Serial number ${item.sn} is not available (status: ${snRow?.status || "not found"})`,
              });
            }
          }
        }

        // --- All checks passed — proceed with writes ---
        await tx.unsafe(
          "INSERT INTO sales (id, customer_id, customer_name, subtotal, tax, tax_enabled, total, payment_method, staff_name, notes, due_date, is_paid, amount_paid, installments) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)",
          [
            id,
            customerId,
            customerName,
            String(subtotal),
            String(tax),
            taxEnabled ?? true,
            String(total),
            paymentMethod,
            staffName,
            notes || null,
            dueDate || null,
            isPaid ?? false,
            String(saleAmountPaid),
            installmentsJson,
          ],
        );

        for (const item of items) {
          // Look up product brand if not provided
          let brand = item.brand;
          if (!brand) {
            const [product] = await tx.unsafe("SELECT brand FROM products WHERE id = $1", [item.productId]);
            brand = product?.brand as string | undefined;
          }
          await tx.unsafe(
            "INSERT INTO sale_items (sale_id, product_id, brand, model, sn, price, cogs, warranty_expiry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
            [
              id,
              item.productId,
              brand || null,
              item.model,
              item.sn,
              String(item.price),
              String(item.cogs),
              item.warrantyExpiry,
            ],
          );

          // Only update SN status if it's a real serial number (not NOSN-xxx)
          if (!item.sn.startsWith("NOSN-")) {
            await tx.unsafe("UPDATE serial_numbers SET status = $1 WHERE sn = $2", [
              "Sold",
              item.sn,
            ]);
          }

          // Deduct stock — safe because we already verified stock > 0 with FOR UPDATE
          await tx.unsafe("UPDATE products SET stock = stock - 1 WHERE id = $1", [
            item.productId,
          ]);

          // Audit log - differentiate between SN and non-SN items
          const snLabel = item.sn.startsWith("NOSN-") ? "tanpa SN" : `SN: ${item.sn}`;
          await tx.unsafe(
            "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
            [
              `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              staffName,
              "Sales Deduction",
              `Sold 1 unit of ${item.model} (${snLabel}) to ${customerName}`,
              item.productId,
            ],
          );
        }

        // Audit log for sale
        await tx.unsafe(
          "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
          [
            `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            staffName,
            "Sale Created",
            `Sale ${id} - ${items.length} item(s), Total: Rp ${new Intl.NumberFormat("id-ID").format(total)}, Customer: ${customerName}`,
            id,
          ],
        );

        // Award loyalty points only for immediate-payment sales (Cash/Debit/QRIS/Transfer).
        // Utang sales get points when marked as paid (markSaleAsPaid / recordInstallment).
        if (isPaid !== false) {
          const pointsEarned = Math.floor(total / 1000);
          await tx.unsafe(
            "UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2",
            [pointsEarned, customerId],
          );
        }

        await tx.commit();

        // Return the created sale
        const result = await client.unsafe("SELECT * FROM sales WHERE id = $1", [id]);
        return res.status(201).json(parseDbSale(result[0]));
      } catch (err) {
        try { await tx.rollback(); } catch { /* rollback may fail if already rolled back */ }
        console.error("Sale error:", err);
        return res.status(500).json({ error: "Failed to create sale" });
      }
    }

    // PUT /api/sales/:id/mark-paid
    if (method === "PUT" && url?.startsWith("/api/sales/") && url.endsWith("/mark-paid")) {
      await initializeDatabase();
      const saleId = url.replace("/api/sales/", "").replace("/mark-paid", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { staffName } = input;

      if (!staffName) {
        return res.status(400).json({ error: "Missing staffName" });
      }

      try {
        // Fetch pre-update state to check if sale was already paid
        const [preUpdate] = await client.unsafe(
          "SELECT is_paid, customer_id, total FROM sales WHERE id = $1",
          [saleId],
        );
        if (!preUpdate) {
          return res.status(404).json({ error: "Sale not found" });
        }
        const wasAlreadyPaid = preUpdate.is_paid === true;

        const now = new Date().toISOString();
        const updateResult = await client.unsafe(
          "UPDATE sales SET is_paid = true, paid_at = $1 WHERE id = $2 RETURNING *",
          [now, saleId],
        );

        if (updateResult.length === 0) {
          return res.status(404).json({ error: "Sale not found" });
        }

        const sale = updateResult[0];

        // Award loyalty points only if transitioning from unpaid → paid.
        // Prevents double-counting: immediate-payment sales already got points at creation.
        let pointsAwarded = 0;
        if (!wasAlreadyPaid) {
          pointsAwarded = Math.floor(Number(sale.total) / 1000);
          if (pointsAwarded > 0) {
            await client.unsafe(
              "UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2",
              [pointsAwarded, sale.customer_id],
            );
          }
        }

        const pointsLogMsg = wasAlreadyPaid
          ? "Loyalty points: already awarded at sale creation"
          : `Loyalty points awarded: ${pointsAwarded}`;

        await client.unsafe(
          "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
          [
            `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            staffName,
            "General",
            `Marked sale ${saleId} as paid. ${pointsLogMsg}`,
            saleId,
          ],
        );

        return res.status(200).json(parseDbSale(sale));
      } catch (err) {
        console.error("Mark paid error:", err);
        return res.status(500).json({ error: "Failed to mark sale as paid" });
      }
    }

    // PUT /api/sales/:id/installment - Record an installment payment
    if (method === "PUT" && url?.startsWith("/api/sales/") && url.endsWith("/installment")) {
      await initializeDatabase();
      const saleId = url.replace("/api/sales/", "").replace("/installment", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { amount, staffName } = input;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }
      if (!staffName) {
        return res.status(400).json({ error: "Missing staffName" });
      }

      try {
        // Get current sale
        const saleResult = await client.unsafe("SELECT * FROM sales WHERE id = $1", [saleId]);
        if (saleResult.length === 0) {
          return res.status(404).json({ error: "Sale not found" });
        }
        const sale = saleResult[0];

        // Parse existing installments
        let installments: { amount: number; timestamp: string }[] = [];
        try {
          installments = JSON.parse(sale.installments || "[]");
        } catch { installments = []; }

        // Add new installment
        const now = new Date().toISOString();
        installments.push({ amount, timestamp: now });

        // Calculate new total paid
        const oldTotal = parseFloat(sale.amount_paid || "0");
        const newTotalPaid = oldTotal + amount;
        const saleTotal = parseFloat(sale.total);

        // Auto-mark as paid if total paid >= sale total
        const isNowPaid = newTotalPaid >= saleTotal;
        const updateFields = isNowPaid
          ? "installments = $1, amount_paid = $2, is_paid = true, paid_at = $3"
          : "installments = $1, amount_paid = $2";
        const params = isNowPaid
          ? [JSON.stringify(installments), String(newTotalPaid), now, saleId]
          : [JSON.stringify(installments), String(newTotalPaid), saleId];

        const updateResult = await client.unsafe(
          `UPDATE sales SET ${updateFields} WHERE id = $${isNowPaid ? 4 : 3} RETURNING *`,
          params,
        );

        // Award loyalty points when installment completes payment (unpaid → paid transition).
        // Prevents double-counting: points are only awarded once, at the moment the sale becomes fully paid.
        let pointsAwarded = 0;
        if (isNowPaid && !sale.is_paid) {
          pointsAwarded = Math.floor(parseFloat(sale.total) / 1000);
          if (pointsAwarded > 0) {
            await client.unsafe(
              "UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2",
              [pointsAwarded, sale.customer_id],
            );
          }
        }

        // Audit log
        const pointsLogSuffix = isNowPaid
          ? `. Loyalty points awarded: ${pointsAwarded}`
          : "";
        await client.unsafe(
          "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
          [
            `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            staffName,
            "General",
            `Installment of Rp ${new Intl.NumberFormat("id-ID").format(amount)} recorded for sale ${saleId}. Total paid: Rp ${new Intl.NumberFormat("id-ID").format(newTotalPaid)}/Rp ${new Intl.NumberFormat("id-ID").format(saleTotal)}${isNowPaid ? " (FULLY PAID)" : ""}${pointsLogSuffix}`,
            saleId,
          ],
        );

        return res.status(200).json(parseDbSale(updateResult[0]));
      } catch (err) {
        console.error("Installment error:", err);
        return res.status(500).json({ error: "Failed to record installment" });
      }
    }

    // === SALE ITEMS ROUTES ===

    // GET /api/sale-items
    if (method === "GET" && url === "/api/sale-items") {
      await initializeDatabase();
      const result = await client.unsafe("SELECT * FROM sale_items ORDER BY id DESC");
      return res.status(200).json(result.map(parseDbSaleItem));
    }

    // GET /api/sale-items/:saleId
    if (method === "GET" && url?.startsWith("/api/sale-items/")) {
      const saleId = url.replace("/api/sale-items/", "");
      await initializeDatabase();
      const result = await client.unsafe("SELECT * FROM sale_items WHERE sale_id = $1", [saleId]);
      return res.status(200).json(result.map(parseDbSaleItem));
    }

    // === WARRANTY CLAIMS ROUTES ===

    // GET /api/warranty-claims with pagination
    if (
      method === "GET" &&
      (url === "/api/warranty-claims" || url?.startsWith("/api/warranty-claims?"))
    ) {
      await initializeDatabase();
      const { page, limit } = getPageLimit(req);
      const offset = (page - 1) * limit;
      const result = await client.unsafe(
        `SELECT * FROM warranty_claims ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      const countResult = await client.unsafe("SELECT COUNT(*) as count FROM warranty_claims");
      const total = Number(countResult[0]?.count) || 0;
      return res.status(200).json({
        claims: result.map(parseDbWarrantyClaim),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    // POST /api/warranty-claims
    if (method === "POST" && url === "/api/warranty-claims") {
      await initializeDatabase();
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { id, sn, productModel, issue, status = "Pending" } = input;

      if (!id || !sn || !productModel || !issue) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await client.unsafe(
        "INSERT INTO warranty_claims (id, sn, product_model, issue, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [id, sn, productModel, issue, status],
      );

      return res.status(201).json(parseDbWarrantyClaim(result[0]));
    }

    // PUT /api/warranty-claims/:id
    if (method === "PUT" && url?.startsWith("/api/warranty-claims/")) {
      const claimId = url.replace("/api/warranty-claims/", "");
      await initializeDatabase();
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { status } = input;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const result = await client.unsafe(
        "UPDATE warranty_claims SET status = $1 WHERE id = $2 RETURNING *",
        [status, claimId],
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Claim not found" });
      }

      return res.status(200).json(parseDbWarrantyClaim(result[0]));
    }

    // GET /api/audit-logs with pagination
    if (method === "GET" && (url === "/api/audit-logs" || url?.startsWith("/api/audit-logs?"))) {
      await initializeDatabase();
      const { page, limit } = getPageLimit(req);
      const offset = (page - 1) * limit;
      const result = await client.unsafe(
        `SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      const countResult = await client.unsafe("SELECT COUNT(*) as count FROM audit_logs");
      const total = Number(countResult[0]?.count) || 0;
      const logs = result.map((row: Record<string, unknown>) => ({
        id: String(row.id),
        staffName: String(row.staff_name),
        action: String(row.action),
        details: String(row.details),
        relatedId: row.related_id ? String(row.related_id) : undefined,
        timestamp: String(row.timestamp),
      }));
      return res.status(200).json({
        logs,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    return res.status(404).json({ error: "Not found" });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: String(error) });
  }
}
