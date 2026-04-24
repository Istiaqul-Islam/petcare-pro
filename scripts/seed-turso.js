// scripts/seed-turso.js
/**
 * Seed Turso database with initial data
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

const dbPath = process.env.LOCAL_DB_PATH || "./data/petcare.db";
const dbUrl = process.env.DATABASE_MODE === "cloud" ? process.env.TURSO_CONNECTION_URL : `file:${dbPath}`;

const dbConfig =
  process.env.DATABASE_MODE === "cloud"
    ? {
        url: dbUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : { url: dbUrl };

async function seedDatabase() {
  try {
    console.log(`🌱 Seeding Turso database...`);

    const db = createClient(dbConfig);

    // Read seed file
    const seedPath = path.resolve(__dirname, "../seed.sql");
    if (!fs.existsSync(seedPath)) {
      console.log("ℹ️  No seed.sql file found, skipping seed data");
      return;
    }

    const seedData = fs.readFileSync(seedPath, "utf-8");

    // Split into individual statements
    const statements = seedData
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Execute seed statements
    let successCount = 0;
    for (const statement of statements) {
      try {
        await db.execute(statement);
        successCount++;
      } catch (error) {
        // Ignore unique constraint violations (already seeded)
        if (!error.message.includes("UNIQUE") && !error.message.includes("unique")) {
          console.warn(`⚠️  Seed statement warning: ${error.message.substring(0, 80)}`);
        }
      }
    }

    console.log(`✅ Database seeded successfully (${successCount} statements executed)`);
  } catch (error) {
    console.error("❌ Failed to seed database:", error.message);
    process.exit(1);
  }
}

seedDatabase();
