export const runtime = "edge";
// src/app/api/appointments/route.ts
// Purpose: List and create appointments for the authenticated user.

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

    const db = await getDb();

    let sql = `
      SELECT 
        a.*,
        p.id AS pet_id, p.name AS pet_name, p.species AS pet_species, p.breed AS pet_breed, p.photo AS pet_photo, p.gender AS pet_gender, p.birthDate AS pet_birthDate, p.weight AS pet_weight, p.color AS pet_color, p.notes AS pet_notes, p.isActive AS pet_isActive, p.userId AS pet_userId, p.createdAt AS pet_createdAt, p.updatedAt AS pet_updatedAt,
        v.id AS vet_id, v.name AS vet_name, v.specialization AS vet_specialization, v.clinic AS vet_clinic, v.address AS vet_address, v.phone AS vet_phone, v.email AS vet_email, v.photo AS vet_photo, v.qualification AS vet_qualification, v.experience AS vet_experience, v.rating AS vet_rating, v.reviewCount AS vet_reviewCount, v.consultationFee AS vet_consultationFee, v.availability AS vet_availability, v.bio AS vet_bio, v.isActive AS vet_isActive, v.createdAt AS vet_createdAt, v.updatedAt AS vet_updatedAt
      FROM appointments a
      LEFT JOIN pets p ON a.petId = p.id
      LEFT JOIN veterinarians v ON a.vetId = v.id
      WHERE a.userId = ?
    `;
    const params: unknown[] = [session.userId];

    if (status) {
      const statuses = status.split(",");
      sql += ` AND a.status IN (${statuses.map(() => "?").join(",")})`;
      params.push(...statuses);
    }

    sql += ` ORDER BY a.date ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await db
      .prepare(sql)
      .bind(...params)
      .all<Record<string, unknown>>();

    // Format rows to nested objects (matching Prisma include structure)
    const appointments = rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      petId: row.petId,
      vetId: row.vetId,
      date: row.date,
      time: row.time,
      duration: row.duration,
      reason: row.reason,
      type: row.type,
      status: row.status,
      notes: row.notes,
      fee: row.fee,
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
      vet: {
        id: row.vet_id,
        name: row.vet_name,
        specialization: row.vet_specialization,
        clinic: row.vet_clinic,
        address: row.vet_address,
        phone: row.vet_phone,
        email: row.vet_email,
        photo: row.vet_photo,
        qualification: row.vet_qualification,
        experience: row.vet_experience,
        rating: row.vet_rating,
        reviewCount: row.vet_reviewCount,
        consultationFee: row.vet_consultationFee,
        availability: row.vet_availability,
        bio: row.vet_bio,
        isActive: row.vet_isActive,
        createdAt: row.vet_createdAt,
        updatedAt: row.vet_updatedAt,
      },
    }));

    // Count
    let countSql =
      "SELECT COUNT(*) as count FROM appointments WHERE userId = ?";
    const countParams: unknown[] = [session.userId];
    if (status) {
      const statuses = status.split(",");
      countSql += ` AND status IN (${statuses.map(() => "?").join(",")})`;
      countParams.push(...statuses);
    }
    const total = await db
      .prepare(countSql)
      .bind(...countParams)
      .first<{ count: number }>();

    return NextResponse.json({
      success: true,
      appointments,
      total: total?.count || 0,
    });
  } catch (error) {
    console.error("Get appointments error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch appointments" },
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

    const body = (await request.json()) as { petId?: string; vetId?: string; date?: string; time?: string; duration?: string; reason?: string; type?: string; notes?: string };
    const { petId, vetId, date, time, duration, reason, type, notes } = body;

    if (!petId || !vetId || !date || !time) {
      return NextResponse.json(
        {
          success: false,
          error: "Pet, veterinarian, date, and time are required",
        },
        { status: 400 },
      );
    }

    const db = await getDb();
    const id = generateId();
    const now = nowISO();

    const receptionistResult = await db.prepare('SELECT receptionistId FROM receptionist_doctors WHERE vetId = ?').bind(vetId).all<{ receptionistId: string }>();

    const statements: any[] = [
      {
        sql: `INSERT INTO appointments (id, userId, petId, vetId, date, time, duration, reason, type, notes, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
        args: [
          id,
          session.userId,
          petId,
          vetId,
          date,
          time,
          duration || 30,
          reason || null,
          type || "consultation",
          notes || null,
          now,
          now,
        ]
      }
    ];

    for (const row of receptionistResult) {
      statements.push({
        sql: 'INSERT INTO notifications (id, userId, type, title, message, actionUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [
          generateId(),
          row.receptionistId,
          'appointment',
          'New Appointment Request',
          'A new appointment request has been made for an assigned doctor.',
          '/dashboard/receptionist',
          nowISO()
        ]
      });
    }

    await db.batch(statements, "write");

    // Fetch back with relations
    const row = await db
      .prepare(`
        SELECT a.*,
          p.id AS pet_id, p.name AS pet_name, p.species AS pet_species, p.breed AS pet_breed, p.photo AS pet_photo, p.gender AS pet_gender, p.birthDate AS pet_birthDate, p.weight AS pet_weight, p.color AS pet_color, p.notes AS pet_notes, p.isActive AS pet_isActive, p.userId AS pet_userId, p.createdAt AS pet_createdAt, p.updatedAt AS pet_updatedAt,
          v.id AS vet_id, v.name AS vet_name, v.specialization AS vet_specialization, v.clinic AS vet_clinic, v.address AS vet_address, v.phone AS vet_phone, v.email AS vet_email, v.photo AS vet_photo, v.qualification AS vet_qualification, v.experience AS vet_experience, v.rating AS vet_rating, v.reviewCount AS vet_reviewCount, v.consultationFee AS vet_consultationFee, v.availability AS vet_availability, v.bio AS vet_bio, v.isActive AS vet_isActive, v.createdAt AS vet_createdAt, v.updatedAt AS vet_updatedAt
        FROM appointments a
        LEFT JOIN pets p ON a.petId = p.id
        LEFT JOIN veterinarians v ON a.vetId = v.id
        WHERE a.id = ?
      `)
      .bind(id)
      .first<Record<string, unknown>>();

    const appointment = row
      ? {
        id: row.id,
        userId: row.userId,
        petId: row.petId,
        vetId: row.vetId,
        date: row.date,
        time: row.time,
        duration: row.duration,
        reason: row.reason,
        type: row.type,
        status: row.status,
        notes: row.notes,
        fee: row.fee,
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
        vet: {
          id: row.vet_id,
          name: row.vet_name,
          specialization: row.vet_specialization,
          clinic: row.vet_clinic,
          address: row.vet_address,
          phone: row.vet_phone,
          email: row.vet_email,
          photo: row.vet_photo,
          qualification: row.vet_qualification,
          experience: row.vet_experience,
          rating: row.vet_rating,
          reviewCount: row.vet_reviewCount,
          consultationFee: row.vet_consultationFee,
          availability: row.vet_availability,
          bio: row.vet_bio,
          isActive: row.vet_isActive,
          createdAt: row.vet_createdAt,
          updatedAt: row.vet_updatedAt,
        },
      }
      : null;

    return NextResponse.json({
      success: true,
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create appointment" },
      { status: 500 },
    );
  }
}
