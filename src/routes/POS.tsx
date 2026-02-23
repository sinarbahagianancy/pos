
import React, { useState, useMemo } from 'react';
import { Product, SerialNumber, Customer, Sale, PaymentMethod, SaleItem, StoreConfig } from '../../app/types';
import { formatIDR, calculateWarrantyExpiry, formatDate } from '../../app/utils/formatters';

interface POSProps {
  products: Product[];
  sns: SerialNumber[];
  customers: Customer[];
  onCompleteSale: (sale: Sale) => void;
  staffName: string;
  taxRate: number;
  storeConfig: StoreConfig;
}

const POSView: React.FC<POSProps> = ({ products, sns, customers, onCompleteSale, staffName, taxRate, storeConfig }) => {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const availableSNs = useMemo(() => {
    return sns.filter(sn => sn.status === 'In Stock' && !cart.some(c => c.sn === sn.sn));
  }, [sns, cart]);

  const filteredSNs = useMemo(() => {
    if (!search) return [];
    const query = search.toLowerCase();
    return availableSNs.filter(sn => {
      const product = products.find(p => p.id === sn.productId);
      return sn.sn.toLowerCase().includes(query) || 
             product?.model.toLowerCase().includes(query) || 
             product?.id.toLowerCase().includes(query);
    });
  }, [availableSNs, search, products]);

  const addToCart = (sn: SerialNumber) => {
    const product = products.find(p => p.id === sn.productId);
    if (!product) return;
    setCart([...cart, {
      productId: product.id,
      model: product.model,
      sn: sn.sn,
      price: product.price,
      cogs: product.cogs,
      warrantyExpiry: calculateWarrantyExpiry(product.warrantyMonths)
    }]);
    setSearch('');
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const customer = customers.find(c => c.id === selectedCustomerId) || customers[0];
    const sale: Sale = {
      id: `INV-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      items: cart,
      subtotal, tax, total,
      paymentMethod,
      staffName,
      timestamp: new Date().toISOString()
    };
    onCompleteSale(sale);
    setLastSale(sale);
    setShowInvoice(true);
    setCart([]);
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 h-full pb-32 lg:pb-4 max-w-full mx-auto relative">
      <style>
        {`
          @media print {
            @page {
              size: A5 landscape;
              margin: 5mm;
            }
            body {
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
            #invoice-print-container {
              display: flex !important;
              flex-direction: column !important;
              position: static !important;
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: none !important;
              height: auto !important;
              overflow: visible !important;
            }
            .print-grid {
              display: grid !important;
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }
        `}
      </style>
      
      {/* Search & Cart Left Panel */}
      <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col space-y-6 no-print">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Barcode Scan / Serial Tracking</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Scan Barcode atau ketik S/N Unit..."
              className="w-full px-6 py-4 pl-14 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold"
              value={search}
              autoFocus
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg className="w-6 h-6 absolute left-5 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          
          {search && (
            <div className="mt-4 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xl max-h-64 overflow-y-auto bg-white z-20">
              {filteredSNs.length > 0 ? filteredSNs.map(sn => {
                const product = products.find(p => p.id === sn.productId)!;
                return (
                  <button 
                    key={sn.sn}
                    onClick={() => addToCart(sn)}
                    className="w-full p-4 flex items-center justify-between hover:bg-indigo-50 text-left transition-colors group"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-black text-indigo-500 uppercase">{product.brand}</span>
                        <p className="font-bold text-slate-900 truncate text-sm">{product.model}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-tighter">Barcode ID: {product.id} • S/N: <span className="font-bold text-slate-700">{sn.sn}</span></p>
                    </div>
                    <p className="text-indigo-600 font-black text-sm">{formatIDR(product.price)}</p>
                  </button>
                );
              }) : (
                <div className="p-10 text-center text-slate-400 font-medium italic">Data tidak ditemukan di inventori aktif.</div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 bg-white p-6 lg:p-8 rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-black text-slate-900 uppercase tracking-tighter flex items-center space-x-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              <span>Current Cart</span>
            </h2>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{cart.length} Unit(s)</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {cart.length > 0 ? cart.map((item, idx) => (
              <div key={idx} className="p-4 bg-white rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 font-black border border-slate-100 shrink-0 text-xs">
                    {item.model.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 truncate tracking-tight uppercase">{item.model}</h3>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">S/N: <span className="font-mono text-indigo-600">{item.sn}</span></p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <p className="font-black text-slate-900 text-sm tracking-tighter">{formatIDR(item.price)}</p>
                  <button onClick={() => removeFromCart(idx)} className="text-slate-300 hover:text-red-500 transition-all active:scale-90 p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-6 opacity-30">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                <p className="text-[10px] font-black uppercase tracking-widest">Register Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Summary Right Panel */}
      <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-6 no-print">
        <div className="bg-slate-900 p-8 lg:p-10 rounded-[48px] border border-slate-800 shadow-2xl flex flex-col space-y-10 text-white relative overflow-hidden h-full">
          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Customer</label>
            <select 
              className="w-full px-6 py-4 rounded-2xl border border-slate-800 bg-slate-800 text-white focus:ring-4 focus:ring-indigo-500/20 outline-none text-sm font-bold transition-all cursor-pointer"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              {customers.map(c => <option key={c.id} value={c.id} className="text-slate-900 bg-white">{c.name}</option>)}
            </select>
            {selectedCustomer && (
              <div className="text-[10px] text-slate-400 px-2 font-medium italic">
                {selectedCustomer.address || 'No Address Listed'}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Settlement Method</label>
            <div className="grid grid-cols-2 gap-3">
              {(['Cash', 'Debit', 'QRIS', 'Credit'] as PaymentMethod[]).map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${
                    paymentMethod === method 
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-500/30 scale-[1.02]' 
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {method === 'Credit' ? 'Org Utang (Bon)' : method}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-4 pt-8 border-t border-slate-800">
            <div className="flex justify-between text-xs text-slate-500 font-bold">
              <span>Subtotal</span>
              <span className="tabular-nums text-slate-300">{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-bold">
              <span>Gov Tax ({(taxRate * 100).toFixed(0)}% PPN)</span>
              <span className="tabular-nums text-slate-300">{formatIDR(tax)}</span>
            </div>
            <div className="flex justify-between items-end pt-6">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Final Amount</p>
                <p className="text-3xl font-black tracking-tighter tabular-nums leading-none">{formatIDR(total)}</p>
              </div>
            </div>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className={`w-full py-6 rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
              cart.length === 0 
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                : 'bg-white text-slate-900 hover:bg-slate-50 shadow-white/5'
            }`}
          >
            Selesaikan Transaksi
          </button>
        </div>
      </div>

      {/* A5 Invoice Print Overlay */}
      {showInvoice && lastSale && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 overflow-y-auto no-print">
          <div id="invoice-print-container" className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-2xl w-full my-auto overflow-hidden border border-slate-100 flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Logo Sinar & Header */}
            <div className="p-6 lg:p-8 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 gap-4">
               <div className="flex items-center space-x-4">
                 <div className="w-12 h-12 lg:w-14 lg:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                   {/* Logo Sinar Icon */}
                   <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </div>
                 <div>
                   <h1 className="text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{storeConfig.storeName}</h1>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Premium Imaging Solution</p>
                   <p className="text-[9px] text-slate-400 mt-0.5">{storeConfig.address}</p>
                 </div>
               </div>
               <div className="text-left sm:text-right w-full sm:w-auto">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faktur Penjualan</p>
                 <p className="text-lg font-black text-slate-900 mt-1">{lastSale.id}</p>
                 <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">{formatDate(lastSale.timestamp)}</p>
               </div>
            </div>

            {/* Fields: Nama, Phone, NPWP, and Alamat */}
            <div className="px-6 lg:px-8 py-6 bg-slate-50/50 flex flex-col sm:grid sm:grid-cols-2 gap-6 lg:gap-8 border-b border-slate-100 print-grid">
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bill To / Penerima</p>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{lastSale.customerName}</p>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1">{selectedCustomer?.address || '-'}</p>
                  <p className="text-[11px] text-slate-500 font-bold mt-2">Telp: {selectedCustomer?.phone || '-'}</p>
                </div>
              </div>
              <div className="text-left sm:text-right space-y-4">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tax Registration</p>
                  {selectedCustomer?.npwp ? (
                    <p className="text-xs font-mono font-black text-slate-900">{selectedCustomer.npwp}</p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No NPWP Provided</p>
                  )}
                  <div className="mt-4">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Method</p>
                     <span className="inline-block px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase text-indigo-600 shadow-sm">{lastSale.paymentMethod === 'Credit' ? 'ORG UTANG (BON)' : lastSale.paymentMethod}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Line Items & Warranties */}
            <div className="p-6 lg:p-8 py-6 flex-1 min-h-[160px] overflow-x-auto">
              <table className="w-full text-xs min-w-[300px]">
                <thead>
                  <tr className="text-[9px] text-slate-400 uppercase font-black tracking-widest border-b border-slate-200">
                    <th className="text-left py-3">Description / Serial Number</th>
                    <th className="text-center py-3">Warranty</th>
                    <th className="text-right py-3">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
                  {lastSale.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-4 pr-4">
                        <p className="font-black text-sm uppercase tracking-tighter">{item.model}</p>
                        <p className="font-mono text-[10px] text-indigo-500 mt-1 uppercase tracking-tight">S/N: {item.sn}</p>
                      </td>
                      <td className="py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                           <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black uppercase tracking-tighter whitespace-nowrap">Valid Until:</span>
                           <span className="text-[10px] font-bold text-slate-900 mt-1">{item.warrantyExpiry}</span>
                        </div>
                      </td>
                      <td className="py-4 text-right tabular-nums font-black text-sm">
                        {formatIDR(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Footer */}
            <div className="px-6 lg:px-8 py-8 pt-0 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-10">
              <div className="flex-1 w-full sm:w-auto">
                 {/* Barcode representation */}
                 <div className="flex space-x-0.5 items-end mb-1 opacity-50">
                   {[...Array(30)].map((_, i) => (
                     <div key={i} className={`bg-slate-900 w-0.5 h-${i % 3 === 0 ? '6' : i % 2 === 0 ? '4' : '3'}`}></div>
                   ))}
                 </div>
                 <p className="text-[8px] font-mono text-slate-400 uppercase">Verification Auth: {lastSale.id.split('-')[1]}</p>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-4 italic max-w-xs">Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</p>
              </div>
              <div className="w-full sm:w-64 space-y-3">
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span className="tabular-nums font-bold text-slate-900">{formatIDR(lastSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Tax ({(taxRate * 100).toFixed(0)}% PPN)</span>
                  <span className="tabular-nums font-bold text-slate-900">{formatIDR(lastSale.tax)}</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-slate-200">
                  <span className="text-sm font-black text-slate-900 uppercase">Grand Total</span>
                  <span className="text-2xl font-black tabular-nums text-slate-900 leading-none">{formatIDR(lastSale.total)}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900 flex flex-col sm:flex-row gap-4 no-print shrink-0">
              <button onClick={() => setShowInvoice(false)} className="flex-1 py-4 bg-slate-800 text-slate-300 font-black rounded-3xl text-[10px] uppercase tracking-widest hover:text-white transition-all order-2 sm:order-1">Close</button>
              <button onClick={() => window.print()} className="flex-1 py-4 bg-white text-slate-900 font-black rounded-3xl text-[10px] uppercase tracking-widest hover:bg-slate-100 shadow-xl shadow-white/5 transition-all active:scale-95 order-1 sm:order-2">Print Invoice (A5)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSView;
