import type { SuratPenarikan, SuratPenarikanItem, PenarikanReason } from "../types";

const API_BASE = "/api";

export interface PaginatedSuratPenarikanResult {
  suratPenarikan: SuratPenarikan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SuratPenarikanParams {
  page?: number;
  limit?: number;
  search?: string;
}

const errorFromResponse = async (response: Response, fallback: string): Promise<string> => {
  try {
    const e = await response.json();
    return e.error || fallback;
  } catch {
    return fallback;
  }
};

export const getAllSuratPenarikan = async (
  params: SuratPenarikanParams = {},
): Promise<PaginatedSuratPenarikanResult> => {
  const { page = 1, limit = 20, search } = params;
  const queryParams: Record<string, string> = {
    page: page.toString(),
    limit: limit.toString(),
  };
  if (search) queryParams.search = search;

  const queryString = new URLSearchParams(queryParams).toString();
  const response = await fetch(`${API_BASE}/surat-penarikan?${queryString}`);
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to fetch Surat Penarikan"));
  }
  return response.json();
};

export const getSuratPenarikanById = async (id: string): Promise<SuratPenarikan> => {
  const response = await fetch(`${API_BASE}/surat-penarikan/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to fetch Surat Penarikan"));
  }
  return response.json();
};

export interface CreateSuratPenarikanItemInput {
  productId: string;
  brand?: string;
  model: string;
  sn?: string;
  quantity?: number;
}

export interface CreateSuratPenarikanInput {
  recipient: string;
  reason: PenarikanReason;
  alasanLainnya?: string;
  notes?: string;
  staffName: string;
  items: CreateSuratPenarikanItemInput[];
}

export const createSuratPenarikan = async (
  input: CreateSuratPenarikanInput,
): Promise<SuratPenarikan> => {
  const response = await fetch(`${API_BASE}/surat-penarikan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to create Surat Penarikan"));
  }
  return response.json();
};
