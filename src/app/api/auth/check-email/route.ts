export const runtime = "edge";
// src/app/api/auth/check-email/route.ts
// Purpose: Check if an email is available for registration.


import { NextRequest, NextResponse } from "next/server";
import { queryDb, queryDbFirst } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: true,
        available: false,
        message: "Invalid email format",
      });
    }

    // Check if email exists
    const existingUser = await queryDbFirst(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    return NextResponse.json({
      success: true,
      available: !existingUser,
      message: existingUser
        ? "Email is already registered"
        : "Email is available",
    });
  } catch (error) {
    console.error("Check email error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check email" },
      { status: 500 },
    );
  }
}
