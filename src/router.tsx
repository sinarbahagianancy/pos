import React, { useState } from 'react';
import { createRouter, RootRoute, Route } from '@tanstack/react-router';
import { AppLayout } from './routes/__root';
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
  getAuditLogsByProduct,
  createProduct as dbCreateProduct,
  adjustStock as dbAdjustStock,
  createSerialNumbersBulk
} from '../app/services/product.service';
import type { Product, SerialNumber, AuditLog } from '../app/types';

const STAF_LIST = ['Nancy', 'Mami', 'Vita', 'Cicik', 'Budi', 'Siti', 'Andi', 'Rina', 'Joko'];

const DashboardComponent = () => (
  <DashboardView sales={[]} claims={[]} products={[]} />
);

const InventoryComponent = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sns, setSns] = useState<SerialNumber[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
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

const CustomersComponent = () => (
  <CustomersView 
    customers={[]} 
    sales={[]} 
    setCustomers={() => {}}
    notify={() => {}}
  />
);

const WarrantyComponent = () => (
  <WarrantyTrackerView 
    sns={[]} 
    sales={[]} 
    claims={[]} 
    onAddClaim={() => {}}
    onUpdateStatus={() => {}}
    notify={() => {}}
  />
);

const ReportsComponent = () => (
  <ReportsView 
    sales={[]} 
    products={[]} 
    sns={[]} 
    claims={[]} 
    canViewSensitive={true}
  />
);

const AuditComponent = () => (
  <AuditLogsView logs={[]} />
);

const SettingsComponent = () => (
  <SettingsView 
    storeConfig={{ storeName: 'Sinar Bahagia', address: '', ppnRate: 11, currency: 'IDR' }}
    onUpdateStoreConfig={() => {}}
    staffList={STAF_LIST}
    onAddStaff={() => {}}
    isAdmin={true}
    onReset={() => {}}
  />
);

const LoginComponent = () => (
  <LoginView 
    staffList={STAF_LIST}
    onLogin={() => {}}
  />
);

const POSComponent = () => (
  <POSView 
    products={[]} 
    sns={[]} 
    customers={[]} 
    onCompleteSale={() => {}} 
    staffName="" 
    taxRate={0.11} 
    storeConfig={{ storeName: 'Sinar Bahagia', address: '', ppnRate: 11, currency: 'IDR' }} 
  />
);

const rootRoute = new RootRoute({
  component: AppLayout,
});

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/pos',
  component: POSComponent,
});

const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardComponent,
});

const inventoryRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/inventory',
  component: InventoryComponent,
});

const customersRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/customers',
  component: CustomersComponent,
});

const warrantyRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/warranty',
  component: WarrantyComponent,
});

const reportsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/reports',
  component: ReportsComponent,
});

const auditRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/audit',
  component: AuditComponent,
});

const settingsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsComponent,
});

const loginRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginComponent,
});

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

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
