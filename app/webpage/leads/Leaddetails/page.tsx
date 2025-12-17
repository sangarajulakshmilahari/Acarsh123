"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PopupModals,{PopupType} from "../../components/modals/PopupModals";

type Contact = {
  ContactName?: string;
  ContactEmail?: string;
  ContactTitle?: string;
  ContactRoleName?: string;
};

type Activity = {
  ActivityDate: string;
  Mode: string;
  Notes?: string;
  Status?: string;
};

type Reminder = {
  ReminderDate: string;
  Notes?: string;
  Status?: string;
  Notification?: string;
};

type Opportunity = {
  CreatedDate: string;
  Service: string;
  Probability: string;
  Status: string;
  EngagementModel: string;
};

type Lead = {
  LeadId?: number | string;
  CompanyName?: string;
  CompanyLocation?: string;
  OwnerName?: string;
  StatusName?: string;
  LeadNotes?: string | null;
  LeadDate?: string | number | Date;
  LeadSource?: string;
  Contacts?: Contact[];
  Activities?: Activity[];
  Reminders?: Reminder[];
  Opportunities?: Opportunity[];
};

// NEW: origin type & prop
type OriginType = "leads" | "Prospect" | "Account";

type LeadDetailsProps = {
  leadId?: number | string | null;
  onBack?: () => void;
  onEdit?: (leadId?: number | string | null) => void;
  origin?: OriginType; // <-- added
};

export default function LeadDetailsPage({
  leadId,
  onBack,
  onEdit,
  origin = "leads", // <-- default origin
}: LeadDetailsProps): JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const [showAddActivity, setShowAddActivity] = useState(false);
  // const [showAddReminder, setShowAddReminder] = useState(false);
  // const [showAddOpportunity, setShowAddOpportunity] = useState(false);
  const [activePopup, setActivePopup] = useState<PopupType>(null);


  // Take ID from props first, else from URL (?leadId=...)
  const leadIdFromQuery = searchParams.get("leadId");
  const effectiveLeadId = leadId ?? leadIdFromQuery;

  // NEW: helpers to pick label / back text
  const getConvertLabel = () => {
    if (origin === "leads") return "Convert to Prospect";
    if (origin === "Prospect") return "Convert to Account";
    if (origin === "Account") return "Convert to Master Account";
    return "Convert";
  };

  const getBackLabel = () => {
    if (origin === "leads") return "← Back to Leads";
    if (origin === "Prospect") return "← Back to Prospects";
    if (origin === "Account") return "← Back to Accounts";
    return "← Back";
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    } else {
      // route back based on origin
      if (origin === "Prospect") {
        router.push("/webpage?tab=prospect");
      } else if (origin === "Account") {
        router.push("/webpage?tab=account");
      } else {
        router.push("/webpage?tab=leads");
      }
    }
  };
  const handleEdit = () => {
  if (onEdit) {
    onEdit(lead?.LeadId ?? effectiveLeadId ?? null);
    return;
  } else {
    // route edit based on origin and include the leadId in query
    const id = encodeURIComponent(String(effectiveLeadId));
    const typeParam = origin ? `&type=${encodeURIComponent(origin)}` : "";
    router.push(`/webpage/leads/Editlead?leadId=${id}${typeParam}`);
  }
};

  useEffect(() => {
    if (!effectiveLeadId) {
      setLead(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const trySingle = await fetch(
          `/api/employees/leads/${encodeURIComponent(effectiveLeadId)}`
        );
        if (trySingle.ok) {
          const data = await trySingle.json();
          if (!cancelled) setLead(data);
          return;
        }
        const res = await fetch("/api/employees/leads");
        if (!res.ok) {
          throw new Error(`Failed to fetch employees (${res.status})`);
        }

        const all = await res.json();

        const array = Array.isArray(all)
          ? all
          : all?.data && Array.isArray(all.data)
            ? all.data
            : [];

        const found = array.find(
          (x: any) => String(x.LeadId) === String(effectiveLeadId)
        );

        if (!cancelled) {
          if (found) {
            setLead(found);
          } else {
            setError("Lead not found");
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || "Failed to load lead");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveLeadId, origin]);

  // ---------- EARLY STATES ----------

  if (!effectiveLeadId) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={handleBack} style={backBtnStyle}>
          {getBackLabel()}
        </button>
        <p style={{ marginTop: 12 }}>No lead selected.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={handleBack} style={backBtnStyle}>
          {getBackLabel()}
        </button>
        <p style={{ marginTop: 12 }}>Loading lead {effectiveLeadId}…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={handleBack} style={backBtnStyle}>
          {getBackLabel()}
        </button>
        <p style={{ marginTop: 12, color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  if (!lead) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={handleBack} style={backBtnStyle}>
          {getBackLabel()}
        </button>
        <p style={{ marginTop: 12 }}>No data found for this lead.</p>
      </div>
    );
  }

  // ---------- STYLES ----------

  const container: React.CSSProperties = {
    padding: 15,
    maxWidth: 1100,
    margin: "0 auto",
    fontFamily:
      "'Segoe UI', Roboto, system-ui, -apple-system, 'Helvetica Neue', Arial",
  };

  const headerRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  };

  const topActions: React.CSSProperties = {
    display: "flex",
    gap: 8,
    alignItems: "center",
  };

  const backBtn: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 6,
    border: "none",
    background: "#3a77e3",
    cursor: "pointer",
  };

  const primaryBtn: React.CSSProperties = {
    padding: "8px 14px",
    borderRadius: 6,
    border: "none",
    background: "#3a77e3",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  };

  const secondaryBtn: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #3a77e3",
    background: "#fff",
    color: "#3a77e3",
    cursor: "pointer",
    fontWeight: 600,
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    gap: 20,
    marginBottom: 16,
    alignItems: "stretch",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 8,
    padding: 18,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    flex: 1,
    border: "1px solid #e6e6e6",
  };

  const rightCardStyle: React.CSSProperties = {
    ...cardStyle,
    maxWidth: 380,
  };
  const contactCardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 8,
    padding: "12px 14px",
    border: "1px solid #eef1f4",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    marginBottom: 12,
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    borderLeft: "4px solid #1e90ff",
  };

  const contactAccentStyle: React.CSSProperties = {
    paddingLeft: 10,
  };

  const contactRowLabel: React.CSSProperties = {
    fontWeight: 700,
    minWidth: 60,
    fontSize: 13,
    color: "#111",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 10,
    color: "#333",
    // borderBottom: "1px solid #e6e6e6",
    // paddingBottom: 8,
  };

  const label: React.CSSProperties = {
    fontWeight: 700,
    color: "#444",
    width: 120,
    display: "inline-block",
    fontSize: 13,
  };

  const value: React.CSSProperties = {
    color: "#222",
  };

  const notesStyle: React.CSSProperties = {
    background: "#fff3cd",
    border: "1px solid #ffeeba",
    borderLeft: "6px solid #f1c040",
    padding: "10px 14px 10px 16px",
    borderRadius: 8,
    color: "#856404",
    marginBottom: 16,
  };

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "8px 12px",
    border: "1px solid rgba(148,148,148,0.4)",
    backgroundColor: "#252b36",
    color: "#ffffff",
    position: "sticky",
    top: 0,
    zIndex: 1,
    fontWeight: 600,
    fontSize: 12,
    textTransform: "uppercase",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: 14,
    borderBottom: "1px solid #e9ecef",
    verticalAlign: "middle",
  };

  const tableWrap: React.CSSProperties = {
    background: "#fff",
    borderRadius: 8,
    padding: 12,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e6e6e6",
    marginBottom: 16,
  };

  const fabStyle: React.CSSProperties = {
    position: "fixed",
    right: 28,
    bottom: 28,
    width: 56,
    height: 56,
    background: "#3a77e3",
    borderRadius: "50%",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 28,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
  };
  const addBtn = {
    backgroundColor: "#3a77e3",
    color: "white",
    width: 20,
    height: 20,
    borderRadius: 4,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    marginLeft: 6,
    cursor: "pointer",
    fontWeight: "semobold",
    border: "none",
    lineHeight: 0,
  };

  
  // ---------- MAIN RENDER ----------

  return (
    <div style={container}>
      <button onClick={handleBack} style={backBtn}>
        Back
      </button>
      <div style={headerRow}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <p style={{ color: "grey", fontWeight: 700, fontSize: 20 }}>
            Lead Details
          </p>
        </div>

        <div style={topActions}>
          <button
            onClick={() => alert(getConvertLabel())}
            style={secondaryBtn}
          >
            {getConvertLabel()}
          </button>

          <button onClick={handleEdit} style={primaryBtn}>
            Edit
          </button>
        </div>
      </div>

      <div style={rowStyle}>
        <div style={cardStyle}>
          <div style={{...sectionTitle,borderBottom: "1px solid #e6e6e6",paddingBottom: 8}}>Company Information</div>
          <div style={{ marginBottom: 8 }}>
            <span style={contactRowLabel}>Company: </span>
            <span style={value}>{lead.CompanyName}</span>
          </div>

          <div style={{ marginBottom: 8 }}>
            <span style={contactRowLabel}>Location: </span>
            <span style={value}>{lead.CompanyLocation}</span>
          </div>

          <div style={{ marginBottom: 8 }}>
            <span style={contactRowLabel}>Owner: </span>
            <span style={value}>{lead.OwnerName}</span>
          </div>

          <div style={{ marginBottom: 8 }}>
            <span style={contactRowLabel}>Source: </span>
            <span style={value}>
              <span style={value}>{lead.LeadSource}</span>
            </span>
          </div>

          <div style={{ marginBottom: 8 }}>
            <span style={contactRowLabel}>Date: </span>
            <span style={value}>
              {lead.LeadDate
                ? new Date(String(lead.LeadDate)).toLocaleDateString()
                : "—"}
            </span>
          </div>

          <div style={{ marginBottom: 8 }}>
            <span style={contactRowLabel}>Status: </span>
            <span
              style={{
                padding: "2px 8px",
                background: "#e8f3ff",
                borderRadius: 12,
              }}
            >
              {lead.StatusName}
            </span>
          </div>
        </div>

        <div style={rightCardStyle}>
          <div style={{...sectionTitle,borderBottom: "1px solid #e6e6e6",paddingBottom: 8}}>Contacts</div>

          {(lead.Contacts || []).map((c, idx) => (
            <div key={idx} style={contactCardStyle}>
              <div style={contactAccentStyle}>
                <div style={{ display: "flex", marginBottom: 8 }}>
                  <div style={contactRowLabel}>Name:</div>
                  <div style={{ fontSize: 13 }}>{c.ContactName || "—"}</div>
                </div>

                {c.ContactTitle && (
                  <div style={{ display: "flex", marginBottom: 6 }}>
                    <div style={contactRowLabel}>Title:</div>
                    <div style={{ fontSize: 13 }}>{c.ContactTitle}</div>
                  </div>
                )}

                {c.ContactRoleName && (
                  <div style={{ display: "flex", marginBottom: 6 }}>
                    <div style={contactRowLabel}>Role:</div>
                    <div style={{ fontSize: 13 }}>{c.ContactRoleName}</div>
                  </div>
                )}

                {c.ContactEmail && (
                  <div style={{ display: "flex" }}>
                    <div style={contactRowLabel}>Email:</div>
                    <div style={{ fontSize: 13, color: "#3a77e3" }}>
                      <a
                        href={`mailto:${c.ContactEmail}`}
                        style={{ color: "inherit", textDecoration: "none" }}
                      >
                        {c.ContactEmail}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={notesStyle}>
        <strong>Notes:</strong>{" "}
        <span style={{ marginLeft: 8 }}>{lead.LeadNotes || "—"}</span>
      </div>

      {/* Activities */}
      <div style={{ ...sectionTitle, display: "flex", alignItems: "center" }}>
        Lead Activities
        <button style={addBtn} onClick={() => setActivePopup("activity")}>
          +
        </button>
      </div>

      <div style={tableWrap}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 200 }}>Activity Date</th>
              <th style={{ ...thStyle, width: 120 }}>Mode</th>
              <th style={{ ...thStyle }}>Notes</th>
              <th style={{ ...thStyle, width: 120 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(lead.Activities || []).map((a, i) => (
              <tr key={i}>
                <td style={tdStyle}>{a.ActivityDate}</td>
                <td style={tdStyle}>{a.Mode}</td>
                <td style={tdStyle}>{a.Notes}</td>
                <td style={tdStyle}>{a.Status}</td>
              </tr>
            ))}

            {(!lead.Activities || lead.Activities.length === 0) && (
              <tr>
                <td style={tdStyle} colSpan={4}>
                  No activities
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reminders */}
      <div style={{ ...sectionTitle, display: "flex", alignItems: "center" }}>
        Lead Reminders
        <button style={addBtn} onClick={() => setActivePopup("reminder")}>
          +
        </button>
      </div>
      <div style={tableWrap}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 180 }}>Reminder Date</th>
              <th style={{ ...thStyle }}>Notes</th>
              <th style={{ ...thStyle, width: 140 }}>Status</th>
              <th style={{ ...thStyle, width: 140 }}>Notification</th>
            </tr>
          </thead>
          <tbody>
            {(lead.Reminders || []).map((r, i) => (
              <tr key={i}>
                <td style={tdStyle}>{r.ReminderDate}</td>
                <td style={tdStyle}>{r.Notes}</td>
                <td style={tdStyle}>{r.Status}</td>
                <td style={tdStyle}>{r.Notification}</td>
              </tr>
            ))}

            {(!lead.Reminders || lead.Reminders.length === 0) && (
              <tr>
                <td style={tdStyle} colSpan={4}>
                  No reminders
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Lead Opportunities */}
      <div style={{ ...sectionTitle, display: "flex", alignItems: "center" }}>
        Lead Opportunities
        <button style={addBtn} onClick={() => setActivePopup("opportunity")}>
          +
        </button>
      </div>

      <div style={tableWrap}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
          }}
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 180 }}>Created Date</th>
              <th style={{ ...thStyle, width: 150 }}>Service</th>
              <th style={{ ...thStyle, width: 120 }}>Probability</th>
              <th style={{ ...thStyle, width: 200 }}>Status</th>
              <th style={{ ...thStyle, width: 200 }}>Engagement Model</th>
            </tr>
          </thead>

          <tbody>
            {(lead.Opportunities || []).map((o, i) => (
              <tr key={i}>
                <td style={tdStyle}>{o.CreatedDate}</td>
                <td style={tdStyle}>{o.Service}</td>
                <td style={tdStyle}>{o.Probability}</td>
                <td style={tdStyle}>{o.Status}</td>
                <td style={tdStyle}>{o.EngagementModel}</td>
              </tr>
            ))}

            {(!lead.Opportunities || lead.Opportunities.length === 0) && (
              <tr>
                <td colSpan={5} style={tdStyle}>
                  No opportunities
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PopupModals
  type={activePopup}
  onClose={() => setActivePopup(null)}
/>

    </div>
  );
}

// shared style used in early return above
const backBtnStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  border: "none",
  background: "#efefef",
  cursor: "pointer",
};