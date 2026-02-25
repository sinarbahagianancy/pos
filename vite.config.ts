import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(), 
      tailwindcss(), 
      tsconfigPaths(),
      {
        name: 'api-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/')) {
              const path = req.url.replace('/api/', '');
              
              if (path === 'products' && req.method === 'GET') {
                const { getAllProducts } = await import('./src/server/products.js');
                try {
                  const products = await getAllProducts();
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(products));
                  return;
                } catch (error) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: String(error) }));
                  return;
                }
              }
              
              if (path === 'products' && req.method === 'POST') {
                const { createProduct } = await import('./src/server/products.js');
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                  try {
                    const data = JSON.parse(body);
                    const product = await createProduct(data);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(product));
                  } catch (error) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: String(error) }));
                  }
                });
                return;
              }
              
              if (path.startsWith('products/') && req.method === 'PUT') {
                const productId = path.replace('products/', '');
                const { updateProduct } = await import('./src/server/products.js');
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                  try {
                    const data = JSON.parse(body);
                    const product = await updateProduct(productId, data);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(product));
                  } catch (error) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: String(error) }));
                  }
                });
                return;
              }
              
              if (path.startsWith('products/adjust-stock') && req.method === 'POST') {
                const { adjustStock } = await import('./src/server/products.js');
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                  try {
                    const data = JSON.parse(body);
                    const product = await adjustStock(data.productId, data.newStock, data.reason, data.staffName);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(product));
                  } catch (error) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: String(error) }));
                  }
                });
                return;
              }
              
              if (path === 'serial-numbers' && req.method === 'GET') {
                const { getAllSerialNumbers } = await import('./src/server/products.js');
                try {
                  const sns = await getAllSerialNumbers();
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(sns));
                  return;
                } catch (error) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: String(error) }));
                  return;
                }
              }
              
              if (path === 'serial-numbers/bulk' && req.method === 'POST') {
                const { createSerialNumbersBulk } = await import('./src/server/products.js');
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                  try {
                    const data = JSON.parse(body);
                    const sns = await createSerialNumbersBulk(data);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(sns));
                  } catch (error) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: String(error) }));
                  }
                });
                return;
              }
              
              // Auth routes
              if (path === 'auth/login' && req.method === 'POST') {
                const { loginHandler } = await import('./src/server/auth.js');
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                  try {
                    const data = JSON.parse(body);
                    const result = await loginHandler(data.name, data.password);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(result));
                  } catch (error) {
                    res.statusCode = 401;
                    res.end(JSON.stringify({ error: String(error) }));
                  }
                });
                return;
              }
              
              // Staff routes
              if (path === 'staff' && req.method === 'GET') {
                const { getStaffHandler } = await import('./src/server/auth.js');
                try {
                  const result = await getStaffHandler();
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result));
                } catch (error) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: String(error) }));
                }
                return;
              }
              
              if (path === 'staff' && req.method === 'POST') {
                const { addStaffHandler } = await import('./src/server/auth.js');
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                  try {
                    const data = JSON.parse(body);
                    const result = await addStaffHandler(data.name, data.password, data.role);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(result));
                  } catch (error) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: String(error) }));
                  }
                });
                return;
              }
              
              if (path.startsWith('staff/') && req.method === 'DELETE') {
                const { deleteStaffHandler } = await import('./src/server/auth.js');
                const staffId = path.replace('staff/', '');
                try {
                  await deleteStaffHandler(staffId);
                  res.statusCode = 204;
                  res.end();
                } catch (error) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: String(error) }));
                }
                return;
              }
              
              // Store config routes
              if (path === 'store-config' && req.method === 'GET') {
                const { getStoreConfigHandler } = await import('./src/server/auth.js');
                try {
                  const result = await getStoreConfigHandler();
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result));
                } catch (error) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: String(error) }));
                }
                return;
              }
              
              if (path === 'store-config' && req.method === 'PUT') {
                const { updateStoreConfigHandler } = await import('./src/server/auth.js');
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                  try {
                    const data = JSON.parse(body);
                    const result = await updateStoreConfigHandler(data);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(result));
                  } catch (error) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: String(error) }));
                  }
                });
                return;
              }
              
              // Customer routes
              if (path === 'customers' && req.method === 'GET') {
                const { getAllCustomersHandler } = await import('./src/server/customers.js');
                try {
                  const result = await getAllCustomersHandler();
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result));
                } catch (error) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: String(error) }));
                }
                return;
              }
              
              if (path === 'customers' && req.method === 'POST') {
                const { createCustomerHandler } = await import('./src/server/customers.js');
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                  try {
                    const data = JSON.parse(body);
                    const result = await createCustomerHandler(data);
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 201;
                    res.end(JSON.stringify(result));
                  } catch (error) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ error: String(error) }));
                  }
                });
                return;
              }
              
              if (path.startsWith('customers/') && req.method === 'PUT') {
                const customerId = path.replace('customers/', '');
                const { updateCustomerHandler } = await import('./src/server/customers.js');
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                  try {
                    const data = JSON.parse(body);
                    const result = await updateCustomerHandler(customerId, data);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(result));
                  } catch (error) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: String(error) }));
                  }
                });
                return;
              }
              
              if (path.startsWith('customers/') && req.method === 'DELETE') {
                const customerId = path.replace('customers/', '');
                const { deleteCustomerHandler } = await import('./src/server/customers.js');
                try {
                  await deleteCustomerHandler(customerId);
                  res.statusCode = 204;
                  res.end();
                } catch (error) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: String(error) }));
                }
                return;
              }
              
              // Sales routes
              if (path === 'sales' && req.method === 'GET') {
                const { getAllSalesHandler } = await import('./src/server/customers.js');
                try {
                  const result = await getAllSalesHandler();
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result));
                } catch (error) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: String(error) }));
                }
                return;
              }
              
              if (path === 'sales' && req.method === 'POST') {
                const { createSaleHandler } = await import('./src/server/customers.js');
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                  try {
                    const data = JSON.parse(body);
                    const result = await createSaleHandler(data);
                    res.setHeader('Content-Type', 'application/json');
                    res.statusCode = 201;
                    res.end(JSON.stringify(result));
                  } catch (error) {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: String(error) }));
                  }
                });
                return;
              }
              
              if (path.startsWith('sales/customer/') && req.method === 'GET') {
                const customerId = path.replace('sales/customer/', '');
                const { getSalesByCustomerHandler } = await import('./src/server/customers.js');
                try {
                  const result = await getSalesByCustomerHandler(customerId);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(result));
                } catch (error) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: String(error) }));
                }
                return;
              }
            }
            next();
          });
        }
      }
    ],
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      rollupOptions: {
        external: ['postgres', 'drizzle-orm/postgres-js']
      }
    },
    define: {
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL)
    }
  };
});
