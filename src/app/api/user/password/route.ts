export const runtime = "edge";
// src/app/api/user/password/route.ts
// Purpose: Change user password with current password verification.



import { NextResponse } from "next/server";
import {
  getSession,
  verifyPassword,
  hashPassword,
  validatePassword,
} from "@/lib/auth";
import { queryDb, queryDbFirst, executeDb, nowISO, getDb } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { currentPassword?: string; newPassword?: string };
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Current password and new password are required",
        },
        { status: 400 },
      );
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.message },
        { status: 400 },
      );
    }

    // Get user with password
    const db = await getDb();
    const user = await db
      .prepare("SELECT id, password FROM users WHERE id = ?")
      .bind(session.userId)
      .first<{ id: string; password: string }>();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Verify current password
    const isValidPassword = await verifyPassword(
      currentPassword,
      user.password,
    );
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    // Hash and update new password
    const hashedPassword = await hashPassword(newPassword);
    const now = nowISO();
    await db.prepare("UPDATE users SET password = ?, updatedAt = ? WHERE id = ?")
      .bind(hashedPassword, now, session.userId)
      .run();

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to change password" },
      { status: 500 },
    );
  }
}
