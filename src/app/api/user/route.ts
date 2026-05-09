export const runtime = "edge";
// src/app/api/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { queryDbFirst, executeDb, nowISO } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSession();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let user: any = null;
    try {
      user = await queryDbFirst(
        "SELECT id, email, name, avatar, phone, address, role, isVerified, showPets, showEmail, createdAt, updatedAt FROM users WHERE id = ?",
        [sessionUser.userId]
      );
    } catch (e) {
      console.warn("showEmail column missing in GET user, falling back...");
      user = await queryDbFirst(
        "SELECT id, email, name, avatar, phone, address, role, isVerified, showPets, 0 as showEmail, createdAt, updatedAt FROM users WHERE id = ?",
        [sessionUser.userId]
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get user" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getSession();

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json() as { 
      name?: string; 
      phone?: string; 
      address?: string; 
      avatar?: string;
      showPets?: number;
      showEmail?: number;
    };
    const { name, phone, address, avatar, showPets, showEmail } = body;

    const currentUser = await queryDbFirst("SELECT * FROM users WHERE id = ?", [sessionUser.userId]);

    // Handle missing column in UPDATE
    try {
      await executeDb(
        "UPDATE users SET name = ?, phone = ?, address = ?, avatar = ?, showPets = ?, showEmail = ?, updatedAt = ? WHERE id = ?",
        [
          name ?? currentUser.name, 
          phone ?? currentUser.phone, 
          address ?? currentUser.address, 
          avatar ?? currentUser.avatar,
          showPets ?? currentUser.showPets ?? 1,
          showEmail ?? currentUser.showEmail ?? 0,
          nowISO(), 
          sessionUser.userId
        ]
      );
    } catch (e) {
      console.warn("Privacy columns missing in PUT user, ignoring...");
      await executeDb(
        "UPDATE users SET name = ?, phone = ?, address = ?, avatar = ?, updatedAt = ? WHERE id = ?",
        [
          name ?? currentUser.name, 
          phone ?? currentUser.phone, 
          address ?? currentUser.address, 
          avatar ?? currentUser.avatar,
          nowISO(), 
          sessionUser.userId
        ]
      );
    }

    const updatedUser = await queryDbFirst("SELECT id, email, name, avatar, phone, address, role, showPets, showEmail, createdAt, updatedAt FROM users WHERE id = ?", [sessionUser.userId]);

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}