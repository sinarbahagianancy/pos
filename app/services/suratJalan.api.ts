import type { SuratJalan, SuratJalanItem } from "../types";

const API_BASE = "/api";

export interface PaginatedSuratJalanResult {
  suratJalan: SuratJalan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SuratJalanParams {
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

export const getAllSuratJalan = async (
  params: SuratJalanParams = {},
): Promise<PaginatedSuratJalanResult> => {
  const { page = 1, limit = 20, search } = params;
  const queryParams: Record<string, string> = {
    page: page.toString(),
    limit: limit.toString(),
  };
  if (search) queryParams.search = search;

  const queryString = new URLSearchParams(queryParams).toString();
  const response = await fetch(`${API_BASE}/surat-jalan?${queryString}`);
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to fetch Surat Jalan"));
  }
  return response.json();
};

export const getSuratJalanById = async (id: string): Promise<SuratJalan> => {
  const response = await fetch(`${API_BASE}/surat-jalan/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to fetch Surat Jalan"));
  }
  return response.json();
};

export interface CreateSuratJalanItemInput {
  productId: string;
  brand?: string;
  model: string;
  sn?: string;
  quantity?: number;
}

export interface CreateSuratJalanInput {
  customerId?: string;
  customerName: string;
  poNumber: string;
  notes?: string;
  staffName: string;
  items: CreateSuratJalanItemInput[];
}

export const createSuratJalan = async (input: CreateSuratJalanInput): Promise<SuratJalan> => {
  const response = await fetch(`${API_BASE}/surat-jalan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to create Surat Jalan"));
  }
  return response.json();
};
