export const runtime = "edge";
// src/app/api/admin/receptionists/route.ts
// Purpose: Manage Receptionist roles and assign dynamic sets of doctors to them.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import getTurso from "@/lib/turso";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const db = getTurso();

    // Fetch all users who are receptionists
    const result = await db.execute(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.avatar,
        GROUP_CONCAT(rd.vetId) as assignedVetIds
      FROM users u
      LEFT JOIN receptionist_doctors rd ON u.id = rd.receptionistId
      WHERE u.role = 'receptionist' OR u.role = 'admin'
      GROUP BY u.id
    `);

    // Format the response
    const receptionists = result.rows.map(row => ({
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      avatar: row.avatar as string | null,
      assignedVetIds: row.assignedVetIds ? (row.assignedVetIds as string).split(',') : []
    }));

    return NextResponse.json({ receptionists });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error fetching receptionists:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const { userId, vetIds } = (await request.json()) as { userId: string; vetIds: string[] };

    if (!userId || !Array.isArray(vetIds)) {
      return NextResponse.json({ error: "Missing required fields or invalid vetIds." }, { status: 400 });
    }

    // Ensure unique vetIds to avoid primary key violations
    const uniqueVetIds = [...new Set(vetIds)];

    const db = getTurso();

    // Verify user exists
    const userResult = await db.execute({
      sql: 'SELECT id, role FROM users WHERE id = ?',
      args: [userId]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify all veterinarians exist
    const placeholders = uniqueVetIds.map(() => '?').join(',');
    const vetResult = await db.execute({
      sql: `SELECT id FROM veterinarians WHERE id IN (${placeholders})`,
      args: uniqueVetIds
    });

    if (vetResult.rows.length !== uniqueVetIds.length) {
      return NextResponse.json({ error: "One or more selected veterinarians no longer exist." }, { status: 400 });
    }

    const currentRole = userResult.rows[0].role as string;
    const newRole = currentRole === 'admin' ? 'admin' : 'receptionist';

    // Wrap in transaction-like pattern
    const statements = [
      // 1. Update user role (only if not already admin)
      {
        sql: "UPDATE users SET role = ?, updatedAt = datetime('now') WHERE id = ?",
        args: [newRole, userId]
      },
      // 2. Clear existing assigned doctors
      {
        sql: 'DELETE FROM receptionist_doctors WHERE receptionistId = ?',
        args: [userId]
      }
    ];

    // 3. Insert new assigned doctors
    uniqueVetIds.forEach((vetId: string) => {
      statements.push({
        sql: "INSERT INTO receptionist_doctors (receptionistId, vetId, assignedAt) VALUES (?, ?, datetime('now'))",
        args: [userId, vetId]
      });
    });

    await db.batch(statements, "write");

    return NextResponse.json({ success: true, message: "Receptionist successfully configured." });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error assigning receptionist:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const db = getTurso();
    
    // Validate user is a receptionist
    const userResult = await db.execute({
      sql: 'SELECT id, role FROM users WHERE id = ? AND role = "receptionist"',
      args: [userId]
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User is not a receptionist or not found." }, { status: 404 });
    }

    const currentRole = userResult.rows[0].role as string;
    const newRole = currentRole === 'admin' ? 'admin' : 'user';

    const statements = [
      {
        sql: "UPDATE users SET role = ?, updatedAt = datetime('now') WHERE id = ?",
        args: [newRole, userId]
      },
      {
        sql: 'DELETE FROM receptionist_doctors WHERE receptionistId = ?',
        args: [userId]
      }
    ];

    await db.batch(statements, "write");

    return NextResponse.json({ success: true, message: "Receptionist role removed." });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Admin access required") {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error removing receptionist:", error);
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 });
  }
}
