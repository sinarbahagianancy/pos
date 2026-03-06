
import React, { useState, useMemo, useRef } from 'react';
import { Product, SerialNumber, Customer, Sale, PaymentMethod, SaleItem, StoreConfig } from '../../app/types';
import { formatIDR, calculateWarrantyExpiry, formatDate } from '../../app/utils/formatters';
import { generateInvoicePdf } from '../../app/services/product.service';

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
  const [isPrinting, setIsPrinting] = useState(false);
  const [printModalHtml, setPrintModalHtml] = useState('');
  const [printPdfUrl, setPrintPdfUrl] = useState<string | null>(null);

  // Filter out hidden products
  const visibleProducts = useMemo(() => {
    return products.filter(p => !p.hidden);
  }, [products]);

  // Filter out hidden products' serial numbers
  const visibleProductIds = useMemo(() => {
    return new Set(visibleProducts.map(p => p.id));
  }, [visibleProducts]);

  const availableSNs = useMemo(() => {
    return sns.filter(sn => 
      sn.status === 'In Stock' && 
      !cart.some(c => c.sn === sn.sn) &&
      visibleProductIds.has(sn.productId)
    );
  }, [sns, cart, visibleProductIds]);

  const fuzzyMatch = (text: string, query: string): boolean => {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    if (textLower.includes(queryLower)) return true;
    let queryIndex = 0;
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === queryLower.length;
  };

  const filteredResults = useMemo(() => {
    if (!search || search.length < 2) return { products: [], serialNumbers: [] };
    const query = search.toLowerCase();

    const matchedProducts = visibleProducts.filter(p => {
      return fuzzyMatch(p.id, query) || fuzzyMatch(p.model, query) || fuzzyMatch(p.brand, query);
    });

    const matchedSNs = availableSNs.filter(sn => {
      if (!sn.productId) return fuzzyMatch(sn.sn, query);
      const product = visibleProducts.find(p => p.id === sn.productId);
      if (!product) return fuzzyMatch(sn.sn, query);
      return fuzzyMatch(sn.sn, query);
    });

    return { products: matchedProducts, serialNumbers: matchedSNs };
  }, [search, visibleProducts, availableSNs]);

  const addToCartByProduct = (product: Product) => {
    const availableSN = availableSNs.find(sn => sn.productId === product.id);
    let snToUse: string;
    
    if (availableSN) {
      snToUse = availableSN.sn;
    } else {
      // Generate placeholder SN for products without serial numbers (e.g., from manual stock audit)
      snToUse = `NOSN-${product.id.substring(0, 8)}-${Date.now()}`;
    }
    
    const warrantyMonths = product.warrantyMonths ?? 0;
    
    setCart([...cart, {
      productId: product.id,
      model: product.model,
      sn: snToUse,
      price: product.price,
      cogs: product.cogs,
      warrantyExpiry: calculateWarrantyExpiry(warrantyMonths)
    }]);
    setSearch('');
  };

  const addToCart = (sn: SerialNumber) => {
    const product = products.find(p => p.id === sn.productId);
    if (!product) return;
    const warrantyMonths = product.warrantyMonths ?? 0;
    setCart([...cart, {
      productId: product.id,
      model: product.model,
      sn: sn.sn,
      price: product.price,
      cogs: product.cogs,
      warrantyExpiry: calculateWarrantyExpiry(warrantyMonths)
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
          
          {search && search.length >= 2 && (
            <div className="mt-4 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xl max-h-96 overflow-y-auto bg-white z-20">
              {filteredResults.products.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Products ({filteredResults.products.length})
                  </div>
                  {filteredResults.products.slice(0, 10).map(product => {
                    const availableCount = availableSNs.filter(sn => sn.productId === product.id).length;
                    const hasNoSN = product.stock > 0 && availableCount === 0;
                    const isOutOfStock = product.stock === 0;
                    return (
                      <button 
                        key={product.id}
                        onClick={() => addToCartByProduct(product)}
                        disabled={isOutOfStock}
                        className={`w-full p-4 flex items-center justify-between text-left transition-colors group ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-indigo-50'}`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-indigo-500 uppercase">{product.brand}</span>
                            <p className="font-bold text-slate-900 truncate text-sm">{product.model}</p>
                            {hasNoSN && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded">NO SN</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-tighter">ID: {product.id} • <span className={isOutOfStock ? "text-red-500" : hasNoSN ? "text-amber-600" : "text-green-600"} font-bold>{isOutOfStock ? 'OUT OF STOCK' : hasNoSN ? `${product.stock} unit (tanpa SN)` : `${availableCount} available`}</span></p>
                        </div>
                        <p className="text-indigo-600 font-black text-sm">{formatIDR(product.price)}</p>
                      </button>
                    );
                  })}
                </>
              )}
              
              {filteredResults.serialNumbers.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Serial Numbers ({filteredResults.serialNumbers.length})
                  </div>
                  {filteredResults.serialNumbers.slice(0, 10).map(sn => {
                    const product = products.find(p => p.id === sn.productId);
                    if (!product) return null;
                    const inCart = cart.some(c => c.sn === sn.sn);
                    return (
                      <button 
                        key={sn.sn}
                        onClick={() => !inCart && addToCart(sn)}
                        disabled={inCart}
                        className={`w-full p-4 flex items-center justify-between text-left transition-colors group ${inCart ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-indigo-50'}`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-indigo-500 uppercase">{product.brand}</span>
                            <p className="font-bold text-slate-900 truncate text-sm">{product.model}</p>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-tighter">Barcode ID: {product.id} • S/N: <span className="font-bold text-slate-700">{sn.sn}</span>{inCart && <span className="text-amber-500 ml-1">(DI KERANJANG)</span>}</p>
                        </div>
                        <p className="text-indigo-600 font-black text-sm">{formatIDR(product.price)}</p>
                      </button>
                    );
                  })}
                </>
              )}
              
              {filteredResults.products.length === 0 && filteredResults.serialNumbers.length === 0 && (
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
              <button 
                onClick={async () => {
                  if (!lastSale) return;
                  setIsPrinting(true);
                  try {
                    const customer = customers.find(c => c.id === lastSale.customerId) || customers[0];
                    const taxRatePercent = (taxRate * 100).toFixed(0);
                    
                    const itemsHtml = lastSale.items.map(item => `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                          <div style="font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: -0.02em;">${item.model}</div>
                          <div style="font-family: monospace; font-size: 10px; color: #6366f1; margin-top: 4px; text-transform: uppercase;">S/N: ${item.sn}</div>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: center;">
                          <div style="display: inline-flex; flex-direction: column; align-items: center;">
                            <span style="padding: 2px 6px; background: #f8fafc; border-radius: 4px; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em;">Valid Until:</span>
                            <span style="font-size: 10px; font-weight: 700; color: #0f172a; margin-top: 4px;">${item.warrantyExpiry}</span>
                          </div>
                        </td>
                        <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 800; font-size: 14px;">
                          ${formatIDR(item.price)}
                        </td>
                      </tr>
                    `).join('');

                    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${lastSale.id}</title>
  <style>
    @page { size: A5; margin: 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      color: #0f172a; 
      font-size: 12px;
      line-height: 1.5;
      width: 148mm;
      min-height: 210mm;
      padding: 10mm;
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      padding-bottom: 16px; 
      border-bottom: 1px solid #f1f5f9; 
      margin-bottom: 16px;
    }
    .logo-section { display: flex; align-items: center; gap: 12px; }
    .logo { 
      width: 48px; height: 48px; 
      background: #4f46e5; border-radius: 12px; 
      display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .store-name { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.03em; }
    .store-tagline { font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
    .store-address { font-size: 9px; color: #94a3b8; margin-top: 2px; }
    .invoice-info { text-align: right; }
    .invoice-label { font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
    .invoice-id { font-size: 16px; font-weight: 900; margin-top: 2px; }
    .invoice-date { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }
    
    .customer-section { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 24px; 
      padding: 16px; 
      background: #f8fafc; 
      border-radius: 12px; 
      margin-bottom: 16px; 
    }
    .section-label { font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
    .customer-name { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; }
    .customer-detail { font-size: 11px; color: #475569; margin-top: 2px; }
    .customer-npwp { font-family: monospace; font-size: 11px; font-weight: 800; }
    .no-npwp { font-style: italic; color: #94a3b8; }
    .payment-badge { 
      display: inline-block; padding: 4px 10px; 
      background: white; border: 1px solid #e2e8f0; border-radius: 6px; 
      font-size: 10px; font-weight: 800; text-transform: uppercase; 
      color: #4f46e5; 
    }
    
    table { width: 100%; border-collapse: collapse; }
    th { 
      font-size: 8px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; 
      padding: 8px 0; border-bottom: 2px solid #1e293b; text-align: left; 
    }
    th:nth-child(2) { text-align: center; }
    th:nth-child(3) { text-align: right; }
    
    .totals-section { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      margin-top: 24px; 
      padding-top: 16px; 
    }
    .footer-section { flex: 1; }
    .barcode { display: flex; gap: 2px; align-items: flex-end; opacity: 0.5; margin-bottom: 4px; }
    .barcode span { background: #0f172a; width: 2px; }
    .verification { font-size: 8px; font-family: monospace; color: #64748b; text-transform: uppercase; }
    .disclaimer { font-size: 9px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 16px; font-style: italic; max-width: 200px; }
    
    .totals { width: 160px; }
    .total-row { display: flex; justify-content: space-between; font-size: 10px; }
    .total-label { font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .total-value { font-weight: 700; }
    .grand-total { 
      display: flex; justify-content: space-between; 
      padding-top: 12px; margin-top: 8px; 
      border-top: 2px solid #0f172a; 
    }
    .grand-total-label { font-size: 14px; font-weight: 800; text-transform: uppercase; }
    .grand-total-value { font-size: 24px; font-weight: 900; letter-spacing: -0.03em; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <div class="logo">
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
      </div>
      <div>
        <div class="store-name">${storeConfig.storeName}</div>
        <div class="store-tagline">Premium Imaging Solution</div>
        <div class="store-address">${storeConfig.address}</div>
      </div>
    </div>
    <div class="invoice-info">
      <div class="invoice-label">Faktur Penjualan</div>
      <div class="invoice-id">${lastSale.id}</div>
      <div class="invoice-date">${formatDate(lastSale.timestamp)}</div>
    </div>
  </div>
  
  <div class="customer-section">
    <div>
      <div class="section-label">Bill To / Penerima</div>
      <div class="customer-name">${lastSale.customerName}</div>
      <div class="customer-detail">${customer?.address || '-'}</div>
      <div class="customer-detail">Telp: ${customer?.phone || '-'}</div>
    </div>
    <div style="text-align: right;">
      <div class="section-label">Tax Registration</div>
      ${customer?.npwp ? `<div class="customer-npwp">${customer.npwp}</div>` : '<div class="no-npwp">No NPWP Provided</div>'}
      <div style="margin-top: 16px;">
        <div class="section-label">Payment Method</div>
        <span class="payment-badge">${lastSale.paymentMethod === 'Credit' ? 'ORG UTANG (BON)' : lastSale.paymentMethod}</span>
      </div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Description / Serial Number</th>
        <th>Warranty</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>
  
  <div class="totals-section">
    <div class="footer-section">
      <div class="barcode">
        ${Array(30).fill(0).map((_, i) => `<span style="height: ${[6, 4, 3][i % 3]}px"></span>`).join('')}
      </div>
      <div class="verification">Verification Auth: ${lastSale.id.split('-')[1]}</div>
      <div class="disclaimer">Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</div>
    </div>
    <div class="totals">
      <div class="total-row">
        <span class="total-label">Subtotal</span>
        <span class="total-value">${formatIDR(lastSale.subtotal)}</span>
      </div>
      <div class="total-row">
        <span class="total-label">Tax (${taxRatePercent}% PPN)</span>
        <span class="total-value">${formatIDR(lastSale.tax)}</span>
      </div>
      <div class="grand-total">
        <span class="grand-total-label">Grand Total</span>
        <span class="grand-total-value">${formatIDR(lastSale.total)}</span>
      </div>
    </div>
  </div>
</body>
</html>`;
                    setPrintModalHtml(htmlContent);
                    const pdfBlob = await generateInvoicePdf(htmlContent);
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    setPrintPdfUrl(pdfUrl);
                  } catch (error) {
                    console.error('Failed to generate PDF:', error);
                    alert('Failed to generate PDF. Please try again.');
                  } finally {
                    setIsPrinting(false);
                  }
                }}
                disabled={isPrinting}
                className="flex-1 py-4 bg-white text-slate-900 font-black rounded-3xl text-[10px] uppercase tracking-widest hover:bg-slate-100 shadow-xl shadow-white/5 transition-all active:scale-95 order-1 sm:order-2 disabled:opacity-50"
              >
                {isPrinting ? 'Preparing...' : 'Print Invoice (A5)'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {(printModalHtml || printPdfUrl) && (
        <PrintModal 
          html={printModalHtml} 
          pdfUrl={printPdfUrl} 
          onClose={() => {
            setPrintModalHtml('');
            if (printPdfUrl) {
              URL.revokeObjectURL(printPdfUrl);
              setPrintPdfUrl(null);
            }
          }} 
        />
      )}
    </div>
  );
};

interface PrintModalProps {
  html: string;
  pdfUrl: string | null;
  onClose: () => void;
}

const PrintModal: React.FC<PrintModalProps> = ({ html, pdfUrl, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[158mm] max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <h3 className="font-black text-slate-800 text-sm">Print Invoice</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-100 p-4">
          {pdfUrl ? (
            <iframe 
              ref={iframeRef}
              src={pdfUrl} 
              className="mx-auto bg-white shadow-lg"
              style={{ width: '148mm', height: '210mm' }}
              title="Invoice PDF"
            />
          ) : (
            <div 
              className="bg-white shadow-lg mx-auto"
              style={{ width: '148mm', minHeight: '210mm' }}
              dangerouslySetInnerHTML={{ __html: html }} 
            />
          )}
        </div>
        <div className="p-4 border-t border-slate-200 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
          <button onClick={handlePrint} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors" disabled={!pdfUrl}>
            Print Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSView;
