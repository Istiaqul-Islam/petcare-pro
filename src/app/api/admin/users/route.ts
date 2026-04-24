export const runtime = "edge";
// src/app/api/admin/users/route.ts
// Purpose: Admin - list all users with search and counts.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryDb, queryDbFirst, executeDb, getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search");

    const db = await getDb();

    let sql = `
      SELECT 
        u.id, u.name, u.email, u.avatar, u.phone, u.role, u.createdAt,
        (SELECT COUNT(*) FROM pets WHERE userId = u.id) AS petsCount,
        (SELECT COUNT(*) FROM appointments WHERE userId = u.id) AS appointmentsCount,
        (SELECT COUNT(*) FROM posts WHERE userId = u.id) AS postsCount
      FROM users u
    `;
    const params: unknown[] = [];

    if (search) {
      sql += ` WHERE (LOWER(u.name) LIKE '%' || LOWER(?) || '%' OR LOWER(u.email) LIKE '%' || LOWER(?) || '%')`;
      params.push(search, search);
    }

    sql += ` ORDER BY u.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await db
      .prepare(sql)
      .bind(...params)
      .all<Record<string, unknown>>();

    const users = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      phone: row.phone,
      role: row.role,
      createdAt: row.createdAt,
      _count: {
        pets: row.petsCount,
        appointments: row.appointmentsCount,
        posts: row.postsCount,
      },
    }));

    // Count
    let countSql = "SELECT COUNT(*) as count FROM users";
    const countParams: unknown[] = [];
    if (search) {
      countSql += ` WHERE (LOWER(name) LIKE '%' || LOWER(?) || '%' OR LOWER(email) LIKE '%' || LOWER(?) || '%')`;
      countParams.push(search, search);
    }
    const total = await db.prepare(countSql).bind(...countParams).first<{ count: number }>();

    return NextResponse.json({
      success: true,
      users,
      total: total?.count || 0,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
