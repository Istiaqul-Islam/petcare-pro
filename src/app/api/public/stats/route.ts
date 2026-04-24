export const runtime = "edge";
// src/app/api/public/stats/route.ts
// Purpose: Get public statistics for the landing page.

import { NextResponse } from "next/server";
import { queryDbFirst } from "@/lib/db";

export async function GET() {
  try {
    const totalUsers = await queryDbFirst<{ count: number }>(
      "SELECT COUNT(*) as count FROM users"
    );

    const totalPets = await queryDbFirst<{ count: number }>(
      "SELECT COUNT(*) as count FROM pets WHERE isActive = 1"
    );

    const totalVets = await queryDbFirst<{ count: number }>(
      "SELECT COUNT(*) as count FROM veterinarians WHERE isActive = 1"
    );

    const avgFeedback = await queryDbFirst<{ avgRating: number | null }>(
      "SELECT AVG(rating) as avgRating FROM feedbacks WHERE status IS NOT NULL"
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsers?.count || 0,
        totalPets: totalPets?.count || 0,
        totalVets: totalVets?.count || 0,
        avgRating: avgFeedback?.avgRating || 0,
      },
    });
  } catch (error: any) {
    console.error("Public stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats: " + (error?.message || String(error)) },
      { status: 500 },
    );
  }
}