export type MountType = "E-mount" | "RF-mount" | "X-mount" | "L-mount" | "Z-mount" | "M-mount";
export type ConditionType = "New" | "Used";
export type ProductCategory = "Body" | "Lens" | "Accessory";
export type WarrantyType =
  | "Official Sony Indonesia"
  | "Official Canon Indonesia"
  | "Official Fujifilm Indonesia"
  | "Distributor"
  | "Toko"
  | "No Warranty";
export type SNStatus = "In Stock" | "Sold" | "Claimed";

const MountTypes: MountType[] = ["E-mount", "RF-mount", "X-mount", "L-mount", "Z-mount", "M-mount"];
const ConditionTypes: ConditionType[] = ["New", "Used"];
const ProductCategories: ProductCategory[] = ["Body", "Lens", "Accessory"];
const WarrantyTypes: WarrantyType[] = [
  "Official Sony Indonesia",
  "Official Canon Indonesia",
  "Official Fujifilm Indonesia",
  "Distributor",
  "Toko",
  "No Warranty",
];

export interface Product {
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

export interface CreateProductInput {
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

export interface UpdateProductInput {
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
  hasSerialNumber?: boolean;
  supplier?: string;
  dateRestocked?: string;
  taxEnabled?: boolean;
}

export interface StockAdjustmentInput {
  productId: string;
  newStock: number;
  reason: string;
}

export interface StockAddInput {
  productId: string;
  supplier: string;
  dateRestocked: string;
  reason: string;
  staffName: string;
  hasSerialNumber: boolean;
  serialNumbers?: string[];
  quantity?: number;
}

export interface StockReduceInput {
  productId: string;
  supplier?: string;
  dateRestocked?: string;
  reason: string;
  staffName: string;
  hasSerialNumber: boolean;
  serialNumbers?: string[];
  quantity?: number;
}

export interface SerialNumber {
  sn: string;
  productId: string;
  status: SNStatus;
}

export interface CreateSerialNumberInput {
  sn: string;
  productId: string;
}

function isMountType(value: unknown): value is MountType {
  return typeof value === "string" && MountTypes.includes(value as MountType);
}

function isConditionType(value: unknown): value is ConditionType {
  return typeof value === "string" && ConditionTypes.includes(value as ConditionType);
}

function isProductCategory(value: unknown): value is ProductCategory {
  return typeof value === "string" && ProductCategories.includes(value as ProductCategory);
}

function isWarrantyType(value: unknown): value is WarrantyType {
  return typeof value === "string" && WarrantyTypes.includes(value as WarrantyType);
}

export function validateCreateProductInput(input: unknown): CreateProductInput {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid input: must be an object");
  }

  const obj = input as Record<string, unknown>;

  if (typeof obj.id !== "string" || obj.id.length === 0) {
    throw new Error("Invalid input: id is required and must be a non-empty string");
  }
  if (typeof obj.brand !== "string" || obj.brand.length === 0) {
    throw new Error("Invalid input: brand is required and must be a non-empty string");
  }
  if (typeof obj.model !== "string" || obj.model.length === 0) {
    throw new Error("Invalid input: model is required and must be a non-empty string");
  }
  if (!isProductCategory(obj.category)) {
    throw new Error(`Invalid input: category must be one of ${ProductCategories.join(", ")}`);
  }
  if (obj.mount !== undefined && !isMountType(obj.mount)) {
    throw new Error(`Invalid input: mount must be one of ${MountTypes.join(", ")}`);
  }
  if (!isConditionType(obj.condition)) {
    throw new Error(`Invalid input: condition must be one of ${ConditionTypes.join(", ")}`);
  }
  if (typeof obj.price !== "number" || obj.price < 0) {
    throw new Error("Invalid input: price must be a positive number");
  }
  if (typeof obj.cogs !== "number" || obj.cogs < 0) {
    throw new Error("Invalid input: cogs must be a non-negative number");
  }
  if (typeof obj.warrantyMonths !== "number" || obj.warrantyMonths < 0) {
    throw new Error("Invalid input: warrantyMonths must be a non-negative number");
  }
  if (!isWarrantyType(obj.warrantyType)) {
    throw new Error(`Invalid input: warrantyType must be one of ${WarrantyTypes.join(", ")}`);
  }

  const hasSerialNumber = obj.hasSerialNumber === true;

  if (
    hasSerialNumber &&
    (!obj.serialNumbers || !Array.isArray(obj.serialNumbers) || obj.serialNumbers.length === 0)
  ) {
    throw new Error("Invalid input: serialNumbers is required for products with serial numbers");
  }

  if (
    !hasSerialNumber &&
    (!obj.quantity || typeof obj.quantity !== "number" || obj.quantity <= 0)
  ) {
    throw new Error("Invalid input: quantity is required for products without serial numbers");
  }

  if (!obj.supplier) {
    throw new Error("Invalid input: supplier is required");
  }

  return {
    id: obj.id as string,
    brand: obj.brand as string,
    model: obj.model as string,
    category: obj.category as ProductCategory,
    mount: obj.mount as MountType | undefined,
    condition: obj.condition as ConditionType,
    price: obj.price as number,
    cogs: obj.cogs as number,
    warrantyMonths: obj.warrantyMonths as number,
    warrantyType: obj.warrantyType as WarrantyType,
    hasSerialNumber,
    supplier: obj.supplier as string,
    dateRestocked: obj.dateRestocked as string,
    serialNumbers: obj.serialNumbers as string[] | undefined,
    quantity: obj.quantity as number | undefined,
    taxEnabled: obj.taxEnabled as boolean | undefined,
    invoiceNumber: obj.invoiceNumber as string | undefined, // kept for create-time single input
  };
}

export function validateUpdateProductInput(input: unknown): UpdateProductInput {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid input: must be an object");
  }

  const obj = input as Record<string, unknown>;
  const result: UpdateProductInput = {};

  if (obj.brand !== undefined) {
    if (typeof obj.brand !== "string" || obj.brand.length === 0) {
      throw new Error("Invalid input: brand must be a non-empty string");
    }
    result.brand = obj.brand as string;
  }
  if (obj.model !== undefined) {
    if (typeof obj.model !== "string" || obj.model.length === 0) {
      throw new Error("Invalid input: model must be a non-empty string");
    }
    result.model = obj.model as string;
  }
  if (obj.category !== undefined && !isProductCategory(obj.category)) {
    throw new Error(`Invalid input: category must be one of ${ProductCategories.join(", ")}`);
  }
  if (obj.category !== undefined) {
    result.category = obj.category as ProductCategory;
  }
  if (obj.mount !== undefined) {
    if (obj.mount !== null && !isMountType(obj.mount)) {
      throw new Error(`Invalid input: mount must be one of ${MountTypes.join(", ")}`);
    }
    result.mount = obj.mount as MountType | undefined;
  }
  if (obj.condition !== undefined && !isConditionType(obj.condition)) {
    throw new Error(`Invalid input: condition must be one of ${ConditionTypes.join(", ")}`);
  }
  if (obj.condition !== undefined) {
    result.condition = obj.condition as ConditionType;
  }
  if (obj.price !== undefined) {
    if (typeof obj.price !== "number" || obj.price < 0) {
      throw new Error("Invalid input: price must be a positive number");
    }
    result.price = obj.price as number;
  }
  if (obj.cogs !== undefined) {
    if (typeof obj.cogs !== "number" || obj.cogs < 0) {
      throw new Error("Invalid input: cogs must be a non-negative number");
    }
    result.cogs = obj.cogs as number;
  }
  if (obj.warrantyMonths !== undefined) {
    if (typeof obj.warrantyMonths !== "number" || obj.warrantyMonths < 0) {
      throw new Error("Invalid input: warrantyMonths must be a non-negative number");
    }
    result.warrantyMonths = obj.warrantyMonths as number;
  }
  if (obj.warrantyType !== undefined && !isWarrantyType(obj.warrantyType)) {
    throw new Error(`Invalid input: warrantyType must be one of ${WarrantyTypes.join(", ")}`);
  }
  if (obj.warrantyType !== undefined) {
    result.warrantyType = obj.warrantyType;
  }
  if (obj.stock !== undefined) {
    if (typeof obj.stock !== "number" || obj.stock < 0) {
      throw new Error("Invalid input: stock must be a non-negative number");
    }
    result.stock = obj.stock;
  }
  if (obj.taxEnabled !== undefined) {
    if (typeof obj.taxEnabled !== "boolean") {
      throw new Error("Invalid input: taxEnabled must be a boolean");
    }
    result.taxEnabled = obj.taxEnabled;
  }

  return result;
}

export function validateStockAdjustmentInput(input: unknown): StockAdjustmentInput {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid input: must be an object");
  }

  const obj = input as Record<string, unknown>;

  if (typeof obj.productId !== "string" || obj.productId.length === 0) {
    throw new Error("Invalid input: productId is required and must be a non-empty string");
  }
  if (typeof obj.newStock !== "number" || obj.newStock < 0 || !Number.isInteger(obj.newStock)) {
    throw new Error("Invalid input: newStock must be a non-negative integer");
  }
  if (typeof obj.reason !== "string" || obj.reason.length === 0) {
    throw new Error("Invalid input: reason is required and must be a non-empty string");
  }

  return {
    productId: obj.productId,
    newStock: obj.newStock,
    reason: obj.reason,
  };
}

export function validateCreateSerialNumberInput(input: unknown): CreateSerialNumberInput {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid input: must be an object");
  }

  const obj = input as Record<string, unknown>;

  if (typeof obj.sn !== "string" || obj.sn.length === 0) {
    throw new Error("Invalid input: sn is required and must be a non-empty string");
  }
  if (typeof obj.productId !== "string" || obj.productId.length === 0) {
    throw new Error("Invalid input: productId is required and must be a non-empty string");
  }

  return {
    sn: obj.sn,
    productId: obj.productId,
  };
}

/** Parse the restock_history / invoice_number column from DB.
 *  Supports:
 *  - New format: JSON array of {sn:string[], inv:string, timestamp:string}
 *  - Legacy JSON array of strings: [{"sn":[],"inv":"INV/001","timestamp":"2024-01-01"}] (auto-migrated)
 *  - Legacy plain string: "INV/001" (wrapped into a single entry)
 */
export function parseRestockHistory(value: unknown): { sn: string[]; inv: string; timestamp: string }[] {
  if (!value) return [];
  if (typeof value !== "string") return [];
  const trimmed = value.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      // Check if it's the new format (array of objects with sn/inv/timestamp)
      if (parsed.length > 0 && typeof parsed[0] === "object" && parsed[0] !== null && "inv" in parsed[0]) {
        return parsed.filter(
          (e: unknown) =>
            typeof e === "object" && e !== null && "inv" in (e as Record<string, unknown>)
        ).map((e: Record<string, unknown>) => ({
          sn: Array.isArray(e.sn) ? e.sn.filter((s: unknown) => typeof s === "string") : [],
          inv: typeof e.inv === "string" ? e.inv : "",
          timestamp: typeof e.timestamp === "string" ? e.timestamp : new Date().toISOString(),
        }));
      }
      // Legacy format: array of plain strings — wrap each into an entry
      return parsed
        .filter((v: unknown) => typeof v === "string" && v.length > 0)
        .map((v: string) => ({ sn: [] as string[], inv: v, timestamp: new Date().toISOString() }));
    }
  } catch {
    // Legacy plain string — wrap into single entry
    return [{ sn: [], inv: trimmed, timestamp: new Date().toISOString() }];
  }
  return [];
}


export function parseDbProduct(row: Record<string, unknown>): Product {
  const hasSN = row.has_serial_number;
  const taxEnabledValue = (
    row.tax_enabled !== undefined ? row.tax_enabled : row.taxEnabled
  ) as unknown;
  console.log(
    "[parseDbProduct] row.tax_enabled:",
    row.tax_enabled,
    "row.taxEnabled:",
    row.taxEnabled,
  );
  const taxEnabled =
    taxEnabledValue === true || taxEnabledValue === "true" || taxEnabledValue === 1 ? true : false;
  console.log("[parseDbProduct] returning taxEnabled:", taxEnabled);
  return {
    id: row.id as string,
    brand: row.brand as string,
    model: row.model as string,
    category: row.category as ProductCategory,
    mount: row.mount as MountType | undefined,
    condition: row.condition as ConditionType,
    price: typeof row.price === "string" ? parseFloat(row.price) : (row.price as number),
    cogs: typeof row.cogs === "string" ? parseFloat(row.cogs) : (row.cogs as number),
    warrantyMonths: row.warranty_months as number,
    warrantyType: row.warranty_type as WarrantyType,
    stock: row.stock as number,
    hasSerialNumber: hasSN === true || hasSN === 1 || hasSN === "true",
    supplier: row.supplier as string | undefined,
    dateRestocked: row.date_restocked as string | undefined,
    hidden: row.hidden as number | undefined,
    taxEnabled,
    restockHistory: parseRestockHistory(row.invoice_number),
  };
}

export function parseDbSerialNumber(row: Record<string, unknown>): SerialNumber {
  return {
    sn: row.sn as string,
    productId: row.productId as string,
    status: row.status as SNStatus,
  };
}
