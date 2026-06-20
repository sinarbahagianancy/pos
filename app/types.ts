export type MountType = "E-mount" | "RF-mount" | "X-mount" | "L-mount" | "Z-mount" | "M-mount";
export type ConditionType = "New" | "Used";
export type PaymentMethod = "Cash" | "Debit" | "QRIS" | "Transfer" | "Utang";
export type WarrantyType =
  | "Official Sony Indonesia"
  | "Official Canon Indonesia"
  | "Official Fujifilm Indonesia"
  | "Distributor"
  | "Toko"
  | "No Warranty";
export type ClaimStatus =
  | "Received"
  | "Sent to HQ"
  | "Repairing"
  | "Ready for Pickup"
  | "Completed";
export type ProductCategory = "Body" | "Lens" | "Accessory";
export type AuditAction =
  | "Stock Addition"
  | "Sales Deduction"
  | "Manual Correction"
  | "General"
  | "Settings Update"
  | "Product Update"
  | "Product Deleted"
  | "Product Restored"
  | "Product Hidden"
  | "Customer Created"
  | "Customer Updated"
  | "Customer Deleted"
  | "Supplier Created"
  | "Supplier Updated"
  | "Supplier Deleted"
  | "Staff Created"
  | "Staff Updated"
  | "Staff Deleted"
  | "Warranty Created"
  | "Warranty Updated"
  | "Sale Created"
  | "Login"
  | "Logout"
  | "Quotation Created"
  | "Quotation Approved"
  | "Quotation Rejected"
  | "Quotation Canceled";

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  deleted?: boolean;
  createdAt?: string;
}

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
  restockHistory?: ProcurementEntry[]; // DEPRECATED: use procurementHistory. Kept for back-compat during migration; readers should prefer procurementHistory.
  procurementHistory?: ProcurementEntry[];
  createdAt?: string;
}

export interface ProcurementEntry {
  sns: string[];
  inv: string;
  supplier?: string; // per-event supplier (may differ from products.supplier, which is the introducing supplier)
  timestamp: string;
  qty?: number; // for non-SN restocks; SN restocks use sns.length
}

// Legacy alias — kept for code that hasn't migrated yet.
export type RestockEntry = ProcurementEntry;

export interface SerialNumber {
  sn: string;
  productId: string;
  status: "In Stock" | "Sold" | "Claimed" | "Damaged";
  createdAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  npwp?: string;
  loyaltyPoints: number;
  deleted?: boolean;
}

export interface SaleItem {
  productId: string;
  brand?: string;
  model: string;
  sn: string;
  price: number;
  cogs: number;
  warrantyExpiry: string;
  quantity: number;
}

export interface Sale {
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
  quotationId?: string;
  dueDate?: string;
  isPaid?: boolean;
  paidAt?: string;
  amountPaid?: number;
  installments?: { amount: number; timestamp: string }[];
  timestamp: string;
}

export type QuotationStatus = "Pending" | "Approved" | "Rejected" | "Canceled";

export interface QuotationItem {
  id: string;
  quotationId: string;
  productId: string;
  brand?: string;
  model: string;
  sn: string;
  price: number;
  quantity: number;
}

export interface Quotation {
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

export interface WarrantyClaim {
  id: string;
  sn: string;
  productModel: string;
  customerName: string;
  customerPhone?: string;
  issue: string;
  status: ClaimStatus;
  receivedDate: string;
  lastUpdated: string;
}

export interface AuditLog {
  id: string;
  staffName: string;
  action: AuditAction;
  details: string;
  timestamp: string;
  relatedId?: string;
}

export interface StoreConfig {
  id: number;
  storeName: string;
  address: string;
  ppnRate: number;
  currency: "IDR" | "USD";
  monthlyTarget: number;
  updatedAt?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  authUserId?: string;
}

// ============================================================
// Surat Jalan (Delivery Note)
// ============================================================
export interface SuratJalanItem {
  id: string;
  suratJalanId: string;
  productId: string;
  brand?: string;
  model: string;
  sn: string;
  quantity: number;
}

export interface SuratJalan {
  id: string;
  customerId?: string;
  customerName: string;
  poNumber?: string;
  notes?: string;
  staffName: string;
  items: SuratJalanItem[];
  createdAt: string;
}

// ============================================================
// Surat Penarikan Barang (Goods Withdrawal)
// ============================================================
export type PenarikanReason =
  | "Rusak"
  | "Expired"
  | "Dipakai Internal"
  | "Sample/Display"
  | "Employee Sale"
  | "Hilang"
  | "Recall"
  | "Lainnya";

export interface SuratPenarikanItem {
  id: string;
  suratPenarikanId: string;
  productId: string;
  brand?: string;
  model: string;
  sn: string;
  quantity: number;
}

export interface SuratPenarikan {
  id: string;
  recipient: string;
  reason: PenarikanReason;
  alasanLainnya?: string;
  notes?: string;
  staffName: string;
  items: SuratPenarikanItem[];
  createdAt: string;
}

// ============================================================
// Batch Input Barang (Bulk Restock)
// ============================================================
export interface BatchInputItem {
  id: string;
  batchInputId: string;
  productId: string; // generated server-side (BRC-{timestamp}) when the row creates a new product
  // Snapshot of the new product's attributes at creation time. Stored as plain
  // strings (not enum types) so a future enum rename doesn't break old logs.
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

export interface BatchInput {
  id: string; // supplier's invoice number (Nomor Invoice Masuk)
  supplier: string;
  date: string;
  notes?: string;
  staffName: string;
  items: BatchInputItem[];
  createdAt: string;
}
