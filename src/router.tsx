import { useState, useEffect, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRouter,
  RootRoute,
  Route,
  Link,
  useNavigate,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";

// Lazy load all route views - creates separate chunks (code splitting)
const POSView = lazy(() => import("./routes/POS").then((m) => ({ default: m.default })));
const InventoryView = lazy(() =>
  import("./routes/Inventory").then((m) => ({ default: m.default })),
);
const CustomersView = lazy(() =>
  import("./routes/Customers").then((m) => ({ default: m.default })),
);
const SuppliersView = lazy(() =>
  import("./routes/Suppliers").then((m) => ({ default: m.default })),
);
const WarrantyTrackerView = lazy(() =>
  import("./routes/WarrantyTracker").then((m) => ({ default: m.default })),
);
const ReportsView = lazy(() => import("./routes/Reports").then((m) => ({ default: m.default })));
const AuditLogsView = lazy(() =>
  import("./routes/AuditLogs").then((m) => ({ default: m.default })),
);
const SettingsView = lazy(() => import("./routes/Settings").then((m) => ({ default: m.default })));
const DashboardView = lazy(() =>
  import("./routes/Dashboard").then((m) => ({ default: m.default })),
);
const SalesLogsView = lazy(() =>
  import("./routes/SalesLogs").then((m) => ({ default: m.default })),
);
const LoginView = lazy(() => import("./routes/Login").then((m) => ({ default: m.default })));

// Loading fallback
const RouteLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);
import {
  getAllProducts,
  getAllSerialNumbers,
  createProduct as dbCreateProduct,
  adjustStock as dbAdjustStock,
  createSerialNumbersBulk,
  deleteProduct as dbDeleteProduct,
  restoreProduct as dbRestoreProduct,
  toggleProductHidden,
  updateProduct as dbUpdateProduct,
  getAllAuditLogs,
} from "../app/services/product.service";
import {
  getAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../app/services/supplier.service";
import {
  login as authLogin,
  logout as authLogout,
  getStaff,
  getStoreConfig,
  addStaff,
  deleteStaff,
  updateStoreConfig,
  updateStaff,
  StaffMember,
  StoreConfig as StoreConfigType,
  getCurrentUser,
} from "../app/services/auth.service";
import type { Product, SerialNumber, AuditLog, Customer, Sale, Supplier } from "../app/types";
import {
  getAllCustomers,
  createCustomer as apiCreateCustomer,
  updateCustomer as apiUpdateCustomer,
  deleteCustomer as apiDeleteCustomer,
} from "../app/services/customer.api";
import {
  getAllSales,
  createSale as apiCreateSale,
  markSaleAsPaid,
  recordInstallment,
} from "../app/services/sales.api";
import { getAllWarrantyClaims } from "../app/services/reports.api";
import type { WarrantyClaim } from "../app/types";

const useAuthCheck = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setIsAuthenticated(!!user);
  }, []);

  return isAuthenticated;
};

const LoginPage = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      navigate({ to: "/" });
      return;
    }

    const loadStaff = async () => {
      try {
        const staff = await getStaff();
        setStaffList(staff);
      } catch (error) {
        console.error("Failed to load staff:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, []);

  const handleLogin = async (name: string, password: string) => {
    await authLogin(name, password);
    navigate({ to: "/" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <LoginView staffList={staffList.map((s) => s.name)} onLogin={handleLogin} />;
};

// App Layout with sidebar
const AppLayout = () => {
  const routerState = useRouterState();
  const isLoginPage = routerState.location.pathname === "/login";

  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    authLogout();
    navigate({ to: "/login" });
  };

  if (isLoginPage) {
    return <Outlet />;
  }

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      path: "/",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    {
      id: "pos",
      label: "Cashier (POS)",
      path: "/pos",
      icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    },
    {
      id: "sales",
      label: "Sales Logs",
      path: "/sales-logs",
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    },
    {
      id: "inventory",
      label: "Inventory",
      path: "/inventory",
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    },
    {
      id: "suppliers",
      label: "Suppliers",
      path: "/suppliers",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    },
    {
      id: "customers",
      label: "Customers",
      path: "/customers",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    },
    {
      id: "reports",
      label: "Financial Reports",
      path: "/reports",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
    {
      id: "audit",
      label: "Activity Logs",
      path: "/audit",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      id: "settings",
      label: "System Config",
      path: "/settings",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900 flex flex-col z-50 h-full">
        <div className="p-8 shrink-0">
          <div className="flex items-center justify-between lg:justify-start lg:space-x-3 text-white mb-1">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="Sinar Bahagia"
                className="w-10 h-10 object-contain rounded-xl bg-white/10 p-1"
              />
              <span className="text-xl font-bold tracking-tight">Sinar Bahagia</span>
            </div>
          </div>
          <p className="text-slate-500 text-[10px] font-black ml-1 uppercase tracking-widest">
            Premium Imaging Store
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                location.pathname === item.path
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
              </svg>
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 ml-72">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                Sinar Bahagia Surabaya
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-black">Logged in as</p>
              <p className="text-sm font-bold text-slate-800 leading-tight">
                {user?.name || "Guest"}
              </p>
            </div>
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-offset-1 shadow-lg ${user?.role === "Admin" ? "bg-indigo-600 ring-indigo-200" : "bg-slate-500 ring-slate-200"}`}
            >
              {user?.name?.charAt(0) || "G"}
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Sign Out"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 custom-scrollbar relative">
          <Suspense fallback={<RouteLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

// Root route with AppLayout
const rootRoute = new RootRoute({
  component: AppLayout,
});

// Dashboard
const DashboardComponent = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(500000000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Use reasonable pagination - dashboard doesn't need ALL records
        const [salesData, productsData, claimsData, configData] = await Promise.all([
          getAllSales({ page: 1, limit: 500 }),
          getAllProducts({ page: 1, limit: 200 }),
          getAllWarrantyClaims({ page: 1, limit: 100 }),
          getStoreConfig(),
        ]);
        setSales(salesData.sales);
        setProducts(productsData.products);
        setClaims(claimsData.claims);
        if (configData?.monthlyTarget) {
          setMonthlyTarget(configData.monthlyTarget);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <DashboardView
      sales={sales}
      claims={claims}
      products={products}
      monthlyTarget={monthlyTarget}
    />
  );
};

// Inventory
const InventoryComponent = () => {
  const queryClient = useQueryClient();
  const [productPage, setProductPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(20);

  const user = getCurrentUser();
  const staffName = user?.name || "System";

  // Query for products with pagination
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", productPage, productsPerPage],
    queryFn: () => getAllProducts({ page: productPage, limit: productsPerPage }),
  });

  // Query for serial numbers
  const { data: snsData = [] } = useQuery({
    queryKey: ["serialNumbers"],
    queryFn: getAllSerialNumbers,
  });

  // Query for suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", 1, 1000],
    queryFn: () => getAllSuppliers({ page: 1, limit: 1000 }),
  });

  const products = productsData?.products || [];
  const totalProducts = productsData?.total || 0;
  const totalPages = productsData?.totalPages || 0;
  const sns = snsData;
  const suppliers = suppliersData?.suppliers || [];
  const loading = productsLoading;

  const handleManualAdjust = async (
    productId: string,
    newStock: number,
    reason: string,
    supplier?: string,
    dateRestocked?: string,
    invoiceNumber?: string,
  ) => {
    try {
      await dbAdjustStock(productId, newStock, reason, staffName, supplier, dateRestocked, invoiceNumber);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      console.error("Failed to adjust stock:", error);
    }
  };

  const handleRefreshSNs = async () => {
    try {
      queryClient.invalidateQueries({ queryKey: ["serialNumbers"] });
    } catch (error) {
      console.error("Failed to refresh SNs:", error);
    }
  };

  const handleAddProduct = async (product: Product, serials: string[]) => {
    try {
      await dbCreateProduct(product as unknown as Record<string, unknown>, staffName);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["serialNumbers"] });
      // Navigate to page 1 where new products appear (sorted by createdAt DESC)
      setProductPage(1);
    } catch (error) {
      console.error("Failed to add product:", error);
    }
  };

  const handleEditProduct = async (id: string, data: Partial<Product>) => {
    try {
      const updated = await dbUpdateProduct(id, data, staffName);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      console.error("Failed to edit product:", error);
      throw error;
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await dbDeleteProduct(id);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const handleRestoreProduct = async (id: string) => {
    try {
      await dbRestoreProduct(id);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      console.error("Failed to restore product:", error);
    }
  };

  const handleToggleHidden = async (id: string, hidden: boolean) => {
    try {
      await toggleProductHidden(id, hidden);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      console.error("Failed to toggle product hidden:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <InventoryView
      products={products}
      sns={sns}
      logs={[]}
      suppliers={suppliers}
      setProducts={() => {}}
      canViewSensitive={true}
      onManualAdjust={handleManualAdjust}
      onAddProduct={handleAddProduct}
      onEditProduct={handleEditProduct}
      onDeleteProduct={handleDeleteProduct}
      onRestoreProduct={handleRestoreProduct}
      onToggleHidden={handleToggleHidden}
      onRefreshSNs={handleRefreshSNs}
      currentPage={productPage}
      totalPages={totalPages}
      totalItems={totalProducts}
      onPageChange={setProductPage}
      perPage={productsPerPage}
      onPerPageChange={setProductsPerPage}
    />
  );
};

// Suppliers
const SuppliersComponent = () => {
  const queryClient = useQueryClient();
  const [supplierPage, setSupplierPage] = useState(1);
  const [suppliersPerPage, setSuppliersPerPage] = useState(20);

  const user = getCurrentUser();
  const staffName = user?.name || "System";

  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ["suppliers", supplierPage, suppliersPerPage],
    queryFn: () => getAllSuppliers({ page: supplierPage, limit: suppliersPerPage }),
  });

  const suppliers = suppliersData?.suppliers || [];
  const totalSuppliers = suppliersData?.total || 0;
  const totalSupplierPages = suppliersData?.totalPages || 0;
  const loading = suppliersLoading;

  const handleAddSupplier = async (data: { name: string; phone?: string; address?: string }) => {
    try {
      await createSupplier(data);
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    } catch (error) {
      console.error("Failed to add supplier:", error);
      throw error;
    }
  };

  const handleUpdateSupplier = async (
    id: string,
    data: { name?: string; phone?: string; address?: string },
  ) => {
    try {
      await updateSupplier(id, data);
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    } catch (error) {
      console.error("Failed to update supplier:", error);
      throw error;
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    try {
      await deleteSupplier(id);
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    } catch (error) {
      console.error("Failed to delete supplier:", error);
    }
  };

  return (
    <SuppliersView
      staffName={staffName}
      suppliers={suppliers}
      loading={loading}
      onAddSupplier={handleAddSupplier}
      onUpdateSupplier={handleUpdateSupplier}
      onDeleteSupplier={handleDeleteSupplier}
      currentPage={supplierPage}
      totalPages={totalSupplierPages}
      totalItems={totalSuppliers}
      onPageChange={setSupplierPage}
      perPage={suppliersPerPage}
      onPerPageChange={setSuppliersPerPage}
    />
  );
};

// Customers
const CustomersComponent = () => {
  const queryClient = useQueryClient();
  const [customerPage, setCustomerPage] = useState(1);
  const [customersPerPage, setCustomersPerPage] = useState(20);

  const user = getCurrentUser();
  const staffName = user?.name || "System";

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers", customerPage, customersPerPage],
    queryFn: () => getAllCustomers({ page: customerPage, limit: customersPerPage }),
  });

  const { data: salesData } = useQuery({
    queryKey: ["sales"],
    queryFn: () => getAllSales({ page: 1, limit: 500 }),
  });

  const customers = customersData?.customers || [];
  const totalCustomers = customersData?.total || 0;
  const totalCustomerPages = customersData?.totalPages || 0;
  const sales = salesData?.sales || [];
  const loading = customersLoading;

  const notify = (message: string, type: "success" | "error" | "info") => {
    // TODO: Replace with toast notification UI
  };

  const handleAddCustomer = async (customer: Customer) => {
    try {
      await apiCreateCustomer({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        npwp: customer.npwp,
        loyaltyPoints: customer.loyaltyPoints,
      });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      setCustomerPage(1);
      notify(`${customer.name} berhasil didaftarkan ke sistem.`, "success");
    } catch (error) {
      console.error("Failed to add customer:", error);
      notify("Gagal menambahkan pelanggan", "error");
      throw error;
    }
  };

  const handleUpdateCustomer = async (id: string, data: Partial<Customer>) => {
    try {
      const updated = await apiUpdateCustomer(id, { ...data, staffName });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      notify("Data pelanggan berhasil diperbarui.", "success");
    } catch (error) {
      console.error("Failed to update customer:", error);
      notify("Gagal memperbarui pelanggan", "error");
      throw error;
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await apiDeleteCustomer(id, staffName);
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      notify("Pelanggan berhasil dihapus.", "success");
    } catch (error) {
      console.error("Failed to delete customer:", error);
      notify("Gagal menghapus pelanggan", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <CustomersView
      customers={customers}
      sales={sales}
      setCustomers={() => {}}
      notify={notify}
      onAddCustomer={handleAddCustomer}
      onUpdateCustomer={handleUpdateCustomer}
      onDeleteCustomer={handleDeleteCustomer}
      currentPage={customerPage}
      totalPages={totalCustomerPages}
      totalItems={totalCustomers}
      onPageChange={setCustomerPage}
      perPage={customersPerPage}
      onPerPageChange={setCustomersPerPage}
    />
  );
};

// Sales Logs
const SalesLogsComponent = () => {
  const queryClient = useQueryClient();
  const [salesPage, setSalesPage] = useState(1);
  const [salesPerPage, setSalesPerPage] = useState(20);

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["sales", salesPage, salesPerPage],
    queryFn: () => getAllSales({ page: salesPage, limit: salesPerPage }),
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getAllCustomers({ page: 1, limit: 1000 }),
  });

  const { data: storeConfig } = useQuery({
    queryKey: ["storeConfig"],
    queryFn: getStoreConfig,
  });

  const sales = salesData?.sales || [];
  const totalSales = salesData?.total || 0;
  const totalSalesPages = salesData?.totalPages || 0;
  const customers = customersData?.customers || [];
  const loading = salesLoading;

  const handleMarkAsPaid = async (saleId: string) => {
    const user = getCurrentUser();
    const staffName = user?.name || "System";
    try {
      const updatedSale = await markSaleAsPaid(saleId, staffName);
      await queryClient.invalidateQueries({ queryKey: ["sales"] });
    } catch (error) {
      console.error("Failed to mark as paid:", error);
      throw error;
    }
  };

  const handleRecordInstallment = async (saleId: string, amount: number) => {
    const user = getCurrentUser();
    const staffName = user?.name || "System";
    try {
      await recordInstallment(saleId, amount, staffName);
      await queryClient.invalidateQueries({ queryKey: ["sales"] });
    } catch (error) {
      console.error("Failed to record installment:", error);
      throw error;
    }
  };

  if (loading || !storeConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <SalesLogsView
      sales={sales}
      customers={customers}
      storeConfig={{
        storeName: storeConfig.storeName,
        address: storeConfig.address,
        ppnRate: storeConfig.ppnRate,
      }}
      currentPage={salesPage}
      totalPages={totalSalesPages}
      totalItems={totalSales}
      onPageChange={setSalesPage}
      perPage={salesPerPage}
      onPerPageChange={setSalesPerPage}
      onMarkAsPaid={handleMarkAsPaid}
      onRecordInstallment={handleRecordInstallment}
    />
  );
};

// Warranty
const WarrantyComponent = () => {
  const queryClient = useQueryClient();
  const [claimsPage, setClaimsPage] = useState(1);
  const [claimsPerPage, setClaimsPerPage] = useState(20);

  const { data: snsData = [] } = useQuery({
    queryKey: ["serialNumbers"],
    queryFn: getAllSerialNumbers,
  });

  const { data: salesData } = useQuery({
    queryKey: ["sales"],
    queryFn: () => getAllSales({ page: 1, limit: 500 }),
  });

  const { data: claimsData, isLoading: claimsLoading } = useQuery({
    queryKey: ["warrantyClaims", claimsPage, claimsPerPage],
    queryFn: () => getAllWarrantyClaims({ page: claimsPage, limit: claimsPerPage }),
  });

  const sns = snsData;
  const sales = salesData?.sales || [];
  const claims = claimsData?.claims || [];
  const totalClaims = claimsData?.total || 0;
  const totalClaimsPages = claimsData?.totalPages || 0;
  const loading = claimsLoading;

  const notify = (message: string, type: "success" | "error" | "info") => {
    // TODO: Replace with toast notification UI
  };

  const handleAddClaim = async (claim: WarrantyClaim) => {
    const { createWarrantyClaim } = await import("../app/services/reports.api");
    try {
      await createWarrantyClaim({
        id: claim.id,
        sn: claim.sn,
        productModel: claim.productModel,
        issue: claim.issue,
        status: claim.status,
      });
      await queryClient.invalidateQueries({ queryKey: ["warrantyClaims"] });
      notify("Klaim garansi berhasil diajukan.", "success");
    } catch (error) {
      console.error("Failed to add claim:", error);
      notify("Gagal mengajukan klaim garansi", "error");
      throw error;
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    const { updateWarrantyClaim } = await import("../app/services/reports.api");
    try {
      await updateWarrantyClaim(id, status);
      await queryClient.invalidateQueries({ queryKey: ["warrantyClaims"] });
      notify("Status klaim diperbarui.", "success");
    } catch (error) {
      console.error("Failed to update claim:", error);
      notify("Gagal memperbarui status klaim", "error");
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <WarrantyTrackerView
      sns={sns}
      sales={sales}
      claims={claims}
      onAddClaim={handleAddClaim}
      onUpdateStatus={handleUpdateStatus}
      notify={notify}
      currentPage={claimsPage}
      totalPages={totalClaimsPages}
      totalItems={totalClaims}
      onPageChange={setClaimsPage}
      perPage={claimsPerPage}
      onPerPageChange={setClaimsPerPage}
    />
  );
};

// Reports
const ReportsComponent = () => {
  const queryClient = useQueryClient();
  const [salesPage, setSalesPage] = useState(1);
  const [salesPerPage, setSalesPerPage] = useState(20);

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["sales", salesPage, salesPerPage],
    queryFn: () => getAllSales({ page: salesPage, limit: salesPerPage }),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: () => getAllProducts({ page: 1, limit: 500 }),
  });

  const { data: snsData = [] } = useQuery({
    queryKey: ["serialNumbers"],
    queryFn: getAllSerialNumbers,
  });

  const { data: claimsData } = useQuery({
    queryKey: ["warrantyClaims"],
    queryFn: () => getAllWarrantyClaims({ page: 1, limit: 100 }),
  });

  const sales = salesData?.sales || [];
  const totalSales = salesData?.total || 0;
  const totalSalesPages = salesData?.totalPages || 0;
  const products = productsData?.products || [];
  const sns = snsData;
  const claims = claimsData?.claims || [];
  const loading = salesLoading;

  const user = getCurrentUser();
  const staffName = user?.name || "System";

  const handleMarkAsPaid = async (saleId: string) => {
    try {
      await markSaleAsPaid(saleId, staffName);
      await queryClient.invalidateQueries({ queryKey: ["sales"] });
    } catch (error) {
      console.error("Failed to mark as paid:", error);
      throw error;
    }
  };

  const handleRecordInstallment = async (saleId: string, amount: number) => {
    try {
      await recordInstallment(saleId, amount, staffName);
      await queryClient.invalidateQueries({ queryKey: ["sales"] });
    } catch (error) {
      console.error("Failed to record installment:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <ReportsView
      sales={sales}
      products={products}
      sns={sns}
      claims={claims}
      canViewSensitive={true}
      onMarkAsPaid={handleMarkAsPaid}
      onRecordInstallment={handleRecordInstallment}
      currentPage={salesPage}
      totalPages={totalSalesPages}
      totalItems={totalSales}
      onPageChange={setSalesPage}
      perPage={salesPerPage}
      onPerPageChange={setSalesPerPage}
    />
  );
};

// Audit
const AuditComponent = () => {
  const queryClient = useQueryClient();
  const [logsPage, setLogsPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(20);

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["auditLogs", logsPage, logsPerPage],
    queryFn: () => getAllAuditLogs({ page: logsPage, limit: logsPerPage }),
  });

  const logs = logsData?.logs || [];
  const totalLogs = logsData?.total || 0;
  const totalLogsPages = logsData?.totalPages || 0;
  const loading = logsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AuditLogsView
      logs={logs}
      currentPage={logsPage}
      totalPages={totalLogsPages}
      totalItems={totalLogs}
      onPageChange={setLogsPage}
      perPage={logsPerPage}
      onPerPageChange={setLogsPerPage}
    />
  );
};

// Settings
const SettingsComponent = () => {
  const [storeConfig, setStoreConfig] = useState<StoreConfigType | null>(null);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = getCurrentUser();
        if (user) {
          setIsAdmin(user.role === "Admin");
        }

        const [configData, staffData] = await Promise.all([getStoreConfig(), getStaff()]);
        setStoreConfig(configData);
        setStaffList(staffData);
      } catch (error) {
        console.error("Failed to load settings data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleUpdateStoreConfig = async (config: StoreConfigType) => {
    try {
      const updated = await updateStoreConfig(config);
      setStoreConfig(updated);
    } catch (error) {
      console.error("Failed to update store config:", error);
    }
  };

  const handleAddStaff = async (name: string, password: string, role: "Admin" | "Staff") => {
    try {
      const newStaff = await addStaff(name, password, role);
      setStaffList((prev) => [...prev, newStaff]);
    } catch (error) {
      console.error("Failed to add staff:", error);
      throw error;
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      await deleteStaff(id);
      setStaffList((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete staff:", error);
    }
  };

  const handleUpdateStaff = async (
    id: string,
    data: { name?: string; role?: "Admin" | "Staff"; password?: string },
  ) => {
    try {
      const updated = await updateStaff(id, data);
      setStaffList((prev) => prev.map((s) => (s.id === id ? updated : s)));
    } catch (error) {
      console.error("Failed to update staff:", error);
      throw error;
    }
  };

  if (loading || !storeConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <SettingsView
      storeConfig={storeConfig}
      onUpdateStoreConfig={handleUpdateStoreConfig}
      staffList={staffList}
      onAddStaff={handleAddStaff}
      onDeleteStaff={handleDeleteStaff}
      onUpdateStaff={handleUpdateStaff}
      isAdmin={isAdmin}
      onReset={() => {
        if (window.confirm("WARNING: This will reset all data. Continue?")) {
          window.localStorage.clear();
          window.location.reload();
        }
      }}
    />
  );
};

// POS
const POSComponent = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sns, setSns] = useState<SerialNumber[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfigType | null>(null);
  const [loading, setLoading] = useState(true);

  const user = getCurrentUser();
  const staffName = user?.name || "System";
  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, snsData, customersData, configData] = await Promise.all([
          getAllProducts({ page: 1, limit: 5000 }),
          getAllSerialNumbers(),
          getAllCustomers({ page: 1, limit: 2000 }),
          getStoreConfig(),
        ]);
        setProducts(productsData.products);
        setSns(snsData);
        setCustomers(customersData.customers);
        setStoreConfig(configData);
      } catch (error) {
        console.error("Failed to load POS data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCompleteSale = async (sale: Sale) => {
    try {
      await apiCreateSale({
        id: sale.id,
        customerId: sale.customerId,
        customerName: sale.customerName,
        items: sale.items,
        subtotal: sale.subtotal,
        tax: sale.tax,
        taxEnabled: sale.taxEnabled ?? true,
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        staffName: sale.staffName,
        notes: sale.notes,
        dueDate: sale.dueDate,
        isPaid: sale.paymentMethod !== "Utang" ? true : false,
        amountPaid: sale.amountPaid,
      });

      // Update local serial numbers status
      const soldSNs = sale.items.map((item) => item.sn);
      setSns((prev) =>
        prev.map((sn) => (soldSNs.includes(sn.sn) ? { ...sn, status: "Sold" as const } : sn)),
      );

      // Use React Query cache invalidation instead of manual refetch
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      console.error("Failed to complete sale:", error);
      throw error;
    }
  };

  const handleCreateCustomer = async (name: string, phone?: string, address?: string) => {
    try {
      const newCustomer = await apiCreateCustomer({
        id: `CUST-${Date.now()}`,
        name,
        phone,
        address,
      });
      setCustomers((prev) => [...prev, newCustomer]);
      return newCustomer;
    } catch (error) {
      console.error("Failed to create customer:", error);
      throw error;
    }
  };

  if (loading || !storeConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <POSView
      products={products}
      sns={sns}
      customers={customers}
      onCompleteSale={handleCompleteSale}
      onCreateCustomer={handleCreateCustomer}
      staffName={staffName}
      isAdmin={isAdmin}
      taxRate={storeConfig.ppnRate / 100}
      storeConfig={storeConfig}
    />
  );
};

// Protected route wrapper
const ProtectedRoute: React.FC<{ component: React.FC }> = ({ component: Component }) => {
  const isAuthenticated = useAuthCheck();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated === null || isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <Component />;
};

// Routes - each protected by default
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/pos",
  component: POSComponent,
});

const salesLogsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/sales-logs",
  component: () => <ProtectedRoute component={SalesLogsComponent} />,
});

const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <ProtectedRoute component={DashboardComponent} />,
});

const inventoryRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/inventory",
  component: () => <ProtectedRoute component={InventoryComponent} />,
});

const suppliersRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/suppliers",
  component: () => <ProtectedRoute component={SuppliersComponent} />,
});

const customersRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: () => <ProtectedRoute component={CustomersComponent} />,
});

const warrantyRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/warranty",
  component: () => <ProtectedRoute component={WarrantyComponent} />,
});

const reportsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: () => <ProtectedRoute component={ReportsComponent} />,
});

const auditRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/audit",
  component: () => <ProtectedRoute component={AuditComponent} />,
});

const settingsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => <ProtectedRoute component={SettingsComponent} />,
});

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Add children to main route
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  salesLogsRoute,
  inventoryRoute,
  suppliersRoute,
  customersRoute,
  warrantyRoute,
  reportsRoute,
  auditRoute,
  settingsRoute,
  loginRoute,
]);

// Create router
export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
