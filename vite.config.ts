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
