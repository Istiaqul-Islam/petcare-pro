export const runtime = "edge";


import { NextResponse } from "next/server";
import { deleteSession, getSession } from "@/lib/auth";
import { executeDb } from "@/lib/db";

export async function POST() {
  try {
    const session = await getSession();
    if (session?.userId && session.role !== "admin") {
      // Reset isVerified to 0 on logout to force re-verification on next login
      await executeDb(
        "UPDATE users SET isVerified = 0 WHERE id = ?",
        [session.userId]
      );
      console.log(`🔄 [LOGOUT] Reset isVerified for user: ${session.userId}`);
    }

    await deleteSession();

    // Create response and explicitly set the cookie to expire in the past
    // This is a "double-kill" strategy to ensure Edge runtimes and browsers
    // definitely drop the session.
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.set("petcare_session", "", {
      path: "/",
      expires: new Date(0),
      httpOnly: true,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during logout" },
      { status: 500 }
    );
  }
}

