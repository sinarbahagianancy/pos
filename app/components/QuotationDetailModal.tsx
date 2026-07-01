import React, { useState, useMemo } from "react";
import type { Quotation, QuotationStatus, Product, SerialNumber, Customer } from "../types";
import { formatIDR, formatDate } from "../utils/formatters";
import { applyFakePpnDisplay } from "../utils/ppnDecomposition";
import { pdf } from "@react-pdf/renderer";
import { InvoiceDocument, InvoiceLayout } from "./InvoicePDF";
import { approveQuotation, rejectQuotation, cancelQuotation } from "../services/quotation.api";

interface QuotationDetailModalProps {
  quotation: Quotation;
  storeConfig: { storeName: string; address: string; ppnRate: number };
  products: Product[];
  sns: SerialNumber[];
  customers: Customer[];
  staffName: string;
  onClose: () => void;
  onChanged: () => void; // refresh parent list
  onConvertedToSale?: (saleId: string) => void;
}

const STATUS_STYLES: Record<QuotationStatus, string> = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Approved: "bg-green-50 text-green-700 border-green-200",
  Rejected: "bg-red-50 text-red-700 border-red-200",
  Canceled: "bg-slate-100 text-slate-600 border-slate-200",
};

type ActionMode = "view" | "approve" | "reject" | "cancel";

export const QuotationDetailModal: React.FC<QuotationDetailModalProps> = ({
  quotation,
  storeConfig,
  products,
  sns,
  customers,
  staffName,
  onClose,
  onChanged,
  onConvertedToSale,
}) => {
  const [mode, setMode] = useState<ActionMode>("view");
  const [reason, setReason] = useState("");
  // SN override: map of quotation_item.id → chosen SN. Initialised from Quotation's SN.
  const [snOverrides, setSnOverrides] = useState<Record<string, string>>(() =>
    Object.fromEntries(quotation.items.map((it) => [it.id, it.sn])),
  );
  const [snPickerItemId, setSnPickerItemId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customer = customers.find((c) => c.id === quotation.customerId);

  // Items with effective SNs (after user re-pick)
  const effectiveItems = useMemo(
    () =>
      quotation.items.map((it) => {
        const product = products.find((p) => p.id === it.productId);
        return {
          ...it,
          effectiveSn: snOverrides[it.id] ?? it.sn,
          product,
          isNonSN: product ? !product.hasSerialNumber : false,
        };
      }),
    [quotation.items, snOverrides, products],
  );

  const isPending = quotation.status === "Pending";
  const isTerminal = !isPending;

  const handleReprint = async () => {
    try {
      // Apply the fake PPN display decomposition at render time. The
      // persisted quotation.subtotal / quotation.tax / quotation.total
      // are canonical (tax = 0, total = subtotal); without this, a
      // re-issued PDF would show the canonical numbers instead of the
      // fake breakdown the quotation was originally printed with.
      // storeConfig.ppnRate is stored as a percentage (e.g. 11), but
      // applyFakePpnDisplay takes a fraction (e.g. 0.11). See ADR 0005.
      const breakdown = applyFakePpnDisplay(
        quotation.total,
        storeConfig.ppnRate / 100,
        quotation.taxEnabled,
      );
      const invoiceData = {
        storeName: storeConfig.storeName,
        address: storeConfig.address,
        invoiceNumber: quotation.id,
        date: formatDate(quotation.createdAt),
        customerName: quotation.customerName,
        customerAddress: customer?.address,
        customerNpwp: customer?.npwp,
        items: effectiveItems.map((it) => ({
          merk: it.brand,
          model: it.model,
          sn: "", // Quotation PDF hides SN
          price: it.price,
        })),
        subtotal: breakdown.displayedSubtotal,
        tax: breakdown.displayedTax,
        taxRate: storeConfig.ppnRate,
        taxEnabled: quotation.taxEnabled,
        total: quotation.total,
        staffName: quotation.staffName,
        paymentMethod: "Quotation",
        notes: quotation.notes,
        poNumber: quotation.poNumber,
        isQuotation: true,
      };
      const blob = await pdf(
        <InvoiceDocument layout={"a4-portrait" as InvoiceLayout} data={invoiceData} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      // Note: we don't revoke because the new tab keeps it alive
    } catch (e) {
      setError(`Gagal reprint PDF: ${String(e)}`);
    }
  };

  const handleApprove = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const itemSns = Object.entries(snOverrides).map(([itemId, sn]) => ({ itemId, sn }));
      const result = await approveQuotation(quotation.id, {
        itemSns,
        paymentMethod: "Cash",
        staffName,
        amountPaid: quotation.total,
      });
      onChanged();
      if (onConvertedToSale && result.sale?.id) {
        onConvertedToSale(result.sale.id);
      }
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      setError("Alasan wajib diisi");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await rejectQuotation(quotation.id, reason.trim(), staffName);
      onChanged();
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError("Alasan wajib diisi");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await cancelQuotation(quotation.id, reason.trim(), staffName);
      onChanged();
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const snPickerItem = snPickerItemId
    ? effectiveItems.find((it) => it.id === snPickerItemId)
    : null;
  const snPickerOptions = snPickerItem
    ? sns.filter(
        (sn) =>
          sn.productId === snPickerItem.productId &&
          sn.status === "In Stock" &&
          sn.sn !== snPickerItem.effectiveSn,
      )
    : [];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="font-black text-slate-900 text-lg tracking-tight">{quotation.id}</h3>
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${STATUS_STYLES[quotation.status]}`}
              >
                {quotation.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Created {formatDate(quotation.createdAt)} • Staff {quotation.staffName}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Customer + details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Customer
              </p>
              <p className="font-black text-slate-900 uppercase">{quotation.customerName}</p>
              {customer?.phone && <p className="text-xs text-slate-500">{customer.phone}</p>}
              {customer?.address && (
                <p className="text-xs text-slate-500 mt-1">{customer.address}</p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                PO Number
              </p>
              <p className="font-mono font-black text-slate-900">{quotation.poNumber || "—"}</p>
              {quotation.notes && (
                <>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 mt-3">
                    Notes
                  </p>
                  <p className="text-sm text-slate-700">{quotation.notes}</p>
                </>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Items
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-400 font-black border-b border-slate-200">
                  <th className="text-left py-2">Model</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">Subtotal</th>
                  {mode === "approve" && <th className="text-left py-2 pl-2">SN</th>}
                </tr>
              </thead>
              <tbody>
                {effectiveItems.map((it) => (
                  <tr key={it.id} className="border-b border-slate-100">
                    <td className="py-3">
                      <p className="font-bold text-slate-900 uppercase">{it.model}</p>
                      {it.brand && (
                        <p className="text-[10px] text-slate-500 uppercase">{it.brand}</p>
                      )}
                    </td>
                    <td className="text-center py-3 text-slate-700">{it.quantity}</td>
                    <td className="text-right py-3 text-slate-700 tabular-nums">
                      {formatIDR(it.price)}
                    </td>
                    <td className="text-right py-3 text-slate-900 font-bold tabular-nums">
                      {formatIDR(it.price * it.quantity)}
                    </td>
                    {mode === "approve" && (
                      <td className="py-3 pl-2">
                        {it.isNonSN ? (
                          <span className="text-[10px] text-slate-400 uppercase">No SN</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <code className="text-xs font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                              {it.effectiveSn || "(none)"}
                            </code>
                            <button
                              onClick={() => setSnPickerItemId(it.id)}
                              className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800"
                            >
                              Ganti
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatIDR(quotation.subtotal)}</span>
            </div>
            {quotation.taxEnabled && (
              <div className="flex justify-between text-slate-600">
                <span>PPN ({storeConfig.ppnRate}%)</span>
                <span className="tabular-nums">{formatIDR(quotation.tax)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 mt-2 border-t border-slate-200 font-black text-slate-900">
              <span>Total</span>
              <span className="tabular-nums">{formatIDR(quotation.total)}</span>
            </div>
          </div>

          {/* Rejection / Cancellation reason (if any) */}
          {(quotation.status === "Rejected" || quotation.status === "Canceled") &&
            quotation.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1">
                  {quotation.status === "Rejected" ? "Rejection Reason" : "Cancellation Reason"}
                </p>
                <p className="text-sm text-red-900">{quotation.rejectionReason}</p>
                {quotation.decidedAt && quotation.decidedBy && (
                  <p className="text-[10px] text-red-600 mt-2 font-bold">
                    by {quotation.decidedBy} • {formatDate(quotation.decidedAt)}
                  </p>
                )}
              </div>
            )}

          {/* Converted Sale link */}
          {quotation.status === "Approved" && quotation.convertedSaleId && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">
                Converted to Invoice
              </p>
              <p className="font-mono font-black text-green-900">{quotation.convertedSaleId}</p>
              {quotation.decidedAt && quotation.decidedBy && (
                <p className="text-[10px] text-green-700 mt-1 font-bold">
                  by {quotation.decidedBy} • {formatDate(quotation.decidedAt)}
                </p>
              )}
            </div>
          )}

          {/* Mode-specific input */}
          {(mode === "reject" || mode === "cancel") && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                {mode === "reject" ? "Alasan Penolakan" : "Alasan Pembatalan"}{" "}
                <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  mode === "reject"
                    ? "e.g., Customer menolak, harga kemahalan"
                    : "e.g., Stok tidak tersedia, salah hitung"
                }
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={handleReprint}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold uppercase hover:bg-slate-100"
          >
            Reprint PDF
          </button>

          {isPending && mode === "view" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMode("cancel");
                  setReason("");
                  setError(null);
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase hover:bg-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setMode("reject");
                  setReason("");
                  setError(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setMode("approve");
                  setError(null);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-green-700"
              >
                Approve &amp; Convert
              </button>
            </div>
          )}

          {isPending && mode === "approve" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode("view")}
                disabled={submitting}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase hover:bg-slate-300 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Processing..." : "Confirm Approve"}
              </button>
            </div>
          )}

          {isPending && (mode === "reject" || mode === "cancel") && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode("view")}
                disabled={submitting}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase hover:bg-slate-300 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={mode === "reject" ? handleReject : handleCancel}
                disabled={submitting || !reason.trim()}
                className={`px-4 py-2 ${
                  mode === "reject"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-slate-600 hover:bg-slate-700"
                } text-white rounded-xl text-xs font-bold uppercase disabled:opacity-50`}
              >
                {submitting
                  ? "Processing..."
                  : `Confirm ${mode === "reject" ? "Reject" : "Cancel"}`}
              </button>
            </div>
          )}

          {isTerminal && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-slate-800"
            >
              Close
            </button>
          )}
        </div>

        {/* SN Picker sub-modal */}
        {snPickerItem && (
          <div
            className="absolute inset-0 bg-black/50 rounded-[32px] flex items-center justify-center p-4"
            onClick={() => setSnPickerItemId(null)}
          >
            <div
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="font-black text-slate-900 uppercase tracking-tight mb-1">
                Pilih Serial Number
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                {snPickerItem.brand} {snPickerItem.model}
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <button
                  onClick={() => setSnPickerItemId(null)}
                  className="w-full p-3 text-left rounded-xl border-2 border-slate-200 bg-slate-50 text-xs font-mono"
                >
                  <span className="text-slate-400">Current:</span>{" "}
                  <span className="font-bold text-slate-700">{snPickerItem.effectiveSn}</span>
                </button>
                {snPickerOptions.map((sn) => (
                  <button
                    key={sn.sn}
                    onClick={() => {
                      setSnOverrides({ ...snOverrides, [snPickerItem.id]: sn.sn });
                      setSnPickerItemId(null);
                    }}
                    className="w-full p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-xs font-mono"
                  >
                    <span className="font-bold text-slate-700">{sn.sn}</span>
                  </button>
                ))}
                {snPickerOptions.length === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    Tidak ada serial number lain tersedia
                  </p>
                )}
              </div>
              <button
                onClick={() => setSnPickerItemId(null)}
                className="mt-4 w-full py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
