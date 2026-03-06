const API_BASE = '/api';

export interface StaffMember {
  id: string;
  name: string;
  role: 'Admin' | 'Staff';
  createdAt?: string;
}

export interface StoreConfig {
  id: number;
  storeName: string;
  address: string;
  ppnRate: number;
  currency: 'IDR' | 'USD';
  updatedAt?: string;
}

export interface LoginResponse {
  id: string;
  name: string;
  role: 'Admin' | 'Staff';
}

const getAuthHeader = () => {
  const user = localStorage.getItem('currentUser');
  if (user) {
    return {};
  }
  return {};
};

export const login = async (name: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  
  const data = await response.json();
  localStorage.setItem('currentUser', JSON.stringify(data));
  return data;
};

export const logout = () => {
  localStorage.removeItem('currentUser');
};

export const getCurrentUser = (): LoginResponse | null => {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const getStaff = async (): Promise<StaffMember[]> => {
  const response = await fetch(`${API_BASE}/staff`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch staff');
  }
  return response.json();
};

export const addStaff = async (name: string, password: string, role: 'Admin' | 'Staff' = 'Staff'): Promise<StaffMember> => {
  const response = await fetch(`${API_BASE}/staff`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, password, role }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add staff');
  }
  return response.json();
};

export const deleteStaff = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/staff/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete staff');
  }
};

export const updateStaff = async (id: string, data: { name?: string; role?: 'Admin' | 'Staff'; password?: string }): Promise<StaffMember> => {
  const response = await fetch(`${API_BASE}/staff/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update staff');
  }
  return response.json();
};

export const getStoreConfig = async (): Promise<StoreConfig> => {
  const response = await fetch(`${API_BASE}/store-config`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch store config');
  }
  return response.json();
};

export const updateStoreConfig = async (config: Partial<StoreConfig>): Promise<StoreConfig> => {
  const response = await fetch(`${API_BASE}/store-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update store config');
  }
  return response.json();
};
