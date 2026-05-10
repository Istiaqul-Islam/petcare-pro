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
    const schemaRaw = fs.readFileSync(path.resolve(process.cwd(), "schema.sql"), "utf-8");
    
    // Remove all comments and empty lines
    const schemaClean = schemaRaw
      .split("\n")
      .filter(line => !line.trim().startsWith("--"))
      .join("\n");

    const schemaStatements = schemaClean
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${schemaStatements.length} schema statements.`);

    for (const statement of schemaStatements) {
      try {
        console.log(`Executing: ${statement.substring(0, 50).replace(/\n/g, " ")}...`);
        await db.execute(statement);
      } catch (e: any) {
        console.warn(`⚠️  Warning: ${e.message}`);
      }
    }

    console.log("🌱 Seeding database...");
    const seedRaw = fs.readFileSync(path.resolve(process.cwd(), "seed.sql"), "utf-8");
    
    const seedClean = seedRaw
      .split("\n")
      .filter(line => !line.trim().startsWith("--"))
      .join("\n");

    const seedStatements = seedClean
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${seedStatements.length} seed statements.`);

    for (const statement of seedStatements) {
      try {
        console.log(`Executing: ${statement.substring(0, 50).replace(/\n/g, " ")}...`);
        await db.execute(statement);
      } catch (e: any) {
        console.error(`❌ Error: ${e.message}`);
      }
    }

    console.log("✅ Database reset and seeded successfully!");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
  }
}

resetDb();
