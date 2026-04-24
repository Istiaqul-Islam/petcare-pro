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

  const env = getEnv();

  let url = env.TURSO_CONNECTION_URL;
  const authToken = env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error(
      `Turso credentials missing. URL: ${!!url}, Token: ${!!authToken}. ` +
      `Set TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN in your .env.local`
    );
  }

  // MANDATORY for Edge: convert libsql:// to https://
  if (url.startsWith("libsql://")) {
    url = url.replace("libsql://", "https://");
  }

  try {
    db = createClient({
      url,
      authToken,
      fetch: fetch,
    });

    console.log(
      `🌐 [TURSO] Client initialized for: ${url
        .replace("https://", "")
        .split(".")[0]}`
    );
  } catch (error: any) {
    console.error("🌐 [TURSO] Client creation failed:", error);
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
