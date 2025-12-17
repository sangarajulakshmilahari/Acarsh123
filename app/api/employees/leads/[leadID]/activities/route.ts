import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import sql from "mssql";

export async function POST(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { Mode, Notes, Status, ActivityDate } = await req.json();

    if (!Mode || !Notes || !Status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    /* 1️⃣ Get StatusId from LeadStatuses */
    const statusResult = await pool
      .request()
      .input("StatusName", sql.VarChar, Status)
      .query(`
        SELECT StatusId
        FROM LeadStatuses
        WHERE StatusName = @StatusName
      `);

    if (!statusResult.recordset.length) {
      return NextResponse.json(
        { error: "Invalid Status" },
        { status: 400 }
      );
    }

    const StatusId = statusResult.recordset[0].StatusId;

    /* 2️⃣ Insert Activity */
    const insertResult = await pool
      .request()
      .input("LeadId", sql.Int, Number(params.leadId))
      .input("Mode", sql.VarChar, Mode)
      .input("Notes", sql.VarChar, Notes)
      .input("StatusId", sql.Int, StatusId)
      .input(
        "ActivityDate",
        sql.DateTime,
        ActivityDate ? new Date(ActivityDate) : new Date()
      )
      .query(`
        INSERT INTO LeadActivities
        (LeadId, Mode, Notes, StatusId, ActivityDate)
        OUTPUT INSERTED.ActivityId, INSERTED.ActivityDate
        VALUES
        (@LeadId, @Mode, @Notes, @StatusId, @ActivityDate)
      `);

    return NextResponse.json({
      ActivityId: insertResult.recordset[0].ActivityId,
      ActivityDate: insertResult.recordset[0].ActivityDate,
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
