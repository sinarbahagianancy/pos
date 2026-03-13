import React, { useState, useEffect } from 'react';
import { Supplier } from '../../app/types';
import { getAllSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../app/services/supplier.service';

interface SuppliersViewProps {
  staffName: string;
}

const SuppliersView: React.FC<SuppliersViewProps> = ({ staffName }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getAllSuppliers();
      setSuppliers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
      } else {
        await createSupplier(formData);
      }
      setShowAddModal(false);
      setEditingSupplier(null);
      setFormData({ name: '', phone: '', address: '' });
      loadSuppliers();
    } catch (err: any) {
      setError(err.message || 'Failed to save supplier');
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteSupplier(deleteConfirm.id);
      setDeleteConfirm(null);
      loadSuppliers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete supplier');
    }
  };

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({ name: '', phone: '', address: '' });
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tighter">Data Supplier</h1>
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
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nama Supplier</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">No. Telepon</th>
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Alamat</th>
                  <th className="text-right px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier, index) => (
                  <tr key={supplier.id} className={`border-b border-slate-100 ${index !== suppliers.length - 1 ? '' : 'border-b-0'}`}>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900">{supplier.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 text-sm font-medium">{supplier.phone || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 text-sm font-medium">{supplier.address || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(supplier)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(supplier)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier'}
              </h2>
              <button onClick={() => { setShowAddModal(false); setEditingSupplier(null); }} className="text-slate-400 hover:text-slate-900">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Supplier</label>
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
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">No. Telepon</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none focus:border-indigo-500"
                  placeholder="Nomor telepon"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Alamat</label>
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
                  onClick={() => { setShowAddModal(false); setEditingSupplier(null); }}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-sm uppercase tracking-widest"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-red-50/50 flex items-center justify-between">
              <h2 className="text-xl font-black text-red-800 uppercase tracking-tighter">Hapus Supplier</h2>
              <button onClick={() => setDeleteConfirm(null)} className="text-slate-400 hover:text-slate-900">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 lg:p-8">
              <p className="text-slate-600 text-sm font-medium mb-6">
                Apakah Anda yakin ingin menghapus supplier <strong className="text-slate-900">{deleteConfirm.name}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-sm uppercase tracking-widest"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-700 active:scale-95 transition-all"
                >
                  Hapus
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
