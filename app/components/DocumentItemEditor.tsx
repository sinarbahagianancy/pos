import React, { useState, useMemo } from "react";
import { Product, SerialNumber } from "../types";
import SNPickerModal from "./SNPickerModal";

/**
 * A single row in the document item form.
 * Shape adapts based on the picked product's `hasSerialNumber`:
 *   - empty row (no product): { productId: "" }
 *   - SN product: { productId, selectedSNs: string[] }
 *   - non-SN product: { productId, quantity: number }
 */
export type DocumentFormItem = {
  productId: string;
  quantity?: number;
  selectedSNs?: string[];
};

interface DocumentItemEditorProps {
  products: Product[];
  sns: SerialNumber[];
  value: DocumentFormItem[];
  onChange: (items: DocumentFormItem[]) => void;
  /** Per-row error messages. Set by the page during submit. */
  errors?: Record<number, string>;
  /**
   * Optional product filter. SJ passes `p => !p.hidden && p.stock > 0`
   * to restrict to in-stock products; SPB passes `p => !p.hidden` to
   * allow withdrawal of any product.
   */
  productFilter?: (p: Product) => boolean;
  /** Section title shown above the rows. */
  sectionTitle?: string;
  /** Add-button text. */
  addButtonLabel?: string;
  /** Empty-state message. */
  emptyStateMessage?: string;
}

const DocumentItemEditor: React.FC<DocumentItemEditorProps> = ({
  products,
  sns,
  value,
  onChange,
  errors,
  productFilter,
  sectionTitle = "Items",
  addButtonLabel = "+ Tambah Item",
  emptyStateMessage = 'Klik "+ Tambah Item" untuk menambahkan barang',
}) => {
  const [openModalRowIdx, setOpenModalRowIdx] = useState<number | null>(null);

  // Form-wide dedup: every SN currently picked in any row.
  const pickedSNsAcrossForm = useMemo(() => {
    const set = new Set<string>();
    value.forEach((it) => {
      (it.selectedSNs ?? []).forEach((sn) => set.add(sn));
    });
    return set;
  }, [value]);

  const filteredProducts = useMemo(() => {
    const filter = productFilter ?? ((p: Product) => !p.hidden);
    return products.filter((p) => {
      if (!filter(p)) return false;
      // Universal rule: an SN product with 0 "In Stock" SNs is
      // un-submittable in any flow (the picker modal would open with
      // 0 visible SNs and the row would fail per-row validation), so
      // we hide it from the dropdown on both SJ and SPB. See CONTEXT.md
      // -> Document Item Form Shape -> SN products with zero
      // "In Stock" SNs are always excluded from the dropdown.
      if (p.hasSerialNumber) {
        return sns.some((s) => s.productId === p.id && s.status === "In Stock");
      }
      return true;
    });
  }, [products, sns, productFilter]);

  // Split by hasSerialNumber for the optgrouped product dropdown.
  // Empty groups (one category has no available products) are omitted
  // from the rendered dropdown.
  const { snProducts, nonSNProducts } = useMemo(() => {
    const sn: Product[] = [];
    const nonSn: Product[] = [];
    filteredProducts.forEach((p) => {
      if (p.hasSerialNumber) sn.push(p);
      else nonSn.push(p);
    });
    return { snProducts: sn, nonSNProducts: nonSn };
  }, [filteredProducts]);

  // ---- Mutators ----
  const updateItem = (idx: number, patch: Partial<DocumentFormItem>) => {
    onChange(value.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => {
    if (openModalRowIdx === idx) setOpenModalRowIdx(null);
    onChange(value.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    onChange([...value, { productId: "" }]);
  };

  /**
   * Change the product of a row. Resets the row's per-product state
   * (selectedSNs for SN products, quantity for non-SN) so the shape
   * always matches the picked product's hasSerialNumber.
   */
  const handleProductChange = (idx: number, newProductId: string) => {
    if (newProductId === "") {
      onChange(value.map((it, i) => (i === idx ? { productId: "" } : it)));
    } else {
      const product = products.find((p) => p.id === newProductId);
      if (!product) return;
      if (product.hasSerialNumber) {
        onChange(
          value.map((it, i) => (i === idx ? { productId: newProductId, selectedSNs: [] } : it)),
        );
      } else {
        onChange(value.map((it, i) => (i === idx ? { productId: newProductId, quantity: 1 } : it)));
      }
    }
    // Close the modal if it was open for this row, since the product
    // (and therefore the available SNs) may have changed.
    if (openModalRowIdx === idx) {
      setOpenModalRowIdx(null);
    }
  };

  const removeSNFromRow = (idx: number, sn: string) => {
    const item = value[idx];
    if (!item.selectedSNs) return;
    onChange(
      value.map((it, i) =>
        i === idx ? { ...it, selectedSNs: it.selectedSNs!.filter((s) => s !== sn) } : it,
      ),
    );
  };

  // ---- Helpers ----
  const getAvailableSNs = (productId: string): string[] => {
    return sns.filter((s) => s.productId === productId && s.status === "In Stock").map((s) => s.sn);
  };

  /**
   * Render the product dropdown for a row. Always shows all eligible
   * products grouped by hasSerialNumber so the user can pick either
   * type, and the row's shape (card vs grid) adapts after the pick.
   * Empty optgroups (one category has no available products) are omitted.
   */
  const renderProductSelect = (idx: number, productId: string) => (
    <select
      value={productId}
      onChange={(e) => handleProductChange(idx, e.target.value)}
      className="col-span-5 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
    >
      <option value="">-- Pilih Produk --</option>
      {snProducts.length > 0 && (
        <optgroup label="Nomor Seri">
          {snProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand} {p.model} (stock: {p.stock})
            </option>
          ))}
        </optgroup>
      )}
      {nonSNProducts.length > 0 && (
        <optgroup label="Tanpa Nomor Seri">
          {nonSNProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.brand} {p.model} (stock: {p.stock})
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );

  // ---- Render ----
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
          {sectionTitle}
        </h3>
        <button
          onClick={addItem}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase hover:bg-slate-800"
        >
          {addButtonLabel}
        </button>
      </div>

      {value.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          {emptyStateMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((item, idx) => {
            const product = products.find((p) => p.id === item.productId);
            const isEmpty = !item.productId;
            const isSN = !isEmpty && product?.hasSerialNumber === true;
            const err = errors?.[idx];
            const productLabel = product
              ? `${product.brand} ${product.model} (stock: ${product.stock})`
              : "";

            if (isSN) {
              // ---- SN row: card layout ----
              const selectedSNs = item.selectedSNs ?? [];
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3"
                >
                  {err && <div className="text-xs text-red-600 font-bold">{err}</div>}
                  <div className="grid grid-cols-12 gap-2">
                    {renderProductSelect(idx, item.productId)}
                    <button
                      type="button"
                      onClick={() => setOpenModalRowIdx(idx)}
                      className="col-span-6 px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                    >
                      Pilih SN{" "}
                      <span className="text-indigo-600">({selectedSNs.length} dipilih)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="col-span-1 px-2 text-red-500 hover:bg-red-50 rounded-lg text-lg leading-none"
                      aria-label="Hapus baris"
                    >
                      ✕
                    </button>
                  </div>
                  {selectedSNs.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedSNs.map((sn) => (
                        <span
                          key={sn}
                          className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-mono font-bold"
                        >
                          {sn}
                          <button
                            type="button"
                            onClick={() => removeSNFromRow(idx, sn)}
                            className="hover:bg-indigo-200 rounded-full p-0.5"
                            aria-label={`Hapus SN ${sn}`}
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            } else {
              // ---- Empty or non-SN row: 12-col grid ----
              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 p-3 border border-slate-200 rounded-xl"
                >
                  {err && <div className="col-span-12 text-xs text-red-600 font-bold">{err}</div>}
                  {renderProductSelect(idx, item.productId)}
                  {isEmpty ? (
                    <span className="col-span-6 text-sm text-slate-400 italic self-center">
                      Pilih produk dulu
                    </span>
                  ) : (
                    <input
                      type="number"
                      min={1}
                      value={item.quantity ?? 1}
                      onChange={(e) =>
                        updateItem(idx, {
                          quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Qty"
                      className="col-span-6 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="col-span-1 px-2 text-red-500 hover:bg-red-50 rounded-lg text-lg leading-none"
                    aria-label="Hapus baris"
                  >
                    ✕
                  </button>
                </div>
              );
            }
          })}
        </div>
      )}

      {/* SN picker modal (only one open at a time) */}
      {openModalRowIdx !== null && value[openModalRowIdx]?.productId && (
        <SNPickerModal
          isOpen={true}
          onClose={() => setOpenModalRowIdx(null)}
          onSave={(sns) => {
            updateItem(openModalRowIdx, { selectedSNs: sns });
          }}
          availableSNs={getAvailableSNs(value[openModalRowIdx].productId)}
          pickedInOtherRows={Array.from(pickedSNsAcrossForm).filter(
            (sn) => !(value[openModalRowIdx]?.selectedSNs ?? []).includes(sn),
          )}
          initialSelected={value[openModalRowIdx].selectedSNs ?? []}
          productLabel={(() => {
            const p = products.find((pp) => pp.id === value[openModalRowIdx!].productId);
            return p ? `${p.brand} ${p.model} (stock: ${p.stock})` : "";
          })()}
        />
      )}
    </div>
  );
};

export default DocumentItemEditor;
