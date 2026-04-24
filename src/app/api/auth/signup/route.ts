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
    const body = (await request.json()) as { name?: string; email?: string; password?: string; phone?: string; address?: string };
    const { name, email, password, phone, address } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
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
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    if (existingUser) {
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
      "INSERT INTO users (id, email, password, name, phone, address, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        email.toLowerCase(),
        hashedPassword,
        name,
        phone || null,
        address || null,
        "user",
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
