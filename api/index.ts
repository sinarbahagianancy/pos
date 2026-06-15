import type { VercelRequest, VercelResponse } from "@vercel/node";
import postgres from "postgres";

// ⚠️ DEPLOYMENT NOTE: Runtime migrations have been removed from this handler.
// All schema changes are in supabase/drizzle/ SQL migration files.
// Migrations MUST be applied to the production DB BEFORE deploying this code.
// See: 0003_runtime_migrations.sql and 0004_data_migrations.sql

const connectionString = process.env.DATABASE_URL || "";

// Lazy client: only connects when first query runs, not at module load.
// This avoids paying the TLS handshake cost during cold start module initialization.
let _client: ReturnType<typeof postgres> | null = null;
function getClient() {
  if (!_client) {
    _client = postgres(connectionString, {
      prepare: false,
      max: 1,
      idle_timeout: 120, // Keep connection alive 2min to survive between Vercel function invocations
      connect_timeout: 5, // Fail fast -- retry logic handles transient failures
    });
  }
  return _client;
}

// Wrapper that retries queries on connection errors (common during cold starts)
async function query<T = Record<string, unknown>[]>(sql: string, params?: unknown[]): Promise<T> {
  const c = getClient();
  try {
    return (await c.unsafe(sql, params as any[])) as T;
  } catch (err: any) {
    // Connection errors during cold start: reset client and retry once
    if (
      err?.code === "ECONNRESET" ||
      err?.code === "ECONNREFUSED" ||
      err?.message?.includes("Connection")
    ) {
      _client = null; // Force fresh connection on next getClient()
      const fresh = getClient();
      return (await fresh.unsafe(sql, params as any[])) as T;
    }
    throw err;
  }
}

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
  poNumber?: string;
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
const parseApiRestockHistory = (
  value: unknown,
): { sn: string[]; inv: string; timestamp: string }[] => {
  if (!value) return [];
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      if (
        parsed.length > 0 &&
        typeof parsed[0] === "object" &&
        parsed[0] !== null &&
        "inv" in parsed[0]
      ) {
        return parsed
          .filter(
            (e: unknown) =>
              typeof e === "object" && e !== null && "inv" in (e as Record<string, unknown>),
          )
          .map((e: Record<string, unknown>) => ({
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
  } catch {
    installments = [];
  }
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    customerName: row.customer_name as string,
    items: [],
    subtotal:
      typeof row.subtotal === "string" ? parseFloat(row.subtotal) : (row.subtotal as number),
    tax: typeof row.tax === "string" ? parseFloat(row.tax) : (row.tax as number),
    taxEnabled: row.tax_enabled as boolean,
    total: typeof row.total === "string" ? parseFloat(row.total) : (row.total as number),
    paymentMethod: row.payment_method as PaymentMethod,
    staffName: row.staff_name as string,
    notes: row.notes as string | undefined,
    poNumber: (row.po_number as string | undefined) ?? "",
    dueDate: row.due_date as string | undefined,
    isPaid: row.is_paid as boolean,
    paidAt: row.paid_at as string | undefined,
    amountPaid:
      typeof row.amount_paid === "string"
        ? parseFloat(row.amount_paid) || 0
        : (row.amount_paid as number) || 0,
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

// ============================================================
// Quotation types & parsers
// ============================================================

type QuotationStatus = "Pending" | "Approved" | "Rejected" | "Canceled";

interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  brand?: string;
  model: string;
  sn: string;
  price: number;
  quantity: number;
}

interface Quotation {
  id: string;
  customerId?: string;
  customerName: string;
  items: QuotationItem[];
  subtotal: number;
  tax: number;
  taxEnabled?: boolean;
  total: number;
  staffName: string;
  notes?: string;
  poNumber?: string;
  status: QuotationStatus;
  rejectionReason?: string;
  convertedSaleId?: string;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

const parseDbQuotationItem = (row: Record<string, unknown>): QuotationItem => ({
  id: row.id as string,
  quotationId: row.quotation_id as string,
  productId: row.product_id as string,
  brand: row.brand as string | undefined,
  model: row.model as string,
  sn: row.sn as string,
  price: typeof row.price === "string" ? parseFloat(row.price) : (row.price as number),
  quantity: row.quantity as number,
});

const parseDbQuotation = (
  row: Record<string, unknown>,
  items: QuotationItem[] = [],
): Quotation => ({
  id: row.id as string,
  customerId: (row.customer_id as string | undefined) ?? undefined,
  customerName: row.customer_name as string,
  items,
  subtotal: typeof row.subtotal === "string" ? parseFloat(row.subtotal) : (row.subtotal as number),
  tax: typeof row.tax === "string" ? parseFloat(row.tax) : (row.tax as number),
  taxEnabled: row.tax_enabled as boolean,
  total: typeof row.total === "string" ? parseFloat(row.total) : (row.total as number),
  staffName: row.staff_name as string,
  notes: (row.notes as string | undefined) ?? undefined,
  poNumber: ((row.po_number as string | undefined) ?? "") as string,
  status: (row.status as QuotationStatus) ?? "Pending",
  rejectionReason: (row.rejection_reason as string | undefined) ?? undefined,
  convertedSaleId: (row.converted_sale_id as string | undefined) ?? undefined,
  createdAt: row.created_at as string,
  decidedAt: (row.decided_at as string | undefined) ?? undefined,
  decidedBy: (row.decided_by as string | undefined) ?? undefined,
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
    let sql = `SELECT ${cols} FROM ${table}`;
    const params: (string | number | boolean | null)[] = [];

    if (where) {
      params.push(where.value as string | number | boolean | null);
      sql += ` WHERE ${where.column} = $${params.length}`;
    }

    const result = await query(sql, params);
    return result;
  },

  insert: async (table: string, data: Record<string, unknown>[]) => {
    if (data.length === 0) return [];

    const keys = Object.keys(data[0]);
    const values = data.map((d) => keys.map((k) => d[k]));
    const placeholders = values
      .map((_, i) => `(${keys.map((_, j) => `$${i * keys.length + j + 1}`).join(", ")})`)
      .join(", ");

    const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES ${placeholders} RETURNING *`;
    const flatValues = values.flat() as (string | number | boolean | null)[];
    const result = await query(sql, flatValues);
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
    const sql = `UPDATE ${table} SET ${sets}, updated_at = NOW() WHERE ${where.column} = $${Object.keys(data).length + 1} RETURNING *`;
    const result = await query(sql, [
      ...(Object.values(data) as (string | number | boolean | null)[]),
      where.value as string | number | boolean | null,
    ]);
    return result;
  },

  delete: async (table: string, where: { column: string; value: unknown }) => {
    const sql = `DELETE FROM ${table} WHERE ${where.column} = $1`;
    await query(sql, [where.value as string | number | boolean | null]);
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
    const result = await query(
      `SELECT * FROM ${table} WHERE ${whereClause} ORDER BY ${orderBy} LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const countResult = await query(`SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`);
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
            ? JSON.stringify([
                {
                  sn: validated.serialNumbers || [],
                  inv: validated.invoiceNumber,
                  timestamp: new Date().toISOString(),
                },
              ])
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

      await query(
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
      const { staffName = "System", ...productInput } = input;
      const validated = validateUpdateProductInput(productInput);

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

      const {
        productId,
        newStock,
        reason,
        staffName = "System",
        supplier,
        dateRestocked,
        invoiceNumber,
      } = input;

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
      const sns = await query(
        "SELECT sn FROM serial_numbers WHERE product_id = $1 AND status = $2",
        [productId, "In Stock"],
      );
      if (sns.length > 0) {
        return res.status(400).json({
          error: `Produk memiliki ${sns.length} nomor seri yang belum terjual. Hapus atau jual nomor seri tersebut terlebih dahulu.`,
        });
      }

      // Check for NOSN stock (stock without serial numbers)
      const product = await query("SELECT stock FROM products WHERE id = $1", [productId]);
      if (product.length > 0) {
        const stock = Number(product[0].stock);
        const totalSNs = await query(
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

      // Get product info for audit logging
      const [productInfo] = await query("SELECT brand, model FROM products WHERE id = $1", [
        productId,
      ]);

      // Soft delete - mark as deleted (same as dev server)
      await query("UPDATE products SET deleted = true, updated_at = NOW() WHERE id = $1", [
        productId,
      ]);

      // Audit log for product deletion
      if (productInfo) {
        try {
          await query(
            "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
            [
              `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              "System",
              "Product Deleted",
              `Deleted product: ${productInfo.brand} ${productInfo.model}`,
              productId,
            ],
          );
        } catch (e) {
          console.warn("Failed to record product deletion audit log:", e);
        }
      }

      return res.status(204).send(null);
    }

    // POST /api/products/:id/toggle-hidden
    if (method === "POST" && url?.startsWith("/api/products/") && url.includes("/toggle-hidden")) {
      const productId = url.replace("/api/products/", "").replace("/toggle-hidden", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { hidden, staffName = "System" } = input;

      // Get product info for audit logging
      const [productInfo] = await query("SELECT brand, model FROM products WHERE id = $1", [
        productId,
      ]);

      try {
        await db.update("products", { hidden: hidden ? 1 : 0 }, { column: "id", value: productId });
      } catch (err) {
        // Column might not exist, try to add it first
        try {
          await query("ALTER TABLE products ADD COLUMN IF NOT EXISTS hidden INTEGER DEFAULT 0");
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

      // Audit log for product hidden/unhidden
      if (productInfo) {
        try {
          await query(
            "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
            [
              `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              staffName,
              "Product Hidden",
              `${hidden ? "Hidden" : "Unhidden"} product: ${productInfo.brand} ${productInfo.model}`,
              productId,
            ],
          );
        } catch (e) {
          console.warn("Failed to record product toggle hidden audit log:", e);
        }
      }

      const result = await query("SELECT * FROM products WHERE id = $1", [productId]);
      return res.status(200).json(parseDbProduct(result[0]));
    }

    // POST /api/products/:id/restore
    if (method === "POST" && url?.startsWith("/api/products/") && url.includes("/restore")) {
      const productId = url.replace("/api/products/", "").replace("/restore", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { staffName: restoreStaffName = "System" } = input || {};

      // Get product info for audit logging
      const [restoreProductInfo] = await query("SELECT brand, model FROM products WHERE id = $1", [
        productId,
      ]);

      try {
        await db.update("products", { deleted: false }, { column: "id", value: productId });
      } catch (err) {
        try {
          await query(
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false",
          );
          await db.update("products", { deleted: false }, { column: "id", value: productId });
        } catch (addErr) {
          console.error("Failed to restore product:", addErr);
          return res.status(500).json({ error: "Failed to restore product" });
        }
      }

      // Audit log for product restore
      if (restoreProductInfo) {
        try {
          await query(
            "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
            [
              `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              restoreStaffName,
              "Product Restored",
              `Restored product: ${restoreProductInfo.brand} ${restoreProductInfo.model}`,
              productId,
            ],
          );
        } catch (e) {
          console.warn("Failed to record product restore audit log:", e);
        }
      }

      const result = await query("SELECT * FROM products WHERE id = $1", [productId]);
      return res.status(200).json(parseDbProduct(result[0]));
    }

    // GET /api/serial-numbers (supports ?status= filter)
    if (
      method === "GET" &&
      (url === "/api/serial-numbers" || url?.startsWith("/api/serial-numbers?"))
    ) {
      const queryStatus = (req.query as Record<string, string>)?.status;
      let result;
      if (queryStatus) {
        result = await query("SELECT * FROM serial_numbers WHERE status = $1", [queryStatus]);
      } else {
        result = await query("SELECT * FROM serial_numbers");
      }
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

      // @ts-ignore - Map iteration
      const productIds = Array.from(productCounts.keys());

      // Batch-fetch ALL product data upfront (eliminates N+1)
      const productRows = await query(
        `SELECT id, brand, model, invoice_number FROM products WHERE id = ANY($1)`,
        [productIds],
      );
      const productsById = new Map<string, Record<string, unknown>>();
      for (const row of productRows) {
        productsById.set(row.id as string, row);
      }

      // Build all updates in-memory, then execute in parallel
      const supplierInfo = supplier || "Unknown";
      const dateInfo = date || new Date().toISOString().split("T")[0];
      const reasonInfo = reason || "Not specified";
      const invoiceInfo = invoiceNumber || "-";
      const auditRows: (string | number)[][] = [];

      const updatePromises = [];
      // @ts-ignore - Map iteration
      for (const [productId, { count, sns }] of productCounts) {
        const product = productsById.get(productId);
        if (!product) continue;

        const setClauses = ["stock = stock + $1", "updated_at = NOW()"];
        const params: (string | number | Date | null)[] = [count];
        let paramIdx = 2;

        if (supplier) {
          setClauses.push(`supplier = $${paramIdx++}`);
          params.push(supplier);
        }
        if (date) {
          setClauses.push(`date_restocked = $${paramIdx++}`);
          params.push(new Date(date));
        }
        if (invoiceNumber) {
          const existing = parseApiRestockHistory(product.invoice_number);
          existing.push({ sn: sns, inv: invoiceNumber, timestamp: new Date().toISOString() });
          setClauses.push(`invoice_number = $${paramIdx++}`);
          params.push(JSON.stringify(existing));
        }
        params.push(productId);

        updatePromises.push(
          query(`UPDATE products SET ${setClauses.join(", ")} WHERE id = $${paramIdx}`, params),
        );

        // Batch audit log rows
        const snList = sns.join(", ");
        auditRows.push([
          `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          "System",
          `Added ${count} serial number(s) to ${product.brand || ""} ${product.model || ""} from supplier ${supplierInfo} on ${dateInfo}, invoice: ${invoiceInfo}, reason: ${reasonInfo}. SN: ${snList}`,
          productId,
        ]);
      }

      // Execute all product updates in parallel
      await Promise.all(updatePromises);

      // Batch insert all audit logs in one query
      if (auditRows.length > 0) {
        // Each row has 4 values: [id, staff_name, details, related_id]
        // action is hardcoded as 'Stock Addition' literal
        const placeholders = auditRows
          .map(
            (_, i) =>
              `($${i * 4 + 1}, $${i * 4 + 2}, 'Stock Addition', $${i * 4 + 3}, $${i * 4 + 4}, NOW())`,
          )
          .join(", ");
        await query(
          `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ${placeholders}`,
          auditRows.flat(),
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
      const [existingSN] = await query(
        "SELECT product_id, status FROM serial_numbers WHERE sn = $1",
        [sn],
      );

      const result = await query(
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
          await query(
            "UPDATE products SET stock = GREATEST(stock - 1, 0), updated_at = NOW() WHERE id = $1",
            [existingSN.product_id],
          );
        } else if (!wasInStock && nowInStock) {
          // SN returned to inventory — increment stock
          await query("UPDATE products SET stock = stock + 1, updated_at = NOW() WHERE id = $1", [
            existingSN.product_id,
          ]);
        }
      }

      // Create audit log for status change
      if (existingSN) {
        const [product] = await query("SELECT brand, model FROM products WHERE id = $1", [
          existingSN.product_id,
        ]);
        const reasonInfo = reason || "Not specified";
        const stockChangeNote =
          existingSN.status !== status
            ? wasInStock
              ? " (stock decremented)"
              : nowInStock
                ? " (stock incremented)"
                : ""
            : "";

        await query(
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
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name, password } = input;

      if (!name || !password) {
        return res.status(400).json({ error: "Name and password required" });
      }

      const passwordHash = btoa(password);
      const result = await query(
        "SELECT id, name, role FROM staff_members WHERE name = $1 AND password_hash = $2",
        [name, passwordHash],
      );

      if (!result || result.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result[0];

      // Record login audit log
      try {
        await query(
          "INSERT INTO audit_logs (id, staff_name, action, details, timestamp) VALUES ($1, $2, $3, $4, NOW())",
          [
            `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            user.name,
            "Login",
            `Staff ${user.name} logged in`,
          ],
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
          await query(
            "INSERT INTO audit_logs (id, staff_name, action, details, timestamp) VALUES ($1, $2, $3, $4, NOW())",
            [
              `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              name,
              "Logout",
              `Staff ${name} logged out`,
            ],
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
      const result = await query(
        "SELECT id, name, role, created_at FROM staff_members ORDER BY name",
      );
      return res.status(200).json(result.map(parseDbStaffMember));
    }

    // POST /api/staff
    if (method === "POST" && url === "/api/staff") {
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name, password, role = "Staff" } = input;

      if (!name || !password) {
        return res.status(400).json({ error: "Name and password required" });
      }

      const passwordHash = btoa(password);

      try {
        const result = await query(
          "INSERT INTO staff_members (name, role, password_hash) VALUES ($1, $2, $3) RETURNING id, name, role, created_at",
          [name, role, passwordHash],
        );

        // Audit log for staff creation
        try {
          await query(
            "INSERT INTO audit_logs (id, staff_name, action, details, timestamp) VALUES ($1, $2, $3, $4, NOW())",
            [
              `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              input.staffName || "System",
              "Staff Created",
              `Created staff member: ${name} (role: ${role})`,
            ],
          );
        } catch (e) {
          console.warn("Failed to record staff creation audit log:", e);
        }

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

      // Get staff name for audit logging
      const [staffInfo] = await query("SELECT name FROM staff_members WHERE id = $1", [staffId]);

      await query("DELETE FROM staff_members WHERE id = $1", [staffId]);

      // Audit log for staff deletion
      if (staffInfo) {
        try {
          await query(
            "INSERT INTO audit_logs (id, staff_name, action, details, timestamp) VALUES ($1, $2, $3, $4, NOW())",
            [
              `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              "System",
              "Staff Deleted",
              `Deleted staff member: ${staffInfo.name}`,
            ],
          );
        } catch (e) {
          console.warn("Failed to record staff deletion audit log:", e);
        }
      }

      return res.status(204).send(null);
    }

    // PUT /api/staff/:id
    if (method === "PUT" && url?.startsWith("/api/staff/")) {
      const staffId = url.replace("/api/staff/", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name, role, password } = input;

      const [current] = await query("SELECT * FROM staff_members WHERE id = $1", [staffId]);
      if (!current) {
        return res.status(404).json({ error: "Staff not found" });
      }

      const newName = name ?? current.name;
      const newRole = role ?? current.role;
      const newPasswordHash = password ? btoa(password) : current.password_hash;

      const result = await query(
        "UPDATE staff_members SET name = $1, role = $2, password_hash = $3 WHERE id = $4 RETURNING id, name, role, created_at",
        [newName, newRole, newPasswordHash, staffId],
      );

      // Audit log for staff update
      const changes: string[] = [];
      if (name && name !== current.name) changes.push(`name: ${current.name} -> ${name}`);
      if (role && role !== current.role) changes.push(`role: ${current.role} -> ${role}`);
      if (password) changes.push("password updated");

      if (changes.length > 0) {
        try {
          await query(
            "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
            [
              `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              input.staffName || "System",
              "Staff Updated",
              `Updated staff ${current.name}: ${changes.join(", ")}`,
              staffId,
            ],
          );
        } catch (e) {
          console.warn("Failed to record staff update audit log:", e);
        }
      }

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
      const result = await query("SELECT * FROM store_config WHERE id = 1");
      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Store config not found" });
      }
      return res.status(200).json(parseDbStoreConfig(result[0]));
    }

    // PUT /api/store-config
    if (method === "PUT" && url === "/api/store-config") {
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { storeName, address, ppnRate, currency, monthlyTarget } = input;

      // Get current config for audit logging
      const currentConfig = await query("SELECT * FROM store_config WHERE id = 1");

      const result = await query(
        "UPDATE store_config SET store_name = $1, address = $2, ppn_rate = $3, currency = $4, monthly_target = $5, updated_at = NOW() WHERE id = 1 RETURNING *",
        [storeName, address, ppnRate, currency, monthlyTarget || 500000000],
      );

      // Audit log for store config update
      if (currentConfig && currentConfig.length > 0) {
        const cur = currentConfig[0];
        const changes: string[] = [];
        if (storeName && storeName !== cur.store_name)
          changes.push(`storeName: ${cur.store_name} -> ${storeName}`);
        if (address && address !== cur.address)
          changes.push(`address: ${cur.address} -> ${address}`);
        if (ppnRate !== undefined && String(ppnRate) !== String(cur.ppn_rate))
          changes.push(`ppnRate: ${cur.ppn_rate} -> ${ppnRate}`);
        if (currency && currency !== cur.currency)
          changes.push(`currency: ${cur.currency} -> ${currency}`);
        if (monthlyTarget !== undefined && String(monthlyTarget) !== String(cur.monthly_target))
          changes.push(`monthlyTarget: ${cur.monthly_target} -> ${monthlyTarget}`);

        if (changes.length > 0) {
          try {
            await query(
              "INSERT INTO audit_logs (id, staff_name, action, details, timestamp) VALUES ($1, $2, $3, $4, NOW())",
              [
                `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                input.staffName || "System",
                "Settings Update",
                `Updated store config: ${changes.join(", ")}`,
              ],
            );
          } catch (e) {
            console.warn("Failed to record store config audit log:", e);
          }
        }
      }

      return res.status(200).json(parseDbStoreConfig(result[0]));
    }

    // === SUPPLIER ROUTES ===

    // GET /api/suppliers with pagination
    if (method === "GET" && (url === "/api/suppliers" || url?.startsWith("/api/suppliers?"))) {
      const { page, limit } = getPageLimit(req);
      const offset = (page - 1) * limit;
      const result = await query(
        `SELECT * FROM suppliers WHERE deleted = false ORDER BY name LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      const countResult = await query(
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
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name, phone, address } = input as { name: string; phone?: string; address?: string };

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      try {
        await query("INSERT INTO suppliers (name, phone, address) VALUES ($1, $2, $3)", [
          name,
          phone || null,
          address || null,
        ]);

        const result = await query("SELECT * FROM suppliers WHERE name = $1", [name]);

        // Audit log for supplier creation
        try {
          await query(
            "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
            [
              `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              input.staffName || "System",
              "Supplier Created",
              `Created supplier: ${name}${phone ? `, phone: ${phone}` : ""}${address ? `, address: ${address}` : ""}`,
              result[0].id,
            ],
          );
        } catch (e) {
          console.warn("Failed to record supplier creation audit log:", e);
        }

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
      const supplierId = url.replace("/api/suppliers/", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name, phone, address } = input as {
        name?: string;
        phone?: string;
        address?: string;
        staffName?: string;
      };

      // Get old supplier for audit logging
      const [oldSupplier] = await query("SELECT * FROM suppliers WHERE id = $1", [supplierId]);

      const updates: string[] = [];
      const values: unknown[] = [];
      const changeDescriptions: string[] = [];
      let paramIndex = 1;

      if (name !== undefined && (!oldSupplier || name !== oldSupplier.name)) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
        if (oldSupplier) changeDescriptions.push(`name: ${oldSupplier.name} -> ${name}`);
      }
      if (phone !== undefined && (!oldSupplier || phone !== oldSupplier.phone)) {
        updates.push(`phone = $${paramIndex++}`);
        values.push(phone);
        if (oldSupplier)
          changeDescriptions.push(`phone: ${oldSupplier.phone || "-"} -> ${phone || "-"}`);
      }
      if (address !== undefined && (!oldSupplier || address !== oldSupplier.address)) {
        updates.push(`address = $${paramIndex++}`);
        values.push(address);
        if (oldSupplier)
          changeDescriptions.push(`address: ${oldSupplier.address || "-"} -> ${address || "-"}`);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      values.push(supplierId);

      // @ts-ignore - values array type
      await query(
        `UPDATE suppliers SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
        values as any,
      );

      // Audit log for supplier update
      if (changeDescriptions.length > 0 && oldSupplier) {
        try {
          await query(
            "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
            [
              `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              input.staffName || "System",
              "Supplier Updated",
              `Updated supplier ${oldSupplier.name}: ${changeDescriptions.join(", ")}`,
              supplierId,
            ],
          );
        } catch (e) {
          console.warn("Failed to record supplier update audit log:", e);
        }
      }

      const result = await query("SELECT * FROM suppliers WHERE id = $1", [supplierId]);
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
      const supplierId = url.replace("/api/suppliers/", "");

      // Get supplier name for audit logging
      const [delSupplier] = await query("SELECT name FROM suppliers WHERE id = $1", [supplierId]);

      await query("UPDATE suppliers SET deleted = true WHERE id = $1", [supplierId]);

      // Audit log for supplier deletion
      if (delSupplier) {
        try {
          await query(
            "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
            [
              `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              "System",
              "Supplier Deleted",
              `Deleted supplier: ${delSupplier.name}`,
              supplierId,
            ],
          );
        } catch (e) {
          console.warn("Failed to record supplier deletion audit log:", e);
        }
      }

      return res.status(200).json({ success: true });
    }

    // === CUSTOMER ROUTES ===

    // GET /api/customers with pagination
    if (method === "GET" && (url === "/api/customers" || url?.startsWith("/api/customers?"))) {
      const { page, limit } = getPageLimit(req);
      const offset = (page - 1) * limit;
      const result = await query(
        `SELECT * FROM customers WHERE deleted = false ORDER BY name LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      const countResult = await query(
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
      const result = await query("SELECT * FROM customers WHERE id = $1", [customerId]);
      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }
      return res.status(200).json(parseDbCustomer(result[0]));
    }

    // POST /api/customers
    if (method === "POST" && url === "/api/customers") {
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { id, name, phone, email, address, npwp, loyaltyPoints = 0 } = input;

      if (!id || !name) {
        return res.status(400).json({ error: "ID and name are required" });
      }

      const result = await query(
        "INSERT INTO customers (id, name, phone, email, address, npwp, loyalty_points) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [id, name, phone || null, email || null, address || null, npwp || null, loyaltyPoints],
      );

      // Audit log for customer creation
      try {
        await query(
          "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
          [
            `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            input.staffName || "System",
            "Customer Created",
            `Created customer: ${name}${phone ? `, phone: ${phone}` : ""}${email ? `, email: ${email}` : ""}`,
            id,
          ],
        );
      } catch (e) {
        console.warn("Failed to record customer creation audit log:", e);
      }

      return res.status(201).json(parseDbCustomer(result[0]));
    }

    // PUT /api/customers/:id
    if (method === "PUT" && url?.startsWith("/api/customers/")) {
      const customerId = url.replace("/api/customers/", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { name, phone, email, address, npwp, loyaltyPoints, staffName = "System" } = input;

      // Get old customer for audit logging
      const [oldCustomer] = await query("SELECT * FROM customers WHERE id = $1", [customerId]);
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
        changeDescriptions.push(
          `loyaltyPoints: ${oldCustomer.loyalty_points || 0} -> ${loyaltyPoints}`,
        );
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      updates.push(`updated_at = NOW()`);
      values.push(customerId);

      const result = await query(
        `UPDATE customers SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
        values as (string | number | null)[],
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Audit log for customer update
      await query(
        "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
        [
          `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          staffName,
          "Customer Updated",
          `Updated customer: ${changeDescriptions.join(", ")}`,
          customerId,
        ],
      );

      return res.status(200).json(parseDbCustomer(result[0]));
    }

    // DELETE /api/customers/:id
    if (method === "DELETE" && url?.startsWith("/api/customers/")) {
      const customerId = url.replace("/api/customers/", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { staffName = "System" } = input || {};

      // Get customer name for audit logging
      const [customer] = await query("SELECT name FROM customers WHERE id = $1", [customerId]);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Soft delete - set deleted = true
      await query("UPDATE customers SET deleted = true, updated_at = NOW() WHERE id = $1", [
        customerId,
      ]);

      // Audit log for customer deletion
      await query(
        "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
        [
          `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          staffName,
          "Customer Deleted",
          `Deleted customer: ${customer.name}`,
          customerId,
        ],
      );

      return res.status(204).send(null);
    }

    // === SALES ROUTES ===

    // GET /api/sales with pagination
    if (method === "GET" && (url === "/api/sales" || url?.startsWith("/api/sales?"))) {
      const { page, limit } = getPageLimit(req);
      const offset = (page - 1) * limit;

      // Use a single JOIN query instead of N+1 queries
      // 1) Get paginated sale IDs first (lightweight)
      const saleIds = await query(
        `SELECT id FROM sales ORDER BY timestamp DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      const countResult = await query("SELECT COUNT(*) as count FROM sales");
      const total = Number(countResult[0]?.count) || 0;

      if (saleIds.length === 0) {
        return res.status(200).json({ sales: [], total: 0, page, limit, totalPages: 0 });
      }

      // 2) Fetch all sales + their items in ONE query using JOIN
      const idList = saleIds.map((r: Record<string, unknown>) => r.id as string);
      const placeholders = idList.map((_: string, i: number) => `$${i + 1}`).join(", ");
      const joinedRows = await query(
        `SELECT s.*, si.id as si_id, si.product_id as si_product_id, si.brand as si_brand,
                si.model as si_model, si.sn as si_sn, si.price as si_price,
                si.cogs as si_cogs, si.warranty_expiry as si_warranty_expiry
         FROM sales s
         LEFT JOIN sale_items si ON s.id = si.sale_id
         WHERE s.id IN (${placeholders})
         ORDER BY s.timestamp DESC`,
        idList,
      );

      // 3) Group joined rows back into sales with items
      const salesMap = new Map<string, Record<string, unknown>>();
      const itemsMap = new Map<string, Record<string, unknown>[]>();

      for (const row of joinedRows) {
        const saleId = row.id as string;
        if (!salesMap.has(saleId)) {
          salesMap.set(saleId, row);
          itemsMap.set(saleId, []);
        }
        // Only add item if LEFT JOIN produced one (si_id is not null)
        if (row.si_id) {
          itemsMap.get(saleId)!.push({
            id: row.si_id,
            sale_id: saleId,
            product_id: row.si_product_id,
            brand: row.si_brand,
            model: row.si_model,
            sn: row.si_sn,
            price: row.si_price,
            cogs: row.si_cogs,
            warranty_expiry: row.si_warranty_expiry,
          });
        }
      }

      // 4) Build response in original order
      const salesWithItems = idList.map((saleId: string) => {
        const sale = salesMap.get(saleId)!;
        const items = (itemsMap.get(saleId) || []).map((item) => parseDbSaleItem(item));
        return { ...parseDbSale(sale), items };
      });

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
      const result = await query(
        "SELECT * FROM sales WHERE customer_id = $1 ORDER BY timestamp DESC",
        [customerId],
      );
      return res.status(200).json(result.map(parseDbSale));
    }

    // POST /api/sales - Create new sale
    if (method === "POST" && url === "/api/sales") {
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
        poNumber,
        dueDate,
        isPaid,
        amountPaid,
      } = input;

      if (!id || !customerId || !items || items.length === 0 || !paymentMethod || !staffName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // PO Number is mandatory — reject empty/whitespace-only values
      const trimmedPo = typeof poNumber === "string" ? poNumber.trim() : "";
      if (!trimmedPo) {
        return res.status(400).json({ error: "PO Number is required" });
      }

      const saleAmountPaid = amountPaid || 0;
      const installmentsJson =
        saleAmountPaid > 0
          ? JSON.stringify([{ amount: saleAmountPaid, timestamp: new Date().toISOString() }])
          : "[]";

      try {
        const result = await getClient().begin(async (tx) => {
          // Aggregate quantities by product
          const productQuantities = new Map<string, number>();
          for (const item of items) {
            productQuantities.set(item.productId, (productQuantities.get(item.productId) || 0) + 1);
          }

          // Batch check: get all products at once
          const productIds = Array.from(productQuantities.keys());
          if (productIds.length === 0) throw new Error("No products");

          const productsCheck = await tx.unsafe(
            `SELECT id, stock, model FROM products WHERE id = ANY($1)`,
            [productIds],
          );

          for (const [productId, quantity] of productQuantities) {
            const product = productsCheck.find((p: any) => p.id === productId);
            if (!product || Number(product.stock) < quantity) {
              throw new Error(
                `Insufficient stock for ${product?.model || productId}: need ${quantity}, have ${product?.stock ?? 0}`,
              );
            }
          }

          // Batch check: get all SNs at once
          const realSNs = items.filter((i) => !i.sn.startsWith("NOSN-")).map((i) => i.sn);
          if (realSNs.length > 0) {
            const snCheck = await tx.unsafe(
              `SELECT sn, status FROM serial_numbers WHERE sn = ANY($1)`,
              [realSNs],
            );
            for (const item of items) {
              if (item.sn.startsWith("NOSN-")) continue;
              const snRow = snCheck.find((s: any) => s.sn === item.sn);
              if (!snRow || snRow.status !== "In Stock") {
                throw new Error(
                  `Serial number ${item.sn} is not available (status: ${snRow?.status || "not found"})`,
                );
              }
            }
          }
          // Insert sale
          await tx.unsafe(
            `INSERT INTO sales (id, customer_id, customer_name, subtotal, tax, tax_enabled, total, payment_method, staff_name, notes, po_number, due_date, is_paid, amount_paid, installments) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
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
              trimmedPo,
              dueDate || null,
              isPaid ?? false,
              String(saleAmountPaid),
              installmentsJson,
            ],
          );

          // Batch insert sale_items
          const saleItemValues = items.map((item) => [
            id,
            item.productId,
            item.brand || null,
            item.model,
            item.sn,
            String(item.price),
            String(item.cogs),
            item.warrantyExpiry,
          ]);
          const saleItemPlaceholders = saleItemValues
            .map(
              (_, i) =>
                `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`,
            )
            .join(", ");
          await tx.unsafe(
            `INSERT INTO sale_items (sale_id, product_id, brand, model, sn, price, cogs, warranty_expiry) VALUES ${saleItemPlaceholders}`,
            saleItemValues.flat(),
          );

          // Batch update SNs
          if (realSNs.length > 0) {
            const snPlaceholders = realSNs.map((_, i) => `$${i + 1}`).join(", ");
            await tx.unsafe(
              `UPDATE serial_numbers SET status = 'Sold' WHERE sn IN (${snPlaceholders})`,
              realSNs,
            );
          }

          // Batch update stock
          for (const [productId, qty] of productQuantities) {
            await tx.unsafe(`UPDATE products SET stock = stock - $1 WHERE id = $2`, [
              qty,
              productId,
            ]);
          }

          // Batch audit logs
          const auditValues = [
            [
              `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              staffName,
              "Sale Created",
              `Sale ${id} - ${items.length} items, Total: Rp ${new Intl.NumberFormat("id-ID").format(total)}, Customer: ${customerName}`,
              id,
            ],
          ];
          items.forEach((item) => {
            const snLabel = item.sn.startsWith("NOSN-") ? "tanpa SN" : `SN: ${item.sn}`;
            auditValues.push([
              `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              staffName,
              "Sales Deduction",
              `Sold 1 unit of ${item.model} (${snLabel}) to ${customerName}`,
              item.productId,
            ]);
          });
          const auditPlaceholders = auditValues
            .map(
              (_, i) =>
                `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5}, NOW())`,
            )
            .join(", ");
          await tx.unsafe(
            `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ${auditPlaceholders}`,
            auditValues.flat(),
          );

          // Loyalty points
          if (isPaid !== false) {
            const pointsEarned = Math.floor(total / 1000);
            await tx.unsafe(
              `UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2`,
              [pointsEarned, customerId],
            );
          }

          // Return the created sale
          const saleResult = await tx.unsafe(`SELECT * FROM sales WHERE id = $1`, [id]);
          return parseDbSale(saleResult[0]);
        });
        return res.status(201).json(result);
      } catch (err) {
        console.error("Sale error:", err);
        const message = err instanceof Error ? err.message : "Failed to create sale";
        const status =
          message.includes("Insufficient stock") || message.includes("not available") ? 400 : 500;
        return res.status(status).json({ error: message });
      }
    }

    // PUT /api/sales/:id/mark-paid
    if (method === "PUT" && url?.startsWith("/api/sales/") && url.endsWith("/mark-paid")) {
      const saleId = url.replace("/api/sales/", "").replace("/mark-paid", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { staffName } = input;

      if (!staffName) {
        return res.status(400).json({ error: "Missing staffName" });
      }

      try {
        // Fetch pre-update state to check if sale was already paid
        const [preUpdate] = await query(
          "SELECT is_paid, customer_id, total FROM sales WHERE id = $1",
          [saleId],
        );
        if (!preUpdate) {
          return res.status(404).json({ error: "Sale not found" });
        }
        const wasAlreadyPaid = preUpdate.is_paid === true;

        const now = new Date().toISOString();
        const updateResult = await query(
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
            await query(
              "UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2",
              [pointsAwarded, sale.customer_id],
            );
          }
        }

        const pointsLogMsg = wasAlreadyPaid
          ? "Loyalty points: already awarded at sale creation"
          : `Loyalty points awarded: ${pointsAwarded}`;

        await query(
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
        const saleResult = await query("SELECT * FROM sales WHERE id = $1", [saleId]);
        if (saleResult.length === 0) {
          return res.status(404).json({ error: "Sale not found" });
        }
        const sale = saleResult[0];

        // Parse existing installments
        let installments: { amount: number; timestamp: string }[] = [];
        try {
          installments = JSON.parse(sale.installments || "[]");
        } catch {
          installments = [];
        }

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

        const updateResult = await query(
          `UPDATE sales SET ${updateFields} WHERE id = $${isNowPaid ? 4 : 3} RETURNING *`,
          params,
        );

        // Award loyalty points when installment completes payment (unpaid → paid transition).
        // Prevents double-counting: points are only awarded once, at the moment the sale becomes fully paid.
        let pointsAwarded = 0;
        if (isNowPaid && !sale.is_paid) {
          pointsAwarded = Math.floor(parseFloat(sale.total) / 1000);
          if (pointsAwarded > 0) {
            await query(
              "UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2",
              [pointsAwarded, sale.customer_id],
            );
          }
        }

        // Audit log
        const pointsLogSuffix = isNowPaid ? `. Loyalty points awarded: ${pointsAwarded}` : "";
        await query(
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
      const result = await query("SELECT * FROM sale_items ORDER BY id DESC");
      return res.status(200).json(result.map(parseDbSaleItem));
    }

    // GET /api/sale-items/:saleId
    if (method === "GET" && url?.startsWith("/api/sale-items/")) {
      const saleId = url.replace("/api/sale-items/", "");
      const result = await query("SELECT * FROM sale_items WHERE sale_id = $1", [saleId]);
      return res.status(200).json(result.map(parseDbSaleItem));
    }

    // === QUOTATION ROUTES ===

    // GET /api/quotations?page=&limit=&status=
    if (method === "GET" && (url === "/api/quotations" || url?.startsWith("/api/quotations?"))) {
      try {
        const page = parseInt((req.query as Record<string, string>)?.page || "1", 10) || 1;
        const limit = parseInt((req.query as Record<string, string>)?.limit || "20", 10) || 20;
        const status = (req.query as Record<string, string>)?.status as QuotationStatus | undefined;
        const offset = (page - 1) * limit;

        const hasStatus =
          status && ["Pending", "Approved", "Rejected", "Canceled"].includes(status);
        const filterClause = hasStatus ? "WHERE status = $3" : "";
        const countParams: unknown[] = [];
        if (hasStatus) countParams.push(status);

        const countResult = await query(
          `SELECT COUNT(*) as count FROM quotations ${filterClause}`,
          countParams,
        );
        const total = Number(countResult[0]?.count) || 0;

        const dataParams: unknown[] = [limit, offset];
        if (hasStatus) dataParams.push(status);
        const result = await query(
          `SELECT * FROM quotations ${filterClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
          dataParams,
        );

        // Fetch items for all returned quotations
        const ids: string[] = result.map((r: Record<string, unknown>) => r.id as string);
        const itemsMap = new Map<string, QuotationItem[]>();
        if (ids.length > 0) {
          const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
          const itemRows = await query(
            `SELECT * FROM quotation_items WHERE quotation_id IN (${placeholders}) ORDER BY id`,
            ids,
          );
          for (const row of itemRows) {
            const item = parseDbQuotationItem(row);
            if (!itemsMap.has(item.quotationId)) itemsMap.set(item.quotationId, []);
            itemsMap.get(item.quotationId)!.push(item);
          }
        }

        return res.status(200).json({
          quotations: result.map((r: Record<string, unknown>) =>
            parseDbQuotation(r, itemsMap.get(r.id as string) || []),
          ),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        });
      } catch (err) {
        console.error("Get quotations error:", err);
        return res.status(500).json({ error: "Failed to fetch quotations" });
      }
    }

    // GET /api/quotations/:id
    if (
      method === "GET" &&
      url?.startsWith("/api/quotations/") &&
      !url.endsWith("/approve") &&
      !url.endsWith("/reject") &&
      !url.endsWith("/cancel")
    ) {
      const quotationId = decodeURIComponent(url.replace("/api/quotations/", ""));
      try {
        const result = await query("SELECT * FROM quotations WHERE id = $1", [quotationId]);
        if (result.length === 0) {
          return res.status(404).json({ error: "Quotation not found" });
        }
        const itemRows = await query(
          "SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id",
          [quotationId],
        );
        return res
          .status(200)
          .json(parseDbQuotation(result[0], itemRows.map(parseDbQuotationItem)));
      } catch (err) {
        console.error("Get quotation error:", err);
        return res.status(500).json({ error: "Failed to fetch quotation" });
      }
    }

    // POST /api/quotations - Create new quotation
    if (method === "POST" && url === "/api/quotations") {
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const {
        customerId,
        customerName,
        items,
        subtotal,
        tax,
        taxEnabled,
        total,
        staffName,
        notes,
        poNumber,
      } = input;

      if (!items || items.length === 0) {
        return res.status(400).json({ error: "Quotation must have at least 1 item" });
      }
      if (!customerName || !String(customerName).trim()) {
        return res.status(400).json({ error: "Customer name is required" });
      }
      if (!staffName) {
        return res.status(400).json({ error: "Missing staffName" });
      }
      const trimmedPo = typeof poNumber === "string" ? poNumber.trim() : "";
      if (!trimmedPo) {
        return res.status(400).json({ error: "PO Number is required" });
      }

      try {
        const result = await getClient().begin(async (tx) => {
          // Atomically allocate the next Quotation number for today
          const counterResult = await tx.unsafe(
            `INSERT INTO quotation_counters (date, last_number) VALUES (CURRENT_DATE, 1)
             ON CONFLICT (date) DO UPDATE SET last_number = quotation_counters.last_number + 1
             RETURNING last_number`,
          );
          const seq = counterResult[0].last_number as number;
          const now = new Date();
          const dd = String(now.getDate()).padStart(2, "0");
          const mm = String(now.getMonth() + 1).padStart(2, "0");
          const yyyy = now.getFullYear();
          const quotationId = `SB/${dd}/${mm}/${yyyy}-${String(seq).padStart(3, "0")}`;

          await tx.unsafe(
            `INSERT INTO quotations (id, customer_id, customer_name, subtotal, tax, tax_enabled, total, staff_name, notes, po_number, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending')`,
            [
              quotationId,
              customerId || null,
              customerName,
              String(subtotal),
              String(tax),
              taxEnabled ?? true,
              String(total),
              staffName,
              notes || null,
              trimmedPo,
            ],
          );

          for (const item of items) {
            await tx.unsafe(
              `INSERT INTO quotation_items (quotation_id, product_id, brand, model, sn, price, quantity)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                quotationId,
                item.productId,
                item.brand || null,
                item.model,
                item.sn || "",
                String(item.price),
                item.quantity || 1,
              ],
            );
          }

          await tx.unsafe(
            `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              staffName,
              "Quotation Created",
              `Quotation ${quotationId} created - ${items.length} item(s), Total: Rp ${new Intl.NumberFormat("id-ID").format(total)}, Customer: ${customerName}`,
              quotationId,
            ],
          );

          const created = await tx.unsafe("SELECT * FROM quotations WHERE id = $1", [quotationId]);
          const createdItems = await tx.unsafe(
            "SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id",
            [quotationId],
          );
          return parseDbQuotation(created[0], createdItems.map(parseDbQuotationItem));
        });
        return res.status(201).json(result);
      } catch (err) {
        console.error("Quotation create error:", err);
        const message = err instanceof Error ? err.message : "Failed to create quotation";
        return res.status(400).json({ error: message });
      }
    }

    // PUT /api/quotations/:id/approve - Approve and convert to Sale
    if (method === "PUT" && url?.startsWith("/api/quotations/") && url.endsWith("/approve")) {
      const quotationId = decodeURIComponent(
        url.replace("/api/quotations/", "").replace("/approve", ""),
      );
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { itemSns, paymentMethod, staffName, dueDate, amountPaid, itemPrices } = input || {};

      if (!paymentMethod) return res.status(400).json({ error: "Payment method is required" });
      if (!staffName) return res.status(400).json({ error: "Missing staffName" });

      try {
        const result = await getClient().begin(async (tx) => {
          // 1) Lock the Quotation row
          const qRows = await tx.unsafe("SELECT * FROM quotations WHERE id = $1 FOR UPDATE", [
            quotationId,
          ]);
          if (qRows.length === 0) throw new Error("Quotation not found");
          const quotation = qRows[0];
          if (quotation.status !== "Pending") {
            throw new Error(`Quotation is already ${quotation.status}`);
          }

          // 2) Fetch items
          const itemRows = await tx.unsafe(
            "SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id",
            [quotationId],
          );
          if (itemRows.length === 0) throw new Error("Quotation has no items");

          const snOverride = new Map<string, string>();
          for (const o of itemSns || []) snOverride.set(o.itemId, o.sn);
          const priceOverride = new Map<string, number>();
          for (const o of itemPrices || []) priceOverride.set(o.itemId, o.price);

          // 3) Pre-flight: check SNs and stock
          for (const itemRow of itemRows) {
            const itemId = itemRow.id as string;
            const effectiveSn = snOverride.get(itemId) ?? (itemRow.sn as string);
            if (effectiveSn && !effectiveSn.startsWith("NOSN-")) {
              const [snCheck] = await tx.unsafe(
                "SELECT status FROM serial_numbers WHERE sn = $1 FOR UPDATE",
                [effectiveSn],
              );
              if (!snCheck || snCheck.status !== "In Stock") {
                throw new Error(
                  `Serial number ${effectiveSn} is no longer available (status: ${snCheck?.status ?? "not found"})`,
                );
              }
            }
            const productId = itemRow.product_id as string;
            const qty = itemRow.quantity as number;
            const [productCheck] = await tx.unsafe(
              "SELECT stock, model FROM products WHERE id = $1 FOR UPDATE",
              [productId],
            );
            if (!productCheck || Number(productCheck.stock) < qty) {
              throw new Error(
                `Insufficient stock for ${productCheck?.model ?? productId}: need ${qty}, have ${productCheck?.stock ?? 0}`,
              );
            }
          }

          // 4) Compute totals
          let subtotalCalc = 0;
          for (const itemRow of itemRows) {
            const itemId = itemRow.id as string;
            const basePrice =
              priceOverride.get(itemId) ??
              (typeof itemRow.price === "string"
                ? parseFloat(itemRow.price)
                : (itemRow.price as number));
            subtotalCalc += basePrice * (itemRow.quantity as number);
          }
          const taxCalc = quotation.tax_enabled
            ? typeof quotation.tax === "string"
              ? parseFloat(quotation.tax)
              : (quotation.tax as number)
            : 0;
          const totalCalc = subtotalCalc + taxCalc;

          const saleId = `INV-${Date.now()}`;
          const saleAmountPaid = Number(amountPaid) || 0;
          const installmentsJson =
            saleAmountPaid > 0
              ? JSON.stringify([{ amount: saleAmountPaid, timestamp: new Date().toISOString() }])
              : "[]";

          // 5) Insert Sale
          await tx.unsafe(
            `INSERT INTO sales (id, customer_id, customer_name, subtotal, tax, tax_enabled, total, payment_method, staff_name, notes, po_number, quotation_id, due_date, is_paid, amount_paid, installments)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [
              saleId,
              quotation.customer_id,
              quotation.customer_name,
              String(subtotalCalc),
              String(taxCalc),
              quotation.tax_enabled,
              String(totalCalc),
              paymentMethod,
              staffName,
              quotation.notes || null,
              quotation.po_number || "",
              quotationId,
              dueDate || null,
              paymentMethod !== "Utang" || saleAmountPaid >= totalCalc,
              String(saleAmountPaid),
              installmentsJson,
            ],
          );

          // 6) Insert sale_items, mark SNs Sold, deduct stock
          for (const itemRow of itemRows) {
            const itemId = itemRow.id as string;
            const effectiveSn = snOverride.get(itemId) ?? (itemRow.sn as string);
            const effectivePrice =
              priceOverride.get(itemId) ??
              (typeof itemRow.price === "string"
                ? parseFloat(itemRow.price)
                : (itemRow.price as number));
            const productId = itemRow.product_id as string;
            const qty = itemRow.quantity as number;

            const productRow = await tx.unsafe("SELECT * FROM products WHERE id = $1", [productId]);
            const product = productRow[0];
            const warrantyMonths = (product?.warranty_months as number) ?? 0;
            const nowDate = new Date();
            const expiry = new Date(nowDate);
            expiry.setMonth(expiry.getMonth() + warrantyMonths);
            const warrantyExpiry = expiry.toISOString();
            const cogs = product?.cogs != null ? String(product.cogs) : "0";

            await tx.unsafe(
              `INSERT INTO sale_items (sale_id, product_id, brand, model, sn, price, cogs, warranty_expiry, quantity)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                saleId,
                productId,
                itemRow.brand || product?.brand || null,
                itemRow.model,
                effectiveSn,
                String(effectivePrice),
                cogs,
                warrantyExpiry,
                qty,
              ],
            );

            if (effectiveSn && !effectiveSn.startsWith("NOSN-")) {
              await tx.unsafe("UPDATE serial_numbers SET status = 'Sold' WHERE sn = $1", [
                effectiveSn,
              ]);
            }
            await tx.unsafe("UPDATE products SET stock = stock - $1 WHERE id = $2", [
              qty,
              productId,
            ]);

            const snLabel =
              effectiveSn && !effectiveSn.startsWith("NOSN-") ? `SN: ${effectiveSn}` : "tanpa SN";
            await tx.unsafe(
              `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
              [
                `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                staffName,
                "Sales Deduction",
                `Sold ${qty} unit(s) of ${itemRow.model} (${snLabel}) to ${quotation.customer_name} (from Quotation ${quotationId})`,
                productId,
              ],
            );
          }

          // 7) Update Quotation status
          const decidedAt = new Date().toISOString();
          await tx.unsafe(
            `UPDATE quotations SET status = 'Approved', converted_sale_id = $1, decided_at = $2, decided_by = $3 WHERE id = $4`,
            [saleId, decidedAt, staffName, quotationId],
          );

          // 8) Loyalty points
          if ((paymentMethod !== "Utang" || saleAmountPaid >= totalCalc) && quotation.customer_id) {
            const pointsEarned = Math.floor(totalCalc / 1000);
            if (pointsEarned > 0) {
              await tx.unsafe(
                "UPDATE customers SET loyalty_points = loyalty_points + $1, updated_at = NOW() WHERE id = $2",
                [pointsEarned, quotation.customer_id],
              );
            }
          }

          // 9) Audit logs
          await tx.unsafe(
            `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              staffName,
              "Sale Created",
              `Sale ${saleId} created from Quotation ${quotationId} - ${itemRows.length} item(s), Total: Rp ${new Intl.NumberFormat("id-ID").format(totalCalc)}, Customer: ${quotation.customer_name}`,
              saleId,
            ],
          );
          await tx.unsafe(
            `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              staffName,
              "Quotation Approved",
              `Quotation ${quotationId} approved → converted to Sale ${saleId}`,
              quotationId,
            ],
          );

          const updatedQ = await tx.unsafe("SELECT * FROM quotations WHERE id = $1", [quotationId]);
          const itemsForReturn = itemRows.map((r: Record<string, unknown>) =>
            parseDbQuotationItem({
              ...r,
              sn: snOverride.get(r.id as string) ?? r.sn,
              price: priceOverride.get(r.id as string)?.toString() ?? r.price,
            }),
          );
          return {
            quotation: parseDbQuotation(updatedQ[0], itemsForReturn),
            sale: { id: saleId },
          };
        });
        return res.status(200).json(result);
      } catch (err) {
        console.error("Approve quotation error:", err);
        const message = err instanceof Error ? err.message : "Failed to approve quotation";
        return res
          .status(
            message.includes("already") ||
              message.includes("no longer") ||
              message.includes("Insufficient")
              ? 409
              : 400,
          )
          .json({ error: message });
      }
    }

    // PUT /api/quotations/:id/reject
    if (method === "PUT" && url?.startsWith("/api/quotations/") && url.endsWith("/reject")) {
      const quotationId = decodeURIComponent(
        url.replace("/api/quotations/", "").replace("/reject", ""),
      );
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { reason, staffName } = input || {};

      const trimmedReason = typeof reason === "string" ? reason.trim() : "";
      if (!trimmedReason) return res.status(400).json({ error: "Reason is required" });
      if (!staffName) return res.status(400).json({ error: "Missing staffName" });

      try {
        const result = await getClient().begin(async (tx) => {
          const rows = await tx.unsafe("SELECT * FROM quotations WHERE id = $1 FOR UPDATE", [
            quotationId,
          ]);
          if (rows.length === 0) throw new Error("Quotation not found");
          if (rows[0].status !== "Pending") {
            throw new Error(`Quotation is already ${rows[0].status}`);
          }
          const now = new Date().toISOString();
          await tx.unsafe(
            `UPDATE quotations SET status = 'Rejected', rejection_reason = $1, decided_at = $2, decided_by = $3 WHERE id = $4`,
            [trimmedReason, now, staffName, quotationId],
          );
          await tx.unsafe(
            `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              staffName,
              "Quotation Rejected",
              `Quotation ${quotationId} rejected - reason: ${trimmedReason}`,
              quotationId,
            ],
          );
          const updated = await tx.unsafe("SELECT * FROM quotations WHERE id = $1", [quotationId]);
          return parseDbQuotation(updated[0], []);
        });
        return res.status(200).json(result);
      } catch (err) {
        console.error("Reject quotation error:", err);
        const message = err instanceof Error ? err.message : "Failed to reject quotation";
        return res.status(message.includes("already") ? 409 : 400).json({ error: message });
      }
    }

    // PUT /api/quotations/:id/cancel
    if (method === "PUT" && url?.startsWith("/api/quotations/") && url.endsWith("/cancel")) {
      const quotationId = decodeURIComponent(
        url.replace("/api/quotations/", "").replace("/cancel", ""),
      );
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { reason, staffName } = input || {};

      const trimmedReason = typeof reason === "string" ? reason.trim() : "";
      if (!trimmedReason) return res.status(400).json({ error: "Reason is required" });
      if (!staffName) return res.status(400).json({ error: "Missing staffName" });

      try {
        const result = await getClient().begin(async (tx) => {
          const rows = await tx.unsafe("SELECT * FROM quotations WHERE id = $1 FOR UPDATE", [
            quotationId,
          ]);
          if (rows.length === 0) throw new Error("Quotation not found");
          if (rows[0].status !== "Pending") {
            throw new Error(`Quotation is already ${rows[0].status}`);
          }
          const now = new Date().toISOString();
          await tx.unsafe(
            `UPDATE quotations SET status = 'Canceled', rejection_reason = $1, decided_at = $2, decided_by = $3 WHERE id = $4`,
            [trimmedReason, now, staffName, quotationId],
          );
          await tx.unsafe(
            `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              staffName,
              "Quotation Canceled",
              `Quotation ${quotationId} canceled - reason: ${trimmedReason}`,
              quotationId,
            ],
          );
          const updated = await tx.unsafe("SELECT * FROM quotations WHERE id = $1", [quotationId]);
          return parseDbQuotation(updated[0], []);
        });
        return res.status(200).json(result);
      } catch (err) {
        console.error("Cancel quotation error:", err);
        const message = err instanceof Error ? err.message : "Failed to cancel quotation";
        return res.status(message.includes("already") ? 409 : 400).json({ error: message });
      }
    }

    // === WARRANTY CLAIMS ROUTES ===

    // GET /api/warranty-claims with pagination
    if (
      method === "GET" &&
      (url === "/api/warranty-claims" || url?.startsWith("/api/warranty-claims?"))
    ) {
      const { page, limit } = getPageLimit(req);
      const offset = (page - 1) * limit;
      const result = await query(
        `SELECT * FROM warranty_claims ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      const countResult = await query("SELECT COUNT(*) as count FROM warranty_claims");
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
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { id, sn, productModel, issue, status = "Pending" } = input;

      if (!id || !sn || !productModel || !issue) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await query(
        "INSERT INTO warranty_claims (id, sn, product_model, issue, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [id, sn, productModel, issue, status],
      );

      // Audit log for warranty claim creation
      try {
        await query(
          "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
          [
            `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            input.staffName || "System",
            "Warranty Created",
            `Created warranty claim for ${productModel} (SN: ${sn}), issue: ${issue}`,
            id,
          ],
        );
      } catch (e) {
        console.warn("Failed to record warranty creation audit log:", e);
      }

      return res.status(201).json(parseDbWarrantyClaim(result[0]));
    }

    // PUT /api/warranty-claims/:id
    if (method === "PUT" && url?.startsWith("/api/warranty-claims/")) {
      const claimId = url.replace("/api/warranty-claims/", "");
      const input = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const { status } = input;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      // Get old claim for audit logging
      const [oldClaim] = await query("SELECT * FROM warranty_claims WHERE id = $1", [claimId]);

      const result = await query(
        "UPDATE warranty_claims SET status = $1 WHERE id = $2 RETURNING *",
        [status, claimId],
      );

      if (!result || result.length === 0) {
        return res.status(404).json({ error: "Claim not found" });
      }

      // Audit log for warranty claim update
      if (oldClaim) {
        try {
          await query(
            "INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())",
            [
              `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              input.staffName || "System",
              "Warranty Updated",
              `Updated warranty claim for ${oldClaim.product_model} (SN: ${oldClaim.sn}): status ${oldClaim.status} -> ${status}`,
              claimId,
            ],
          );
        } catch (e) {
          console.warn("Failed to record warranty update audit log:", e);
        }
      }

      return res.status(200).json(parseDbWarrantyClaim(result[0]));
    }

    // ============================================================
    // Surat Jalan
    // ============================================================
    if (method === "GET" && (url === "/api/surat-jalan" || url?.startsWith("/api/surat-jalan?"))) {
      const { page, limit } = getPageLimit(req);
      const offset = (page - 1) * limit;
      const search = (req.query?.search as string | undefined) || "";
      const whereClause = search
        ? `WHERE id ILIKE $3 OR customer_name ILIKE $3 OR po_number ILIKE $3`
        : "";
      const params: (string | number)[] = search ? [limit, offset, `%${search}%`] : [limit, offset];
      const result = await query(
        `SELECT * FROM surat_jalan ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        params,
      );
      const countResult = await query(
        `SELECT COUNT(*) as count FROM surat_jalan ${whereClause}`,
        search ? [`%${search}%`] : [],
      );
      const total = Number(countResult[0]?.count) || 0;
      const sjIds = result.map((r: Record<string, unknown>) => r.id as string);
      let itemsBySj: Record<string, unknown[]> = {};
      if (sjIds.length > 0) {
        const placeholders = sjIds.map((_, i) => `$${i + 1}`).join(",");
        const itemsResult = await query(
          `SELECT * FROM surat_jalan_items WHERE surat_jalan_id IN (${placeholders}) ORDER BY id`,
          sjIds,
        );
        for (const it of itemsResult) {
          const sid = it.surat_jalan_id as string;
          if (!itemsBySj[sid]) itemsBySj[sid] = [];
          itemsBySj[sid].push(it);
        }
      }
      return res.status(200).json({
        suratJalan: result.map((r: Record<string, unknown>) => ({
          id: r.id,
          customerId: r.customer_id || undefined,
          customerName: r.customer_name,
          poNumber: r.po_number || "",
          notes: r.notes || undefined,
          staffName: r.staff_name,
          items: (itemsBySj[r.id as string] || []).map((it: any) => ({
            id: it.id,
            suratJalanId: it.surat_jalan_id,
            productId: it.product_id,
            brand: it.brand || undefined,
            model: it.model,
            sn: it.sn,
            quantity: it.quantity,
          })),
          createdAt: String(r.created_at),
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    if (method === "POST" && url === "/api/surat-jalan") {
      const input = body as Record<string, unknown>;
      const items = Array.isArray(input.items) ? input.items : [];
      if (items.length === 0) {
        return res.status(400).json({ error: "Surat Jalan must have at least 1 item" });
      }
      const customerName = String(input.customerName ?? "").trim();
      if (!customerName) return res.status(400).json({ error: "Customer name is required" });
      const staffName = String(input.staffName ?? "").trim();
      if (!staffName) return res.status(400).json({ error: "Missing staffName" });
      const poNumber = String(input.poNumber ?? "").trim();
      if (!poNumber) return res.status(400).json({ error: "PO Number is required" });

      try {
        const result = await getClient().begin(async (tx) => {
          const counterResult = await tx.unsafe(
            `INSERT INTO surat_jalan_counters (date, last_number) VALUES (CURRENT_DATE, 1)
             ON CONFLICT (date) DO UPDATE SET last_number = surat_jalan_counters.last_number + 1
             RETURNING last_number`,
          );
          const seq = (counterResult[0] as { last_number: number }).last_number;
          const now = new Date();
          const dd = String(now.getDate()).padStart(2, "0");
          const mm = String(now.getMonth() + 1).padStart(2, "0");
          const yyyy = now.getFullYear();
          const sjId = `SJ/${dd}/${mm}/${yyyy}-${String(seq).padStart(3, "0")}`;

          const productQuantities = new Map<string, number>();
          for (const it of items as Array<Record<string, unknown>>) {
            const qty = typeof it.quantity === "number" ? it.quantity : 1;
            productQuantities.set(
              String(it.productId),
              (productQuantities.get(String(it.productId)) || 0) + qty,
            );
          }
          for (const [productId, quantity] of productQuantities) {
            const [product] = await tx.unsafe(
              "SELECT stock, model FROM products WHERE id = $1 FOR UPDATE",
              [productId],
            );
            if (!product) throw new Error(`Product ${productId} not found`);
            if (Number((product as { stock: number }).stock) < quantity) {
              throw new Error(
                `Insufficient stock for ${(product as { model: string }).model}: need ${quantity}, have ${(product as { stock: number }).stock}`,
              );
            }
          }
          for (const it of items as Array<Record<string, unknown>>) {
            const sn = it.sn ? String(it.sn) : "";
            if (sn && !sn.startsWith("NOSN-")) {
              const [snRow] = await tx.unsafe(
                "SELECT status FROM serial_numbers WHERE sn = $1 FOR UPDATE",
                [sn],
              );
              if (!snRow || (snRow as { status: string }).status !== "In Stock") {
                throw new Error(`Serial number ${sn} is not available`);
              }
            }
          }

          await tx.unsafe(
            `INSERT INTO surat_jalan (id, customer_id, customer_name, po_number, notes, staff_name)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              sjId,
              input.customerId ? String(input.customerId) : null,
              customerName,
              poNumber,
              input.notes ? String(input.notes) : null,
              staffName,
            ],
          );

          for (const it of items as Array<Record<string, unknown>>) {
            const qty = typeof it.quantity === "number" ? it.quantity : 1;
            let brand: string | null = it.brand ? String(it.brand) : null;
            if (!brand) {
              const [product] = await tx.unsafe("SELECT brand FROM products WHERE id = $1", [
                String(it.productId),
              ]);
              brand = (product as { brand?: string } | undefined)?.brand || null;
            }
            const sn = it.sn ? String(it.sn) : "";
            await tx.unsafe(
              `INSERT INTO surat_jalan_items (surat_jalan_id, product_id, brand, model, sn, quantity)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [sjId, String(it.productId), brand, String(it.model), sn, qty],
            );
            await tx.unsafe(
              "UPDATE products SET stock = GREATEST(stock - $1, 0), updated_at = NOW() WHERE id = $2",
              [qty, String(it.productId)],
            );
            if (sn && !sn.startsWith("NOSN-")) {
              await tx.unsafe("UPDATE serial_numbers SET status = 'Sold' WHERE sn = $1", [sn]);
            }
            const snLabel = !sn || sn.startsWith("NOSN-") ? "tanpa SN" : `SN: ${sn}`;
            await tx.unsafe(
              `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
              [
                `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                staffName,
                "Sales Deduction",
                `Delivered via SJ ${sjId}: ${qty} unit(s) of ${String(it.model)} (${snLabel}) to ${customerName}`,
                String(it.productId),
              ],
            );
          }
          await tx.unsafe(
            `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              staffName,
              "Surat Jalan Created",
              `SJ ${sjId} — ${items.length} item(s), Customer: ${customerName}, PO: ${poNumber}`,
              sjId,
            ],
          );
          const [header] = await tx.unsafe("SELECT * FROM surat_jalan WHERE id = $1", [sjId]);
          const itemRows = await tx.unsafe(
            "SELECT * FROM surat_jalan_items WHERE surat_jalan_id = $1 ORDER BY id",
            [sjId],
          );
          return { ...(header as Record<string, unknown>), items: itemRows };
        });
        return res.status(201).json(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create Surat Jalan";
        return res.status(400).json({ error: message });
      }
    }

    if (method === "GET" && url?.startsWith("/api/surat-jalan/")) {
      const sjId = decodeURIComponent(url.replace("/api/surat-jalan/", ""));
      const [header] = await query("SELECT * FROM surat_jalan WHERE id = $1", [sjId]);
      if (!header) return res.status(404).json({ error: "Surat Jalan not found" });
      const itemRows = await query(
        "SELECT * FROM surat_jalan_items WHERE surat_jalan_id = $1 ORDER BY id",
        [sjId],
      );
      return res.status(200).json({ ...header, items: itemRows });
    }

    // ============================================================
    // Surat Penarikan Barang
    // ============================================================
    if (
      method === "GET" &&
      (url === "/api/surat-penarikan" || url?.startsWith("/api/surat-penarikan?"))
    ) {
      const { page, limit } = getPageLimit(req);
      const offset = (page - 1) * limit;
      const search = (req.query?.search as string | undefined) || "";
      const whereClause = search ? `WHERE id ILIKE $3 OR recipient ILIKE $3` : "";
      const params: (string | number)[] = search ? [limit, offset, `%${search}%`] : [limit, offset];
      const result = await query(
        `SELECT * FROM surat_penarikan ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        params,
      );
      const countResult = await query(
        `SELECT COUNT(*) as count FROM surat_penarikan ${whereClause}`,
        search ? [`%${search}%`] : [],
      );
      const total = Number(countResult[0]?.count) || 0;
      const spbIds = result.map((r: Record<string, unknown>) => r.id as string);
      let itemsBySpb: Record<string, unknown[]> = {};
      if (spbIds.length > 0) {
        const placeholders = spbIds.map((_, i) => `$${i + 1}`).join(",");
        const itemsResult = await query(
          `SELECT * FROM surat_penarikan_items WHERE surat_penarikan_id IN (${placeholders}) ORDER BY id`,
          spbIds,
        );
        for (const it of itemsResult) {
          const sid = it.surat_penarikan_id as string;
          if (!itemsBySpb[sid]) itemsBySpb[sid] = [];
          itemsBySpb[sid].push(it);
        }
      }
      return res.status(200).json({
        suratPenarikan: result.map((r: Record<string, unknown>) => ({
          id: r.id,
          recipient: r.recipient,
          reason: r.reason,
          alasanLainnya: r.alasan_lainnya || undefined,
          notes: r.notes || undefined,
          staffName: r.staff_name,
          items: (itemsBySpb[r.id as string] || []).map((it: any) => ({
            id: it.id,
            suratPenarikanId: it.surat_penarikan_id,
            productId: it.product_id,
            brand: it.brand || undefined,
            model: it.model,
            sn: it.sn,
            quantity: it.quantity,
          })),
          createdAt: String(r.created_at),
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    if (method === "POST" && url === "/api/surat-penarikan") {
      const input = body as Record<string, unknown>;
      const items = Array.isArray(input.items) ? input.items : [];
      if (items.length === 0) {
        return res.status(400).json({ error: "Surat Penarikan must have at least 1 item" });
      }
      const recipient = String(input.recipient ?? "").trim();
      if (!recipient) return res.status(400).json({ error: "Recipient (Penarik) is required" });
      const reason = String(input.reason ?? "");
      const validReasons = [
        "Rusak",
        "Expired",
        "Dipakai Internal",
        "Sample/Display",
        "Employee Sale",
        "Hilang",
        "Recall",
        "Lainnya",
      ];
      if (!validReasons.includes(reason)) {
        return res.status(400).json({ error: `Invalid reason: ${reason}` });
      }
      const alasanLainnya = input.alasanLainnya ? String(input.alasanLainnya).trim() : undefined;
      if (reason === "Lainnya" && !alasanLainnya) {
        return res
          .status(400)
          .json({ error: "alasan_lainnya is required when reason = 'Lainnya'" });
      }
      const staffName = String(input.staffName ?? "").trim();
      if (!staffName) return res.status(400).json({ error: "Missing staffName" });

      try {
        const result = await getClient().begin(async (tx) => {
          const counterResult = await tx.unsafe(
            `INSERT INTO surat_penarikan_counters (date, last_number) VALUES (CURRENT_DATE, 1)
             ON CONFLICT (date) DO UPDATE SET last_number = surat_penarikan_counters.last_number + 1
             RETURNING last_number`,
          );
          const seq = (counterResult[0] as { last_number: number }).last_number;
          const now = new Date();
          const dd = String(now.getDate()).padStart(2, "0");
          const mm = String(now.getMonth() + 1).padStart(2, "0");
          const yyyy = now.getFullYear();
          const spbId = `SPB/${dd}/${mm}/${yyyy}-${String(seq).padStart(3, "0")}`;
          const reasonLabel =
            reason === "Lainnya" && alasanLainnya ? `Lainnya: ${alasanLainnya}` : reason;

          await tx.unsafe(
            `INSERT INTO surat_penarikan (id, recipient, reason, alasan_lainnya, notes, staff_name)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              spbId,
              recipient,
              reason,
              alasanLainnya || null,
              input.notes ? String(input.notes) : null,
              staffName,
            ],
          );

          for (const it of items as Array<Record<string, unknown>>) {
            const requestedQty = typeof it.quantity === "number" ? it.quantity : 1;
            const [product] = await tx.unsafe(
              "SELECT stock, model FROM products WHERE id = $1 FOR UPDATE",
              [String(it.productId)],
            );
            if (!product) throw new Error(`Product ${String(it.productId)} not found`);
            const available = Number((product as { stock: number }).stock);
            const actualQty = Math.min(requestedQty, available);
            let brand: string | null = it.brand ? String(it.brand) : null;
            if (!brand) {
              const [prodBrand] = await tx.unsafe("SELECT brand FROM products WHERE id = $1", [
                String(it.productId),
              ]);
              brand = (prodBrand as { brand?: string } | undefined)?.brand || null;
            }
            let sn = it.sn ? String(it.sn) : "";
            if (sn && !sn.startsWith("NOSN-")) {
              const [snRow] = await tx.unsafe(
                "SELECT status FROM serial_numbers WHERE sn = $1 FOR UPDATE",
                [sn],
              );
              if (!snRow || (snRow as { status: string }).status !== "In Stock") {
                sn = "";
              } else {
                await tx.unsafe("UPDATE serial_numbers SET status = 'Damaged' WHERE sn = $1", [sn]);
              }
            }
            await tx.unsafe(
              `INSERT INTO surat_penarikan_items (surat_penarikan_id, product_id, brand, model, sn, quantity)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [spbId, String(it.productId), brand, String(it.model), sn, actualQty],
            );
            if (actualQty > 0) {
              await tx.unsafe(
                "UPDATE products SET stock = GREATEST(stock - $1, 0), updated_at = NOW() WHERE id = $2",
                [actualQty, String(it.productId)],
              );
            }
            const snLabel = !sn || sn.startsWith("NOSN-") ? "tanpa SN" : `SN: ${sn}`;
            const detailShort =
              requestedQty > actualQty
                ? ` (capped: requested ${requestedQty}, available ${available})`
                : "";
            await tx.unsafe(
              `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
              [
                `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                staffName,
                "Sales Deduction",
                `Penarikan: ${actualQty} unit(s) of ${String(it.model)} (${snLabel}) by ${recipient}, reason: ${reasonLabel}${detailShort}`,
                String(it.productId),
              ],
            );
          }
          await tx.unsafe(
            `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              staffName,
              "Surat Penarikan Created",
              `SPB ${spbId} — ${items.length} item(s), Penarik: ${recipient}, Alasan: ${reasonLabel}`,
              spbId,
            ],
          );
          const [header] = await tx.unsafe("SELECT * FROM surat_penarikan WHERE id = $1", [spbId]);
          const itemRows = await tx.unsafe(
            "SELECT * FROM surat_penarikan_items WHERE surat_penarikan_id = $1 ORDER BY id",
            [spbId],
          );
          return { ...(header as Record<string, unknown>), items: itemRows };
        });
        return res.status(201).json(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create Surat Penarikan";
        return res.status(400).json({ error: message });
      }
    }

    if (method === "GET" && url?.startsWith("/api/surat-penarikan/")) {
      const spbId = decodeURIComponent(url.replace("/api/surat-penarikan/", ""));
      const [header] = await query("SELECT * FROM surat_penarikan WHERE id = $1", [spbId]);
      if (!header) return res.status(404).json({ error: "Surat Penarikan not found" });
      const itemRows = await query(
        "SELECT * FROM surat_penarikan_items WHERE surat_penarikan_id = $1 ORDER BY id",
        [spbId],
      );
      return res.status(200).json({ ...header, items: itemRows });
    }

    // ============================================================
    // Batch Input Barang
    // ============================================================
    if (method === "GET" && (url === "/api/batch-input" || url?.startsWith("/api/batch-input?"))) {
      const { page, limit } = getPageLimit(req);
      const offset = (page - 1) * limit;
      const search = (req.query?.search as string | undefined) || "";
      const whereClause = search ? `WHERE id ILIKE $3 OR supplier ILIKE $3` : "";
      const params: (string | number)[] = search ? [limit, offset, `%${search}%`] : [limit, offset];
      const result = await query(
        `SELECT * FROM batch_inputs ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        params,
      );
      const countResult = await query(
        `SELECT COUNT(*) as count FROM batch_inputs ${whereClause}`,
        search ? [`%${search}%`] : [],
      );
      const total = Number(countResult[0]?.count) || 0;
      const batchIds = result.map((r: Record<string, unknown>) => r.id as string);
      let itemsByBatch: Record<string, unknown[]> = {};
      if (batchIds.length > 0) {
        const placeholders = batchIds.map((_, i) => `$${i + 1}`).join(",");
        const itemsResult = await query(
          `SELECT * FROM batch_input_items WHERE batch_input_id IN (${placeholders}) ORDER BY id`,
          batchIds,
        );
        for (const it of itemsResult) {
          const bid = it.batch_input_id as string;
          if (!itemsByBatch[bid]) itemsByBatch[bid] = [];
          itemsByBatch[bid].push(it);
        }
      }
      return res.status(200).json({
        batchInputs: result.map((r: Record<string, unknown>) => ({
          id: r.id,
          supplier: r.supplier,
          date: String(r.date),
          notes: r.notes || undefined,
          staffName: r.staff_name,
          items: (itemsByBatch[r.id as string] || []).map((it: any) => {
            let sns: string[] = [];
            try {
              sns = JSON.parse((it.sns as string) || "[]");
            } catch {
              sns = [];
            }
            return {
              id: it.id,
              batchInputId: it.batch_input_id,
              productId: it.product_id,
              brand: it.brand || undefined,
              model: it.model,
              category: (it.category as string) || "Body",
              condition: (it.condition as string) || "New",
              mount: it.mount || undefined,
              warrantyType: (it.warranty_type as string) || "Official Sony Indonesia",
              warrantyMonths: (it.warranty_months as number) || 12,
              cogs: typeof it.cogs === "string" ? parseFloat(it.cogs) : it.cogs,
              price: typeof it.price === "string" ? parseFloat(it.price) : it.price,
              hasSerialNumber: Boolean(it.has_serial_number),
              taxEnabled: it.tax_enabled === undefined ? true : Boolean(it.tax_enabled),
              quantity: it.quantity,
              sns,
            };
          }),
          createdAt: String(r.created_at),
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    if (method === "POST" && url === "/api/batch-input") {
      const input = body as Record<string, unknown>;
      const items = Array.isArray(input.items) ? input.items : [];
      if (items.length === 0) {
        return res.status(400).json({ error: "Batch Input must have at least 1 item" });
      }
      const id = String(input.id ?? "").trim();
      if (!id) return res.status(400).json({ error: "Nomor Invoice Masuk (id) is required" });
      const supplier = String(input.supplier ?? "").trim();
      if (!supplier) return res.status(400).json({ error: "Supplier is required" });
      const staffName = String(input.staffName ?? "").trim();
      if (!staffName) return res.status(400).json({ error: "Missing staffName" });

      try {
        const result = await getClient().begin(async (tx) => {
          // 1. Header uniqueness check (supplier invoice = batch id)
          const [existing] = await tx.unsafe("SELECT id FROM batch_inputs WHERE id = $1", [id]);
          if (existing) throw new Error(`Batch dengan nomor invoice '${id}' sudah ada`);

          // 2. Duplicate-SKU check against the existing catalog
          for (let i = 0; i < items.length; i++) {
            const it = items[i] as Record<string, unknown>;
            const brand = it.brand ? String(it.brand).trim() : "";
            const model = String(it.model ?? "").trim();
            if (!model) throw new Error(`Item #${i + 1}: model is required`);
            const [clash] = await tx.unsafe(
              `SELECT brand, model, stock FROM products
               WHERE LOWER(TRIM(COALESCE(brand, ''))) = LOWER(TRIM($1))
                 AND LOWER(TRIM(model)) = LOWER(TRIM($2))
                 AND deleted = false
               LIMIT 1`,
              [brand, model],
            );
            if (clash) {
              const c = clash as { brand?: string; model: string; stock: number };
              throw new Error(
                `Item #${i + 1}: "${c.brand ?? ""} ${c.model}" sudah ada di katalog (stok: ${c.stok}). ` +
                  `Gunakan Inventory > Tambah Stok untuk menambah stok barang yang sudah ada.`,
              );
            }
          }

          // 3. Duplicate-SKU check WITHIN the batch
          const seenInBatch = new Set<string>();
          for (let i = 0; i < items.length; i++) {
            const it = items[i] as Record<string, unknown>;
            const brand = it.brand ? String(it.brand).trim() : "";
            const model = String(it.model ?? "").trim();
            const key = `${brand.toLowerCase()}|${model.toLowerCase()}`;
            if (seenInBatch.has(key)) {
              throw new Error(`Item #${i + 1}: duplikat SKU dalam batch`);
            }
            seenInBatch.add(key);
          }

          // 4. SN uniqueness checks: across the batch, and against existing serial_numbers
          const allBatchSNs: string[] = [];
          for (const raw of items as Array<Record<string, unknown>>) {
            if (raw.hasSerialNumber) {
              const sns = Array.isArray(raw.sns)
                ? (raw.sns as unknown[]).map((s) => String(s).trim()).filter(Boolean)
                : [];
              for (const sn of sns) {
                if (allBatchSNs.includes(sn)) {
                  throw new Error(`SN '${sn}' muncul lebih dari sekali dalam batch`);
                }
                allBatchSNs.push(sn);
              }
            }
          }
          if (allBatchSNs.length > 0) {
            const [clash] = await tx.unsafe(
              `SELECT sn FROM serial_numbers WHERE sn = ANY($1::text[])`,
              [allBatchSNs],
            );
            if (clash) {
              throw new Error(`SN '${(clash as { sn: string }).sn}' sudah ada di sistem`);
            }
          }

          // 5. Insert header FIRST so the FK from batch_input_items has a target
          await tx.unsafe(
            `INSERT INTO batch_inputs (id, supplier, date, notes, staff_name)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              id,
              supplier,
              input.date ? new Date(String(input.date)) : new Date(),
              input.notes ? String(input.notes) : null,
              staffName,
            ],
          );

          // 6. For each row: insert new product, snapshot row, SN rows, audit
          for (const raw of items as Array<Record<string, unknown>>) {
            const brand = raw.brand ? String(raw.brand).trim() : "";
            const model = String(raw.model).trim();
            const category = String(raw.category ?? "Body");
            const condition = String(raw.condition ?? "New");
            const mount = raw.mount ? String(raw.mount) : null;
            const warrantyType = String(raw.warrantyType ?? "Official Sony Indonesia");
            const warrantyMonths = typeof raw.warrantyMonths === "number" ? raw.warrantyMonths : 12;
            const cogs = typeof raw.cogs === "number" ? raw.cogs : 0;
            const price = typeof raw.price === "number" ? raw.price : 0;
            const hasSerialNumber = Boolean(raw.hasSerialNumber);
            const taxEnabled = raw.taxEnabled === undefined ? true : Boolean(raw.taxEnabled);
            const quantity = typeof raw.quantity === "number" ? raw.quantity : 0;
            const sns = Array.isArray(raw.sns)
              ? (raw.sns as unknown[]).map((s) => String(s).trim()).filter(Boolean)
              : [];

            if (quantity <= 0) throw new Error(`Item ${model}: quantity must be > 0`);
            if (hasSerialNumber && sns.length !== quantity) {
              throw new Error(`Item ${model}: butuh ${quantity} SN, dapat ${sns.length}`);
            }

            const newPid = `BRC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const stockForNewProduct = hasSerialNumber ? sns.length : quantity;
            const restockEntry = {
              sn: sns,
              inv: id,
              timestamp: new Date().toISOString(),
            };

            await tx.unsafe(
              `INSERT INTO products (
                id, brand, model, category, mount, condition,
                price, cogs, warranty_months, warranty_type,
                stock, has_serial_number, supplier, date_restocked,
                tax_enabled, deleted, hidden,
                invoice_number, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10,
                $11, $12, $13, $14,
                $15, false, 0,
                $16, NOW(), NOW()
              )`,
              [
                newPid,
                brand || "N/A",
                model,
                category,
                mount,
                condition,
                String(price),
                String(cogs),
                warrantyMonths,
                warrantyType,
                stockForNewProduct,
                hasSerialNumber,
                supplier,
                input.date ? new Date(String(input.date)) : new Date(),
                taxEnabled,
                JSON.stringify([restockEntry]),
              ],
            );

            await tx.unsafe(
              `INSERT INTO batch_input_items (
                batch_input_id, product_id, brand, model,
                category, condition, mount, warranty_type, warranty_months,
                cogs, price, has_serial_number, tax_enabled,
                quantity, sns
              ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8, $9,
                $10, $11, $12, $13,
                $14, $15
              )`,
              [
                id,
                newPid,
                brand || null,
                model,
                category,
                condition,
                mount,
                warrantyType,
                warrantyMonths,
                String(cogs),
                String(price),
                hasSerialNumber,
                taxEnabled,
                quantity,
                JSON.stringify(sns),
              ],
            );

            if (hasSerialNumber) {
              for (const sn of sns) {
                await tx.unsafe(
                  `INSERT INTO serial_numbers (sn, product_id, status) VALUES ($1, $2, 'In Stock')`,
                  [sn, newPid],
                );
              }
            }

            const snDetail = sns.length > 0 ? ` SN: ${sns.join(", ")}` : "";
            await tx.unsafe(
              `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
              [
                `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                staffName,
                "Stock Addition",
                `Created product ${brand} ${model} (${quantity} unit(s), harga: ${price}, cogs: ${cogs}) from supplier ${supplier}, invoice: ${id}.${snDetail}`,
                newPid,
              ],
            );
          }

          // 7. Summary audit log
          await tx.unsafe(
            `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              staffName,
              "Batch Input Created",
              `BI ${id} — ${items.length} produk baru dari ${supplier}`,
              id,
            ],
          );

          // 8. Return the new batch
          const [header] = await tx.unsafe("SELECT * FROM batch_inputs WHERE id = $1", [id]);
          const itemRows = await tx.unsafe(
            "SELECT * FROM batch_input_items WHERE batch_input_id = $1 ORDER BY id",
            [id],
          );
          return { ...(header as Record<string, unknown>), items: itemRows };
        });
        return res.status(201).json(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create Batch Input";
        return res.status(400).json({ error: message });
      }
    }

    if (method === "GET" && url?.startsWith("/api/batch-input/")) {
      const batchId = decodeURIComponent(url.replace("/api/batch-input/", ""));
      const [header] = await query("SELECT * FROM batch_inputs WHERE id = $1", [batchId]);
      if (!header) return res.status(404).json({ error: "Batch Input not found" });
      const itemRows = await query(
        "SELECT * FROM batch_input_items WHERE batch_input_id = $1 ORDER BY id",
        [batchId],
      );
      const items = (itemRows as Array<Record<string, unknown>>).map((it) => {
        let sns: string[] = [];
        try {
          sns = JSON.parse((it.sns as string) || "[]");
        } catch {
          sns = [];
        }
        return {
          id: it.id,
          batchInputId: it.batch_input_id,
          productId: it.product_id,
          brand: it.brand || undefined,
          model: it.model,
          category: (it.category as string) || "Body",
          condition: (it.condition as string) || "New",
          mount: it.mount || undefined,
          warrantyType: (it.warranty_type as string) || "Official Sony Indonesia",
          warrantyMonths: (it.warranty_months as number) || 12,
          cogs: typeof it.cogs === "string" ? parseFloat(it.cogs) : it.cogs,
          price: typeof it.price === "string" ? parseFloat(it.price) : it.price,
          hasSerialNumber: Boolean(it.has_serial_number),
          taxEnabled: it.tax_enabled === undefined ? true : Boolean(it.tax_enabled),
          quantity: it.quantity,
          sns,
        };
      });
      return res.status(200).json({ ...header, items });
    }

    // GET /api/audit-logs with pagination
    if (method === "GET" && (url === "/api/audit-logs" || url?.startsWith("/api/audit-logs?"))) {
      const { page, limit } = getPageLimit(req);
      const offset = (page - 1) * limit;
      const result = await query(
        `SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
      const countResult = await query("SELECT COUNT(*) as count FROM audit_logs");
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
