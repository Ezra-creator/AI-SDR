import React from "react";
import { Globe, Mail, Clock } from "lucide-react";
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
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return "recently";
  }
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onClick, isSelected = false }) => {
  const score = lead.fit_score;
  let scoreBg = "#F4F4F5";
  let scoreText = "#71717A";
  let scoreBorder = "#E4E4E7";

  if (score !== null && score !== undefined) {
    if (score >= 80) {
      scoreBg = "#ECFDF5";
      scoreText = "#047857";
      scoreBorder = "#A7F3D0";
    } else if (score >= 50) {
      scoreBg = "#FEF3C7";
      scoreText = "#B45309";
      scoreBorder = "#FDE68A";
    } else {
      scoreBg = "#FFF1F2";
      scoreText = "#BE123C";
      scoreBorder = "#FECDD3";
    }
  }

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: "#FFFFFF",
        border: isSelected ? "1.5px solid #4338CA" : "1px solid #E4E4E7",
        borderRadius: "5px",
        padding: "10px",
        cursor: "pointer",
        transition: "border-color 0.12s ease, box-shadow 0.12s ease",
        boxShadow: isSelected ? "0 0 0 1px #4338CA" : "0 1px 2px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = "#A1A1AA";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.borderColor = "#E4E4E7";
      }}
    >
      {/* 1. Header: Name, Score & Status Dot */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
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
            title={`Fit Score: ${score}/100`}
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "1px 5px",
              borderRadius: "3px",
              backgroundColor: scoreBg,
              color: scoreText,
              border: `1px solid ${scoreBorder}`,
              flexShrink: 0,
            }}
          >
            {score}
          </span>
        )}
      </div>

      {/* 2. Domain */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#71717A" }}>
        <Globe size={11} color="#A1A1AA" />
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {lead.domain}
        </span>
      </div>

      {/* 3. Research Snippet */}
      {lead.company_summary ? (
        <div
          style={{
            fontSize: "11px",
            color: "#52525B",
            lineHeight: 1.35,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {lead.company_summary}
        </div>
      ) : (
        <div style={{ fontSize: "11px", color: "#A1A1AA", fontStyle: "italic" }}>
          Research pending or thin
        </div>
      )}

      {/* 4. Footer: Relative timestamp & email count */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "4px",
          borderTop: "1px solid #F4F4F5",
          fontSize: "10px",
          color: "#A1A1AA",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <Clock size={10} />
          <span>{formatRelativeTime(lead.created_at)}</span>
        </div>

        {lead.email_count !== undefined && lead.email_count > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "#4338CA", fontWeight: 500 }}>
            <Mail size={10} />
            <span>{lead.email_count} {lead.email_count === 1 ? "email" : "emails"}</span>
          </div>
        )}
      </div>
    </div>
  );
};
