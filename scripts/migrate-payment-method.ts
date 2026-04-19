import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

async function migrate() {
  console.log("Running migration: Adding Transfer and Utang to payment_method enum...");
  
  try {
    // Add Transfer to enum
    await sql`ALTER TYPE "public"."payment_method" ADD VALUE IF NOT EXISTS 'Transfer'`;
    console.log("✓ Added 'Transfer' to payment_method enum");
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log("✓ 'Transfer' already exists in payment_method enum");
    } else {
      console.error("Error adding 'Transfer':", e.message);
    }
  }
  
  try {
    // Add Utang to enum
    await sql`ALTER TYPE "public"."payment_method" ADD VALUE IF NOT EXISTS 'Utang'`;
    console.log("✓ Added 'Utang' to payment_method enum");
  } catch (e: any) {
    if (e.message?.includes('already exists')) {
      console.log("✓ 'Utang' already exists in payment_method enum");
    } else {
      console.error("Error adding 'Utang':", e.message);
    }
  }
  
  // Verify the enum values
  const result = await sql`SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_method') ORDER BY enumsortorder`;
  console.log("\nCurrent payment_method enum values:", result.map(r => r.enumlabel).join(", "));
  
  await sql.end();
  console.log("\nMigration complete!");
}

migrate().catch(console.error);