// src/lib/auth.ts
// Purpose: Authentication utilities — password hashing, session management, user retrieval.
// Uses raw SQL via D1-compatible database wrapper.

// Polyfill for Cloudflare Edge runtime removed, no longer needed
// since we use synchronous bcrypt methods.

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { User } from "@/types";
import { isProduction as checkIsProduction } from "./env";

const SESSION_COOKIE_NAME = "petcare_session";
const SESSION_EXPIRY_DAYS = 7;

export interface SessionData {
  userId: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  expiresAt: Date;
}

export async function hashPassword(password: string): Promise<string> {
  // Use hashSync because the async hash method uses setImmediate,
  // which is not supported in Cloudflare Edge environments.
  return bcrypt.hashSync(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  // Use compareSync because the async compare method uses setImmediate,
  // which is not supported in Cloudflare Edge environments.
  return bcrypt.compareSync(password, hashedPassword);
}

export async function createSession(user: User): Promise<string> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  const sessionData = {
    userId: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    expiresAt: expiresAt.toISOString(),
  };

  // Store session in a cookie
  try {
    const cookieStore = await cookies();

    // For Cloudflare Pages edge runtime compatibility
    const isProd = checkIsProduction();

    cookieStore.set(
      SESSION_COOKIE_NAME,
      JSON.stringify(sessionData),
      {
        httpOnly: true,
        // Don't use secure on local, use secure on production (Cloudflare Pages is HTTPS)
        secure: isProd,
        // Use 'lax' for Cloudflare Pages compatibility
        sameSite: "lax" as const,
        expires: expiresAt,
        path: "/",
      },
    );

    console.log("✅ Session created successfully", { userId: user.id, expiresAt: expiresAt.toISOString() });
  } catch (error: any) {
    console.error("❌ Failed to create session:", error?.message || error);
    throw new Error(`Failed to create session: ${error?.message || String(error)}`);
  }

  return sessionToken;
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const sessionData = JSON.parse(sessionCookie.value) as SessionData;

    // Check if session is expired
    if (new Date(sessionData.expiresAt) < new Date()) {
      await deleteSession();
      return null;
    }

    return sessionData;
  } catch (error: any) {
    console.error("❌ Error reading session:", error?.message || error);
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Get current user from session - only returns session data, doesn't need database
export async function getCurrentUserData(): Promise<SessionData | null> {
  return await getSession();
}

// Get full user data from database (requires DB parameter)
export async function getCurrentUser(db?: any): Promise<User | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // If no database provided, return basic user info from session
  if (!db) {
    return {
      id: session.userId,
      email: session.email,
      name: session.name,
      avatar: session.avatar,
      role: session.role,
    } as User;
  }

  // If database provided, fetch fresh user data
  try {
    const user = await (db.prepare("SELECT * FROM users WHERE id = ?")
      .bind(session.userId)
      .first() as Promise<User | null>);

    return user || null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function requireAdmin(): Promise<SessionData> {
  const session = await requireAuth();

  // For Admin operations, we always verify against the DB to ensure latest role
  try {
    const getTurso = (await import("./turso")).default;
    const db = getTurso();
    const userResult = await db.execute({
      sql: "SELECT role FROM users WHERE id = ?",
      args: [session.userId]
    });
    
    const role = userResult.rows[0]?.role as string;
    if (role !== "admin") {
      throw new Error("Admin access required");
    }
    
    return { ...session, role };
  } catch (error: any) {
    if (error.message === "Admin access required") throw error;
    
    // Fallback to session role if DB check fails for some reason (to avoid locking out admins)
    if (session.role !== "admin") {
      throw new Error("Admin access required");
    }
    return session;
  }
}

function generateSessionToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }
  return { valid: true };
}
