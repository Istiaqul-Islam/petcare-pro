export const runtime = "edge";
// src/app/api/user/[id]/route.ts
// Purpose: Get public user profile by ID with recent posts.

import { NextRequest, NextResponse } from "next/server";
import { queryDb, queryDbFirst, executeDb, generateId, nowISO, getDb } from "@/lib/db";

// GET - Get user profile by ID (public info only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = await getDb();

    // Get user with counts and privacy settings
    // Fallback logic in case migration hasn't run yet
    let user: any = null;
    try {
      user = await db
        .prepare(
          `
        SELECT 
          u.id, u.name, u.avatar, u.email, u.createdAt, u.showPets, u.showEmail,
          (SELECT COUNT(*) FROM posts WHERE userId = u.id AND isPublic = 1) AS postsCount,
          (SELECT COUNT(*) FROM pets WHERE userId = u.id AND isActive = 1) AS petsCount
        FROM users u
        WHERE u.id = ?
      `,
        )
        .bind(id)
        .first<any>();
    } catch (e) {
      // If privacy columns are missing, try query without them
      console.warn("Privacy columns missing, falling back...");
      user = await db
        .prepare(
          `
        SELECT 
          u.id, u.name, u.avatar, u.email, u.createdAt, 1 as showPets, 0 as showEmail,
          (SELECT COUNT(*) FROM posts WHERE userId = u.id AND isPublic = 1) AS postsCount,
          (SELECT COUNT(*) FROM pets WHERE userId = u.id AND isActive = 1) AS petsCount
        FROM users u
        WHERE u.id = ?
      `,
        )
        .bind(id)
        .first<any>();
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    // Get user's pets if public (defaulting to public if column missing)
    let pets: any[] = [];
    if (user.showPets === 1) {
      try {
        pets = await queryDb(
          "SELECT name, species, photo as image FROM pets WHERE userId = ? AND isActive = 1",
          [id]
        );
      } catch (e) {
        console.error("Error fetching pets:", e);
      }
    }

    // Get user's recent posts with counts
    const recentPosts = await db
      .prepare(
        `
      SELECT 
        p.*,
        u.id AS user_id, u.name AS user_name, u.avatar AS user_avatar,
        (SELECT COUNT(*) FROM reactions WHERE postId = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE postId = p.id) AS comments_count
      FROM posts p
      LEFT JOIN users u ON p.userId = u.id
      WHERE p.userId = ? AND p.isPublic = 1
      ORDER BY p.createdAt DESC
      LIMIT 10
    `,
      )
      .bind(id)
      .all<Record<string, unknown>>();

    const formattedPosts = recentPosts.map((post: any) => ({
      ...post,
      images: post.images ? JSON.parse(post.images as string) : [],
      videos: post.videos ? JSON.parse(post.videos as string) : [],
      user: {
        id: post.user_id,
        name: post.user_name,
        avatar: post.user_avatar,
      },
      _count: {
        likes: post.likes_count,
        comments: post.comments_count,
      },
    }));

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        email: user.showEmail === 1 ? user.email : null,
        createdAt: user.createdAt,
        showPets: user.showPets,
        showEmail: user.showEmail,
        _count: {
          posts: user.postsCount,
          pets: user.petsCount,
        },
        recentPosts: formattedPosts,
        pets: pets,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user profile" },
      { status: 500 },
    );
  }
}
