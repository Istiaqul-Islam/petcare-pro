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

    // DIAGNOSTIC LOGGING
    console.log("📝 [LOGIN] Attempting login for:", email);
    const TURSO_URL = process.env.TURSO_CONNECTION_URL;
    const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
    console.log("📝 [LOGIN] Env check:", { 
      hasUrl: !!TURSO_URL, 
      hasToken: !!TURSO_TOKEN,
      urlPrefix: TURSO_URL?.substring(0, 10) 
    });

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
      console.error("Token verification failed:", error.message || error);
      return NextResponse.json(
        { success: false, error: `Authentication failed: ${error.message || "Invalid token"}` },
        { status: 401 },
      );
    }

    // 2. Find user in our Turso DB using the verified UID
    let user = await queryDbFirst(
      "SELECT * FROM users WHERE firebaseUid = ? OR email = ?",
      [decodedToken.uid, email.toLowerCase()]
    );

    // --- AUTO-PROVISIONING LOGIC ---
    // If user is verified by Firebase but not in our DB, create them on the fly
    if (!user) {
      console.log("🛠️ User verified in Firebase but not in Turso. Auto-creating profile for:", email);
      
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      const placeholderPassword = "firebase_managed";
      const name = (decodedToken as any).name || email.split("@")[0];

      try {
        await executeDb(
          "INSERT INTO users (id, email, password, name, role, firebaseUid, isVerified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            id,
            email.toLowerCase(),
            placeholderPassword,
            name,
            "user",
            decodedToken.uid,
            1, // Verified since we got a valid Firebase token
            now,
            now,
          ]
        );

        // Fetch the newly created user
        user = await queryDbFirst("SELECT * FROM users WHERE id = ?", [id]);
      } catch (createError: any) {
        console.error("❌ Failed to auto-create user in Turso:", createError.message);
        return NextResponse.json(
          { success: false, error: "Authentication success, but profile creation failed. Please try again." },
          { status: 500 },
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Account not found and auto-creation failed." },
        { status: 401 },
      );
    }

    // 3. Update verification status and metadata in DB
    try {
      await executeDb(
        "UPDATE users SET isVerified = 1, firebaseUid = ?, firebaseMetadata = ?, updatedAt = ? WHERE id = ?",
        [
          decodedToken.uid, 
          JSON.stringify(decodedToken), 
          new Date().toISOString(), 
          (user as any).id
        ]
      );
    } catch (dbError: any) {
      console.error("❌ Failed to update user status/metadata in DB:", dbError.message);
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
    console.error("❌ Login API critical error:", {
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { success: false, error: `Authentication success, but session creation failed: ${error.message}` },
      { status: 500 },
    );
  }
}