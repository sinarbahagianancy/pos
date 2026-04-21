import type { Product, SerialNumber, AuditLog } from "../types";

const API_BASE = "/api";

export interface PaginatedProductsResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductsParams {
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogsResult {
  logs: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogsParams {
  page?: number;
  limit?: number;
}

export const getAllAuditLogs = async (
  params: AuditLogsParams = {},
): Promise<PaginatedAuditLogsResult> => {
  const { page = 1, limit = 20 } = params;
  const queryString = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  }).toString();

  const response = await fetch(`${API_BASE}/audit-logs?${queryString}`);
  if (!response.ok) {
    let message = "Failed to fetch audit logs";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const getAllProducts = async (
  params: ProductsParams = {},
): Promise<PaginatedProductsResult> => {
  const { page = 1, limit = 20 } = params;
  const queryString = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  }).toString();

  const response = await fetch(`${API_BASE}/products?${queryString}`);
  if (!response.ok) {
    let message = "Failed to fetch products";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  const data = await response.json();
  console.log("[DEBUG] Products from API, sample:", JSON.stringify(data.products?.[0]));
  return data;
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const response = await fetch(`${API_BASE}/products/${id}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    let message = "Failed to fetch product";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const createProduct = async (
  input: Record<string, unknown>,
  staffName: string = "System",
): Promise<Product> => {
  const response = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, staffName }),
  });
  if (!response.ok) {
    let message = "Failed to create product";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const updateProduct = async (
  id: string,
  input: Record<string, unknown>,
  staffName: string = "System",
): Promise<Product | null> => {
  console.log("[SERVICE] updateProduct called, id:", id, "input:", JSON.stringify(input));
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, staffName }),
  });
  console.log("[SERVICE] updateProduct response status:", response.status);
  if (!response.ok) {
    if (response.status === 404) return null;
    let message = "Failed to update product";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  const result = await response.json();
  console.log("[SERVICE] updateProduct result:", JSON.stringify(result));
  return result;
};

export const toggleProductHidden = async (
  id: string,
  hidden: boolean,
  staffName: string = "System",
): Promise<Product | null> => {
  const response = await fetch(`${API_BASE}/products/${id}/toggle-hidden`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hidden, staffName }),
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    const text = await response.text();
    throw new Error(text || "Failed to toggle product visibility");
  }
  return response.json();
};

export const adjustStock = async (
  productId: string,
  newStock: number,
  reason: string,
  staffName: string = "System",
  supplier?: string,
  dateRestocked?: string,
  invoiceNumber?: string,
): Promise<Product | null> => {
  const response = await fetch(`${API_BASE}/products/adjust-stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productId,
      newStock,
      reason,
      staffName,
      supplier,
      dateRestocked,
      invoiceNumber,
    }),
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    let message = "Failed to adjust stock";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const deleteProduct = async (id: string, staffName: string = "System"): Promise<void> => {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffName }),
  });
  if (!response.ok) {
    const text = await response.text();
    if (text) {
      try {
        const parsed = JSON.parse(text);
        throw new Error(parsed.error || "Failed to delete product");
      } catch (e) {
        if (e instanceof Error && e.message !== text) throw e;
        throw new Error(text || "Failed to delete product");
      }
    }
    throw new Error("Failed to delete product");
  }
};

export const restoreProduct = async (
  id: string,
  staffName: string = "System",
): Promise<Product> => {
  const response = await fetch(`${API_BASE}/products/${id}/restore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffName }),
  });
  if (!response.ok) {
    const text = await response.text();
    if (text) {
      try {
        const parsed = JSON.parse(text);
        throw new Error(parsed.error || "Failed to restore product");
      } catch (e) {
        if (e instanceof Error && e.message !== text) throw e;
        throw new Error(text || "Failed to restore product");
      }
    }
    throw new Error("Failed to restore product");
  }
  return response.json();
};

export const getAllSerialNumbers = async (): Promise<SerialNumber[]> => {
  const response = await fetch(`${API_BASE}/serial-numbers`);
  if (!response.ok) {
    let message = "Failed to fetch serial numbers";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const getAvailableSerialNumbers = async (): Promise<SerialNumber[]> => {
  const response = await fetch(`${API_BASE}/serial-numbers?status=In Stock`);
  if (!response.ok) {
    let message = "Failed to fetch serial numbers";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const getSerialNumbersByProduct = async (productId: string): Promise<SerialNumber[]> => {
  const response = await fetch(`${API_BASE}/serial-numbers/${productId}`);
  if (!response.ok) {
    let message = "Failed to fetch serial numbers";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const createSerialNumber = async (input: unknown): Promise<SerialNumber> => {
  const response = await fetch(`${API_BASE}/serial-numbers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    let message = "Failed to create serial number";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const createSerialNumbersBulk = async (
  inputs: unknown[],
  supplier?: string,
  date?: string,
  reason?: string,
  invoiceNumber?: string,
): Promise<SerialNumber[]> => {
  const response = await fetch(`${API_BASE}/serial-numbers/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputs, supplier, date, reason, invoiceNumber }),
  });
  if (!response.ok) {
    let message = "Failed to create serial numbers";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const addSerialNumbers = createSerialNumbersBulk;

export const updateSerialNumberStatus = async (
  sn: string,
  status: "In Stock" | "Sold" | "Claimed" | "Damaged",
  reason?: string,
): Promise<SerialNumber | null> => {
  const response = await fetch(`${API_BASE}/serial-numbers/${sn}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, reason }),
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    let message = "Failed to update serial number status";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const generateInvoicePdf = async (html: string, retries = 3): Promise<Blob> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}/generate-invoice-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        let message = "Failed to generate invoice PDF";
        try {
          const e = await response.json();
          message = e.error || message;
        } catch {}
        throw new Error(message);
      }
      return response.blob();
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  clearTimeout(timeoutId);
  throw lastError || new Error("Failed to generate invoice PDF after retries");
};
