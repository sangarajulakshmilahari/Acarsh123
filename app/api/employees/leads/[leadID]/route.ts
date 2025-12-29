import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { leadID: string } }
) {
  try {
    const leadId = Number(params.leadID);

    if (isNaN(leadId)) {
      return NextResponse.json({ error: "Invalid LeadId" }, { status: 400 });
    }

    const pool = await getPool();

    /* =====================================================
       1️⃣ Lead Basic Details
    ===================================================== */
    const leadResult = await pool.request().input("LeadId", leadId).query(`
        SELECT
          l.LeadId,
          l.CompanyName,
          l.CompanyLocation,
          l.LeadSource,
          CONVERT(VARCHAR, l.LeadDate, 23) AS LeadDate,
          l.LeadNotes,
          ls.StatusName,
          u.UserName AS OwnerName
        FROM Leads l
        LEFT JOIN LeadStatuses ls ON l.StatusId = ls.StatusId
        LEFT JOIN dbo.Users u ON l.OwnerId = u.UserId
        WHERE l.LeadId = @LeadId
      `);

    if (!leadResult.recordset.length) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    /* =====================================================
       2️⃣ Contacts
    ===================================================== */
    const contactsResult = await pool.request().input("LeadId", leadId).query(`
        SELECT
          lc.ContactName,
          lc.ContactTitle,
          lc.ContactEmail,
          cr.Role AS ContactRoleName
        FROM LeadContacts lc
        LEFT JOIN ContactRoles cr ON lc.ContactRoleId = cr.RoleId
        WHERE lc.LeadId = @LeadId
      `);

    /* =====================================================
       3️⃣ Activities
    ===================================================== */
    const activitiesResult = await pool.request().input("LeadId", leadId)
      .query(`
        SELECT
          la.ActivityId,
          CONVERT(VARCHAR, la.ActivityDate, 23) AS ActivityDate,
          la.ActivityType AS Mode,
          la.Notes,
          ls.StatusName AS Status
        FROM LeadActivities la
        LEFT JOIN LeadStatuses ls ON la.StatusId = ls.StatusId
        WHERE la.LeadId = @LeadId
        ORDER BY la.ActivityDate DESC
      `);

    /* =====================================================
       4️⃣ Reminders
    ===================================================== */
    const remindersResult = await pool.request().input("LeadId", leadId).query(`
        SELECT
          lr.ReminderId,
          CONVERT(VARCHAR, lr.ReminderDate, 23) AS ReminderDate,
          lr.ReminderNote AS Notes,
          lr.Status,
          lr.NotificationChannels AS Notification
        FROM LeadReminders lr
        WHERE lr.LeadId = @LeadId
        ORDER BY lr.ReminderDate DESC
      `);

    
    /* =====================================================
   5️⃣ Opportunities (WITH CONTACT SUMMARY)
===================================================== */
const opportunitiesResult = await pool
  .request()
  .input("LeadId", leadId)
  .query(`
    SELECT
    o.OpportunityId,

    CONVERT(VARCHAR, o.CreatedOn, 23) AS CreatedDate,

    s.ServiceName AS Service,

    pm.ProbabilityRange AS Probability,

    os.Opportunities_StatusName AS Status,

    em.Engagement_ModelName AS EngagementModel,

    STRING_AGG(sc.SubCategoryName, ', ') AS Technology,

    /* OPPORTUNITY CONTACT SUMMARY */
    CASE
    WHEN COUNT(ocn.OpportunityContactId) = 0 THEN NULL
    ELSE
        MAX(
            'Full Name: ' + ocn.FullName + CHAR(10) +
            'Mobile: '    + ocn.MobilePhone + CHAR(10) +
            'Email: '     + ocn.WorkEmail
        )
END AS OpportunityContact


FROM Opportunities o

LEFT JOIN Services s
    ON o.ServiceId = s.ServiceId

LEFT JOIN Opportunities_Status os
    ON o.Opportunity_StatusId = os.Opportunity_StatusId

LEFT JOIN Probability pm
    ON o.ProbabilityId = pm.ProbabilityId

LEFT JOIN Engagement_Models em
    ON o.EngagementId = em.EngagementId

LEFT JOIN opportunity_categories oc
    ON o.OpportunityId = oc.OpportunityId

LEFT JOIN SubCategory sc
    ON oc.SubCategoryId = sc.SubCategoryId

LEFT JOIN OpportunityContacts ocn
    ON o.OpportunityId = ocn.OpportunityId
    AND ocn.IsDeleted = 0

WHERE o.LeadId = @LeadId
  AND o.IsDeleted = 0

GROUP BY
    o.OpportunityId,
    o.CreatedOn,
    s.ServiceName,
    pm.ProbabilityRange,
    os.Opportunities_StatusName,
    em.Engagement_ModelName

ORDER BY o.CreatedOn DESC;

  `);

    /* =====================================================
       6️⃣ FINAL RESPONSE (UI READY)
    ===================================================== */
    return NextResponse.json({
      ...leadResult.recordset[0],
      Contacts: contactsResult.recordset,
      Activities: activitiesResult.recordset,
      Reminders: remindersResult.recordset,
      Opportunities: opportunitiesResult.recordset,
    });
  } catch (error) {
    console.error("Get lead error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { leadID: string } }
) {
  try {
    const leadId = Number(params.leadID);

    if (isNaN(leadId)) {
      return NextResponse.json({ error: "Invalid LeadId" }, { status: 400 });
    }

    const body = await req.json();
    const {
      CompanyName,
      CompanyLocation,
      LeadSource,
      LeadDate,
      OwnerName,
      StatusName,
      LeadNotes,
      Contacts,
    } = body;

    const pool = await getPool();
    const transaction = new (await import("mssql")).Transaction(pool);

    await transaction.begin();

    try {
      /* Get StatusId from StatusName */
      let statusId = null;
      if (StatusName) {
        const statusResult = await transaction
          .request()
          .input("StatusName", (await import("mssql")).NVarChar, StatusName)
          .query(`
            SELECT StatusId FROM LeadStatuses WHERE StatusName = @StatusName
          `);
        if (statusResult.recordset.length > 0) {
          statusId = statusResult.recordset[0].StatusId;
        }
      }

      /* Get OwnerId from OwnerName */
      let ownerId = null;
      if (OwnerName) {
        const ownerResult = await transaction
          .request()
          .input("UserName", (await import("mssql")).NVarChar, OwnerName)
          .query(`
            SELECT UserId FROM dbo.Users WHERE UserName = @UserName
          `);
        if (ownerResult.recordset.length > 0) {
          ownerId = ownerResult.recordset[0].UserId;
        }
      }

      /* Update Lead */
      await transaction
        .request()
        .input("LeadId", (await import("mssql")).Int, leadId)
        .input(
          "CompanyName",
          (
            await import("mssql")
          ).NVarChar,
          CompanyName || null
        )
        .input(
          "CompanyLocation",
          (
            await import("mssql")
          ).NVarChar,
          CompanyLocation || null
        )
        .input(
          "LeadSource",
          (
            await import("mssql")
          ).NVarChar,
          LeadSource || null
        )
        .input("LeadDate", (await import("mssql")).DateTime, LeadDate || null)
        .input("LeadNotes", (await import("mssql")).NVarChar, LeadNotes || null)
        .input("StatusId", (await import("mssql")).Int, statusId || null)
        .input("OwnerId", (await import("mssql")).Int, ownerId || null).query(`
          UPDATE Leads
          SET CompanyName = @CompanyName,
              CompanyLocation = @CompanyLocation,
              LeadSource = @LeadSource,
              LeadDate = @LeadDate,
              LeadNotes = @LeadNotes,
              StatusId = @StatusId,
              OwnerId = @OwnerId
          WHERE LeadId = @LeadId
        `);

      /* Delete and re-insert contacts */
      if (Array.isArray(Contacts) && Contacts.length > 0) {
        await transaction
          .request()
          .input("LeadId", (await import("mssql")).Int, leadId)
          .query(`DELETE FROM LeadContacts WHERE LeadId = @LeadId`);

        for (const contact of Contacts) {
          /* Get ContactRoleId from role name, default to "Decision Maker" */
          let contactRoleId = null;
          if (contact.ContactRoleName) {
            const roleResult = await transaction
              .request()
              .input(
                "RoleName",
                (
                  await import("mssql")
                ).NVarChar,
                contact.ContactRoleName
              ).query(`
                SELECT RoleId FROM ContactRoles WHERE Role = @RoleName
              `);
            if (roleResult.recordset.length > 0) {
              contactRoleId = roleResult.recordset[0].RoleId;
            }
          }

          /* If role not found, get default "Decision Maker" role */
          if (!contactRoleId) {
            const defaultRoleResult = await transaction.request().query(`
                SELECT TOP 1 RoleId FROM ContactRoles WHERE Role = 'Decision Maker'
              `);
            if (defaultRoleResult.recordset.length > 0) {
              contactRoleId = defaultRoleResult.recordset[0].RoleId;
            } else {
              /* Last resort: get any available role */
              const anyRoleResult = await transaction.request().query(`
                  SELECT TOP 1 RoleId FROM ContactRoles
                `);
              if (anyRoleResult.recordset.length > 0) {
                contactRoleId = anyRoleResult.recordset[0].RoleId;
              }
            }
          }

          if (!contactRoleId) {
            throw new Error("No ContactRole found in database");
          }

          await transaction
            .request()
            .input("LeadId", (await import("mssql")).Int, leadId)
            .input(
              "ContactName",
              (
                await import("mssql")
              ).NVarChar,
              contact.ContactName || null
            )
            .input(
              "ContactEmail",
              (
                await import("mssql")
              ).NVarChar,
              contact.ContactEmail || null
            )
            .input(
              "ContactTitle",
              (
                await import("mssql")
              ).NVarChar,
              contact.ContactTitle || null
            )
            .input(
              "ContactPhone",
              (
                await import("mssql")
              ).NVarChar,
              contact.ContactPhone || null
            )
            .input("ContactRoleId", (await import("mssql")).Int, contactRoleId)
            .query(`
              INSERT INTO LeadContacts (LeadId, ContactName, ContactEmail, ContactTitle, ContactPhone, ContactRoleId)
              VALUES (@LeadId, @ContactName, @ContactEmail, @ContactTitle, @ContactPhone, @ContactRoleId)
            `);
        }
      }

      await transaction.commit();

      return NextResponse.json({
        success: true,
        LeadId: leadId,
        message: "Lead updated successfully",
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error("Update lead error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { leadID: string } }
) {
  try {
    const leadId = Number(params.leadID);

    if (isNaN(leadId)) {
      return NextResponse.json({ error: "Invalid LeadId" }, { status: 400 });
    }

    const pool = await getPool();
    const transaction = new (await import("mssql")).Transaction(pool);

    await transaction.begin();

    try {
      /* Delete all related data */
      await transaction
        .request()
        .input("LeadId", (await import("mssql")).Int, leadId)
        .query(`DELETE FROM LeadContacts WHERE LeadId = @LeadId`);

      await transaction
        .request()
        .input("LeadId", (await import("mssql")).Int, leadId)
        .query(`DELETE FROM LeadActivities WHERE LeadId = @LeadId`);

      await transaction
        .request()
        .input("LeadId", (await import("mssql")).Int, leadId)
        .query(`DELETE FROM LeadReminders WHERE LeadId = @LeadId`);

      await transaction
        .request()
        .input("LeadId", (await import("mssql")).Int, leadId)
        .query(`DELETE FROM Opportunities WHERE LeadId = @LeadId`);

      /* Delete the lead itself */
      await transaction
        .request()
        .input("LeadId", (await import("mssql")).Int, leadId)
        .query(`DELETE FROM Leads WHERE LeadId = @LeadId`);

      await transaction.commit();

      return NextResponse.json({
        success: true,
        message: "Lead deleted successfully",
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error("Delete lead error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete lead" },
      { status: 500 }
    );
  }
}
