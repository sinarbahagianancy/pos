import type { Customer } from '../types';

const API_BASE = '/api';

export const getAllCustomers = async (): Promise<Customer[]> => {
  const response = await fetch(`${API_BASE}/customers`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch customers');
  }
  return response.json();
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  const response = await fetch(`${API_BASE}/customers/${id}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch customer');
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create customer');
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
  }
): Promise<Customer> => {
  const response = await fetch(`${API_BASE}/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update customer');
  }
  return response.json();
};

export const deleteCustomer = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/customers/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete customer');
  }
};

export const updateCustomerPoints = async (id: string, points: number): Promise<Customer> => {
  return updateCustomer(id, { loyaltyPoints: points });
};
