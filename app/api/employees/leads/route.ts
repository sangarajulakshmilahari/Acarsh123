import { NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";

/* =====================================================
   GET → Fetch Leads / Prospects / Accounts
===================================================== */
export async function GET() {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT 
        l.LeadId,
        l.CompanyName,
        l.CompanyLocation,
        l.LeadSource,
        l.LeadDate,
        l.LeadNotes,
        l.AccountTypeId,
        at.Name AS AccountTypeName,
        ls.StatusName,
        lc.ContactName,
        lc.ContactTitle,
        lc.ContactEmail,
        lc.ContactPhone,
        cr.Role AS ContactRoleName,
        u.UserName AS OwnerName
      FROM Leads l
      LEFT JOIN AccountTypes at ON l.AccountTypeId = at.AccountTypeId
      LEFT JOIN LeadStatuses ls ON l.StatusId = ls.StatusId
      LEFT JOIN LeadContacts lc ON lc.LeadId = l.LeadId
      LEFT JOIN ContactRoles cr ON lc.ContactRoleId = cr.RoleId
      LEFT JOIN dbo.Users u ON l.OwnerId = u.UserId
    `);

    const grouped: any = {};

    result.recordset.forEach((row: any) => {
      if (!grouped[row.LeadId]) {
        grouped[row.LeadId] = {
          LeadId: row.LeadId,
          CompanyName: row.CompanyName,
          CompanyLocation: row.CompanyLocation,
          LeadSource: row.LeadSource,
          LeadDate: row.LeadDate,
          LeadNotes: row.LeadNotes,
          AccountTypeId: row.AccountTypeId,
          AccountTypeName: row.AccountTypeName,
          StatusName: row.StatusName,
          OwnerName: row.OwnerName,
          Contacts: []
        };
      }

      if (row.ContactName || row.ContactEmail || row.ContactPhone) {
        grouped[row.LeadId].Contacts.push({
          ContactName: row.ContactName,
          ContactTitle: row.ContactTitle,
          ContactEmail: row.ContactEmail,
          ContactPhone: row.ContactPhone,
          ContactRoleName: row.ContactRoleName
        });
      }
    });

    return NextResponse.json(Object.values(grouped));
  } catch (err) {
    console.error("Error fetching leads:", err);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

/* =====================================================
   POST → CREATE or CONVERT
===================================================== */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pool = await getPool();

    /* =======================
       CONVERT FLOW
    ======================= */
    if (body.action === "convert") {
      const { leadId, targetType } = body;

      if (!leadId || !targetType) {
        return NextResponse.json(
          { error: "leadId and targetType are required" },
          { status: 400 }
        );
      }

      const typeResult = await pool.request()
        .input("Name", targetType)
        .query(`
          SELECT AccountTypeId 
          FROM AccountTypes 
          WHERE Name = @Name
        `);

      if (!typeResult.recordset.length) {
        return NextResponse.json({ error: "Invalid AccountType" }, { status: 400 });
      }

      const AccountTypeId = typeResult.recordset[0].AccountTypeId;

      await pool.request()
        .input("LeadId", leadId)
        .input("AccountTypeId", AccountTypeId)
        .query(`
          UPDATE Leads
          SET AccountTypeId = @AccountTypeId,
              StatusId = (SELECT StatusId FROM LeadStatuses WHERE StatusName = 'Converted')
          WHERE LeadId = @LeadId
        `);

      return NextResponse.json({
        success: true,
        message: `Converted to ${targetType} successfully`
      });
    }

    /* =======================
       CREATE LEAD FLOW
    ======================= */
    if (body.action === "create") {
      const {
        CompanyName,
        CompanyLocation,
        LeadSource,
        LeadDate,
        StatusName,
        OwnerName,
        Notes,
        ContactName,
        ContactEmail,
        ContactPhone,
        ContactTitle,
        ContactRoleName,
        AddReminder
      } = body;

      const statusResult = await pool.request()
        .input("StatusName", StatusName)
        .query(`SELECT StatusId FROM LeadStatuses WHERE StatusName = @StatusName`);

      const StatusId = statusResult.recordset[0]?.StatusId || 1;

      const ownerResult = await pool.request()
        .input("OwnerName", OwnerName)
        .query(`SELECT UserId FROM dbo.Users WHERE UserName = @OwnerName`);

      const OwnerId = ownerResult.recordset[0]?.UserId || null;

      const leadInsert = await pool.request()
        .input("CompanyName", CompanyName)
        .input("CompanyLocation", CompanyLocation)
        .input("LeadSource", LeadSource)
        .input("LeadDate", LeadDate)
        .input("LeadNotes", Notes)
        .input("StatusId", StatusId)
        .input("OwnerId", OwnerId)
        .query(`
          INSERT INTO Leads
          (CompanyName, CompanyLocation, LeadSource, LeadDate, LeadNotes, StatusId, OwnerId)
          OUTPUT INSERTED.LeadId
          VALUES
          (@CompanyName, @CompanyLocation, @LeadSource, @LeadDate, @LeadNotes, @StatusId, @OwnerId)
        `);

      const LeadId = leadInsert.recordset[0].LeadId;

      if (ContactName || ContactEmail || ContactPhone) {
        if (!ContactRoleName) {
          return NextResponse.json(
            { error: "Contact role is required" },
            { status: 400 }
          );
        }

        const roleResult = await pool.request()
          .input("Role", ContactRoleName)
          .query(`SELECT RoleId FROM ContactRoles WHERE Role = @Role`);

        const ContactRoleId = roleResult.recordset[0]?.RoleId;

        await pool.request()
          .input("LeadId", LeadId)
          .input("ContactName", ContactName)
          .input("ContactEmail", ContactEmail)
          .input("ContactPhone", ContactPhone)
          .input("ContactTitle", ContactTitle)
          .input("ContactRoleId", ContactRoleId)
          .query(`
            INSERT INTO LeadContacts
            (LeadId, ContactName, ContactEmail, ContactPhone, ContactTitle, ContactRoleId)
            VALUES
            (@LeadId, @ContactName, @ContactEmail, @ContactPhone, @ContactTitle, @ContactRoleId)
          `);
      }

      if (AddReminder) {
        await pool.request()
          .input("LeadId", LeadId)
          .query(`INSERT INTO Reminders (LeadId, ReminderDate) VALUES (@LeadId, GETDATE())`);
      }

      return NextResponse.json(
        { message: "Lead created successfully", LeadId },
        { status: 200 }
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err: any) {
    console.error("POST error:", err);
    return NextResponse.json(
      { error: "Operation failed", details: err.message },
      { status: 500 }
    );
  }
}

/* =====================================================
   DELETE → Delete Lead
===================================================== */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get("leadId");

    if (!leadId) {
      return NextResponse.json(
        { error: "LeadId is required" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    await pool.request().input("LeadId", leadId).query(`
      DELETE FROM LeadContacts WHERE LeadId = @LeadId;
      DELETE FROM Leads WHERE LeadId = @LeadId;
    `);

    return NextResponse.json({ message: "Lead deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
