import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import sql from "mssql";

export async function POST(
  req: NextRequest,
  { params }: { params: { leadID: string } }
) {
  try {
    const { Mode, Notes, Status, ActivityDate } = await req.json();

    // ✅ Strong validation
    if (
      !Mode?.trim() ||
      !Notes?.trim() ||
      !Status?.trim()
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const leadId = Number(params.leadID);
    if (isNaN(leadId)) {
      return NextResponse.json(
        { error: "Invalid LeadId" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    /* 1️⃣ Get StatusId */
    const statusResult = await pool
      .request()
      .input("StatusName", sql.VarChar, Status)
      .query(`
        SELECT StatusId
        FROM LeadStatuses
        WHERE StatusName = @StatusName
      `);

    const StatusId = statusResult.recordset[0]?.StatusId ?? 1;

    /* 2️⃣ Insert into REAL columns */
    const insertResult = await pool
      .request()
      .input("LeadId", sql.Int, leadId)
      .input("ActivityType", sql.VarChar, Mode) // ✅ FIXED
      .input("Notes", sql.VarChar, Notes)
      .input("StatusId", sql.Int, StatusId)
      .input(
        "ActivityDate",
        sql.DateTime,
        ActivityDate ? new Date(ActivityDate) : new Date()
      )
      .query(`
        INSERT INTO LeadActivities
        (LeadId, ActivityType, Notes, StatusId, ActivityDate)
        OUTPUT 
          INSERTED.ActivityId,
          INSERTED.ActivityType,
          INSERTED.ActivityDate
        VALUES
        (@LeadId, @ActivityType, @Notes, @StatusId, @ActivityDate)
      `);

    return NextResponse.json({
      ActivityId: insertResult.recordset[0].ActivityId,
      ActivityDate: insertResult.recordset[0].ActivityDate,
      Mode: insertResult.recordset[0].ActivityType,
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { leadID: string } }
) {
  try {
    const { ActivityId, Mode, Notes, Status, ActivityDate } = await req.json();
 
    if (!ActivityId) {
      return NextResponse.json(
        { error: "ActivityId is required" },
        { status: 400 }
      );
    }
 
    const pool = await getPool();
 
    // Resolve StatusId safely
    const statusResult = await pool
      .request()
      .input("StatusName", sql.VarChar, Status)
      .query(`
        SELECT StatusId
        FROM LeadStatuses
        WHERE StatusName = @StatusName
      `);
 
    const StatusId = statusResult.recordset[0]?.StatusId ?? 1;
 
    await pool
      .request()
      .input("ActivityId", sql.Int, ActivityId)
      .input("ActivityType", sql.VarChar, Mode)
      .input("Notes", sql.VarChar, Notes)
      .input("StatusId", sql.Int, StatusId)
      .input(
        "ActivityDate",
        sql.DateTime,
        ActivityDate ? new Date(ActivityDate) : new Date()
      )
      .query(`
        UPDATE LeadActivities
        SET
          ActivityType = @ActivityType,
          Notes = @Notes,
          StatusId = @StatusId,
          ActivityDate = @ActivityDate
        WHERE ActivityId = @ActivityId
      `);
 
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Activity PUT error:", error);
    return NextResponse.json(
      { error: "Activity update failed" },
      { status: 500 }
    );
  }
}
 
 
 
