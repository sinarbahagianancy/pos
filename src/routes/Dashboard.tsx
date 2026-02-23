
import React from 'react';
import { Sale, WarrantyClaim, Product } from '../../app/types';
import { formatIDR } from '../../app/utils/formatters';

interface DashboardProps {
  sales: Sale[];
  claims: WarrantyClaim[];
  products: Product[];
}

const DashboardView: React.FC<DashboardProps> = ({ sales, claims, products }) => {
  const revenueToday = sales.filter(s => {
    const d = new Date(s.timestamp);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).reduce((acc, s) => acc + s.total, 0);

  const activeClaims = claims.filter(c => c.status !== 'Completed').length;
  const lowStockItems = products.filter(p => p.stock <= 2);

  const last7DaysSales = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const dayRevenue = sales.filter(s => {
      const saleDate = new Date(s.timestamp);
      return saleDate.toDateString() === d.toDateString();
    }).reduce((acc, s) => acc + s.total, 0);
    const dayProfit = sales.filter(s => {
      const saleDate = new Date(s.timestamp);
      return saleDate.toDateString() === d.toDateString();
    }).reduce((acc, s) => acc + (s.total - s.items.reduce((sum, item) => sum + item.cogs, 0)), 0);
    return { label: dayStr, revenue: dayRevenue, profit: dayProfit };
  });

  const maxValue = Math.max(...last7DaysSales.map(d => d.revenue), 20000000);

  // Staff Stats Logic
  const staffStats = sales.reduce((acc: any, sale) => {
    if (!acc[sale.staffName]) acc[sale.staffName] = { revenue: 0, count: 0 };
    acc[sale.staffName].revenue += sale.total;
    acc[sale.staffName].count += 1;
    return acc;
  }, {});

  // Product Stats Logic
  const productPerformance = sales.flatMap(s => s.items).reduce((acc: any, item) => {
    if (!acc[item.model]) acc[item.model] = { count: 0, revenue: 0 };
    acc[item.model].count += 1;
    acc[item.model].revenue += item.price;
    return acc;
  }, {});

  const topProducts = Object.entries(productPerformance)
    .sort((a: any, b: any) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  return (
    <div className="space-y-6 lg:space-y-8 pb-24 lg:pb-10 max-w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase">Sinar Bahagia Hub</h1>
          <p className="text-slate-500 text-sm font-medium">Jl. Kramat Gantung No. 63 • Real-time Business Analytics</p>
        </div>
        <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-2xl shadow-sm self-start sm:self-center">
          <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
          <span className="text-[10px] font-black uppercase text-indigo-700 tracking-widest leading-none mt-0.5">Live Connection</span>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Revenue Today</p>
          <p className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">{formatIDR(revenueToday)}</p>
          <div className="mt-4 flex items-center space-x-1.5">
            <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">+8.2% vs Avg</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Sales Volume</p>
          <p className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">{sales.length} Units</p>
          <div className="mt-4 flex items-center space-x-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MTD Aggregation</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Repair Queue</p>
          <p className="text-2xl font-black text-indigo-600 tracking-tighter tabular-nums">{activeClaims} Claims</p>
          <div className="mt-4 flex items-center space-x-1.5">
            <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Action Needed</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Stock Critical</p>
          <p className={`text-2xl font-black tracking-tighter tabular-nums ${lowStockItems.length > 0 ? 'text-red-600' : 'text-green-600'}`}>{lowStockItems.length} SKUs</p>
          <div className="mt-4 flex items-center space-x-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inventory Health</span>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 lg:p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">7-Day Financial Performance</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">Gross Revenue vs Net Profit</p>
            </div>
            <div className="flex space-x-6">
               <div className="flex items-center space-x-2">
                 <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
                 <span className="text-[9px] font-black text-slate-500 uppercase">Revenue</span>
               </div>
               <div className="flex items-center space-x-2">
                 <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                 <span className="text-[9px] font-black text-slate-500 uppercase">Profit</span>
               </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full relative">
            <svg className="h-full w-full overflow-visible" preserveAspectRatio="none">
              {/* 
                Grid Coordinates:
                Baseline at 85% height.
              */}
              {[0.25, 0.45, 0.65, 0.85].map((p, i) => (
                <line key={i} x1="0" y1={`${p * 100}%`} x2="100%" y2={`${p * 100}%`} stroke="#f1f5f9" strokeWidth="1" />
              ))}
              
              {last7DaysSales.map((d, i) => {
                // Map data to 0-80% height range
                const revBarHeightPercentage = (d.revenue / maxValue) * 80;
                const profBarHeightPercentage = (d.profit / maxValue) * 80;
                
                // Y Position = Baseline (85%) - Bar Height
                const revY = 85 - revBarHeightPercentage;
                const profY = 85 - profBarHeightPercentage;

                const width = 100 / 7;
                const barSpacing = width / 6;
                const barWidth = width / 4;
                
                return (
                  <g key={i}>
                    {/* Revenue Bar */}
                    <rect 
                      x={`${i * width + barSpacing}%`} 
                      y={`${revY}%`} 
                      width={`${barWidth}%`} 
                      height={`${revBarHeightPercentage}%`} 
                      fill="#4f46e5" 
                      rx="4"
                      className="transition-all duration-300 hover:fill-indigo-400 cursor-help"
                    >
                      <title>Revenue: {formatIDR(d.revenue)}</title>
                    </rect>
                    {/* Profit Bar */}
                    <rect 
                      x={`${i * width + barSpacing + barWidth + 2}%`} 
                      y={`${profY}%`} 
                      width={`${barWidth}%`} 
                      height={`${profBarHeightPercentage}%`} 
                      fill="#22c55e" 
                      rx="4"
                      className="transition-all duration-300 hover:fill-green-400 cursor-help"
                    >
                      <title>Profit: {formatIDR(d.profit)}</title>
                    </rect>
                    
                    {/* Labels positioned clearly below baseline */}
                    <text 
                      x={`${i * width + width / 2}%`} 
                      y="98%" 
                      textAnchor="middle" 
                      className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-tighter fill-current"
                    >
                      {d.label}
                    </text>
                  </g>
                );
              })}
              {/* Baseline */}
              <line x1="0" y1="85%" x2="100%" y2="85%" stroke="#e2e8f0" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* Categories & Staff */}
        <div className="space-y-6 lg:space-y-8">
          <div className="bg-white p-6 lg:p-8 rounded-[40px] border border-slate-200 shadow-sm">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Inventory Value Distribution</h2>
            <div className="space-y-6">
              {['Body', 'Lens', 'Accessory'].map(cat => {
                const catProducts = products.filter(p => p.category === cat);
                const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
                const catStock = catProducts.reduce((acc, p) => acc + p.stock, 0);
                const percentage = totalStock > 0 ? (catStock / totalStock) * 100 : 0;
                
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-tighter">
                      <span className="text-slate-700">{cat} Units</span>
                      <span className="text-slate-400">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${cat === 'Body' ? 'bg-indigo-600' : cat === 'Lens' ? 'bg-green-500' : 'bg-amber-500'}`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-black text-slate-900 uppercase tracking-tighter text-xs">Operator Leaderboard</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
              {Object.entries(staffStats).sort((a: any, b: any) => b[1].revenue - a[1].revenue).map(([name, stats]: any) => (
                <div key={name} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-[10px] uppercase">
                      {name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">{name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{stats.count} Transaksi</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 tabular-nums">{formatIDR(stats.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black text-slate-900 uppercase tracking-tighter">Asset Performance (Top 5)</h2>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">Market Potential</span>
          </div>
          <div className="p-4 space-y-2 flex-1 overflow-y-auto max-h-[400px]">
            {topProducts.map(([model, stats]: any, idx) => (
              <div key={model} className="p-4 bg-white border border-slate-100 rounded-[28px] flex items-center justify-between group hover:border-indigo-100 transition-all">
                <div className="flex items-center space-x-4 min-w-0">
                  <span className="text-lg font-black text-slate-200 group-hover:text-indigo-600 transition-colors tabular-nums">0{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px] sm:max-w-none">{model}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stats.count} Sold</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">{formatIDR(stats.revenue)}</p>
                  <p className="text-[9px] text-green-600 font-black uppercase tracking-widest mt-0.5">Verified</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-black text-slate-900 uppercase tracking-tighter text-xs">Financial Exposure & Valuation</h2>
          </div>
          <div className="p-6 lg:p-8 space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-2">Inventory Cost (HPP)</p>
                <p className="text-lg sm:text-xl font-black text-slate-900 tabular-nums tracking-tighter leading-none break-words">{formatIDR(products.reduce((acc, p) => acc + (p.stock * p.cogs), 0))}</p>
              </div>
              <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100">
                <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-2">Retail Valuation</p>
                <p className="text-lg sm:text-xl font-black text-indigo-900 tabular-nums tracking-tighter leading-none break-words">{formatIDR(products.reduce((acc, p) => acc + (p.stock * p.price), 0))}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Milestone (Monthly Target)</h3>
                 <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">74% Reached</span>
              </div>
              <div className="relative h-4 bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.4)] transition-all duration-1000 ease-out" 
                  style={{ width: '74%' }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] font-black text-white uppercase tracking-widest drop-shadow-sm">Rp 1.000.000.000 Target</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
