export const runtime = "edge";
// src/app/api/admin/appointments/route.ts
// Purpose: Admin - list all appointments with user, pet, and vet info.

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
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    const db = await getDb();

    let sql = `
      SELECT 
        a.*,
        p.name AS pet_name, p.species AS pet_species,
        v.name AS vet_name, v.specialization AS vet_specialization, v.clinic AS vet_clinic,
        u.name AS user_name, u.email AS user_email
      FROM appointments a
      LEFT JOIN pets p ON a.petId = p.id
      LEFT JOIN veterinarians v ON a.vetId = v.id
      LEFT JOIN users u ON a.userId = u.id
    `;
    const params: unknown[] = [];

    if (status) {
      sql += ` WHERE a.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY a.date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await db
      .prepare(sql)
      .bind(...params)
      .all<Record<string, unknown>>();

    const appointments = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      petId: row.petId,
      vetId: row.vetId,
      date: row.date,
      time: row.time,
      duration: row.duration,
      reason: row.reason,
      type: row.type,
      status: row.status,
      notes: row.notes,
      fee: row.fee,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      pet: { name: row.pet_name, species: row.pet_species },
      vet: {
        name: row.vet_name,
        specialization: row.vet_specialization,
        clinic: row.vet_clinic,
      },
      user: { name: row.user_name, email: row.user_email },
    }));

    // Count
    let countSql = "SELECT COUNT(*) as count FROM appointments";
    const countParams: unknown[] = [];
    if (status) {
      countSql += ` WHERE status = ?`;
      countParams.push(status);
    }
    const total = await db
      .prepare(countSql)
      .bind(...countParams)
      .first<{ count: number }>();

    return NextResponse.json({
      success: true,
      appointments,
      total: total?.count || 0,
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
      { status: 500 },
    );
  }
}
