import React, { useState, useEffect } from "react";
import { Supplier } from "../../app/types";
import {
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../../app/services/supplier.service";
import Pagination from "../../app/components/Pagination";

interface SuppliersViewProps {
  staffName: string;
  suppliers?: Supplier[];
  loading?: boolean;
  onAddSupplier?: (data: { name: string; phone?: string; address?: string }) => Promise<void>;
  onUpdateSupplier?: (
    id: string,
    data: { name?: string; phone?: string; address?: string },
  ) => Promise<void>;
  onDeleteSupplier?: (id: string) => Promise<void>;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
}

const SuppliersView: React.FC<SuppliersViewProps> = ({
  staffName,
  suppliers = [],
  loading = false,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  perPage = 20,
  onPerPageChange,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // Step 1: Validate and show confirmation modal
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Duplicate detection
    const warnings: string[] = [];
    const nameLower = formData.name.trim().toLowerCase();
    const phoneTrim = formData.phone.trim();

    const sameName = suppliers.find(
      (s) =>
        (!editingSupplier || s.id !== editingSupplier.id) &&
        s.name.trim().toLowerCase() === nameLower,
    );
    if (sameName) {
      warnings.push(`Nama "${sameName.name}" sudah terdaftar di sistem.`);
    }

    const samePhone = suppliers.find(
      (s) =>
        (!editingSupplier || s.id !== editingSupplier.id) &&
        s.phone?.trim() === phoneTrim &&
        phoneTrim !== "",
    );
    if (samePhone) {
      warnings.push(
        `Nomor telepon "${phoneTrim}" sudah digunakan oleh ${samePhone.name}.`,
      );
    }

    setDuplicateWarnings(warnings);
    setConfirmSave(true);
  };

  // Step 2: Actually save after confirmation
  const handleSaveConfirm = async () => {
    setIsSaving(true);
    try {
      if (editingSupplier) {
        await onUpdateSupplier?.(editingSupplier.id, formData);
      } else {
        await onAddSupplier?.(formData);
      }
      setShowAddModal(false);
      setEditingSupplier(null);
      setConfirmSave(false);
      setFormData({ name: "", phone: "", address: "" });
    } catch (err: any) {
      setError(err.message || "Failed to save supplier");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setConfirmSave(false);
    setFormData({
      name: supplier.name,
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await onDeleteSupplier?.(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete supplier");
    } finally {
      setIsDeleting(false);
    }
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setConfirmSave(false);
    setFormData({ name: "", phone: "", address: "" });
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tighter">
              Data Supplier
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Kelola data supplier / vendor</p>
          </div>
          <button
            onClick={openAddModal}
            className="px-6 py-3 bg-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            + Tambah Supplier
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-600 text-sm font-bold">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Belum Ada Supplier</h3>
            <p className="text-slate-500 text-sm">Tambah supplier pertama Anda untuk memulai</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Nama Supplier
                  </th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    No. Telepon
                  </th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Alamat
                  </th>
                  <th className="text-right px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier, index) => (
                  <tr
                    key={supplier.id}
                    className={`border-b border-slate-100 ${index !== suppliers.length - 1 ? "" : "border-b-0"}`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{supplier.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 text-sm font-medium">
                        {supplier.phone || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 text-sm font-medium">
                        {supplier.address || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(supplier)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={onPageChange || (() => {})}
        perPage={perPage}
        onPerPageChange={onPerPageChange}
        itemLabel="suppliers"
      />

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {editingSupplier ? "Edit Supplier" : "Tambah Supplier"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSupplier(null);
                  setConfirmSave(false);
                }}
                disabled={isSaving}
                className="text-slate-400 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="p-6 lg:p-8 space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Nama Supplier
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none focus:border-indigo-500"
                  placeholder="Nama supplier"
                  required
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  No. Telepon
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none focus:border-indigo-500"
                  placeholder="Nomor telepon"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Alamat
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none focus:border-indigo-500 resize-none h-24"
                  placeholder="Alamat supplier"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingSupplier(null);
                    setConfirmSave(false);
                  }}
                  disabled={isSaving}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-sm uppercase tracking-widest disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Menyimpan..." : editingSupplier ? "Lihat Perubahan" : "Lihat Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {confirmSave && showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                    {editingSupplier ? "Konfirmasi Perubahan" : "Konfirmasi Pendaftaran"}
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                    Pastikan data sudah benar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmSave(false)}
                disabled={isSaving}
                className="text-slate-300 hover:text-slate-600 disabled:cursor-not-allowed"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 lg:p-8">
              {/* Data summary */}
              <div className="bg-slate-50 rounded-2xl p-4 mb-4 space-y-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  {editingSupplier ? `Perubahan data untuk ${editingSupplier.name}` : "Data supplier baru"}
                </p>
                {editingSupplier ? (
                  <>
                    {formData.name.trim().toLowerCase() !== editingSupplier.name.trim().toLowerCase() && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Nama</span>
                        <span className="text-xs text-slate-400 line-through">{editingSupplier.name}</span>
                        <svg className="w-3 h-3 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        <span className="text-sm font-black text-slate-900">{formData.name}</span>
                      </div>
                    )}
                    {formData.phone.trim() !== (editingSupplier.phone || "").trim() && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Telepon</span>
                        <span className="text-xs text-slate-400 line-through">{editingSupplier.phone || "-"}</span>
                        <svg className="w-3 h-3 text-indigo-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        <span className="text-sm font-bold text-slate-700">{formData.phone || "-"}</span>
                      </div>
                    )}
                    {formData.address.trim() !== (editingSupplier.address || "").trim() && (
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Alamat</span>
                        <span className="text-xs text-slate-400 line-through">{editingSupplier.address || "-"}</span>
                        <svg className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        <span className="text-xs font-medium text-slate-600">{formData.address || "-"}</span>
                      </div>
                    )}
                    {formData.name.trim().toLowerCase() === editingSupplier.name.trim().toLowerCase() &&
                     formData.phone.trim() === (editingSupplier.phone || "").trim() &&
                     formData.address.trim() === (editingSupplier.address || "").trim() && (
                      <p className="text-xs text-slate-400 italic">Tidak ada perubahan data.</p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Nama</span>
                      <span className="text-sm font-black text-slate-900">{formData.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Telepon</span>
                      <span className="text-sm font-bold text-slate-700">{formData.phone || "-"}</span>
                    </div>
                    {formData.address && (
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest shrink-0">Alamat</span>
                        <span className="text-xs font-medium text-slate-600">{formData.address}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Duplicate warnings */}
              {duplicateWarnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-black text-amber-800 uppercase tracking-tighter">
                        Kemungkinan Duplikat!
                      </p>
                      <ul className="mt-2 space-y-1">
                        {duplicateWarnings.map((w, i) => (
                          <li key={i} className="text-xs text-amber-700 font-medium">
                            • {w}
                          </li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-amber-600 font-bold mt-2">
                        {editingSupplier
                          ? "Lanjutkan hanya jika ini benar-benar perlu diubah."
                          : "Lanjutkan hanya jika ini supplier yang berbeda."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSaveConfirm}
                  disabled={isSaving || (editingSupplier &&
                    formData.name.trim().toLowerCase() === editingSupplier.name.trim().toLowerCase() &&
                    formData.phone.trim() === (editingSupplier.phone || "").trim() &&
                    formData.address.trim() === (editingSupplier.address || "").trim()
                  )}
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : duplicateWarnings.length > 0 ? (
                    editingSupplier ? "Ya, Tetap Simpan Perubahan" : "Ya, Tetap Daftarkan"
                  ) : (
                    editingSupplier ? "Konfirmasi & Simpan Perubahan" : "Konfirmasi & Daftarkan"
                  )}
                </button>
                <button
                  onClick={() => setConfirmSave(false)}
                  disabled={isSaving}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  Kembali ke Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-red-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-black text-red-600 uppercase tracking-tighter">
                    Hapus Supplier?
                  </h2>
                  <p className="text-[10px] text-red-400 font-bold uppercase mt-1">
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="text-slate-300 hover:text-slate-600 disabled:cursor-not-allowed"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 lg:p-8">
              <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">
                  Anda akan menghapus:
                </p>
                <p className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                  {deleteConfirm.name}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-1">{deleteConfirm.phone}</p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full py-4 bg-red-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Menghapus...
                    </>
                  ) : (
                    "Hapus Supplier"
                  )}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersView;
