import { NextResponse } from "next/server";
import { getPool } from "../../../../lib/db";

/* =====================================================
   GET → Fetch Leads / Prospects / Accounts
   (Filtering happens in frontend based on AccountTypeId)
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
      LEFT JOIN AccountTypes at
        ON l.AccountTypeId = at.AccountTypeId
      LEFT JOIN LeadStatuses ls
        ON l.StatusId = ls.StatusId
      LEFT JOIN LeadContacts lc
        ON lc.LeadId = l.LeadId
      LEFT JOIN ContactRoles cr
        ON lc.ContactRoleId = cr.RoleId
      LEFT JOIN dbo.Users u
        ON l.OwnerId = u.UserId
    `);

    const rows = result.recordset;
    const grouped: any = {};

    rows.forEach((row) => {
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
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}

/* =====================================================
   POST → Convert
   Lead → Prospect
   Prospect → Account
   Account → MasterAccount
===================================================== */
export async function POST(req: Request) {
  try {
    const { leadId, targetType } = await req.json();
    const pool = await getPool();

    if (!leadId || !targetType) {
      return NextResponse.json(
        { error: "leadId and targetType are required" },
        { status: 400 }
      );
    }

    /* 1️⃣ Get AccountTypeId of target */
    const typeResult = await pool.request()
      .input("Name", targetType)
      .query(`
        SELECT AccountTypeId 
        FROM AccountTypes
        WHERE Name = @Name
      `);

    if (!typeResult.recordset.length) {
      return NextResponse.json(
        { error: "Invalid AccountType" },
        { status: 400 }
      );
    }

    const targetAccountTypeId =
      typeResult.recordset[0].AccountTypeId;

    /* 2️⃣ Update Leads table */
    await pool.request()
      .input("LeadId", leadId)
      .input("AccountTypeId", targetAccountTypeId)
      .query(`
        UPDATE Leads
        SET AccountTypeId = @AccountTypeId
        WHERE LeadId = @LeadId
      `);

    /* 3️⃣ Optional: Update status */
    await pool.request()
      .input("LeadId", leadId)
      .query(`
        UPDATE Leads
        SET StatusId = (
          SELECT StatusId 
          FROM LeadStatuses 
          WHERE StatusName = 'Converted'
        )
        WHERE LeadId = @LeadId
      `);

    return NextResponse.json({
      success: true,
      message: `Converted to ${targetType} successfully`
    });

  } catch (err) {
    console.error("Conversion error:", err);
    return NextResponse.json(
      { error: "Conversion failed" },
      { status: 500 }
    );
  }
}
