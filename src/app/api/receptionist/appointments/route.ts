export const runtime = "edge";
// src/app/api/receptionist/appointments/route.ts
// Purpose: Fetch and update appointments for the doctors assigned to the current receptionist.

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import getTurso from "@/lib/turso";
import { generateId, nowISO } from "@/lib/db";

async function requireReceptionist() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Fetch the latest role from the database to avoid stale session issues
  const db = getTurso();
  const userResult = await db.execute({
    sql: "SELECT role FROM users WHERE id = ?",
    args: [session.userId]
  });

  const role = userResult.rows[0]?.role as string;
  
  if (role !== "receptionist" && role !== "admin") {
    throw new Error("Unauthorized - Receptionist or Admin access required");
  }
  
  // Return session with the updated role for consistency
  return { ...session, role };
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireReceptionist();
    const db = getTurso();

    // If admin, show all appointments. If receptionist, show assigned only.
    const isAdmin = session.role === 'admin';
    const whereClause = isAdmin 
      ? '1=1' 
      : '(a.vetId IN (SELECT vetId FROM receptionist_doctors WHERE receptionistId = ?) OR a.vetId IS NULL)';
    const queryArgs = isAdmin ? [] : [session.userId];

    const appointments = await db.execute({
      sql: `
        SELECT 
          a.id, a.date, a.time, a.status, a.reason, a.type, a.createdAt,
          p.name as petName, p.species,
          u.name as ownerName, u.phone as ownerPhone, u.email as ownerEmail,
          v.name as vetName
        FROM appointments a
        LEFT JOIN pets p ON a.petId = p.id
        LEFT JOIN users u ON a.userId = u.id
        LEFT JOIN veterinarians v ON a.vetId = v.id
        WHERE ${whereClause}
        ORDER BY a.date DESC, a.time DESC
      `,
      args: queryArgs
    });

    // Fetch all active veterinarians
    const vetsResult = await db.execute("SELECT id, name, specialization FROM veterinarians WHERE isActive = 1");

    return NextResponse.json({ 
      success: true, 
      appointments: appointments.rows,
      veterinarians: vetsResult.rows,
      _debug: {
        role: session.role,
        isAdmin,
        userId: session.userId,
        appointmentCount: appointments.rows.length
      }
    });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error fetching receptionist appointments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireReceptionist();
    const { appointmentId, status, vetId, notificationMessage } = (await request.json()) as { 
      appointmentId: string; 
      status?: string; 
      vetId?: string;
      notificationMessage?: string;
    };

    if (!appointmentId) {
      return NextResponse.json({ error: "Missing appointmentId" }, { status: 400 });
    }

    const db = getTurso();

    // Verify appointment belongs to an assigned doctor (or allow if admin)
    const isAdmin = session.role === 'admin';
    const whereClause = isAdmin
      ? 'a.id = ?'
      : 'a.id = ? AND (a.vetId IN (SELECT vetId FROM receptionist_doctors WHERE receptionistId = ?) OR a.vetId IS NULL)';
    const queryArgs = isAdmin ? [appointmentId] : [appointmentId, session.userId];

    const aptResult = await db.execute({
      sql: `
        SELECT a.id, a.userId, v.name as vetName
        FROM appointments a
        LEFT JOIN veterinarians v ON a.vetId = v.id
        WHERE ${whereClause}
      `,
      args: queryArgs
    });

    if (aptResult.rows.length === 0) {
      return NextResponse.json({ error: "Appointment not found or unauthorized" }, { status: 404 });
    }

    const appointmentUserId = aptResult.rows[0].userId;
    const vetName = aptResult.rows[0].vetName || "Unassigned Doctor";
    const notificationId = generateId();

    const title = status === 'confirmed' ? 'Appointment Confirmed' : (status === 'cancelled' ? 'Appointment Cancelled' : 'Appointment Update');
    const defaultMsg = `Your appointment status is now ${status}.`;
    const msg = notificationMessage || defaultMsg;

    const statements = [];
    
    if (status) {
      statements.push({
        sql: "UPDATE appointments SET status = ?, updatedAt = datetime('now') WHERE id = ?",
        args: [status, appointmentId]
      });
      
      statements.push({
        sql: 'INSERT INTO notifications (id, userId, type, title, message, actionUrl, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [notificationId, appointmentUserId, 'appointment', title, msg, '/dashboard/appointments', nowISO()]
      });
    }

    if (vetId) {
      statements.push({
        sql: "UPDATE appointments SET vetId = ?, updatedAt = datetime('now') WHERE id = ?",
        args: [vetId, appointmentId]
      });
    }

    if (statements.length > 0) {
      await db.batch(statements, "write");
    }

    return NextResponse.json({ success: true, message: "Appointment updated successfully" });
  } catch (error: any) {
    if (error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error("Error updating appointment status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
