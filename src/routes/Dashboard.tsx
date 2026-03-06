
import React from 'react';
import { Sale, WarrantyClaim, Product } from '../../app/types';
import { formatIDR } from '../../app/utils/formatters';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';

interface DashboardProps {
  sales: Sale[];
  claims: WarrantyClaim[];
  products: Product[];
  monthlyTarget?: number;
}

const DashboardView: React.FC<DashboardProps> = ({ sales, claims, products, monthlyTarget = 500000000 }) => {
  const allItems = sales.flatMap(s => s.items);
  
  const revenueToday = sales.filter(s => {
    const d = new Date(s.timestamp);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).reduce((acc, s) => acc + s.total, 0);

  const revenueThisMonth = sales.filter(s => {
    const d = new Date(s.timestamp);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((acc, s) => acc + s.total, 0);

  const activeClaims = claims.filter(c => c.status !== 'Completed').length;
  const lowStockItems = products.filter(p => p.stock <= 2);

  const last7DaysSales = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    const dayRevenue = sales.filter(s => {
      const saleDate = new Date(s.timestamp);
      return saleDate.toDateString() === d.toDateString();
    }).reduce((acc, s) => acc + s.total, 0);
    
    const dayProfit = allItems.filter(item => {
      const sale = sales.find(s => s.items.includes(item));
      if (!sale) return false;
      const saleDate = new Date(sale.timestamp);
      return saleDate.toDateString() === d.toDateString();
    }).reduce((acc, item) => acc + (item.price - item.cogs), 0);
    
    return { label: dayStr, revenue: dayRevenue, profit: dayProfit };
  });

  const maxRevenue = Math.max(...last7DaysSales.map(d => d.revenue), 10000000);

  const staffStats = sales.reduce((acc: Record<string, { revenue: number; count: number }>, sale) => {
    if (!acc[sale.staffName]) acc[sale.staffName] = { revenue: 0, count: 0 };
    acc[sale.staffName].revenue += sale.total;
    acc[sale.staffName].count += 1;
    return acc;
  }, {});

  const productPerformance = allItems.reduce((acc: Record<string, { count: number; revenue: number; profit: number }>, item) => {
    if (!acc[item.model]) acc[item.model] = { count: 0, revenue: 0, profit: 0 };
    acc[item.model].count += 1;
    acc[item.model].revenue += item.price;
    acc[item.model].profit += (item.price - item.cogs);
    return acc;
  }, {});

  const topProducts = Object.entries(productPerformance)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  const categoryData = [
    { name: 'Body', value: products.filter(p => p.category === 'Body').reduce((acc, p) => acc + p.stock, 0), color: '#4f46e5' },
    { name: 'Lens', value: products.filter(p => p.category === 'Lens').reduce((acc, p) => acc + p.stock, 0), color: '#22c55e' },
    { name: 'Accessory', value: products.filter(p => p.category === 'Accessory').reduce((acc, p) => acc + p.stock, 0), color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const inventoryCost = products.reduce((acc, p) => acc + (p.stock * p.cogs), 0);
  const retailValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);
  const potentialProfit = retailValue - inventoryCost;

  const targetProgress = Math.min((revenueThisMonth / monthlyTarget) * 100, 100);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Revenue Today</p>
          <p className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">{formatIDR(revenueToday)}</p>
          <div className="mt-4 flex items-center space-x-1.5">
            <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">+{((revenueToday / 10000000) * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Monthly Revenue</p>
          <p className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">{formatIDR(revenueThisMonth)}</p>
          <div className="mt-4 flex items-center space-x-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">of {formatIDR(monthlyTarget)} target</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white p-6 lg:p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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

          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7DaysSales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 800, fontSize: 12, color: '#0f172a' }}
                  formatter={(value) => [formatIDR(Number(value) || 0), '']}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6 lg:space-y-8">
          <div className="bg-white p-6 lg:p-8 rounded-[40px] border border-slate-200 shadow-sm">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Inventory Distribution</h2>
            {categoryData.length > 0 ? (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value) || 0} units`, 'Stock']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">No inventory data</div>
            )}
            <div className="mt-4 space-y-2">
              {categoryData.map(cat => (
                <div key={cat.name} className="flex items-center justify-between text-[11px] font-black uppercase tracking-tighter">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-slate-700">{cat.name}</span>
                  </div>
                  <span className="text-slate-400">{cat.value} units</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-black text-slate-900 uppercase tracking-tighter text-xs">Operator Leaderboard</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[200px] overflow-y-auto custom-scrollbar">
              {Object.entries(staffStats).sort((a, b) => b[1].revenue - a[1].revenue).map(([name, stats], idx) => (
                <div key={name} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] uppercase ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
                      {idx + 1}
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
              {Object.keys(staffStats).length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">No data available</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black text-slate-900 uppercase tracking-tighter">Top Selling Products</h2>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">Revenue</span>
          </div>
          <div className="p-4 space-y-2 flex-1 overflow-y-auto max-h-[350px]">
            {topProducts.map(([model, stats], idx) => (
              <div key={model} className="p-4 bg-white border border-slate-100 rounded-[28px] flex items-center justify-between group hover:border-indigo-100 transition-all">
                <div className="flex items-center space-x-4 min-w-0">
                  <span className={`text-lg font-black ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : 'text-slate-200'} transition-colors`}>0{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate max-w-[180px]">{model}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{stats.count} Sold</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs sm:text-sm font-black text-slate-900 tabular-nums">{formatIDR(stats.revenue)}</p>
                  <p className="text-[9px] text-green-600 font-black uppercase tracking-widest mt-0.5">+{formatIDR(stats.profit)} profit</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No sales data available</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-black text-slate-900 uppercase tracking-tighter text-xs">Financial Overview</h2>
          </div>
          <div className="p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-2">Inventory Cost (HPP)</p>
                <p className="text-lg sm:text-xl font-black text-slate-900 tabular-nums tracking-tighter leading-none break-words">{formatIDR(inventoryCost)}</p>
              </div>
              <div className="bg-indigo-50 p-5 rounded-[24px] border border-indigo-100">
                <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-2">Retail Valuation</p>
                <p className="text-lg sm:text-xl font-black text-indigo-900 tabular-nums tracking-tighter leading-none break-words">{formatIDR(retailValue)}</p>
              </div>
              <div className="bg-green-50 p-5 rounded-[24px] border border-green-100">
                <p className="text-green-600 text-[9px] font-black uppercase tracking-widest mb-2">Potential Profit</p>
                <p className="text-lg sm:text-xl font-black text-green-700 tabular-nums tracking-tighter leading-none break-words">{formatIDR(potentialProfit)}</p>
              </div>
              <div className="bg-amber-50 p-5 rounded-[24px] border border-amber-100">
                <p className="text-amber-600 text-[9px] font-black uppercase tracking-widest mb-2">Total Products</p>
                <p className="text-lg sm:text-xl font-black text-amber-700 tabular-nums tracking-tighter leading-none break-words">{products.length} SKUs</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Target Progress</h3>
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">{targetProgress.toFixed(0)}% Achieved</span>
              </div>
              <div className="relative h-5 bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.4)] transition-all duration-1000 ease-out rounded-full" 
                  style={{ width: `${targetProgress}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[8px] font-black text-white uppercase tracking-widest drop-shadow-sm">{formatIDR(revenueThisMonth)} / {formatIDR(monthlyTarget)}</span>
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
