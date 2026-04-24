export const runtime = "edge";
// src/app/api/pets/[id]/route.ts
// Purpose: Get, update, and delete (soft) a specific pet.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryDb, queryDbFirst, executeDb, nowISO, getDb } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const db = await getDb();
    const pet = await db
      .prepare("SELECT * FROM pets WHERE id = ? AND userId = ? LIMIT 1")
      .bind(id, session.userId)
      .first();

    if (!pet) {
      return NextResponse.json(
        { success: false, error: "Pet not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, pet });
  } catch (error) {
    console.error("Get pet error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pet" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    const { id } = await params;

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

    const db = await getDb();

    // Verify ownership
    const existingPet = await db
      .prepare("SELECT * FROM pets WHERE id = ? AND userId = ? LIMIT 1")
      .bind(id, session.userId)
      .first<Record<string, unknown>>();

    if (!existingPet) {
      return NextResponse.json(
        { success: false, error: "Pet not found" },
        { status: 404 },
      );
    }

    const now = nowISO();
    await db.prepare(
      `UPDATE pets SET name = ?, species = ?, breed = ?, gender = ?, birthDate = ?, weight = ?, color = ?, photo = ?, notes = ?, updatedAt = ? WHERE id = ?`,
    )
      .bind(
        name || existingPet.name,
        species || existingPet.species,
        breed ?? null,
        gender ?? null,
        birthDate || null,
        weight ? parseFloat(weight) : null,
        color ?? null,
        photo ?? null,
        notes ?? null,
        now,
        id,
      )
      .run();

    const pet = await db.prepare("SELECT * FROM pets WHERE id = ?").bind(id).first();

    return NextResponse.json({
      success: true,
      message: "Pet updated successfully",
      pet,
    });
  } catch (error) {
    console.error("Update pet error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update pet" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    const { id } = await params;

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const db = await getDb();

    // Verify ownership
    const pet = await db
      .prepare("SELECT id FROM pets WHERE id = ? AND userId = ? LIMIT 1")
      .bind(id, session.userId)
      .first();

    if (!pet) {
      return NextResponse.json(
        { success: false, error: "Pet not found" },
        { status: 404 },
      );
    }

    // Soft delete
    const now = nowISO();
    await db.prepare("UPDATE pets SET isActive = 0, updatedAt = ? WHERE id = ?")
      .bind(now, id)
      .run();

    return NextResponse.json({
      success: true,
      message: "Pet removed successfully",
    });
  } catch (error) {
    console.error("Delete pet error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete pet" },
      { status: 500 },
    );
  }
}
