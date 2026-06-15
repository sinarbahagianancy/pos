import React, { useState, useEffect, useMemo } from "react";
import { BatchInput, Product, Supplier, BatchInputItem } from "../../app/types";
import { formatIDR, formatDate } from "../../app/utils/formatters";
import { RupiahInput } from "../../app/components/RupiahInput";
import Pagination from "../../app/components/Pagination";
import {
  getAllBatchInput,
  getBatchInputById,
  createBatchInput,
  CreateBatchInputInput,
} from "../../app/services/batchInput.api";

type ViewMode = "list" | "create" | "summary";

// Batch Input restricts the warranty options to these three. The DB enum
// has six values (the three 'Official ... Indonesia' options + these
// three), but those are reserved for products with branded official
// warranties — a batch input from a generic supplier is none of those.
const WARRANTY_TYPES = ["Distributor", "Toko", "No Warranty"];
const CATEGORIES = ["Body", "Lens", "Accessory"];
const CONDITIONS = ["New", "Used"];

interface FormRow {
  key: string; // local React key, not sent to server
  brand: string;
  model: string;
  category: string;
  condition: string;
  mount: string;
  warrantyType: string;
  warrantyMonths: number;
  taxEnabled: boolean;
  cogs: number;
  price: number;
  quantity: number;
  hasSerialNumber: boolean;
  snsText: string; // textarea string, parsed to string[] on submit
}

const emptyRow = (): FormRow => ({
  key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  brand: "",
  model: "",
  category: "Body",
  condition: "New",
  mount: "",
  warrantyType: "Distributor",
  warrantyMonths: 12,
  taxEnabled: true,
  cogs: 0,
  price: 0,
  quantity: 1,
  hasSerialNumber: false,
  snsText: "",
});

interface BatchInputViewProps {
  products: Product[];
  suppliers: Supplier[];
  staffName: string;
}

const BatchInputView: React.FC<BatchInputViewProps> = ({ products, suppliers, staffName }) => {
  const [view, setView] = useState<ViewMode>("list");

  // List state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [batches, setBatches] = useState<BatchInput[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Create form state (batch-level)
  const [invoiceMasuk, setInvoiceMasuk] = useState("");
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<FormRow[]>([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  // Summary state (post-submit)
  const [summaryBatch, setSummaryBatch] = useState<BatchInput | null>(null);

  // Detail modal state
  const [detailBatch, setDetailBatch] = useState<BatchInput | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ============================================================
  // List
  // ============================================================
  const loadList = async () => {
    setLoading(true);
    try {
      const result = await getAllBatchInput({ page, limit: perPage, search });
      setBatches(result.batchInputs);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      showToast(`Gagal memuat daftar Batch Input: ${String(err)}`, "error");
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

  const totalUnitsForBatch = (b: BatchInput) =>
    b.items.reduce((sum, it) => sum + (it.quantity || 0), 0);

  // ============================================================
  // Detail modal
  // ============================================================
  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const b = await getBatchInputById(id);
      setDetailBatch(b);
    } catch (err) {
      showToast(`Gagal memuat detail: ${String(err)}`, "error");
    } finally {
      setDetailLoading(false);
    }
  };

  // ============================================================
  // Create form
  // ============================================================
  const resetForm = () => {
    setInvoiceMasuk("");
    setSupplier("");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setRows([emptyRow()]);
    setRowErrors({});
  };

  const goToCreate = () => {
    resetForm();
    setView("create");
  };

  const goBackToList = () => {
    setView("list");
    setSummaryBatch(null);
    loadList();
  };

  // Recompute per-row duplicate-SKU errors whenever rows or products change
  useEffect(() => {
    if (view !== "create") return;
    const errors: Record<string, string> = {};
    rows.forEach((r) => {
      if (!r.brand.trim() && !r.model.trim()) return; // empty row, no error
      const clash = products.find(
        (p) =>
          !p.deleted &&
          (p.brand ?? "").trim().toLowerCase() === r.brand.trim().toLowerCase() &&
          p.model.trim().toLowerCase() === r.model.trim().toLowerCase(),
      );
      if (clash) {
        errors[r.key] =
          `Konflik dengan "${clash.brand} ${clash.model}" yang sudah ada di katalog (stok: ${clash.stock}). Hapus baris ini atau perbaiki SKU.`;
      }
    });
    setRowErrors(errors);
  }, [rows, products, view]);

  const handleAddRow = () => {
    setRows((rs) => [...rs, emptyRow()]);
  };

  const handleRemoveRow = (key: string) => {
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((r) => r.key !== key)));
  };

  const updateRow = (key: string, patch: Partial<FormRow>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const handleSubmit = async () => {
    // Client-side: filter out completely empty rows
    const filledRows = rows.filter((r) => r.brand.trim() || r.model.trim());
    if (filledRows.length === 0) {
      showToast("Minimal satu baris produk harus diisi", "error");
      return;
    }
    if (!invoiceMasuk.trim()) {
      showToast("Nomor Invoice Masuk wajib diisi", "error");
      return;
    }
    if (!supplier.trim()) {
      showToast("Supplier wajib dipilih", "error");
      return;
    }
    // Per-row duplicate-SKU check
    if (Object.keys(rowErrors).length > 0) {
      showToast(
        "Ada baris yang konflik dengan katalog. Perbaiki atau hapus baris tersebut.",
        "error",
      );
      return;
    }

    const itemsPayload = filledRows.map((r) => ({
      brand: r.brand.trim() || undefined,
      model: r.model.trim(),
      category: r.category,
      condition: r.condition,
      mount: r.mount.trim() || undefined,
      warrantyType: r.warrantyType,
      warrantyMonths: r.warrantyMonths,
      cogs: r.cogs,
      price: r.price,
      hasSerialNumber: r.hasSerialNumber,
      taxEnabled: r.taxEnabled,
      quantity: r.quantity,
      sns: r.hasSerialNumber
        ? r.snsText
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    }));

    const payload: CreateBatchInputInput = {
      id: invoiceMasuk.trim(),
      supplier: supplier.trim(),
      date,
      notes: notes.trim() || undefined,
      staffName,
      items: itemsPayload,
    };

    setSubmitting(true);
    try {
      const result = await createBatchInput(payload);
      setSummaryBatch(result);
      setView("summary");
    } catch (err) {
      showToast(`Gagal membuat Batch Input: ${String(err)}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase">
            Batch Input Barang
          </h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight mt-1">
            {view === "list"
              ? "Riwayat penerimaan barang baru dari supplier"
              : view === "create"
                ? "Buat batch input baru — masukkan banyak produk sekaligus via satu invoice supplier"
                : "Batch berhasil dibuat"}
          </p>
        </div>
        {view === "list" && (
          <button
            onClick={goToCreate}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all w-full sm:w-auto self-start sm:self-auto"
          >
            Tambah Batch Input
          </button>
        )}
        {view === "create" && (
          <button
            onClick={goBackToList}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all w-full sm:w-auto self-start sm:self-auto"
          >
            ← Kembali ke Log
          </button>
        )}
        {view === "summary" && (
          <button
            onClick={goBackToList}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all w-full sm:w-auto self-start sm:self-auto"
          >
            Kembali ke Log
          </button>
        )}
      </div>

      {/* LIST MODE */}
      {view === "list" && (
        <>
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
              <input
                type="text"
                placeholder="Cari nomor invoice, supplier, atau catatan..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder-slate-500 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold shadow-sm"
              />
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Memuat...</div>
            ) : batches.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Belum ada Batch Input. Klik "Tambah Batch Input" untuk membuat yang pertama.
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[900px]">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-5">No. Invoice Masuk</th>
                      <th className="px-6 py-5">Tanggal</th>
                      <th className="px-6 py-5">Supplier</th>
                      <th className="px-6 py-5 text-center">Total Unit</th>
                      <th className="px-6 py-5">Staff</th>
                      <th className="px-6 py-5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm font-bold text-slate-900">
                          {b.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{formatDate(b.date)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{b.supplier}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black">
                            {totalUnitsForBatch(b)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{b.staffName}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => openDetail(b.id)}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-all"
                          >
                            Lihat Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="p-6 border-t border-slate-100">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={total}
                  perPage={perPage}
                  onPageChange={setPage}
                  onPerPageChange={setPerPage}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* CREATE MODE */}
      {view === "create" && (
        <div className="space-y-6">
          {/* Batch header card */}
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-6 lg:p-8 space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
              Info Batch
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Nomor Invoice Masuk *
                </label>
                <input
                  type="text"
                  value={invoiceMasuk}
                  onChange={(e) => setInvoiceMasuk(e.target.value)}
                  placeholder="e.g., INV-2026-001"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Nomor ini menjadi ID batch. Wajib unik.
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Supplier *
                </label>
                <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="">Pilih supplier...</option>
                  {suppliers
                    .filter((s) => !s.deleted)
                    .map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                </select>
                {suppliers.filter((s) => !s.deleted).length === 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    Belum ada supplier. Tambahkan di halaman Suppliers terlebih dahulu.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Catatan (opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan batch (opsional)"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Per-row cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Produk ({rows.length} baris)
              </h2>
              <button
                onClick={handleAddRow}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase hover:bg-slate-800"
              >
                + Tambah Baris
              </button>
            </div>

            {rows.map((r, idx) => (
              <div
                key={r.key}
                className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                    Produk #{idx + 1}
                  </h3>
                  {rows.length > 1 && (
                    <button
                      onClick={() => handleRemoveRow(r.key)}
                      className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-700"
                    >
                      Hapus Baris
                    </button>
                  )}
                </div>

                {rowErrors[r.key] && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-700 font-medium">
                    {rowErrors[r.key]}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={r.brand}
                      onChange={(e) => updateRow(r.key, { brand: e.target.value })}
                      placeholder="e.g., Sony"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Model *
                    </label>
                    <input
                      type="text"
                      value={r.model}
                      onChange={(e) => updateRow(r.key, { model: e.target.value })}
                      placeholder="e.g., A7 IV"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Kategori
                    </label>
                    <select
                      value={r.category}
                      onChange={(e) => updateRow(r.key, { category: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Kondisi
                    </label>
                    <select
                      value={r.condition}
                      onChange={(e) => updateRow(r.key, { condition: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Mount (opsional)
                    </label>
                    <input
                      type="text"
                      value={r.mount}
                      onChange={(e) => updateRow(r.key, { mount: e.target.value })}
                      placeholder="e.g., E-mount"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Tipe Garansi
                    </label>
                    <select
                      value={r.warrantyType}
                      onChange={(e) => updateRow(r.key, { warrantyType: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                    >
                      {WARRANTY_TYPES.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Masa Garansi (bulan)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={r.warrantyMonths}
                      onChange={(e) =>
                        updateRow(r.key, { warrantyMonths: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={r.taxEnabled}
                        onChange={(e) => updateRow(r.key, { taxEnabled: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                        Kena PPN
                      </span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      COGS (Modal)
                    </label>
                    <RupiahInput
                      value={r.cogs}
                      onChange={(v) => updateRow(r.key, { cogs: v })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Harga Jual
                    </label>
                    <RupiahInput
                      value={r.price}
                      onChange={(v) => updateRow(r.key, { price: v })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Qty *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={r.quantity}
                      onChange={(e) =>
                        updateRow(r.key, { quantity: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={r.hasSerialNumber}
                        onChange={(e) =>
                          updateRow(r.key, { hasSerialNumber: e.target.checked, snsText: "" })
                        }
                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                        Punya Serial Number
                      </span>
                    </label>
                  </div>
                </div>

                {r.hasSerialNumber && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Serial Numbers ({r.quantity} baris, satu SN per baris)
                    </label>
                    <textarea
                      value={r.snsText}
                      onChange={(e) => updateRow(r.key, { snsText: e.target.value })}
                      rows={Math.min(8, Math.max(3, r.quantity))}
                      placeholder={"SN1\nSN2\nSN3"}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Baris kosong diabaikan. Total SN harus sama dengan Qty.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 -mx-6 px-6 py-4 lg:-mx-8 lg:px-8 shadow-lg">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
              <button
                onClick={goBackToList}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan Batch"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUMMARY MODE */}
      {view === "summary" && summaryBatch && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-[32px] p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-black text-emerald-900 uppercase tracking-tight">
              Batch Berhasil Dibuat
            </h2>
            <p className="text-sm text-emerald-700 mt-2 font-medium">
              {summaryBatch.items.length} produk baru ditambahkan ke katalog
            </p>
            <p className="text-xs text-emerald-600 mt-1 font-mono">
              Invoice: {summaryBatch.id} • Supplier: {summaryBatch.supplier}
            </p>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Produk yang Baru Dibuat
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Product ID</th>
                    <th className="px-6 py-4">Brand</th>
                    <th className="px-6 py-4">Model</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Harga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaryBatch.items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono text-xs font-bold text-slate-900">
                        {it.productId}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-700">{it.brand || "—"}</td>
                      <td className="px-6 py-3 text-sm font-bold text-slate-900">{it.model}</td>
                      <td className="px-6 py-3 text-center text-sm font-bold">{it.quantity}</td>
                      <td className="px-6 py-3 text-right text-sm font-bold text-slate-900">
                        {formatIDR(it.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {(detailBatch || detailLoading) && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {detailLoading ? (
              <div className="p-12 text-center text-slate-400 text-sm">Memuat detail...</div>
            ) : detailBatch ? (
              <>
                <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                      Detail Batch Input
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-1">{detailBatch.id}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(detailBatch.date)} • {detailBatch.supplier} • oleh{" "}
                      {detailBatch.staffName}
                    </p>
                    {detailBatch.notes && (
                      <p className="text-xs text-slate-500 mt-1 italic">"{detailBatch.notes}"</p>
                    )}
                  </div>
                  <button
                    onClick={() => setDetailBatch(null)}
                    className="p-2 hover:bg-slate-200 rounded-full transition-all"
                  >
                    <svg
                      className="w-5 h-5 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="overflow-y-auto custom-scrollbar p-6 lg:p-8">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                      <tr>
                        <th className="px-4 py-3">Brand</th>
                        <th className="px-4 py-3">Model</th>
                        <th className="px-4 py-3">Kategori</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3">SNs</th>
                        <th className="px-4 py-3 text-right">Harga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailBatch.items.map((it: BatchInputItem) => (
                        <tr key={it.id}>
                          <td className="px-4 py-3 text-sm">{it.brand || "—"}</td>
                          <td className="px-4 py-3 text-sm font-bold">{it.model}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{it.category}</td>
                          <td className="px-4 py-3 text-center text-sm font-bold">{it.quantity}</td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-500">
                            {it.sns.length > 0 ? it.sns.join(", ") : "—"}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold">
                            {formatIDR(it.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[200] px-6 py-4 rounded-2xl shadow-2xl text-sm font-bold ${
            toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default BatchInputView;
