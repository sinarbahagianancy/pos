import {
  pgTable,
  text,
  timestamp,
  numeric,
  integer,
  uuid,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

export const mountTypeEnum = pgEnum("mount_type", [
  "E-mount",
  "RF-mount",
  "X-mount",
  "L-mount",
  "Z-mount",
  "M-mount",
]);

export const conditionTypeEnum = pgEnum("condition_type", ["New", "Used"]);

export const paymentMethodEnum = pgEnum("payment_method", ["Cash", "Debit", "QRIS", "Credit"]);

export const warrantyTypeEnum = pgEnum("warranty_type", [
  "Official Sony Indonesia",
  "Official Canon Indonesia",
  "Official Fujifilm Indonesia",
  "Distributor",
  "Store Warranty",
]);

export const claimStatusEnum = pgEnum("claim_status", [
  "Received",
  "Sent to HQ",
  "Repairing",
  "Ready for Pickup",
  "Completed",
]);

export const productCategoryEnum = pgEnum("product_category", ["Body", "Lens", "Accessory"]);

export const auditActionEnum = pgEnum("audit_action", [
  "Stock Addition",
  "Sales Deduction",
  "Manual Correction",
  "General",
  "Settings Update",
  "Product Update",
  "Login",
  "Logout",
]);

export const currencyTypeEnum = pgEnum("currency_type", ["IDR", "USD"]);

export const snStatusEnum = pgEnum("sn_status", ["In Stock", "Sold", "Claimed", "Damaged"]);

export const storeConfig = pgTable("store_config", {
  id: integer("id").primaryKey().default(1),
  storeName: text("store_name").notNull(),
  address: text("address").notNull(),
  ppnRate: numeric("ppn_rate", { precision: 5, scale: 2 }).notNull().default("11.00"),
  currency: currencyTypeEnum("currency").notNull().default("IDR"),
  monthlyTarget: numeric("monthly_target", { precision: 15, scale: 0 })
    .notNull()
    .default("500000000"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const staffMembers = pgTable("staff_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  role: text("role").default("Staff"),
  authUserId: uuid("auth_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  category: productCategoryEnum("category").notNull(),
  mount: mountTypeEnum("mount"),
  condition: conditionTypeEnum("condition").notNull(),
  price: numeric("price", { precision: 15, scale: 2 }).notNull(),
  cogs: numeric("cogs", { precision: 15, scale: 2 }).notNull(),
  warrantyMonths: integer("warranty_months").notNull().default(12),
  warrantyType: warrantyTypeEnum("warranty_type").notNull(),
  stock: integer("stock").notNull().default(0),
  hasSerialNumber: boolean("has_serial_number").notNull().default(true),
  supplier: text("supplier"),
  dateRestocked: timestamp("date_restocked"),
  hidden: integer("hidden").notNull().default(0),
  taxEnabled: boolean("tax_enabled").notNull().default(true),
  deleted: boolean("deleted").notNull().default(false),
  invoiceNumber: text("invoice_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  phone: text("phone"),
  address: text("address"),
  deleted: boolean("deleted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const serialNumbers = pgTable("serial_numbers", {
  sn: text("sn").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  status: snStatusEnum("status").notNull().default("In Stock"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  npwp: text("npwp"),
  loyaltyPoints: integer("loyalty_points").default(0),
  deleted: boolean("deleted").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const sales = pgTable("sales", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  customerName: text("customer_name").notNull(),
  subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 15, scale: 2 }).notNull(),
  taxEnabled: boolean("tax_enabled").notNull().default(true),
  total: numeric("total", { precision: 15, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  staffName: text("staff_name").notNull(),
  notes: text("notes"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  isPaid: boolean("is_paid").notNull().default(false),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  amountPaid: numeric("amount_paid", { precision: 15, scale: 2 }).default("0"),
  installments: text("installments").default("[]"),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
});

export const saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: text("sale_id")
    .notNull()
    .references(() => sales.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  model: text("model").notNull(),
  sn: text("sn").notNull(),
  price: numeric("price", { precision: 15, scale: 2 }).notNull(),
  cogs: numeric("cogs", { precision: 15, scale: 2 }).notNull(),
  warrantyExpiry: timestamp("warranty_expiry").notNull(),
});

export const warrantyClaims = pgTable("warranty_claims", {
  id: text("id").primaryKey(),
  sn: text("sn").notNull(),
  productModel: text("product_model").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  issue: text("issue").notNull(),
  status: claimStatusEnum("status").notNull().default("Received"),
  receivedDate: timestamp("received_date", { withTimezone: true }).defaultNow(),
  lastUpdated: timestamp("last_updated", { withTimezone: true }).defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey(),
  staffName: text("staff_name").notNull(),
  action: auditActionEnum("action").notNull(),
  details: text("details").notNull(),
  relatedId: text("related_id"),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow(),
});
