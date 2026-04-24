export const runtime = "edge";
// src/app/api/comments/route.ts
// Purpose: Get comments for a post and create new comments.

import { NextRequest, NextResponse } from "next/server";
import { queryDb, queryDbFirst, executeDb, generateId, nowISO, getDb } from "@/lib/db";
import { cookies } from "next/headers";

// GET - Get comments for a post
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const parentId = searchParams.get("parentId"); // To fetch replies specifically
    const depth = parseInt(searchParams.get("depth") || "0");

    if (!postId) {
      return NextResponse.json({ success: false, error: "Post ID is required" }, { status: 400 });
    }

    const db = await getDb();
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("petcare_session")?.value;
    let currentUserId: string | null = null;
    if (sessionCookie) {
      try {
        currentUserId = JSON.parse(sessionCookie).userId;
      } catch { /* ignore */ }
    }

    // Professional query: include reaction counts and user's reaction
    const query = `
      SELECT 
        c.*,
        u.id AS user_id, u.name AS user_name, u.avatar AS user_avatar,
        (SELECT COUNT(*) FROM reactions WHERE commentId = c.id) AS reactions_count,
        ${currentUserId ? `(SELECT type FROM reactions WHERE commentId = c.id AND userId = '${currentUserId}' LIMIT 1)` : 'NULL'} AS user_reaction,
        (SELECT COUNT(*) FROM comments WHERE parentId = c.id) AS replies_count
      FROM comments c
      LEFT JOIN users u ON c.userId = u.id
      WHERE c.postId = ? AND ${parentId ? 'c.parentId = ?' : 'c.parentId IS NULL'}
      ORDER BY c.createdAt ASC
    `;

    const args = parentId ? [postId, parentId] : [postId];
    const rows = await db.prepare(query).bind(...args).all<any>();

    const comments = rows.map((row) => ({
      id: row.id,
      postId: row.postId,
      userId: row.userId,
      content: row.content,
      parentId: row.parentId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      reactionsCount: row.reactions_count || 0,
      userReaction: row.user_reaction,
      repliesCount: row.replies_count || 0,
      user: {
        id: row.user_id,
        name: row.user_name,
        avatar: row.user_avatar,
      },
    }));

    return NextResponse.json({ success: true, comments });
  } catch (error: any) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST - Create a comment
export async function POST(request: NextRequest) {
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

    const body = (await request.json()) as { postId?: string; content?: string; parentId?: string };
    const { postId, content, parentId } = body;

    if (!postId || !content?.trim()) {
      return NextResponse.json({ success: false, error: "Post ID and content are required" }, { status: 400 });
    }

    const db = await getDb();
    const id = generateId();
    const now = nowISO();

    await db.prepare(
      "INSERT INTO comments (id, postId, userId, content, parentId, likesCount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, 0, ?, ?)",
    ).bind(id, postId, userId, content.trim(), parentId || null, now, now).run();

    // Increment comments count on post
    await db.prepare("UPDATE posts SET commentsCount = commentsCount + 1 WHERE id = ?").bind(postId).run();

    const user = await db.prepare("SELECT id, name, avatar FROM users WHERE id = ?").bind(userId).first();

    return NextResponse.json({
      success: true,
      comment: {
        id, postId, userId, content: content.trim(), parentId: parentId || null,
        reactionsCount: 0, userReaction: null, repliesCount: 0,
        createdAt: now, updatedAt: now, user
      },
    });
  } catch (error: any) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ success: false, error: "Failed to create comment" }, { status: 500 });
  }
}

// DELETE - Delete a comment
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("id");

    if (!commentId) {
      return NextResponse.json({ success: false, error: "Comment ID is required" }, { status: 400 });
    }

    const db = await getDb();
    
    // Check ownership
    const comment = await db.prepare("SELECT userId, postId FROM comments WHERE id = ?").bind(commentId).first<any>();
    if (!comment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Delete comment (replies will be deleted by ON DELETE CASCADE)
    await db.prepare("DELETE FROM comments WHERE id = ?").bind(commentId).run();

    // Decrement post comment count (this is simplified, might need to decrement by total deleted if counting subcomments)
    await db.prepare("UPDATE posts SET commentsCount = (SELECT COUNT(*) FROM comments WHERE postId = ?) WHERE id = ?")
      .bind(comment.postId, comment.postId).run();

    return NextResponse.json({ success: true, message: "Comment deleted" });
  } catch (error: any) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ success: false, error: "Failed to delete comment" }, { status: 500 });
  }
}
