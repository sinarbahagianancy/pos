import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./supabase/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // This allows Drizzle Kit to connect to the DB to figure out migrations
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",
  },
});
