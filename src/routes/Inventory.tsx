
import React, { useState } from 'react';
import { Product, SerialNumber, AuditLog, Supplier } from '../../app/types';
import { formatIDR } from '../../app/utils/formatters';

interface InventoryProps {
  products: Product[];
  sns: SerialNumber[];
  logs: AuditLog[];
  suppliers: Supplier[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  canViewSensitive: boolean;
  onManualAdjust: (productId: string, newStock: number, reason: string) => void;
  onAddProduct: (product: Product, serials: string[]) => void;
  onEditProduct?: (id: string, data: Partial<Product>) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onRestoreProduct?: (id: string) => Promise<void>;
  onToggleHidden?: (id: string, hidden: boolean) => Promise<void>;
}

const InventoryView: React.FC<InventoryProps> = ({ products, sns, logs, suppliers, setProducts, canViewSensitive, onManualAdjust, onAddProduct, onEditProduct, onDeleteProduct, onRestoreProduct, onToggleHidden }) => {
  const [filter, setFilter] = useState('');
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  
  // Simple stock adjustment
  const [simpleAdjustProduct, setSimpleAdjustProduct] = useState<Product | null>(null);
  const [simpleAdjustAmount, setSimpleAdjustAmount] = useState(0);
  const [simpleAdjustReason, setSimpleAdjustReason] = useState('');
  
  // SN-based stock operations
  const [addingSNProduct, setAddingSNProduct] = useState<Product | null>(null);
  const [removingSNProduct, setRemovingSNProduct] = useState<Product | null>(null);
  const [newSNInput, setNewSNInput] = useState('');
  const [snOperationReason, setSNOperationReason] = useState('');
  const [snOperationSupplier, setSNOperationSupplier] = useState('');
  const [snOperationDate, setSNOperationDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessingSN, setIsProcessingSN] = useState(false);

  // New Product State
  const [newP, setNewP] = useState<Partial<Product>>({
    brand: '', model: '', category: 'Body', condition: 'New', price: 0, cogs: 0, warrantyMonths: 12, warrantyType: 'Official Sony Indonesia'
  });
  const [newSerials, setNewSerials] = useState('');
  const [newProductHasSN, setNewProductHasSN] = useState(true);
  const [newProductQuantity, setNewProductQuantity] = useState(1);
  const [newProductSupplier, setNewProductSupplier] = useState('');
  const [newProductDate, setNewProductDate] = useState(new Date().toISOString().split('T')[0]);

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

  const handleSimpleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simpleAdjustProduct || simpleAdjustAmount === 0 || !simpleAdjustReason) return;
    const newStock = simpleAdjustProduct.stock + simpleAdjustAmount;
    if (newStock < 0) {
      alert('Stok tidak bisa negatif!');
      return;
    }
    onManualAdjust(simpleAdjustProduct.id, newStock, simpleAdjustReason);
    setSimpleAdjustProduct(null);
    setSimpleAdjustAmount(0);
    setSimpleAdjustReason('');
  };

  const handleAddSN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingSNProduct || !newSNInput.trim() || !snOperationReason) return;
    
    const snList = newSNInput.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (snList.length === 0) {
      alert('Masukkan minimal 1 nomor seri.');
      return;
    }

    setIsProcessingSN(true);
    try {
      // Add serial numbers to database
      const { addSerialNumbers } = await import('../../app/services/product.service');
      await addSerialNumbers(snList.map(sn => ({ sn, productId: addingSNProduct.id })));
      
      // Update product stock
      onManualAdjust(addingSNProduct.id, addingSNProduct.stock + snList.length, snOperationReason);
      
      alert(`${snList.length} nomor seri berhasil ditambahkan ke ${addingSNProduct.model}.`);
      setAddingSNProduct(null);
      setNewSNInput('');
      setSNOperationReason('');
    } catch (error) {
      console.error('Failed to add serial numbers:', error);
      alert('Gagal menambahkan nomor seri.');
    } finally {
      setIsProcessingSN(false);
    }
  };

  const handleRemoveSN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removingSNProduct || !newSNInput.trim() || !snOperationReason) return;
    
    const snList = newSNInput.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (snList.length === 0) {
      alert('Masukkan minimal 1 nomor seri.');
      return;
    }

    // Verify SN belongs to this product
    const productSNs = sns.filter(sn => sn.productId === removingSNProduct.id && sn.status === 'In Stock');
    const validSNs = snList.filter(sn => productSNs.some(psn => psn.sn === sn));
    const invalidSNs = snList.filter(sn => !productSNs.some(psn => psn.sn === sn));

    if (invalidSNs.length > 0) {
      alert(`Nomor seri berikut bukan dari produk ini atau sudah terjual: ${invalidSNs.join(', ')}`);
      return;
    }

    setIsProcessingSN(true);
    try {
      // Update SN status to Damaged
      const { updateSerialNumberStatus } = await import('../../app/services/product.service');
      for (const sn of validSNs) {
        await updateSerialNumberStatus(sn, 'Damaged');
      }
      
      // Decrease stock
      onManualAdjust(removingSNProduct.id, removingSNProduct.stock - validSNs.length, snOperationReason);
      
      alert(`${validSNs.length} nomor seri berhasil ditandai sebagai rusak/hilang dari ${removingSNProduct.model}.`);
      setRemovingSNProduct(null);
      setNewSNInput('');
      setSNOperationReason('');
    } catch (error) {
      console.error('Failed to remove serial numbers:', error);
      alert('Gagal menghapus nomor seri.');
    } finally {
      setIsProcessingSN(false);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const serialList = newSerials.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    if (serialList.length === 0) {
      alert('Produk harus memiliki minimal 1 nomor seri.');
      return;
    }
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
                <th className="px-8 py-6 text-center">Has SN</th>
                <th className="px-8 py-6 text-right">Retail Price</th>
                {canViewSensitive && <th className="px-8 py-6 text-right text-indigo-400">Capital Price (HPP)</th>}
                <th className="px-8 py-6">Status Stok</th>
                <th className="px-8 py-6">Supplier</th>
                <th className="px-8 py-6">Last Restock</th>
                <th className="px-8 py-6 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {filteredProducts.map(p => (
                <tr key={p.id} className={`transition-colors group ${p.hidden ? 'opacity-50 bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit text-xs mb-2 tracking-tighter">{p.id}</span>
                      {p.hidden === 1 && (
                        <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">Hidden</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 text-sm uppercase tracking-tighter">{p.brand} {p.model}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{p.category} • {p.condition} • {p.warrantyMonths / 12} Thn Garansi</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    {p.hasSerialNumber !== false ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase bg-green-100 text-green-700">Ya</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase bg-slate-100 text-slate-500">Tidak</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 tracking-tighter">{formatIDR(p.price)}</td>
                  {canViewSensitive && <td className="px-8 py-6 text-right font-bold text-indigo-600 tracking-tighter tabular-nums">{formatIDR(p.cogs)}</td>}
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${p.stock <= 2 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></div>
                      <span className={`font-black text-xs uppercase tracking-widest ${p.stock <= 2 ? 'text-red-600' : 'text-slate-900'}`}>{p.stock} Unit</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-medium text-slate-600">{p.supplier || '-'}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-medium text-slate-500">
                      {p.dateRestocked ? new Date(p.dateRestocked).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {onEditProduct && (
                        <button 
                          onClick={() => {
                            if (p.hidden) {
                              setEditError('Produk yang disembunyikan tidak dapat diedit. Silakan tampilkan dulu.');
                              return;
                            }
                            setEditingProduct(p);
                            setEditForm({
                              brand: p.brand,
                              model: p.model,
                              category: p.category,
                              mount: p.mount,
                              condition: p.condition,
                              price: p.price,
                              cogs: p.cogs,
                              warrantyMonths: p.warrantyMonths,
                              warrantyType: p.warrantyType
                            });
                            setEditError(null);
                          }}
                          className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg text-xs font-bold transition-all"
                          title="Edit Produk"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      )}
                      {/* TODO: Re-enable SN-based stock operations when needed
                      <button 
                        onClick={() => { setAddingSNProduct(p); setNewSNInput(''); setSNOperationReason(''); }}
                        className="text-green-600 hover:bg-green-50 p-2 rounded-lg text-xs font-bold transition-all"
                        title="Tambah via SN"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      </button>
                      <button 
                        onClick={() => { setRemovingSNProduct(p); setNewSNInput(''); setSNOperationReason(''); }}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg text-xs font-bold transition-all"
                        title="Kurangi via SN"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                      </button>
                      */}
                      <button 
                        onClick={() => { setSimpleAdjustProduct(p); setSimpleAdjustAmount(0); setSimpleAdjustReason(''); }}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg text-xs font-bold transition-all"
                        title="Sesuaikan Stok"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                      <button 
                        onClick={() => setHistoryProduct(p)}
                        className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg text-xs font-bold transition-all"
                        title="Riwayat"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                      {onToggleHidden && (
                        <button 
                          onClick={() => onToggleHidden(p.id, !p.hidden)}
                          className={`p-2 rounded-lg text-xs font-bold transition-all ${p.hidden ? 'text-green-600 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}
                          title={p.hidden ? 'Tampilkan' : 'Sembunyikan'}
                        >
                          {p.hidden ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          )}
                        </button>
                      )}
                      {onDeleteProduct && (
                        <button 
                          onClick={() => setDeletingProduct(p)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg text-xs font-bold transition-all"
                          title="Hapus"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add SN Modal */}
      {addingSNProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-green-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-green-800 uppercase tracking-tighter">Tambah via SN</h2>
                <p className="text-[10px] text-green-600 font-bold uppercase mt-2">{addingSNProduct.brand} {addingSNProduct.model}</p>
                <p className="text-[10px] text-green-500 font-medium mt-1">Stok saat ini: {addingSNProduct.stock} unit</p>
              </div>
              <button onClick={() => setAddingSNProduct(null)} className="text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddSN} className="p-6 lg:p-8 space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Input Nomor Seri (Satu Per Baris)</label>
                <textarea 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-mono focus:ring-4 focus:ring-green-500/10 outline-none h-32 resize-none"
                  value={newSNInput}
                  onChange={(e) => setNewSNInput(e.target.value)}
                  placeholder="Contoh:&#10;ABC123456&#10;ABC123457&#10;ABC123458"
                  required
                />
                <p className="text-[10px] text-slate-400">Masukkan 1 SN per baris. Setiap SN akan menambah 1 unit stok.</p>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</label>
                <select 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-green-500/10 outline-none appearance-none"
                  value={snOperationSupplier}
                  onChange={(e) => setSNOperationSupplier(e.target.value)}
                  required
                >
                  <option value="">Pilih Supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</label>
                <input 
                  type="date" 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-green-500/10 outline-none"
                  value={snOperationDate}
                  onChange={(e) => setSNOperationDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Alasan Penambahan</label>
                <select 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-green-500/10 outline-none appearance-none"
                  value={snOperationReason}
                  onChange={(e) => setSNOperationReason(e.target.value)}
                  required
                >
                  <option value="">Pilih Alasan...</option>
                  <option value="Restok Barang Baru">Restok Barang Baru</option>
                  <option value="Barang Retur Customer">Barang Retur Customer</option>
                  <option value="Penyesuaian Stok">Penyesuaian Stok</option>
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setAddingSNProduct(null)} className="flex-1 py-4 lg:py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest">Batal</button>
                <button type="submit" disabled={isProcessingSN} className="flex-1 py-4 lg:py-5 bg-green-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50">
                  {isProcessingSN ? 'Memproses...' : 'Tambah Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove SN Modal */}
      {removingSNProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-red-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-red-800 uppercase tracking-tighter">Kurangi via SN</h2>
                <p className="text-[10px] text-red-600 font-bold uppercase mt-2">{removingSNProduct.brand} {removingSNProduct.model}</p>
                <p className="text-[10px] text-red-500 font-medium mt-1">Stok saat ini: {removingSNProduct.stock} unit</p>
              </div>
              <button onClick={() => setRemovingSNProduct(null)} className="text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleRemoveSN} className="p-6 lg:p-8 space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Input Nomor Seri (Satu Per Baris)</label>
                <textarea 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-mono focus:ring-4 focus:ring-red-500/10 outline-none h-32 resize-none"
                  value={newSNInput}
                  onChange={(e) => setNewSNInput(e.target.value)}
                  placeholder="Contoh:&#10;ABC123456&#10;ABC123457"
                  required
                />
                <p className="text-[10px] text-slate-400">Hanya SN dengan status "In Stock" dapat dihapus. SN akan ditandai sebagai "Damaged".</p>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</label>
                <input 
                  type="date" 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-red-500/10 outline-none"
                  value={snOperationDate}
                  onChange={(e) => setSNOperationDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Alasan Pengurangan</label>
                <select 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-red-500/10 outline-none appearance-none"
                  value={snOperationReason}
                  onChange={(e) => setSNOperationReason(e.target.value)}
                  required
                >
                  <option value="">Pilih Alasan...</option>
                  <option value="Barang Rusak">Barang Rusak</option>
                  <option value="Barang Hilang">Barang Hilang</option>
                  <option value="Display Unit">Display Unit</option>
                  <option value="Penyesuaian Stok">Penyesuaian Stok</option>
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setRemovingSNProduct(null)} className="flex-1 py-4 lg:py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest">Batal</button>
                <button type="submit" disabled={isProcessingSN} className="flex-1 py-4 lg:py-5 bg-red-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50">
                  {isProcessingSN ? 'Memproses...' : 'Kurangi Stok'}
                </button>
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
              <div className="md:col-span-2">
                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Produk Info</h3>
              </div>
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
              
              <div className="md:col-span-2">
                <div className="border-t border-slate-200 my-4"></div>
                <h3 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4">Stok Info</h3>
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProductHasSN}
                    onChange={(e) => setNewProductHasSN(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Produk ini memiliki Serial Number</span>
                </label>
              </div>
              
              {newProductHasSN ? (
                <div className="md:col-span-2 space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Serial Numbers (Satu Per Baris)</label>
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono font-bold outline-none h-32 resize-none"
                    placeholder="SN-12345&#10;SN-67890&#10;..."
                    value={newSerials}
                    onChange={e => setNewSerials(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 italic">Otomatis menghitung jumlah stok berdasarkan S/N yang diinput.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah Stok</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                    value={newProductQuantity}
                    onChange={e => setNewProductQuantity(Number(e.target.value))}
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                  value={newProductSupplier}
                  onChange={e => setNewProductSupplier(e.target.value)}
                  required
                >
                  <option value="">Pilih Supplier...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                  value={newProductDate}
                  onChange={e => setNewProductDate(e.target.value)}
                  required
                />
              </div>
              
              <div className="md:col-span-2 flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest">Batal</button>
                <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Simpan Aset</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Edit Produk</h2>
              <button onClick={() => { setEditingProduct(null); setEditError(null); }} className="text-slate-400 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!onEditProduct || !editingProduct) return;
              setEditError(null);
              try {
                await onEditProduct(editingProduct.id, editForm);
                setEditingProduct(null);
              } catch (error: any) {
                setEditError(error.message || 'Gagal mengedit produk');
              }
            }} className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {editError && (
                <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm font-bold text-red-800">{editError}</p>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Merk & Model</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Merk" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none" value={editForm.brand || ''} onChange={e => setEditForm({...editForm, brand: e.target.value})} required />
                  <input type="text" placeholder="Model" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none" value={editForm.model || ''} onChange={e => setEditForm({...editForm, model: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori & Kondisi</label>
                <div className="grid grid-cols-2 gap-2">
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none" value={editForm.category || ''} onChange={e => setEditForm({...editForm, category: e.target.value as any})}>
                    <option value="Body">Body</option>
                    <option value="Lens">Lens</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none" value={editForm.condition || ''} onChange={e => setEditForm({...editForm, condition: e.target.value as any})}>
                    <option value="New">Baru</option>
                    <option value="Used">Bekas</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Mount</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none" value={editForm.mount || ''} onChange={e => setEditForm({...editForm, mount: e.target.value as any})}>
                  <option value="">-</option>
                  <option value="E-Mount">E-Mount</option>
                  <option value="A-Mount">A-Mount</option>
                  <option value="Canon EF">Canon EF</option>
                  <option value="Canon RF">Canon RF</option>
                  <option value="Nikon F">Nikon F</option>
                  <option value="Nikon Z">Nikon Z</option>
                  <option value="Micro 4/3">Micro 4/3</option>
                  <option value="Universal">Universal</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Garansi</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Bulan" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none" value={editForm.warrantyMonths || 0} onChange={e => setEditForm({...editForm, warrantyMonths: Number(e.target.value)})} required />
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none" value={editForm.warrantyType || ''} onChange={e => setEditForm({...editForm, warrantyType: e.target.value as any})}>
                    <option value="Official Sony Indonesia">Official Sony</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Toko">Toko</option>
                    <option value="No Warranty">No Warranty</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Jual (Retail)</label>
                <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none" value={editForm.price || 0} onChange={e => setEditForm({...editForm, price: Number(e.target.value)})} required />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Modal (HPP)</label>
                <input type="number" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none" value={editForm.cogs || 0} onChange={e => setEditForm({...editForm, cogs: Number(e.target.value)})} required />
              </div>
              <div className="md:col-span-2 flex gap-4 pt-4">
                <button type="button" onClick={() => { setEditingProduct(null); setEditError(null); }} className="flex-1 py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest">Batal</button>
                <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-md w-full overflow-hidden border border-red-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-black text-red-600 uppercase tracking-tighter">Hapus Produk?</h2>
                  <p className="text-[10px] text-red-400 font-bold uppercase mt-1">Tindakan ini tidak dapat dibatalkan</p>
                </div>
              </div>
              <button onClick={() => { setDeletingProduct(null); setDeleteError(null); }} className="text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 lg:p-8">
              <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Anda akan menghapus:</p>
                <p className="text-lg font-black text-slate-900 uppercase tracking-tighter">{deletingProduct.brand} {deletingProduct.model}</p>
                <p className="text-xs text-slate-500 font-mono mt-1">{deletingProduct.id}</p>
              </div>

              {deleteError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                      <p className="text-sm font-bold text-red-800">{deleteError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={async () => {
                    if (!onDeleteProduct) return;
                    setIsDeleting(true);
                    setDeleteError(null);
                    try {
                      await onDeleteProduct(deletingProduct.id);
                      setDeletingProduct(null);
                    } catch (error: any) {
                      setDeleteError(error.message || 'Gagal menghapus produk');
                    } finally {
                      setIsDeleting(false);
                    }
                  }} 
                  disabled={isDeleting}
                  className="w-full py-4 bg-red-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                      Menghapus...
                    </>
                  ) : (
                    'Hapus Produk'
                  )}
                </button>
              </div>
            </div>
          </div>
          </div>
        )}

      {/* Simple Stock Adjustment Modal */}
      {simpleAdjustProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-md w-full overflow-hidden border border-indigo-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-indigo-100 bg-indigo-50/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-indigo-800 uppercase tracking-tighter">Sesuaikan Stok</h2>
                <p className="text-[10px] text-indigo-600 font-bold uppercase mt-2">{simpleAdjustProduct.brand} {simpleAdjustProduct.model}</p>
                <p className="text-[10px] text-indigo-500 font-medium mt-1">Stok saat ini: {simpleAdjustProduct.stock} unit</p>
              </div>
              <button onClick={() => { setSimpleAdjustProduct(null); setSimpleAdjustAmount(0); setSimpleAdjustReason(''); }} className="text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSimpleAdjust} className="p-6 lg:p-8 space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah Penyesuaian</label>
                <div className="flex items-center gap-4">
                  <button 
                    type="button"
                    onClick={() => setSimpleAdjustAmount(simpleAdjustAmount - 1)}
                    className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 font-black text-xl hover:bg-red-200 flex items-center justify-center"
                  >-</button>
                  <input 
                    type="number" 
                    className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xl font-black text-center outline-none"
                    value={simpleAdjustAmount}
                    onChange={(e) => setSimpleAdjustAmount(Number(e.target.value))}
                    placeholder="0"
                  />
                  <button 
                    type="button"
                    onClick={() => setSimpleAdjustAmount(simpleAdjustAmount + 1)}
                    className="w-12 h-12 rounded-2xl bg-green-100 text-green-600 font-black text-xl hover:bg-green-200 flex items-center justify-center"
                  >+</button>
                </div>
                <p className="text-center text-sm font-bold">
                  Stok baru: <span className="text-indigo-600">{Math.max(0, simpleAdjustProduct.stock + simpleAdjustAmount)}</span> unit
                </p>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Alasan</label>
                <select 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none"
                  value={simpleAdjustReason}
                  onChange={(e) => setSimpleAdjustReason(e.target.value)}
                  required
                >
                  <option value="">Pilih Alasan...</option>
                  <option value="Restok Barang Baru">Restok Barang Baru</option>
                  <option value="Barang Retur Customer">Barang Retur Customer</option>
                  <option value="Penyesuaian Stok">Penyesuaian Stok</option>
                  <option value="Koreksi Error">Koreksi Error</option>
                  <option value="Barang Rusak">Barang Rusak</option>
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => { setSimpleAdjustProduct(null); setSimpleAdjustAmount(0); setSimpleAdjustReason(''); }} className="flex-1 py-4 lg:py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest">Batal</button>
                <button type="submit" className="flex-1 py-4 lg:py-5 bg-indigo-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    );
  };

  export default InventoryView;
