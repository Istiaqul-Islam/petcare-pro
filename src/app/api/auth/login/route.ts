export const runtime = "edge";
// src/app/api/auth/login/route.ts
// Purpose: User login — validates credentials and creates session.

import { NextRequest, NextResponse } from "next/server";
import { queryDbFirst } from "@/lib/db";
import { verifyPassword, createSession, validateEmail } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Find user by email
    const user = await queryDbFirst(
      "SELECT * FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(
      password,
      (user as any).password as string,
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Create session
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await createSession(user as any);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user as any;

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during login: " + (error?.message || String(error)) },
      { status: 500 },
    );
  }
}