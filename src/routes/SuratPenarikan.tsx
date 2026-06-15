import React, { useState, useEffect, useMemo } from "react";
import {
  SuratPenarikan,
  Product,
  SerialNumber,
  StoreConfig,
  PenarikanReason,
} from "../../app/types";
import { formatDate } from "../../app/utils/formatters";
import { pdf } from "@react-pdf/renderer";
import { InvoiceDocument } from "../../app/components/InvoicePDF";
import Pagination from "../../app/components/Pagination";
import DocumentItemEditor, { DocumentFormItem } from "../../app/components/DocumentItemEditor";
import {
  getAllSuratPenarikan,
  getSuratPenarikanById,
  createSuratPenarikan,
  CreateSuratPenarikanInput,
} from "../../app/services/suratPenarikan.api";
import { PenarikanReasons } from "../../app/schemas/document.schema";

type ViewMode = "list" | "create" | "preview";

interface SuratPenarikanViewProps {
  products: Product[];
  sns: SerialNumber[];
  storeConfig: StoreConfig;
  staffName: string;
}

const SuratPenarikanView: React.FC<SuratPenarikanViewProps> = ({
  products,
  sns,
  storeConfig,
  staffName,
}) => {
  const [view, setView] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [spbList, setSpbList] = useState<SuratPenarikan[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Create form state
  const [recipient, setRecipient] = useState("");
  const [reason, setReason] = useState<PenarikanReason>("Rusak");
  const [alasanLainnya, setAlasanLainnya] = useState("");
  const [notes, setNotes] = useState("");
  const [formItems, setFormItems] = useState<DocumentFormItem[]>([]);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Preview state
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewSpb, setPreviewSpb] = useState<SuratPenarikan | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const loadList = async () => {
    setLoading(true);
    try {
      const result = await getAllSuratPenarikan({ page, limit: perPage, search });
      setSpbList(result.suratPenarikan);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setToast({ message: `Gagal memuat daftar Penarikan: ${String(err)}`, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (view === "list") {
      loadList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, page, perPage, search]);

  useEffect(() => {
    if (view === "create") {
      setRecipient("");
      setReason("Rusak");
      setAlasanLainnya("");
      setNotes("");
      setFormItems([]);
    }
  }, [view]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (alsoPrint: boolean) => {
    if (!recipient.trim()) {
      showToast("Penarik (recipient) is required", "error");
      return;
    }
    if (reason === "Lainnya" && !alasanLainnya.trim()) {
      showToast("Alasan (free-form) is required when reason is 'Lainnya'", "error");
      return;
    }

    // Filter out empty rows (rows with no product picked).
    const filledItems = formItems.filter((it) => it.productId);
    if (filledItems.length === 0) {
      showToast("Surat Penarikan must have at least 1 item", "error");
      return;
    }

    // Per-row validation: SN row needs ≥1 SN, non-SN row needs qty ≥ 1.
    const errors: Record<number, string> = {};
    filledItems.forEach((it, idx) => {
      const product = products.find((p) => p.id === it.productId);
      if (product?.hasSerialNumber) {
        if (!it.selectedSNs || it.selectedSNs.length === 0) {
          errors[idx] = "Pilih minimal 1 SN";
        }
      } else {
        if (!it.quantity || it.quantity < 1) {
          errors[idx] = "Qty harus minimal 1";
        }
      }
    });
    if (Object.keys(errors).length > 0) {
      setRowErrors(errors);
      showToast("Perbaiki baris yang ditandai merah", "error");
      return;
    }
    setRowErrors({});

    // Expand rows to items: SN row → N items (one per SN, qty 1 each);
    // non-SN row → 1 item with the form's qty.
    const expandedItems = filledItems.flatMap((it) => {
      const product = products.find((p) => p.id === it.productId)!;
      if (product.hasSerialNumber) {
        return (it.selectedSNs ?? []).map((sn) => ({
          productId: it.productId,
          brand: product.brand,
          model: product.model,
          sn,
          quantity: 1,
        }));
      } else {
        return [
          {
            productId: it.productId,
            brand: product.brand,
            model: product.model,
            sn: "",
            quantity: it.quantity ?? 1,
          },
        ];
      }
    });

    setSubmitting(true);
    try {
      const payload: CreateSuratPenarikanInput = {
        recipient: recipient.trim(),
        reason,
        alasanLainnya: reason === "Lainnya" ? alasanLainnya.trim() : undefined,
        notes: notes.trim() || undefined,
        staffName,
        items: expandedItems,
      };
      const created = await createSuratPenarikan(payload);
      showToast(`Surat Penarikan ${created.id} berhasil dibuat`, "success");
      if (alsoPrint) {
        await handlePrint(created);
      }
      setView("list");
      loadList();
    } catch (err) {
      showToast(`Gagal membuat Surat Penarikan: ${String(err)}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = async (spb: SuratPenarikan) => {
    try {
      setPreviewing(true);
      const fresh = await getSuratPenarikanById(spb.id);
      const reasonLabel =
        fresh.reason === "Lainnya" && fresh.alasanLainnya
          ? `Lainnya: ${fresh.alasanLainnya}`
          : fresh.reason;
      const invoiceData = {
        storeName: storeConfig.storeName,
        address: storeConfig.address,
        storePhone: "085731555667",
        storeTagline: "TERPERCAYA SEJAK 1960",
        storeSubTagline: "CUTTING EDGE PHOTOGRAPHY",
        socialYoutube: "@SINARBAHAGIAOFFICIAL",
        socialInstagram: "@SINARBAHAGIAOFFICIAL",
        socialTiktok: "@TOKOSINARBAHAGIA",
        invoiceNumber: fresh.id,
        date: formatDate(fresh.createdAt),
        customerName: "",
        recipient: fresh.recipient,
        reason: reasonLabel,
        items: fresh.items.map((item) => ({
          merk: item.brand,
          model: item.model,
          sn: item.sn,
          price: 0,
          quantity: item.quantity,
        })),
        subtotal: 0,
        tax: 0,
        taxEnabled: false,
        total: 0,
        staffName: fresh.staffName,
        paymentMethod: "",
        notes: fresh.notes,
      };
      if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
      const blob = await pdf(
        <InvoiceDocument kind="surat-penarikan" layout="a4-portrait" data={invoiceData} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setPreviewSpb(fresh);
    } catch (err) {
      showToast(`Gagal membuat PDF: ${String(err)}`, "error");
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase">
            {view === "list"
              ? "Penarikan Barang"
              : view === "create"
                ? "Buat Penarikan Baru"
                : "Preview Penarikan"}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {view === "list"
              ? "Riwayat barang keluar (rusak / expired / internal)"
              : "Buat penarikan barang baru"}
          </p>
        </div>
        {view === "list" && (
          <button
            onClick={() => setView("create")}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700"
          >
            + Buat Penarikan Baru
          </button>
        )}
        {view === "create" && (
          <button
            onClick={() => setView("list")}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200"
          >
            ← Kembali
          </button>
        )}
      </div>

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white font-bold text-sm`}
        >
          {toast.message}
        </div>
      )}

      {view === "list" && (
        <>
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Cari ID atau Penarik..."
                  className="w-full px-6 py-4 pl-14 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                <svg
                  className="w-6 h-6 absolute left-5 top-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-5">No. SPB</th>
                    <th className="px-6 py-5">Tanggal</th>
                    <th className="px-6 py-5">Penarik</th>
                    <th className="px-6 py-5">Alasan</th>
                    <th className="px-6 py-5 text-right">Items</th>
                    <th className="px-6 py-5">Staff</th>
                    <th className="px-6 py-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        Loading...
                      </td>
                    </tr>
                  ) : spbList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        {search ? "Tidak ada hasil pencarian" : "Belum ada Surat Penarikan"}
                      </td>
                    </tr>
                  ) : (
                    spbList.map((spb) => {
                      const reasonLabel =
                        spb.reason === "Lainnya" && spb.alasanLainnya
                          ? `Lainnya: ${spb.alasanLainnya}`
                          : spb.reason;
                      return (
                        <tr key={spb.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono font-black px-3 py-1.5 rounded-lg text-xs text-indigo-600 bg-indigo-50">
                              {spb.id}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {formatDate(spb.createdAt)}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">{spb.recipient}</td>
                          <td className="px-6 py-4 text-slate-700 text-xs">{reasonLabel}</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900">
                            {spb.items.length} item(s)
                          </td>
                          <td className="px-6 py-4 text-slate-600">{spb.staffName}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handlePrint(spb)}
                              className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg text-xs font-bold transition-all"
                              title="Print Surat Penarikan"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            onPageChange={setPage}
            perPage={perPage}
            onPerPageChange={setPerPage}
            itemLabel="penarikan"
          />
        </>
      )}

      {view === "create" && (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
          {/* Penarik + Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Penarik (Recipient) *
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Nama atau department"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Alasan *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as PenarikanReason)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                {PenarikanReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {reason === "Lainnya" && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Alasan (Free-form) *
              </label>
              <input
                type="text"
                value={alasanLainnya}
                onChange={(e) => setAlasanLainnya(e.target.value)}
                placeholder="e.g., dikembalikan ke supplier"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Catatan tambahan (opsional)"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <DocumentItemEditor
            products={products}
            sns={sns}
            value={formItems}
            onChange={setFormItems}
            errors={rowErrors}
            productFilter={(p) => !p.hidden}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => setView("list")}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider"
            >
              Batal
            </button>
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50"
            >
              {submitting ? "Membuat..." : "Buat"}
            </button>
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50"
            >
              {submitting ? "Membuat..." : "Buat & Print"}
            </button>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewPdfUrl && previewSpb && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 uppercase tracking-tight">
                Print Penarikan - {previewSpb.id}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const iframe = document.querySelector("iframe") as HTMLIFrameElement;
                    if (iframe?.contentWindow) iframe.contentWindow.print();
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-indigo-700"
                >
                  Print
                </button>
                <button
                  onClick={() => {
                    if (previewPdfUrl) URL.revokeObjectURL(previewPdfUrl);
                    setPreviewPdfUrl(null);
                    setPreviewSpb(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={previewPdfUrl}
                className="w-full h-full border-0"
                title="Surat Penarikan Print"
              />
            </div>
          </div>
        </div>
      )}

      {previewing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xl z-[90] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              <span className="font-bold text-slate-700">Generating PDF...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuratPenarikanView;
