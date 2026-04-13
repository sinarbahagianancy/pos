import type { WarrantyClaim } from "../types";

const API_BASE = "/api";

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  model: string;
  sn: string;
  price: number;
  cogs: number;
  warrantyExpiry: string;
}

export interface PaginatedWarrantyClaimsResult {
  claims: WarrantyClaim[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface WarrantyClaimsParams {
  page?: number;
  limit?: number;
}

export const getAllSaleItems = async (): Promise<SaleItem[]> => {
  const response = await fetch(`${API_BASE}/sale-items`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch sale items");
  }
  return response.json();
};

export const getSaleItemsBySaleId = async (saleId: string): Promise<SaleItem[]> => {
  const response = await fetch(`${API_BASE}/sale-items/${saleId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch sale items");
  }
  return response.json();
};

export const getAllWarrantyClaims = async (
  params: WarrantyClaimsParams = {},
): Promise<PaginatedWarrantyClaimsResult> => {
  const { page = 1, limit = 20 } = params;
  const queryString = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  }).toString();

  const response = await fetch(`${API_BASE}/warranty-claims?${queryString}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch warranty claims");
  }
  return response.json();
};

export const createWarrantyClaim = async (input: {
  id: string;
  sn: string;
  productModel: string;
  issue: string;
  status?: string;
}): Promise<WarrantyClaim> => {
  const response = await fetch(`${API_BASE}/warranty-claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create warranty claim");
  }
  return response.json();
};

export const updateWarrantyClaim = async (id: string, status: string): Promise<WarrantyClaim> => {
  const response = await fetch(`${API_BASE}/warranty-claims/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update warranty claim");
  }
  return response.json();
};
