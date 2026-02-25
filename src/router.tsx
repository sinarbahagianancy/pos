import { useState, useEffect } from 'react';
import { createRouter, RootRoute, Route, Link, useNavigate, Outlet, useRouterState } from '@tanstack/react-router';
import POSView from './routes/POS';
import InventoryView from './routes/Inventory';
import CustomersView from './routes/Customers';
import WarrantyTrackerView from './routes/WarrantyTracker';
import ReportsView from './routes/Reports';
import AuditLogsView from './routes/AuditLogs';
import SettingsView from './routes/Settings';
import DashboardView from './routes/Dashboard';
import LoginView from './routes/Login';
import { 
  getAllProducts, 
  getAllSerialNumbers, 
  createProduct as dbCreateProduct,
  adjustStock as dbAdjustStock,
  createSerialNumbersBulk
} from '../app/services/product.service';
import { 
  login as authLogin, 
  logout as authLogout, 
  getStaff, 
  getStoreConfig, 
  addStaff, 
  deleteStaff, 
  updateStoreConfig,
  StaffMember,
  StoreConfig as StoreConfigType,
  getCurrentUser
} from '../app/services/auth.service';
import type { Product, SerialNumber, AuditLog, Customer, Sale } from '../app/types';
import { 
  getAllCustomers, 
  createCustomer as apiCreateCustomer,
  updateCustomer as apiUpdateCustomer,
  deleteCustomer as apiDeleteCustomer
} from '../app/services/customer.api';
import { getAllSales, createSale as apiCreateSale } from '../app/services/sales.api';

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
      navigate({ to: '/' });
      return;
    }
    
    const loadStaff = async () => {
      try {
        const staff = await getStaff();
        setStaffList(staff);
      } catch (error) {
        console.error('Failed to load staff:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStaff();
  }, []);

  const handleLogin = async (name: string, password: string) => {
    await authLogin(name, password);
    navigate({ to: '/' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <LoginView staffList={staffList.map(s => s.name)} onLogin={handleLogin} />;
};

// App Layout with sidebar
const AppLayout = () => {
  const routerState = useRouterState();
  const isLoginPage = routerState.location.pathname === '/login';
  
  const user = getCurrentUser();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    authLogout();
    navigate({ to: '/login' });
  };

  if (isLoginPage) {
    return <Outlet />;
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'pos', label: 'Cashier (POS)', path: '/pos', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    { id: 'inventory', label: 'Inventory', path: '/inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { id: 'warranty', label: 'Service Center', path: '/warranty', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-7.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'customers', label: 'CRM / Customers', path: '/customers', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'reports', label: 'Financial Reports', path: '/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'audit', label: 'Security Logs', path: '/audit', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'settings', label: 'System Config', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="fixed inset-y-0 left-0 w-72 bg-slate-900 flex flex-col z-50 h-full">
        <div className="p-8 shrink-0">
          <div className="flex items-center justify-between lg:justify-start lg:space-x-3 text-white mb-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <span className="text-xl font-bold tracking-tight">Sinar Bahagia</span>
            </div>
          </div>
          <p className="text-slate-500 text-[10px] font-black ml-1 uppercase tracking-widest">Premium Imaging Store</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                location.pathname === item.path
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
              </svg>
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 shrink-0">
          <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/30">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Central Hub Surabaya</p>
            <p className="text-[13px] text-slate-300 font-black tracking-tight leading-tight">Jl. Kramat Gantung No. 63</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Genteng, Surabaya 60174</p>
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">v2.5.2 Stable</span>
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 ml-72">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight">Sinar Bahagia Surabaya</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-black">Logged in as</p>
              <p className="text-sm font-bold text-slate-800 leading-tight">{user?.name || 'Guest'}</p>
            </div>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-offset-1 shadow-lg ${user?.role === 'Admin' ? 'bg-indigo-600 ring-indigo-200' : 'bg-slate-500 ring-slate-200'}`}>
              {user?.name?.charAt(0) || 'G'}
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Sign Out"
            >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 custom-scrollbar relative">
          <Outlet />
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
const DashboardComponent = () => (
  <DashboardView sales={[]} claims={[]} products={[]} />
);

// Inventory
const InventoryComponent = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sns, setSns] = useState<SerialNumber[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, snsData] = await Promise.all([
          getAllProducts(),
          getAllSerialNumbers(),
        ]);
        setProducts(productsData);
        setSns(snsData);
      } catch (error) {
        console.error('Failed to load inventory data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleManualAdjust = async (productId: string, newStock: number, reason: string) => {
    try {
      await dbAdjustStock(productId, newStock, reason, 'Admin');
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, stock: newStock } : p
      ));
    } catch (error) {
      console.error('Failed to adjust stock:', error);
    }
  };

  const handleAddProduct = async (product: Product, serials: string[]) => {
    try {
      const newProduct = await dbCreateProduct(product);
      if (serials.length > 0) {
        const snInputs = serials.map(sn => ({ sn, productId: product.id }));
        await createSerialNumbersBulk(snInputs);
      }
      setProducts(prev => [...prev, newProduct]);
      if (serials.length > 0) {
        const snsData = await getAllSerialNumbers();
        setSns(snsData);
      }
    } catch (error) {
      console.error('Failed to add product:', error);
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
      logs={logs}
      setProducts={setProducts}
      canViewSensitive={true}
      onManualAdjust={handleManualAdjust}
      onAddProduct={handleAddProduct}
    />
  );
};

// Customers
const CustomersComponent = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersData, salesData] = await Promise.all([
          getAllCustomers(),
          getAllSales()
        ]);
        setCustomers(customersData);
        setSales(salesData);
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const notify = (message: string, type: 'success' | 'error' | 'info') => {
    console.log(`[${type}] ${message}`);
  };

  const handleAddCustomer = async (customer: Customer) => {
    try {
      const newCustomer = await apiCreateCustomer({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        npwp: customer.npwp,
        loyaltyPoints: customer.loyaltyPoints
      });
      setCustomers(prev => [...prev, newCustomer]);
      notify(`${customer.name} berhasil didaftarkan ke sistem.`, 'success');
    } catch (error) {
      console.error('Failed to add customer:', error);
      notify('Gagal menambahkan pelanggan', 'error');
      throw error;
    }
  };

  const handleUpdateCustomer = async (id: string, data: Partial<Customer>) => {
    try {
      const updated = await apiUpdateCustomer(id, data);
      setCustomers(prev => prev.map(c => c.id === id ? updated : c));
      notify('Data pelanggan berhasil diperbarui.', 'success');
    } catch (error) {
      console.error('Failed to update customer:', error);
      notify('Gagal memperbarui pelanggan', 'error');
      throw error;
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await apiDeleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      notify('Pelanggan berhasil dihapus.', 'success');
    } catch (error) {
      console.error('Failed to delete customer:', error);
      notify('Gagal menghapus pelanggan', 'error');
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
      setCustomers={setCustomers}
      notify={notify}
      onAddCustomer={handleAddCustomer}
    />
  );
};

// Warranty
const WarrantyComponent = () => (
  <WarrantyTrackerView sns={[]} sales={[]} claims={[]} onAddClaim={() => {}} onUpdateStatus={() => {}} notify={() => {}} />
);

// Reports
const ReportsComponent = () => (
  <ReportsView sales={[]} products={[]} sns={[]} claims={[]} canViewSensitive={true} />
);

// Audit
const AuditComponent = () => <AuditLogsView logs={[]} />;

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
          setIsAdmin(user.role === 'Admin');
        }
        
        const [configData, staffData] = await Promise.all([
          getStoreConfig(),
          getStaff()
        ]);
        setStoreConfig(configData);
        setStaffList(staffData);
      } catch (error) {
        console.error('Failed to load settings data:', error);
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
      console.error('Failed to update store config:', error);
    }
  };

  const handleAddStaff = async (name: string, password: string, role: 'Admin' | 'Staff') => {
    try {
      const newStaff = await addStaff(name, password, role);
      setStaffList(prev => [...prev, newStaff]);
    } catch (error) {
      console.error('Failed to add staff:', error);
      throw error;
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      await deleteStaff(id);
      setStaffList(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Failed to delete staff:', error);
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
      isAdmin={isAdmin}
      onReset={() => {
        if (window.confirm('WARNING: This will reset all data. Continue?')) {
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
  const staffName = user?.name || '';

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, snsData, customersData, configData] = await Promise.all([
          getAllProducts(),
          getAllSerialNumbers(),
          getAllCustomers(),
          getStoreConfig()
        ]);
        console.log('Products loaded:', productsData.length);
        console.log('SNs loaded:', snsData.length);
        console.log('Customers loaded:', customersData.length);
        setProducts(productsData);
        setSns(snsData);
        setCustomers(customersData);
        setStoreConfig(configData);
      } catch (error) {
        console.error('Failed to load POS data:', error);
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
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        staffName: sale.staffName
      });

      // Update local serial numbers status
      const soldSNs = sale.items.map(item => item.sn);
      setSns(prev => prev.map(sn => 
        soldSNs.includes(sn.sn) ? { ...sn, status: 'Sold' as const } : sn
      ));
    } catch (error) {
      console.error('Failed to complete sale:', error);
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
      staffName={staffName}
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
      navigate({ to: '/login' });
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
  path: '/pos',
  component: POSComponent,
});

const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <ProtectedRoute component={DashboardComponent} />,
});

const inventoryRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/inventory',
  component: () => <ProtectedRoute component={InventoryComponent} />,
});

const customersRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/customers',
  component: () => <ProtectedRoute component={CustomersComponent} />,
});

const warrantyRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/warranty',
  component: () => <ProtectedRoute component={WarrantyComponent} />,
});

const reportsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: () => <ProtectedRoute component={ReportsComponent} />,
});

const auditRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/audit',
  component: () => <ProtectedRoute component={AuditComponent} />,
});

const settingsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => <ProtectedRoute component={SettingsComponent} />,
});

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Add children to main route
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  inventoryRoute,
  customersRoute,
  warrantyRoute,
  reportsRoute,
  auditRoute,
  settingsRoute,
  loginRoute,
]);

// Create router
export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
