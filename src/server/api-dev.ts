export default function apiServerPlugin() {
  let schemaMigrated = false;

  return {
    name: "api-server",
    configureServer(server) {
      // One-time schema migration for missing columns not in original migration
      const migrateSchema = async () => {
        if (schemaMigrated) return;
        try {
          const { default: postgres } = await import("postgres");
          const connectionString = process.env.DATABASE_URL;
          if (!connectionString) return;
          const pg = postgres(connectionString, { prepare: false });
          await pg.unsafe(
            `ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false`,
          );
          await pg.unsafe(
            `ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_enabled boolean DEFAULT true`,
          );
          await pg.unsafe(
            `ALTER TABLE products ADD COLUMN IF NOT EXISTS invoice_number text`,
          );
          await pg.unsafe(
            `ALTER TABLE sales ADD COLUMN IF NOT EXISTS tax_enabled boolean DEFAULT true`,
          );
          await pg.unsafe(`ALTER TABLE sales ADD COLUMN IF NOT EXISTS notes text`);
          await pg.unsafe(
            `ALTER TABLE sales ADD COLUMN IF NOT EXISTS amount_paid numeric(15,2) DEFAULT 0`,
          );
          await pg.unsafe(
            `ALTER TABLE sales ADD COLUMN IF NOT EXISTS installments text DEFAULT '[]'`,
          );
          await pg.unsafe(
            `ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now()`,
          );
          await pg.unsafe(
            `ALTER TABLE sales ADD COLUMN IF NOT EXISTS due_date timestamp with time zone`,
          );
          await pg.unsafe(
            `ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false`,
          );
          await pg.unsafe(
            `ALTER TABLE sales ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone`,
          );
          await pg.unsafe(`ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'Utang'`);
          await pg.unsafe(`ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'Login'`);
          await pg.unsafe(`ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'Logout'`);
          await pg.end();
          schemaMigrated = true;
        } catch (e) {
          console.warn("Schema migration warning:", e);
        }
      };
      migrateSchema();

      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/api/")) {
          const urlParts = req.url.split("?");
          const path = urlParts[0].replace("/api/", "");
          const queryParams = urlParts[1]
            ? Object.fromEntries(new URLSearchParams(urlParts[1]))
            : {};

          if (path === "products" && req.method === "GET") {
            const { getAllProducts } = await import("./products.js");
            try {
              const page = parseInt(queryParams.page as string) || 1;
              const limit = parseInt(queryParams.limit as string) || 20;
              const result = await getAllProducts(page, limit);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
              return;
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
              return;
            }
          }

          if (path === "products" && req.method === "POST") {
            const { createProduct } = await import("./products.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const product = await createProduct(data);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(product));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path.startsWith("products/") && req.method === "PUT") {
            const productId = path.replace("products/", "");
            const { updateProduct } = await import("./products.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const { staffName, ...productInput } = data;
                const product = await updateProduct(productId, productInput, staffName);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(product));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path.startsWith("products/adjust-stock") && req.method === "POST") {
            const { adjustStock } = await import("./products.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const product = await adjustStock(
                  data.productId,
                  data.newStock,
                  data.reason,
                  data.staffName,
                  data.supplier,
                  data.dateRestocked,
                  data.invoiceNumber,
                );
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(product));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path.startsWith("products/") && req.method === "DELETE") {
            const productId = path.replace("products/", "");
            const { deleteProduct } = await import("./products.js");
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

          if (
            path.startsWith("products/") &&
            path.includes("/toggle-hidden") &&
            req.method === "POST"
          ) {
            const productId = path.replace("products/", "").replace("/toggle-hidden", "");
            const { toggleProductHidden } = await import("./products.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const product = await toggleProductHidden(productId, data.hidden);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(product));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path.startsWith("products/") && path.includes("/restore") && req.method === "POST") {
            const productId = path.replace("products/", "").replace("/restore", "");
            const { restoreProduct } = await import("./products.js");
            try {
              const product = await restoreProduct(productId);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(product));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path === "serial-numbers" && req.method === "GET") {
            const { getAllSerialNumbers } = await import("./products.js");
            try {
              const sns = await getAllSerialNumbers();
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(sns));
              return;
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
              return;
            }
          }

          if (path === "serial-numbers/bulk" && req.method === "POST") {
            const { createSerialNumbersBulk } = await import("./products.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const sns = await createSerialNumbersBulk(
                  data.inputs,
                  data.supplier,
                  data.date,
                  data.reason,
                  data.invoiceNumber,
                );
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(sns));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          // PUT /api/serial-numbers/:sn/status
          if (
            path.startsWith("serial-numbers/") &&
            path.includes("/status") &&
            req.method === "PUT"
          ) {
            const sn = path.replace("serial-numbers/", "").replace("/status", "");
            const { updateSerialNumberStatus } = await import("./products.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await updateSerialNumberStatus(sn, data.status);
                res.setHeader("Content-Type", "application/json");
                if (result) {
                  res.end(JSON.stringify(result));
                } else {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ error: "Serial number not found" }));
                }
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path === "auth/login" && req.method === "POST") {
            const { loginHandler } = await import("./auth.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await loginHandler(data.name, data.password);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 401;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path === "auth/logout" && req.method === "POST") {
            const { logoutHandler } = await import("./auth.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                await logoutHandler(data.name);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: true }));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path === "staff" && req.method === "GET") {
            const { getStaffHandler } = await import("./auth.js");
            try {
              const result = await getStaffHandler();
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path === "staff" && req.method === "POST") {
            const { addStaffHandler } = await import("./auth.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await addStaffHandler(data.name, data.password, data.role);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path.startsWith("staff/") && req.method === "DELETE") {
            const { deleteStaffHandler } = await import("./auth.js");
            const staffId = path.replace("staff/", "");
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

          if (path.startsWith("staff/") && req.method === "PUT") {
            const { updateStaffHandler } = await import("./auth.js");
            const staffId = path.replace("staff/", "");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await updateStaffHandler(staffId, data);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path === "store-config" && req.method === "GET") {
            const { getStoreConfigHandler } = await import("./auth.js");
            try {
              const result = await getStoreConfigHandler();
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path === "store-config" && req.method === "PUT") {
            const { updateStoreConfigHandler } = await import("./auth.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await updateStoreConfigHandler(data);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path === "suppliers" && req.method === "GET") {
            const { getAllSuppliers } = await import("./suppliers.js");
            try {
              const page = parseInt(queryParams.page as string) || 1;
              const limit = parseInt(queryParams.limit as string) || 20;
              const result = await getAllSuppliers(page, limit);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path === "suppliers" && req.method === "POST") {
            const { createSupplier } = await import("./suppliers.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const supplier = await createSupplier(data);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(supplier));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path.startsWith("suppliers/") && req.method === "PUT") {
            const supplierId = path.replace("suppliers/", "");
            const { updateSupplier } = await import("./suppliers.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const supplier = await updateSupplier(supplierId, data);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(supplier));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path.startsWith("suppliers/") && req.method === "DELETE") {
            const supplierId = path.replace("suppliers/", "");
            const { deleteSupplier } = await import("./suppliers.js");
            try {
              await deleteSupplier(supplierId);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path === "customers" && req.method === "GET") {
            const { getAllCustomersHandler } = await import("./customers.js");
            try {
              const page = parseInt(queryParams.page as string) || 1;
              const limit = parseInt(queryParams.limit as string) || 20;
              const result = await getAllCustomersHandler(page, limit);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path === "customers" && req.method === "POST") {
            const { createCustomerHandler } = await import("./customers.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await createCustomerHandler(data);
                res.setHeader("Content-Type", "application/json");
                res.statusCode = 201;
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path.startsWith("customers/") && req.method === "PUT") {
            const customerId = path.replace("customers/", "");
            const { updateCustomerHandler } = await import("./customers.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await updateCustomerHandler(customerId, data);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path.startsWith("customers/") && req.method === "DELETE") {
            const customerId = path.replace("customers/", "");
            const { deleteCustomerHandler } = await import("./customers.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
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

          if (path === "sales" && req.method === "GET") {
            const { getAllSalesHandler } = await import("./customers.js");
            try {
              const page = parseInt(queryParams.page as string) || 1;
              const limit = parseInt(queryParams.limit as string) || 20;
              const result = await getAllSalesHandler(page, limit);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path === "sales" && req.method === "POST") {
            const { createSaleHandler } = await import("./customers.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await createSaleHandler(data);
                res.setHeader("Content-Type", "application/json");
                res.statusCode = 201;
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path.startsWith("sales/") && path.endsWith("/mark-paid") && req.method === "PUT") {
            const saleId = path.replace("sales/", "").replace("/mark-paid", "");
            const { markSaleAsPaidHandler } = await import("./customers.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const { staffName } = JSON.parse(body);
                const result = await markSaleAsPaidHandler(saleId, staffName);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path.startsWith("sales/") && path.endsWith("/installment") && req.method === "PUT") {
            const saleId = path.replace("sales/", "").replace("/installment", "");
            const { recordInstallmentHandler } = await import("./customers.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const { amount, staffName } = JSON.parse(body);
                const result = await recordInstallmentHandler(saleId, amount, staffName);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path.startsWith("sales/customer/") && req.method === "GET") {
            const customerId = path.replace("sales/customer/", "");
            const { getSalesByCustomerHandler } = await import("./customers.js");
            try {
              const result = await getSalesByCustomerHandler(customerId);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path === "sale-items" && req.method === "GET") {
            const { getAllSaleItemsHandler } = await import("./customers.js");
            try {
              const result = await getAllSaleItemsHandler();
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path.startsWith("sale-items/") && req.method === "GET") {
            const saleId = path.replace("sale-items/", "");
            const { getSaleItemsBySaleIdHandler } = await import("./customers.js");
            try {
              const result = await getSaleItemsBySaleIdHandler(saleId);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path === "warranty-claims" && req.method === "GET") {
            const { getAllWarrantyClaimsHandler } = await import("./customers.js");
            try {
              const page = parseInt(queryParams.page as string) || 1;
              const limit = parseInt(queryParams.limit as string) || 20;
              const result = await getAllWarrantyClaimsHandler(page, limit);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path === "warranty-claims" && req.method === "POST") {
            const { createWarrantyClaimHandler } = await import("./customers.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await createWarrantyClaimHandler(data);
                res.setHeader("Content-Type", "application/json");
                res.statusCode = 201;
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path.startsWith("warranty-claims/") && req.method === "PUT") {
            const claimId = path.replace("warranty-claims/", "");
            const { updateWarrantyClaimHandler } = await import("./customers.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await updateWarrantyClaimHandler(claimId, data.status);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          if (path === "audit-logs" && req.method === "GET") {
            const { getAllAuditLogs } = await import("./products.js");
            try {
              const page = parseInt(queryParams.page as string) || 1;
              const limit = parseInt(queryParams.limit as string) || 20;
              const result = await getAllAuditLogs(page, limit);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
              return;
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
              return;
            }
          }

          if (path === "generate-invoice-pdf" && req.method === "POST") {
            const { generateInvoicePdf } = await import("./pdf-generator.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const { html } = data;
                if (!html) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: "HTML content is required" }));
                  return;
                }
                const pdfBuffer = await generateInvoicePdf(html);
                res.setHeader("Content-Type", "application/pdf");
                res.setHeader("Content-Disposition", 'inline; filename="invoice.pdf"');
                res.end(pdfBuffer);
              } catch (error) {
                console.error("PDF Generation Error:", error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: "Failed to generate PDF" }));
              }
            });
            return;
          }
        }
        next();
      });
    },
  };
}
