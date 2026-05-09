// scripts/push-schema-turso.ts
/**
 * Push schema to Turso cloud database
 * Run this after creating a Turso database to initialize it
 */

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function pushSchemaToCloud() {
  const url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error(
      "❌ TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN environment variables are required"
    );
    process.exit(1);
  }

  try {
    console.log("📤 Pushing schema to Turso cloud database...");
    console.log(`🔗 Database: ${url}`);

    const db = createClient({
      url,
      authToken,
    });

    // Read schema
    const schemaPath = path.resolve(__dirname, "../schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    // Split schema into individual statements
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Execute schema statements
    let successCount = 0;
    for (const statement of statements) {
      try {
        await db.execute(statement);
        successCount++;
      } catch (error) {
        console.warn(`⚠️  Statement: ${String(error).substring(0, 100)}`);
      }
    }

    console.log(`✅ Schema pushed successfully (${successCount} statements executed)`);
  } catch (error) {
    console.error("❌ Failed to push schema:", error);
    process.exit(1);
  }
}

pushSchemaToCloud();
