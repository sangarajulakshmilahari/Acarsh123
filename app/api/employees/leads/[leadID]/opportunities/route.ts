import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import sql from "mssql";

export async function POST(
  req: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { Service, Probability, Status, EngagementModel } = await req.json();

    if (!Service || !Status || !Probability || !EngagementModel) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    // DB logic assumed to exist (same pattern as activities/reminders)
    await pool.request()
      .input("LeadId", sql.Int, Number(params.leadId))
      .input("Service", sql.VarChar, Service)
      .input("Probability", sql.VarChar, Probability)
      .input("Status", sql.VarChar, Status)
      .input("EngagementModel", sql.VarChar, EngagementModel)
      .query("SELECT 1"); // placeholder

    return NextResponse.json({
      CreatedDate: new Date().toISOString(),
      Service,
      Probability,
      Status,
      EngagementModel,
    });
  } catch (error) {
    console.error("Opportunity API error:", error);
    return NextResponse.json(
      { error: "Opportunity save failed" },
      { status: 500 }
    );
  }
}
