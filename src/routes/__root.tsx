import React from 'react';
import { Outlet, Link } from '@tanstack/react-router';

export function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-lg font-bold text-slate-900">Sinar Bahagia</h1>
          <p className="text-xs text-slate-500">Camera Store Surabaya</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/" className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            POS
          </Link>
          <Link to="/inventory" className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            Inventory
          </Link>
          <Link to="/customers" className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            Customers
          </Link>
          <Link to="/warranty" className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            Warranty
          </Link>
          <Link to="/reports" className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            Reports
          </Link>
          <Link to="/audit" className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            Audit Logs
          </Link>
          <Link to="/settings" className="block px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
            Settings
          </Link>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
