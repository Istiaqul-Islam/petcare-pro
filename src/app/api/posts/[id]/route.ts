export const runtime = "edge";
// src/app/api/posts/[id]/route.ts
// Purpose: Get and delete a specific post.

import { NextRequest, NextResponse } from "next/server";
import { queryDb, queryDbFirst, executeDb, generateId, nowISO, getDb } from "@/lib/db";
import { cookies } from "next/headers";

// DELETE - Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("petcare_session")?.value;
    let userId: string | null = null;
    if (sessionCookie) {
      try {
        userId = JSON.parse(sessionCookie).userId;
      } catch { /* ignore */ }
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDb();

    // Check if post exists and belongs to user
    const post = await db
      .prepare("SELECT userId FROM posts WHERE id = ?")
      .bind(id)
      .first<{ userId: string }>();

    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    if (post.userId !== userId) {
      return NextResponse.json({ success: false, error: "You can only delete your own posts" }, { status: 403 });
    }

    // Related data will be deleted by ON DELETE CASCADE as defined in schema.sql
    // but just for safety if cascade is missing:
    await db.prepare("DELETE FROM reactions WHERE postId = ?").bind(id).run();
    await db.prepare("DELETE FROM comments WHERE postId = ?").bind(id).run();

    // Delete the post
    await db.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();

    return NextResponse.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ success: false, error: "Failed to delete post" }, { status: 500 });
  }
}

// GET - Get a single post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("petcare_session")?.value;
    let userId: string | null = null;
    if (sessionCookie) {
      try {
        userId = JSON.parse(sessionCookie).userId;
      } catch { /* ignore */ }
    }

    const { id } = await params;
    const db = await getDb();

    const row = await db
      .prepare(`
        SELECT p.*,
          u.id AS user_id, u.name AS user_name, u.avatar AS user_avatar,
          (SELECT COUNT(*) FROM reactions WHERE postId = p.id) AS total_likes,
          (SELECT COUNT(*) FROM comments WHERE postId = p.id) AS total_comments
          ${userId ? `, (SELECT type FROM reactions WHERE postId = p.id AND userId = ? LIMIT 1) AS user_reaction` : ""}
        FROM posts p
        LEFT JOIN users u ON p.userId = u.id
        WHERE p.id = ?
      `)
      .bind(...(userId ? [userId, id] : [id]))
      .first<Record<string, unknown>>();

    if (!row) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      post: {
        id: row.id,
        userId: row.userId,
        content: row.content,
        images: row.images ? JSON.parse(row.images as string) : [],
        videos: row.videos ? JSON.parse(row.videos as string) : [],
        audios: row.audios ? JSON.parse(row.audios as string) : [],
        likesCount: row.total_likes,
        commentsCount: row.total_comments,
        isPublic: row.isPublic,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        isLiked: !!row.user_reaction,
        userReaction: row.user_reaction || null,
        user: {
          id: row.user_id,
          name: row.user_name,
          avatar: row.user_avatar,
        },
        _count: {
          likes: row.total_likes,
          comments: row.total_comments,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch post" }, { status: 500 });
  }
}
