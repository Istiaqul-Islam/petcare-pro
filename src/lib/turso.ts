// src/lib/turso.ts
// Purpose: Initialize the Turso database client.
//   Uses @libsql/client/web which is compatible with BOTH:
//   - Cloudflare Edge runtime (fetch-based, no XMLHttpRequest needed)
//   - Local Node.js development (connects to Turso cloud over HTTPS)
//
// NOTE: Local file-based SQLite (file: URLs) is NOT supported by the web client.
//   For local dev, set DATABASE_MODE=cloud and use your Turso cloud credentials.

import { createClient, type Client } from "@libsql/client/web";
import { getEnv } from "./env";

let db: Client | null = null;

/**
 * Initialize Turso database client (web variant — works everywhere)
 */
export function initializeTurso(): Client {
  if (db) {
    return db;
  }

  // Directly access process.env for maximum compatibility with Cloudflare nodejs_compat
  let url = process.env.TURSO_CONNECTION_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    console.error("❌ Turso credentials missing from process.env");
    throw new Error("Database configuration missing");
  }

  // MANDATORY for Edge: convert libsql:// to https://
  if (url.startsWith("libsql://")) {
    url = url.replace("libsql://", "https://");
  }

  try {
    db = createClient({
      url,
      authToken,
    });
    console.log("🌐 [TURSO] Client initialized successfully");
  } catch (error: any) {
    console.error("🌐 [TURSO] Client creation failed:", error.message);
    throw error;
  }

  return db;
}

export function getTurso(): Client {
  if (!db) {
    initializeTurso();
  }
  return db!;
}

export default getTurso;
