import type { WarrantyClaim } from "../types";

const API_BASE = "/api";

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
    let message = "Failed to fetch warranty claims";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const createWarrantyClaim = async (input: {
  id: string;
  sn: string;
  productModel: string;
  issue: string;
  status?: string;
  staffName?: string;
}): Promise<WarrantyClaim> => {
  const response = await fetch(`${API_BASE}/warranty-claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    let message = "Failed to create warranty claim";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const updateWarrantyClaim = async (
  id: string,
  status: string,
  staffName: string = "System",
): Promise<WarrantyClaim> => {
  const response = await fetch(`${API_BASE}/warranty-claims/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, staffName }),
  });
  if (!response.ok) {
    let message = "Failed to update warranty claim";
    try {
      const e = await response.json();
      message = e.error || message;
    } catch {}
    throw new Error(message);
  }
  return response.json();
};
