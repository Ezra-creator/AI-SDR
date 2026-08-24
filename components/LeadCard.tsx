import React from "react";
import { StatusBadge } from "./StatusBadge";

interface LeadCardProps {
  lead: {
    id: string;
    company_name: string;
    domain: string;
    status: string;
    fit_score: number | null;
    company_summary?: string | null;
    created_at: string;
    email_count?: number;
    latest_email_status?: string;
  };
  onClick: () => void;
  isSelected?: boolean;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  } catch {
    return "";
  }
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick, isSelected = false }) => {
  const score = lead.fit_score;
  let scoreColor = "#71717A";

  if (score !== null && score !== undefined) {
    if (score >= 80) scoreColor = "#047857";
    else if (score >= 50) scoreColor = "#B45309";
    else scoreColor = "#BE123C";
  }

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "#FFFFFF",
        border: isSelected ? "1px solid #4338CA" : "1px solid #E4E4E7",
        borderRadius: "3px",
        padding: "8px",
        cursor: "pointer",
        transition: "border-color 0.1s ease",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = "#A1A1AA";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = "#E4E4E7";
      }}
    >
      {/* 1. Header: Name, Status Dot & Score */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", overflow: "hidden" }}>
          <StatusBadge status={lead.status} showDotOnly />
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
            {lead.company_name}
          </span>
        </div>

        {score !== null && score !== undefined && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: scoreColor,
              flexShrink: 0,
            }}
          >
            {score}
          </span>
        )}
      </div>

      {/* 2. Domain */}
      <div style={{ fontSize: "11px", color: "#71717A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {lead.domain}
      </div>

      {/* 3. Research Snippet */}
      {lead.company_summary && (
        <div
          style={{
            fontSize: "11px",
            color: "#52525B",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {lead.company_summary}
        </div>
      )}

      {/* 4. Footer info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "3px",
          marginTop: "2px",
          borderTop: "1px solid #F4F4F5",
          fontSize: "10px",
          color: "#A1A1AA",
        }}
      >
        <span>{formatRelativeTime(lead.created_at)}</span>
        {lead.email_count !== undefined && lead.email_count > 0 && (
          <span style={{ color: "#52525B", fontWeight: 500 }}>
            {lead.email_count} {lead.email_count === 1 ? "email" : "emails"}
          </span>
        )}
      </div>
    </div>
  );
};
