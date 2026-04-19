import type { Customer } from "../types";

const API_BASE = "/api";

export interface PaginatedCustomersResult {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomersParams {
  page?: number;
  limit?: number;
}

export const getAllCustomers = async (
  params: CustomersParams = {},
): Promise<PaginatedCustomersResult> => {
  const { page = 1, limit = 20 } = params;
  const queryString = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  }).toString();

  const response = await fetch(`${API_BASE}/customers?${queryString}`);
  if (!response.ok) {
    let message = "Failed to fetch customers";
    try { const e = await response.json(); message = e.error || message; } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const response = await fetch(`${API_BASE}/customers/${id}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    let message = "Failed to fetch customer";
    try { const e = await response.json(); message = e.error || message; } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const createCustomer = async (input: {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  npwp?: string;
  loyaltyPoints?: number;
}): Promise<Customer> => {
  const response = await fetch(`${API_BASE}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    let message = "Failed to create customer";
    try { const e = await response.json(); message = e.error || message; } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const updateCustomer = async (
  id: string,
  input: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    npwp?: string;
    loyaltyPoints?: number;
    staffName?: string;
  },
): Promise<Customer> => {
  const response = await fetch(`${API_BASE}/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    let message = "Failed to update customer";
    try { const e = await response.json(); message = e.error || message; } catch {}
    throw new Error(message);
  }
  return response.json();
};

export const deleteCustomer = async (id: string, staffName: string = "System"): Promise<void> => {
  const response = await fetch(`${API_BASE}/customers/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffName }),
  });
  if (!response.ok) {
    let message = "Failed to delete customer";
    try { const e = await response.json(); message = e.error || message; } catch {}
    throw new Error(message);
  }
};

export const updateCustomerPoints = async (id: string, points: number): Promise<Customer> => {
  return updateCustomer(id, { loyaltyPoints: points });
};
