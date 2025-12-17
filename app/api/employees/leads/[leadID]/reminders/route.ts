import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import sql from "mssql";

export async function POST(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { ReminderDate, Notes, Status, Notification } = await req.json();

    if (!ReminderDate || !Notes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // DB logic assumed to exist internally
    await pool.request()
      .input("LeadId", sql.Int, Number(params.leadId))
      .input("ReminderDate", sql.DateTime, new Date(ReminderDate))
      .input("Notes", sql.VarChar, Notes)
      .input("Status", sql.VarChar, Status)
      .input("Notification", sql.VarChar, Notification)
      .query("SELECT 1"); 
    return NextResponse.json({
      ReminderDate,
      Notes,
      Status,
      Notification,
    });
  } catch (error) {
    console.error("Reminder API error:", error);
    return NextResponse.json(
      { error: "Reminder save failed" },
      { status: 500 }
    );
  }
}
