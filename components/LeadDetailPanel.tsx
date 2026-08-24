import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { StatusBadge } from "./StatusBadge";
import { EmailHistoryItem } from "./EmailHistoryItem";

interface LeadDetailPanelProps {
  leadId: string | null;
  onClose: () => void;
  onLeadUpdated?: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({
  leadId,
  onClose,
  onLeadUpdated,
}) => {
  const { data, error, isLoading } = useSWR(
    leadId ? `/api/leads/${leadId}` : null,
    fetcher
  );

  const [actionLoading, setActionLoading] = useState(false);
  const [markingReplied, setMarkingReplied] = useState(false);

  if (!leadId) return null;

  const fullHistory = data?.fullHistory;
  const lead = fullHistory?.lead;
  const research = fullHistory?.research;
  const emails = fullHistory?.emails || [];

  const handleApprove = async (emailId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/emails/${emailId}/approve`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        mutate(`/api/leads/${leadId}`);
        mutate("/api/leads");
        if (onLeadUpdated) onLeadUpdated();
      } else {
        alert(json.error || "Failed to approve email");
      }
    } catch (err: any) {
      alert("Error approving email: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (emailId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/emails/${emailId}/reject`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        mutate(`/api/leads/${leadId}`);
        mutate("/api/leads");
        if (onLeadUpdated) onLeadUpdated();
      }
    } catch (err: any) {
      alert("Error rejecting email: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (emailId: string, subject: string, body: string) => {
    const res = await fetch(`/api/emails/${emailId}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    const json = await res.json();
    if (json.success) {
      mutate(`/api/leads/${leadId}`);
      mutate("/api/leads");
      if (onLeadUpdated) onLeadUpdated();
    } else {
      alert(json.error || "Failed to update email");
    }
  };

  const handleMarkReplied = async () => {
    setMarkingReplied(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/replied`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        mutate(`/api/leads/${leadId}`);
        mutate("/api/leads");
        if (onLeadUpdated) onLeadUpdated();
      }
    } finally {
      setMarkingReplied(false);
    }
  };

  const score = lead?.fit_score;
  let scoreColor = "#71717A";
  if (score !== null && score !== undefined) {
    if (score >= 80) scoreColor = "#047857";
    else if (score >= 50) scoreColor = "#B45309";
    else scoreColor = "#BE123C";
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "540px",
        maxWidth: "100vw",
        backgroundColor: "#FFFFFF",
        borderLeft: "1px solid #E4E4E7",
        boxShadow: "-2px 0 8px rgba(0,0,0,0.04)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #E4E4E7",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#18181B" }}>
              {lead?.company_name || "Lead Details"}
            </h2>
            {lead && <StatusBadge status={lead.status} />}
          </div>

          {lead && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#71717A" }}>
              <a
                href={`https://${lead.domain}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#4338CA", textDecoration: "none" }}
              >
                {lead.domain} ↗
              </a>
              <span>•</span>
              <span style={{ fontWeight: 600, color: scoreColor }}>
                Score: {score !== null && score !== undefined ? score : "—"}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {lead && !lead.has_replied && lead.status !== "disqualified" && (
            <button
              onClick={handleMarkReplied}
              disabled={markingReplied}
              style={{
                padding: "3px 8px",
                backgroundColor: "#FFFFFF",
                color: "#059669",
                border: "1px solid #A7F3D0",
                borderRadius: "3px",
                fontSize: "11px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {markingReplied ? "Updating..." : "Mark Replied"}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              color: "#71717A",
              padding: "2px 4px",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {isLoading && (
          <div style={{ padding: "20px 0", color: "#71717A", fontSize: "11px" }}>
            Loading dossier...
          </div>
        )}

        {error && (
          <div style={{ padding: "8px", backgroundColor: "#FEF2F2", color: "#991B1B", fontSize: "11px", borderRadius: "3px" }}>
            {error.message || String(error)}
          </div>
        )}

        {lead && (
          <>
            {/* Disqualification / Reply Notice */}
            {lead.status === "disqualified" && (
              <div style={{ padding: "6px 8px", backgroundColor: "#FFF1F2", border: "1px solid #FECDD3", borderRadius: "3px", fontSize: "11px", color: "#BE123C" }}>
                Disqualified: Failed ICP criteria threshold. Outreach skipped.
              </div>
            )}
            {lead.has_replied && (
              <div style={{ padding: "6px 8px", backgroundColor: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: "3px", fontSize: "11px", color: "#047857" }}>
                Replied: Follow-up sequence completed and halted.
              </div>
            )}

            {/* Research Dossier Section */}
            <div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "8px" }}>
                Research Findings
              </div>

              {research ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#71717A", marginBottom: "2px" }}>Overview</div>
                    <div style={{ color: "#18181B", lineHeight: 1.4 }}>{research.company_summary}</div>
                  </div>

                  {research.recent_news && research.recent_news.length > 0 && (
                    <div>
                      <div style={{ fontSize: "11px", color: "#71717A", marginBottom: "2px" }}>Recent News & Signals</div>
                      <ul style={{ paddingLeft: "14px", color: "#334155", lineHeight: 1.35 }}>
                        {research.recent_news.map((item: string, idx: number) => (
                          <li key={idx} style={{ marginBottom: "2px" }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {research.likely_pain_points && research.likely_pain_points.length > 0 && (
                    <div>
                      <div style={{ fontSize: "11px", color: "#71717A", marginBottom: "2px" }}>Stated Pain Points</div>
                      <ul style={{ paddingLeft: "14px", color: "#334155", lineHeight: 1.35 }}>
                        {research.likely_pain_points.map((item: string, idx: number) => (
                          <li key={idx} style={{ marginBottom: "2px" }}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {research.source_urls && research.source_urls.length > 0 && (
                    <div style={{ paddingTop: "6px", borderTop: "1px solid #F4F4F5" }}>
                      <div style={{ fontSize: "10px", color: "#A1A1AA", textTransform: "uppercase", marginBottom: "4px" }}>
                        Verified Sources ({research.source_urls.length})
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {research.source_urls.slice(0, 4).map((url: string, idx: number) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: "10px",
                              color: "#4338CA",
                              backgroundColor: "#F4F4F5",
                              padding: "1px 5px",
                              borderRadius: "2px",
                              textDecoration: "none",
                              maxWidth: "200px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {url.replace(/^https?:\/\//, "")}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: "#A1A1AA", fontSize: "11px" }}>No research data recorded.</div>
              )}
            </div>

            {/* Email History Sequence */}
            <div style={{ borderTop: "1px solid #E4E4E7", paddingTop: "12px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "8px" }}>
                Outreach Sequence ({emails.length})
              </div>

              {emails.length === 0 ? (
                <div style={{ color: "#A1A1AA", fontSize: "11px" }}>No emails generated.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {emails.map((email: any) => (
                    <EmailHistoryItem
                      key={email.id}
                      email={email}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onSaveEdit={handleSaveEdit}
                      isActionLoading={actionLoading}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
