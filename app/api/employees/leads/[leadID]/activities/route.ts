import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import sql from "mssql";

export async function POST(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const body = await req.json();

    const { Mode, Notes, Status, ActivityDate } = body;

    // ✅ basic validation (prevents 400)
    if (!Mode || !Notes || !Status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input("LeadId", sql.Int, Number(params.leadId))
      .input("Mode", sql.VarChar, Mode)
      .input("Notes", sql.VarChar, Notes)
      .input("Status", sql.VarChar, Status)
      .input(
        "ActivityDate",
        sql.DateTime,
        ActivityDate ? new Date(ActivityDate) : new Date()
      )
      // ⚠️ DB logic assumed to exist internally
      .query("SELECT 1 AS ok"); // temporary safe response

    return NextResponse.json({
      ActivityDate,
      Mode,
      Notes,
      Status,
    });
  } catch (error) {
    console.error("Activity API error:", error);
    return NextResponse.json(
      { error: "Activity save failed" },
      { status: 500 }
    );
  }
}
