import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

/* =========================
   GET — FETCH CONTACTS
========================= */
export async function GET(
  req: Request,
  { params }: { params: { OpportunityId: string } }
) {
  try {
    const OpportunityId = Number(params.OpportunityId);

    if (isNaN(OpportunityId)) {
      return NextResponse.json(
        { error: "Invalid OpportunityId" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    const result = await pool.request().input("OpportunityId", OpportunityId)
      .query(`
        SELECT
  OpportunityContactId,
  OpportunityId,

  FullName,
  FirstName,
  LastName,
  PreferredName,
  JobTitle,
  Department,
  SeniorityLevel,
  Gender,
  DateOfBirth,
  ProfilePictureUrl,

  CompanyName,
  Division,
  OfficeLocation,
  HeadquartersLocation,
  EmployeeSize,
  Industry,
  CompanyWebsite,
  CompanyLinkedInPage,

  WorkEmail,
  PersonalEmail,
  DirectPhone,
  MobilePhone,
  OfficePhone,
  LinkedInProfileUrl

FROM OpportunityContacts
WHERE OpportunityId = @OpportunityId
  AND IsDeleted = 0
ORDER BY OpportunityContactId;

      `);

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Get opportunity contacts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunity contacts" },
      { status: 500 }
    );
  }
}

/* =========================
   POST — SAVE CONTACTS
========================= */
export async function POST(
  req: Request,
  { params }: { params: { OpportunityId: string } } // ⚠️ lowercase
) {
  try {
    const OpportunityId = Number(params.OpportunityId);

    console.log("🔥 CONTACT ROUTE HIT");
    console.log("OpportunityId param:", OpportunityId);

    if (!OpportunityId) {
      return NextResponse.json(
        { error: "Invalid OpportunityId" },
        { status: 400 }
      );
    }

    const contacts = await req.json();

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts provided" },
        { status: 400 }
      );
    }

    const pool = await getPool();

    for (const c of contacts) {
      await pool
        .request()
        .input("OpportunityId", OpportunityId)

        .input("FullName", c.FullName || null)
        .input("FirstName", c.FirstName || null)
        .input("LastName", c.LastName || null)
        .input("PreferredName", c.PreferredName || null)

        .input("JobTitle", c.JobTitle || null)
        .input("Department", c.Department || null)
        .input("SeniorityLevel", c.SeniorityLevel || null)
        .input("Gender", c.Gender || null)
        .input("DateOfBirth", c.DateOfBirth || null)

        .input("ProfilePictureUrl", c.ProfilePictureUrl || null)

        .input("CompanyName", c.CompanyName || null)
        .input("Division", c.Division || null)
        .input("OfficeLocation", c.OfficeLocation || null)
        .input("HeadquartersLocation", c.HeadquartersLocation || null)
        .input("EmployeeSize", c.EmployeeSize || null)
        .input("Industry", c.Industry || null)
        .input("CompanyWebsite", c.CompanyWebsite || null)
        .input("CompanyLinkedInPage", c.CompanyLinkedInPage || null)

        .input("WorkEmail", c.WorkEmail || null)
        .input("PersonalEmail", c.PersonalEmail || null)
        .input("DirectPhone", c.DirectPhone || null)
        .input("MobilePhone", c.MobilePhone || null)
        .input("OfficePhone", c.OfficePhone || null)

        .input("LinkedInProfileUrl", c.LinkedInProfileUrl || null).query(`
      INSERT INTO OpportunityContacts (
        OpportunityId,
        FullName,
        FirstName,
        LastName,
        PreferredName,
        JobTitle,
        Department,
        SeniorityLevel,
        Gender,
        DateOfBirth,
        ProfilePictureUrl,
        CompanyName,
        Division,
        OfficeLocation,
        HeadquartersLocation,
        EmployeeSize,
        Industry,
        CompanyWebsite,
        CompanyLinkedInPage,
        WorkEmail,
        PersonalEmail,
        DirectPhone,
        MobilePhone,
        OfficePhone,
        LinkedInProfileUrl
      )
      VALUES (
        @OpportunityId,
        @FullName,
        @FirstName,
        @LastName,
        @PreferredName,
        @JobTitle,
        @Department,
        @SeniorityLevel,
        @Gender,
        @DateOfBirth,
        @ProfilePictureUrl,
        @CompanyName,
        @Division,
        @OfficeLocation,
        @HeadquartersLocation,
        @EmployeeSize,
        @Industry,
        @CompanyWebsite,
        @CompanyLinkedInPage,
        @WorkEmail,
        @PersonalEmail,
        @DirectPhone,
        @MobilePhone,
        @OfficePhone,
        @LinkedInProfileUrl
      )
    `);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Save Opportunity Contacts Error:", err);
    return NextResponse.json(
      { error: "Failed to save opportunity contacts" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { opportunityId: string } }
) {
  const contact = await req.json();
  const pool = await getPool();

  if (!contact.OpportunityContactId) {
    return NextResponse.json(
      { error: "OpportunityContactId is required for update" },
      { status: 400 }
    );
  }

  await pool
    .request()
    .input("OpportunityContactId", contact.OpportunityContactId)

    .input("FullName", contact.FullName || null)
    .input("FirstName", contact.FirstName || null)
    .input("LastName", contact.LastName || null)
    .input("PreferredName", contact.PreferredName || null)

    .input("JobTitle", contact.JobTitle || null)
    .input("Department", contact.Department || null)
    .input("SeniorityLevel", contact.SeniorityLevel || null)
    .input("Gender", contact.Gender || null)
    .input("DateOfBirth", contact.DateOfBirth || null)

    .input("ProfilePictureUrl", contact.ProfilePictureUrl || null)

    .input("CompanyName", contact.CompanyName || null)
    .input("Division", contact.Division || null)
    .input("OfficeLocation", contact.OfficeLocation || null)
    .input("HeadquartersLocation", contact.HeadquartersLocation || null)
    .input("EmployeeSize", contact.EmployeeSize || null)
    .input("Industry", contact.Industry || null)
    .input("CompanyWebsite", contact.CompanyWebsite || null)
    .input("CompanyLinkedInPage", contact.CompanyLinkedInPage || null)

    .input("WorkEmail", contact.WorkEmail || null)
    .input("PersonalEmail", contact.PersonalEmail || null)
    .input("DirectPhone", contact.DirectPhone || null)
    .input("MobilePhone", contact.MobilePhone || null)
    .input("OfficePhone", contact.OfficePhone || null)

    .input("LinkedInProfileUrl", contact.LinkedInProfileUrl || null).query(`
  UPDATE OpportunityContacts
  SET
    FullName = COALESCE(@FullName, FullName),
    FirstName = COALESCE(@FirstName, FirstName),
    LastName = COALESCE(@LastName, LastName),
    PreferredName = COALESCE(@PreferredName, PreferredName),

    JobTitle = COALESCE(@JobTitle, JobTitle),
    Department = COALESCE(@Department, Department),
    SeniorityLevel = COALESCE(@SeniorityLevel, SeniorityLevel),
    Gender = COALESCE(@Gender, Gender),
    DateOfBirth = COALESCE(@DateOfBirth, DateOfBirth),

    ProfilePictureUrl = COALESCE(@ProfilePictureUrl, ProfilePictureUrl),

    CompanyName = COALESCE(@CompanyName, CompanyName),
    Division = COALESCE(@Division, Division),
    OfficeLocation = COALESCE(@OfficeLocation, OfficeLocation),
    HeadquartersLocation = COALESCE(@HeadquartersLocation, HeadquartersLocation),
    EmployeeSize = COALESCE(@EmployeeSize, EmployeeSize),
    Industry = COALESCE(@Industry, Industry),
    CompanyWebsite = COALESCE(@CompanyWebsite, CompanyWebsite),
    CompanyLinkedInPage = COALESCE(@CompanyLinkedInPage, CompanyLinkedInPage),

    WorkEmail = COALESCE(@WorkEmail, WorkEmail),
    PersonalEmail = COALESCE(@PersonalEmail, PersonalEmail),
    DirectPhone = COALESCE(@DirectPhone, DirectPhone),
    MobilePhone = COALESCE(@MobilePhone, MobilePhone),
    OfficePhone = COALESCE(@OfficePhone, OfficePhone),

    LinkedInProfileUrl = COALESCE(@LinkedInProfileUrl, LinkedInProfileUrl)
  WHERE OpportunityContactId = @OpportunityContactId
`);

  return NextResponse.json({ success: true });
}
