import React, { useState, useMemo, useRef, useEffect } from "react";
import { SortingState } from "@tanstack/react-table";
import { Product, SerialNumber, AuditLog, Supplier } from "../../app/types";
import { formatIDR } from "../../app/utils/formatters";
import { RupiahInput } from "../../app/components/RupiahInput";

// Reusable searchable combobox for supplier selection
interface SearchableSelectProps {
  suppliers: Supplier[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  suppliers,
  value,
  onChange,
  placeholder = "Pilih Supplier...",
  required = false,
  className = "",
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter((s) => s.name.toLowerCase().includes(q));
  }, [search, suppliers]);

  const handleSelect = (name: string) => {
    onChange(name);
    setSearch("");
    setIsOpen(false);
  };

  const displayValue = value || "";

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 ${className}`}
        placeholder={placeholder}
        value={isOpen ? search : displayValue}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => {
          setSearch("");
          setIsOpen(true);
        }}
        required={required && !value}
      />
      {/* Dropdown arrow */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s.name)}
                className={`w-full px-4 py-2.5 text-left text-sm font-bold hover:bg-indigo-50 hover:text-indigo-700 transition-colors ${
                  value === s.name ? "bg-indigo-50 text-indigo-700" : "text-slate-900"
                }`}
              >
                {s.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-400 italic">
              Tidak ada supplier ditemukan
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface InventoryProps {
  products: Product[];
  sns: SerialNumber[];
  logs: AuditLog[];
  suppliers: Supplier[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  canViewSensitive: boolean;
  onManualAdjust: (
    productId: string,
    newStock: number,
    reason: string,
    supplier?: string,
    dateRestocked?: string,
    invoiceNumber?: string,
  ) => void;
  onAddProduct: (product: Product, serials: string[]) => void;
  onEditProduct?: (id: string, data: Partial<Product>) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onRestoreProduct?: (id: string) => Promise<void>;
  onToggleHidden?: (id: string, hidden: boolean) => Promise<void>;
  onRefreshSNs?: () => Promise<void>;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  perPage?: number;
  onPerPageChange?: (perPage: number) => void;
}

const InventoryView: React.FC<InventoryProps> = ({
  products,
  sns,
  logs,
  suppliers,
  setProducts,
  canViewSensitive,
  onManualAdjust,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onRestoreProduct,
  onToggleHidden,
  onRefreshSNs,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  perPage = 20,
  onPerPageChange,
}) => {
  console.log("[DEBUG] Pagination props:", { currentPage, totalPages, totalItems, perPage });
  const [filter, setFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmAdd, setConfirmAdd] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [addDuplicateWarnings, setAddDuplicateWarnings] = useState<string[]>([]);
  const [editDuplicateWarnings, setEditDuplicateWarnings] = useState<string[]>([]);
  const [newStockVal, setNewStockVal] = useState(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});

  // Calculate stock dynamically from SNs with status "In Stock", or use stored stock for non-SN products
  const getProductStock = (product: Product) => {
    if (product.hasSerialNumber === true) {
      return sns.filter((sn) => sn.productId === product.id && sn.status === "In Stock").length;
    }
    return product.stock;
  };

  // Simple stock adjustment
  const [simpleAdjustProduct, setSimpleAdjustProduct] = useState<Product | null>(null);
  const [simpleAdjustAmount, setSimpleAdjustAmount] = useState(0);
  const [simpleAdjustReason, setSimpleAdjustReason] = useState("");
  const [simpleAdjustSupplier, setSimpleAdjustSupplier] = useState("");
  const [simpleAdjustDate, setSimpleAdjustDate] = useState(new Date().toISOString().split("T")[0]);
  const [simpleAdjustInvoiceNumber, setSimpleAdjustInvoiceNumber] = useState("");

  // SN-based stock operations
  const [addingSNProduct, setAddingSNProduct] = useState<Product | null>(null);
  const [removingSNProduct, setRemovingSNProduct] = useState<Product | null>(null);
  const [newSNInput, setNewSNInput] = useState("");
  const [snOperationReason, setSNOperationReason] = useState("");
  const [snOperationSupplier, setSNOperationSupplier] = useState("");
  const [snOperationDate, setSNOperationDate] = useState(new Date().toISOString().split("T")[0]);
  const [snOperationInvoiceNumber, setSNOperationInvoiceNumber] = useState("");
  const [isProcessingSN, setIsProcessingSN] = useState(false);
  const [selectedSNs, setSelectedSNs] = useState<string[]>([]);

  // New Product State
  const [newP, setNewP] = useState<Partial<Product>>({
    brand: "",
    model: "",
    category: "Body",
    condition: "New",
    price: 0,
    cogs: 0,
    warrantyMonths: 12,
    warrantyType: "Official Sony Indonesia",
    taxEnabled: true,
  });
  const [newSerials, setNewSerials] = useState("");
  const [newProductHasSN, setNewProductHasSN] = useState(false);
  const [newProductQuantity, setNewProductQuantity] = useState(1);
  const [newProductSupplier, setNewProductSupplier] = useState("");
  const [newProductDate, setNewProductDate] = useState(new Date().toISOString().split("T")[0]);
  const [newProductInvoiceNumber, setNewProductInvoiceNumber] = useState("");

  const filteredProducts = products.filter(
    (p) =>
      p.model.toLowerCase().includes(filter.toLowerCase()) ||
      p.brand.toLowerCase().includes(filter.toLowerCase()) ||
      p.id.toLowerCase().includes(filter.toLowerCase()),
  );

  const sortedProducts = useMemo(() => {
    if (sorting.length === 0) {
      // Default sort by createdAt DESC (newest first)
      return [...filteredProducts].sort((a, b) => {
        const aVal = a.createdAt || "";
        const bVal = b.createdAt || "";
        return bVal.localeCompare(aVal);
      });
    }
    const { id, desc } = sorting[0];
    return [...filteredProducts].sort((a, b) => {
      let aVal: any = a[id as keyof Product];
      let bVal: any = b[id as keyof Product];
      if (id === "createdAt") {
        aVal = aVal || "";
        bVal = bVal || "";
        return desc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return desc ? 1 : -1;
      if (aVal > bVal) return desc ? -1 : 1;
      return 0;
    });
  }, [filteredProducts, sorting]);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || !adjustReason) return;
    onManualAdjust(adjustingProduct.id, newStockVal, adjustReason);
    setAdjustingProduct(null);
    setAdjustReason("");
  };

  const handleSimpleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simpleAdjustProduct || simpleAdjustAmount === 0 || !simpleAdjustReason) return;
    const currentStock = getProductStock(simpleAdjustProduct);
    const newStock = currentStock + simpleAdjustAmount;
    if (newStock < 0) {
      alert("Stok tidak bisa negatif!");
      return;
    }

    // For products with serial numbers, use onRefreshSNs
    // For products without serial numbers, use onManualAdjust
    if (simpleAdjustProduct.hasSerialNumber === true && onRefreshSNs) {
      await onRefreshSNs();
    } else {
      onManualAdjust(
        simpleAdjustProduct.id,
        newStock,
        simpleAdjustReason,
        simpleAdjustSupplier || undefined,
        simpleAdjustDate || undefined,
        simpleAdjustInvoiceNumber || undefined,
      );
    }

    setSimpleAdjustProduct(null);
    setSimpleAdjustAmount(0);
    setSimpleAdjustReason("");
    setSimpleAdjustInvoiceNumber("");
  };

  const handleAddSN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingSNProduct || !newSNInput.trim() || !snOperationReason) return;

    const snList = newSNInput
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (snList.length === 0) {
      alert("Masukkan minimal 1 nomor seri.");
      return;
    }

    setIsProcessingSN(true);
    try {
      // Add serial numbers to database with supplier, date, and reason
      const { addSerialNumbers } = await import("../../app/services/product.service");
      await addSerialNumbers(
        snList.map((sn) => ({ sn, productId: addingSNProduct.id })),
        snOperationSupplier,
        snOperationDate,
        snOperationReason,
        snOperationInvoiceNumber || undefined,
      );

      alert(`${snList.length} nomor seri berhasil ditambahkan ke ${addingSNProduct.model}.`);

      // Refresh SNs and recalculate stock
      if (onRefreshSNs) {
        await onRefreshSNs();
      }

      setAddingSNProduct(null);
      setNewSNInput("");
      setSNOperationReason("");
      setSNOperationSupplier("");
      setSNOperationInvoiceNumber("");
    } catch (error) {
      console.error("Failed to add serial numbers:", error);
      alert("Gagal menambahkan nomor seri.");
    } finally {
      setIsProcessingSN(false);
    }
  };

  const handleRemoveSN = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removingSNProduct || selectedSNs.length === 0 || !snOperationReason) return;

    console.log("=== DEBUG: handleRemoveSN ===");
    console.log("removingSNProduct:", removingSNProduct);
    console.log("selectedSNs:", selectedSNs);
    console.log("sns prop sample:", sns.slice(0, 3));

    // Verify SN belongs to this product
    const productSNs = sns.filter(
      (sn) => sn.productId === removingSNProduct.id && sn.status === "In Stock",
    );
    console.log("productSNs (In Stock):", productSNs);

    const validSNs = selectedSNs.filter((sn) => productSNs.some((psn) => psn.sn === sn));
    const invalidSNs = selectedSNs.filter((sn) => !productSNs.some((psn) => psn.sn === sn));

    console.log("validSNs:", validSNs);
    console.log("invalidSNs:", invalidSNs);

    if (invalidSNs.length > 0) {
      alert(
        `Nomor seri berikut bukan dari produk ini atau sudah terjual: ${invalidSNs.join(", ")}`,
      );
      return;
    }

    setIsProcessingSN(true);
    try {
      // Update SN status to Damaged with reason
      const { updateSerialNumberStatus } = await import("../../app/services/product.service");
      for (const sn of validSNs) {
        await updateSerialNumberStatus(sn, "Damaged", snOperationReason);
      }

      alert(
        `${validSNs.length} nomor seri berhasil ditandai sebagai rusak/hilang dari ${removingSNProduct.model}.`,
      );

      // Refresh SNs and recalculate stock
      if (onRefreshSNs) {
        await onRefreshSNs();
      }

      setRemovingSNProduct(null);
      setSelectedSNs([]);
      setSNOperationReason("");
    } catch (error) {
      console.error("Failed to remove serial numbers:", error);
      alert("Gagal menghapus nomor seri.");
    } finally {
      setIsProcessingSN(false);
    }
  };

  const toggleSNSelection = (sn: string) => {
    setSelectedSNs((prev) => (prev.includes(sn) ? prev.filter((s) => s !== sn) : [...prev, sn]));
  };

  const handleQuickSelectAll = (availableSNs: string[]) => {
    if (selectedSNs.length === availableSNs.length) {
      setSelectedSNs([]);
    } else {
      setSelectedSNs(availableSNs);
    }
  };

  // Step 1: Validate add and show confirmation modal
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProductSupplier) {
      alert("Supplier harus dipilih!");
      return;
    }

    const serialList = newSerials
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (newProductHasSN && serialList.length === 0) {
      alert("Produk dengan Serial Number harus memiliki minimal 1 nomor seri.");
      return;
    }

    if (!newProductHasSN && newProductQuantity <= 0) {
      alert("Jumlah stok harus lebih dari 0.");
      return;
    }

    // Duplicate detection
    const warnings: string[] = [];
    const brandLower = (newP.brand || "").trim().toLowerCase();
    const modelLower = (newP.model || "").trim().toLowerCase();

    const sameProduct = products.find(
      (p) => p.brand.trim().toLowerCase() === brandLower && p.model.trim().toLowerCase() === modelLower,
    );
    if (sameProduct) {
      warnings.push(`Produk "${sameProduct.brand} ${sameProduct.model}" sudah terdaftar di sistem (stok: ${getProductStock(sameProduct)}).`);
    }

    setAddDuplicateWarnings(warnings);
    setConfirmAdd(true);
  };

  // Step 2: Actually create the product after confirmation
  const handleAddConfirm = async () => {
    setIsAdding(true);
    const serialList = newSerials
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const p: Product = {
      id: `BRC-${Date.now()}`,
      brand: newP.brand || "N/A",
      model: newP.model || "N/A",
      category: newP.category as any,
      mount: newP.mount as any,
      condition: newP.condition as any,
      price: newP.price || 0,
      cogs: newP.cogs || 0,
      warrantyMonths: newP.warrantyMonths || 12,
      warrantyType: newP.warrantyType as any,
      stock: newProductHasSN ? serialList.length : newProductQuantity,
      hasSerialNumber: newProductHasSN,
      supplier: newProductSupplier,
      dateRestocked: new Date(newProductDate).toISOString(),
      invoiceNumber: newProductInvoiceNumber || undefined,
      taxEnabled: newP.taxEnabled,
    };

    // Include serialNumbers in the product for API
    const productWithSerials = {
      ...p,
      serialNumbers: newProductHasSN ? serialList : undefined,
      quantity: newProductHasSN ? undefined : newProductQuantity,
    };

    try {
      onAddProduct(productWithSerials, newProductHasSN ? serialList : []);
      setShowAddModal(false);
      setConfirmAdd(false);
      setNewP({
        brand: "",
        model: "",
        category: "Body",
        condition: "New",
        price: 0,
        cogs: 0,
        warrantyMonths: 12,
        warrantyType: "Official Sony Indonesia",
        taxEnabled: true,
      });
      setNewSerials("");
      setNewProductHasSN(false);
      setNewProductQuantity(1);
      setNewProductSupplier("");
      setNewProductDate(new Date().toISOString().split("T")[0]);
      setNewProductInvoiceNumber("");
    } finally {
      setIsAdding(false);
    }
  };

  // Step 2: Actually update the product after edit confirmation
  const handleEditConfirm = async () => {
    if (!onEditProduct || !editingProduct) return;
    setIsUpdating(true);
    try {
      await onEditProduct(editingProduct.id, editForm);
      setEditingProduct(null);
      setConfirmEdit(false);
      setEditError(null);
    } catch (error: any) {
      setEditError(error.message || "Gagal mengupdate produk");
      setConfirmEdit(false); // Close confirmation so error is visible on edit form
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper: check if edit form has changes
  const hasEditChanges = (): boolean => {
    if (!editingProduct) return false;
    return (
      (editForm.brand ?? "") !== editingProduct.brand ||
      (editForm.model ?? "") !== editingProduct.model ||
      (editForm.category ?? "") !== editingProduct.category ||
      (editForm.condition ?? "") !== editingProduct.condition ||
      (editForm.warrantyMonths ?? 0) !== editingProduct.warrantyMonths ||
      (editForm.warrantyType ?? "") !== editingProduct.warrantyType ||
      (editForm.taxEnabled ?? true) !== editingProduct.taxEnabled ||
      (editForm.price ?? 0) !== editingProduct.price ||
      (editForm.cogs ?? 0) !== editingProduct.cogs
    );
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight uppercase">
            Master Inventori & Barcode
          </h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight mt-1">
            Sistem monitoring stok real-time Sinar Bahagia Surabaya.
          </p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setConfirmAdd(false); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all w-full sm:w-auto"
        >
          Input Barang Baru
        </button>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Ketik Merk / Model..."
              className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder-slate-500 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold shadow-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
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
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-6 py-6 text-center">#</th>
                <th
                  className="px-8 py-6 cursor-pointer hover:text-slate-300 select-none"
                  onClick={() => {
                    const currentSort = sorting.find((s) => s.id === "brand");
                    if (!currentSort) {
                      setSorting([{ id: "brand", desc: false }]);
                    } else if (currentSort.desc === false) {
                      setSorting([{ id: "brand", desc: true }]);
                    } else {
                      setSorting([]);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    Produk
                    {sorting.find((s) => s.id === "brand")?.desc === false && (
                      <span className="text-xs">▲</span>
                    )}
                    {sorting.find((s) => s.id === "brand")?.desc === true && (
                      <span className="text-xs">▼</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-8 py-6 cursor-pointer hover:text-slate-300 select-none"
                  onClick={() => {
                    const currentSort = sorting.find((s) => s.id === "stock");
                    if (!currentSort) {
                      setSorting([{ id: "stock", desc: false }]);
                    } else if (currentSort.desc === false) {
                      setSorting([{ id: "stock", desc: true }]);
                    } else {
                      setSorting([]);
                    }
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    Status Stok
                    {sorting.find((s) => s.id === "stock")?.desc === false && (
                      <span className="text-xs">▲</span>
                    )}
                    {sorting.find((s) => s.id === "stock")?.desc === true && (
                      <span className="text-xs">▼</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-8 py-6 text-right cursor-pointer hover:text-slate-300 select-none"
                  onClick={() => {
                    const currentSort = sorting.find((s) => s.id === "price");
                    if (!currentSort) {
                      setSorting([{ id: "price", desc: false }]);
                    } else if (currentSort.desc === false) {
                      setSorting([{ id: "price", desc: true }]);
                    } else {
                      setSorting([]);
                    }
                  }}
                >
                  <div className="flex items-center justify-end gap-2">
                    Retail Price
                    {sorting.find((s) => s.id === "price")?.desc === false && (
                      <span className="text-xs">▲</span>
                    )}
                    {sorting.find((s) => s.id === "price")?.desc === true && (
                      <span className="text-xs">▼</span>
                    )}
                  </div>
                </th>
                {canViewSensitive && (
                  <th
                    className="px-8 py-6 text-right cursor-pointer hover:text-indigo-300 select-none"
                    onClick={() => {
                      const currentSort = sorting.find((s) => s.id === "cogs");
                      if (!currentSort) {
                        setSorting([{ id: "cogs", desc: false }]);
                      } else if (currentSort.desc === false) {
                        setSorting([{ id: "cogs", desc: true }]);
                      } else {
                        setSorting([]);
                      }
                    }}
                  >
                    <div className="flex items-center justify-end gap-2">
                      Capital Price (HPP)
                      {sorting.find((s) => s.id === "cogs")?.desc === false && (
                        <span className="text-xs">▲</span>
                      )}
                      {sorting.find((s) => s.id === "cogs")?.desc === true && (
                        <span className="text-xs">▼</span>
                      )}
                    </div>
                  </th>
                )}
                <th
                  className="px-8 py-6 cursor-pointer hover:text-slate-300 select-none"
                  onClick={() => {
                    const currentSort = sorting.find((s) => s.id === "supplier");
                    if (!currentSort) {
                      setSorting([{ id: "supplier", desc: false }]);
                    } else if (currentSort.desc === false) {
                      setSorting([{ id: "supplier", desc: true }]);
                    } else {
                      setSorting([]);
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    Supplier
                    {sorting.find((s) => s.id === "supplier")?.desc === false && (
                      <span className="text-xs">▲</span>
                    )}
                    {sorting.find((s) => s.id === "supplier")?.desc === true && (
                      <span className="text-xs">▼</span>
                    )}
                  </div>
                </th>
                <th className="px-8 py-6 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {sortedProducts.map((p, index) => {
                const currentStock = getProductStock(p);
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors group ${p.hidden ? "opacity-50 bg-slate-50/50" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-6 py-6 text-center">
                      <span className="font-black text-slate-400 text-xs">{index + 1}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        {p.hidden === 1 && (
                          <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest w-fit mb-1">
                            Hidden
                          </span>
                        )}
                        <span className="font-black text-slate-900 text-sm uppercase tracking-tighter">
                          {p.brand} {p.model}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                          {p.category} • {p.condition} • {p.warrantyMonths / 12} Thn Garansi
                        </span>
                        {p.invoiceNumber && (
                          <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">
                            Inv: {p.invoiceNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center space-x-2.5">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${currentStock <= 2 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"}`}
                        ></div>
                        <span
                          className={`font-black text-xs uppercase tracking-widest ${currentStock <= 2 ? "text-red-600" : "text-slate-900"}`}
                        >
                          {currentStock} Unit
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase mt-1 ${p.hasSerialNumber === true ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {p.hasSerialNumber === true ? "SN" : "Non-SN"}
                      </span>
                      {p.taxEnabled && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase mt-1 ml-1 bg-amber-100 text-amber-700">
                          PPN
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-slate-900 tracking-tighter">
                      {formatIDR(p.price)}
                    </td>
                    {canViewSensitive && (
                      <td className="px-8 py-6 text-right font-bold text-indigo-600 tracking-tighter tabular-nums">
                        {formatIDR(p.cogs)}
                      </td>
                    )}
                    <td className="px-8 py-6">
                      <span className="text-xs font-medium text-slate-600">
                        {p.supplier || "-"}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                        {p.dateRestocked
                          ? new Date(p.dateRestocked).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                      {/* HOTFIX */}
                      <span className="text-xs font-medium text-slate-400">
                        {p.invoiceNumber || ""}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {onEditProduct && (
                          <button
                            onClick={() => {
                              if (p.hidden) {
                                setEditError(
                                  "Produk yang disembunyikan tidak dapat diedit. Silakan tampilkan dulu.",
                                );
                                return;
                              }
                              setEditingProduct(p);
                              setConfirmEdit(false);
                              setEditForm({
                                brand: p.brand,
                                model: p.model,
                                category: p.category,
                                mount: p.mount,
                                condition: p.condition,
                                price: p.price,
                                cogs: p.cogs,
                                warrantyMonths: p.warrantyMonths,
                                warrantyType: p.warrantyType,
                                taxEnabled: p.taxEnabled,
                              });
                              setEditError(null);
                            }}
                            className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg text-xs font-bold transition-all"
                            title="Edit Produk"
                          >
                            <svg
                              className="w-4 h-4"
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
                        {onDeleteProduct && p.hidden !== 1 && (
                          <button
                            onClick={() => setDeletingProduct(p)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg text-xs font-bold transition-all"
                            title="Hapus Produk"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                        {/* Stock Adjustment - for non-SN products, not hidden */}
                        {p.hidden !== 1 && !p.hasSerialNumber && (
                          <button
                            onClick={() => setSimpleAdjustProduct(p)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg text-xs font-bold transition-all"
                            title="Sesuaikan Stok"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                              />
                            </svg>
                          </button>
                        )}
                        {/* Add SN - for SN products, not hidden */}
                        {p.hidden !== 1 && p.hasSerialNumber && (
                          <button
                            onClick={() => setAddingSNProduct(p)}
                            className="text-green-600 hover:bg-green-50 p-2 rounded-lg text-xs font-bold transition-all"
                            title="Tambah SN"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>
                        )}
                        {/* Reduce SN - for SN products, not hidden */}
                        {p.hidden !== 1 && p.hasSerialNumber && (
                          <button
                            onClick={() => setRemovingSNProduct(p)}
                            className="text-orange-600 hover:bg-orange-50 p-2 rounded-lg text-xs font-bold transition-all"
                            title="Kurangi SN"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 12H4"
                              />
                            </svg>
                          </button>
                        )}
                        {/* Restore - for hidden products */}
                        {p.hidden === 1 && onRestoreProduct && (
                          <button
                            onClick={() => onRestoreProduct(p.id)}
                            className="text-green-600 hover:bg-green-50 p-2 rounded-lg text-xs font-bold transition-all"
                            title="Tampilkan Produk"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </button>
                        )}
                        {/* Toggle Hide - for both hidden and visible products */}
                        {onToggleHidden && (
                          <button
                            onClick={() => onToggleHidden(p.id, p.hidden !== 1)}
                            className={`p-2 rounded-lg text-xs font-bold transition-all ${p.hidden === 1 ? "text-indigo-600 hover:bg-indigo-50" : "text-slate-400 hover:bg-slate-100"}`}
                            title={p.hidden === 1 ? "Tampilkan Produk" : "Sembunyikan Produk"}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              {p.hidden === 1 ? (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              ) : (
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                />
                              )}
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages >= 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500">Tampilkan</span>
              <select
                value={perPage}
                onChange={(e) => {
                  onPerPageChange?.(Number(e.target.value));
                  onPageChange?.(1);
                }}
                className="px-3 py-2 rounded-xl text-sm font-bold border border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-slate-500">
                dari <span className="font-medium">{totalItems}</span> produk | Halaman{" "}
                <span className="font-medium">{currentPage}</span> dari{" "}
                <span className="font-medium">{totalPages}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange?.(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange?.(pageNum)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                      currentPage === pageNum
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => onPageChange?.(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add SN Modal */}
      {addingSNProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-green-50/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-green-800 uppercase tracking-tighter">
                  Tambah via SN
                </h2>
                <p className="text-[10px] text-green-600 font-bold uppercase mt-2">
                  {addingSNProduct.brand} {addingSNProduct.model}
                </p>
                <p className="text-[10px] text-green-500 font-medium mt-1">
                  Stok saat ini: {getProductStock(addingSNProduct)} unit
                </p>
              </div>
              <button
                onClick={() => setAddingSNProduct(null)}
                className="text-slate-300 hover:text-slate-900 transition-colors"
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
            <form
              onSubmit={handleAddSN}
              className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar space-y-6"
            >
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Input Nomor Seri (Satu Per Baris)
                </label>
                <textarea
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-mono focus:ring-4 focus:ring-green-500/10 outline-none h-32 resize-none"
                  value={newSNInput}
                  onChange={(e) => setNewSNInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const scannedSN = newSNInput.trim();
                      if (scannedSN) {
                        setNewSNInput((prev) => prev + (prev ? "\n" : "") + scannedSN);
                      }
                    }
                  }}
                  placeholder="Contoh:&#10;ABC123456&#10;ABC123457&#10;ABC123458"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  Masukkan 1 SN per baris. Setiap SN akan menambah 1 unit stok. Tekan Enter untuk
                  tambah SN cepat.
                </p>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Supplier
                </label>
                <SearchableSelect
                  suppliers={suppliers}
                  value={snOperationSupplier}
                  onChange={setSNOperationSupplier}
                  required
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  No. Invoice
                </label>
                <input
                  type="text"
                  value={snOperationInvoiceNumber}
                  onChange={(e) => setSNOperationInvoiceNumber(e.target.value)}
                  placeholder="e.g., INV/2026/001"
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-green-500/10 outline-none"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tanggal
                </label>
                <input
                  type="date"
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-green-500/10 outline-none"
                  value={snOperationDate}
                  onChange={(e) => setSNOperationDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Alasan Penambahan
                </label>
                <select
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-green-500/10 outline-none appearance-none"
                  value={snOperationReason}
                  onChange={(e) => setSNOperationReason(e.target.value)}
                  required
                >
                  <option value="">Pilih Alasan...</option>
                  <option value="Restok Barang Baru">Restok Barang Baru</option>
                  <option value="Barang Retur Customer">Barang Retur Customer</option>
                  <option value="Penyesuaian Stok">Penyesuaian Stok</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setAddingSNProduct(null)}
                  className="flex-1 py-4 lg:py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessingSN}
                  className="flex-1 py-4 lg:py-5 bg-green-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessingSN ? "Memproses..." : "Tambah Stok"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove SN Modal */}
      {removingSNProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-red-50/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-red-800 uppercase tracking-tighter">
                  Kurangi via SN
                </h2>
                <p className="text-[10px] text-red-600 font-bold uppercase mt-2">
                  {removingSNProduct.brand} {removingSNProduct.model}
                </p>
                <p className="text-[10px] text-red-500 font-medium mt-1">
                  Stok saat ini: {getProductStock(removingSNProduct)} unit
                </p>
              </div>
              <button
                onClick={() => {
                  setRemovingSNProduct(null);
                  setSelectedSNs([]);
                }}
                className="text-slate-300 hover:text-slate-900 transition-colors"
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
            <form
              onSubmit={handleRemoveSN}
              className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar space-y-6"
            >
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Pilih Nomor Seri untuk Dihapus
                </label>
                <div className="border border-slate-200 rounded-2xl max-h-48 overflow-y-auto custom-scrollbar">
                  {sns.filter(
                    (sn) => sn.productId === removingSNProduct.id && sn.status === "In Stock",
                  ).length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-sm">
                      Tidak ada stok tersedia
                    </div>
                  ) : (
                    sns
                      .filter(
                        (sn) => sn.productId === removingSNProduct.id && sn.status === "In Stock",
                      )
                      .map((sn) => (
                        <label
                          key={sn.sn}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSNs.includes(sn.sn)}
                            onChange={() => {
                              setSelectedSNs((prev) =>
                                prev.includes(sn.sn)
                                  ? prev.filter((s) => s !== sn.sn)
                                  : [...prev, sn.sn],
                              );
                            }}
                            className="w-5 h-5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm font-mono font-bold text-slate-700">
                            {sn.sn}
                          </span>
                        </label>
                      ))
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Pilih SN yang ingin ditandai sebagai rusak/hilang. Setiap SN akan mengurangi 1
                  unit stok.
                </p>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Alasan Pengurangan
                </label>
                <select
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-red-500/10 outline-none appearance-none"
                  value={snOperationReason}
                  onChange={(e) => setSNOperationReason(e.target.value)}
                  required
                >
                  <option value="">Pilih Alasan...</option>
                  <option value="Barang Rusak">Barang Rusak</option>
                  <option value="Barang Hilang">Barang Hilang</option>
                  <option value="Penyesuaian Stok">Penyesuaian Stok</option>
                  <option value="Koreksi Error">Koreksi Error</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setRemovingSNProduct(null);
                    setSelectedSNs([]);
                  }}
                  className="flex-1 py-4 lg:py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessingSN || selectedSNs.length === 0}
                  className="flex-1 py-4 lg:py-5 bg-red-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessingSN ? "Memproses..." : "Kurangi Stok"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                Penerimaan Barang Baru
              </h2>
              <button
                onClick={() => { setShowAddModal(false); setConfirmAdd(false); }}
                disabled={isAdding}
                className="text-slate-400 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <form
              onSubmit={handleAddSubmit}
              className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6"
           >
              <div className="md:col-span-2">
                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">
                  Produk Info
                </h3>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Merk & Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Merk"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                    value={newP.brand}
                    onChange={(e) => setNewP({ ...newP, brand: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Model"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                    value={newP.model}
                    onChange={(e) => setNewP({ ...newP, model: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Kategori & Kondisi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none"
                    value={newP.category}
                    onChange={(e) => setNewP({ ...newP, category: e.target.value as any })}
                  >
                    <option value="Body">Body</option>
                    <option value="Lens">Lens</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none"
                    value={newP.condition}
                    onChange={(e) => setNewP({ ...newP, condition: e.target.value as any })}
                  >
                    <option value="New">Baru</option>
                    <option value="Used">Bekas</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Garansi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Bulan"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                    value={newP.warrantyMonths || 12}
                    onChange={(e) => setNewP({ ...newP, warrantyMonths: Number(e.target.value) })}
                  />
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none"
                    value={newP.warrantyType || "Distributor"}
                    onChange={(e) => setNewP({ ...newP, warrantyType: e.target.value as any })}
                  >
                    <option value="Distributor">Distributor</option>
                    <option value="Toko">Toko</option>
                    <option value="No Warranty">No Warranty</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  PPN
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newP.taxEnabled === true}
                    onChange={(e) => setNewP({ ...newP, taxEnabled: e.target.checked === true })}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Produk ini dikenakan PPN</span>
                </label>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Harga Jual (Retail)
                </label>
                <RupiahInput
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                  value={newP.price || 0}
                  onChange={(val) => setNewP({ ...newP, price: val })}
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Harga Modal (HPP)
                </label>
                <RupiahInput
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                  value={newP.cogs || 0}
                  onChange={(val) => setNewP({ ...newP, cogs: val })}
                />
              </div>

              <div className="md:col-span-2">
                <div className="border-t border-slate-200 my-4"></div>
                <h3 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-4">
                  Stok Info
                </h3>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newProductHasSN === true}
                    onChange={(e) => setNewProductHasSN(e.target.checked === true)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-bold text-slate-700">
                    Produk ini memiliki Serial Number
                  </span>
                </label>
              </div>

              {newProductHasSN ? (
                <div className="md:col-span-2 space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Serial Numbers (Satu Per Baris)
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono font-bold outline-none h-32 resize-none"
                    placeholder="SN-12345&#10;SN-67890&#10;..."
                    value={newSerials}
                    onChange={(e) => setNewSerials(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 italic">
                    Otomatis menghitung jumlah stok berdasarkan S/N yang diinput.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Jumlah Stok
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                    value={newProductQuantity}
                    onChange={(e) => setNewProductQuantity(Number(e.target.value))}
                  />
                </div>
              )}

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Supplier
                </label>
                <SearchableSelect
                  suppliers={suppliers}
                  value={newProductSupplier}
                  onChange={setNewProductSupplier}
                  required
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  No. Invoice
                </label>
                <input
                  type="text"
                  value={newProductInvoiceNumber}
                  onChange={(e) => setNewProductInvoiceNumber(e.target.value)}
                  placeholder="e.g., INV/2026/001"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tanggal
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                  value={newProductDate}
                  onChange={(e) => setNewProductDate(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-2 flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setConfirmAdd(false); }}
                  disabled={isAdding}
                  className="flex-1 py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? "Menyimpan..." : "Lihat Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                Edit Produk
              </h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setEditError(null);
                  setConfirmEdit(false);
                }}
                disabled={isUpdating}
                className="text-slate-400 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingProduct) return;
                // Duplicate detection (exclude current product)
                const warnings: string[] = [];
                const brandLower = (editForm.brand || "").trim().toLowerCase();
                const modelLower = (editForm.model || "").trim().toLowerCase();
                const sameProduct = products.find(
                  (p) => p.id !== editingProduct.id && p.brand.trim().toLowerCase() === brandLower && p.model.trim().toLowerCase() === modelLower,
                );
                if (sameProduct) {
                  warnings.push(`Produk "${sameProduct.brand} ${sameProduct.model}" sudah terdaftar di sistem (stok: ${getProductStock(sameProduct)}).`);
                }
                setEditDuplicateWarnings(warnings);
                setConfirmEdit(true);
              }}
              className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {editError && (
                <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm font-bold text-red-800">{editError}</p>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Merk & Model
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Merk"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                    value={editForm.brand || ""}
                    onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Model"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                    value={editForm.model || ""}
                    onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Kategori & Kondisi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none"
                    value={editForm.category || ""}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value as any })}
                  >
                    <option value="Body">Body</option>
                    <option value="Lens">Lens</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none"
                    value={editForm.condition || ""}
                    onChange={(e) => setEditForm({ ...editForm, condition: e.target.value as any })}
                  >
                    <option value="New">Baru</option>
                    <option value="Used">Bekas</option>
                  </select>
                </div>
              </div>
              {/* <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Mount</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none" value={editForm.mount || ''} onChange={e => setEditForm({...editForm, mount: e.target.value as any})}>
                  <option value="">-</option>
                  <option value="E-Mount">E-Mount</option>
                  <option value="A-Mount">A-Mount</option>
                  <option value="Canon EF">Canon EF</option>
                  <option value="Canon RF">Canon RF</option>
                  <option value="Nikon F">Nikon F</option>
                  <option value="Nikon Z">Nikon Z</option>
                  <option value="Micro 4/3">Micro 4/3</option>
                  <option value="Universal">Universal</option>
                </select>
              </div> */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Garansi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Bulan"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                    value={editForm.warrantyMonths || 0}
                    onChange={(e) =>
                      setEditForm({ ...editForm, warrantyMonths: Number(e.target.value) })
                    }
                    required
                  />
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-bold outline-none"
                    value={editForm.warrantyType || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, warrantyType: e.target.value as any })
                    }
                  >
                    <option value="Distributor">Distributor</option>
                    <option value="Toko">Toko</option>
                    <option value="No Warranty">No Warranty</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  PPN
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.taxEnabled === true}
                    onChange={(e) => {
                      console.log("[DEBUG] Checkbox onChange, checked:", e.target.checked);
                      setEditForm({ ...editForm, taxEnabled: e.target.checked === true });
                    }}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-bold text-slate-700">Produk ini dikenakan PPN</span>
                </label>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Harga Jual (Retail)
                </label>
                <RupiahInput
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                  value={editForm.price || 0}
                  onChange={(val) => setEditForm({ ...editForm, price: val })}
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Harga Modal (HPP)
                </label>
                <RupiahInput
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold outline-none"
                  value={editForm.cogs || 0}
                  onChange={(val) => setEditForm({ ...editForm, cogs: val })}
                />
              </div>
              <div className="md:col-span-2 flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setEditError(null);
                    setConfirmEdit(false);
                  }}
                  disabled={isUpdating}
                  className="flex-1 py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Menyimpan..." : "Lihat Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Product Confirmation Modal */}
      {confirmAdd && showAddModal && (
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
                    Konfirmasi Penerimaan Barang
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                    Pastikan data sudah benar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmAdd(false)}
                disabled={isAdding}
                className="text-slate-300 hover:text-slate-600 disabled:cursor-not-allowed"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {addDuplicateWarnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Kemungkinan Duplikat</p>
                      {addDuplicateWarnings.map((w, i) => (
                        <p key={i} className="text-sm text-amber-700 font-medium">{w}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Data Produk</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 font-medium">Merk & Model</span>
                    <span className="text-sm font-black text-slate-900">{newP.brand} {newP.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 font-medium">Kategori</span>
                    <span className="text-sm font-bold text-slate-700">{newP.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 font-medium">Kondisi</span>
                    <span className="text-sm font-bold text-slate-700">{newP.condition === "New" ? "Baru" : "Bekas"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 font-medium">Garansi</span>
                    <span className="text-sm font-bold text-slate-700">{newP.warrantyMonths} Bulan ({newP.warrantyType})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 font-medium">PPN</span>
                    <span className="text-sm font-bold text-slate-700">{newP.taxEnabled ? "Ya" : "Tidak"}</span>
                  </div>
                  <div className="border-t border-slate-200 my-2"></div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 font-medium">Harga Jual</span>
                    <span className="text-sm font-black text-slate-900">{formatIDR(newP.price || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 font-medium">Harga Modal</span>
                    <span className="text-sm font-black text-indigo-600">{formatIDR(newP.cogs || 0)}</span>
                  </div>
                  <div className="border-t border-slate-200 my-2"></div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 font-medium">Tipe Stok</span>
                    <span className="text-sm font-bold text-slate-700">{newProductHasSN ? "Serial Number" : "Non-SN"}</span>
                  </div>
                  {newProductHasSN ? (
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500 font-medium">Jumlah SN</span>
                      <span className="text-sm font-black text-slate-900">
                        {newSerials.split("\n").map(s => s.trim()).filter(s => s.length > 0).length} unit
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500 font-medium">Jumlah Stok</span>
                      <span className="text-sm font-black text-slate-900">{newProductQuantity} unit</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-500 font-medium">Supplier</span>
                    <span className="text-sm font-bold text-slate-700">{newProductSupplier}</span>
                  </div>
                  {newProductInvoiceNumber && (
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500 font-medium">No. Invoice</span>
                      <span className="text-sm font-bold text-indigo-600">{newProductInvoiceNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAdd(false)}
                  disabled={isAdding}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  Kembali
                </button>
                <button
                  onClick={handleAddConfirm}
                  disabled={isAdding}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    "Ya, Simpan Produk"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Confirmation Modal */}
      {confirmEdit && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">
                    Konfirmasi Perubahan
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                    Pastikan perubahan sudah benar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmEdit(false)}
                disabled={isUpdating}
                className="text-slate-300 hover:text-slate-600 disabled:cursor-not-allowed"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {editDuplicateWarnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Kemungkinan Duplikat</p>
                      {editDuplicateWarnings.map((w, i) => (
                        <p key={i} className="text-sm text-amber-700 font-medium">{w}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!hasEditChanges() ? (
                <div className="bg-slate-50 rounded-2xl p-4 mb-4 text-center">
                  <svg className="w-8 h-8 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm font-bold text-slate-400">Tidak ada perubahan terdeteksi</p>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Ringkasan Perubahan</p>
                  <div className="space-y-2">
                    {(editForm.brand ?? "") !== editingProduct.brand && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Merk</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 line-through">{editingProduct.brand}</span>
                          <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                          <span className="text-sm font-black text-slate-900">{editForm.brand}</span>
                        </div>
                      </div>
                    )}
                    {(editForm.model ?? "") !== editingProduct.model && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Model</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 line-through">{editingProduct.model}</span>
                          <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                          <span className="text-sm font-black text-slate-900">{editForm.model}</span>
                        </div>
                      </div>
                    )}
                    {(editForm.category ?? "") !== editingProduct.category && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Kategori</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 line-through">{editingProduct.category}</span>
                          <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                          <span className="text-sm font-black text-slate-900">{editForm.category}</span>
                        </div>
                      </div>
                    )}
                    {(editForm.condition ?? "") !== editingProduct.condition && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Kondisi</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 line-through">{editingProduct.condition === "New" ? "Baru" : "Bekas"}</span>
                          <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                          <span className="text-sm font-black text-slate-900">{editForm.condition === "New" ? "Baru" : "Bekas"}</span>
                        </div>
                      </div>
                    )}
                    {(editForm.warrantyMonths ?? 0) !== editingProduct.warrantyMonths && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Garansi</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 line-through">{editingProduct.warrantyMonths} bln</span>
                          <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                          <span className="text-sm font-black text-slate-900">{editForm.warrantyMonths} bln</span>
                        </div>
                      </div>
                    )}
                    {(editForm.warrantyType ?? "") !== editingProduct.warrantyType && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Tipe Garansi</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 line-through">{editingProduct.warrantyType}</span>
                          <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                          <span className="text-sm font-black text-slate-900">{editForm.warrantyType}</span>
                        </div>
                      </div>
                    )}
                    {(editForm.taxEnabled ?? true) !== editingProduct.taxEnabled && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">PPN</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 line-through">{editingProduct.taxEnabled ? "Ya" : "Tidak"}</span>
                          <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                          <span className="text-sm font-black text-slate-900">{editForm.taxEnabled ? "Ya" : "Tidak"}</span>
                        </div>
                      </div>
                    )}
                    {(editForm.price ?? 0) !== editingProduct.price && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Harga Jual</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 line-through">{formatIDR(editingProduct.price)}</span>
                          <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                          <span className="text-sm font-black text-slate-900">{formatIDR(editForm.price ?? 0)}</span>
                        </div>
                      </div>
                    )}
                    {(editForm.cogs ?? 0) !== editingProduct.cogs && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-medium">Harga Modal</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 line-through">{formatIDR(editingProduct.cogs)}</span>
                          <svg className="w-3 h-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                          <span className="text-sm font-black text-indigo-600">{formatIDR(editForm.cogs ?? 0)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmEdit(false)}
                  disabled={isUpdating}
                  className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  Kembali
                </button>
                <button
                  onClick={handleEditConfirm}
                  disabled={isUpdating || !hasEditChanges()}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    "Ya, Simpan Perubahan"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-md w-full overflow-hidden border border-red-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-red-100 bg-red-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-black text-red-600 uppercase tracking-tighter">
                    Hapus Produk?
                  </h2>
                  <p className="text-[10px] text-red-400 font-bold uppercase mt-1">
                    Tindakan ini tidak dapat dibatalkan
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDeletingProduct(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="text-slate-300 hover:text-slate-900 disabled:cursor-not-allowed transition-colors"
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
                  {deletingProduct.brand} {deletingProduct.model}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-1">{deletingProduct.id}</p>
              </div>

              {deleteError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-bold text-red-800">{deleteError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={async () => {
                    if (!onDeleteProduct) return;
                    setIsDeleting(true);
                    setDeleteError(null);
                    try {
                      await onDeleteProduct(deletingProduct.id);
                      setDeletingProduct(null);
                    } catch (error: any) {
                      setDeleteError(error.message || "Gagal menghapus produk");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="w-full py-4 bg-red-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                      Menghapus...
                    </>
                  ) : (
                    "Hapus Produk"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple Stock Adjustment Modal */}
      {simpleAdjustProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[32px] lg:rounded-[40px] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-indigo-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 lg:p-8 border-b border-indigo-100 bg-indigo-50/50 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-indigo-800 uppercase tracking-tighter">
                  Sesuaikan Stok
                </h2>
                <p className="text-[10px] text-indigo-600 font-bold uppercase mt-2">
                  {simpleAdjustProduct.brand} {simpleAdjustProduct.model}
                </p>
                <p className="text-[10px] text-indigo-500 font-medium mt-1">
                  Stok saat ini: {getProductStock(simpleAdjustProduct)} unit
                </p>
              </div>
              <button
                onClick={() => {
                  setSimpleAdjustProduct(null);
                  setSimpleAdjustAmount(0);
                  setSimpleAdjustReason("");
                  setSimpleAdjustSupplier("");
                  setSimpleAdjustDate(new Date().toISOString().split("T")[0]);
                  setSimpleAdjustInvoiceNumber("");
                }}
                className="text-slate-300 hover:text-slate-900 transition-colors"
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
            <form
              onSubmit={handleSimpleAdjust}
              className="p-6 lg:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1"
            >
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Jumlah Penyesuaian
                </label>
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSimpleAdjustAmount(simpleAdjustAmount - 1)}
                    className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 font-black text-xl hover:bg-red-200 flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="w-24 px-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-xl font-black text-center outline-none"
                    value={simpleAdjustAmount}
                    onChange={(e) => setSimpleAdjustAmount(Number(e.target.value))}
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() => setSimpleAdjustAmount(simpleAdjustAmount + 1)}
                    className="w-14 h-14 rounded-2xl bg-green-100 text-green-600 font-black text-xl hover:bg-green-200 flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <p className="text-center text-sm font-bold">
                  Stok baru:{" "}
                  <span className="text-indigo-600">
                    {Math.max(0, simpleAdjustProduct.stock + simpleAdjustAmount)}
                  </span>{" "}
                  unit
                </p>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Alasan
                </label>
                <select
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none"
                  value={simpleAdjustReason}
                  onChange={(e) => setSimpleAdjustReason(e.target.value)}
                  required
                >
                  <option value="">Pilih Alasan...</option>
                  <option value="Restok Barang Baru">Restok Barang Baru</option>
                  <option value="Barang Retur Customer">Barang Retur Customer</option>
                  <option value="Penyesuaian Stok">Penyesuaian Stok</option>
                  <option value="Koreksi Error">Koreksi Error</option>
                  <option value="Barang Rusak">Barang Rusak</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Supplier
                </label>
                <SearchableSelect
                  suppliers={suppliers}
                  value={simpleAdjustSupplier}
                  onChange={setSimpleAdjustSupplier}
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  No. Invoice
                </label>
                <input
                  type="text"
                  value={simpleAdjustInvoiceNumber}
                  onChange={(e) => setSimpleAdjustInvoiceNumber(e.target.value)}
                  placeholder="e.g., INV/2026/001"
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                />
              </div>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Tanggal
                </label>
                <input
                  type="date"
                  className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none"
                  value={simpleAdjustDate}
                  onChange={(e) => setSimpleAdjustDate(e.target.value)}
                />
              </div>
              <div className="flex gap-4 pt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSimpleAdjustProduct(null);
                    setSimpleAdjustAmount(0);
                    setSimpleAdjustReason("");
                    setSimpleAdjustSupplier("");
                    setSimpleAdjustDate(new Date().toISOString().split("T")[0]);
                    setSimpleAdjustInvoiceNumber("");
                  }}
                  className="flex-1 py-4 lg:py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-3xl text-[10px] uppercase tracking-widest"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 lg:py-5 bg-indigo-600 text-white font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
