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
    
    // Fetch pet details
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

    // Fetch vaccination history
    const vaccinations = await db
      .prepare("SELECT * FROM vaccinations WHERE petId = ? ORDER BY dateAdministered DESC")
      .bind(id)
      .all();

    // Fetch appointment history
    const appointments = await db
      .prepare("SELECT * FROM appointments WHERE petId = ? ORDER BY date DESC, time DESC")
      .bind(id)
      .all();

    return NextResponse.json({ 
      success: true, 
      pet, 
      vaccinations, 
      appointments 
    });
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

    const body = (await request.json()) as { 
      name?: string; 
      species?: string; 
      breed?: string; 
      gender?: string; 
      age?: string;
      weight?: string; 
      color?: string; 
      photo?: string; 
      medicalNotes?: string;
      bloodGroup?: string;
      isNeutered?: number;
      lastCheckup?: string;
    };
    
    const db = await getDb();

    // Verify ownership
    const existingPet = await db
      .prepare("SELECT * FROM pets WHERE id = ? AND userId = ? LIMIT 1")
      .bind(id, session.userId)
      .first<Record<string, any>>();

    if (!existingPet) {
      return NextResponse.json(
        { success: false, error: "Pet not found" },
        { status: 404 },
      );
    }

    const now = nowISO();
    await db.prepare(
      `UPDATE pets SET 
        name = ?, 
        species = ?, 
        breed = ?, 
        gender = ?, 
        age = ?,
        weight = ?, 
        color = ?, 
        photo = ?, 
        medicalNotes = ?, 
        bloodGroup = ?,
        isNeutered = ?,
        lastCheckup = ?,
        updatedAt = ? 
      WHERE id = ?`,
    )
      .bind(
        body.name || existingPet.name,
        body.species || existingPet.species,
        body.breed ?? existingPet.breed,
        body.gender ?? existingPet.gender,
        body.age ?? existingPet.age,
        body.weight ?? existingPet.weight,
        body.color ?? existingPet.color,
        body.photo ?? existingPet.photo,
        body.medicalNotes ?? existingPet.medicalNotes,
        body.bloodGroup ?? existingPet.bloodGroup,
        body.isNeutered ?? existingPet.isNeutered,
        body.lastCheckup ?? existingPet.lastCheckup,
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
