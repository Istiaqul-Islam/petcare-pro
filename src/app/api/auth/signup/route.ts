export const runtime = "edge";
// src/app/api/auth/signup/route.ts
// Purpose: User registration — creates account and session.



import { NextRequest, NextResponse } from "next/server";
import { queryDbFirst, executeDb, generateId, nowISO } from "@/lib/db";
import {
  hashPassword,
  createSession,
  validateEmail,
  validatePassword,
} from "@/lib/auth";

function generateSessionToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { 
      name?: string; 
      email?: string; 
      phone?: string; 
      address?: string;
      firebaseUid?: string;
    };
    const { name, email, phone, address, firebaseUid } = body;

    // DIAGNOSTIC LOGGING
    console.log("📝 [SIGNUP] Attempting signup for:", email);

    // Validate required fields
    if (!name || !email || !firebaseUid) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (name, email, or firebaseUid)" },
        { status: 400 },
      );
    }

    // Check if email already exists
    let existingUser;
    try {
      existingUser = await queryDbFirst(
        "SELECT * FROM users WHERE email = ?",
        [email.toLowerCase()]
      );
    } catch (dbErr: any) {
      console.error("❌ [SIGNUP] Initial DB check failed:", dbErr.message);
      return NextResponse.json(
        { success: false, error: `Database connection error: ${dbErr.message}` },
        { status: 500 },
      );
    }

    if (existingUser) {
      if (!(existingUser as any).firebaseUid) {
        const now = nowISO();
        await executeDb(
          "UPDATE users SET firebaseUid = ?, isVerified = 0, updatedAt = ? WHERE id = ?",
          [firebaseUid, now, (existingUser as any).id]
        );

        return NextResponse.json({
          success: true,
          message: "Account migrated successfully. Please verify your email.",
          user: { email: (existingUser as any).email, name: (existingUser as any).name }
        });
      }

      return NextResponse.json(
        { success: false, error: "Email is already registered" },
        { status: 400 },
      );
    }

    const placeholderPassword = "firebase_managed";
    const id = generateId();
    const now = nowISO();
    
    try {
      console.log("📝 [SIGNUP] Inserting user into Turso...");
      await executeDb(
        "INSERT INTO users (id, email, password, name, phone, address, role, firebaseUid, firebaseMetadata, isVerified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          id,
          email.toLowerCase(),
          placeholderPassword,
          name,
          phone || null,
          address || null,
          "user",
          firebaseUid,
          null, // Metadata will be updated on first login
          0,
          now,
          now,
        ]
      );
    } catch (insertErr: any) {
      console.error("❌ [SIGNUP] Insert failed:", insertErr.message);
      return NextResponse.json(
        { success: false, error: `Failed to save user: ${insertErr.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      user: { id, email, name },
    });
  } catch (error: any) {
    console.error("❌ [SIGNUP] Critical error:", error.message);
    return NextResponse.json(
      { success: false, error: `An unexpected error occurred: ${error.message}` },
      { status: 500 },
    );
  }
}
