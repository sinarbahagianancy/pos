import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import 'dotenv/config';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:***@localhost:5432/postgres';
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
