
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
  onManualAdjust: (productId: string, newStock: number, reason: string, supplier?: string, dateRestocked?: string) => void;
  onAddProduct: (product: Product, serials: string[]) => void;
  onEditProduct?: (id: string, data: Partial<Product>) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onRestoreProduct?: (id: string) => Promise<void>;
  onToggleHidden?: (id: string, hidden: boolean) => Promise<void>;
  onRefreshSNs?: () => Promise<void>;
}

const InventoryView: React.FC<InventoryProps> = ({ products, sns, logs, suppliers, setProducts, canViewSensitive, onManualAdjust, onAddProduct, onEditProduct, onDeleteProduct, onRestoreProduct, onToggleHidden, onRefreshSNs }) => {
  const [filter, setFilter] = useState('');
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [newStockVal, setNewStockVal] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  // Calculate stock dynamically from SNs with status "In Stock", or use stored stock for non-SN products
  const getProductStock = (product: Product) => {
    if (product.hasSerialNumber === true) {
      return sns.filter(sn => sn.productId === product.id && sn.status === 'In Stock').length;
    }
    return product.stock;
  };
  
  // Simple stock adjustment
  const [simpleAdjustProduct, setSimpleAdjustProduct] = useState<Product | null>(null);
  const [simpleAdjustAmount, setSimpleAdjustAmount] = useState(0);
  const [simpleAdjustReason, setSimpleAdjustReason] = useState('');
  const [simpleAdjustSupplier, setSimpleAdjustSupplier] = useState('');
  const [simpleAdjustDate, setSimpleAdjustDate] = useState(new Date().toISOString().split('T')[0]);
  
  // SN-based stock operations
  const [addingSNProduct, setAddingSNProduct] = useState<Product | null>(null);
  const [removingSNProduct, setRemovingSNProduct] = useState<Product | null>(null);
  const [newSNInput, setNewSNInput] = useState('');
  const [snOperationReason, setSNOperationReason] = useState('');
  const [snOperationSupplier, setSNOperationSupplier] = useState('');
  const [snOperationDate, setSNOperationDate] = useState(new Date().toISOString().split('T')[0]);
  const [isProcessingSN, setIsProcessingSN] = useState(false);
  const [selectedSNs, setSelectedSNs] = useState<string[]>([]);

  // New Product State
  const [newP, setNewP] = useState<Partial<Product>>({
    brand: '', model: '', category: 'Body', condition: 'New', price: 0, cogs: 0, warrantyMonths: 12, warrantyType: 'Official Sony Indonesia', taxEnabled: true
  });
  const [newSerials, setNewSerials] = useState('');
  const [newProductHasSN, setNewProductHasSN] = useState(false);
  const [newProductQuantity, setNewProductQuantity] = useState(1);
  const [newProductSupplier, setNewProductSupplier] = useState('');
  const [newProductDate, setNewProductDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredProducts = products.filter(p => 
    p.model.toLowerCase().includes(filter.toLowerCase()) || 
    p.brand.toLowerCase().includes(filter.toLowerCase()) ||
    p.id.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || !adjustReason) return;
    onManualAdjust(adjustingProduct.id, newStockVal, adjustReason);
    setAdjustingProduct(null);
    setAdjustReason('');
  };

  const handleSimpleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simpleAdjustProduct || simpleAdjustAmount === 0 || !simpleAdjustReason) return;
    const currentStock = getProductStock(simpleAdjustProduct);
    const newStock = currentStock + simpleAdjustAmount;
    if (newStock < 0) {
      alert('Stok tidak bisa negatif!');
      return;
    }
    
    // For products with serial numbers, use onRefreshSNs
    // For products without serial numbers, use onManualAdjust
    if (simpleAdjustProduct.hasSerialNumber === true && onRefreshSNs) {
      await onRefreshSNs();
    } else {
      onManualAdjust(simpleAdjustProduct.id, newStock, simpleAdjustReason, simpleAdjustSupplier || undefined, simpleAdjustDate || undefined);
    }
    
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
      // Add serial numbers to database with supplier, date, and reason
      const { addSerialNumbers } = await import('../../app/services/product.service');
      await addSerialNumbers(
        snList.map(sn => ({ sn, productId: addingSNProduct.id })),
        snOperationSupplier,
        snOperationDate,
        snOperationReason
      );
      
      alert(`${snList.length} nomor seri berhasil ditambahkan ke ${addingSNProduct.model}.`);
      
      // Refresh SNs and recalculate stock
      if (onRefreshSNs) {
        await onRefreshSNs();
      }
      
      setAddingSNProduct(null);
      setNewSNInput('');
      setSNOperationReason('');
      setSNOperationSupplier('');
    } catch (error) {
      console.error('Failed to add serial numbers:', error);
      alert('Gagal menambahkan nomor seri.');
    } finally {
      setIsProcessingSN(false);
    }
  };

  const handleRemoveSN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removingSNProduct || selectedSNs.length === 0 || !snOperationReason) return;

    console.log('=== DEBUG: handleRemoveSN ===');
    console.log('removingSNProduct:', removingSNProduct);
    console.log('selectedSNs:', selectedSNs);
    console.log('sns prop sample:', sns.slice(0, 3));

    // Verify SN belongs to this product
    const productSNs = sns.filter(sn => sn.productId === removingSNProduct.id && sn.status === 'In Stock');
    console.log('productSNs (In Stock):', productSNs);
    
    const validSNs = selectedSNs.filter(sn => productSNs.some(psn => psn.sn === sn));
    const invalidSNs = selectedSNs.filter(sn => !productSNs.some(psn => psn.sn === sn));

    console.log('validSNs:', validSNs);
    console.log('invalidSNs:', invalidSNs);

    if (invalidSNs.length > 0) {
      alert(`Nomor seri berikut bukan dari produk ini atau sudah terjual: ${invalidSNs.join(', ')}`);
      return;
    }

    setIsProcessingSN(true);
    try {
      // Update SN status to Damaged with reason
      const { updateSerialNumberStatus } = await import('../../app/services/product.service');
      for (const sn of validSNs) {
        await updateSerialNumberStatus(sn, 'Damaged', snOperationReason);
      }
      
      alert(`${validSNs.length} nomor seri berhasil ditandai sebagai rusak/hilang dari ${removingSNProduct.model}.`);
      
      // Refresh SNs and recalculate stock
      if (onRefreshSNs) {
        await onRefreshSNs();
      }
      
      setRemovingSNProduct(null);
      setSelectedSNs([]);
      setSNOperationReason('');
    } catch (error) {
      console.error('Failed to remove serial numbers:', error);
      alert('Gagal menghapus nomor seri.');
    } finally {
      setIsProcessingSN(false);
    }
  };

  const toggleSNSelection = (sn: string) => {
    setSelectedSNs(prev => 
      prev.includes(sn) 
        ? prev.filter(s => s !== sn)
        : [...prev, sn]
    );
  };

  const handleQuickSelectAll = (availableSNs: string[]) => {
    if (selectedSNs.length === availableSNs.length) {
      setSelectedSNs([]);
    } else {
      setSelectedSNs(availableSNs);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProductSupplier) {
      alert('Supplier harus dipilih!');
      return;
    }
    
    const serialList = newSerials.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    
    if (newProductHasSN && serialList.length === 0) {
      alert('Produk dengan Serial Number harus memiliki minimal 1 nomor seri.');
      return;
    }
    
    if (!newProductHasSN && newProductQuantity <= 0) {
      alert('Jumlah stok harus lebih dari 0.');
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
      stock: newProductHasSN ? serialList.length : newProductQuantity,
      hasSerialNumber: newProductHasSN,
      supplier: newProductSupplier,
      dateRestocked: new Date(newProductDate).toISOString(),
    };
    
    // Include serialNumbers in the product for API
    const productWithSerials = {
      ...p,
      serialNumbers: newProductHasSN ? serialList : undefined,
      quantity: newProductHasSN ? undefined : newProductQuantity,
    };
    
    onAddProduct(productWithSerials, newProductHasSN ? serialList : []);
    setShowAddModal(false);
    setNewP({ brand: '', model: '', category: 'Body', condition: 'New', price: 0, cogs: 0, warrantyMonths: 12, warrantyType: 'Official Sony Indonesia' });
    setNewSerials('');
    setNewProductHasSN(false);
    setNewProductQuantity(1);
    setNewProductSupplier('');
    setNewProductDate(new Date().toISOString().split('T')[0]);
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
              placeholder="Ketik Merk / Model..."
              className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder-slate-500 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold shadow-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <svg className="w-6 h-6 absolute left-5 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-6 py-6 text-center">#</th>
                <th className="px-8 py-6">Produk</th>
                <th className="px-8 py-6">Status Stok</th>
                <th className="px-8 py-6 text-right">Retail Price</th>
                {canViewSensitive && <th className="px-8 py-6 text-right text-indigo-400">Capital Price (HPP)</th>}
                <th className="px-8 py-6">Supplier</th>
                <th className="px-8 py-6 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {filteredProducts.map((p, index) => (
                <tr key={p.id} className={`transition-colors group ${p.hidden ? 'opacity-50 bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                  <td className="px-6 py-6 text-center">
                    <span className="font-black text-slate-400 text-xs">{index + 1}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      {p.hidden === 1 && (
                        <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest w-fit mb-1">Hidden</span>
                      )}
                      <span className="font-black text-slate-900 text-sm uppercase tracking-tighter">{p.brand} {p.model}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{p.category} • {p.condition} • {p.warrantyMonths / 12} Thn Garansi</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    {(() => {
                      const currentStock = getProductStock(p);
                      return (
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${currentStock <= 2 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'}`}></div>
                      <span className={`font-black text-xs uppercase tracking-widest ${currentStock <= 2 ? 'text-red-600' : 'text-slate-900'}`}>{currentStock} Unit</span>
                    </div>
                    );
                    })()}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase mt-1 ${p.hasSerialNumber === true ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.hasSerialNumber === true ? 'SN' : 'Non-SN'}
                    </span>
                    {console.log('[DEBUG] Rendering product:', p.model, 'taxEnabled:', p.taxEnabled) || null}
              {p.taxEnabled && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase mt-1 ml-1 bg-amber-100 text-amber-700">
                        PPN
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 tracking-tighter">{formatIDR(p.price)}</td>
                  {canViewSensitive && <td className="px-8 py-6 text-right font-bold text-indigo-600 tracking-tighter tabular-nums">{formatIDR(p.cogs)}</td>}
                  <td className="px-8 py-6">
                    <span className="text-xs font-medium text-slate-600">{p.supplier || '-'}</span>
                    <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                      {p.dateRestocked ? new Date(p.dateRestocked).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
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
                              warrantyType: p.warrantyType,
                              taxEnabled: p.taxEnabled
                            });
                            setEditError(null);
                          }}
                          className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg text-xs font-bold transition-all"
                          title="Edit Produk"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      )}
                      {p.hasSerialNumber === true ? (
                        <>
                          <button 
                            onClick={() => { setAddingSNProduct(p); setNewSNInput(''); setSNOperationReason(''); setSNOperationSupplier(p.supplier || ''); }}
                            className="text-green-600 hover:bg-green-50 p-2 rounded-lg text-xs font-bold transition-all"
                            title="Tambah Stok (Input SN)"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                          </button>
                          <button 
                            onClick={() => { setRemovingSNProduct(p); setNewSNInput(''); setSNOperationReason(''); setSelectedSNs([]); }}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg text-xs font-bold transition-all"
                            title="Kurangi Stok (Pilih SN)"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => { setSimpleAdjustProduct(p); setSimpleAdjustAmount(0); setSimpleAdjustReason(''); setSimpleAdjustSupplier(p.supplier || ''); setSimpleAdjustDate(new Date().toISOString().split('T')[0]); }}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg text-xs font-bold transition-all"
                          title="Sesuaikan Stok (+/-)"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                      )}
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
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-green-50/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-green-800 uppercase tracking-tighter">Tambah via SN</h2>
                <p className="text-[10px] text-green-600 font-bold uppercase mt-2">{addingSNProduct.brand} {addingSNProduct.model}</p>
                <p className="text-[10px] text-green-500 font-medium mt-1">Stok saat ini: {getProductStock(addingSNProduct)} unit</p>
              </div>
              <button onClick={() => setAddingSNProduct(null)} className="text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddSN} className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Input Nomor Seri (Satu Per Baris)</label>
                <textarea 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-mono focus:ring-4 focus:ring-green-500/10 outline-none h-32 resize-none"
                  value={newSNInput}
                  onChange={(e) => setNewSNInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const scannedSN = newSNInput.trim();
                      if (scannedSN) {
                        setNewSNInput(prev => prev + (prev ? '\n' : '') + scannedSN);
                      }
                    }
                  }}
                  placeholder="Contoh:&#10;ABC123456&#10;ABC123457&#10;ABC123458"
                  required
                />
                <p className="text-[10px] text-slate-400">Masukkan 1 SN per baris. Setiap SN akan menambah 1 unit stok. Tekan Enter untuk tambah SN cepat.</p>
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
              <div className="flex gap-4 pt-4 shrink-0">
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
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-red-50/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-red-800 uppercase tracking-tighter">Kurangi via SN</h2>
                <p className="text-[10px] text-red-600 font-bold uppercase mt-2">{removingSNProduct.brand} {removingSNProduct.model}</p>
                <p className="text-[10px] text-red-500 font-medium mt-1">Stok saat ini: {getProductStock(removingSNProduct)} unit</p>
              </div>
              <button onClick={() => { setRemovingSNProduct(null); setSelectedSNs([]); }} className="text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleRemoveSN} className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Nomor Seri untuk Dihapus</label>
                <div className="border border-slate-200 rounded-2xl max-h-48 overflow-y-auto custom-scrollbar">
                  {sns.filter(sn => sn.productId === removingSNProduct.id && sn.status === 'In Stock').length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-sm">Tidak ada stok tersedia</div>
                  ) : (
                    sns.filter(sn => sn.productId === removingSNProduct.id && sn.status === 'In Stock').map(sn => (
                      <label key={sn.sn} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0">
                        <input
                          type="checkbox"
                          checked={selectedSNs.includes(sn.sn)}
                          onChange={() => {
                            setSelectedSNs(prev => 
                              prev.includes(sn.sn) 
                                ? prev.filter(s => s !== sn.sn)
                                : [...prev, sn.sn]
                            );
                          }}
                          className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm font-mono font-bold text-slate-700">{sn.sn}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Pilih SN yang ingin ditandai sebagai rusak/hilang. Setiap SN akan mengurangi 1 unit stok.</p>
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
                  <option value="Penyesuaian Stok">Penyesuaian Stok</option>
                  <option value="Koreksi Error">Koreksi Error</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4 shrink-0">
                <button type="button" onClick={() => { setRemovingSNProduct(null); setSelectedSNs([]); }} className="flex-1 py-4 lg:py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest">Batal</button>
                <button type="submit" disabled={isProcessingSN || selectedSNs.length === 0} className="flex-1 py-4 lg:py-5 bg-red-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50">
                  {isProcessingSN ? 'Memproses...' : 'Kurangi Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Penerimaan Barang Baru</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Garansi</label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number" 
                    placeholder="Bulan" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none" 
                    value={newP.warrantyMonths || 12} 
                    onChange={e => setNewP({...newP, warrantyMonths: Number(e.target.value)})}
                  />
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none" 
                    value={newP.warrantyType || 'Distributor'} 
                    onChange={e => setNewP({...newP, warrantyType: e.target.value as any})}
                  >
                    <option value="Distributor">Distributor</option>
                    <option value="Store Warranty">Toko</option>
                    <option value="No Warranty">No Warranty</option>
                  </select>
                </div>
              </div>
              <div className='space-y-4'>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">PPN</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newP.taxEnabled === true}
                    onChange={(e) => setNewP({...newP, taxEnabled: e.target.checked === true})}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Produk ini dikenakan PPN</span>
                </label>
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
                    checked={newProductHasSN === true}
                    onChange={(e) => setNewProductHasSN(e.target.checked === true)}
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
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Edit Produk</h2>
              <button onClick={() => { setEditingProduct(null); setEditError(null); }} className="text-slate-400 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              console.log('[DEBUG] Form onSubmit triggered');
              if (!onEditProduct || !editingProduct) {
                console.log('[DEBUG] onEditProduct or editingProduct is missing');
                return;
              }
              setEditError(null);
              console.log('[DEBUG] Edit form submit, editForm:', JSON.stringify(editForm));
              try {
                console.log('[DEBUG] Calling onEditProduct with id:', editingProduct.id);
                await onEditProduct(editingProduct.id, editForm);
                console.log('[DEBUG] onEditProduct completed successfully');
                setEditingProduct(null);
              } catch (error: any) {
                console.log('[DEBUG] onEditProduct error:', error);
                setEditError(error.message || 'Gagal mengedit produk');
              }
            }} className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {/* <div className="space-y-4">
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
              </div> */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Garansi</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Bulan" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none" value={editForm.warrantyMonths || 0} onChange={e => setEditForm({...editForm, warrantyMonths: Number(e.target.value)})} required />
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none" value={editForm.warrantyType || ''} onChange={e => setEditForm({...editForm, warrantyType: e.target.value as any})}>
                    <option value="Distributor">Distributor</option>
                    <option value="Toko">Toko</option>
                    <option value="No Warranty">No Warranty</option>
                  </select>
                </div>
              </div>
              <div className='space-y-4'>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">PPN</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.taxEnabled === true}
                    onChange={(e) => {
                      console.log('[DEBUG] Checkbox onChange, checked:', e.target.checked);
                      setEditForm({...editForm, taxEnabled: e.target.checked === true});
                    }}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Produk ini dikenakan PPN</span>
                </label>
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
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-indigo-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-indigo-100 bg-indigo-50/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-indigo-800 uppercase tracking-tighter">Sesuaikan Stok</h2>
                <p className="text-[10px] text-indigo-600 font-bold uppercase mt-2">{simpleAdjustProduct.brand} {simpleAdjustProduct.model}</p>
                <p className="text-[10px] text-indigo-500 font-medium mt-1">Stok saat ini: {getProductStock(simpleAdjustProduct)} unit</p>
              </div>
              <button onClick={() => { setSimpleAdjustProduct(null); setSimpleAdjustAmount(0); setSimpleAdjustReason(''); setSimpleAdjustSupplier(''); setSimpleAdjustDate(new Date().toISOString().split('T')[0]); }} className="text-slate-300 hover:text-slate-900 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSimpleAdjust} className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah Penyesuaian</label>
                <div className="flex items-center justify-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setSimpleAdjustAmount(simpleAdjustAmount - 1)}
                    className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 font-black text-xl hover:bg-red-200 flex items-center justify-center"
                  >-</button>
                  <input 
                    type="number" 
                    className="w-24 px-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xl font-black text-center outline-none"
                    value={simpleAdjustAmount}
                    onChange={(e) => setSimpleAdjustAmount(Number(e.target.value))}
                    placeholder="0"
                  />
                  <button 
                    type="button"
                    onClick={() => setSimpleAdjustAmount(simpleAdjustAmount + 1)}
                    className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 font-black text-xl hover:bg-green-200 flex items-center justify-center"
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
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</label>
                <select 
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none"
                  value={simpleAdjustSupplier}
                  onChange={(e) => setSimpleAdjustSupplier(e.target.value)}
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
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  value={simpleAdjustDate}
                  onChange={(e) => setSimpleAdjustDate(e.target.value)}
                />
              </div>
              <div className="flex gap-4 pt-6 shrink-0">
                <button type="button" onClick={() => { setSimpleAdjustProduct(null); setSimpleAdjustAmount(0); setSimpleAdjustReason(''); setSimpleAdjustSupplier(''); setSimpleAdjustDate(new Date().toISOString().split('T')[0]); }} className="flex-1 py-4 lg:py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest">Batal</button>
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
