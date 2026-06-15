import type { BatchInput, BatchInputItem } from "../types";

const API_BASE = "/api";

export interface PaginatedBatchInputResult {
  batchInputs: BatchInput[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BatchInputParams {
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

export const getAllBatchInput = async (
  params: BatchInputParams = {},
): Promise<PaginatedBatchInputResult> => {
  const { page = 1, limit = 20, search } = params;
  const queryParams: Record<string, string> = {
    page: page.toString(),
    limit: limit.toString(),
  };
  if (search) queryParams.search = search;

  const queryString = new URLSearchParams(queryParams).toString();
  const response = await fetch(`${API_BASE}/batch-input?${queryString}`);
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to fetch Batch Input"));
  }
  return response.json();
};

export const getBatchInputById = async (id: string): Promise<BatchInput> => {
  const response = await fetch(`${API_BASE}/batch-input/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to fetch Batch Input"));
  }
  return response.json();
};

export interface CreateBatchInputItemInput {
  brand?: string;
  model: string;
  category: string;
  condition: string;
  mount?: string;
  warrantyType: string;
  warrantyMonths: number;
  cogs: number;
  price: number;
  hasSerialNumber: boolean;
  taxEnabled: boolean;
  quantity: number;
  sns: string[];
}

export interface CreateBatchInputInput {
  id: string;
  supplier: string;
  date?: string;
  notes?: string;
  staffName: string;
  items: CreateBatchInputItemInput[];
}

export const createBatchInput = async (input: CreateBatchInputInput): Promise<BatchInput> => {
  const response = await fetch(`${API_BASE}/batch-input`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to create Batch Input"));
  }
  return response.json();
};
