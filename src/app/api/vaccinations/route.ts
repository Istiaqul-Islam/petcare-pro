export const runtime = "edge";
// src/app/api/vaccinations/route.ts
// Purpose: List and create vaccination records for the authenticated user.

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
    const status = searchParams.get("status");
    const petId = searchParams.get("petId");

    const db = await getDb();

    let sql = `
      SELECT 
        vc.*,
        p.id AS pet_id, p.name AS pet_name, p.species AS pet_species, p.breed AS pet_breed, p.photo AS pet_photo, p.gender AS pet_gender, p.birthDate AS pet_birthDate, p.weight AS pet_weight, p.color AS pet_color, p.notes AS pet_notes, p.isActive AS pet_isActive, p.userId AS pet_userId, p.createdAt AS pet_createdAt, p.updatedAt AS pet_updatedAt
      FROM vaccinations vc
      LEFT JOIN pets p ON vc.petId = p.id
      WHERE vc.userId = ?
    `;
    const params: unknown[] = [session.userId];

    if (status) {
      const statuses = status.split(",");
      sql += ` AND vc.status IN (${statuses.map(() => "?").join(",")})`;
      params.push(...statuses);
    }
    if (petId) {
      sql += ` AND vc.petId = ?`;
      params.push(petId);
    }

    sql += ` ORDER BY vc.nextDueDate ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await db
      .prepare(sql)
      .bind(...params)
      .all<Record<string, unknown>>();

    const vaccinations = rows.map((row) => ({
      id: row.id,
      petId: row.petId,
      userId: row.userId,
      name: row.name,
      type: row.type,
      manufacturer: row.manufacturer,
      dateAdministered: row.dateAdministered,
      nextDueDate: row.nextDueDate,
      veterinarian: row.veterinarian,
      clinic: row.clinic,
      batchNumber: row.batchNumber,
      notes: row.notes,
      status: row.status,
      reminderSent: row.reminderSent,
      reminderDays: row.reminderDays,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      pet: {
        id: row.pet_id,
        name: row.pet_name,
        species: row.pet_species,
        breed: row.pet_breed,
        photo: row.pet_photo,
        gender: row.pet_gender,
        birthDate: row.pet_birthDate,
        weight: row.pet_weight,
        color: row.pet_color,
        notes: row.pet_notes,
        isActive: row.pet_isActive,
        userId: row.pet_userId,
        createdAt: row.pet_createdAt,
        updatedAt: row.pet_updatedAt,
      },
    }));

    // Count
    let countSql =
      "SELECT COUNT(*) as count FROM vaccinations WHERE userId = ?";
    const countParams: unknown[] = [session.userId];
    if (status) {
      const statuses = status.split(",");
      countSql += ` AND status IN (${statuses.map(() => "?").join(",")})`;
      countParams.push(...statuses);
    }
    if (petId) {
      countSql += ` AND petId = ?`;
      countParams.push(petId);
    }
    const total = await db
      .prepare(countSql)
      .bind(...countParams)
      .first<{ count: number }>();

    return NextResponse.json({
      success: true,
      vaccinations,
      total: total?.count || 0,
    });
  } catch (error) {
    console.error("Get vaccinations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vaccinations" },
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

    const body = (await request.json()) as { petId?: string; name?: string; type?: string; manufacturer?: string; dateAdministered?: string; nextDueDate?: string; veterinarian?: string; clinic?: string; batchNumber?: string; notes?: string; reminderDays?: number };
    const {
      petId,
      name,
      type,
      manufacturer,
      dateAdministered,
      nextDueDate,
      veterinarian,
      clinic,
      batchNumber,
      notes,
      reminderDays,
    } = body;

    if (!petId || !name) {
      return NextResponse.json(
        { success: false, error: "Pet and vaccine name are required" },
        { status: 400 },
      );
    }

    // Determine status
    let status = "scheduled";
    if (dateAdministered && !nextDueDate) {
      status = "completed";
    } else if (nextDueDate && new Date(nextDueDate) < new Date()) {
      status = "overdue";
    }

    const db = await getDb();
    const id = generateId();
    const now = nowISO();

    await db.prepare(
      `INSERT INTO vaccinations (id, userId, petId, name, type, manufacturer, dateAdministered, nextDueDate, veterinarian, clinic, batchNumber, notes, reminderDays, status, reminderSent, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    )
      .bind(
        id,
        session.userId,
        petId,
        name,
        type || null,
        manufacturer || null,
        dateAdministered || null,
        nextDueDate || null,
        veterinarian || null,
        clinic || null,
        batchNumber || null,
        notes || null,
        reminderDays || 7,
        status,
        now,
        now,
      )
      .run();

    // Fetch back with pet relation
    const row = await db.prepare(`
      SELECT 
        vc.*, 
        p.id AS pet_id, p.name AS pet_name, p.species AS pet_species, p.breed AS pet_breed, p.photo AS pet_photo, p.gender AS pet_gender, p.birthDate AS pet_birthDate, p.weight AS pet_weight, p.color AS pet_color, p.notes AS pet_notes, p.isActive AS pet_isActive, p.userId AS pet_userId, p.createdAt AS pet_createdAt, p.updatedAt AS pet_updatedAt
      FROM vaccinations vc
      LEFT JOIN pets p ON vc.petId = p.id
      WHERE vc.id = ?
    `)
      .bind(id)
      .first<Record<string, unknown>>();

    const vaccination = row
      ? {
        id: row.id,
        petId: row.petId,
        userId: row.userId,
        name: row.name,
        type: row.type,
        manufacturer: row.manufacturer,
        dateAdministered: row.dateAdministered,
        nextDueDate: row.nextDueDate,
        veterinarian: row.veterinarian,
        clinic: row.clinic,
        batchNumber: row.batchNumber,
        notes: row.notes,
        status: row.status,
        reminderSent: row.reminderSent,
        reminderDays: row.reminderDays,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        pet: {
          id: row.pet_id,
          name: row.pet_name,
          species: row.pet_species,
          breed: row.pet_breed,
          photo: row.pet_photo,
          gender: row.pet_gender,
          birthDate: row.pet_birthDate,
          weight: row.pet_weight,
          color: row.pet_color,
          notes: row.pet_notes,
          isActive: row.pet_isActive,
          userId: row.pet_userId,
          createdAt: row.pet_createdAt,
          updatedAt: row.pet_updatedAt,
        },
      }
      : null;

    return NextResponse.json({
      success: true,
      message: "Vaccination record added successfully",
      vaccination,
    });
  } catch (error) {
    console.error("Create vaccination error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create vaccination" },
      { status: 500 },
    );
  }
}
