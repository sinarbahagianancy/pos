import React, { useState, useMemo } from "react";
import { Sale, Product, SerialNumber, WarrantyClaim } from "../../app/types";
import { formatIDR, exportToCSV, formatDate } from "../../app/utils/formatters";
import Pagination from "../../app/components/Pagination";
import { RupiahInput } from "../../app/components/RupiahInput";

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  sns: SerialNumber[];
  claims: WarrantyClaim[];
  canViewSensitive: boolean;
  onMarkAsPaid?: (saleId: string) => Promise<void>;
  onRecordInstallment?: (saleId: string, amount: number) => Promise<void>;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
}

const ReportsView: React.FC<ReportsProps> = ({
  sales,
  products,
  sns,
  claims,
  canViewSensitive,
  onMarkAsPaid,
  onRecordInstallment,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  perPage = 20,
  onPerPageChange,
}) => {
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    saleId: string;
    customerName: string;
  } | null>(null);
  const [installmentPopover, setInstallmentPopover] = useState<{
    saleId: string;
    customerName: string;
    remaining: number;
  } | null>(null);
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalCogs = sales.reduce(
    (acc, s) => acc + s.items.reduce((sum, item) => sum + item.cogs, 0),
    0,
  );
  const grossProfit = totalRevenue - totalCogs;

  const unpaidUtang = sales.filter((s) => s.paymentMethod === "Utang" && !s.isPaid);
  const totalReceivables = unpaidUtang.reduce(
    (acc, s) => acc + (s.total - (s.amountPaid || 0)),
    0,
  );

  const priorityReceivables = unpaidUtang.sort((a, b) => {
    const aOverdue = !a.dueDate || new Date(a.dueDate) < new Date();
    const bOverdue = !b.dueDate || new Date(b.dueDate) < new Date();
    if (aOverdue && !bOverdue) return -1;
    if (!aOverdue && bOverdue) return 1;
    return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
  });

  // Flatten sales + installments into individual log entries, sorted by time
  const logEntries = useMemo(() => {
    type LogEntry = {
      saleId: string;
      customerName: string;
      timestamp: string;
      amount: number;
      type: "sale" | "installment";
      installmentIndex?: number;
      paymentMethod: string;
      isPaid: boolean;
      sale?: Sale;
    };
    const entries: LogEntry[] = [];
    for (const s of sales) {
      // Original sale entry
      entries.push({
        saleId: s.id,
        customerName: s.customerName,
        timestamp: s.timestamp,
        amount: s.total,
        type: "sale",
        paymentMethod: s.paymentMethod,
        isPaid: s.isPaid ?? false,
        sale: s,
      });
      // Individual installment entries
      if (s.paymentMethod === "Utang" && s.installments && s.installments.length > 0) {
        s.installments.forEach((inst, i) => {
          entries.push({
            saleId: s.id,
            customerName: s.customerName,
            timestamp: inst.timestamp,
            amount: inst.amount,
            type: "installment",
            installmentIndex: i + 1,
            paymentMethod: "Utang",
            isPaid: s.isPaid ?? false,
            sale: s,
          });
        });
      }
    }
    // Sort by timestamp descending (newest first)
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return entries;
  }, [sales]);

  const handleMarkAsPaid = async () => {
    if (!confirmModal || !onMarkAsPaid) return;
    setLoading(true);
    try {
      await onMarkAsPaid(confirmModal.saleId);
      setToast({ message: "Pelunasan berhasil!", type: "success" });
      setConfirmModal(null);
    } catch (error) {
      setToast({ message: "Gagal melakukan pelunasan", type: "error" });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleRecordInstallment = async () => {
    if (!installmentPopover || !onRecordInstallment) return;
    const amount = parseInt(installmentAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    setLoading(true);
    try {
      await onRecordInstallment(installmentPopover.saleId, amount);
      setToast({ message: `Cicilan ${formatIDR(amount)} berhasil dicatat!`, type: "success" });
      setInstallmentPopover(null);
      setInstallmentAmount("");
    } catch (error) {
      setToast({ message: "Gagal mencatat cicilan", type: "error" });
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const exportSales = () => {
    const data = sales.map((s) => ({
      Nota: s.id,
      Tanggal: s.timestamp,
      Pelanggan: s.customerName,
      Total: s.total,
      Profit: canViewSensitive
        ? s.total - s.items.reduce((sum, i) => sum + i.cogs, 0)
        : "RESTRICTED",
      Metode: s.paymentMethod,
      Status: s.isPaid ? "Lunas" : "Belum Lunas",
    }));
    exportToCSV(data, "Executive_Report_Sinar_Bahagia");
  };

  return (
    <div className="space-y-8 max-w-full">
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-xl shadow-xl z-50 ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          <span className="font-black text-sm">{toast.message}</span>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
              Konfirmasi Pelunasan
            </h3>
            <p className="text-slate-600 mb-6">
              Apakah Anda yakin ingin menandai nota{" "}
              <span className="font-black text-orange-600">{confirmModal.saleId}</span> dari{" "}
              <span className="font-black">{confirmModal.customerName}</span> sebagai lunas?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                disabled={loading}
              >
                Batal
              </button>
              <button
                onClick={handleMarkAsPaid}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-green-700 transition-all disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Ya, Lunaskan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {installmentPopover && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">
              Catat Cicilan
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Nota <span className="font-black text-amber-600">{installmentPopover.saleId}</span> dari{" "}
              <span className="font-black">{installmentPopover.customerName}</span>
            </p>
            <div className="space-y-2 mb-6">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Jumlah Cicilan
              </label>
              <RupiahInput
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-lg font-bold placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 tabular-nums"
                value={parseInt(installmentAmount, 10) || 0}
                onChange={(val) => setInstallmentAmount(String(val))}
                autoFocus
                placeholder={`Sisa: ${formatIDR(installmentPopover.remaining)}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRecordInstallment();
                }}
              />
              {installmentAmount && (
                <p className="text-[10px] text-slate-400 font-bold">
                  Sisa setelah cicilan:{" "}
                  <span className="text-amber-600">
                    {formatIDR(installmentPopover.remaining - parseInt(installmentAmount, 10))}
                  </span>
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setInstallmentPopover(null);
                  setInstallmentAmount("");
                }}
                className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                disabled={loading}
              >
                Batal
              </button>
              <button
                onClick={handleRecordInstallment}
                className="flex-1 py-3 px-4 bg-amber-500 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50"
                disabled={loading || !installmentAmount}
              >
                {loading ? "Memproses..." : "Simpan Cicilan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
            Reporting & Piutang
          </h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight mt-1">
            Laporan Finansial dan Monitoring Utang (Bon).
          </p>
        </div>
        {/* <button onClick={exportSales} className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200">
          Ekspor CSV (Master)
        </button> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {canViewSensitive ? (
          <div className="bg-indigo-600 text-white p-8 rounded-[40px] shadow-2xl flex flex-col justify-between min-h-[220px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
            <div>
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">
                Total Revenue
              </p>
              <h2 className="text-3xl font-black truncate tabular-nums tracking-tighter">
                {formatIDR(totalRevenue)}
              </h2>
            </div>
            <div className="mt-8 pt-6 border-t border-indigo-500/50 flex justify-between items-end">
              <div>
                <p className="text-indigo-200 text-[9px] font-black uppercase mb-1">
                  Bersih (Gross Profit)
                </p>
                <p className="text-xl font-black text-white tabular-nums">
                  {formatIDR(grossProfit)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-indigo-200 text-[9px] font-black uppercase mb-1">Invoices</p>
                <p className="text-xl font-black text-white">{sales.length}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 p-8 rounded-[40px] border border-slate-200 flex flex-col items-center justify-center text-center">
            <svg
              className="w-12 h-12 text-slate-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
              Financial Restricted
            </p>
            <p className="text-[9px] text-slate-400 mt-2 font-medium">
              Hanya Owner yang berhak mengakses data profit.
            </p>
          </div>
        )}

        <div className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-1">
              Total Piutang Aktif
            </p>
            <h2 className="text-3xl font-black text-slate-900 truncate tabular-nums tracking-tighter">
              {formatIDR(totalReceivables)}
            </h2>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Nota Pending</span>
            <span className="text-slate-900 font-black">{unpaidUtang.length} Transaksi</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm flex flex-col justify-between min-h-[220px]">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">
              Valuasi Stok Retail
            </p>
            <h2 className="text-3xl font-black text-slate-900 truncate tabular-nums tracking-tighter">
              {formatIDR(products.reduce((acc, p) => acc + p.stock * p.price, 0))}
            </h2>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase mb-1">
                Total Unit Gudang
              </p>
              <p className="text-xl font-black text-slate-900">
                {products.reduce((acc, p) => acc + p.stock, 0)} Pcs
              </p>
            </div>
            {canViewSensitive && (
              <div className="text-right">
                <p className="text-indigo-400 text-[9px] font-black uppercase mb-1">HPP Terikat</p>
                <p className="text-lg font-black text-indigo-900 tabular-nums">
                  {formatIDR(products.reduce((acc, p) => acc + p.stock * p.cogs, 0))}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-orange-100 shadow-xl shadow-orange-900/5 overflow-hidden flex flex-col">
        <div className="p-8 border-b border-orange-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-orange-50/30">
          <div>
            <h2 className="font-black text-orange-900 uppercase tracking-tighter text-lg">
              Daftar Piutang Belum Lunas
            </h2>
            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mt-1">
              Diurutkan berdasarkan due date (yang overdue berada di atas).
            </p>
          </div>
          <span className="px-4 py-2 bg-white border border-orange-200 text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
            {priorityReceivables.length} Nota
          </span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[950px]">
            <thead className="bg-orange-50 text-orange-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-8 py-6">Invoice ID</th>
                <th className="px-8 py-6">Tanggal</th>
                <th className="px-8 py-6">Pelanggan</th>
                <th className="px-8 py-6 text-right">Total</th>
                <th className="px-8 py-6 text-right">Dibayar</th>
                <th className="px-8 py-6 text-right">Sisa Tagihan</th>
                <th className="px-8 py-6">Staff</th>
                <th className="px-8 py-6 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100/50 text-sm font-medium">
              {priorityReceivables.length > 0 ? (
                priorityReceivables.map((s) => {
                  const isOverdue = !s.dueDate || new Date(s.dueDate) < new Date();
                  return (
                    <tr key={s.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="px-8 py-6 font-mono text-orange-600 text-xs font-bold">
                        {s.id}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-slate-600 text-sm">{formatDate(s.timestamp)}</span>
                          {s.dueDate ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isOverdue ? "bg-red-500" : "bg-amber-400"
                                }`}
                              />
                              <span className={isOverdue ? "text-red-600" : "text-amber-600"}>
                                {isOverdue ? "Overdue" : formatDate(s.dueDate)}
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              Tanpa Jatuh Tempo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 font-black text-slate-900 uppercase tracking-tighter">
                        {s.customerName}
                      </td>
                      <td className="px-8 py-6 font-black text-slate-400 tabular-nums text-right">
                        {formatIDR(s.total)}
                      </td>
                      <td className="px-8 py-6 font-black text-green-600 tabular-nums text-right">
                        {formatIDR(s.amountPaid || 0)}
                      </td>
                      <td className="px-8 py-6 text-right font-black text-orange-600 tabular-nums">
                        {formatIDR(s.total - (s.amountPaid || 0))}
                      </td>
                      <td className="px-8 py-6 text-slate-500">{s.staffName}</td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              setInstallmentPopover({
                                saleId: s.id,
                                customerName: s.customerName,
                                remaining: s.total - (s.amountPaid || 0),
                              })
                            }
                            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-amber-600 transition-all"
                          >
                            Cicilan
                          </button>
                          <button
                            onClick={() =>
                              setConfirmModal({
                                show: true,
                                saleId: s.id,
                                customerName: s.customerName,
                              })
                            }
                            className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-green-700 transition-all"
                          >
                            Pelunasan
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-20 text-center text-slate-300 italic">
                    Tidak ada piutang yang belum lunas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
          <h2 className="font-black text-slate-900 uppercase tracking-tighter text-lg">
            Semua Log Penjualan & Cicilan
          </h2>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-10 py-6">ID Nota</th>
                <th className="px-10 py-6">Waktu</th>
                <th className="px-10 py-6">Client Identity</th>
                <th className="px-10 py-6 text-right">Jumlah</th>
                {canViewSensitive && (
                  <th className="px-10 py-6 text-right text-indigo-400">Net Profit</th>
                )}
                <th className="px-10 py-6 text-center">Tipe / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {logEntries.map((entry, idx) => {
                const isInstallment = entry.type === "installment";
                return (
                  <tr key={`${entry.saleId}-${idx}`} className={`hover:bg-slate-50 transition-colors ${isInstallment ? "bg-amber-50/30" : ""}`}>
                    <td className="px-10 py-6 font-mono text-slate-500 text-xs font-bold">
                      {entry.saleId}
                    </td>
                    <td className="px-10 py-6 text-slate-600">{formatDate(entry.timestamp)}</td>
                    <td className="px-10 py-6 font-black text-slate-900 uppercase tracking-tighter">
                      {entry.customerName}
                    </td>
                    <td className={`px-10 py-6 text-right font-black tabular-nums ${isInstallment ? "text-amber-600" : "text-slate-900"}`}>
                      {isInstallment ? "+" : ""}{formatIDR(entry.amount)}
                    </td>
                    {canViewSensitive && (
                      <td className="px-10 py-6 text-right font-black text-green-600 tabular-nums">
                        {isInstallment ? "-" : formatIDR(entry.sale!.total - (entry.sale!.items.reduce((sum, i) => sum + i.cogs, 0) + entry.sale!.tax))}
                      </td>
                    )}
                    <td className="px-10 py-6 text-center">
                      {isInstallment ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="px-3 py-1 rounded-xl text-[9px] font-black uppercase border shadow-sm bg-amber-100 text-amber-700 border-amber-100">
                            Cicilan {entry.installmentIndex}x
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">
                            Terbayar: {formatIDR(entry.sale!.amountPaid || 0)} / {formatIDR(entry.sale!.total)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border shadow-sm ${
                              entry.paymentMethod === "Utang"
                                ? entry.isPaid
                                  ? "bg-green-100 text-green-700 border-green-100"
                                  : (entry.sale!.amountPaid || 0) > 0
                                    ? "bg-amber-100 text-amber-700 border-amber-100"
                                    : "bg-orange-50 text-orange-700 border-orange-100"
                                : "bg-indigo-50 text-indigo-700 border-indigo-100"
                            }`}
                          >
                            {entry.paymentMethod === "Utang"
                              ? entry.isPaid
                                ? "Lunas"
                                : (entry.sale!.amountPaid || 0) > 0
                                  ? `Cicilan (${entry.sale!.installments?.length || 0}x)`
                                  : "Utang"
                              : entry.paymentMethod}
                          </span>
                          {entry.paymentMethod === "Utang" && !entry.isPaid && (entry.sale!.amountPaid || 0) > 0 && (
                            <span className="text-[9px] text-slate-400 font-bold">
                              {formatIDR(entry.sale!.amountPaid || 0)} / {formatIDR(entry.sale!.total)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange || (() => {})}
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        itemLabel="sales"
      />
    </div>
  );
};

export default ReportsView;
