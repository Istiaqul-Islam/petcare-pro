export const runtime = "edge";
// src/app/api/dashboard/stats/route.ts
// Purpose: Get dashboard statistics for the authenticated user.

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryDb, queryDbFirst, getDb } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const db = await getDb();

    const petsCount = await db
      .prepare(
        "SELECT COUNT(*) as count FROM pets WHERE userId = ? AND isActive = 1",
      )
      .bind(session.userId)
      .first<{ count: number }>();

    const appointmentsCount = await db
      .prepare("SELECT COUNT(*) as count FROM appointments WHERE userId = ?")
      .bind(session.userId)
      .first<{ count: number }>();

    const vaccinationsCount = await db
      .prepare(
        "SELECT COUNT(*) as count FROM vaccinations WHERE userId = ? AND nextDueDate >= datetime('now')",
      )
      .bind(session.userId)
      .first<{ count: number }>();

    const postsCount = await db
      .prepare("SELECT COUNT(*) as count FROM posts WHERE userId = ?")
      .bind(session.userId)
      .first<{ count: number }>();

    return NextResponse.json({
      totalPets: petsCount?.count || 0,
      totalAppointments: appointmentsCount?.count || 0,
      upcomingVaccinations: vaccinationsCount?.count || 0,
      totalPosts: postsCount?.count || 0,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
