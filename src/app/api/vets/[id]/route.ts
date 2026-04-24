export const runtime = "edge";
// src/app/api/vets/[id]/route.ts
// Purpose: Get, update, and delete (soft) a specific veterinarian.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryDb, queryDbFirst, executeDb, nowISO, getDb } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();

    const vet = await db
      .prepare("SELECT * FROM veterinarians WHERE id = ?")
      .bind(id)
      .first();

    if (!vet) {
      return NextResponse.json(
        { success: false, error: "Veterinarian not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, vet });
  } catch (error) {
    console.error("Get vet error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch veterinarian" },
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

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { name?: string; specialization?: string; clinic?: string; address?: string; phone?: string; email?: string; photo?: string; qualification?: string; experience?: string; consultationFee?: string; availability?: string; bio?: string; latitude?: string; longitude?: string; isActive?: boolean };
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
      isActive,
    } = body;

    const db = await getDb();
    const now = nowISO();

    // Build dynamic update
    const updates: string[] = [];
    const values: unknown[] = [];

    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (specialization) {
      updates.push("specialization = ?");
      values.push(specialization);
    }
    if (clinic) {
      updates.push("clinic = ?");
      values.push(clinic);
    }
    if (address !== undefined) {
      updates.push("address = ?");
      values.push(address ?? null);
    }
    if (phone !== undefined) {
      updates.push("phone = ?");
      values.push(phone ?? null);
    }
    if (email !== undefined) {
      updates.push("email = ?");
      values.push(email ?? null);
    }
    if (photo !== undefined) {
      updates.push("photo = ?");
      values.push(photo ?? null);
    }
    if (qualification !== undefined) {
      updates.push("qualification = ?");
      values.push(qualification ?? null);
    }
    if (experience !== undefined) {
      updates.push("experience = ?");
      values.push(experience ? parseInt(experience) : null);
    }
    if (consultationFee !== undefined) {
      updates.push("consultationFee = ?");
      values.push(consultationFee ? parseFloat(consultationFee) : null);
    }
    if (availability !== undefined) {
      updates.push("availability = ?");
      values.push(availability ?? null);
    }
    if (bio !== undefined) {
      updates.push("bio = ?");
      values.push(bio ?? null);
    }
    if (latitude !== undefined) {
      updates.push("latitude = ?");
      values.push(latitude ? parseFloat(latitude) : null);
    }
    if (longitude !== undefined) {
      updates.push("longitude = ?");
      values.push(longitude ? parseFloat(longitude) : null);
    }
    if (isActive !== undefined) {
      updates.push("isActive = ?");
      values.push(isActive ? 1 : 0);
    }
    updates.push("updatedAt = ?");
    values.push(now);
    values.push(id);

    if (updates.length > 1) {
      await db.prepare(`UPDATE veterinarians SET ${updates.join(", ")} WHERE id = ?`)
        .bind(...values)
        .run();
    }

    const vet = await db
      .prepare("SELECT * FROM veterinarians WHERE id = ?")
      .bind(id)
      .first();

    return NextResponse.json({
      success: true,
      message: "Veterinarian updated successfully",
      vet,
    });
  } catch (error) {
    console.error("Update vet error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update veterinarian" },
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

    if (!session || session.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 },
      );
    }

    const db = await getDb();

    // Soft delete by setting isActive to false
    const now = nowISO();
    await db.prepare("UPDATE veterinarians SET isActive = 0, updatedAt = ? WHERE id = ?")
      .bind(now, id)
      .run();

    return NextResponse.json({
      success: true,
      message: "Veterinarian deleted successfully",
    });
  } catch (error) {
    console.error("Delete vet error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete veterinarian" },
      { status: 500 },
    );
  }
}
