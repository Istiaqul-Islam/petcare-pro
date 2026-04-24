export const runtime = "edge";
// src/app/api/pets/route.ts
// Purpose: List and create pets for the authenticated user.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryDb, queryDbFirst, executeDb, generateId, nowISO, getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const db = await getDb();
    const pets = await db
      .prepare(
        "SELECT * FROM pets WHERE userId = ? AND isActive = 1 ORDER BY createdAt DESC LIMIT ? OFFSET ?",
      )
      .bind(session.userId, limit, offset)
      .all();

    const countResult = await db
      .prepare(
        "SELECT COUNT(*) as count FROM pets WHERE userId = ? AND isActive = 1",
      )
      .bind(session.userId)
      .first<{ count: number }>();

    return NextResponse.json({
      success: true,
      pets,
      total: countResult?.count || 0,
    });
  } catch (error) {
    console.error("Get pets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pets" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { name?: string; species?: string; breed?: string; gender?: string; birthDate?: string; weight?: string; color?: string; photo?: string; notes?: string };
    const {
      name,
      species,
      breed,
      gender,
      birthDate,
      weight,
      color,
      photo,
      notes,
    } = body;

    if (!name || !species) {
      return NextResponse.json(
        { success: false, error: "Name and species are required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const id = generateId();
    const now = nowISO();

    await db.prepare(
      `INSERT INTO pets (id, userId, name, species, breed, gender, birthDate, weight, color, photo, notes, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    )
      .bind(
        id,
        session.userId,
        name,
        species,
        breed || null,
        gender || null,
        birthDate || null,
        weight ? parseFloat(weight) : null,
        color || null,
        photo || null,
        notes || null,
        now,
        now,
      )
      .run();

    const pet = await db.prepare("SELECT * FROM pets WHERE id = ?").bind(id).first();

    return NextResponse.json({
      success: true,
      message: "Pet added successfully",
      pet,
    });
  } catch (error) {
    console.error("Create pet error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create pet" },
      { status: 500 },
    );
  }
}
