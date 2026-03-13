import type { Supplier } from '../types';

const API_BASE = '/api';

export const getAllSuppliers = async (): Promise<Supplier[]> => {
  const response = await fetch(`${API_BASE}/suppliers`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch suppliers');
  }
  return response.json();
};

export const createSupplier = async (input: {
  name: string;
  phone?: string;
  address?: string;
}): Promise<Supplier> => {
  const response = await fetch(`${API_BASE}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create supplier');
  }
  return response.json();
};

export const updateSupplier = async (id: string, input: {
  name?: string;
  phone?: string;
  address?: string;
}): Promise<Supplier> => {
  const response = await fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update supplier');
  }
  return response.json();
};

export const deleteSupplier = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete supplier');
  }
};
