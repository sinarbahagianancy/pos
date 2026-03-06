import type { Sale, SaleItem } from '../types';

const API_BASE = '/api';

export const getAllSales = async (): Promise<Sale[]> => {
  const response = await fetch(`${API_BASE}/sales`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch sales');
  }
  return response.json();
};

export const getSalesByCustomer = async (customerId: string): Promise<Sale[]> => {
  const response = await fetch(`${API_BASE}/sales/customer/${customerId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch customer sales');
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
  total: number;
  paymentMethod: string;
  staffName: string;
}): Promise<Sale> => {
  const response = await fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create sale');
  }
  return response.json();
};

export const getAllSaleItems = async (): Promise<SaleItem[]> => {
  const response = await fetch(`${API_BASE}/sale-items`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch sale items');
  }
  return response.json();
};
