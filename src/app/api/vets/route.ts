export const runtime = "edge";
// src/app/api/vets/route.ts
// Purpose: Create a new veterinarian (admin only) and list vets.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryDb, executeDb, generateId, nowISO, getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const vets = await queryDb(
      "SELECT * FROM veterinarians WHERE isActive = 1 ORDER BY rating DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const countResult = await queryDb<{ count: number }>(
      "SELECT COUNT(*) as count FROM veterinarians WHERE isActive = 1",
      []
    );
    const total = countResult?.[0]?.count || 0;

    return NextResponse.json({
      success: true,
      vets,
      total,
    });
  } catch (error) {
    console.error("Get vets error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch veterinarians" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { name?: string; specialization?: string; clinic?: string; address?: string; phone?: string; email?: string; photo?: string; qualification?: string; experience?: string; consultationFee?: string; availability?: string; bio?: string; latitude?: string; longitude?: string };
    const {
      name,
      specialization,
      clinic,
      address,
      phone,
      email,
      photo,
      qualification,
      experience,
      consultationFee,
      availability,
      bio,
      latitude,
      longitude,
    } = body;

    if (!name || !specialization || !clinic) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, specialization, and clinic are required",
        },
        { status: 400 },
      );
    }

    const db = await getDb();
    const id = generateId();
    const now = nowISO();

    await db.prepare(
      `INSERT INTO veterinarians (id, name, specialization, clinic, address, phone, email, photo, qualification, experience, consultationFee, availability, bio, latitude, longitude, rating, reviewCount, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?)`,
    )
      .bind(
        id,
        name,
        specialization,
        clinic,
        address || null,
        phone || null,
        email || null,
        photo || null,
        qualification || null,
        experience ? parseInt(experience) : null,
        consultationFee ? parseFloat(consultationFee) : null,
        availability || null,
        bio || null,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null,
        now,
        now,
      )
      .run();

    const vet = await db
      .prepare("SELECT * FROM veterinarians WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({
      success: true,
      message: "Veterinarian added successfully",
      vet,
    });
  } catch (error) {
    console.error("Create vet error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create veterinarian" },
      { status: 500 },
    );
  }
}
