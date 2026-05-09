export const runtime = "edge";
// src/app/api/auth/login/route.ts
// Purpose: User login — validates Firebase identity on the Edge and creates session.
// Special Case: Admin bypass for local admin account.

import { NextRequest, NextResponse } from "next/server";
import { queryDbFirst, executeDb } from "@/lib/db";
import { createSession, verifyPassword } from "@/lib/auth";
import { verifyFirebaseIdToken } from "@/lib/auth-edge";

const ADMIN_EMAIL = "admin@petcare.com";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string; idToken?: string };
    const { email, password, idToken } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    // --- ADMIN BYPASS LOGIC ---
    if (email.toLowerCase() === ADMIN_EMAIL) {
      if (!password) {
        return NextResponse.json({ success: false, error: "Password required for admin" }, { status: 400 });
      }

      const user = await queryDbFirst("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
      if (!user) {
        return NextResponse.json({ success: false, error: "Admin account not found" }, { status: 401 });
      }

      const isValid = await verifyPassword(password, (user as any).password);
      if (!isValid) {
        return NextResponse.json({ success: false, error: "Invalid admin credentials" }, { status: 401 });
      }

      // Admin logged in successfully
      await createSession(user as any);
      const { password: _, ...userWithoutPassword } = user as any;
      return NextResponse.json({ success: true, message: "Admin Login successful", user: userWithoutPassword });
    }

    // --- STANDARD USER (FIREBASE) LOGIC ---
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "Authentication token required" },
        { status: 401 },
      );
    }

    // 1. Verify Firebase ID Token on the Edge
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseIdToken(idToken);
      
      if (decodedToken.email.toLowerCase() !== email.toLowerCase()) {
        throw new Error("Token email mismatch");
      }
    } catch (error: any) {
      console.error("Token verification failed:", error.message);
      return NextResponse.json(
        { success: false, error: "Invalid authentication token" },
        { status: 401 },
      );
    }

    // 2. Find user in our Turso DB using the verified UID
    const user = await queryDbFirst(
      "SELECT * FROM users WHERE firebaseUid = ?",
      [decodedToken.uid]
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Account not found. Please sign up first." },
        { status: 401 },
      );
    }

    // 3. Update verification status in DB if it was 0
    if ((user as any).isVerified === 0) {
      await executeDb(
        "UPDATE users SET isVerified = 1 WHERE id = ?",
        [(user as any).id]
      );
    }

    // 4. Create PetCare session
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
      { success: false, error: "An error occurred during login" },
      { status: 500 },
    );
  }
}