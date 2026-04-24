export const runtime = "edge";
// src/app/api/notifications/route.ts
// Purpose: Fetch and manage user notifications

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import getTurso from "@/lib/turso";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const db = getTurso();

    const result = await db.execute({
      sql: 'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT ?',
      args: [session.userId, limit]
    });

    const unreadResult = await db.execute({
      sql: 'SELECT COUNT(*) as unreadCount FROM notifications WHERE userId = ? AND read = 0',
      args: [session.userId]
    });

    const unreadCount = unreadResult.rows[0].unreadCount as number;

    return NextResponse.json({ 
      success: true, 
      notifications: result.rows,
      unreadCount
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationIds, markAllAsRead } = (await request.json()) as { notificationIds?: string[], markAllAsRead?: boolean };
    const db = getTurso();

    if (markAllAsRead) {
      await db.execute({
        sql: 'UPDATE notifications SET read = 1 WHERE userId = ? AND read = 0',
        args: [session.userId]
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: "Missing notificationIds" }, { status: 400 });
    }

    // Update specific notifications. Since Turso/libsql doesn't support array binding out-of-the-box easily for IN clause,
    // we use a batch of statements
    const statements = notificationIds.map((id: string) => ({
      sql: 'UPDATE notifications SET read = 1 WHERE id = ? AND userId = ?',
      args: [id, session.userId]
    }));

    await db.batch(statements, "write");

    return NextResponse.json({ success: true, message: "Notifications marked as read." });
  } catch (error: any) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
