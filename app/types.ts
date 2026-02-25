export type MountType = 'E-mount' | 'RF-mount' | 'X-mount' | 'L-mount' | 'Z-mount' | 'M-mount';
export type ConditionType = 'New' | 'Used';
export type PaymentMethod = 'Cash' | 'Debit' | 'QRIS' | 'Credit';
export type WarrantyType = 'Official Sony Indonesia' | 'Official Canon Indonesia' | 'Official Fujifilm Indonesia' | 'Distributor' | 'Store Warranty';
export type ClaimStatus = 'Received' | 'Sent to HQ' | 'Repairing' | 'Ready for Pickup' | 'Completed';
export type ProductCategory = 'Body' | 'Lens' | 'Accessory';
export type AuditAction = 'Stock Addition' | 'Sales Deduction' | 'Manual Correction' | 'General' | 'Settings Update';

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
}

export interface SerialNumber {
  sn: string;
  productId: string;
  status: 'In Stock' | 'Sold' | 'Claimed';
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  npwp?: string;
  loyaltyPoints: number;
}

export interface SaleItem {
  productId: string;
  model: string;
  sn: string;
  price: number;
  cogs: number;
  warrantyExpiry: string;
}

export interface Sale {
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
  currency: 'IDR' | 'USD';
  updatedAt?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  authUserId?: string;
}
