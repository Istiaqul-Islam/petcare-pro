export const runtime = "edge";


import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST() {
  try {
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

