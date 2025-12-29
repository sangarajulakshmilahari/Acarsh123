import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    // 1️⃣ Total leads (NO CHANGE)
    const totalResult = await pool.request().query(`
      SELECT COUNT(LeadId) AS totalLeads
      FROM Leads
    `);

    /* --------------------------------------------------
       COMMON CTE: Latest Activity per Lead
       -------------------------------------------------- */
    const latestActivityCTE = `
      WITH LatestActivity AS (
        SELECT
          la.LeadId,
          la.StatusId,
          ROW_NUMBER() OVER (
            PARTITION BY la.LeadId
            ORDER BY la.ActivityDate DESC, la.CreatedOn DESC
          ) AS rn
        FROM LeadActivities la
      )
    `;

    // 2️⃣ Status-wise counts (STATUS CARDS)
    const statusResult = await pool.request().query(`
      ${latestActivityCTE}
      SELECT
        COALESCE(la.StatusId, l.StatusId) AS StatusId,
        COUNT(l.LeadId) AS count
      FROM Leads l
      LEFT JOIN LatestActivity la
        ON la.LeadId = l.LeadId
        AND la.rn = 1
      GROUP BY COALESCE(la.StatusId, l.StatusId)
      ORDER BY StatusId
    `);

    // 3️⃣ Leads by Status (BAR CHART)
    const leadsByStatusResult = await pool.request().query(`
      ${latestActivityCTE}
      SELECT
        ls.StatusName,
        COUNT(l.LeadId) AS count
        FROM LeadStatuses ls
        LEFT JOIN Leads l
        ON ls.StatusId = (
      SELECT COALESCE(la.StatusId, l2.StatusId)
      FROM Leads l2
      LEFT JOIN LatestActivity la
      ON la.LeadId = l2.LeadId
      AND la.rn = 1
      WHERE l2.LeadId = l.LeadId
      )
      GROUP BY ls.StatusName, ls.SortOrder
      ORDER BY ls.SortOrder;

    `);

    // 4️⃣ Leads by Owner (NO CHANGE)
    const leadsByOwnerResult = await pool.request().query(`
      SELECT
        u.UserName AS OwnerName,
        COUNT(l.LeadId) AS count
      FROM Leads l
      INNER JOIN Users u
        ON l.OwnerId = u.UserId
      GROUP BY u.UserName
      ORDER BY count DESC
    `);

    // 5️⃣ Monthly trends by owner (NO CHANGE)
    const monthlyTrendsResult = await pool.request().query(`
      SELECT
        FORMAT(l.LeadDate, 'MMM yyyy') AS MonthYear,
        YEAR(l.LeadDate) AS YearNum,
        MONTH(l.LeadDate) AS MonthNum,
        u.UserName AS OwnerName,
        COUNT(l.LeadId) AS count
      FROM Leads l
      INNER JOIN Users u
        ON l.OwnerId = u.UserId
      GROUP BY
        FORMAT(l.LeadDate, 'MMM yyyy'),
        YEAR(l.LeadDate),
        MONTH(l.LeadDate),
        u.UserName
      ORDER BY
        YearNum,
        MonthNum
    `);

    return NextResponse.json({
      totalLeads: totalResult.recordset[0].totalLeads,
      statusCounts: statusResult.recordset, // ✅ activity-aware
      leadsByStatus: leadsByStatusResult.recordset, // ✅ activity-aware
      leadsByOwner: leadsByOwnerResult.recordset,
      monthlyTrends: monthlyTrendsResult.recordset,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
