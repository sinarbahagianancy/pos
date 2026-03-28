
import React, { useState } from 'react';
import { Customer, Sale } from '../../app/types';
import { formatIDR, formatDate } from '../../app/utils/formatters';

interface CustomersProps {
  customers: Customer[];
  sales: Sale[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
  onAddCustomer?: (customer: Customer) => Promise<void>;
  onUpdateCustomer?: (id: string, data: Partial<Customer>) => Promise<void>;
  onDeleteCustomer?: (id: string) => Promise<void>;
}

const CustomersView: React.FC<CustomersProps> = ({ customers, sales, setCustomers, notify, onAddCustomer, onUpdateCustomer, onDeleteCustomer }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '', npwp: '' });
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', address: '', npwp: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getTier = (points: number) => {
    if (points > 5000) return { label: 'Platinum Member', color: 'bg-indigo-600 text-white shadow-indigo-100' };
    if (points > 1000) return { label: 'Gold Member', color: 'bg-amber-100 text-amber-700 shadow-amber-50' };
    return { label: 'Standard Member', color: 'bg-slate-100 text-slate-600 shadow-slate-50' };
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.toLowerCase().includes(query) ||
      (c.email?.toLowerCase().includes(query)) ||
      (c.address?.toLowerCase().includes(query)) ||
      (c.npwp?.toLowerCase().includes(query))
    );
  });

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      npwp: customer.npwp || ''
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCustomer || !editingCustomer) return;
    
    setIsUpdating(true);
    try {
      await onUpdateCustomer(editingCustomer.id, editForm);
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...editForm } : c));
      notify('Data pelanggan berhasil diperbarui.', 'success');
      setEditingCustomer(null);
    } catch (error) {
      notify('Gagal memperbarui pelanggan', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteCustomer || !deletingCustomer) return;
    
    setIsDeleting(true);
    try {
      await onDeleteCustomer(deletingCustomer.id);
      setCustomers(prev => prev.filter(c => c.id !== deletingCustomer.id));
      notify('Pelanggan berhasil dihapus.', 'success');
      setDeletingCustomer(null);
      setSelectedCustomer(null);
    } catch (error) {
      notify('Gagal menghapus pelanggan', 'error');
    } finally {
      setIsDeleting(false);
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
        <div className="flex gap-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Cari nama, no. telp, alamat, npwp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs lg:text-sm font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 active:scale-95 transition-all uppercase tracking-widest"
          >
            + Client Baru
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-4 lg:px-6 py-5 whitespace-nowrap">Klien & Tier</th>
                <th className="px-4 lg:px-6 py-5 whitespace-nowrap">Kontak & Alamat</th>
                <th className="px-4 lg:px-6 py-5 text-right whitespace-nowrap">Total Belanja</th>
                <th className="px-4 lg:px-6 py-5 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="text-slate-400 font-medium">{searchQuery ? 'Tidak ada pelanggan yang cocok' : 'Belum ada pelanggan'}</div>
                  </td>
                </tr>
              ) : paginatedCustomers.map(c => {
                const customerSales = sales.filter(s => s.customerId === c.id);
                const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
                const tier = getTier(c.loyaltyPoints);

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 font-black border-2 border-slate-100 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all uppercase tracking-tighter text-xs shrink-0">
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-sm tracking-tight whitespace-nowrap">{c.name}</div>
                          <div className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mt-1 ${tier.color}`}>
                            {tier.label} · {c.loyaltyPoints} pts
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-xs font-bold text-slate-700">{c.phone}</div>
                      {c.npwp && <div className="text-[9px] text-slate-400 font-mono font-bold mt-0.5">{c.npwp}</div>}
                      <div className="text-[10px] text-slate-500 mt-1 truncate max-w-[180px]">{c.address || '-'}</div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-right font-black text-indigo-600 tabular-nums text-sm">{formatIDR(totalSpent)}</td>
                    <td className="px-4 lg:px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onUpdateCustomer && (
                          <button 
                            onClick={() => handleEditClick(c)}
                            className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg text-xs font-bold transition-all"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                        )}
                        <button 
                          onClick={() => setSelectedCustomer(c)}
                          className="text-indigo-600 hover:bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap"
                        >
                          Detail
                        </button>
                        {onDeleteCustomer && (
                          <button 
                            onClick={() => setDeletingCustomer(c)}
                            className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg text-xs font-bold transition-all"
                            title="Hapus"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="text-xs text-slate-500 font-medium">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredCustomers.length)} dari {filteredCustomers.length} pelanggan
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((page, idx, arr) => (
                <React.Fragment key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && <span className="text-slate-400 px-1">...</span>}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-colors ${currentPage === page ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        )}
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
                  {/* <div className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Email Address</p>
                    <p className="text-sm font-black text-slate-900 truncate">{selectedCustomer.email || '-'}</p>
                  </div> */}
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

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[150] p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in duration-200 my-auto">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Edit Pelanggan</h2>
              <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 lg:p-8 space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nama Lengkap</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500"
                      placeholder="Nama sesuai KTP..."
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nomor Telepon</label>
                    <input 
                      type="tel" 
                      required
                      className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500"
                      placeholder="0812-XXXX-XXXX"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    />
                </div>
                {/* <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500"
                      placeholder="email@example.com"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    />
                </div> */}
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">NPWP (Opsional)</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500"
                      placeholder="XX.XXX.XXX.X-XXX.XXX"
                      value={editForm.npwp}
                      onChange={(e) => setEditForm({...editForm, npwp: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Alamat Lengkap</label>
                    <textarea 
                      className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-slate-500 resize-none h-24"
                      placeholder="Jalan, Nomor, Kota..."
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    />
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setEditingCustomer(null)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-widest">Batal</button>
                <button type="submit" disabled={isUpdating} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 disabled:opacity-50">
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCustomer && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[150] p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden border border-red-100 animate-in zoom-in duration-200">
            <div className="p-6 lg:p-8 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-black text-red-600 uppercase tracking-tighter">Hapus Pelanggan?</h2>
                  <p className="text-[10px] text-red-400 font-bold uppercase mt-1">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button onClick={() => setDeletingCustomer(null)} className="text-slate-300 hover:text-slate-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 lg:p-8">
              <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Anda akan menghapus:</p>
                <p className="text-lg font-black text-slate-900 uppercase tracking-tighter">{deletingCustomer.name}</p>
                <p className="text-xs text-slate-500 font-mono mt-1">{deletingCustomer.phone}</p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <div>
                    <p className="text-sm font-black text-amber-800 uppercase tracking-tighter">Peringatan!</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Pelanggan ini memiliki <span className="font-bold">{sales.filter(s => s.customerId === deletingCustomer.id).length}</span> transaksi terkait. 
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="font-bold">Catatan:</p>
                <p>Pelanggan akan dihapus secara lembut (soft delete) dan tidak akan muncul di daftar pelanggan. Untuk mengembalikan, hubungi tim programmer.</p>
              </div>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full py-4 bg-red-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                      Menghapus...
                    </>
                  ) : (
                    'Hapus Pelanggan'
                  )}
                </button>
                <button 
                  onClick={() => setDeletingCustomer(null)} 
                  disabled={isDeleting}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersView;
