import type { Sale, SaleItem } from "../types";

const API_BASE = "/api";

export interface PaginatedSalesResult {
  sales: Sale[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SalesParams {
  page?: number;
  limit?: number;
}

export const getAllSales = async (params: SalesParams = {}): Promise<PaginatedSalesResult> => {
  const { page = 1, limit = 20 } = params;
  const queryString = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  }).toString();

  const response = await fetch(`${API_BASE}/sales?${queryString}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch sales");
  }
  return response.json();
};

export const getSalesByCustomer = async (customerId: string): Promise<Sale[]> => {
  const response = await fetch(`${API_BASE}/sales/customer/${customerId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch customer sales");
  }
  return response.json();
};

export const createSale = async (input: {
  id: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  taxEnabled: boolean;
  total: number;
  paymentMethod: string;
  staffName: string;
  notes?: string;
  dueDate?: string;
  isPaid?: boolean;
  amountPaid?: number;
}): Promise<Sale> => {
  const response = await fetch(`${API_BASE}/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create sale");
  }
  return response.json();
};

export const getAllSaleItems = async (): Promise<SaleItem[]> => {
  const response = await fetch(`${API_BASE}/sale-items`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch sale items");
  }
  return response.json();
};

export const markSaleAsPaid = async (saleId: string, staffName: string): Promise<Sale> => {
  const response = await fetch(`${API_BASE}/sales/${saleId}/mark-paid`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffName }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to mark sale as paid");
  }
  return response.json();
};

export const recordInstallment = async (
  saleId: string,
  amount: number,
  staffName: string,
): Promise<Sale> => {
  const response = await fetch(`${API_BASE}/sales/${saleId}/installment`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, staffName }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to record installment");
  }
  return response.json();
};
