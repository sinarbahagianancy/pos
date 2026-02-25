import type { Product, SerialNumber } from '../types';

const API_BASE = '/api';

export const getAllProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_BASE}/products`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch products');
  }
  return response.json();
};

export const getProductById = async (id: string): Promise<Product | null> => {
  const response = await fetch(`${API_BASE}/products/${id}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch product');
  }
  return response.json();
};

export const createProduct = async (input: unknown): Promise<Product> => {
  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create product');
  }
  return response.json();
};

export const updateProduct = async (id: string, input: unknown): Promise<Product | null> => {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    const error = await response.json();
    throw new Error(error.error || 'Failed to update product');
  }
  return response.json();
};

export const adjustStock = async (
  productId: string, 
  newStock: number, 
  reason: string, 
  staffName: string = 'System'
): Promise<Product | null> => {
  const response = await fetch(`${API_BASE}/products/adjust-stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, newStock, reason, staffName }),
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    const error = await response.json();
    throw new Error(error.error || 'Failed to adjust stock');
  }
  return response.json();
};

export const deleteProduct = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete product');
  }
};

export const getAllSerialNumbers = async (): Promise<SerialNumber[]> => {
  const response = await fetch(`${API_BASE}/serial-numbers`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch serial numbers');
  }
  return response.json();
};

export const getAvailableSerialNumbers = async (): Promise<SerialNumber[]> => {
  const response = await fetch(`${API_BASE}/serial-numbers?status=In Stock`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch serial numbers');
  }
  return response.json();
};

export const getSerialNumbersByProduct = async (productId: string): Promise<SerialNumber[]> => {
  const response = await fetch(`${API_BASE}/serial-numbers/${productId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch serial numbers');
  }
  return response.json();
};

export const createSerialNumber = async (input: unknown): Promise<SerialNumber> => {
  const response = await fetch(`${API_BASE}/serial-numbers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create serial number');
  }
  return response.json();
};

export const createSerialNumbersBulk = async (inputs: unknown[]): Promise<SerialNumber[]> => {
  const response = await fetch(`${API_BASE}/serial-numbers/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputs),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create serial numbers');
  }
  return response.json();
};

export const updateSerialNumberStatus = async (
  sn: string, 
  status: 'In Stock' | 'Sold' | 'Claimed'
): Promise<SerialNumber | null> => {
  const response = await fetch(`${API_BASE}/serial-numbers/${sn}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    const error = await response.json();
    throw new Error(error.error || 'Failed to update serial number status');
  }
  return response.json();
};
