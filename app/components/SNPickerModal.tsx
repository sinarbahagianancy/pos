import React, { useState, useEffect, useMemo } from "react";

interface SNPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedSNs: string[]) => void;
  /** All "In Stock" serial numbers for the picked product. */
  availableSNs: string[];
  /** Serial numbers already picked in OTHER rows of the same form.
   *  These are hidden from the visible list (not just greyed out). */
  pickedInOtherRows: string[];
  /** Serial numbers already picked in THIS row.
   *  These are pre-checked when the modal opens. */
  initialSelected: string[];
  /** Human-readable product label, e.g. "Sony A7 IV (stock: 3)". */
  productLabel: string;
}

const SNPickerModal: React.FC<SNPickerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  availableSNs,
  pickedInOtherRows,
  initialSelected,
  productLabel,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // Re-initialize when modal opens. Reset on close.
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(initialSelected));
      setSearch("");
    }
  }, [isOpen, initialSelected]);

  // Hide SNs already picked in OTHER rows (form-wide dedup).
  const visibleSNs = useMemo(() => {
    const blocked = new Set(pickedInOtherRows);
    return availableSNs.filter((sn) => !blocked.has(sn));
  }, [availableSNs, pickedInOtherRows]);

  // Apply search filter (substring, case-insensitive).
  const filteredSNs = useMemo(() => {
    if (!search.trim()) return visibleSNs;
    const q = search.trim().toLowerCase();
    return visibleSNs.filter((sn) => sn.toLowerCase().includes(q));
  }, [visibleSNs, search]);

  const toggleSN = (sn: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(sn)) next.delete(sn);
      else next.add(sn);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filteredSNs.forEach((sn) => next.add(sn));
      return next;
    });
  };

  const clearAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filteredSNs.forEach((sn) => next.delete(sn));
      return next;
    });
  };

  const handleSave = () => {
    onSave(Array.from(selected));
    onClose();
  };

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Pilih Serial Number
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-bold">{productLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-all"
            aria-label="Tutup"
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

        {/* Search + toolbar */}
        <div className="p-6 border-b border-slate-100 space-y-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari SN..."
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            autoFocus
          />
          <div className="flex items-center justify-between text-xs">
            <div className="text-slate-500 font-bold">
              {selected.size} dipilih • {filteredSNs.length} tersedia
            </div>
            <div className="flex gap-2">
              <button
                onClick={selectAllVisible}
                disabled={filteredSNs.length === 0}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Pilih Semua
              </button>
              <button
                onClick={clearAllVisible}
                disabled={selected.size === 0}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Hapus Semua
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
          {filteredSNs.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400">
              {visibleSNs.length === 0
                ? "Semua SN produk ini sudah dipilih di baris lain"
                : "Tidak ada SN yang cocok dengan pencarian"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredSNs.map((sn) => (
                <label
                  key={sn}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(sn)}
                    onChange={() => toggleSN(sn)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-mono text-sm font-bold text-slate-900">{sn}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={selected.size === 0}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
          >
            Simpan ({selected.size} dipilih)
          </button>
        </div>
      </div>
    </div>
  );
};

export default SNPickerModal;
