export const runtime = "edge";
// src/app/api/posts/route.ts
// Purpose: List public posts and create new posts.

import { NextRequest, NextResponse } from "next/server";
import { queryDb, queryDbFirst, executeDb, generateId, nowISO, getDb } from "@/lib/db";
import { cookies } from "next/headers";

// GET - List all public posts
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query = userId
      ? `
      SELECT 
        p.*,
        u.id AS user_id, u.name AS user_name, u.avatar AS user_avatar,
        (SELECT COUNT(*) FROM reactions WHERE postId = p.id) AS total_likes,
        (SELECT COUNT(*) FROM comments WHERE postId = p.id) AS total_comments,
        (SELECT type FROM reactions WHERE postId = p.id AND userId = ? LIMIT 1) AS user_reaction
      FROM posts p
      LEFT JOIN users u ON p.userId = u.id
      WHERE p.isPublic = 1
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `
      : `
      SELECT 
        p.*,
        u.id AS user_id, u.name AS user_name, u.avatar AS user_avatar,
        (SELECT COUNT(*) FROM reactions WHERE postId = p.id) AS total_likes,
        (SELECT COUNT(*) FROM comments WHERE postId = p.id) AS total_comments
      FROM posts p
      LEFT JOIN users u ON p.userId = u.id
      WHERE p.isPublic = 1
      ORDER BY p.createdAt DESC
      LIMIT ? OFFSET ?
    `;

    const rows = await queryDb<any>(
      query,
      userId ? [userId, limit, skip] : [limit, skip]
    );

    const countResult = await queryDb<{ count: number }>(
      "SELECT COUNT(*) as count FROM posts WHERE isPublic = 1",
      []
    );
    const total = countResult?.[0]?.count || 0;

    const formattedPosts = rows.map((post) => ({
      id: post.id,
      userId: post.userId,
      content: post.content,
      images: post.images ? JSON.parse(post.images as string) : [],
      videos: post.videos ? JSON.parse(post.videos as string) : [],
      audios: post.audios ? JSON.parse(post.audios as string) : [],
      likesCount: post.total_likes,
      commentsCount: post.total_comments,
      isPublic: post.isPublic,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isLiked: userId ? !!post.user_reaction : false,
      userReaction: post.user_reaction || null,
      user: {
        id: post.user_id,
        name: post.user_name,
        avatar: post.user_avatar,
      },
      _count: {
        likes: post.total_likes,
        comments: post.total_comments,
      },
    }));

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch posts" },
      { status: 500 },
    );
  }
}

// POST - Create a new post
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
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { 
      content?: string; 
      images?: string[]; 
      videos?: string[];
      isPublic?: boolean 
    };
    const { content, images, videos, isPublic } = body;

    const hasMedia = (images && images.length > 0) || (videos && videos.length > 0);
    const hasText = !!content?.trim();

    if (!hasText && !hasMedia) {
      return NextResponse.json(
        { success: false, error: "Content or media is required" },
        { status: 400 },
      );
    }

    const db = await getDb();
    const id = generateId();
    const now = nowISO();

    await db.prepare(
      `INSERT INTO posts (id, userId, content, images, videos, audios, isPublic, likesCount, commentsCount, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
    )
      .bind(
        id,
        userId,
        content?.trim() || "",
        images && images.length > 0 ? JSON.stringify(images) : null,
        videos && videos.length > 0 ? JSON.stringify(videos) : null,
        null, // audios removed
        isPublic !== undefined ? (isPublic ? 1 : 0) : 1,
        now,
        now,
      )
      .run();

    // Fetch user details for the response
    const user = await db.prepare("SELECT id, name, avatar FROM users WHERE id = ?").bind(userId).first();

    return NextResponse.json({
      success: true,
      post: {
        id,
        userId,
        content: content.trim(),
        images: images || [],
        videos: videos || [],
        audios: [], // audios feature removed
        isPublic: isPublic !== undefined ? isPublic : true,
        likesCount: 0,
        commentsCount: 0,
        createdAt: now,
        updatedAt: now,
        isLiked: false,
        userReaction: null,
        user,
        _count: {
          likes: 0,
          comments: 0,
        },
      },
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create post" },
      { status: 500 },
    );
  }
}
