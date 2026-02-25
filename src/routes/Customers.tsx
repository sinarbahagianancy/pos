
import React, { useState } from 'react';
import { Customer, Sale } from '../../app/types';
import { formatIDR, formatDate } from '../../app/utils/formatters';

interface CustomersProps {
  customers: Customer[];
  sales: Sale[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
  onAddCustomer?: (customer: Customer) => Promise<void>;
}

const CustomersView: React.FC<CustomersProps> = ({ customers, sales, setCustomers, notify, onAddCustomer }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '', npwp: '' });

  const getTier = (points: number) => {
    if (points > 5000) return { label: 'Platinum Member', color: 'bg-indigo-600 text-white shadow-indigo-100' };
    if (points > 1000) return { label: 'Gold Member', color: 'bg-amber-100 text-amber-700 shadow-amber-50' };
    return { label: 'Standard Member', color: 'bg-slate-100 text-slate-600 shadow-slate-50' };
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer: Customer = {
      id: `CUST-${Date.now()}`,
      name: newCustomer.name,
      phone: newCustomer.phone,
      email: newCustomer.email,
      address: newCustomer.address,
      npwp: newCustomer.npwp,
      loyaltyPoints: 0
    };
    
    if (onAddCustomer) {
      try {
        await onAddCustomer(customer);
        setCustomers(prev => [...prev, customer]);
        notify(`${newCustomer.name} berhasil didaftarkan ke sistem.`, 'success');
        setShowAddModal(false);
        setNewCustomer({ name: '', phone: '', email: '', address: '', npwp: '' });
      } catch (error) {
        notify('Gagal menambahkan pelanggan', 'error');
      }
    } else {
      setCustomers(prev => [...prev, customer]);
      notify(`${newCustomer.name} berhasil didaftarkan ke sistem.`, 'success');
      setShowAddModal(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '', npwp: '' });
    }
  };

  const customerTransactions = selectedCustomer 
    ? sales.filter(s => s.customerId === selectedCustomer.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  return (
    <div className="space-y-6 lg:space-y-8 max-w-full pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase">Manajemen Pelanggan</h1>
          <p className="text-sm text-slate-500 font-medium">Daftar klien loyal dan riwayat poin belanja (CRM).</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs lg:text-sm font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95 transition-all w-full sm:w-auto uppercase tracking-widest"
        >
          + Client Baru
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
           {/* Added min-w to prevent column squash */}
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-6 lg:px-8 py-5 whitespace-nowrap">Informasi Klien</th>
                <th className="px-6 lg:px-8 py-5 whitespace-nowrap">Kontak & NPWP</th>
                <th className="px-6 lg:px-8 py-5 whitespace-nowrap">Alamat</th>
                <th className="px-6 lg:px-8 py-5 whitespace-nowrap">Loyalty Tier</th>
                <th className="px-6 lg:px-8 py-5 text-right whitespace-nowrap">Lifetime Spent</th>
                <th className="px-6 lg:px-8 py-5 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map(c => {
                const customerSales = sales.filter(s => s.customerId === c.id);
                const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
                const tier = getTier(c.loyaltyPoints);

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 lg:px-8 py-5">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 font-black border-2 border-slate-100 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all uppercase tracking-tighter shrink-0 text-sm">
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-black text-slate-900 text-sm tracking-tight whitespace-nowrap">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 lg:px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs lg:text-[13px] font-bold text-slate-700 whitespace-nowrap">{c.phone}</span>
                        {c.npwp && <span className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{c.npwp}</span>}
                      </div>
                    </td>
                    <td className="px-6 lg:px-8 py-5 max-w-[200px]">
                      <span className="text-[11px] text-slate-600 font-medium leading-tight block truncate">{c.address || '-'}</span>
                    </td>
                    <td className="px-6 lg:px-8 py-5">
                      <div className={`inline-flex px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm whitespace-nowrap ${tier.color}`}>
                        {tier.label}
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter whitespace-nowrap">{c.loyaltyPoints} Pts Tersedia</p>
                    </td>
                    <td className="px-6 lg:px-8 py-5 text-right font-black text-indigo-600 tabular-nums whitespace-nowrap text-sm">{formatIDR(totalSpent)}</td>
                    <td className="px-6 lg:px-8 py-5 text-center">
                      <button 
                        onClick={() => setSelectedCustomer(c)}
                        className="text-indigo-600 hover:bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal - Responsive Update */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[150] p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-4xl w-full my-auto flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
             {/* Header */}
             <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
               <div className="flex items-center space-x-4 lg:space-x-6 w-full md:w-auto">
                 <div className="w-16 h-16 lg:w-20 lg:h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-xl lg:text-2xl font-black uppercase shadow-lg shadow-indigo-500/20 shrink-0">
                    {selectedCustomer.name.charAt(0)}
                 </div>
                 <div className="min-w-0 flex-1">
                   <h2 className="text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2 truncate">{selectedCustomer.name}</h2>
                   <div className="flex flex-wrap items-center gap-2 mb-2">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getTier(selectedCustomer.loyaltyPoints).color}`}>
                       {getTier(selectedCustomer.loyaltyPoints).label}
                     </span>
                     <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{selectedCustomer.loyaltyPoints} Points</span>
                   </div>
                   <p className="text-xs text-slate-500 truncate">{selectedCustomer.address}</p>
                 </div>
               </div>
               <button onClick={() => setSelectedCustomer(null)} className="absolute top-4 right-4 md:static text-slate-400 hover:text-slate-700 transition-colors p-2 bg-white md:bg-transparent rounded-full md:rounded-none shadow-sm md:shadow-none">
                 <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>

             {/* Content */}
             <div className="p-6 lg:p-8 bg-slate-50/30">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Contact Phone</p>
                    <p className="text-sm font-black text-slate-900 break-all">{selectedCustomer.phone}</p>
                  </div>
                  <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Email Address</p>
                    <p className="text-sm font-black text-slate-900 truncate">{selectedCustomer.email || '-'}</p>
                  </div>
                  <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Tax ID (NPWP)</p>
                    <p className="text-sm font-mono font-black text-slate-900 break-all">{selectedCustomer.npwp || '-'}</p>
                  </div>
               </div>

               <h3 className="font-black text-slate-900 uppercase tracking-tighter mb-4 text-sm flex items-center space-x-2">
                 <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <span>Purchase History</span>
               </h3>
               
               <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left min-w-[600px]">
                     <thead className="bg-slate-100 text-slate-500 uppercase text-[9px] font-black tracking-widest border-b border-slate-200">
                       <tr>
                         <th className="px-6 py-4">Invoice ID</th>
                         <th className="px-6 py-4">Date</th>
                         <th className="px-6 py-4">Items Purchased</th>
                         <th className="px-6 py-4 text-right">Total</th>
                         <th className="px-6 py-4 text-center">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {customerTransactions.length > 0 ? customerTransactions.map(sale => (
                         <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">{sale.id}</td>
                           <td className="px-6 py-4 text-xs font-medium text-slate-600">{formatDate(sale.timestamp)}</td>
                           <td className="px-6 py-4">
                             <div className="space-y-1">
                               {sale.items.map((item, idx) => (
                                 <div key={idx} className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                                   <span>• {item.model}</span>
                                   <span className="text-[9px] text-slate-400 font-mono">({item.sn})</span>
                                 </div>
                               ))}
                             </div>
                           </td>
                           <td className="px-6 py-4 text-right text-xs font-black text-slate-900 tabular-nums">{formatIDR(sale.total)}</td>
                           <td className="px-6 py-4 text-center">
                              <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[9px] font-black uppercase tracking-widest">Paid</span>
                           </td>
                         </tr>
                       )) : (
                         <tr><td colSpan={5} className="p-8 text-center text-slate-400 italic text-xs">No transactions found for this customer.</td></tr>
                       )}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
             <div className="p-6 border-t border-slate-100 bg-slate-50 lg:hidden">
                <button onClick={() => setSelectedCustomer(null)} className="w-full py-4 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl text-xs uppercase tracking-widest">Close</button>
             </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal - Responsive Update */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[150] p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in duration-200 my-auto">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Daftarkan Client</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 lg:p-8 space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500"
                      placeholder="Nama sesuai KTP..."
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nomor Telepon</label>
                    <input 
                      type="tel" 
                      required
                      className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500"
                      placeholder="0812-XXXX-XXXX"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">NPWP (Opsional)</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500"
                      placeholder="XX.XXX.XXX.X-XXX.XXX"
                      value={newCustomer.npwp}
                      onChange={(e) => setNewCustomer({...newCustomer, npwp: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Alamat Lengkap</label>
                    <textarea 
                      className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500 resize-none h-24"
                      placeholder="Jalan, Nomor, Kota..."
                      value={newCustomer.address}
                      onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    />
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-widest">Batal</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">Simpan Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersView;
