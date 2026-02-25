import type { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { products, serialNumbers, auditLogs } from './src/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { 
  validateCreateProductInput,
  validateUpdateProductInput,
  validateStockAdjustmentInput,
  validateCreateSerialNumberInput,
  parseDbProduct,
  parseDbSerialNumber
} from './app/schemas/product.schema.js';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || '';

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema: { products, serialNumbers, auditLogs } });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;

  try {
    // GET /api/products
    if (method === 'GET' && url === '/api/products') {
      const result = await db.select().from(products);
      return res.status(200).json(result.map(parseDbProduct));
    }

    // POST /api/products
    if (method === 'POST' && url === '/api/products') {
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const validated = validateCreateProductInput(input);
      
      const result = await db.insert(products).values({
        id: validated.id,
        brand: validated.brand,
        model: validated.model,
        category: validated.category,
        mount: validated.mount,
        condition: validated.condition,
        price: validated.price.toString(),
        cogs: validated.cogs.toString(),
        warrantyMonths: validated.warrantyMonths,
        warrantyType: validated.warrantyType,
        stock: validated.stock,
      }).returning();
      
      return res.status(201).json(parseDbProduct(result[0]));
    }

    // PUT /api/products/:id
    if (method === 'PUT' && url?.startsWith('/api/products/')) {
      const productId = url.replace('/api/products/', '');
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const validated = validateUpdateProductInput(input);
      
      const updateData: Record<string, unknown> = { ...validated, updatedAt: new Date() };
      if (validated.price !== undefined) updateData.price = validated.price.toString();
      if (validated.cogs !== undefined) updateData.cogs = validated.cogs.toString();
      
      const result = await db.update(products).set(updateData).where(eq(products.id, productId)).returning();
      
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
      
      const [product] = await db.select().from(products).where(eq(products.id, productId));
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      const diff = newStock - Number(product.stock);
      const actionType = diff > 0 ? 'Stock Addition' : 'Manual Correction';
      
      const [result] = await db
        .update(products)
        .set({ stock: newStock, updatedAt: new Date() })
        .where(eq(products.id, productId))
        .returning();
      
      await db.insert(auditLogs).values({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        staffName,
        action: actionType,
        details: `Manual adjust ${product.brand} ${product.model}: ${product.stock} -> ${newStock}. Reason: ${reason}`,
        relatedId: productId,
      });
      
      return res.status(200).json(parseDbProduct(result));
    }

    // DELETE /api/products/:id
    if (method === 'DELETE' && url?.startsWith('/api/products/')) {
      const productId = url.replace('/api/products/', '');
      await db.delete(products).where(eq(products.id, productId));
      return res.status(204).send(null);
    }

    // GET /api/serial-numbers
    if (method === 'GET' && url === '/api/serial-numbers') {
      const result = await db.select().from(serialNumbers);
      return res.status(200).json(result.map(parseDbSerialNumber));
    }

    // POST /api/serial-numbers/bulk
    if (method === 'POST' && url === '/api/serial-numbers/bulk') {
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const validated = input.map(validateCreateSerialNumberInput);
      
      const values = validated.map(v => ({
        sn: v.sn,
        productId: v.productId,
        status: 'In Stock' as const,
      }));
      
      const result = await db.insert(serialNumbers).values(values).returning();
      return res.status(201).json(result.map(parseDbSerialNumber));
    }

    // PUT /api/serial-numbers/:sn/status
    if (method === 'PUT' && url?.startsWith('/api/serial-numbers/') && url?.includes('/status')) {
      const sn = url.replace('/api/serial-numbers/', '').replace('/status', '');
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { status } = input;
      
      const [result] = await db
        .update(serialNumbers)
        .set({ status })
        .where(eq(serialNumbers.sn, sn))
        .returning();
      
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
