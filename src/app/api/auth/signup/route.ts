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
      password?: string; 
      phone?: string; 
      address?: string;
      firebaseUid?: string;
    };
    const { name, email, password, phone, address, firebaseUid } = body;

    // Validate required fields
    if (!name || !email || !password || !firebaseUid) {
      return NextResponse.json(
        { success: false, error: "Name, email, password, and firebaseUid are required" },
        { status: 400 },
      );
    }

    // Validate email
    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.message },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingUser = await queryDbFirst(
      "SELECT * FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    if (existingUser) {
      // MIGRATION LOGIC: If user exists in DB but doesn't have a Firebase UID yet,
      // we update their record with the new UID.
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

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const id = generateId();
    const now = nowISO();
    
    await executeDb(
      "INSERT INTO users (id, email, password, name, phone, address, role, firebaseUid, isVerified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        email.toLowerCase(),
        hashedPassword,
        name,
        phone || null,
        address || null,
        "user",
        firebaseUid,
        0, // Not verified initially
        now,
        now,
      ]
    );

    const user = await queryDbFirst(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );

    if (!user) {
      throw new Error("Failed to create user");
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during registration" },
      { status: 500 },
    );
  }
}
