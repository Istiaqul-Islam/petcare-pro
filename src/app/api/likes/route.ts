export const runtime = "edge";
// src/app/api/reactions/route.ts
// Purpose: Toggle a reaction on a post or comment.

import { NextRequest, NextResponse } from "next/server";
import { generateId, nowISO, getDb } from "@/lib/db";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("petcare_session")?.value;
    let userId: string | null = null;
    if (sessionCookie) {
      try {
        userId = JSON.parse(sessionCookie).userId;
      } catch {
        /* ignore */
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { postId?: string; commentId?: string; type?: string };
    const { postId, commentId, type = "heart" } = body;

    if (!postId && !commentId) {
      return NextResponse.json({ success: false, error: "Post ID or Comment ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const now = nowISO();

    // Check if already reacted
    let existingReaction;
    if (postId) {
      existingReaction = await db
        .prepare("SELECT id, type FROM reactions WHERE postId = ? AND userId = ?")
        .bind(postId, userId)
        .first<{ id: string; type: string }>();
    } else {
      existingReaction = await db
        .prepare("SELECT id, type FROM reactions WHERE commentId = ? AND userId = ?")
        .bind(commentId, userId)
        .first<{ id: string; type: string }>();
    }

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Toggle off - same type
        await db.prepare("DELETE FROM reactions WHERE id = ?").bind(existingReaction.id).run();
        
        // Decrement count
        if (postId) {
          await db.prepare("UPDATE posts SET likesCount = likesCount - 1 WHERE id = ?").bind(postId).run();
        } else {
          await db.prepare("UPDATE comments SET likesCount = likesCount - 1 WHERE id = ?").bind(commentId).run();
        }

        return NextResponse.json({ success: true, reacted: false, type: null });
      } else {
        // Update type
        await db.prepare("UPDATE reactions SET type = ? WHERE id = ?").bind(type, existingReaction.id).run();
        return NextResponse.json({ success: true, reacted: true, type });
      }
    } else {
      // Add new reaction
      const id = generateId();
      if (postId) {
        await db.prepare("INSERT INTO reactions (id, postId, userId, type, createdAt) VALUES (?, ?, ?, ?, ?)")
          .bind(id, postId, userId, type, now).run();
        await db.prepare("UPDATE posts SET likesCount = likesCount + 1 WHERE id = ?").bind(postId).run();
      } else {
        await db.prepare("INSERT INTO reactions (id, commentId, userId, type, createdAt) VALUES (?, ?, ?, ?, ?)")
          .bind(id, commentId, userId, type, now).run();
        await db.prepare("UPDATE comments SET likesCount = likesCount + 1 WHERE id = ?").bind(commentId).run();
      }

      return NextResponse.json({ success: true, reacted: true, type });
    }
  } catch (error: any) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json({ success: false, error: "Failed to toggle reaction" }, { status: 500 });
  }
}
