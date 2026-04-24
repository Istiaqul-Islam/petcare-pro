// scripts/setup-turso-local.js
/**
 * Setup local Turso database
 * Initializes the SQLite database with schema
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@libsql/client");

const dbPath = process.env.LOCAL_DB_PATH || "./data/petcare.db";
const dbDir = path.dirname(dbPath);

async function setupLocalDatabase() {
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`📁 Created directory: ${dbDir}`);
    }

    // Initialize client
    const db = createClient({
      url: `file:${dbPath}`,
    });

    console.log(`🔧 Setting up Turso local database at ${dbPath}...`);

    // Read schema
    const schemaPath = path.resolve(__dirname, "../schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf-8");

    // Split schema into individual statements
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // Execute schema statements
    for (const statement of statements) {
      try {
        await db.execute(statement);
      } catch (error) {
        // Ignore table already exists errors
        if (!error.message.includes("already exists")) {
          console.warn(`⚠️  Statement: ${error.message.substring(0, 80)}`);
        }
      }
    }

    console.log("✅ Database schema created successfully");
    console.log(`📊 Database file: ${dbPath}`);
  } catch (error) {
    console.error("❌ Failed to setup database:", error.message);
    process.exit(1);
  }
}

setupLocalDatabase();
