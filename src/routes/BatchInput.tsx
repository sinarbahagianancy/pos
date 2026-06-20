import React, { useState, useEffect, useMemo, useRef } from "react";
import { BatchInput, Product, Supplier, BatchInputItem } from "../../app/types";
import { formatIDR, formatDate } from "../../app/utils/formatters";
import { RupiahInput } from "../../app/components/RupiahInput";
import Pagination from "../../app/components/Pagination";
import SearchableCombobox, {
  SearchableComboboxItem,
} from "../../app/components/SearchableCombobox";
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

// Per-row mode. The two variants have different field sets and are
// rendered differently. See ADR 0004 + CONTEXT.md 'Batch Input Form
// Design' for the spec.
type RowMode = "new" | "restock";

interface NewFormRow {
  key: string;
  mode: "new";
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
  snsText: string;
}

interface RestockFormRow {
  key: string;
  mode: "restock";
  // Picked product's id (BRC-...); empty string when not yet picked.
  // The product's brand/model/COGS/price/tax/warranty/category/condition
  // are read-only and inherited from the catalog.
  existingProductId: string;
  quantity: number;
  snsText: string; // required when picked product is SN; hidden when not
}

type FormRow = NewFormRow | RestockFormRow;

const isNewRow = (r: FormRow): r is NewFormRow => r.mode === "new";
const isRestockRow = (r: FormRow): r is RestockFormRow => r.mode === "restock";

const emptyNewRow = (): NewFormRow => ({
  key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  mode: "new",
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

const emptyRestockRow = (): RestockFormRow => ({
  key: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  mode: "restock",
  existingProductId: "",
  quantity: 1,
  snsText: "",
});

// New row is the default for the '+ Tambah Baris' button.
const emptyRow = (): FormRow => emptyNewRow();

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

  // Per-item mode is set by the server-side parser. Items with a
  // freshly-minted BRC-{ts}-{rand} productId are 'new'; anything else
  // (a pre-existing catalog productId) is 'restock'.
  const newUnitsForBatch = (b: BatchInput) =>
    b.items.filter((it) => it.mode === "new").reduce((sum, it) => sum + (it.quantity || 0), 0);

  const restockUnitsForBatch = (b: BatchInput) =>
    b.items.filter((it) => it.mode === "restock").reduce((sum, it) => sum + (it.quantity || 0), 0);

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

  // Recompute per-row duplicate-SKU errors for NEW rows only (restock
  // rows target existing products by design).
  useEffect(() => {
    if (view !== "create") return;
    const errors: Record<string, string> = {};
    rows.forEach((r) => {
      if (!isNewRow(r)) return; // restock rows don't have brand+model
      if (!r.brand.trim() && !r.model.trim()) return; // empty row, no error
      const clash = products.find(
        (p) =>
          !p.deleted &&
          (p.brand ?? "").trim().toLowerCase() === r.brand.trim().toLowerCase() &&
          p.model.trim().toLowerCase() === r.model.trim().toLowerCase(),
      );
      if (clash) {
        errors[r.key] =
          `Konflik dengan "${clash.brand} ${clash.model}" yang sudah ada di katalog (stok: ${clash.stock}). ` +
          `Hapus baris ini, perbaiki SKU, atau ganti Tipe ke "Restock" untuk menambah stok.`;
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

  // Replace a row wholesale (used for mode-toggle, which wipes the row).
  const replaceRow = (key: string, next: FormRow) => {
    setRows((rs) => rs.map((r) => (r.key === key ? next : r)));
  };

  // True if the row has any user-typed data. Used by the mode toggle to
  // decide whether to show a destructive-action confirm.
  const isRowNonEmpty = (r: FormRow): boolean => {
    if (isNewRow(r)) {
      return Boolean(
        r.brand.trim() ||
        r.model.trim() ||
        r.mount.trim() ||
        r.cogs > 0 ||
        r.price > 0 ||
        r.snsText.trim() ||
        r.quantity !== 1,
      );
    }
    return Boolean(r.existingProductId || r.snsText.trim() || r.quantity !== 1);
  };

  // Switch a row's mode. Wipes the row's content (the two modes have
  // non-overlapping field sets; carrying data across would either
  // silently mask typos or require expensive state-merging). Shows
  // a confirm if the row is non-empty.
  const handleSwitchMode = (key: string, target: RowMode) => {
    const row = rows.find((r) => r.key === key);
    if (!row) return;
    if (row.mode === target) return;
    if (isRowNonEmpty(row)) {
      const ok = window.confirm(
        `Baris ini berisi data yang akan hilang jika diganti ke mode "${target === "new" ? "Baru" : "Restock"}". Lanjutkan?`,
      );
      if (!ok) return;
    }
    const next: FormRow = target === "new" ? emptyNewRow() : emptyRestockRow();
    // Preserve the React key so React can track the same row across the toggle
    next.key = key;
    replaceRow(key, next);
  };

  // The updateRow function preserves the union's mode: we cast the patch
  // to `Partial<FormRow>` so the call site can pass any subset, but
  // TypeScript will catch attempts to set, e.g., `existingProductId` on
  // a `mode: "new"` row at the call-site level.
  const updateRow = (key: string, patch: Partial<FormRow>) => {
    setRows((rs) => rs.map((r) => (r.key === key ? ({ ...r, ...patch } as FormRow) : r)));
  };

  const handleSubmit = async () => {
    // Client-side: filter out completely empty rows
    const filledRows = rows.filter((r) => {
      if (isNewRow(r)) return r.brand.trim() || r.model.trim();
      return r.existingProductId !== ""; // restock row needs a product picked
    });
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
    // Per-row duplicate-SKU check (only relevant for new rows)
    if (Object.keys(rowErrors).length > 0) {
      showToast(
        "Ada baris yang konflik dengan katalog. Perbaiki atau hapus baris tersebut.",
        "error",
      );
      return;
    }

    // Build the per-row payload based on each row's mode.
    const itemsPayload = filledRows.map((r) => {
      if (isNewRow(r)) {
        return {
          mode: "new" as const,
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
        };
      }
      // restock row
      return {
        mode: "restock" as const,
        existingProductId: r.existingProductId,
        quantity: r.quantity,
        sns: r.snsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };
    });

    const payload: CreateBatchInputInput = {
      id: invoiceMasuk.trim(),
      supplier: supplier.trim(),
      date,
      notes: notes.trim() || undefined,
      staffName,
      items: itemsPayload as unknown as CreateBatchInputInput["items"],
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
                      <th className="px-6 py-5 text-center">Baru</th>
                      <th className="px-6 py-5 text-center">Restock</th>
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
                          {newUnitsForBatch(b) > 0 ? (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black">
                              {newUnitsForBatch(b)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {restockUnitsForBatch(b) > 0 ? (
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black">
                              {restockUnitsForBatch(b)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
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
                className={`bg-white rounded-[32px] border shadow-sm p-6 space-y-4 ${
                  r.mode === "restock" ? "border-indigo-200" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">
                      Produk #{idx + 1}
                    </h3>
                    {/* Tipe segmented control: switch between 'new' and 'restock' modes.
                        Wipes the row's content on switch (with confirm if non-empty). */}
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => handleSwitchMode(r.key, "new")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          r.mode === "new"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Baru
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchMode(r.key, "restock")}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          r.mode === "restock"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        Restock
                      </button>
                    </div>
                  </div>
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

                {/* RESTOCK row: product picker + qty + (SNs if product is SN) */}
                {r.mode === "restock" && (
                  <RestockRowFields
                    row={r}
                    products={products}
                    onChange={(patch) => updateRow(r.key, patch)}
                  />
                )}

                {/* NEW-product row: full attribute set (existing UI) */}
                {r.mode === "new" && (
                  <NewRowFields row={r} onChange={(patch) => updateRow(r.key, patch)} />
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
              {newUnitsForBatch(summaryBatch)} barang baru, {restockUnitsForBatch(summaryBatch)}{" "}
              restock
            </p>
            <p className="text-xs text-emerald-600 mt-1 font-mono">
              Invoice: {summaryBatch.id} • Supplier: {summaryBatch.supplier}
            </p>
          </div>

          {/* Barang Baru sub-table — hidden when empty */}
          {newUnitsForBatch(summaryBatch) > 0 && (
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  Barang Baru ({newUnitsForBatch(summaryBatch)})
                </h3>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                  Produk baru
                </span>
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
                    {summaryBatch.items
                      .filter((it) => it.mode === "new")
                      .map((it) => (
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
          )}

          {/* Restock sub-table — hidden when empty */}
          {restockUnitsForBatch(summaryBatch) > 0 && (
            <div className="bg-white rounded-[40px] border border-indigo-200 shadow-sm overflow-hidden">
              <div className="p-6 lg:p-8 border-b border-indigo-100 bg-indigo-50/50 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  Restock ({restockUnitsForBatch(summaryBatch)})
                </h3>
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest bg-indigo-100 px-3 py-1 rounded-full">
                  Stok ditambah
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4 text-center">Qty</th>
                      <th className="px-6 py-4">SNs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summaryBatch.items
                      .filter((it) => it.mode === "restock")
                      .map((it) => (
                        <tr key={it.id} className="hover:bg-slate-50">
                          <td className="px-6 py-3 text-sm font-bold text-slate-900">
                            {it.brand || ""} {it.model}
                          </td>
                          <td className="px-6 py-3 text-center text-sm font-bold">{it.quantity}</td>
                          <td className="px-6 py-3 text-xs font-mono text-slate-500">
                            {it.sns.length > 0 ? it.sns.join(", ") : "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                <div className="overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-6">
                  {/* Barang Baru sub-table — hidden when empty */}
                  {newUnitsForBatch(detailBatch) > 0 && (
                    <div>
                      <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">
                        Barang Baru ({newUnitsForBatch(detailBatch)})
                      </h3>
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest">
                          <tr>
                            <th className="px-4 py-3">Product ID</th>
                            <th className="px-4 py-3">Brand</th>
                            <th className="px-4 py-3">Model</th>
                            <th className="px-4 py-3 text-center">Qty</th>
                            <th className="px-4 py-3 text-right">Harga</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailBatch.items
                            .filter((it) => it.mode === "new")
                            .map((it: BatchInputItem) => (
                              <tr key={it.id}>
                                <td className="px-4 py-3 font-mono text-xs">{it.productId}</td>
                                <td className="px-4 py-3 text-sm">{it.brand || "—"}</td>
                                <td className="px-4 py-3 text-sm font-bold">{it.model}</td>
                                <td className="px-4 py-3 text-center text-sm font-bold">
                                  {it.quantity}
                                </td>
                                <td className="px-4 py-3 text-right text-sm font-bold">
                                  {formatIDR(it.price)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Restock sub-table — hidden when empty */}
                  {restockUnitsForBatch(detailBatch) > 0 && (
                    <div>
                      <h3 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-3">
                        Restock ({restockUnitsForBatch(detailBatch)})
                      </h3>
                      <table className="w-full text-left">
                        <thead className="bg-indigo-50 text-indigo-700 uppercase text-[10px] font-black tracking-widest">
                          <tr>
                            <th className="px-4 py-3">Product</th>
                            <th className="px-4 py-3 text-center">Qty</th>
                            <th className="px-4 py-3">SNs</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailBatch.items
                            .filter((it) => it.mode === "restock")
                            .map((it: BatchInputItem) => (
                              <tr key={it.id}>
                                <td className="px-4 py-3 text-sm font-bold">
                                  {it.brand || ""} {it.model}
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-bold">
                                  {it.quantity}
                                </td>
                                <td className="px-4 py-3 text-xs font-mono text-slate-500">
                                  {it.sns.length > 0 ? it.sns.join(", ") : "—"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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

// ============================================================
// Per-mode row sub-components
// ============================================================

interface NewRowFieldsProps {
  row: NewFormRow;
  onChange: (patch: Partial<NewFormRow>) => void;
}

const NewRowFields: React.FC<NewRowFieldsProps> = ({ row, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Brand
          </label>
          <input
            type="text"
            value={row.brand}
            onChange={(e) => onChange({ brand: e.target.value })}
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
            value={row.model}
            onChange={(e) => onChange({ model: e.target.value })}
            placeholder="e.g., A7 IV"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Kategori
          </label>
          <select
            value={row.category}
            onChange={(e) => onChange({ category: e.target.value })}
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
            value={row.condition}
            onChange={(e) => onChange({ condition: e.target.value })}
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
            value={row.mount}
            onChange={(e) => onChange({ mount: e.target.value })}
            placeholder="e.g., E-mount"
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Tipe Garansi
          </label>
          <select
            value={row.warrantyType}
            onChange={(e) => onChange({ warrantyType: e.target.value })}
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
            value={row.warrantyMonths}
            onChange={(e) => onChange({ warrantyMonths: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={row.taxEnabled}
              onChange={(e) => onChange({ taxEnabled: e.target.checked })}
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
            value={row.cogs}
            onChange={(v) => onChange({ cogs: v })}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Harga Jual
          </label>
          <RupiahInput
            value={row.price}
            onChange={(v) => onChange({ price: v })}
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
            value={row.quantity}
            onChange={(e) => onChange({ quantity: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={row.hasSerialNumber}
              onChange={(e) => onChange({ hasSerialNumber: e.target.checked, snsText: "" })}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
              Punya Serial Number
            </span>
          </label>
        </div>
      </div>

      {row.hasSerialNumber && (
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Serial Numbers ({row.quantity} baris, satu SN per baris)
          </label>
          <textarea
            value={row.snsText}
            onChange={(e) => onChange({ snsText: e.target.value })}
            rows={Math.min(8, Math.max(3, row.quantity))}
            placeholder={"SN1\nSN2\nSN3"}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Baris kosong diabaikan. Total SN harus sama dengan Qty.
          </p>
        </div>
      )}
    </div>
  );
};

interface RestockRowFieldsProps {
  row: RestockFormRow;
  products: Product[];
  onChange: (patch: Partial<RestockFormRow>) => void;
}

const RestockRowFields: React.FC<RestockRowFieldsProps> = ({ row, products, onChange }) => {
  // Build the searchable-combobox items from the catalog. Group SN
  // and non-SN products separately so the user can see the distinction
  // upfront. Soft-deleted products are excluded.
  const productItems: SearchableComboboxItem[] = useMemo(() => {
    const items: SearchableComboboxItem[] = [];
    for (const p of products) {
      if (p.deleted) continue;
      items.push({
        id: p.id,
        label: `${p.brand || ""} ${p.model}`.trim(),
        group: p.hasSerialNumber ? "Nomor Seri" : "Tanpa Nomor Seri",
      });
    }
    return items;
  }, [products]);

  const picked = row.existingProductId
    ? products.find((p) => p.id === row.existingProductId) || null
    : null;
  const pickedIsSN = picked?.hasSerialNumber === true;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Produk *
          </label>
          <SearchableCombobox
            items={productItems}
            value={row.existingProductId}
            onChange={(id) => onChange({ existingProductId: id, snsText: "" })}
            placeholder="Cari produk..."
            emptyMessage="Tidak ada produk"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Qty *
          </label>
          <input
            type="number"
            min={1}
            value={row.quantity}
            onChange={(e) => onChange({ quantity: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {picked && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600">
          <span className="font-black text-slate-700">
            {picked.brand} {picked.model}
          </span>
          {" • "}
          <span>
            Stok saat ini: <b>{picked.stock}</b>
          </span>
          {" • "}
          <span>
            Supplier perkenalan: <b>{picked.supplier || "—"}</b>
          </span>
          {pickedIsSN && (
            <div className="mt-1 text-amber-700">
              Produk ini punya Serial Number. Satu SN per unit akan ditambahkan.
            </div>
          )}
        </div>
      )}

      {pickedIsSN && (
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Serial Numbers ({row.quantity} baris, satu SN per baris)
          </label>
          <textarea
            value={row.snsText}
            onChange={(e) => onChange({ snsText: e.target.value })}
            rows={Math.min(8, Math.max(3, row.quantity))}
            placeholder={"SN1\nSN2\nSN3"}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            Baris kosong diabaikan. Total SN harus sama dengan Qty. SN yang sudah ada di sistem akan
            ditolak.
          </p>
        </div>
      )}
    </div>
  );
};

export default BatchInputView;
