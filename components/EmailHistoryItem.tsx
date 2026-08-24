import React, { useState } from "react";
import { Check, X, Edit3, Send, AlertCircle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
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
        borderRadius: "6px",
        overflow: "hidden",
        boxShadow: isPending ? "0 1px 3px rgba(217, 119, 6, 0.08)" : "none",
      }}
    >
      {/* Email Card Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: "10px 12px",
          backgroundColor: isPending ? "#FFFBEB" : "#FBFBFC",
          borderBottom: isExpanded ? "1px solid #E4E4E7" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: "3px",
              backgroundColor: isSent ? "#EEF2FF" : "#FEF3C7",
              color: isSent ? "#4338CA" : "#B45309",
              border: `1px solid ${isSent ? "#C7D2FE" : "#FDE68A"}`,
            }}
          >
            {email.sequence_number === 1 ? "Initial Outreach" : `Follow-Up #${email.sequence_number - 1}`}
          </span>

          {email.angle_used && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "#6D28D9",
                backgroundColor: "#F5F3FF",
                padding: "1px 5px",
                borderRadius: "3px",
                border: "1px solid #DDD6FE",
              }}
            >
              Angle: {email.angle_used.replace(/_/g, " ")}
            </span>
          )}

          <span
            style={{
              fontWeight: 600,
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
          {isExpanded ? <ChevronUp size={14} color="#71717A" /> : <ChevronDown size={14} color="#71717A" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {isEditing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <label style={{ fontSize: "10px", fontWeight: 600, color: "#71717A", textTransform: "uppercase" }}>
                  Subject Line:
                </label>
                <input
                  type="text"
                  value={subjectDraft}
                  onChange={(e) => setSubjectDraft(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: "4px",
                    border: "1px solid #4338CA",
                    fontSize: "12px",
                    marginTop: "2px",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "10px", fontWeight: 600, color: "#71717A", textTransform: "uppercase" }}>
                  Email Body (3-5 sentences):
                </label>
                <textarea
                  rows={6}
                  value={bodyDraft}
                  onChange={(e) => setBodyDraft(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #4338CA",
                    fontSize: "12px",
                    lineHeight: 1.5,
                    fontFamily: "inherit",
                    marginTop: "2px",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "4px",
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
                    padding: "5px 12px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#4338CA",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Subject */}
              <div style={{ fontSize: "11px", color: "#71717A" }}>
                <strong style={{ color: "#18181B" }}>Subject:</strong> {email.subject}
              </div>

              {/* Body */}
              <div
                style={{
                  fontSize: "12px",
                  color: "#18181B",
                  lineHeight: 1.5,
                  backgroundColor: "#FBFBFC",
                  padding: "10px",
                  borderRadius: "4px",
                  border: "1px solid #F4F4F5",
                  whiteSpace: "pre-wrap",
                }}
              >
                {email.body}
              </div>

              {/* Personalization Hooks Cited */}
              {email.personalization_hooks_used && email.personalization_hooks_used.length > 0 && (
                <div style={{ fontSize: "11px", color: "#52525B" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: 600, color: "#4338CA", marginBottom: "4px" }}>
                    <Sparkles size={12} />
                    <span>Personalization Hook Verified:</span>
                  </div>
                  {email.personalization_hooks_used.map((hook, idx) => (
                    <div key={idx} style={{ paddingLeft: "8px", borderLeft: "2px solid #C7D2FE", marginBottom: "3px" }}>
                      <span>"{hook.fact}"</span>
                      {hook.sourceUrl && (
                        <a
                          href={hook.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ marginLeft: "6px", color: "#4338CA", fontSize: "10px", textDecoration: "underline" }}
                        >
                          Source
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons for Pending Drafts */}
              {isPending && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    paddingTop: "8px",
                    borderTop: "1px solid #F4F4F5",
                  }}
                >
                  <button
                    onClick={() => onApprove(email.id)}
                    disabled={isActionLoading}
                    title="Approve draft and dispatch via Resend"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 12px",
                      backgroundColor: "#059669",
                      color: "#FFFFFF",
                      borderRadius: "4px",
                      border: "none",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <Send size={12} />
                    <span>Approve & Send</span>
                  </button>

                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={isActionLoading}
                    title="Edit subject or body before approving"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "6px 10px",
                      backgroundColor: "#FFFFFF",
                      color: "#18181B",
                      borderRadius: "4px",
                      border: "1px solid #E4E4E7",
                      fontSize: "11px",
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    <Edit3 size={12} color="#71717A" />
                    <span>Edit Draft</span>
                  </button>

                  <button
                    onClick={() => onReject(email.id)}
                    disabled={isActionLoading}
                    title="Reject draft"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 10px",
                      backgroundColor: "#FFFFFF",
                      color: "#E11D48",
                      borderRadius: "4px",
                      border: "1px solid #FECDD3",
                      fontSize: "11px",
                      fontWeight: 500,
                      cursor: "pointer",
                      marginLeft: "auto",
                    }}
                  >
                    <X size={12} />
                    <span>Reject</span>
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
