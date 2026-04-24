// src/lib/cf-context.ts
// Purpose: Cloudflare context helper for Next.js API routes.
//   Uses dynamic require() to safely access @cloudflare/next-on-pages
//   without crashing webpack or local dev environments.

import type { D1Database } from "@cloudflare/workers-types";

export interface CloudflareEnv {
  DB: D1Database;
  AI?: any;
  [key: string]: any;
}

/**
 * Get Cloudflare environment from the request context
 */
export function getCloudflareContext(): { env: CloudflareEnv } | null {
  try {
    // On Cloudflare edge, try to get the request context
    if (
      typeof process !== "undefined" &&
      (process as any).env?.NEXT_RUNTIME === "edge"
    ) {
      // We try a more robust way to get context without crashing webpack
      // Many versions of next-on-pages use globalThis for context
      const g = globalThis as any;
      if (g.__NEXT_ON_PAGES__?.context) {
        return g.__NEXT_ON_PAGES__.context;
      }

      // The globalThis.__NEXT_ON_PAGES__.context should be available
      // on Cloudflare Pages with edge runtime. If not available,
      // we'll fall back to environment variables below.
    }
    
    // Fallback for local development or when context helper fails
    // Pass EVERYTHING from process.env to ensure new variables aren't missed
    const env = (typeof process !== "undefined" ? process.env : {}) as any;
    if (Object.keys(env).length > 0) {
      return { env };
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Get D1 database - throws if not available
 */
export function getD1Database(): D1Database {
  const ctx = getCloudflareContext();
  if (!ctx?.env?.DB) {
    throw new Error("D1 Database not available");
  }
  return ctx.env.DB;
}

/**
 * Get AI binding
 */
export function getAI(): any | null {
  const ctx = getCloudflareContext();
  return ctx?.env?.AI || null;
}