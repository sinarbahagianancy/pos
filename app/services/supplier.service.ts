import type { Supplier } from "../types";

const API_BASE = "/api";

export interface PaginatedSuppliersResult {
  suppliers: Supplier[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SuppliersParams {
  page?: number;
  limit?: number;
}

export const getAllSuppliers = async (
  params: SuppliersParams = {},
): Promise<PaginatedSuppliersResult> => {
  const { page = 1, limit = 20 } = params;
  const queryString = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  }).toString();

  const response = await fetch(`${API_BASE}/suppliers?${queryString}`);
  if (!response.ok) {
    let message = "Failed to fetch suppliers";
    try { const e = await response.json(); message = e.error || message; } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const createSupplier = async (input: {
  name: string;
  phone?: string;
  address?: string;
}): Promise<Supplier> => {
  const response = await fetch(`${API_BASE}/suppliers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    let message = "Failed to create supplier";
    try { const e = await response.json(); message = e.error || message; } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const updateSupplier = async (
  id: string,
  input: {
    name?: string;
    phone?: string;
    address?: string;
  },
): Promise<Supplier> => {
  const response = await fetch(`${API_BASE}/suppliers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    let message = "Failed to update supplier";
    try { const e = await response.json(); message = e.error || message; } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const deleteSupplier = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/suppliers/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    let message = "Failed to delete supplier";
    try { const e = await response.json(); message = e.error || message; } catch {}
    throw new Error(message);
  }
};
