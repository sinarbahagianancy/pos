
import React from 'react';
import { Sale, Product, SerialNumber, WarrantyClaim } from '../../app/types';
import { formatIDR, exportToCSV, formatDate } from '../../app/utils/formatters';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  sns: SerialNumber[];
  claims: WarrantyClaim[];
  canViewSensitive: boolean;
}

const ReportsView: React.FC<ReportsProps> = ({ sales, products, sns, claims, canViewSensitive }) => {
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalCogs = sales.reduce((acc, s) => acc + s.items.reduce((sum, item) => sum + item.cogs, 0), 0);
  const grossProfit = totalRevenue - totalCogs;
  
  const receivables = sales.filter(s => s.paymentMethod === 'Credit');
  const totalReceivables = receivables.reduce((acc, s) => acc + s.total, 0);

  // Requirement: Track outstanding debts for Cicik, Vita, and Mami
  const PRIORITY_DEBTORS = ['Cicik', 'Vita', 'Mami'];
  const priorityReceivables = receivables.filter(s => 
    PRIORITY_DEBTORS.some(name => s.customerName.toLowerCase().includes(name.toLowerCase()))
  );

  const exportSales = () => {
    const data = sales.map(s => ({
      Nota: s.id,
      Tanggal: s.timestamp,
      Pelanggan: s.customerName,
      Total: s.total,
      Profit: canViewSensitive ? s.total - s.items.reduce((sum, i) => sum + i.cogs, 0) : 'RESTRICTED',
      Metode: s.paymentMethod
    }));
    exportToCSV(data, 'Executive_Report_Sinar_Bahagia');
  };

  return (
    <div className="space-y-8 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Reporting & Piutang</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight mt-1">Laporan finansial dan monitoring Org Utang (Bon).</p>
        </div>
        <button onClick={exportSales} className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200">
          Ekspor CSV (Master)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {canViewSensitive ? (
          <div className="bg-indigo-600 text-white p-8 rounded-[40px] shadow-2xl flex flex-col justify-between min-h-[220px] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
             <div>
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Total Revenue</p>
              <h2 className="text-3xl font-black truncate tabular-nums tracking-tighter">{formatIDR(totalRevenue)}</h2>
            </div>
            <div className="mt-8 pt-6 border-t border-indigo-500/50 flex justify-between items-end">
               <div>
                 <p className="text-indigo-200 text-[9px] font-black uppercase mb-1">Bersih (Gross Profit)</p>
                 <p className="text-xl font-black text-white tabular-nums">{formatIDR(grossProfit)}</p>
               </div>
               <div className="text-right">
                 <p className="text-indigo-200 text-[9px] font-black uppercase mb-1">Invoices</p>
                 <p className="text-xl font-black text-white">{sales.length}</p>
               </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 p-8 rounded-[40px] border border-slate-200 flex flex-col items-center justify-center text-center">
            <svg className="w-12 h-12 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">Financial Restricted</p>
            <p className="text-[9px] text-slate-400 mt-2 font-medium">Hanya Owner yang berhak mengakses data profit.</p>
          </div>
        )}

        {/* Priority Debt Tracking Card */}
        <div className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Piutang (Org Utang)</p>
            <h2 className="text-3xl font-black text-slate-900 truncate tabular-nums tracking-tighter">{formatIDR(totalReceivables)}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
               {PRIORITY_DEBTORS.map(name => {
                 const amount = receivables.filter(s => s.customerName.toLowerCase().includes(name.toLowerCase())).reduce((acc, s) => acc + s.total, 0);
                 return (
                   <span key={name} className="px-3 py-1 bg-orange-50 text-orange-600 text-[9px] font-black rounded-lg border border-orange-100 uppercase tracking-tight">
                     {name}: {formatIDR(amount)}
                   </span>
                 );
               })}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Nota Pending</span>
            <span className="text-slate-900 font-black">{receivables.length} Transaksi</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Valuasi Stok Retail</p>
             <h2 className="text-3xl font-black text-slate-900 truncate tabular-nums tracking-tighter">{formatIDR(products.reduce((acc, p) => acc + (p.stock * p.price), 0))}</h2>
          </div>
           <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
             <div>
                <p className="text-slate-400 text-[9px] font-black uppercase mb-1">Total Unit Gudang</p>
                <p className="text-xl font-black text-slate-900">{products.reduce((acc, p) => acc + p.stock, 0)} Pcs</p>
             </div>
             {canViewSensitive && (
               <div className="text-right">
                 <p className="text-indigo-400 text-[9px] font-black uppercase mb-1">HPP Terikat</p>
                 <p className="text-lg font-black text-indigo-900 tabular-nums">{formatIDR(products.reduce((acc, p) => acc + (p.stock * p.cogs), 0))}</p>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-orange-100 shadow-xl shadow-orange-900/5 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-orange-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-orange-50/30">
          <div>
            <h2 className="font-black text-orange-900 uppercase tracking-tighter text-lg">Daftar Piutang Prioritas (Cicik, Vita, Mami)</h2>
            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mt-1">Monitoring penagihan hutang owner & keluarga.</p>
          </div>
          <span className="px-4 py-2 bg-white border border-orange-200 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">Overdue Alerts Active</span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px]">
             <thead className="bg-orange-50 text-orange-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-10 py-6">Invoice ID</th>
                <th className="px-10 py-6">Tanggal Bon</th>
                <th className="px-10 py-6">Debitur (Pelanggan)</th>
                <th className="px-10 py-6 text-right">Nilai Tagihan</th>
                <th className="px-10 py-6 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100/50 text-sm font-medium">
              {priorityReceivables.length > 0 ? priorityReceivables.map(s => (
                <tr key={s.id} className="hover:bg-orange-50/40 transition-colors">
                  <td className="px-10 py-6 font-mono text-orange-600 text-xs font-bold">{s.id}</td>
                  <td className="px-10 py-6 text-slate-600">{formatDate(s.timestamp)}</td>
                  <td className="px-10 py-6 font-black text-slate-900 uppercase tracking-tighter">{s.customerName}</td>
                  <td className="px-10 py-6 text-right font-black text-orange-600 tabular-nums">{formatIDR(s.total)}</td>
                  <td className="px-10 py-6 text-center">
                    <button className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-indigo-700 transition-all">Pelunasan</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="p-20 text-center text-slate-300 italic">Tidak ada piutang prioritas aktif.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <h2 className="font-black text-slate-900 uppercase tracking-tighter text-lg">Semua Log Penjualan</h2>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-10 py-6">ID Nota</th>
                <th className="px-10 py-6">Waktu</th>
                <th className="px-10 py-6">Client Identity</th>
                <th className="px-10 py-6 text-right">Total Jual</th>
                {canViewSensitive && <th className="px-10 py-6 text-right text-indigo-400">Net Profit</th>}
                <th className="px-10 py-6 text-center">Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {sales.map(s => {
                const sProfit = s.total - (s.items.reduce((sum, i) => sum + i.cogs, 0) + s.tax);
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-10 py-6 font-mono text-slate-500 text-xs font-bold">{s.id}</td>
                    <td className="px-10 py-6 text-slate-600">{formatDate(s.timestamp)}</td>
                    <td className="px-10 py-6 font-black text-slate-900 uppercase tracking-tighter">{s.customerName}</td>
                    <td className="px-10 py-6 text-right font-black text-slate-900 tabular-nums">{formatIDR(s.total)}</td>
                    {canViewSensitive && <td className="px-10 py-6 text-right font-black text-green-600 tabular-nums">{formatIDR(sProfit)}</td>}
                    <td className="px-10 py-6 text-center">
                       <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border shadow-sm ${
                         s.paymentMethod === 'Credit' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                       }`}>{s.paymentMethod === 'Credit' ? 'Bon' : s.paymentMethod}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
