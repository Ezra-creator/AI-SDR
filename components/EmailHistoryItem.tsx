import React, { useState } from "react";
import { StatusBadge } from "./StatusBadge";

interface EmailHistoryItemProps {
  email: {
    id: string;
    sequence_number: number;
    subject: string;
    body: string;
    personalization_hooks_used: Array<{ fact: string; sourceUrl: string }>;
    angle_used?: string | null;
    status: string;
    sent_at?: string | null;
    created_at: string;
  };
  onApprove: (emailId: string) => Promise<void>;
  onReject: (emailId: string) => Promise<void>;
  onSaveEdit: (emailId: string, newSubject: string, newBody: string) => Promise<void>;
  isActionLoading?: boolean;
}

export const EmailHistoryItem: React.FC<EmailHistoryItemProps> = ({
  email,
  onApprove,
  onReject,
  onSaveEdit,
  isActionLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState(email.subject);
  const [bodyDraft, setBodyDraft] = useState(email.body);
  const [isExpanded, setIsExpanded] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  const isPending = email.status === "pending_approval" || email.status === "draft";
  const isSent = email.status === "sent";

  const handleSave = async () => {
    setSavingEdit(true);
    try {
      await onSaveEdit(email.id, subjectDraft, bodyDraft);
      setIsEditing(false);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: isPending ? "1px solid #FCD34D" : "1px solid #E4E4E7",
        borderRadius: "4px",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: "8px 10px",
          backgroundColor: isPending ? "#FFFBEB" : "#FBFBFC",
          borderBottom: isExpanded ? "1px solid #E4E4E7" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: isSent ? "#4338CA" : "#B45309" }}>
            #{email.sequence_number}
          </span>

          {email.angle_used && (
            <span style={{ fontSize: "10px", color: "#6D28D9", backgroundColor: "#F5F3FF", padding: "1px 4px", borderRadius: "2px" }}>
              {email.angle_used.replace(/_/g, " ")}
            </span>
          )}

          <span
            style={{
              fontWeight: 500,
              fontSize: "12px",
              color: "#18181B",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {email.subject}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <StatusBadge status={email.status} />
          <span style={{ fontSize: "10px", color: "#A1A1AA" }}>{isExpanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div>
                <label style={{ fontSize: "10px", color: "#71717A", display: "block", marginBottom: "2px" }}>Subject</label>
                <input
                  type="text"
                  value={subjectDraft}
                  onChange={(e) => setSubjectDraft(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "4px 6px",
                    borderRadius: "3px",
                    border: "1px solid #4338CA",
                    fontSize: "12px",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "#71717A", display: "block", marginBottom: "2px" }}>Body</label>
                <textarea
                  rows={5}
                  value={bodyDraft}
                  onChange={(e) => setBodyDraft(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: "3px",
                    border: "1px solid #4338CA",
                    fontSize: "12px",
                    lineHeight: 1.4,
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", marginTop: "4px" }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "3px",
                    border: "1px solid #E4E4E7",
                    backgroundColor: "#FFFFFF",
                    fontSize: "11px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={savingEdit}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "3px",
                    border: "none",
                    backgroundColor: "#4338CA",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  {savingEdit ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Body text */}
              <div
                style={{
                  fontSize: "12px",
                  color: "#18181B",
                  lineHeight: 1.45,
                  backgroundColor: "#FBFBFC",
                  padding: "8px",
                  borderRadius: "3px",
                  border: "1px solid #F4F4F5",
                  whiteSpace: "pre-wrap",
                }}
              >
                {email.body}
              </div>

              {/* Verified hooks */}
              {email.personalization_hooks_used && email.personalization_hooks_used.length > 0 && (
                <div style={{ fontSize: "11px", color: "#52525B" }}>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "#71717A", textTransform: "uppercase", marginBottom: "2px" }}>
                    Verified Hook Cited
                  </div>
                  {email.personalization_hooks_used.map((hook, idx) => (
                    <div key={idx} style={{ paddingLeft: "6px", borderLeft: "2px solid #C7D2FE", marginBottom: "2px" }}>
                      <span>"{hook.fact}"</span>
                      {hook.sourceUrl && (
                        <a
                          href={hook.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ marginLeft: "4px", color: "#4338CA", fontSize: "10px", textDecoration: "none" }}
                        >
                          [source]
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons: Strict Hierarchy */}
              {isPending && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    paddingTop: "6px",
                    borderTop: "1px solid #F4F4F5",
                  }}
                >
                  {/* Primary: Solid green */}
                  <button
                    onClick={() => onApprove(email.id)}
                    disabled={isActionLoading}
                    style={{
                      padding: "4px 10px",
                      backgroundColor: "#059669",
                      color: "#FFFFFF",
                      borderRadius: "3px",
                      border: "none",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Approve & Send
                  </button>

                  {/* Secondary: Outline */}
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={isActionLoading}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#FFFFFF",
                      color: "#18181B",
                      borderRadius: "3px",
                      border: "1px solid #E4E4E7",
                      fontSize: "11px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>

                  {/* Tertiary: Ghost text */}
                  <button
                    onClick={() => onReject(email.id)}
                    disabled={isActionLoading}
                    style={{
                      padding: "4px 6px",
                      backgroundColor: "transparent",
                      color: "#E11D48",
                      border: "none",
                      fontSize: "11px",
                      cursor: "pointer",
                      marginLeft: "auto",
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
