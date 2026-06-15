import React, { useState, useEffect, useMemo } from "react";
import { Product, Supplier, BatchInput } from "../../app/types";
import { formatIDR, formatDate } from "../../app/utils/formatters";
import Pagination from "../../app/components/Pagination";
import {
  getAllBatchInput,
  getBatchInputById,
  createBatchInput,
  CreateBatchInputInput,
} from "../../app/services/batchInput.api";

interface BatchInputTabProps {
  products: Product[];
  suppliers: Supplier[];
  staffName: string;
}

const BatchInputTab: React.FC<BatchInputTabProps> = ({ products, suppliers, staffName }) => {
  const [view, setView] = useState<"list" | "create">("list");

  // List state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [batches, setBatches] = useState<BatchInput[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Create form state
  const [invoiceMasuk, setInvoiceMasuk] = useState("");
  const [supplier, setSupplier] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [formItems, setFormItems] = useState<
    Array<{
      productId: string;
      model: string;
      brand?: string;
      quantity: number;
      sns: string[];
      cogs: number;
      price: number;
    }>
  >([]);
  const [submitting, setSubmitting] = useState(false);

  // Detail modal
  const [detailBatch, setDetailBatch] = useState<BatchInput | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, search]);

  // Reset form when entering create
  useEffect(() => {
    if (view === "create") {
      setInvoiceMasuk("");
      setSupplier(suppliers[0]?.name || "");
      setDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setFormItems([]);
    } else if (suppliers.length > 0 && !supplier) {
      setSupplier(suppliers[0].name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, suppliers.length]);

  const handleAddItem = () => {
    setFormItems([
      ...formItems,
      { productId: "", model: "", brand: undefined, quantity: 1, sns: [], cogs: 0, price: 0 },
    ]);
  };

  const handleItemChange = (
    idx: number,
    field: "productId" | "quantity" | "cogs" | "price" | "sns",
    value: string | string[],
  ) => {
    const next = [...formItems];
    const item = { ...next[idx] };
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      item.productId = String(value);
      item.model = product?.model ?? "";
      item.brand = product?.brand;
      // Auto-fill COGS and Price from product
      item.cogs = product?.cogs ?? 0;
      item.price = product?.price ?? 0;
      item.sns = [];
    } else if (field === "quantity") {
      item.quantity = parseInt(String(value), 10) || 0;
    } else if (field === "cogs") {
      item.cogs = parseInt(String(value), 10) || 0;
    } else if (field === "price") {
      item.price = parseInt(String(value), 10) || 0;
    } else if (field === "sns") {
      item.sns = Array.isArray(value) ? value : [];
    }
    next[idx] = item;
    setFormItems(next);
  };

  const handleSnsChange = (idx: number, snsText: string) => {
    const sns = snsText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    handleItemChange(idx, "sns", sns);
  };

  const handleRemoveItem = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!invoiceMasuk.trim()) {
      showToast("Nomor Invoice Masuk is required", "error");
      return;
    }
    if (!supplier.trim()) {
      showToast("Supplier is required", "error");
      return;
    }
    if (formItems.length === 0) {
      showToast("Batch Input must have at least 1 item", "error");
      return;
    }
    for (const it of formItems) {
      if (!it.productId) {
        showToast("All items must have a product selected", "error");
        return;
      }
      if (it.quantity < 1) {
        showToast("All items must have quantity >= 1", "error");
        return;
      }
      const product = products.find((p) => p.id === it.productId);
      if (product?.hasSerialNumber && it.sns.length !== it.quantity) {
        showToast(
          `SN count mismatch for ${product.model}: need ${it.quantity}, got ${it.sns.length}`,
          "error",
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: CreateBatchInputInput = {
        id: invoiceMasuk.trim(),
        supplier: supplier.trim(),
        date: new Date(date).toISOString(),
        notes: notes.trim() || undefined,
        staffName,
        items: formItems.map((it) => ({
          productId: it.productId,
          brand: it.brand,
          model: it.model,
          quantity: it.quantity,
          sns: it.sns,
          cogs: it.cogs,
          price: it.price,
        })),
      };
      const created = await createBatchInput(payload);
      showToast(`Batch Input ${created.id} berhasil disimpan`, "success");
      setView("list");
      loadList();
    } catch (err) {
      showToast(`Gagal membuat Batch Input: ${String(err)}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewDetail = async (batch: BatchInput) => {
    setDetailLoading(true);
    try {
      const fresh = await getBatchInputById(batch.id);
      setDetailBatch(fresh);
    } catch (err) {
      showToast(`Gagal memuat detail: ${String(err)}`, "error");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white font-bold text-sm`}
        >
          {toast.message}
        </div>
      )}

      {view === "list" ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                Batch Input Barang
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Catat restock dari supplier dengan satu Nomor Invoice Masuk
              </p>
            </div>
            <button
              onClick={() => setView("create")}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700"
            >
              + Batch Input Baru
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Cari nomor invoice atau supplier..."
                  className="w-full px-4 py-3 pl-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">No. Invoice Masuk</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4 text-right">Items</th>
                    <th className="px-6 py-4">Staff</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        Loading...
                      </td>
                    </tr>
                  ) : batches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        {search ? "Tidak ada hasil pencarian" : "Belum ada Batch Input"}
                      </td>
                    </tr>
                  ) : (
                    batches.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          <span className="font-mono font-black px-3 py-1 rounded-lg text-xs text-emerald-600 bg-emerald-50">
                            {b.id}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-900 uppercase">
                          {b.supplier}
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-900">{formatDate(b.date)}</td>
                        <td className="px-6 py-3 text-right font-bold text-slate-900">
                          {b.items.length} item(s)
                        </td>
                        <td className="px-6 py-3 text-slate-600">{b.staffName}</td>
                        <td className="px-6 py-3 text-center">
                          <button
                            onClick={() => handleViewDetail(b)}
                            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg text-xs font-bold transition-all"
                            title="Lihat Detail"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
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
            itemLabel="batch input"
          />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              Batch Input Baru
            </h2>
            <button
              onClick={() => setView("list")}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200"
            >
              ← Kembali
            </button>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Nomor Invoice Masuk *
                </label>
                <input
                  type="text"
                  value={invoiceMasuk}
                  onChange={(e) => setInvoiceMasuk(e.target.value)}
                  placeholder="Supplier's invoice number"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Supplier *
                </label>
                <select
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {suppliers.length === 0 && <option value="">(Belum ada supplier)</option>}
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
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
            </div>

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

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  Items
                </h3>
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase hover:bg-slate-800"
                >
                  + Tambah Item
                </button>
              </div>
              {formItems.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                  Klik "+ Tambah Item" untuk menambahkan barang
                </div>
              ) : (
                <div className="space-y-3">
                  {formItems.map((item, idx) => {
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 p-3 border border-slate-200 rounded-xl"
                      >
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                          className="col-span-4 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        >
                          <option value="">-- Pilih Produk --</option>
                          {products
                            .filter((p) => !p.hidden && !p.deleted)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.brand} {p.model}
                              </option>
                            ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity || ""}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          placeholder="Qty"
                          className="col-span-1 px-2 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                        {product?.hasSerialNumber ? (
                          <textarea
                            value={item.sns.join("\n")}
                            onChange={(e) => handleSnsChange(idx, e.target.value)}
                            placeholder={`SNs (satu per baris, ${item.quantity} total)`}
                            rows={Math.min(Math.max(item.quantity, 1), 4)}
                            className="col-span-3 px-2 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                          />
                        ) : (
                          <div className="col-span-3 px-2 py-2 text-xs text-slate-400 italic flex items-center">
                            (non-SN product)
                          </div>
                        )}
                        <input
                          type="number"
                          min={0}
                          value={item.cogs || ""}
                          onChange={(e) => handleItemChange(idx, "cogs", e.target.value)}
                          placeholder="COGS"
                          className="col-span-1 px-2 py-2 border border-slate-200 rounded-lg text-sm tabular-nums"
                        />
                        <input
                          type="number"
                          min={0}
                          value={item.price || ""}
                          onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                          placeholder="Harga Jual"
                          className="col-span-1 px-2 py-2 border border-slate-200 rounded-lg text-sm tabular-nums"
                        />
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="col-span-2 px-2 text-red-500 hover:bg-red-50 rounded-lg text-xs"
                        >
                          ✕ Hapus
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={() => setView("list")}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan & Integrasikan ke Inventory"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {detailBatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4">
          <div
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-lg tracking-tight">
                  Batch Input {detailBatch.id}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {detailBatch.supplier} • {formatDate(detailBatch.date)} • Staff{" "}
                  {detailBatch.staffName}
                </p>
              </div>
              <button
                onClick={() => setDetailBatch(null)}
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
            <div className="flex-1 overflow-y-auto p-6">
              {detailBatch.notes && (
                <p className="text-sm text-slate-600 mb-4 italic">{detailBatch.notes}</p>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-200">
                    <th className="text-left py-2">Model</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-left py-2 pl-2">SNs</th>
                    <th className="text-right py-2">COGS</th>
                    <th className="text-right py-2">Harga Jual</th>
                  </tr>
                </thead>
                <tbody>
                  {detailBatch.items.map((it) => (
                    <tr key={it.id} className="border-b border-slate-100">
                      <td className="py-3">
                        <p className="font-bold text-slate-900 uppercase">{it.model}</p>
                        {it.brand && (
                          <p className="text-[10px] text-slate-500 uppercase">{it.brand}</p>
                        )}
                      </td>
                      <td className="text-center py-3 text-slate-700">{it.quantity}</td>
                      <td className="py-3 pl-2">
                        {it.sns.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {it.sns.map((sn, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold"
                              >
                                {sn}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">non-SN</span>
                        )}
                      </td>
                      <td className="text-right py-3 text-slate-700 tabular-nums">
                        {formatIDR(it.cogs)}
                      </td>
                      <td className="text-right py-3 text-slate-900 font-bold tabular-nums">
                        {formatIDR(it.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setDetailBatch(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
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
              <span className="font-bold text-slate-700">Loading detail...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchInputTab;
