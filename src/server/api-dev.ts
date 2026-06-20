export default function apiServerPlugin() {
  let migrationWarningShown = false;

  return {
    name: "api-server",
    async configureServer(server) {
      // Run idempotent runtime migrations for the restock feature (the
      // procurement_history rename + the batch_input_items.mode column).
      // These mirror the canonical Drizzle migrations in supabase/drizzle/
      // and act as a safety net for "I just deployed and the DB is still
      // on the old shape" cases. The migration function swallows per-step
      // errors so a partial failure doesn't prevent the dev server from
      // starting.
      try {
        const { runBatchInputMigrations } = await import("./migrations.js");
        await runBatchInputMigrations();
      } catch (e) {
        console.error("[api-server] Failed to run batch input migrations:", e);
      }

      // Remind developers to apply migrations before using the dev server.
      // Runtime migrations were removed — all schema changes are now in
      // supabase/drizzle/0003_runtime_migrations.sql and 0004_data_migrations.sql
      if (!migrationWarningShown) {
        console.log(
          "[api-server] ⚠️  Make sure all DB migrations are applied before using the dev server.\n" +
            "   Apply any pending SQL files in supabase/drizzle/ against your local DB if you haven't yet.",
        );
        migrationWarningShown = true;
      }
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
              const q = (queryParams.q as string) || "";
              const result = await getAllProducts(page, limit, q);
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
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = body ? JSON.parse(body) : {};
                await deleteProduct(productId, data.staffName);
                res.statusCode = 204;
                res.end();
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
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
                const product = await toggleProductHidden(productId, data.hidden, data.staffName);
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
            let restoreBody = "";
            req.on("data", (chunk) => (restoreBody += chunk));
            req.on("end", async () => {
              try {
                const data = restoreBody ? JSON.parse(restoreBody) : {};
                const product = await restoreProduct(productId, data.staffName);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(product));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
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
                const result = await addStaffHandler(
                  data.name,
                  data.password,
                  data.role,
                  data.staffName,
                );
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
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = body ? JSON.parse(body) : {};
                await deleteStaffHandler(staffId, data.staffName);
                res.statusCode = 204;
                res.end();
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
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
                const result = await updateStaffHandler(staffId, {
                  ...data,
                  staffName: data.staffName,
                });
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
                const result = await updateStoreConfigHandler({
                  ...data,
                  staffName: data.staffName,
                });
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
                const supplier = await createSupplier(data, data.staffName);
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
                const supplier = await updateSupplier(supplierId, data, data.staffName);
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
            let delBody = "";
            req.on("data", (chunk) => (delBody += chunk));
            req.on("end", async () => {
              try {
                const data = delBody ? JSON.parse(delBody) : {};
                await deleteSupplier(supplierId, data.staffName);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: true }));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
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
                const result = await createCustomerHandler({ ...data, staffName: data.staffName });
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

          // GET /api/quotations?page=&limit=&status=Pending|Approved|Rejected|Canceled
          if (path === "quotations" && req.method === "GET") {
            const { getAllQuotationsHandler } = await import("./quotations.js");
            try {
              const page = parseInt(queryParams.page as string) || 1;
              const limit = parseInt(queryParams.limit as string) || 20;
              const status = queryParams.status as
                | "Pending"
                | "Approved"
                | "Rejected"
                | "Canceled"
                | undefined;
              const result = await getAllQuotationsHandler(page, limit, status);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          // GET /api/quotations/:id
          if (
            path.startsWith("quotations/") &&
            req.method === "GET" &&
            !path.includes("/approve") &&
            !path.includes("/reject") &&
            !path.includes("/cancel")
          ) {
            const id = decodeURIComponent(path.replace("quotations/", ""));
            const { getQuotationByIdHandler } = await import("./quotations.js");
            try {
              const result = await getQuotationByIdHandler(id);
              if (!result) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "Quotation not found" }));
                return;
              }
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          // PUT /api/quotations/:id/approve
          if (path.startsWith("quotations/") && path.endsWith("/approve") && req.method === "PUT") {
            const id = decodeURIComponent(path.replace("quotations/", "").replace("/approve", ""));
            const { approveQuotationHandler } = await import("./quotations.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await approveQuotationHandler(id, data);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          // PUT /api/quotations/:id/reject
          if (path.startsWith("quotations/") && path.endsWith("/reject") && req.method === "PUT") {
            const id = decodeURIComponent(path.replace("quotations/", "").replace("/reject", ""));
            const { rejectQuotationHandler } = await import("./quotations.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const { reason, staffName } = JSON.parse(body);
                const result = await rejectQuotationHandler(id, reason, staffName);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          // PUT /api/quotations/:id/cancel
          if (path.startsWith("quotations/") && path.endsWith("/cancel") && req.method === "PUT") {
            const id = decodeURIComponent(path.replace("quotations/", "").replace("/cancel", ""));
            const { cancelQuotationHandler } = await import("./quotations.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const { reason, staffName } = JSON.parse(body);
                const result = await cancelQuotationHandler(id, reason, staffName);
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          // POST /api/quotations
          if (path === "quotations" && req.method === "POST") {
            const { createQuotationHandler } = await import("./quotations.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await createQuotationHandler(data);
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
                // createSaleHandler errors are validation/business errors (PO Number missing,
                // insufficient stock, SN unavailable) — they should be 400, not 500.
                res.statusCode = 400;
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
                const result = await updateWarrantyClaimHandler(
                  claimId,
                  data.status,
                  data.staffName,
                );
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (error) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(error) }));
              }
            });
            return;
          }

          // ============================================================
          // Surat Jalan
          // ============================================================
          if (path === "surat-jalan" && req.method === "GET") {
            const { getAllSuratJalanHandler } = await import("./suratJalan.js");
            try {
              const page = parseInt(queryParams.page as string) || 1;
              const limit = parseInt(queryParams.limit as string) || 20;
              const search = queryParams.search as string | undefined;
              const result = await getAllSuratJalanHandler(page, limit, search);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path === "surat-jalan" && req.method === "POST") {
            const { createSuratJalanHandler } = await import("./suratJalan.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await createSuratJalanHandler(data);
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

          if (path.startsWith("surat-jalan/") && req.method === "GET") {
            const id = decodeURIComponent(path.replace("surat-jalan/", ""));
            const { getSuratJalanByIdHandler } = await import("./suratJalan.js");
            try {
              const result = await getSuratJalanByIdHandler(id);
              if (!result) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "Surat Jalan not found" }));
                return;
              }
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          // ============================================================
          // Surat Penarikan Barang
          // ============================================================
          if (path === "surat-penarikan" && req.method === "GET") {
            const { getAllSuratPenarikanHandler } = await import("./suratPenarikan.js");
            try {
              const page = parseInt(queryParams.page as string) || 1;
              const limit = parseInt(queryParams.limit as string) || 20;
              const search = queryParams.search as string | undefined;
              const result = await getAllSuratPenarikanHandler(page, limit, search);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path === "surat-penarikan" && req.method === "POST") {
            const { createSuratPenarikanHandler } = await import("./suratPenarikan.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await createSuratPenarikanHandler(data);
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

          if (path.startsWith("surat-penarikan/") && req.method === "GET") {
            const id = decodeURIComponent(path.replace("surat-penarikan/", ""));
            const { getSuratPenarikanByIdHandler } = await import("./suratPenarikan.js");
            try {
              const result = await getSuratPenarikanByIdHandler(id);
              if (!result) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "Surat Penarikan not found" }));
                return;
              }
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          // ============================================================
          // Batch Input Barang
          // ============================================================
          if (path === "batch-input" && req.method === "GET") {
            const { getAllBatchInputHandler } = await import("./batchInput.js");
            try {
              const page = parseInt(queryParams.page as string) || 1;
              const limit = parseInt(queryParams.limit as string) || 20;
              const search = queryParams.search as string | undefined;
              const result = await getAllBatchInputHandler(page, limit, search);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
            return;
          }

          if (path === "batch-input" && req.method === "POST") {
            const { createBatchInputHandler } = await import("./batchInput.js");
            let body = "";
            req.on("data", (chunk) => (body += chunk));
            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const result = await createBatchInputHandler(data);
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

          if (path.startsWith("batch-input/") && req.method === "GET") {
            const id = decodeURIComponent(path.replace("batch-input/", ""));
            const { getBatchInputByIdHandler } = await import("./batchInput.js");
            try {
              const result = await getBatchInputByIdHandler(id);
              if (!result) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "Batch Input not found" }));
                return;
              }
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(result));
            } catch (error) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(error) }));
            }
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
