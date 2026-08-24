import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import {
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Mail,
  FileText,
  Clock,
  Sparkles,
  Check,
} from "lucide-react";
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
  const campaign = fullHistory?.campaign;

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
    if (score >= 80) scoreColor = "#059669";
    else if (score >= 50) scoreColor = "#D97706";
    else scoreColor = "#E11D48";
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "580px",
        maxWidth: "100vw",
        backgroundColor: "#FFFFFF",
        borderLeft: "1px solid #E4E4E7",
        boxShadow: "-4px 0 16px rgba(0,0,0,0.06)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* 1. Header Bar */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #E4E4E7",
          backgroundColor: "#FBFBFC",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#18181B" }}>
              {lead?.company_name || "Loading Lead Details..."}
            </h2>
            {lead && <StatusBadge status={lead.status} />}
          </div>

          {lead && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#71717A" }}>
              <a
                href={`https://${lead.domain}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "#4338CA",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                <span>{lead.domain}</span>
                <ExternalLink size={11} />
              </a>

              <span>•</span>

              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600, color: scoreColor }}>
                Fit Score: {score !== null && score !== undefined ? `${score}/100` : "Unscored"}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {lead && !lead.has_replied && lead.status !== "disqualified" && (
            <button
              onClick={handleMarkReplied}
              disabled={markingReplied}
              title="Mark as replied to stop automatic follow-up sequence"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 9px",
                backgroundColor: "#FFFFFF",
                color: "#059669",
                border: "1px solid #A7F3D0",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <CheckCircle2 size={12} />
              <span>{markingReplied ? "Updating..." : "Mark Replied"}</span>
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "#71717A",
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Body Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {isLoading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#71717A", fontSize: "12px" }}>
            Fetching grounded lead research and email thread...
          </div>
        )}

        {error && (
          <div style={{ padding: "12px", backgroundColor: "#FEF2F2", color: "#991B1B", borderRadius: "4px", fontSize: "12px" }}>
            Failed to load lead details: {error.message || String(error)}
          </div>
        )}

        {lead && (
          <>
            {/* Disqualification Banner */}
            {lead.status === "disqualified" && (
              <div
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#FFF1F2",
                  border: "1px solid #FECDD3",
                  borderRadius: "5px",
                  fontSize: "12px",
                  color: "#BE123C",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                <div>
                  <strong>Disqualified Lead:</strong> This lead scored below the qualification threshold or failed core ICP criteria. Outreach email generation is skipped.
                </div>
              </div>
            )}

            {/* Replied Banner */}
            {lead.has_replied && (
              <div
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  borderRadius: "5px",
                  fontSize: "12px",
                  color: "#047857",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle2 size={15} />
                <div>
                  <strong>Prospect Replied:</strong> Reply registered. All automatic follow-up sequence triggers are halted.
                </div>
              </div>
            )}

            {/* Research Section */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#18181B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Verified Web Research
                </h3>
                {research && (
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 600,
                      padding: "1px 6px",
                      borderRadius: "3px",
                      backgroundColor: research.research_quality === "good" ? "#ECFDF5" : "#F4F4F5",
                      color: research.research_quality === "good" ? "#047857" : "#71717A",
                      border: `1px solid ${research.research_quality === "good" ? "#A7F3D0" : "#E4E4E7"}`,
                    }}
                  >
                    Quality: {research.research_quality.toUpperCase()}
                  </span>
                )}
              </div>

              {research ? (
                <div
                  style={{
                    backgroundColor: "#FBFBFC",
                    border: "1px solid #E4E4E7",
                    borderRadius: "6px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {/* Summary */}
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#71717A", marginBottom: "4px" }}>
                      Company Overview:
                    </div>
                    <p style={{ fontSize: "12px", color: "#18181B", lineHeight: 1.45 }}>
                      {research.company_summary}
                    </p>
                  </div>

                  {/* News */}
                  {research.recent_news && research.recent_news.length > 0 && (
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#71717A", marginBottom: "4px" }}>
                        Recent News & Announcements:
                      </div>
                      <ul style={{ paddingLeft: "16px", fontSize: "12px", color: "#334155", lineHeight: 1.4 }}>
                        {research.recent_news.map((item: string, idx: number) => (
                          <li key={idx} style={{ marginBottom: "3px" }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Pain Points */}
                  {research.likely_pain_points && research.likely_pain_points.length > 0 && (
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 600, color: "#71717A", marginBottom: "4px" }}>
                        Likely Pain Points & Use Cases:
                      </div>
                      <ul style={{ paddingLeft: "16px", fontSize: "12px", color: "#334155", lineHeight: 1.4 }}>
                        {research.likely_pain_points.map((item: string, idx: number) => (
                          <li key={idx} style={{ marginBottom: "3px" }}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Grounded Source URLs */}
                  {research.source_urls && research.source_urls.length > 0 && (
                    <div style={{ paddingTop: "6px", borderTop: "1px solid #F4F4F5" }}>
                      <div style={{ fontSize: "10px", fontWeight: 600, color: "#A1A1AA", textTransform: "uppercase", marginBottom: "4px" }}>
                        Ground-Truth Inspected URLs ({research.source_urls.length}):
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {research.source_urls.slice(0, 4).map((url: string, idx: number) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: "10px",
                              color: "#4338CA",
                              backgroundColor: "#EEF2FF",
                              padding: "2px 6px",
                              borderRadius: "3px",
                              textDecoration: "none",
                              maxWidth: "240px",
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
                <div style={{ padding: "16px", backgroundColor: "#F4F4F5", borderRadius: "5px", color: "#71717A", fontSize: "12px" }}>
                  No grounded research data stored for this lead yet.
                </div>
              )}
            </div>

            {/* Email History Thread */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#18181B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Outreach Sequence ({emails.length})
                </h3>

                {lead.next_follow_up_date && !lead.has_replied && (
                  <span style={{ fontSize: "11px", color: "#7C3AED", fontWeight: 500, display: "flex", alignItems: "center", gap: "3px" }}>
                    <Clock size={11} />
                    <span>Next follow-up scheduled</span>
                  </span>
                )}
              </div>

              {emails.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", backgroundColor: "#F4F4F5", borderRadius: "5px", color: "#71717A", fontSize: "12px" }}>
                  No outreach emails generated yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
