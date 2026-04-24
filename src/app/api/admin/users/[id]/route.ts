export const runtime = "edge";
// src/app/api/admin/users/[id]/route.ts
// Purpose: Permanently delete a user from the database (Admin only).

import { NextRequest, NextResponse } from "next/server";
import { executeDb, getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDb();

    // Delete the user (ON DELETE CASCADE will handle related data if configured, 
    // but in our schema we use cascading for pets, appointments, posts, etc.)
    await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();

    return NextResponse.json({
      success: true,
      message: "User and all related data deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
