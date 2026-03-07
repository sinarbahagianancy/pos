export default function apiServerPlugin() {
  return {
    name: 'api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/')) {
          const path = req.url.replace('/api/', '');
          
          if (path === 'products' && req.method === 'GET') {
            const { getAllProducts } = await import('./products.js');
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
            const { createProduct } = await import('./products.js');
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
            const { updateProduct } = await import('./products.js');
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const data = JSON.parse(body);
                const { staffName, ...productInput } = data;
                const product = await updateProduct(productId, productInput, staffName);
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
            const { adjustStock } = await import('./products.js');
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
          
          if (path.startsWith('products/') && req.method === 'DELETE') {
            const productId = path.replace('products/', '');
            const { deleteProduct } = await import('./products.js');
            try {
              await deleteProduct(productId);
              res.statusCode = 204;
              res.end();
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }
          
          if (path.startsWith('products/') && path.includes('/toggle-hidden') && req.method === 'POST') {
            const productId = path.replace('products/', '').replace('/toggle-hidden', '');
            const { toggleProductHidden } = await import('./products.js');
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const data = JSON.parse(body);
                const product = await toggleProductHidden(productId, data.hidden);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(product));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }
          
          if (path.startsWith('products/') && path.includes('/restore') && req.method === 'POST') {
            const productId = path.replace('products/', '').replace('/restore', '');
            const { restoreProduct } = await import('./products.js');
            try {
              const product = await restoreProduct(productId);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(product));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }
          
          if (path === 'serial-numbers' && req.method === 'GET') {
            const { getAllSerialNumbers } = await import('./products.js');
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
            const { createSerialNumbersBulk } = await import('./products.js');
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
          
          if (path === 'auth/login' && req.method === 'POST') {
            const { loginHandler } = await import('./auth.js');
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
          
          if (path === 'staff' && req.method === 'GET') {
            const { getStaffHandler } = await import('./auth.js');
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
            const { addStaffHandler } = await import('./auth.js');
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
            const { deleteStaffHandler } = await import('./auth.js');
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
          
          if (path.startsWith('staff/') && req.method === 'PUT') {
            const { updateStaffHandler } = await import('./auth.js');
            const staffId = path.replace('staff/', '');
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const data = JSON.parse(body);
                const result = await updateStaffHandler(staffId, data);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }
          
          if (path === 'store-config' && req.method === 'GET') {
            const { getStoreConfigHandler } = await import('./auth.js');
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
            const { updateStoreConfigHandler } = await import('./auth.js');
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
          
          if (path === 'customers' && req.method === 'GET') {
            const { getAllCustomersHandler } = await import('./customers.js');
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
            const { createCustomerHandler } = await import('./customers.js');
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
            const { updateCustomerHandler } = await import('./customers.js');
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
            const { deleteCustomerHandler } = await import('./customers.js');
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const data = body ? JSON.parse(body) : {};
                await deleteCustomerHandler(customerId, data.staffName);
                res.statusCode = 204;
                res.end();
              } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }
          
          if (path === 'sales' && req.method === 'GET') {
            const { getAllSalesHandler } = await import('./customers.js');
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
            const { createSaleHandler } = await import('./customers.js');
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
            const { getSalesByCustomerHandler } = await import('./customers.js');
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
          
          if (path === 'sale-items' && req.method === 'GET') {
            const { getAllSaleItemsHandler } = await import('./customers.js');
            try {
              const result = await getAllSaleItemsHandler();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }
          
          if (path.startsWith('sale-items/') && req.method === 'GET') {
            const saleId = path.replace('sale-items/', '');
            const { getSaleItemsBySaleIdHandler } = await import('./customers.js');
            try {
              const result = await getSaleItemsBySaleIdHandler(saleId);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }
          
          if (path === 'warranty-claims' && req.method === 'GET') {
            const { getAllWarrantyClaimsHandler } = await import('./customers.js');
            try {
              const result = await getAllWarrantyClaimsHandler();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }
          
          if (path === 'warranty-claims' && req.method === 'POST') {
            const { createWarrantyClaimHandler } = await import('./customers.js');
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const data = JSON.parse(body);
                const result = await createWarrantyClaimHandler(data);
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
          
          if (path.startsWith('warranty-claims/') && req.method === 'PUT') {
            const claimId = path.replace('warranty-claims/', '');
            const { updateWarrantyClaimHandler } = await import('./customers.js');
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const data = JSON.parse(body);
                const result = await updateWarrantyClaimHandler(claimId, data.status);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }
          
          if (path === 'audit-logs' && req.method === 'GET') {
            const { getAllAuditLogs } = await import('./products.js');
            try {
              const result = await getAllAuditLogs();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
              return;
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
              return;
            }
          }
          
          if (path === 'generate-invoice-pdf' && req.method === 'POST') {
            const { generateInvoicePdf } = await import('./pdf-generator.js');
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const data = JSON.parse(body);
                const { html } = data;
                if (!html) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: 'HTML content is required' }));
                  return;
                }
                const pdfBuffer = await generateInvoicePdf(html);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline; filename="invoice.pdf"');
                res.end(pdfBuffer);
              } catch (error) {
                console.error('PDF Generation Error:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to generate PDF' }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}
