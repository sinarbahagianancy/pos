import React from 'react';
import { Outlet, Link, useNavigate } from '@tanstack/react-router';

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

export function AppLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate({ to: '/login' });
  };

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
              <p className="text-sm font-bold text-slate-800 leading-tight">Admin</p>
            </div>
            <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-offset-1 shadow-lg bg-indigo-600 ring-indigo-200">
              A
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
}
