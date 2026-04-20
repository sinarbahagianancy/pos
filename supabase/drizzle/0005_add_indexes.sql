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

-- products: composite partial index covers both WHERE deleted=false AND ORDER BY created_at DESC
-- This makes GET /api/products use an index scan instead of full table scan + sort
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC) WHERE deleted = false;

-- customers: same pattern -- WHERE deleted=false + ORDER BY name
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name) WHERE deleted = false;

-- suppliers: same pattern -- WHERE deleted=false
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name) WHERE deleted = false;
