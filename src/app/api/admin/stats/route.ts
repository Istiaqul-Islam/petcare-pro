export const runtime = "edge";
// src/app/api/admin/stats/route.ts
// Purpose: Get admin dashboard statistics.

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryDb, queryDbFirst, getDb } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const db = await getDb();

    const totalUsers = await db
      .prepare("SELECT COUNT(*) as count FROM users")
      .first<{ count: number }>();
    const totalPets = await db
      .prepare("SELECT COUNT(*) as count FROM pets WHERE isActive = 1")
      .first<{ count: number }>();
    const totalAppointments = await db
      .prepare("SELECT COUNT(*) as count FROM appointments")
      .first<{ count: number }>();
    const totalFeedback = await db
      .prepare("SELECT COUNT(*) as count FROM feedbacks")
      .first<{ count: number }>();
    const totalVets = await db
      .prepare("SELECT COUNT(*) as count FROM veterinarians WHERE isActive = 1")
      .first<{ count: number }>();
    const pendingFeedback = await db
      .prepare(
        "SELECT COUNT(*) as count FROM feedbacks WHERE status = 'pending'",
      )
      .first<{ count: number }>();
    const activeAppointments = await db
      .prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'scheduled'")
      .first<{ count: number }>();

    return NextResponse.json({
      totalUsers: totalUsers?.count || 0,
      totalPets: totalPets?.count || 0,
      totalAppointments: totalAppointments?.count || 0,
      totalFeedback: totalFeedback?.count || 0,
      totalVets: totalVets?.count || 0,
      pendingFeedback: pendingFeedback?.count || 0,
      activeAppointments: activeAppointments?.count || 0,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
