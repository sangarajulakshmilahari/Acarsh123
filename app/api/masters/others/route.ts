import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        Opportunity_StatusId,
        Opportunities_StatusName
      FROM Opportunities_Status
      ORDER BY Opportunity_StatusId
    `);

    const companiesResult = await pool.request().query(`
  SELECT DISTINCT CompanyName
  FROM Leads
  WHERE CompanyName IS NOT NULL
  ORDER BY CompanyName
`);

    const leadSourcesResult = await pool.request().query(`
  SELECT DISTINCT LeadSource
  FROM Leads
  WHERE LeadSource IS NOT NULL
  ORDER BY LeadSource
`);

    const ownernameresult = await pool.request().query(`
  SELECT DISTINCT UserId, UserName
FROM Users
WHERE UserName IS NOT NULL
ORDER BY UserId;

`);

   const Role= await pool.request().query(`
  SELECT DISTINCT Role
FROM ContactRoles
WHERE Role IS NOT NULL
ORDER BY Role;

`);

    return NextResponse.json({
      opportunityStatuses: result.recordset,
      companies: companiesResult.recordset,
      leadSources: leadSourcesResult.recordset,
      ownername: ownernameresult.recordset,
      Role:Role.recordset
    });
  } catch (error) {
    console.error("Error fetching opportunity statuses:", error);
    return NextResponse.json(
      { error: "Failed to fetch statuses" },
      { status: 500 }
    );
  }
}
