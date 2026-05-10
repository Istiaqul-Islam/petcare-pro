// scripts/reset-db-hard.ts
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

async function resetDb() {
  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("❌ Missing Turso credentials");
    process.exit(1);
  }

  const db = createClient({ url, authToken });

  try {
    console.log("🔓 Disabling foreign keys...");
    await db.execute("PRAGMA foreign_keys = OFF");

    console.log("💣 Dropping all tables...");
    
    // Get all tables
    const tablesResult = await db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const tables = tablesResult.rows.map(row => row.name as string);

    for (const table of tables) {
      console.log(`🗑️  Dropping ${table}...`);
      await db.execute(`DROP TABLE IF EXISTS "${table}"`);
    }

    console.log("✨ Re-applying schema...");
    const schema = fs.readFileSync(path.resolve(process.cwd(), "schema.sql"), "utf-8");
    
    // Better splitting that handles comments
    const statements = schema
      .replace(/--.*$/gm, "") // Remove comments
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await db.execute(statement);
    }

    console.log("🌱 Seeding database...");
    const seed = fs.readFileSync(path.resolve(process.cwd(), "seed.sql"), "utf-8");
    const seedStatements = seed.split(";").filter(s => s.trim().length > 0);

    for (const statement of seedStatements) {
      await db.execute(statement);
    }

    console.log("✅ Database reset and seeded successfully!");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
  }
}

resetDb();
