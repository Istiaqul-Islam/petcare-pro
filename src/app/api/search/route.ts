export const runtime = "edge";
// src/app/api/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { queryDb, getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json({ success: true, users: [], posts: [] });
    }

    const searchTerm = `%${q}%`;

    // 1. Search Users
    const users = await queryDb<any>(
      "SELECT id, name, avatar, role FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 5",
      [searchTerm, searchTerm]
    );

    // 2. Search Posts
    const posts = await queryDb<any>(
      `SELECT p.id, p.content, p.images, p.videos, p.createdAt, u.name as user_name, u.avatar as user_avatar 
       FROM posts p 
       JOIN users u ON p.userId = u.id 
       WHERE p.content LIKE ? AND p.isPublic = 1 
       LIMIT 10`,
      [searchTerm]
    );

    const formattedPosts = posts.map(post => ({
      ...post,
      images: post.images ? JSON.parse(post.images) : [],
      videos: post.videos ? JSON.parse(post.videos) : [],
      user: { name: post.user_name, avatar: post.user_avatar }
    }));

    return NextResponse.json({
      success: true,
      users,
      posts: formattedPosts
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ success: false, error: "Search failed" }, { status: 500 });
  }
}
