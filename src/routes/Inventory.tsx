
import React, { useState } from 'react';
import { Product, SerialNumber, AuditLog } from '../../app/types';
import { formatIDR } from '../../app/utils/formatters';

interface InventoryProps {
  products: Product[];
  sns: SerialNumber[];
  logs: AuditLog[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  canViewSensitive: boolean;
  onManualAdjust: (productId: string, newStock: number, reason: string) => void;
  onAddProduct: (product: Product, serials: string[]) => void;
}

const InventoryView: React.FC<InventoryProps> = ({ products, sns, logs, canViewSensitive, onManualAdjust, onAddProduct }) => {
  const [filter, setFilter] = useState('');
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [newStockVal, setNewStockVal] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Product State
  const [newP, setNewP] = useState<Partial<Product>>({
    brand: '', model: '', category: 'Body', condition: 'New', price: 0, cogs: 0, warrantyMonths: 12, warrantyType: 'Official Sony Indonesia'
  });
  const [newSerials, setNewSerials] = useState('');

  const filteredProducts = products.filter(p => 
    p.model.toLowerCase().includes(filter.toLowerCase()) || 
    p.brand.toLowerCase().includes(filter.toLowerCase()) ||
    p.id.toLowerCase().includes(filter.toLowerCase())
  );

  const itemHistory = historyProduct 
    ? logs.filter(l => l.relatedId === historyProduct.id || l.details.includes(historyProduct.model))
    : [];

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || !adjustReason) return;
    onManualAdjust(adjustingProduct.id, newStockVal, adjustReason);
    setAdjustingProduct(null);
    setAdjustReason('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const serialList = newSerials.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    const p: Product = {
      id: `BRC-${Date.now()}`,
      brand: newP.brand || 'N/A',
      model: newP.model || 'N/A',
      category: newP.category as any,
      mount: newP.mount as any,
      condition: newP.condition as any,
      price: newP.price || 0,
      cogs: newP.cogs || 0,
      warrantyMonths: newP.warrantyMonths || 12,
      warrantyType: newP.warrantyType as any,
      stock: serialList.length
    };
    onAddProduct(p, serialList);
    setShowAddModal(false);
    setNewP({ brand: '', model: '', category: 'Body', condition: 'New', price: 0, cogs: 0, warrantyMonths: 12, warrantyType: 'Official Sony Indonesia' });
    setNewSerials('');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase">Master Inventori & Barcode</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight mt-1">Sistem monitoring stok real-time Sinar Bahagia Surabaya.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all w-full sm:w-auto"
        >
          Input Barang Baru
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="relative flex-1 w-full">
            <input 
              type="text" 
              placeholder="Scan Barcode ID atau ketik Merk/Model..."
              className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder-slate-500 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold shadow-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <svg className="w-6 h-6 absolute left-5 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-8 py-6">Barcode / System ID</th>
                <th className="px-8 py-6">Produk</th>
                <th className="px-8 py-6 text-right">Retail Price</th>
                {canViewSensitive && <th className="px-8 py-6 text-right text-indigo-400">Capital Price (HPP)</th>}
                <th className="px-8 py-6">Status Stok</th>
                <th className="px-8 py-6 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit text-xs mb-2 tracking-tighter">{p.id}</span>
                      <div className="flex h-3 space-x-0.5 items-end opacity-40">
                         {[...Array(15)].map((_, i) => (
                           <div key={i} className={`bg-slate-900 w-0.5 h-${(i * 37) % 3 === 0 ? 'full' : (i * 11) % 2 === 0 ? '3/4' : '1/2'}`}></div>
                         ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-sm uppercase tracking-tighter">{p.brand} {p.model}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{p.category} • {p.condition} • {p.warrantyMonths / 12} Thn Garansi</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 tracking-tighter">{formatIDR(p.price)}</td>
                  {canViewSensitive && <td className="px-8 py-6 text-right font-bold text-indigo-600 tracking-tighter tabular-nums">{formatIDR(p.cogs)}</td>}
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${p.stock <= 2 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></div>
                      <span className={`font-black text-xs uppercase tracking-widest ${p.stock <= 2 ? 'text-red-600' : 'text-slate-900'}`}>{p.stock} Unit</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        onClick={() => { setAdjustingProduct(p); setNewStockVal(p.stock); }}
                        className="text-slate-600 hover:bg-slate-200 border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Audit Stok
                      </button>
                      <button 
                        onClick={() => setHistoryProduct(p)}
                        className="text-indigo-600 hover:bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Riwayat
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Adjustment Manual</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">{adjustingProduct.brand} {adjustingProduct.model}</p>
              </div>
              <button onClick={() => setAdjustingProduct(null)} className="text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit} className="p-6 lg:p-8 space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Update Jumlah Unit Baru</label>
                <input 
                  type="number" 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xl font-black focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  value={newStockVal}
                  onChange={(e) => setNewStockVal(Number(e.target.value))}
                  min="0"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Alasan Koreksi (Audit Log)</label>
                <select 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                >
                  <option value="">Pilih Alasan...</option>
                  <option value="Restok Barang Baru">Restok Barang Baru</option>
                  <option value="Koreksi Salah Input">Koreksi Salah Input</option>
                  <option value="Barang Rusak/Retur Supplier">Barang Rusak/Retur Supplier</option>
                  <option value="Audit Stok Rutin">Audit Stok Rutin</option>
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setAdjustingProduct(null)} className="flex-1 py-4 lg:py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest">Batal</button>
                <button type="submit" className="flex-1 py-4 lg:py-5 bg-indigo-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Update Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Log Modal */}
      {historyProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
             <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Riwayat Perubahan</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">{historyProduct.brand} {historyProduct.model} (ID: {historyProduct.id})</p>
              </div>
              <button onClick={() => setHistoryProduct(null)} className="text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
              {itemHistory.length > 0 ? (
                <div className="relative border-l-2 border-slate-100 ml-4 space-y-8">
                  {itemHistory.map((log) => (
                    <div key={log.id} className="relative pl-8">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                         log.action === 'Stock Addition' ? 'bg-green-500' :
                         log.action === 'Sales Deduction' ? 'bg-amber-500' :
                         log.action === 'Manual Correction' ? 'bg-red-500' : 'bg-slate-400'
                      }`}></div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.timestamp}</span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">by {log.staffName}</span>
                        </div>
                        <p className={`text-xs font-black uppercase tracking-wide mb-1 ${
                           log.action === 'Stock Addition' ? 'text-green-700' :
                           log.action === 'Sales Deduction' ? 'text-amber-700' :
                           log.action === 'Manual Correction' ? 'text-red-700' : 'text-slate-700'
                        }`}>
                          {log.action}
                        </p>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{log.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-sm font-bold text-slate-400">Belum ada riwayat tercatat untuk item ini.</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
               <button onClick={() => setHistoryProduct(null)} className="w-full py-4 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Penerimaan Barang Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Merk & Model</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Merk" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none" value={newP.brand} onChange={e => setNewP({...newP, brand: e.target.value})} required />
                  <input type="text" placeholder="Model" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none" value={newP.model} onChange={e => setNewP({...newP, model: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori & Kondisi</label>
                <div className="grid grid-cols-2 gap-2">
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none" value={newP.category} onChange={e => setNewP({...newP, category: e.target.value as any})}>
                    <option value="Body">Body</option>
                    <option value="Lens">Lens</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none" value={newP.condition} onChange={e => setNewP({...newP, condition: e.target.value as any})}>
                    <option value="New">Baru</option>
                    <option value="Used">Bekas</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Jual (Retail)</label>
                <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none" value={newP.price} onChange={e => setNewP({...newP, price: Number(e.target.value)})} required />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Modal (HPP)</label>
                <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none" value={newP.cogs} onChange={e => setNewP({...newP, cogs: Number(e.target.value)})} required />
              </div>
              <div className="md:col-span-2 space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Input Serial Numbers (Satu Per Baris)</label>
                <textarea 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono font-bold outline-none h-32 resize-none"
                  placeholder="SN-12345&#10;SN-67890&#10;..."
                  value={newSerials}
                  onChange={e => setNewSerials(e.target.value)}
                  required
                />
                <p className="text-[10px] text-slate-400 italic">Otomatis menghitung jumlah stok berdasarkan S/N yang diinput.</p>
              </div>
              <div className="md:col-span-2 flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest">Batal</button>
                <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Simpan Aset</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
