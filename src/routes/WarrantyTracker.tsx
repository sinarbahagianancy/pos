
import React, { useState, useRef, useEffect } from 'react';
import { SerialNumber, Sale, WarrantyClaim, ClaimStatus } from '../../app/types';
import { formatDate } from '../../app/utils/formatters';

interface WarrantyTrackerProps {
  sns: SerialNumber[];
  sales: Sale[];
  claims: WarrantyClaim[];
  onAddClaim: (claim: WarrantyClaim) => void;
  onUpdateStatus: (id: string, status: ClaimStatus) => void;
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
}

const WarrantyTrackerView: React.FC<WarrantyTrackerProps> = ({ sns, sales, claims, onAddClaim, onUpdateStatus, notify }) => {
  const [searchSN, setSearchSN] = useState('');
  const [foundSale, setFoundSale] = useState<Sale | null>(null);
  const [foundItem, setFoundItem] = useState<any>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [issue, setIssue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search for scanner readiness
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearch = () => {
    if (!searchSN) return;
    // Exact SN match in existing sales history
    const sale = sales.find(s => s.items.some(i => i.sn.toUpperCase() === searchSN.toUpperCase()));
    if (sale) {
      setFoundSale(sale);
      setFoundItem(sale.items.find(i => i.sn.toUpperCase() === searchSN.toUpperCase()));
    } else {
      setFoundSale(null);
      setFoundItem(null);
      notify('Nomor Seri (SN) tidak terdaftar dalam riwayat penjualan.', 'error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const isUnderWarranty = (expiry: string) => new Date(expiry) > new Date();

  const submitClaim = () => {
    if (!foundSale || !foundItem) return;
    onAddClaim({
      id: `CLM-${Math.floor(Math.random() * 10000)}`,
      sn: foundItem.sn,
      productModel: foundItem.model,
      customerName: foundSale.customerName,
      customerPhone: '0812-XXXX-XXXX', 
      issue,
      status: 'Received',
      receivedDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    });
    setShowClaimModal(false);
    setIssue('');
    setSearchSN('');
    setFoundSale(null);
    setFoundItem(null);
    // Refocus for next scan
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  return (
    <div className="space-y-6 max-w-full pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase">Pusat Layanan & Garansi</h1>
          <p className="text-sm text-slate-500 font-medium">Lacak status garansi unit terjual dan manajemen klaim servis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Input */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-slate-200 shadow-sm">
            <h2 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6 flex items-center space-x-2">
               <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 17h.01M9 17h.01M9 14h.01M3 17h1m4 0h1m-1-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
               <span>Scan Barcode / SN</span>
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Input SN Unit Terjual</label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="Scan Barcode disini..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none uppercase placeholder-slate-400 w-full"
                    value={searchSN}
                    onChange={(e) => setSearchSN(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button onClick={handleSearch} className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 w-full sm:w-auto">
                    Cek
                  </button>
                </div>
              </div>

              {foundItem && foundSale && (
                <div className="p-5 rounded-2xl border border-slate-100 space-y-4 bg-slate-50/50 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <p className="text-[9px] text-slate-400 uppercase font-black">Model Unit</p>
                      <p className="text-sm font-black text-slate-900 leading-tight truncate">{foundItem.model}</p>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase whitespace-nowrap ${isUnderWarranty(foundItem.warrantyExpiry) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isUnderWarranty(foundItem.warrantyExpiry) ? 'Aktif' : 'Expired'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-black">Tgl Beli</p>
                      <p className="text-xs font-bold text-slate-700">{formatDate(foundSale.timestamp)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-black">Habis Kontrak</p>
                      <p className="text-xs font-bold text-slate-700">{foundItem.warrantyExpiry}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[9px] text-slate-400 uppercase font-black">Pemilik Unit</p>
                    <p className="text-sm font-black text-slate-900 truncate">{foundSale.customerName}</p>
                  </div>
                  
                  {isUnderWarranty(foundItem.warrantyExpiry) ? (
                    <button onClick={() => setShowClaimModal(true)} className="w-full mt-4 bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md">
                      Buat Tiket Klaim Baru
                    </button>
                  ) : (
                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-[10px] font-bold rounded-xl text-center border border-red-100">
                      Masa garansi telah habis.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Table */}
        <div className="xl:col-span-2 min-w-0">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="font-black text-slate-900 uppercase tracking-tighter">Monitoring Antrean Servis</h2>
              <span className="text-[10px] text-indigo-600 font-black px-2 py-1 bg-indigo-50 rounded-full uppercase tracking-widest w-fit">{claims.length} Klaim Berjalan</span>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar flex-1">
              {/* Added min-w-[800px] to ensure table doesn't crush on mobile */}
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-5 whitespace-nowrap">Klaim / SN</th>
                    <th className="px-6 py-5">Model & Client</th>
                    <th className="px-6 py-5">Tahap Servis</th>
                    <th className="px-6 py-5 whitespace-nowrap">Last Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {claims.length > 0 ? claims.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5 font-mono text-slate-500 text-xs whitespace-nowrap">
                        #{c.id}<br/>
                        <span className="text-slate-900 font-black uppercase">{c.sn}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col max-w-[200px] lg:max-w-none">
                          <span className="text-sm font-black text-slate-900 tracking-tight truncate">{c.productModel}</span>
                          <span className="text-xs text-slate-400 font-bold uppercase truncate">{c.customerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <select 
                          className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 cursor-pointer outline-none w-full max-w-[140px] ${
                            c.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            c.status === 'Received' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}
                          value={c.status}
                          onChange={(e) => onUpdateStatus(c.id, e.target.value as ClaimStatus)}
                        >
                          <option value="Received">Diterima</option>
                          <option value="Sent to HQ">Kirim Ke Pusat</option>
                          <option value="Repairing">Perbaikan</option>
                          <option value="Ready for Pickup">Bisa Diambil</option>
                          <option value="Completed">Selesai</option>
                        </select>
                      </td>
                      <td className="px-6 py-5 text-slate-500 font-bold text-[11px] whitespace-nowrap">{formatDate(c.lastUpdated)}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="p-20 text-center text-slate-300 italic">Belum ada antrean perbaikan unit.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showClaimModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[150] p-4 overflow-y-auto">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in duration-200 my-auto">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Intake Tiket Perbaikan</h2>
              <button onClick={() => setShowClaimModal(false)} className="text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 lg:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">SN UNIT</p>
                  <p className="font-black text-slate-900 font-mono text-sm uppercase truncate">{foundItem?.sn}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">PRODUK</p>
                  <p className="font-black text-slate-900 text-sm truncate">{foundItem?.model}</p>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Keluhan / Deskripsi Kerusakan</label>
                <textarea 
                  className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none h-32 resize-none placeholder-slate-500"
                  placeholder="Contoh: Sensor berjamur, AF lambat, Error 20, LCD Flickering..."
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex gap-4">
              <button onClick={() => setShowClaimModal(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-widest transition-all">Batal</button>
              <button onClick={submitClaim} disabled={!issue} className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-all ${!issue ? 'bg-slate-300 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700'}`}>Simpan Tiket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarrantyTrackerView;
