import type { PenarikanReason } from "../types";

export const PenarikanReasons: PenarikanReason[] = [
  "Rusak",
  "Expired",
  "Dipakai Internal",
  "Sample/Display",
  "Employee Sale",
  "Hilang",
  "Recall",
  "Lainnya",
];

// ============================================================
// Surat Jalan
// ============================================================
export interface CreateSuratJalanItemInput {
  productId: string;
  brand?: string;
  model: string;
  sn?: string; // required for SN products; can be NOSN-* or empty for non-SN
  quantity?: number; // defaults to 1
}

export interface CreateSuratJalanInput {
  customerId?: string;
  customerName: string;
  poNumber: string;
  notes?: string;
  staffName: string;
  items: CreateSuratJalanItemInput[];
}

export const validateCreateSuratJalanInput = (input: unknown): CreateSuratJalanInput => {
  const data = input as Record<string, unknown>;
  if (!data || typeof data !== "object") {
    throw new Error("Invalid Surat Jalan input");
  }
  const customerName = String(data.customerName ?? "").trim();
  if (!customerName) throw new Error("Customer name is required");
  const staffName = String(data.staffName ?? "").trim();
  if (!staffName) throw new Error("Staff name is required");
  const poNumber = String(data.poNumber ?? "").trim();
  if (!poNumber) throw new Error("PO Number is required");
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) throw new Error("Surat Jalan must have at least 1 item");
  const customerId = data.customerId ? String(data.customerId) : undefined;
  const notes = data.notes ? String(data.notes) : undefined;
  const validatedItems = items.map((raw: unknown, idx: number) => {
    const it = raw as Record<string, unknown>;
    if (!it.productId || !String(it.productId)) {
      throw new Error(`Item #${idx + 1}: productId is required`);
    }
    if (!it.model || !String(it.model)) {
      throw new Error(`Item #${idx + 1}: model is required`);
    }
    return {
      productId: String(it.productId),
      brand: it.brand ? String(it.brand) : undefined,
      model: String(it.model),
      sn: it.sn ? String(it.sn) : "",
      quantity: typeof it.quantity === "number" && it.quantity > 0 ? it.quantity : 1,
    };
  });
  return { customerId, customerName, poNumber, notes, staffName, items: validatedItems };
};

// ============================================================
// Surat Penarikan
// ============================================================
export interface CreateSuratPenarikanItemInput {
  productId: string;
  brand?: string;
  model: string;
  sn?: string;
  quantity?: number;
}

export interface CreateSuratPenarikanInput {
  recipient: string;
  reason: PenarikanReason;
  alasanLainnya?: string;
  notes?: string;
  staffName: string;
  items: CreateSuratPenarikanItemInput[];
}

export const validateCreateSuratPenarikanInput = (input: unknown): CreateSuratPenarikanInput => {
  const data = input as Record<string, unknown>;
  if (!data || typeof data !== "object") {
    throw new Error("Invalid Surat Penarikan input");
  }
  const recipient = String(data.recipient ?? "").trim();
  if (!recipient) throw new Error("Recipient (Penarik) is required");
  const reason = String(data.reason ?? "") as PenarikanReason;
  if (!PenarikanReasons.includes(reason)) {
    throw new Error(`Invalid reason: ${reason}`);
  }
  const alasanLainnya = data.alasanLainnya ? String(data.alasanLainnya).trim() : undefined;
  if (reason === "Lainnya" && !alasanLainnya) {
    throw new Error("Free-form reason (alasan_lainnya) is required when reason = 'Lainnya'");
  }
  const staffName = String(data.staffName ?? "").trim();
  if (!staffName) throw new Error("Staff name is required");
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) throw new Error("Surat Penarikan must have at least 1 item");
  const notes = data.notes ? String(data.notes) : undefined;
  const validatedItems = items.map((raw: unknown, idx: number) => {
    const it = raw as Record<string, unknown>;
    if (!it.productId || !String(it.productId)) {
      throw new Error(`Item #${idx + 1}: productId is required`);
    }
    if (!it.model || !String(it.model)) {
      throw new Error(`Item #${idx + 1}: model is required`);
    }
    return {
      productId: String(it.productId),
      brand: it.brand ? String(it.brand) : undefined,
      model: String(it.model),
      sn: it.sn ? String(it.sn) : "",
      quantity: typeof it.quantity === "number" && it.quantity > 0 ? it.quantity : 1,
    };
  });
  return { recipient, reason, alasanLainnya, notes, staffName, items: validatedItems };
};

// ============================================================
// Batch Input
// ============================================================
// Each row is either:
//   - mode: "new"     — a brand-new product that doesn't exist in the catalog yet.
//                        The server generates a BRC-{timestamp} id and inserts the
//                        new product as part of the batch transaction.
//   - mode: "restock" — an existing product being restocked. The server UPDATEs
//                        the product's stock (and procurement_history) in place.
// Per-row attributes become the product's initial values (new) or the
// restock's contribution (restock). The two modes have different field
// sets and are validated independently.

interface NewBatchInputItemInput {
  mode: "new";
  brand?: string;
  model: string;
  category: string;
  condition: string;
  mount?: string;
  warrantyType: string;
  warrantyMonths: number;
  cogs: number;
  price: number;
  hasSerialNumber: boolean;
  taxEnabled: boolean;
  quantity: number;
  sns: string[];
}

interface RestockBatchInputItemInput {
  mode: "restock";
  existingProductId: string;
  quantity: number;
  sns: string[]; // required length matches quantity when product is SN; empty array otherwise
}

export type CreateBatchInputItemInput = NewBatchInputItemInput | RestockBatchInputItemInput;

export interface CreateBatchInputInput {
  id: string; // supplier's invoice number (Nomor Invoice Masuk)
  supplier: string;
  date?: string;
  notes?: string;
  staffName: string;
  items: CreateBatchInputItemInput[];
}

const KNOWN_CATEGORIES = ["Body", "Lens", "Accessory"] as const;
const KNOWN_CONDITIONS = ["New", "Used"] as const;

export const validateCreateBatchInputInput = (input: unknown): CreateBatchInputInput => {
  const data = input as Record<string, unknown>;
  if (!data || typeof data !== "object") {
    throw new Error("Invalid Batch Input input");
  }
  const id = String(data.id ?? "").trim();
  if (!id) throw new Error("Nomor Invoice Masuk (id) is required");
  const supplier = String(data.supplier ?? "").trim();
  if (!supplier) throw new Error("Supplier is required");
  const staffName = String(data.staffName ?? "").trim();
  if (!staffName) throw new Error("Staff name is required");
  const items = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) throw new Error("Batch Input must have at least 1 item");
  const date = data.date ? String(data.date) : undefined;
  const notes = data.notes ? String(data.notes) : undefined;
  const validatedItems = items.map((raw: unknown, idx: number): CreateBatchInputItemInput => {
    const it = raw as Record<string, unknown>;
    const mode = String(it.mode ?? "new");
    if (mode === "new") {
      return validateNewBatchInputItem(it, idx);
    }
    if (mode === "restock") {
      return validateRestockBatchInputItem(it, idx);
    }
    throw new Error(`Item #${idx + 1}: mode must be 'new' or 'restock'`);
  });
  return { id, supplier, date, notes, staffName, items: validatedItems };
};

const validateNewBatchInputItem = (
  it: Record<string, unknown>,
  idx: number,
): NewBatchInputItemInput => {
  const brand = it.brand ? String(it.brand).trim() : undefined;
  const model = it.model ? String(it.model).trim() : "";
  if (!model) throw new Error(`Item #${idx + 1}: model is required`);
  const category = String(it.category ?? "Body");
  if (!KNOWN_CATEGORIES.includes(category as (typeof KNOWN_CATEGORIES)[number])) {
    throw new Error(`Item #${idx + 1}: category must be one of ${KNOWN_CATEGORIES.join(", ")}`);
  }
  const condition = String(it.condition ?? "New");
  if (!KNOWN_CONDITIONS.includes(condition as (typeof KNOWN_CONDITIONS)[number])) {
    throw new Error(`Item #${idx + 1}: condition must be one of ${KNOWN_CONDITIONS.join(", ")}`);
  }
  const mount = it.mount ? String(it.mount).trim() : undefined;
  const warrantyType = String(it.warrantyType ?? "Distributor");
  const warrantyMonths = typeof it.warrantyMonths === "number" ? it.warrantyMonths : 12;
  if (warrantyMonths < 0) throw new Error(`Item #${idx + 1}: warrantyMonths must be >= 0`);
  const cogs = typeof it.cogs === "number" ? it.cogs : 0;
  if (cogs < 0) throw new Error(`Item #${idx + 1}: cogs must be >= 0`);
  const price = typeof it.price === "number" ? it.price : 0;
  if (price < 0) throw new Error(`Item #${idx + 1}: price must be >= 0`);
  const hasSerialNumber = Boolean(it.hasSerialNumber);
  const taxEnabled = it.taxEnabled === undefined ? true : Boolean(it.taxEnabled);
  const quantity = typeof it.quantity === "number" ? it.quantity : 0;
  if (quantity <= 0) throw new Error(`Item #${idx + 1}: quantity must be > 0`);
  const sns = Array.isArray(it.sns) ? it.sns.map((s) => String(s).trim()).filter(Boolean) : [];
  if (hasSerialNumber && sns.length !== quantity) {
    throw new Error(
      `Item #${idx + 1}: has ${sns.length} SN(s) but quantity is ${quantity} (SN rows must have exactly one SN per unit)`,
    );
  }
  const uniqueSNs = new Set(sns);
  if (uniqueSNs.size !== sns.length) {
    throw new Error(`Item #${idx + 1}: duplicate SNs in textarea`);
  }
  return {
    mode: "new",
    brand,
    model,
    category,
    condition,
    mount,
    warrantyType,
    warrantyMonths,
    cogs,
    price,
    hasSerialNumber,
    taxEnabled,
    quantity,
    sns,
  };
};

const validateRestockBatchInputItem = (
  it: Record<string, unknown>,
  idx: number,
): RestockBatchInputItemInput => {
  const existingProductId = String(it.existingProductId ?? "").trim();
  if (!existingProductId) {
    throw new Error(`Item #${idx + 1}: existingProductId is required for restock rows`);
  }
  const quantity = typeof it.quantity === "number" ? it.quantity : 0;
  if (quantity <= 0) {
    throw new Error(`Item #${idx + 1}: quantity must be > 0 for restock rows`);
  }
  const sns = Array.isArray(it.sns) ? it.sns.map((s) => String(s).trim()).filter(Boolean) : [];
  // Note: we do NOT validate SNs here, because SN requirements depend on the
  // picked product's has_serial_number flag, which the server-side handler
  // resolves in a separate step (it fetches the product from the catalog).
  // The form is responsible for hiding the SN control for non-SN products.
  // We do a basic dedup check now to fail fast on obviously-bad input.
  const uniqueSNs = new Set(sns);
  if (uniqueSNs.size !== sns.length) {
    throw new Error(`Item #${idx + 1}: duplicate SNs in restock row`);
  }
  return {
    mode: "restock",
    existingProductId,
    quantity,
    sns,
  };
};
