import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";
import { getPool } from "@/lib/db";

/* =====================================================
   POST → CREATE NEW OPPORTUNITY (➕ ADD)
===================================================== */
export async function POST(
  req: NextRequest,
  { params }: { params: { leadID: string } }
) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const leadId = Number(params.leadID);
    if (isNaN(leadId)) {
      return NextResponse.json({ error: "Invalid Lead ID" }, { status: 400 });
    }

    const {
      serviceId,
      statusId,
      probabilityId,
      engagementId,
      technologies,
    } = await req.json();

    if (
      !serviceId ||
      !statusId ||
      !probabilityId ||
      !engagementId ||
      !Array.isArray(technologies)
    ) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    await transaction.begin();

    // 1️⃣ INSERT OPPORTUNITY
    const insertResult = await transaction
      .request()
      .input("LeadId", sql.Int, leadId)
      .input("ServiceId", sql.Int, serviceId)
      .input("ProbabilityId", sql.Int, probabilityId)
      .input("EngagementId", sql.Int, engagementId)
      .input("StatusId", sql.Int, statusId)
      .query(`
        INSERT INTO Opportunities
        (
          LeadId,
          ServiceId,
          ProbabilityId,
          EngagementId,
          Opportunity_StatusId,
          CreatedOn,
          IsDeleted
        )
        OUTPUT INSERTED.OpportunityId
        VALUES
        (
          @LeadId,
          @ServiceId,
          @ProbabilityId,
          @EngagementId,
          @StatusId,
          GETDATE(),
          0
        )
      `);

    const OpportunityId = insertResult.recordset[0].OpportunityId;

    // 2️⃣ INSERT TECHNOLOGIES
    for (const subCategoryId of technologies) {
      await transaction
        .request()
        .input("OpportunityId", sql.Int, OpportunityId)
        .input("SubCategoryId", sql.Int, subCategoryId)
        .query(`
          INSERT INTO opportunity_categories
          (OpportunityId, SubCategoryId)
          VALUES (@OpportunityId, @SubCategoryId)
        `);
    }

    await transaction.commit();

    // 3️⃣ RETURN FULL ROW (WITH IDS)
    const fullRow = await pool
      .request()
      .input("OpportunityId", sql.Int, OpportunityId)
      .query(getOpportunitySelectQuery());

    return NextResponse.json(fullRow.recordset[0]);
  } catch (error) {
    await transaction.rollback();
    console.error("POST opportunity error:", error);
    return NextResponse.json(
      { error: "Failed to create opportunity" },
      { status: 500 }
    );
  }
}

/* =====================================================
   PUT → UPDATE EXISTING OPPORTUNITY (EDIT)
===================================================== */
export async function PUT(
  req: NextRequest,
  { params }: { params: { leadID: string } }
) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    const {
      OpportunityId,
      serviceId,
      statusId,
      probabilityId,
      engagementId,
      technologies,
    } = await req.json();

    if (
      !OpportunityId ||
      !serviceId ||
      !statusId ||
      !probabilityId ||
      !engagementId ||
      !Array.isArray(technologies)
    ) {
      return NextResponse.json(
        { error: "Invalid request payload" },
        { status: 400 }
      );
    }

    await transaction.begin();

    // 1️⃣ UPDATE OPPORTUNITY
    await transaction
      .request()
      .input("OpportunityId", sql.Int, OpportunityId)
      .input("ServiceId", sql.Int, serviceId)
      .input("ProbabilityId", sql.Int, probabilityId)
      .input("EngagementId", sql.Int, engagementId)
      .input("StatusId", sql.Int, statusId)
      .query(`
        UPDATE Opportunities
        SET
          ServiceId = @ServiceId,
          ProbabilityId = @ProbabilityId,
          EngagementId = @EngagementId,
          Opportunity_StatusId = @StatusId,
          ModifiedOn = GETDATE()
        WHERE OpportunityId = @OpportunityId
      `);

    // 2️⃣ RESET TECHNOLOGIES
    await transaction
      .request()
      .input("OpportunityId", sql.Int, OpportunityId)
      .query(`
        DELETE FROM opportunity_categories
        WHERE OpportunityId = @OpportunityId
      `);

    // 3️⃣ INSERT UPDATED TECHNOLOGIES
    for (const subCategoryId of technologies) {
      await transaction
        .request()
        .input("OpportunityId", sql.Int, OpportunityId)
        .input("SubCategoryId", sql.Int, subCategoryId)
        .query(`
          INSERT INTO opportunity_categories
          (OpportunityId, SubCategoryId)
          VALUES (@OpportunityId, @SubCategoryId)
        `);
    }

    await transaction.commit();

    // 4️⃣ RETURN UPDATED ROW
    const updatedRow = await pool
      .request()
      .input("OpportunityId", sql.Int, OpportunityId)
      .query(getOpportunitySelectQuery());

    return NextResponse.json(updatedRow.recordset[0]);
  } catch (error) {
    await transaction.rollback();
    console.error("PUT opportunity error:", error);
    return NextResponse.json(
      { error: "Failed to update opportunity" },
      { status: 500 }
    );
  }
}

/* =====================================================
   GET → FETCH SINGLE OPPORTUNITY FOR EDIT
===================================================== */
export async function GET(
  req: NextRequest,
  { params }: { params: { leadID: string } }
) {
  const { searchParams } = new URL(req.url);
  const OpportunityId = Number(searchParams.get("OpportunityId"));

  if (!OpportunityId) {
    return NextResponse.json(
      { error: "OpportunityId required" },
      { status: 400 }
    );
  }

  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("OpportunityId", sql.Int, OpportunityId)
      .query(`
        SELECT
          o.OpportunityId,
          o.ServiceId,
          o.ProbabilityId,
          o.Opportunity_StatusId AS StatusId,
          o.EngagementId,

          s.ServiceName AS Service,
          p.ProbabilityRange AS Probability,
          os.Opportunities_StatusName AS Status,
          em.Engagement_ModelName AS EngagementModel,

          STRING_AGG(sc.SubCategoryName, ', ') AS Technology,
          STRING_AGG(CAST(sc.SubCategoryId AS VARCHAR), ',') AS TechnologyIds
        FROM Opportunities o
        LEFT JOIN Services s ON o.ServiceId = s.ServiceId
        LEFT JOIN Probability p ON o.ProbabilityId = p.ProbabilityId
        LEFT JOIN Opportunities_Status os ON o.Opportunity_StatusId = os.Opportunity_StatusId
        LEFT JOIN Engagement_Models em ON o.EngagementId = em.EngagementId
        LEFT JOIN opportunity_categories oc ON o.OpportunityId = oc.OpportunityId
        LEFT JOIN SubCategory sc ON oc.SubCategoryId = sc.SubCategoryId
        WHERE o.OpportunityId = @OpportunityId
        GROUP BY
          o.OpportunityId,
          o.ServiceId,
          o.ProbabilityId,
          o.Opportunity_StatusId,
          o.EngagementId,
          s.ServiceName,
          p.ProbabilityRange,
          os.Opportunities_StatusName,
          em.Engagement_ModelName
      `);

    const row = result.recordset[0];

    return NextResponse.json({
      ...row,
      TechnologyIds: row.TechnologyIds
        ? row.TechnologyIds.split(",").map(Number)
        : [],
    });
  } catch (err) {
    console.error("GET opportunity error:", err);
    return NextResponse.json(
      { error: "Failed to fetch opportunity" },
      { status: 500 }
    );
  }
}


/* =====================================================
   SHARED SELECT QUERY (WITH IDS + DISPLAY VALUES)
===================================================== */
function getOpportunitySelectQuery() {
  return `
    SELECT
      o.OpportunityId,

      -- IDS (FOR EDIT)
      o.ServiceId,
      o.ProbabilityId,
      o.Opportunity_StatusId AS StatusId,
      o.EngagementId,

      -- DISPLAY VALUES (FOR TABLE)
      s.ServiceName AS Service,
      p.ProbabilityRange AS Probability,
      os.Opportunities_StatusName AS Status,
      em.Engagement_ModelName AS EngagementModel,

      -- TECHNOLOGY
      STRING_AGG(sc.SubCategoryName, ', ') AS Technology,
      STRING_AGG(CAST(sc.SubCategoryId AS VARCHAR), ',') AS TechnologyIds,

      -- ✅ OPPORTUNITY CONTACT SUMMARY
      STRING_AGG(
        oc.FullName + ' (' + oc.MobilePhone + ')',
        CHAR(10)
      ) AS OpportunityContact,

      o.CreatedOn AS CreatedDate
    FROM Opportunities o
    LEFT JOIN Services s 
      ON o.ServiceId = s.ServiceId
    LEFT JOIN Probability p 
      ON o.ProbabilityId = p.ProbabilityId
    LEFT JOIN Opportunities_Status os 
      ON o.Opportunity_StatusId = os.Opportunity_StatusId
    LEFT JOIN Engagement_Models em 
      ON o.EngagementId = em.EngagementId
    LEFT JOIN opportunity_categories ocg 
      ON o.OpportunityId = ocg.OpportunityId
    LEFT JOIN SubCategory sc 
      ON ocg.SubCategoryId = sc.SubCategoryId

    -- ✅ ADD THIS JOIN
    LEFT JOIN OpportunityContacts oc
      ON o.OpportunityId = oc.OpportunityId

    WHERE o.OpportunityId = @OpportunityId

    GROUP BY
      o.OpportunityId,
      o.ServiceId,
      o.ProbabilityId,
      o.Opportunity_StatusId,
      o.EngagementId,
      s.ServiceName,
      p.ProbabilityRange,
      os.Opportunities_StatusName,
      em.Engagement_ModelName,
      o.CreatedOn
  `;
}

