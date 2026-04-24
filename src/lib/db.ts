// src/lib/db.ts
// Purpose: Database abstraction layer that wraps Turso client with
//   convenient query helpers (queryDb, queryDbFirst, executeDb).

import { getTurso } from "./turso";

/**
 * Get a compatible database client that supports .prepare() pattern
 */
export const getDb = async () => {
  const client = getTurso();
  return {
    prepare: (sql: string) => {
      let args: any[] = [];
      const stmt = {
        bind: (...newArgs: any[]) => {
          args = newArgs;
          return stmt;
        },
        all: async <T = any>() => {
          const res = await client.execute({ sql, args });
          return res.rows as unknown as T[];
        },
        first: async <T = any>() => {
          const res = await client.execute({ sql, args });
          return (res.rows[0] as unknown as T) || null;
        },
        run: async () => {
          return await client.execute({ sql, args });
        },
      };
      return stmt;
    },
    execute: (sql: string, args: any[] = []) => client.execute({ sql, args }),
    batch: (stmts: any[], mode?: any) => client.batch(stmts, mode),
  };
};

/**
 * Query database - returns array of rows
 */
export async function queryDb<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const db = getTurso();
    const result = await db.execute({
      sql,
      args: params,
    });

    return (result.rows as T[]) || [];
  } catch (error: any) {
    console.error("❌ Database query error:", {
      sql,
      params,
      error: error?.message || String(error),
      stack: error?.stack,
    });
    throw new Error(`Database query failed: ${error?.message || String(error)}`);
  }
}

/**
 * Query database - returns single row or null
 */
export async function queryDbFirst<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  try {
    const db = getTurso();
    const result = await db.execute({
      sql,
      args: params,
    });

    const rows = result.rows as T[];
    return rows.length > 0 ? rows[0] : null;
  } catch (error: any) {
    console.error("❌ Database first error:", {
      sql,
      params,
      error: error?.message || String(error),
      stack: error?.stack,
    });
    throw new Error(`Database query failed: ${error?.message || String(error)}`);
  }
}

/**
 * Execute update/insert/delete - returns success info
 */
export async function executeDb(
  sql: string,
  params: any[] = []
): Promise<any> {
  try {
    const db = getTurso();
    const result = await db.execute({
      sql,
      args: params,
    });

    return {
      success: true,
      changes: result.rows?.length || 0,
      lastInsertRowid:
        (result as any).meta?.last_row_id ||
        (result.rows as any)?.[0]?.id,
    };
  } catch (error: any) {
    console.error("❌ Database execute error:", {
      sql,
      params,
      error: error?.message || String(error),
      stack: error?.stack,
    });
    throw new Error(`Database execute failed: ${error?.message || String(error)}`);
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current ISO timestamp
 */
export function nowISO(): string {
  return new Date().toISOString();
}