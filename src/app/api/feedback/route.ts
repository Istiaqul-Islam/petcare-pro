export const runtime = "edge";
// src/app/api/feedback/route.ts
// Purpose: List and submit user feedback.

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
    const feedbacks = await db
      .prepare(
        "SELECT * FROM feedbacks WHERE userId = ? ORDER BY createdAt DESC LIMIT ? OFFSET ?",
      )
      .bind(session.userId, limit, offset)
      .all();

    const total = await db
      .prepare("SELECT COUNT(*) as count FROM feedbacks WHERE userId = ?")
      .bind(session.userId)
      .first<{ count: number }>();

    return NextResponse.json({
      success: true,
      feedbacks,
      total: total?.count || 0,
    });
  } catch (error) {
    console.error("Get feedback error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch feedback" },
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

    const body = (await request.json()) as { rating?: number; category?: string; subject?: string; message?: string };
    const { rating, category, subject, message } = body;

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5" },
        { status: 400 },
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category is required" },
        { status: 400 },
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 },
      );
    }

    if (message.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Message must be at least 10 characters" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const id = generateId();
    const now = nowISO();

    await db.prepare(
      `INSERT INTO feedbacks (id, userId, rating, category, subject, message, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    )
      .bind(
        id,
        session.userId,
        rating.toString(),
        category,
        subject?.trim() || null,
        message.trim(),
        now,
        now,
      )
      .run();

    const feedback = await db.prepare("SELECT * FROM feedbacks WHERE id = ?").bind(id).first<Record<string, unknown>>();

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    console.error("Create feedback error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit feedback" },
      { status: 500 },
    );
  }
}
