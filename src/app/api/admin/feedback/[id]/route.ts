export const runtime = "edge";
// src/app/api/admin/feedback/[id]/route.ts
// Purpose: Admin - update feedback (respond, change status).

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryDb, queryDbFirst, executeDb, nowISO, getDb } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { adminResponse?: string; status?: string };
    const { adminResponse, status } = body;

    const db = await getDb();
    const now = nowISO();

    const updates: string[] = [];
    const values: unknown[] = [];

    if (adminResponse) {
      updates.push("adminResponse = ?");
      values.push(adminResponse);
    }
    if (status) {
      updates.push("status = ?");
      values.push(status);
    }
    updates.push("reviewedAt = ?");
    values.push(now);
    updates.push("reviewedBy = ?");
    values.push(session.userId);
    updates.push("updatedAt = ?");
    values.push(now);
    values.push(id);

    await db.prepare(`UPDATE feedbacks SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run();

    const feedback = await db.prepare(`
      SELECT f.*, u.name AS user_name, u.email AS user_email
      FROM feedbacks f
      LEFT JOIN users u ON f.userId = u.id
      WHERE f.id = ?
    `).bind(id).first<Record<string, unknown>>();

    return NextResponse.json({
      success: true,
      message: "Feedback updated",
      feedback,
    });
  } catch (error) {
    console.error("Update feedback error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update feedback" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const db = await getDb();
    await db.prepare("DELETE FROM feedbacks WHERE id = ?").bind(id).run();

    return NextResponse.json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Delete feedback error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete feedback" },
      { status: 500 },
    );
  }
}
