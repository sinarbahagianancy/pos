import React, { useState, useEffect } from "react";
import { StoreConfig as StoreConfigType } from "../../app/types";
import { StaffMember } from "../../app/services/auth.service";

interface SettingsProps {
  storeConfig: StoreConfigType;
  onUpdateStoreConfig: (config: StoreConfigType) => Promise<void>;
  staffList: StaffMember[];
  onAddStaff: (name: string, password: string, role: "Admin" | "Staff") => Promise<void>;
  onUpdateStaff?: (
    id: string,
    data: { name?: string; role?: "Admin" | "Staff"; password?: string },
  ) => Promise<void>;
  onDeleteStaff: (id: string) => Promise<void>;
  isAdmin: boolean;
  onReset: () => void;
}

const SettingsView: React.FC<SettingsProps> = ({
  storeConfig,
  onUpdateStoreConfig,
  staffList,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  isAdmin,
  onReset,
}) => {
  const [localConfig, setLocalConfig] = useState<StoreConfigType>(storeConfig);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffRole, setEditStaffRole] = useState<"Admin" | "Staff">("Staff");
  const [editStaffPassword, setEditStaffPassword] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"Admin" | "Staff">("Staff");
  const [saving, setSaving] = useState(false);
  const [isUpdatingStaff, setIsUpdatingStaff] = useState(false);

  useEffect(() => {
    setLocalConfig(storeConfig);
  }, [storeConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateStoreConfig(localConfig);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const submitNewStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaffName.trim() && newStaffPassword) {
      try {
        await onAddStaff(newStaffName.trim(), newStaffPassword, newStaffRole);
        setNewStaffName("");
        setNewStaffPassword("");
        setNewStaffRole("Staff");
        setShowAddStaffModal(false);
      } catch (error) {
        console.error("Failed to add staff:", error);
        alert(error instanceof Error ? error.message : "Failed to add staff");
      }
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete staff "${name}"?`)) {
      try {
        await onDeleteStaff(id);
      } catch (error) {
        console.error("Failed to delete staff:", error);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 uppercase tracking-tight">
            Konfigurasi Sistem
          </h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">
            Atur metadata toko, pajak, dan hak akses operasional.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          {isAdmin && (
            <>
              <button
                onClick={onReset}
                className="flex-1 sm:flex-none bg-white border border-red-200 text-red-600 px-6 py-3 rounded-2xl text-sm font-black hover:bg-red-50 transition-all active:scale-95 uppercase tracking-widest"
              >
                Reset Data
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none bg-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50"
              >
                {saving ? "Saving..." : "Simpan Perubahan"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
          <h2 className="font-black text-slate-900 flex items-center uppercase text-sm tracking-tighter">
            <svg
              className="w-5 h-5 mr-3 text-indigo-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Profil Gerai Utama
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Nama Toko Operasional
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                value={localConfig.storeName}
                onChange={(e) => setLocalConfig({ ...localConfig, storeName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Alamat Fisik Cabin
              </label>
              <textarea
                disabled={!isAdmin}
                className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none h-32 resize-none transition-all placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                value={localConfig.address}
                onChange={(e) => setLocalConfig({ ...localConfig, address: e.target.value })}
              />
            </div>
          </div>
        </div>

        {isAdmin ? (
          <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <h2 className="font-black text-slate-900 flex items-center uppercase text-sm tracking-tighter">
              <svg
                className="w-5 h-5 mr-3 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Finansial & Perpajakan
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Mata Uang Basis
                </label>
                <select
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all appearance-none cursor-pointer"
                  value={localConfig.currency}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, currency: e.target.value as "IDR" | "USD" })
                  }
                >
                  <option value="IDR">IDR (Rupiah Indonesia)</option>
                  <option value="USD">USD (United States Dollar)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Nilai PPN Global (%)
                </label>
                <input
                  type="number"
                  className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={localConfig.ppnRate}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, ppnRate: Number(e.target.value) })
                  }
                />
                <p className="mt-3 text-[10px] text-slate-400 font-medium italic">
                  Nilai default: 11% (UU HPP No. 7 Tahun 2021).
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 p-8 rounded-[32px] border border-slate-200 flex flex-col items-center justify-center text-center">
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
              Restricted Area
            </p>
            <p className="text-[11px] text-slate-400 mt-2 font-medium max-w-[200px]">
              Pengaturan finansial hanya dapat diakses oleh Store Admin (Nancy, Mami, Vita).
            </p>
          </div>
        )}

        <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6 md:col-span-2">
          <h2 className="font-black text-slate-900 flex items-center uppercase text-sm tracking-tighter">
            <svg
              className="w-5 h-5 mr-3 text-indigo-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            manajemen Tim & Operator
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="p-5 border border-slate-100 rounded-2xl bg-slate-50 flex items-center justify-between group hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black border border-slate-100 shadow-sm transition-all text-xs uppercase ${staff.role === "Admin" ? "bg-indigo-600 text-white" : "bg-white text-indigo-600"}`}
                  >
                    {staff.name.substring(0, 2)}
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-900 block truncate max-w-[100px]">
                      {staff.name}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest ${staff.role === "Admin" ? "text-indigo-600" : "text-slate-400"}`}
                    >
                      {staff.role}
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    {onUpdateStaff && (
                      <button
                        onClick={() => {
                          setEditingStaff(staff);
                          setEditStaffName(staff.name);
                          setEditStaffRole(staff.role);
                          setEditStaffPassword("");
                        }}
                        className="text-slate-300 hover:text-indigo-500 transition-colors p-1"
                        title="Edit"
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
                    )}
                    <button
                      onClick={() => handleDeleteStaff(staff.id, staff.name)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
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
                )}
              </div>
            ))}

            {isAdmin && (
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="p-5 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all text-xs font-black uppercase tracking-widest bg-white h-full min-h-[88px] flex items-center justify-center"
              >
                + Registrasi Staff
              </button>
            )}
          </div>
        </div>
      </div>

      {showAddStaffModal && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[150] p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                Tambah Staff Baru
              </h2>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="text-slate-400 hover:text-slate-600"
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
            <form onSubmit={submitNewStaff} className="p-6 lg:p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Nama Panggilan
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-slate-400"
                  placeholder="Contoh: Rudi"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={3}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-slate-400"
                  placeholder="Min. 3 karakter"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Role
                </label>
                <select
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as "Admin" | "Staff")}
                >
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newStaffName.trim() || !newStaffPassword}
                  className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg transition-all ${!newStaffName.trim() || !newStaffPassword ? "bg-slate-300 text-slate-400 cursor-not-allowed" : "bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700"}`}
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && onUpdateStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[150] p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                Edit Staff
              </h2>
              <button
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600"
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
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setIsUpdatingStaff(true);
                try {
                  await onUpdateStaff(editingStaff.id, {
                    name: editStaffName,
                    role: editStaffRole,
                    password: editStaffPassword || undefined,
                  });
                  setEditingStaff(null);
                } catch (error) {
                  console.error("Failed to update staff:", error);
                  alert(error instanceof Error ? error.message : "Failed to update staff");
                } finally {
                  setIsUpdatingStaff(false);
                }
              }}
              className="p-6 lg:p-8 space-y-6"
            >
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Nama Panggilan
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-slate-400"
                  placeholder="Contoh: Rudi"
                  value={editStaffName}
                  onChange={(e) => setEditStaffName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Role
                </label>
                <select
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  value={editStaffRole}
                  onChange={(e) => setEditStaffRole(e.target.value as "Admin" | "Staff")}
                >
                  <option value="Staff">Staff</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Password Baru (Opsional)
                </label>
                <input
                  type="password"
                  minLength={3}
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-slate-400"
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  value={editStaffPassword}
                  onChange={(e) => setEditStaffPassword(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStaff || !editStaffName.trim()}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isUpdatingStaff ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
