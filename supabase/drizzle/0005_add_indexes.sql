-- Migration: Add missing indexes for frequently queried columns
-- These columns are used in WHERE, JOIN, and ORDER BY clauses

-- sale_items.sale_id: queried via JOIN on every GET /api/sales request
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- serial_numbers.product_id: queried when looking up SNs by product
CREATE INDEX IF NOT EXISTS idx_serial_numbers_product_id ON serial_numbers(product_id);

-- serial_numbers.status: filtered on GET /api/serial-numbers?status=In Stock
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON serial_numbers(status);

-- sales.timestamp: always ordered by timestamp DESC for pagination
CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp DESC);

-- audit_logs.timestamp: always ordered by timestamp DESC for pagination
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- products.deleted: filtered on every GET /api/products request (WHERE deleted = false)
CREATE INDEX IF NOT EXISTS idx_products_deleted ON products(deleted) WHERE deleted = false;

-- customers.deleted: filtered on every GET /api/customers request (WHERE deleted = false)
CREATE INDEX IF NOT EXISTS idx_customers_deleted ON customers(deleted) WHERE deleted = false;
