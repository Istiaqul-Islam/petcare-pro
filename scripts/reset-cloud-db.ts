// scripts/reset-cloud-db.ts
/**
 * DANGER: This script drops ALL tables in the Turso cloud database 
 * and re-initializes it from schema.sql and seed.sql.
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

// Load env vars from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

async function resetCloudDatabase() {
  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("❌ TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN are required");
    process.exit(1);
  }

  const db = createClient({ url, authToken });

  try {
    console.log("🧨 Resetting Turso cloud database...");

    // 1. Drop all tables in reverse dependency order
    const tablesToDrop = [
      'receptionist_doctors',
      'notifications',
      'feedbacks',
      'likes',
      'comments',
      'posts',
      'vaccinations',
      'appointments',
      'veterinarians',
      'pets',
      'users'
    ];

    console.log("🗑️  Dropping tables...");
    for (const table of tablesToDrop) {
      try {
        await db.execute(`DROP TABLE IF EXISTS ${table}`);
      } catch (e) {
        console.warn(`Could not drop table ${table}:`, e);
      }
    }

    // 2. Read and push schema
    console.log("📤 Pushing fresh schema...");
    const schemaPath = path.resolve(__dirname, "../schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8").replace(/--.*$/gm, ""); // Remove comments
    const schemaStatements = schema.split(";").map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of schemaStatements) {
      await db.execute(statement);
    }

    // 3. Read and push seed
    console.log("🌱 Seeding initial data...");
    const seedPath = path.resolve(__dirname, "../seed.sql");
    const seed = fs.readFileSync(seedPath, "utf-8").replace(/--.*$/gm, ""); // Remove comments
    const seedStatements = seed.split(";").map(s => s.trim()).filter(s => s.length > 0);
    
    for (const statement of seedStatements) {
      await db.execute(statement);
    }

    console.log("✅ Database reset and re-seeded successfully!");
  } catch (error) {
    console.error("❌ Failed to reset database:", error);
    process.exit(1);
  }
}

resetCloudDatabase();
