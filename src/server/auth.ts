import { client } from '../db';

// Staff and Store Config types
interface StaffMember {
  id: string;
  name: string;
  role: 'Admin' | 'Staff';
  createdAt: string;
}

interface StoreConfig {
  id: number;
  storeName: string;
  address: string;
  ppnRate: number;
  currency: 'IDR' | 'USD';
  monthlyTarget: number;
  updatedAt: string;
}

const parseDbStaffMember = (row: Record<string, unknown>): StaffMember => ({
  id: row.id as string,
  name: row.name as string,
  role: row.role as 'Admin' | 'Staff',
  createdAt: row.created_at as string,
});

const parseDbStoreConfig = (row: Record<string, unknown>): StoreConfig => ({
  id: row.id as number,
  storeName: row.store_name as string,
  address: row.address as string,
  ppnRate: typeof row.ppn_rate === 'string' ? parseFloat(row.ppn_rate) : (row.ppn_rate as number),
  currency: row.currency as 'IDR' | 'USD',
  monthlyTarget: typeof row.monthly_target === 'string' ? parseInt(row.monthly_target) : (row.monthly_target as number) || 500000000,
  updatedAt: row.updated_at as string,
});

let initialized = false;
const initializeDatabase = async () => {
  if (initialized) return;
  
  try {
    await client.unsafe(`ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS password_hash TEXT`).catch(() => {});
    
    const defaultAdmins = [
      { name: 'Nancy', password: 'nancy123', role: 'Admin' },
      { name: 'Mami', password: 'mami123', role: 'Admin' },
      { name: 'Vita', password: 'vita123', role: 'Admin' },
    ];
    
    for (const admin of defaultAdmins) {
      const hash = btoa(admin.password);
      await client.unsafe(
        `INSERT INTO staff_members (name, role, password_hash) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET role = EXCLUDED.role`,
        [admin.name, admin.role, hash]
      ).catch(() => {});
    }
    
    await client.unsafe(
      `INSERT INTO store_config (id, store_name, address, ppn_rate, currency) VALUES (1, 'Sinar Bahagia Surabaya', 'Jl. Kramat Gantung No. 63', 11.00, 'IDR') ON CONFLICT (id) DO NOTHING`
    ).catch(() => {});
    
    initialized = true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

// Auth handlers
export const loginHandler = async (name: string, password: string) => {
  await initializeDatabase();
  
  if (!name || !password) {
    throw new Error('Name and password required');
  }
  
  const passwordHash = btoa(password);
  
  // First check with the hash
  let result = await client.unsafe(
    'SELECT id, name, role, password_hash FROM staff_members WHERE name = $1',
    [name]
  );
  
  if (!result || result.length === 0) {
    throw new Error('Invalid credentials');
  }
  
  const user = result[0];
  
  // Check if password matches hash, or if it's a default admin account with no password set
  if (user.password_hash === passwordHash || (user.password_hash === null && ['Nancy', 'Mami', 'Vita'].includes(name))) {
    // For default accounts without password, set the password now
    if (user.password_hash === null && ['Nancy', 'Mami', 'Vita'].includes(name)) {
      await client.unsafe(
        'UPDATE staff_members SET password_hash = $1 WHERE id = $2',
        [passwordHash, user.id]
      );
    }
    return {
      id: user.id,
      name: user.name,
      role: user.role
    };
  }
  
  throw new Error('Invalid credentials');
};

// Staff handlers
export const getStaffHandler = async () => {
  await initializeDatabase();
  const result = await client.unsafe('SELECT id, name, role, created_at FROM staff_members ORDER BY name');
  return result.map(parseDbStaffMember);
};

export const addStaffHandler = async (name: string, password: string, role: string = 'Staff') => {
  await initializeDatabase();
  
  if (!name || !password) {
    throw new Error('Name and password required');
  }
  
  const passwordHash = btoa(password);
  const result = await client.unsafe(
    'INSERT INTO staff_members (name, role, password_hash) VALUES ($1, $2, $3) RETURNING id, name, role, created_at',
    [name, role, passwordHash]
  );
  
  return parseDbStaffMember(result[0]);
};

export const deleteStaffHandler = async (id: string) => {
  await initializeDatabase();
  await client.unsafe('DELETE FROM staff_members WHERE id = $1', [id]);
};

export const updateStaffHandler = async (id: string, data: { name?: string; role?: 'Admin' | 'Staff'; password?: string }) => {
  await initializeDatabase();
  
  const [current] = await client.unsafe('SELECT * FROM staff_members WHERE id = $1', [id]);
  if (!current) {
    throw new Error('Staff not found');
  }
  
  const name = data.name ?? current.name;
  const role = data.role ?? current.role;
  const passwordHash = data.password ? btoa(data.password) : current.password_hash;
  
  const result = await client.unsafe(
    'UPDATE staff_members SET name = $1, role = $2, password_hash = $3 WHERE id = $4 RETURNING id, name, role, created_at',
    [name, role, passwordHash, id]
  );
  
  return parseDbStaffMember(result[0]);
};

// Store config handlers
export const getStoreConfigHandler = async () => {
  await initializeDatabase();
  const result = await client.unsafe('SELECT * FROM store_config WHERE id = 1');
  if (!result || result.length === 0) {
    throw new Error('Store config not found');
  }
  return parseDbStoreConfig(result[0]);
};

export const updateStoreConfigHandler = async (config: { storeName?: string; address?: string; ppnRate?: number; currency?: string; monthlyTarget?: number }) => {
  await initializeDatabase();
  
  const current = await client.unsafe('SELECT * FROM store_config WHERE id = 1');
  if (!current || current.length === 0) {
    throw new Error('Store config not found');
  }
  
  const storeName = config.storeName ?? current[0].store_name;
  const address = config.address ?? current[0].address;
  const ppnRate = config.ppnRate ?? current[0].ppn_rate;
  const currency = config.currency ?? current[0].currency;
  const monthlyTarget = config.monthlyTarget ?? current[0].monthly_target ?? 500000000;
  
  const result = await client.unsafe(
    'UPDATE store_config SET store_name = $1, address = $2, ppn_rate = $3, currency = $4, monthly_target = $5, updated_at = NOW() WHERE id = 1 RETURNING *',
    [storeName, address, ppnRate, currency, monthlyTarget]
  );
  
  return parseDbStoreConfig(result[0]);
};
