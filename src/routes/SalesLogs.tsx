import React, { useState, useEffect, useMemo } from 'react';
import { Sale, Customer, SaleItem } from '../../app/types';
import { formatIDR, formatDate } from '../../app/utils/formatters';
import { pdf } from '@react-pdf/renderer';
import { InvoiceDocument } from '../../app/components/InvoicePDF';

interface SalesLogsProps {
  sales: Sale[];
  customers: Customer[];
  storeConfig: { storeName: string; address: string; ppnRate: number };
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
  onMarkAsPaid?: (saleId: string) => Promise<void>;
}

const SalesLogsView: React.FC<SalesLogsProps> = ({ sales, customers, storeConfig, currentPage = 1, totalPages = 1, totalItems = 0, onPageChange, perPage = 20, onPerPageChange, onMarkAsPaid }) => {
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [customerMap, setCustomerMap] = useState<Record<string, Customer>>({});
  const [printModalHtml, setPrintModalHtml] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const map: Record<string, Customer> = {};
    customers.forEach(c => { map[c.id] = c; });
    setCustomerMap(map);
  }, [customers]);

  const filteredSales = useMemo(() => {
    if (!search.trim()) return sales;
    const q = search.toLowerCase();
    return sales.filter(s => 
      s.id.toLowerCase().includes(q) ||
      s.customerName.toLowerCase().includes(q) ||
      s.staffName.toLowerCase().includes(q)
    );
  }, [sales, search]);

  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [filteredSales]);

  const handlePrint = async (sale: Sale) => {
    const customer = customerMap[sale.customerId];
    const invoiceData = {
      storeName: storeConfig.storeName || 'Sinar Bahagia',
      address: storeConfig.address || 'Jl. Kramat Gantung No. 63, Surabaya',
      invoiceNumber: sale.id,
      date: formatDate(sale.timestamp),
      customerName: sale.customerName,
      customerPhone: customer?.phone,
      customerAddress: customer?.address,
      customerNpwp: customer?.npwp,
      items: sale.items.map(item => ({
        model: item.model,
        sn: item.sn,
        price: item.price,
        warrantyExpiry: item.warrantyExpiry
      })),
      subtotal: sale.subtotal,
      tax: sale.tax,
      taxRate: storeConfig.ppnRate / 100,
      total: sale.total,
      staffName: sale.staffName,
      paymentMethod: sale.paymentMethod
    };

    try {
      setIsPrinting(true);
      const blob = await pdf(<InvoiceDocument data={invoiceData} />).toBlob();
      const url = URL.createObjectURL(blob);
      setPrintModalHtml(`<iframe src="${url}" style="width:100%;height:100%;border:none;"></iframe>`);
      setSelectedSale(sale);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const closePrintModal = () => {
    setPrintModalHtml('');
    setSelectedSale(null);
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase">Sales Logs</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Riwayat transaksi penjualan</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="relative max-w-md">
            <input 
              type="text" 
              placeholder="Cari invoice number, customer, atau staff..."
              className="w-full px-6 py-4 pl-14 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg className="w-6 h-6 absolute left-5 top-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-6 py-5">Invoice</th>
                <th className="px-6 py-5">Tanggal</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5 text-right">Items</th>
                <th className="px-6 py-5 text-right">Total</th>
                <th className="px-6 py-5">Payment</th>
                <th className="px-6 py-5">Staff</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {sortedSales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs">{sale.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{formatDate(sale.timestamp)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 uppercase">{sale.customerName}</span>
                      {customerMap[sale.customerId]?.phone && (
                        <span className="text-xs text-slate-400">{customerMap[sale.customerId]?.phone}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-slate-900">{sale.items.length} item(s)</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-black text-green-600 tracking-tight">{formatIDR(sale.total)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
                      sale.paymentMethod === 'Cash' ? 'bg-green-100 text-green-700' :
                      sale.paymentMethod === 'Debit' ? 'bg-blue-100 text-blue-700' :
                      sale.paymentMethod === 'QRIS' ? 'bg-purple-100 text-purple-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-600">{sale.staffName}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => handlePrint(sale)}
                      className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg text-xs font-bold transition-all"
                      title="Print Invoice"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {sortedSales.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    {search ? 'Tidak ada hasil pencarian' : 'Belum ada transaksi'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Modal */}
      {printModalHtml && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 uppercase tracking-tight">Print Invoice - {selectedSale?.id}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const iframe = document.querySelector('iframe') as HTMLIFrameElement;
                    if (iframe?.contentWindow) {
                      iframe.contentWindow.print();
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-indigo-700"
                >
                  Print
                </button>
                <button 
                  onClick={closePrintModal}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe 
                src={printModalHtml.split('src="')[1]?.split('"')[0] || ''}
                className="w-full h-full border-0"
                title="Invoice Print"
              />
            </div>
          </div>
        </div>
      )}

      {isPrinting && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xl z-[90] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <span className="font-bold text-slate-700">Generating PDF...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesLogsView;
