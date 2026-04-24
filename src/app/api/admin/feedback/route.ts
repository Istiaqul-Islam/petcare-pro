export const runtime = "edge";
// src/app/api/admin/feedback/route.ts
// Purpose: Admin - list all feedback with user info.

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
    const status = searchParams.get("status");

    const db = await getDb();

    let sql = `
      SELECT 
        f.*,
        u.name AS user_name, u.email AS user_email
      FROM feedbacks f
      LEFT JOIN users u ON f.userId = u.id
    `;
    const params: unknown[] = [];

    if (status) {
      sql += ` WHERE f.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY f.createdAt DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await db
      .prepare(sql)
      .bind(...params)
      .all<Record<string, unknown>>();

    const feedbacks = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      rating: row.rating,
      category: row.category,
      subject: row.subject,
      message: row.message,
      status: row.status,
      adminResponse: row.adminResponse,
      reviewedAt: row.reviewedAt,
      reviewedBy: row.reviewedBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: {
        name: row.user_name,
        email: row.user_email,
      },
    }));

    // Count
    let countSql = "SELECT COUNT(*) as count FROM feedbacks";
    const countParams: unknown[] = [];
    if (status) {
      countSql += ` WHERE status = ?`;
      countParams.push(status);
    }
    const total = await db.prepare(countSql).bind(...countParams).first<{ count: number }>();

    return NextResponse.json({
      success: true,
      feedbacks,
      total: total?.count || 0,
    });
  } catch (error) {
    console.error("Get feedback error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch feedback" },
      { status: 500 },
    );
  }
}
