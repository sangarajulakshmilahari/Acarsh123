"use client";

import React from "react";
import { useState } from "react";

/* ---------------- TYPES ---------------- */

export type PopupType = "activity" | "reminder" | "opportunity" | null;

type PopupModalsProps = {
  type: PopupType;
  onClose: () => void;
  onSaveActivity?: () => void;
};

/* ---------------- COMPONENT ---------------- */

export default function PopupModals({
  type,
  onClose,
  onSaveActivity,
}: PopupModalsProps) {
  const [service, setService] = useState("");
  const [otherService, setOtherService] = useState("");

  const [engagementModel, setEngagementModel] = useState("");
  const [otherEngagementModel, setOtherEngagementModel] = useState("");

  if (!type) return null;

  /* ---------- ACTIVITY ---------- */
  if (type === "activity") {
    return (
      <ModalWrapper title="Add Lead Activity" onClose={onClose}>
        <label>Activity Type *</label>
        <select style={inputStyle}>
          <option value="">Select Type</option>
          <option>Call</option>
          <option>Email</option>
          <option>Meeting</option>
          <option>Task</option>
        </select>

        <label>Status *</label>
        <select style={inputStyle}>
          <option value="">Select Status</option>
          <option>New</option>
          <option>Follow-up</option>
          <option>Completed</option>
        </select>

        <label>Notes *</label>
        <textarea style={{ ...inputStyle, height: 60 }} />

        <ModalFooter>
          <button style={cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button style={saveBtn} onClick={onSaveActivity}>
            Save Activity
          </button>
        </ModalFooter>
      </ModalWrapper>
    );
  }

  /* ---------- REMINDER ---------- */
  if (type === "reminder") {
    return (
      <ModalWrapper title="Add Lead Reminder" onClose={onClose}>
        <label>Reminder Date *</label>
        <input type="date" style={inputStyle} />

        <label>Notes *</label>
        <textarea style={{ ...inputStyle, height: 80 }} />

        <label>Status</label>
        <select style={inputStyle}>
          <option>Pending</option>
          <option>Completed</option>
        </select>

        <ModalFooter>
          <button style={cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button style={saveBtn}>Save Reminder</button>
        </ModalFooter>
      </ModalWrapper>
    );
  }

  /* ---------- OPPORTUNITY ---------- */
  if (type === "opportunity") {
    return (
      <ModalWrapper title="Add Lead Opportunity" onClose={onClose} width="55%">
        {/* SERVICE + STATUS */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Service *</label>
            <select
              style={inputStyle}
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option>-- Select Service --</option>
              <option>TalentMatch</option>
              <option>DevAlley</option>
              <option>Software Engineering</option>
              <option>SAAS / ERP</option>
              <option>Cloud</option>
              <option>BI</option>
              <option>AI</option>
              <option>Data Works</option>
              <option>Infra Services</option>
              <option>Other</option>
            </select>
            {service === "Other" && (
              <input
                type="text"
                placeholder="Specify other service"
                style={{ ...inputStyle, marginTop: 6 }}
                value={otherService}
                onChange={(e) => setOtherService(e.target.value)}
              />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Status *</label>
            <select style={inputStyle}>
              <option>-- Select Status --</option>
              <option>Engagement Model Identified</option>
              <option>Proposal Sent</option>
              <option>Negotiation</option>
              <option>Closed Won</option>
              <option>Closed Lost</option>
            </select>
          </div>
        </div>

        {/* PROBABILITY + ENGAGEMENT MODEL */}
        <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
          {/* Probability */}
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Probability*</label>
            <div style={{ ...radioBox, width: "fit-content" }}>
              <label>
                <input type="radio" name="prob" /> &nbsp;&lt;25%
              </label>
              <label>
                <input type="radio" name="prob" /> &nbsp;50%
              </label>
              <label>
                <input type="radio" name="prob" /> &nbsp;75%
              </label>
              <label>
                <input type="radio" name="prob" /> &nbsp;90%
              </label>
            </div>
          </div>

          {/* Engagement Model */}
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Engagement Model *</label>
            <select
              style={inputStyle}
              value={engagementModel}
              onChange={(e) => setEngagementModel(e.target.value)}
            >
              <option>-- Select Engagement Model --</option>
              <option>Competence Center (ODC)</option>
              <option>Time & Material</option>
              <option>Fixed Bid</option>
              <option>Retainer</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        {/* TECHNOLOGY */}
        <label style={{ ...labelStyle, marginTop: 16 }}>Technology *</label>

        <div style={techBox}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {/* Development Stack */}
            <div>
              <b>Development Stack</b>
              {[
                "LAMP",
                "MEAN",
                "MERN",
                "Java Spring",
                ".NET Stack",
                "Other",
              ].map((t) => (
                <div key={t}>
                  <input type="checkbox" /> &nbsp; {t}
                </div>
              ))}
            </div>

            {/* Cloud Platforms */}
            <div>
              <b>Cloud Computing Platforms</b>
              {[
                "AWS",
                "Azure",
                "Google Cloud Platform",
                "IBM Cloud",
                "Oracle Cloud Infrastructure",
              ].map((t) => (
                <div key={t}>
                  <input type="checkbox" /> &nbsp; {t}
                </div>
              ))}
            </div>

            {/* Database Technologies */}
            <div>
              <b>Database Technologies</b>
              {[
                "Oracle Database",
                "SQL Server",
                "MySQL",
                "PostgreSQL",
                "MongoDB",
                "Cassandra",
                "Snowflake",
                "Amazon Redshift",
              ].map((t) => (
                <div key={t}>
                  <input type="checkbox" /> &nbsp; {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <ModalFooter>
          <button style={cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button style={saveBtn}>Save Opportunity</button>
        </ModalFooter>
      </ModalWrapper>
    );
  }

  return null;
}

/* ---------------- MODAL WRAPPER ---------------- */

type ModalWrapperProps = {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  width?: number | string;
};

function ModalWrapper({
  title,
  children,
  onClose,
  width = 450,
}: ModalWrapperProps) {
  return (
    <div style={overlayStyle}>
      <div style={{ ...boxStyle, width }}>
        <div style={headerStyle}>
          <span>{title}</span>
          <span style={closeBtnStyle} onClick={onClose}>
            ✕
          </span>
        </div>

        <div style={bodyStyle}>{children}</div>
      </div>
    </div>
  );
}

/* ---------------- FOOTER ---------------- */

function ModalFooter({ children }: { children: React.ReactNode }) {
  return <div style={footerStyle}>{children}</div>;
}

/* ---------------- STYLES ---------------- */

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
};

const boxStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 8,
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  backgroundColor: "#3a77e3",
  color: "#fff",
  padding: 14,
  fontWeight: "bold",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const bodyStyle: React.CSSProperties = {
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const closeBtnStyle: React.CSSProperties = {
  cursor: "pointer",
  fontSize: 20,
};

const inputStyle: React.CSSProperties = {
  width: "70%",
  padding: 8,
  borderRadius: 4,
  border: "1px solid #ccc",
  fontSize: 12,
};

const footerStyle: React.CSSProperties = {
  marginTop: 15,
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const cancelBtn: React.CSSProperties = {
  padding: "8px 14px",
  background: "#d1d1d1",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

const saveBtn: React.CSSProperties = {
  padding: "8px 14px",
  background: "#3a77e3",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};
const labelStyle: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: 6,
  display: "block",
};

const radioBox: React.CSSProperties = {
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: "7px 10px",
  marginTop: 6,
  display: "flex",
  flexDirection: "row",
  gap: 12,
  alignItems: "center",
  fontSize: 13,
};

const techBox: React.CSSProperties = {
  border: "1px solid #ccc",
  borderRadius: 6,
  padding: 20,
  marginTop: 6,
};
