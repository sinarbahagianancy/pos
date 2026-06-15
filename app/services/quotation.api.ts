import type { Quotation, QuotationItem, QuotationStatus } from "../types";

const API_BASE = "/api";

export interface PaginatedQuotationsResult {
  quotations: Quotation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QuotationsParams {
  page?: number;
  limit?: number;
  status?: QuotationStatus;
}

const errorFromResponse = async (response: Response, fallback: string): Promise<string> => {
  try {
    const e = await response.json();
    return e.error || fallback;
  } catch {
    return fallback;
  }
};

export const getAllQuotations = async (
  params: QuotationsParams = {},
): Promise<PaginatedQuotationsResult> => {
  const { page = 1, limit = 20, status } = params;
  const queryParams: Record<string, string> = {
    page: page.toString(),
    limit: limit.toString(),
  };
  if (status) queryParams.status = status;

  const queryString = new URLSearchParams(queryParams).toString();
  const response = await fetch(`${API_BASE}/quotations?${queryString}`);
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to fetch quotations"));
  }
  return response.json();
};

export const getQuotationById = async (id: string): Promise<Quotation> => {
  const response = await fetch(`${API_BASE}/quotations/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to fetch quotation"));
  }
  return response.json();
};

export const createQuotation = async (input: {
  customerId?: string;
  customerName: string;
  items: Array<{
    productId: string;
    brand?: string;
    model: string;
    sn: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  tax: number;
  taxEnabled: boolean;
  total: number;
  staffName: string;
  notes?: string;
  poNumber: string;
}): Promise<Quotation> => {
  const response = await fetch(`${API_BASE}/quotations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to create quotation"));
  }
  return response.json();
};

export interface ApproveQuotationInput {
  /**
   * Map of quotation_item.id → SN to use at conversion. Allows user to re-pick SN
   * for SN items per Quotation→Invoice conversion flow. Optional non-SN items.
   */
  itemSns?: Array<{ itemId: string; sn: string }>;
  paymentMethod: string;
  staffName: string;
  dueDate?: string;
  amountPaid?: number;
  /**
   * Optional final price overrides per item (mirrors cart price editing).
   * If omitted, the Quotation's price is used.
   */
  itemPrices?: Array<{ itemId: string; price: number }>;
}

export const approveQuotation = async (
  id: string,
  input: ApproveQuotationInput,
): Promise<{ quotation: Quotation; sale: import("../types").Sale }> => {
  const response = await fetch(`${API_BASE}/quotations/${encodeURIComponent(id)}/approve`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to approve quotation"));
  }
  return response.json();
};

export const rejectQuotation = async (
  id: string,
  reason: string,
  staffName: string,
): Promise<Quotation> => {
  const response = await fetch(`${API_BASE}/quotations/${encodeURIComponent(id)}/reject`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, staffName }),
  });
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to reject quotation"));
  }
  return response.json();
};

export const cancelQuotation = async (
  id: string,
  reason: string,
  staffName: string,
): Promise<Quotation> => {
  const response = await fetch(`${API_BASE}/quotations/${encodeURIComponent(id)}/cancel`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, staffName }),
  });
  if (!response.ok) {
    throw new Error(await errorFromResponse(response, "Failed to cancel quotation"));
  }
  return response.json();
};
