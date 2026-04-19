import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Product,
  SerialNumber,
  Customer,
  Sale,
  PaymentMethod,
  SaleItem,
  StoreConfig,
} from "../../app/types";
import { formatIDR, calculateWarrantyExpiry, formatDate } from "../../app/utils/formatters";
import { pdf } from "@react-pdf/renderer";
import { InvoiceDocument, InvoiceLayout } from "../../app/components/InvoicePDF";
import { RupiahInput } from "../../app/components/RupiahInput";

interface POSProps {
  products: Product[];
  sns: SerialNumber[];
  customers: Customer[];
  onCompleteSale: (sale: Sale) => Promise<void>;
  onCreateCustomer?: (name: string, phone?: string, address?: string) => Promise<Customer>;
  staffName: string;
  isAdmin: boolean;
  taxRate: number;
  storeConfig: StoreConfig;
}

const POSView: React.FC<POSProps> = ({
  products,
  sns,
  customers,
  onCompleteSale,
  onCreateCustomer,
  staffName,
  isAdmin,
  taxRate,
  storeConfig,
}) => {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [dueDate, setDueDate] = useState("");
  const [utangAmountPaid, setUtangAmountPaid] = useState(0);
  const [ppnEnabled, setPpnEnabled] = useState(true);
  const [transactionNotes, setTransactionNotes] = useState("");
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printPdfUrl, setPrintPdfUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isQuotation, setIsQuotation] = useState(false);
  const [invoiceLayout, setInvoiceLayout] = useState<InvoiceLayout>("a5");
  const [confirmCheckout, setConfirmCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{ success: boolean; message: string } | null>(
    null,
  );
  const [editingPriceIdx, setEditingPriceIdx] = useState<number | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>("");

  // Close customer suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".customer-search-container")) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global keyboard listener for barcode scanning (works even when search input is not focused)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Only handle Enter key for barcode scanning
      if (e.key !== "Enter") return;

      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      // If there's a search query, process it (only if not already handled by the input's onKeyDown)
      if (search.trim()) {
        handleBarcodeSearch(e as unknown as React.KeyboardEvent<HTMLInputElement>);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [search, products, sns, cart]);

  // Filter out hidden products

  // Filter out hidden products
  const visibleProducts = useMemo(() => {
    return products.filter((p) => !p.hidden);
  }, [products]);

  // Filter out hidden products' serial numbers
  const visibleProductIds = useMemo(() => {
    return new Set(visibleProducts.map((p) => p.id));
  }, [visibleProducts]);

  const availableSNs = useMemo(() => {
    return sns.filter(
      (sn) =>
        sn.status === "In Stock" &&
        !cart.some((c) => c.sn === sn.sn) &&
        visibleProductIds.has(sn.productId),
    );
  }, [sns, cart, visibleProductIds]);

  // Get effective stock for a product: for SN products, count available serial numbers;
  // for non-SN products, use the product.stock field.
  const getEffectiveStock = (p: Product) =>
    p.hasSerialNumber
      ? availableSNs.filter((sn) => sn.productId === p.id).length
      : p.stock;

  const fuzzyMatch = (text: string, query: string): boolean => {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    if (textLower.includes(queryLower)) return true;
    let queryIndex = 0;
    for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
      if (textLower[i] === queryLower[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === queryLower.length;
  };

  const filteredResults = useMemo(() => {
    if (!search || search.length < 2) return { products: [], serialNumbers: [] };
    const query = search.toLowerCase();

    const matchedProducts = visibleProducts.filter((p) => {
      return fuzzyMatch(p.id, query) || fuzzyMatch(p.model, query) || fuzzyMatch(p.brand, query);
    });

    const matchedSNs = availableSNs.filter((sn) => {
      if (!sn.productId) return fuzzyMatch(sn.sn, query);
      const product = visibleProducts.find((p) => p.id === sn.productId);
      if (!product) return fuzzyMatch(sn.sn, query);
      return fuzzyMatch(sn.sn, query);
    });

    return { products: matchedProducts, serialNumbers: matchedSNs };
  }, [search, visibleProducts, availableSNs]);

  const addToCartByProduct = (product: Product) => {
    const availableSN = availableSNs.find((sn) => sn.productId === product.id);
    let snToUse: string;

    if (availableSN) {
      snToUse = availableSN.sn;
    } else {
      // Generate placeholder SN for products without serial numbers (e.g., from manual stock audit)
      snToUse = `NOSN-${product.id.substring(0, 8)}-${Date.now()}`;
    }

    const warrantyMonths = product.warrantyMonths ?? 0;

    setCart([
      ...cart,
      {
        productId: product.id,
        brand: product.brand,
        model: product.model,
        sn: snToUse,
        price: product.price,
        cogs: product.cogs,
        warrantyExpiry: calculateWarrantyExpiry(warrantyMonths),
      },
    ]);
    setSearch("");
  };

  const addToCart = (sn: SerialNumber) => {
    const product = products.find((p) => p.id === sn.productId);
    if (!product) return;
    const warrantyMonths = product.warrantyMonths ?? 0;
    setCart([
      ...cart,
      {
        productId: product.id,
        brand: product.brand,
        model: product.model,
        sn: sn.sn,
        price: product.price,
        cogs: product.cogs,
        warrantyExpiry: calculateWarrantyExpiry(warrantyMonths),
      },
    ]);
    setSearch("");
  };

  const handleBarcodeSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const query = search.trim();
    if (!query) return;

    // First try to find by product ID
    let matchedProduct = products.find((p) => p.id === query && !p.hidden);
    let snFound = false;
    let snStatus = "";

    // If not found, try to find by serial number
    if (!matchedProduct) {
      const matchedSN = sns.find((sn) => sn.sn === query);
      if (matchedSN) {
        snFound = true;
        snStatus = matchedSN.status;
        if (matchedSN.status === "In Stock") {
          matchedProduct = products.find((p) => p.id === matchedSN.productId && !p.hidden);
        }
      }
    }

    // Check if serial number is already in cart
    if (snFound && query) {
      const isInCart = cart.some((item) => item.sn === query);
      if (isInCart) {
        setToast({ message: "Serial number ini sudah ada di keranjang", type: "error" });
        setSearch("");
        return;
      }
    }

    if (matchedProduct) {
      const effectiveStock = getEffectiveStock(matchedProduct);
      if (effectiveStock === 0) {
        setToast({ message: "Stok produk ini habis", type: "error" });
        setSearch("");
        return;
      }
      addToCartByProduct(matchedProduct);
      setToast({
        message: `${matchedProduct.brand} ${matchedProduct.model} ditambahkan ke keranjang`,
        type: "success",
      });
      setSearch("");
    } else {
      if (snFound) {
        if (snStatus === "Sold") {
          setToast({ message: "Serial number ini sudah terjual", type: "error" });
        } else if (snStatus === "Damaged") {
          setToast({ message: "Serial number ini rusak/hilang", type: "error" });
        } else if (snStatus === "Claimed") {
          setToast({ message: "Serial number ini sedang diklaim", type: "error" });
        } else {
          setToast({ message: "Serial number tidak tersedia", type: "error" });
        }
      } else {
        setToast({ message: "Produk tidak ditemukan", type: "error" });
      }
      setSearch("");
    }

    setTimeout(() => setToast(null), 3000);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartPrice = (index: number, newPrice: number) => {
    setCart(cart.map((item, i) => (i === index ? { ...item, price: newPrice } : item)));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.price, 0);
  const tax = ppnEnabled ? subtotal * taxRate : 0;
  const total = subtotal + tax;

  const generateInvoicePdf = async (sale: Sale, quotation: boolean, layout: InvoiceLayout = "a5") => {
    // Revoke previous blob URL to prevent memory leak
    if (printPdfUrl) URL.revokeObjectURL(printPdfUrl);
    setIsPrinting(true);
    try {
      const saleCustomer =
        customers.find((c) => c.id === sale.customerId) || customers[0];
      const pdfBlob = await pdf(
        <InvoiceDocument
          layout={layout}
          data={{
            storeName: storeConfig.storeName,
            address: storeConfig.address,
            invoiceNumber: sale.id,
            date: formatDate(sale.timestamp),
            customerName: sale.customerName,
            customerPhone: saleCustomer?.phone,
            customerAddress: saleCustomer?.address,
            customerNpwp: saleCustomer?.npwp,
            items: sale.items.map((item) => ({
              merk: item.brand,
              model: item.model,
              sn: quotation ? "" : item.sn,
              price: item.price,
              warrantyExpiry: item.warrantyExpiry,
            })),
            subtotal: sale.subtotal,
            tax: sale.tax,
            taxRate: taxRate * 100,
            taxEnabled: sale.taxEnabled,
            total: sale.total,
            staffName: sale.staffName,
            paymentMethod: quotation
              ? "Menunggu Pembayaran"
              : sale.paymentMethod,
            notes: sale.notes,
            isQuotation: quotation,
          }}
        />
      ).toBlob();
      const url = URL.createObjectURL(pdfBlob);
      setPrintPdfUrl(url);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShowQuotation = async () => {
    if (cart.length === 0) return;

    const customer = selectedCustomer || {
      id: "guest",
      name: "Guest",
      phone: undefined,
      email: undefined,
      address: undefined,
      npwp: undefined,
      loyaltyPoints: 0,
    };

    const quotation: Sale = {
      id: `QTN-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      items: cart,
      subtotal,
      tax,
      taxEnabled: ppnEnabled,
      total,
      paymentMethod: "Quotation" as PaymentMethod,
      staffName,
      notes: transactionNotes,
      timestamp: new Date().toISOString(),
    };

    setLastSale(quotation);
    setIsQuotation(true);
    await generateInvoicePdf(quotation, true, invoiceLayout);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    let customer = selectedCustomer;

    if (!customer && customerSearch.trim()) {
      if (onCreateCustomer) {
        customer = await onCreateCustomer(customerSearch, customerPhone || undefined, undefined);
        setSelectedCustomer(customer);
        setIsRegistered(true);
      }
    } else if (!customer) {
      customer = {
        id: "guest",
        name: "Guest",
        phone: undefined,
        email: undefined,
        address: undefined,
        npwp: undefined,
        loyaltyPoints: 0,
      };
    }

    const sale: Sale = {
      id: `INV-${Date.now()}`,
      customerId: customer!.id,
      customerName: customer!.name,
      items: cart,
      subtotal,
      tax,
      taxEnabled: ppnEnabled,
      total,
      paymentMethod,
      staffName,
      notes: transactionNotes,
      dueDate: paymentMethod === "Utang" && dueDate ? dueDate : undefined,
      isPaid: paymentMethod !== "Utang" || utangAmountPaid >= total,
      amountPaid: paymentMethod === "Utang" ? utangAmountPaid : total,
      timestamp: new Date().toISOString(),
    };
    await onCompleteSale(sale);
    setLastSale(sale);
    setIsQuotation(false);
    setCart([]);
    setCustomerSearch("");
    setCustomerPhone("");
    setSelectedCustomer(null);
    setIsRegistered(false);
    setTransactionNotes("");
    setUtangAmountPaid(0);
  };

  // Customer search logic
  const handleCustomerSearch = (value: string) => {
    setCustomerSearch(value);
    setShowSuggestions(true);

    if (value.trim()) {
      const query = value.toLowerCase();
      const matches = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.phone && c.phone.includes(query)) ||
          (c.address && c.address.toLowerCase().includes(query)),
      );
      setCustomerSuggestions(matches.slice(0, 8));
    } else {
      setCustomerSuggestions([]);
    }
  };

  const handlePhoneSearch = (value: string) => {
    setCustomerPhone(value);
    setShowSuggestions(true);

    if (value.trim()) {
      const query = value.toLowerCase();
      const matches = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.phone && c.phone.includes(query)) ||
          (c.address && c.address.toLowerCase().includes(query)),
      );
      setCustomerSuggestions(matches.slice(0, 8));
    } else {
      setCustomerSuggestions([]);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setCustomerPhone(customer.phone || "");
    setIsRegistered(true);
    setShowSuggestions(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setCustomerPhone("");
    setIsRegistered(false);
    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 h-full pb-32 lg:pb-4 max-w-full mx-auto relative">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          } text-white font-bold text-sm animate-in slide-in-from-top-2`}
        >
          {toast.message}
        </div>
      )}
      {/* Search & Cart Left Panel */}
      <div className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col space-y-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Barcode Scan / Serial Tracking
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Scan Barcode atau ketik S/N Unit..."
              className="w-full px-6 py-4 pl-14 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold"
              value={search}
              autoFocus
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleBarcodeSearch}
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

          {search && search.length >= 2 && (
            <div className="mt-4 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 shadow-xl max-h-96 overflow-y-auto bg-white z-20">
              {filteredResults.products.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Products ({filteredResults.products.length})
                  </div>
                  {filteredResults.products.slice(0, 10).map((product) => {
                    const availableCount = availableSNs.filter(
                      (sn) => sn.productId === product.id,
                    ).length;
                    // Only show NO SN badge for non-SN products that have stock but no serial numbers
                    const hasNoSN = !product.hasSerialNumber && product.stock > 0 && availableCount === 0;
                    const effectiveStock = getEffectiveStock(product);
                    const isOutOfStock = effectiveStock === 0;
                    return (
                      <button
                        key={product.id}
                        onClick={() => addToCartByProduct(product)}
                        disabled={isOutOfStock}
                        className={`w-full p-4 flex items-center justify-between text-left transition-colors group ${isOutOfStock ? "opacity-50 cursor-not-allowed bg-slate-50" : "hover:bg-indigo-50"}`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-indigo-500 uppercase">
                              {product.brand}
                            </span>
                            <p className="font-bold text-slate-900 truncate text-sm">
                              {product.model}
                            </p>
                            {hasNoSN && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded">
                                NO SN
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-tighter">
                            ID: {product.id} •{" "}
                            <span
                              className={`${isOutOfStock ? "text-red-500" : hasNoSN ? "text-amber-600" : "text-green-600"} font-bold`}
                            >
                              {isOutOfStock
                                ? "OUT OF STOCK"
                                : hasNoSN
                                  ? `${product.stock} unit (tanpa SN)`
                                  : `${availableCount} available`}
                            </span>
                          </p>
                        </div>
                        <p className="text-indigo-600 font-black text-sm">
                          {formatIDR(product.price)}
                        </p>
                      </button>
                    );
                  })}
                </>
              )}

              {filteredResults.serialNumbers.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Serial Numbers ({filteredResults.serialNumbers.length})
                  </div>
                  {filteredResults.serialNumbers.slice(0, 10).map((sn) => {
                    const product = products.find((p) => p.id === sn.productId);
                    if (!product) return null;
                    const inCart = cart.some((c) => c.sn === sn.sn);
                    return (
                      <button
                        key={sn.sn}
                        onClick={() => !inCart && addToCart(sn)}
                        disabled={inCart}
                        className={`w-full p-4 flex items-center justify-between text-left transition-colors group ${inCart ? "opacity-50 cursor-not-allowed bg-slate-50" : "hover:bg-indigo-50"}`}
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-black text-indigo-500 uppercase">
                              {product.brand}
                            </span>
                            <p className="font-bold text-slate-900 truncate text-sm">
                              {product.model}
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-tighter">
                            Barcode ID: {product.id} • S/N:{" "}
                            <span className="font-bold text-slate-700">{sn.sn}</span>
                            {inCart && <span className="text-amber-500 ml-1">(DI KERANJANG)</span>}
                          </p>
                        </div>
                        <p className="text-indigo-600 font-black text-sm">
                          {formatIDR(product.price)}
                        </p>
                      </button>
                    );
                  })}
                </>
              )}

              {filteredResults.products.length === 0 &&
                filteredResults.serialNumbers.length === 0 && (
                  <div className="p-10 text-center text-slate-400 font-medium italic">
                    Data tidak ditemukan di inventori aktif.
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="flex-1 bg-white p-6 lg:p-8 rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-black text-slate-900 uppercase tracking-tighter flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <span>Current Cart</span>
            </h2>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
              {cart.length} Unit(s)
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {cart.length > 0 ? (
              cart.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all"
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 font-black border border-slate-100 shrink-0 text-xs">
                      {item.model.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-900 truncate tracking-tight uppercase">
                        {item.model}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
                        S/N: <span className="font-mono text-indigo-600">{item.sn}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    {editingPriceIdx === idx ? (
                      <div className="flex items-center space-x-1">
                        <RupiahInput
                          className="w-28 px-2 py-1 text-sm font-black text-slate-900 border border-indigo-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none tabular-nums"
                          value={parseInt(editingPriceValue, 10) || 0}
                          onChange={(val) => setEditingPriceValue(String(val))}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const parsed = parseInt(editingPriceValue, 10);
                              if (!isNaN(parsed) && parsed > 0) {
                                updateCartPrice(idx, parsed);
                              }
                              setEditingPriceIdx(null);
                            } else if (e.key === "Escape") {
                              setEditingPriceIdx(null);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingPriceIdx(idx);
                          setEditingPriceValue(String(item.price));
                        }}
                        className="font-black text-slate-900 text-sm tracking-tighter hover:text-indigo-600 transition-colors cursor-pointer tabular-nums"
                        title="Klik untuk ubah harga"
                      >
                        {formatIDR(item.price)}
                      </button>
                    )}
                    <button
                      onClick={() => removeFromCart(idx)}
                      className="text-slate-300 hover:text-red-500 transition-all active:scale-90 p-2"
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
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-6 opacity-30">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <p className="text-[10px] font-black uppercase tracking-widest">Register Empty</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Summary Right Panel */}
      <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-6">
        <div className="bg-slate-900 p-8 lg:p-10 rounded-[48px] border border-slate-800 shadow-2xl flex flex-col space-y-10 text-white relative overflow-hidden h-full">
          <div className="space-y-4 customer-search-container">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Customer
              </label>
              {isRegistered && selectedCustomer && (
                <span className="text-[9px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full uppercase tracking-wider">
                  Registered
                </span>
              )}
              {!isRegistered && customerSearch.trim() && (
                <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full uppercase tracking-wider">
                  New Customer
                </span>
              )}
            </div>

            {/* Name Search */}
            <input
              type="text"
              placeholder="Search name..."
              className="w-full px-6 py-4 rounded-2xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-sm font-bold transition-all"
              value={customerSearch}
              onChange={(e) => handleCustomerSearch(e.target.value)}
              onFocus={() => customerSuggestions.length > 0 && setShowSuggestions(true)}
            />

            {/* Phone Search */}
            <input
              type="text"
              placeholder="Search phone number..."
              className="w-full px-6 py-4 rounded-2xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:ring-4 focus:ring-indigo-500/20 outline-none text-sm font-bold transition-all"
              value={customerPhone}
              onChange={(e) => handlePhoneSearch(e.target.value)}
            />

            {/* Clear button when customer selected */}
            {selectedCustomer && (
              <button
                onClick={clearCustomer}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear selection
              </button>
            )}

            {/* Customer Suggestions Dropdown */}
            {showSuggestions && customerSuggestions.length > 0 && (
              <div className="relative">
                <div className="absolute z-50 w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto mt-1">
                  {customerSuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCustomer(c)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-700 border-b border-slate-700 last:border-0 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-white">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.phone || "No phone"}</p>
                        </div>
                        <p className="text-[10px] text-slate-500 max-w-[150px] truncate">
                          {c.address || "No address"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show selected customer address */}
            {selectedCustomer && selectedCustomer.address && (
              <div className="text-[10px] text-slate-400 px-2 font-medium italic">
                {selectedCustomer.address}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Settlement Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(isAdmin
                ? (["Cash", "Debit", "QRIS", "Transfer", "Utang"] as PaymentMethod[])
                : (["Cash", "Debit", "QRIS", "Transfer"] as PaymentMethod[])
              ).map((method) => (
                <button
                  key={method}
                  onClick={() => {
                    setPaymentMethod(method);
                    if (method !== "Utang") setDueDate("");
                  }}
                  className={`py-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${
                    paymentMethod === method
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-500/30 scale-[1.02]"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {method === "Utang" ? "Paylater" : method}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === "Utang" && (
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {paymentMethod === "Utang" && (
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Jumlah Dibayar Sekarang
              </label>
              <RupiahInput
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm font-bold placeholder-slate-600 focus:outline-none focus:border-indigo-500 tabular-nums"
                value={utangAmountPaid}
                onChange={(val) => setUtangAmountPaid(val)}
                placeholder={`Total: ${formatIDR(total)}`}
              />
              {utangAmountPaid > 0 && utangAmountPaid < total && (
                <p className="text-[10px] text-amber-400 font-bold">
                  Sisa: {formatIDR(total - utangAmountPaid)}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Transaction Notes
            </label>
            <input
              type="text"
              value={transactionNotes}
              onChange={(e) => setTransactionNotes(e.target.value)}
              placeholder="e.g., New Buy, Addon, Tukar Tambah"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="mt-auto space-y-4 pt-8 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="ppn-toggle"
                checked={ppnEnabled}
                onChange={(e) => setPpnEnabled(e.target.checked)}
                className="w-5 h-5 rounded border-slate-600 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
              />
              <label htmlFor="ppn-toggle" className="text-xs font-bold text-slate-400 uppercase">
                Include PPN (11%)
              </label>
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-bold">
              <span>Subtotal</span>
              <span className="tabular-nums text-slate-300">{formatIDR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-bold">
              <span>Gov Tax ({ppnEnabled ? (taxRate * 100).toFixed(0) : 0}% PPN)</span>
              <span className="tabular-nums text-slate-300">{formatIDR(tax)}</span>
            </div>
            <div className="flex justify-between items-end pt-6">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">
                  Final Amount
                </p>
                <p className="text-3xl font-black tracking-tighter tabular-nums leading-none">
                  {formatIDR(total)}
                </p>
              </div>
            </div>
          </div>

          <button
            disabled={cart.length === 0 || isPrinting}
            onClick={handleShowQuotation}
            className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border mt-4 ${
              cart.length === 0 || isPrinting
                ? "bg-slate-800 text-slate-600 cursor-not-allowed border-slate-700"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700"
            }`}
          >
            Cetak Quotation
          </button>

          <button
            disabled={cart.length === 0 || !selectedCustomer}
            onClick={() => setConfirmCheckout(true)}
            className={`w-full py-6 rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95 mt-3 ${
              cart.length === 0 || !selectedCustomer
                ? "bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700"
                : "bg-white text-slate-900 hover:bg-slate-50 shadow-white/5"
            }`}
          >
            Selesaikan Transaksi
          </button>
          {!selectedCustomer && cart.length > 0 && (
            <p className="text-[10px] text-amber-400 font-bold text-center mt-2 uppercase tracking-wider">
              Pilih customer terlebih dahulu
            </p>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">
              Konfirmasi Transaksi
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan</span>
                <span className="font-black">
                  {customerSearch || selectedCustomer?.name || "Guest"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode Pembayaran</span>
                <span className="font-black">
                  {paymentMethod === "Utang" ? "Paylater" : paymentMethod}
                </span>
              </div>
              {paymentMethod === "Utang" && dueDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Due Date</span>
                  <span className="font-black">{dueDate}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-slate-100">
                <span className="text-slate-500 font-bold">Total</span>
                <span className="font-black text-green-600 text-lg">{formatIDR(total)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmCheckout(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setConfirmCheckout(false);
                  setIsProcessing(true);

                  setTimeout(async () => {
                    try {
                      await handleCheckout();
                      setProcessResult({ success: true, message: "Transaksi berhasil!" });
                    } catch (error) {
                      setProcessResult({
                        success: false,
                        message: "Transaksi gagal. Silakan coba lagi.",
                      });
                    } finally {
                      setIsProcessing(false);
                    }
                  }, 800);
                }}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="font-black text-slate-900">Memproses Transaksi...</p>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {processResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl ${processResult.success ? "border-2 border-green-500" : "border-2 border-red-500"}`}
          >
            <div className="text-center">
              {processResult.success ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
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
                </div>
              )}
              <h3
                className={`text-xl font-black uppercase mb-2 ${processResult.success ? "text-green-600" : "text-red-600"}`}
              >
                {processResult.success ? "Berhasil!" : "Gagal"}
              </h3>
              <p className="text-slate-600 mb-6">{processResult.message}</p>
              <button
                onClick={async () => {
                  if (processResult.success && lastSale) {
                    setProcessResult(null);
                    await generateInvoicePdf(lastSale, isQuotation, invoiceLayout);
                  } else {
                    setProcessResult(null);
                  }
                }}
                className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest ${processResult.success ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-red-700"}`}
              >
                {processResult.success ? "Lihat Invoice" : "Coba Lagi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {printPdfUrl && (
        <PrintModal
          pdfUrl={printPdfUrl}
          invoiceLayout={invoiceLayout}
          onLayoutChange={async (layout) => {
            setInvoiceLayout(layout);
            if (lastSale) {
              await generateInvoicePdf(lastSale, isQuotation, layout);
            }
          }}
          onClose={() => {
            URL.revokeObjectURL(printPdfUrl);
            setPrintPdfUrl(null);
            setIsQuotation(false);
          }}
        />
      )}

      {isPrinting && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xl z-[90] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="font-bold text-slate-700">Generating PDF...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface PrintModalProps {
  pdfUrl: string;
  invoiceLayout: "a5" | "a4";
  onLayoutChange: (layout: "a5" | "a4") => void;
  onClose: () => void;
}

const PrintModal: React.FC<PrintModalProps> = ({ pdfUrl, invoiceLayout, onLayoutChange, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    } else {
      window.print();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <h3 className="font-black text-slate-900 uppercase tracking-tight">Print Invoice</h3>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => onLayoutChange("a5")}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                  invoiceLayout === "a5"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                A5
              </button>
              <button
                onClick={() => onLayoutChange("a4")}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                  invoiceLayout === "a4"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                A4 (Bawah)
              </button>
            </div>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-indigo-700"
            >
              Print
            </button>
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
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            className="w-full h-full border-0"
            title="Invoice PDF"
          />
        </div>
      </div>
    </div>
  );
};

export default POSView;
