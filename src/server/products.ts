import { client, db } from "../db";
import { products, serialNumbers, auditLogs } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";
import {
  validateCreateProductInput,
  validateUpdateProductInput,
  validateStockAdjustmentInput,
  validateCreateSerialNumberInput,
  parseDbProduct,
  parseDbSerialNumber,
  parseInvoiceNumbers,
  Product,
} from "../../app/schemas/product.schema";

const fmtIDR = (n: number | string) => `Rp ${new Intl.NumberFormat("id-ID").format(Number(n))}`;

// Ensure has_serial_number column exists and fix all products based on actual serial numbers
try {
  await client.unsafe(
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS has_serial_number boolean DEFAULT true`,
  );

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

  // Add Toko and No Warranty to warranty_type enum
  await client.unsafe(`ALTER TYPE warranty_type ADD VALUE IF NOT EXISTS 'Toko'`).catch(() => {});
  await client.unsafe(`ALTER TYPE warranty_type ADD VALUE IF NOT EXISTS 'No Warranty'`).catch(() => {});

  // Migrate existing 'Store Warranty' data to 'Toko'
  await client.unsafe(`UPDATE products SET warranty_type = 'Toko' WHERE warranty_type = 'Store Warranty'`).catch((e) => { console.error('Failed to migrate Store Warranty → Toko:', e); });

  // Migrate invoice_number from plain string to JSON array
  // Only migrate rows that are non-null, non-empty, and don't already start with '['
  await client.unsafe(`
    UPDATE products
    SET invoice_number = json_build_array(invoice_number)::text
    WHERE invoice_number IS NOT NULL
      AND invoice_number != ''
      AND invoice_number NOT LIKE '[%'
  `).catch((e) => { console.error('Failed to migrate invoice_number to array:', e); });
} catch (e) {
  console.log("Migration check (may be ok):", e);
}

export interface PaginatedProductsResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllProducts = async (
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedProductsResult> => {
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await client.unsafe(
    "SELECT COUNT(*) as count FROM products WHERE deleted = false",
  );
  const total = parseInt(countResult[0]?.count || "0", 10);

  // Use direct SQL to avoid any Drizzle ORM issues
  const rawResult = await client.unsafe(
    `
    SELECT
      p.id, p.brand, p.model, p.category, p.mount, p.condition,
      p.price, p.cogs, p.warranty_months, p.warranty_type, p.stock,
      p.has_serial_number, p.supplier, p.date_restocked, p.hidden, p.deleted,
      p.tax_enabled, p.invoice_number, p.created_at,
      (SELECT COUNT(*) FROM serial_numbers sn WHERE sn.product_id = p.id) as sn_count
    FROM products p
    WHERE p.deleted = false
    ORDER BY p.created_at DESC
    LIMIT $1 OFFSET $2
  `,
    [limit, offset],
  );

  return {
    products: rawResult.map((row: any) => parseDbProduct(row)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getProductById = async (id: string) => {
  const result = await db.select().from(products).where(eq(products.id, id));
  return result[0] ? parseDbProduct(result[0]) : null;
};

export const createProduct = async (input: unknown) => {
  const validated = validateCreateProductInput(input);
  const staffName = ((input as Record<string, unknown>)?.staffName as string) || "System";

  const hasSerialNumber = validated.hasSerialNumber === true;
  const stockCount = hasSerialNumber
    ? validated.serialNumbers?.length || 0
    : validated.quantity || 0;

  const result = await db
    .insert(products)
    .values({
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
      taxEnabled: validated.taxEnabled === true,
      invoiceNumber: validated.invoiceNumber ? JSON.stringify([validated.invoiceNumber]) : null,
    })
    .returning();

  const newProduct = result[0];

  if (hasSerialNumber && validated.serialNumbers && validated.serialNumbers.length > 0) {
    for (const sn of validated.serialNumbers) {
      // Check if SN already exists
      const existing = await db.select().from(serialNumbers).where(eq(serialNumbers.sn, sn));
      if (existing.length > 0) {
        console.error("SN already exists:", sn, "belongs to product:", existing[0].productId);
        throw new Error(`Serial number ${sn} already exists in the system`);
      }
      try {
        await db.insert(serialNumbers).values({
          sn: sn,
          productId: newProduct.id,
          status: "In Stock",
        });
      } catch (err: any) {
        console.error("Error inserting SN:", sn, err);
        throw new Error(`Failed to insert serial number ${sn}: ${err.message}`);
      }
    }

    await db.insert(auditLogs).values({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName,
      action: "Stock Addition",
      details: `Created product ${validated.brand} ${validated.model} with ${validated.serialNumbers.length} serial numbers, price: ${fmtIDR(validated.price)}, cogs: ${fmtIDR(validated.cogs)}, from supplier ${validated.supplier}`,
      relatedId: newProduct.id,
    });
  } else if (!hasSerialNumber && validated.quantity && validated.quantity > 0) {
    await db.insert(auditLogs).values({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName,
      action: "Stock Addition",
      details: `Created product ${validated.brand} ${validated.model} with ${validated.quantity} units, price: ${fmtIDR(validated.price)}, cogs: ${fmtIDR(validated.cogs)}, from supplier ${validated.supplier}`,
      relatedId: newProduct.id,
    });
  }

  return parseDbProduct(newProduct);
};

export const updateProduct = async (id: string, input: unknown, staffName: string = "System") => {
  console.log(
    "[SERVER products.ts] updateProduct called, id:",
    id,
    "input:",
    JSON.stringify(input),
  );
  const validated = validateUpdateProductInput(input);
  console.log("[SERVER products.ts] validated:", JSON.stringify(validated));

  // Get old product for audit logging
  const [oldProduct] = await db.select().from(products).where(eq(products.id, id));
  console.log("[SERVER products.ts] oldProduct taxEnabled:", oldProduct?.taxEnabled);
  if (!oldProduct) {
    throw new Error("Product not found");
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
    validated.warrantyMonths !== oldProduct.warrantyMonths
  ) {
    updateData.warrantyMonths = validated.warrantyMonths;
    changes.push(`warrantyMonths: ${oldProduct.warrantyMonths} -> ${validated.warrantyMonths}`);
  }
  if (validated.warrantyType !== undefined && validated.warrantyType !== oldProduct.warrantyType) {
    updateData.warrantyType = validated.warrantyType;
    changes.push(`warrantyType: ${oldProduct.warrantyType} -> ${validated.warrantyType}`);
  }
  if (validated.taxEnabled !== undefined && validated.taxEnabled !== oldProduct.taxEnabled) {
    updateData.taxEnabled = validated.taxEnabled;
    changes.push(`taxEnabled: ${oldProduct.taxEnabled} -> ${validated.taxEnabled}`);
  }

  if (changes.length > 0) {
    await db.insert(auditLogs).values({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName,
      action: "Product Update",
      details: `Updated ${oldProduct.brand} ${oldProduct.model}: ${changes.join(", ")}`,
      relatedId: id,
    });
  }

  await db.update(products).set(updateData).where(eq(products.id, id));

  const [updatedProduct] = await db.select().from(products).where(eq(products.id, id));
  console.log("[SERVER products.ts] Fresh fetch after update:", JSON.stringify(updatedProduct));

  const parsed = updatedProduct ? parseDbProduct(updatedProduct) : null;
  console.log("[SERVER products.ts] parseDbProduct returned:", JSON.stringify(parsed));

  return parsed;
};

export const adjustStock = async (
  productId: string,
  newStock: number,
  reason: string,
  staffName: string = "System",
  supplier?: string,
  dateRestocked?: string,
  invoiceNumber?: string,
) => {
  validateStockAdjustmentInput({ productId, newStock, reason });

  const [product] = await db.select().from(products).where(eq(products.id, productId));

  if (!product) {
    throw new Error("Product not found");
  }

  const diff = newStock - Number(product.stock);
  const actionType = diff > 0 ? "Stock Addition" : "Manual Correction";

  // Update fields - only update supplier, dateRestocked, invoiceNumber when adding stock (positive diff)
  const updateData: any = { stock: newStock, updatedAt: new Date() };
  if (diff > 0 && supplier) {
    updateData.supplier = supplier;
  }
  if (diff > 0 && dateRestocked) {
    updateData.dateRestocked = new Date(dateRestocked);
  }
  if (diff > 0 && invoiceNumber) {
    // Append invoice number to existing array (safe parse handles both JSON arrays and legacy plain strings)
    const existing = parseInvoiceNumbers(product.invoiceNumber);
    if (!existing.includes(invoiceNumber)) {
      existing.push(invoiceNumber);
    }
    updateData.invoiceNumber = JSON.stringify(existing);
  }

  const [result] = await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, productId))
    .returning();

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
  const result = await db
    .update(products)
    .set({ hidden: hidden ? 1 : 0 })
    .where(eq(products.id, id))
    .returning();
  return result[0] ? parseDbProduct(result[0]) : null;
};

export const restoreProduct = async (id: string) => {
  const result = await db
    .update(products)
    .set({ deleted: false })
    .where(eq(products.id, id))
    .returning();
  return result[0] ? parseDbProduct(result[0]) : null;
};

export const getAllSerialNumbers = async () => {
  const result = await db
    .select({
      sn: serialNumbers.sn,
      productId: serialNumbers.productId,
      status: serialNumbers.status,
      createdAt: serialNumbers.createdAt,
    })
    .from(serialNumbers);

  return result.map(parseDbSerialNumber);
};

export const getAvailableSerialNumbers = async () => {
  const result = await db.select().from(serialNumbers).where(eq(serialNumbers.status, "In Stock"));
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

  const result = await db
    .insert(serialNumbers)
    .values({
      sn: validated.sn,
      productId: validated.productId,
      status: "In Stock",
    })
    .returning();

  return parseDbSerialNumber(result[0]);
};

export const createSerialNumbersBulk = async (
  inputs: unknown[],
  supplier?: string,
  date?: string,
  reason?: string,
  invoiceNumber?: string,
) => {
  const validated = inputs.map(validateCreateSerialNumberInput);

  const values = validated.map((v) => ({
    sn: v.sn,
    productId: v.productId,
    status: "In Stock" as const,
  }));

  const result = await db.insert(serialNumbers).values(values).returning();

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

    // Fetch existing product to read current invoice_number for appending
    const [existingProduct] = await db.select().from(products).where(eq(products.id, productId));

    if (supplier) { setClauses.push(`supplier = $${paramIdx++}`); params.push(supplier); }
    if (date) { setClauses.push(`date_restocked = $${paramIdx++}`); params.push(new Date(date)); }
    if (invoiceNumber) {
      // Append invoice number to existing JSON array
      const existing = parseInvoiceNumbers(existingProduct?.invoiceNumber);
      if (!existing.includes(invoiceNumber)) {
        existing.push(invoiceNumber);
      }
      setClauses.push(`invoice_number = $${paramIdx++}`);
      params.push(JSON.stringify(existing));
    }
    params.push(productId);

    await client.unsafe(
      `UPDATE products SET ${setClauses.join(", ")} WHERE id = $${paramIdx}`,
      params,
    );

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId));
    const snList = sns.join(", ");
    const supplierInfo = supplier || "Unknown";
    const dateInfo = date || new Date().toISOString().split("T")[0];
    const reasonInfo = reason || "Not specified";
    const invoiceInfo = invoiceNumber || "-";

    await db.insert(auditLogs).values({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName: "System",
      action: "Stock Addition",
      details: `Added ${count} serial number(s) to ${product?.brand || ""} ${product?.model || ""} from supplier ${supplierInfo} on ${dateInfo}, invoice: ${invoiceInfo}, reason: ${reasonInfo}. SN: ${snList}`,
      relatedId: productId,
    });
  }

  return result.map(parseDbSerialNumber);
};

export const updateSerialNumberStatus = async (
  sn: string,
  status: "In Stock" | "Sold" | "Claimed" | "Damaged",
  reason?: string,
) => {
  // Get the SN to find product info before updating
  const [existingSN] = await db.select().from(serialNumbers).where(eq(serialNumbers.sn, sn));

  const [result] = await db
    .update(serialNumbers)
    .set({ status })
    .where(eq(serialNumbers.sn, sn))
    .returning();

  // Sync product stock when SN status changes
  if (existingSN && existingSN.status !== status) {
    const wasInStock = existingSN.status === "In Stock";
    const nowInStock = status === "In Stock";

    if (wasInStock && !nowInStock) {
      // SN left inventory — decrement stock
      await client.unsafe(
        "UPDATE products SET stock = GREATEST(stock - 1, 0), updated_at = NOW() WHERE id = $1",
        [existingSN.productId],
      );
    } else if (!wasInStock && nowInStock) {
      // SN returned to inventory — increment stock
      await client.unsafe(
        "UPDATE products SET stock = stock + 1, updated_at = NOW() WHERE id = $1",
        [existingSN.productId],
      );
    }
  }

  // Create audit log for status change
  if (existingSN) {
    const [product] = await db.select().from(products).where(eq(products.id, existingSN.productId));
    const reasonInfo = reason || "Not specified";
    const stockChangeNote = existingSN.status !== status
      ? wasInStock ? " (stock decremented)" : nowInStock ? " (stock incremented)" : ""
      : "";

    await db.insert(auditLogs).values({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffName: "System",
      action: "Manual Correction",
      details: `Marked serial number ${sn} as ${status} for ${product?.brand || ""} ${product?.model || ""}, reason: ${reasonInfo}${stockChangeNote}`,
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

  return result.map((r) => ({
    id: r.id,
    staffName: r.staffName,
    action: r.action,
    details: r.details,
    timestamp: r.timestamp ?? null,
    relatedId: r.relatedId,
  }));
};

export interface PaginatedAuditLogsResult {
  logs: {
    id: string;
    staffName: string;
    action: string;
    details: string;
    timestamp: string | null;
    relatedId: string | null;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getAllAuditLogs = async (
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedAuditLogsResult> => {
  const offset = (page - 1) * limit;

  const result = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit)
    .offset(offset);

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
  const total = Number(countResult[0]?.count) || 0;

  return {
    logs: result.map((r) => ({
      id: r.id,
      staffName: r.staffName,
      action: r.action,
      details: r.details,
      timestamp: r.timestamp ? r.timestamp.toISOString() : null,
      relatedId: r.relatedId,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
