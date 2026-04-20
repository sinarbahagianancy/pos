import { client } from "../db";

// Staff and Store Config types
interface StaffMember {
  id: string;
  name: string;
  role: "Admin" | "Staff";
  createdAt: string;
}

interface StoreConfig {
  id: number;
  storeName: string;
  address: string;
  ppnRate: number;
  currency: "IDR" | "USD";
  monthlyTarget: number;
  updatedAt: string;
}

const parseDbStaffMember = (row: Record<string, unknown>): StaffMember => ({
  id: row.id as string,
  name: row.name as string,
  role: row.role as "Admin" | "Staff",
  createdAt: row.created_at as string,
});

const parseDbStoreConfig = (row: Record<string, unknown>): StoreConfig => ({
  id: row.id as number,
  storeName: row.store_name as string,
  address: row.address as string,
  ppnRate: typeof row.ppn_rate === "string" ? parseFloat(row.ppn_rate) : (row.ppn_rate as number),
  currency: row.currency as "IDR" | "USD",
  monthlyTarget:
    typeof row.monthly_target === "string"
      ? parseInt(row.monthly_target)
      : (row.monthly_target as number) || 500000000,
  updatedAt: row.updated_at as string,
});

let initialized = false;
const initializeDatabase = async () => {
  if (initialized) return;

  try {
    await client
      .unsafe(`ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS password_hash TEXT`)
      .catch(() => {});

    const defaultAdmins = [
      { name: "Nancy", password: "nancy123", role: "Admin" },
      { name: "Mami", password: "mami123", role: "Admin" },
      { name: "Vita", password: "vita123", role: "Admin" },
    ];

    for (const admin of defaultAdmins) {
      const hash = btoa(admin.password);
      await client
        .unsafe(
          `INSERT INTO staff_members (name, role, password_hash) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET role = EXCLUDED.role`,
          [admin.name, admin.role, hash],
        )
        .catch(() => {});
    }

    await client
      .unsafe(
        `INSERT INTO store_config (id, store_name, address, ppn_rate, currency) VALUES (1, 'Sinar Bahagia Surabaya', 'Jl. Kramat Gantung No. 63', 11.00, 'IDR') ON CONFLICT (id) DO NOTHING`,
      )
      .catch(() => {});

    initialized = true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
};

// Auth handlers
export const loginHandler = async (name: string, password: string) => {
  await initializeDatabase();

  if (!name || !password) {
    throw new Error("Name and password required");
  }

  const passwordHash = btoa(password);

  // First check with the hash
  let result = await client.unsafe(
    "SELECT id, name, role, password_hash FROM staff_members WHERE name = $1",
    [name],
  );

  if (!result || result.length === 0) {
    throw new Error("Invalid credentials");
  }

  const user = result[0];

  // Check if password matches hash, or if it's a default admin account with no password set
  if (
    user.password_hash === passwordHash ||
    (user.password_hash === null && ["Nancy", "Mami", "Vita"].includes(name))
  ) {
    // For default accounts without password, set the password now
    if (user.password_hash === null && ["Nancy", "Mami", "Vita"].includes(name)) {
      await client.unsafe("UPDATE staff_members SET password_hash = $1 WHERE id = $2", [
        passwordHash,
        user.id,
      ]);
    }

    // Record login audit log
    try {
      await client.unsafe(
        `INSERT INTO audit_logs (id, staff_name, action, details) VALUES ($1, $2, $3, $4)`,
        [
          `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          user.name,
          "Login",
          `Staff ${user.name} logged in`,
        ],
      );
    } catch (e) {
      console.warn("Failed to record login audit log:", e);
    }

    return {
      id: user.id,
      name: user.name,
      role: user.role,
    };
  }

  throw new Error("Invalid credentials");
};

export const logoutHandler = async (name: string) => {
  if (!name) return;
  try {
    await client.unsafe(
      `INSERT INTO audit_logs (id, staff_name, action, details) VALUES ($1, $2, $3, $4)`,
      [
        `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name,
        "Logout",
        `Staff ${name} logged out`,
      ],
    );
  } catch (e) {
    console.warn("Failed to record logout audit log:", e);
  }
};

// Staff handlers
export const getStaffHandler = async () => {
  await initializeDatabase();
  const result = await client.unsafe(
    "SELECT id, name, role, created_at FROM staff_members ORDER BY name",
  );
  return result.map(parseDbStaffMember);
};

export const addStaffHandler = async (
  name: string,
  password: string,
  role: string = "Staff",
  staffName: string = "System",
) => {
  await initializeDatabase();

  if (!name || !password) {
    throw new Error("Name and password required");
  }

  const passwordHash = btoa(password);
  const result = await client.unsafe(
    "INSERT INTO staff_members (name, role, password_hash) VALUES ($1, $2, $3) RETURNING id, name, role, created_at",
    [name, role, passwordHash],
  );

  // Audit log for staff creation
  try {
    await client.unsafe(
      `INSERT INTO audit_logs (id, staff_name, action, details, timestamp) VALUES ($1, $2, $3, $4, NOW())`,
      [
        `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        staffName,
        "Staff Created",
        `Created staff member: ${name} (role: ${role})`,
      ],
    );
  } catch (e) {
    console.warn("Failed to record staff creation audit log:", e);
  }

  return parseDbStaffMember(result[0]);
};

export const deleteStaffHandler = async (id: string, staffName: string = "System") => {
  await initializeDatabase();

  // Get staff name for audit logging
  const [staff] = await client.unsafe("SELECT name FROM staff_members WHERE id = $1", [id]);

  await client.unsafe("DELETE FROM staff_members WHERE id = $1", [id]);

  // Audit log for staff deletion
  if (staff) {
    try {
      await client.unsafe(
        `INSERT INTO audit_logs (id, staff_name, action, details, timestamp) VALUES ($1, $2, $3, $4, NOW())`,
        [
          `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          staffName,
          "Staff Deleted",
          `Deleted staff member: ${staff.name}`,
        ],
      );
    } catch (e) {
      console.warn("Failed to record staff deletion audit log:", e);
    }
  }
};

export const updateStaffHandler = async (
  id: string,
  data: { name?: string; role?: "Admin" | "Staff"; password?: string; staffName?: string },
) => {
  await initializeDatabase();

  const [current] = await client.unsafe("SELECT * FROM staff_members WHERE id = $1", [id]);
  if (!current) {
    throw new Error("Staff not found");
  }

  const name = data.name ?? current.name;
  const role = data.role ?? current.role;
  const passwordHash = data.password ? btoa(data.password) : current.password_hash;

  const result = await client.unsafe(
    "UPDATE staff_members SET name = $1, role = $2, password_hash = $3 WHERE id = $4 RETURNING id, name, role, created_at",
    [name, role, passwordHash, id],
  );

  // Audit log for staff update
  const changes: string[] = [];
  if (data.name && data.name !== current.name)
    changes.push(`name: ${current.name} -> ${data.name}`);
  if (data.role && data.role !== current.role)
    changes.push(`role: ${current.role} -> ${data.role}`);
  if (data.password) changes.push("password updated");

  if (changes.length > 0) {
    const staffName = data.staffName || "System";
    try {
      await client.unsafe(
        `INSERT INTO audit_logs (id, staff_name, action, details, related_id, timestamp) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          staffName,
          "Staff Updated",
          `Updated staff ${current.name}: ${changes.join(", ")}`,
          id,
        ],
      );
    } catch (e) {
      console.warn("Failed to record staff update audit log:", e);
    }
  }

  return parseDbStaffMember(result[0]);
};

// Store config handlers
export const getStoreConfigHandler = async () => {
  await initializeDatabase();
  const result = await client.unsafe("SELECT * FROM store_config WHERE id = 1");
  if (!result || result.length === 0) {
    throw new Error("Store config not found");
  }
  return parseDbStoreConfig(result[0]);
};

export const updateStoreConfigHandler = async (config: {
  storeName?: string;
  address?: string;
  ppnRate?: number;
  currency?: string;
  monthlyTarget?: number;
  staffName?: string;
}) => {
  await initializeDatabase();

  const current = await client.unsafe("SELECT * FROM store_config WHERE id = 1");
  if (!current || current.length === 0) {
    throw new Error("Store config not found");
  }

  const storeName = config.storeName ?? current[0].store_name;
  const address = config.address ?? current[0].address;
  const ppnRate = config.ppnRate ?? current[0].ppn_rate;
  const currency = config.currency ?? current[0].currency;
  const monthlyTarget = config.monthlyTarget ?? current[0].monthly_target ?? 500000000;

  const result = await client.unsafe(
    "UPDATE store_config SET store_name = $1, address = $2, ppn_rate = $3, currency = $4, monthly_target = $5, updated_at = NOW() WHERE id = 1 RETURNING *",
    [storeName, address, ppnRate, currency, monthlyTarget],
  );

  // Audit log for store config update
  const changes: string[] = [];
  if (config.storeName && config.storeName !== current[0].store_name)
    changes.push(`storeName: ${current[0].store_name} -> ${config.storeName}`);
  if (config.address && config.address !== current[0].address)
    changes.push(`address: ${current[0].address} -> ${config.address}`);
  if (config.ppnRate !== undefined && String(config.ppnRate) !== String(current[0].ppn_rate))
    changes.push(`ppnRate: ${current[0].ppn_rate} -> ${config.ppnRate}`);
  if (config.currency && config.currency !== current[0].currency)
    changes.push(`currency: ${current[0].currency} -> ${config.currency}`);
  if (
    config.monthlyTarget !== undefined &&
    String(config.monthlyTarget) !== String(current[0].monthly_target)
  )
    changes.push(`monthlyTarget: ${current[0].monthly_target} -> ${config.monthlyTarget}`);

  if (changes.length > 0) {
    const staffName = config.staffName || "System";
    try {
      await client.unsafe(
        `INSERT INTO audit_logs (id, staff_name, action, details, timestamp) VALUES ($1, $2, $3, $4, NOW())`,
        [
          `LOG-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          staffName,
          "Settings Update",
          `Updated store config: ${changes.join(", ")}`,
        ],
      );
    } catch (e) {
      console.warn("Failed to record store config audit log:", e);
    }
  }

  return parseDbStoreConfig(result[0]);
};
