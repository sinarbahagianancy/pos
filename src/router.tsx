import React from 'react';
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

const DashboardComponent = () => (
  <DashboardView sales={[]} claims={[]} products={[]} />
);

const InventoryComponent = () => (
  <InventoryView 
    products={[]} 
    sns={[]} 
    logs={[]} 
    setProducts={() => {}} 
    canViewSensitive={true}
    onManualAdjust={() => {}}
    onAddProduct={() => {}}
  />
);

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
    staffList={['Nancy', 'Mami', 'Vita', 'Cicik', 'Budi', 'Siti', 'Andi', 'Rina', 'Joko']}
    onAddStaff={() => {}}
    isAdmin={true}
    onReset={() => {}}
  />
);

const LoginComponent = () => (
  <LoginView 
    staffList={['Nancy', 'Mami', 'Vita', 'Cicik', 'Budi', 'Siti', 'Andi', 'Rina', 'Joko']}
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
  path: '/',
  component: POSComponent,
});

const dashboardRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
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
