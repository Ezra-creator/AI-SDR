import React from "react";
import { LeadStatus } from "../types/lead";

interface StatusBadgeProps {
  status: LeadStatus | string;
  className?: string;
  showDotOnly?: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; dotColor: string; bg: string; text: string; border: string }
> = {
  discovered: {
    label: "Discovered",
    dotColor: "#71717A",
    bg: "#F4F4F5",
    text: "#52525B",
    border: "#E4E4E7",
  },
  researched: {
    label: "Researched",
    dotColor: "#64748B",
    bg: "#F1F5F9",
    text: "#334155",
    border: "#CBD5E1",
  },
  scored: {
    label: "Scored",
    dotColor: "#2563EB",
    bg: "#EFF6FF",
    text: "#1D4ED8",
    border: "#BFDBFE",
  },
  pending_approval: {
    label: "Pending Approval",
    dotColor: "#D97706",
    bg: "#FEF3C7",
    text: "#B45309",
    border: "#FDE68A",
  },
  outreach_generated: {
    label: "Draft Ready",
    dotColor: "#D97706",
    bg: "#FEF3C7",
    text: "#B45309",
    border: "#FDE68A",
  },
  sent: {
    label: "Sent",
    dotColor: "#4F46E5",
    bg: "#EEF2FF",
    text: "#4338CA",
    border: "#C7D2FE",
  },
  followed_up: {
    label: "Followed Up",
    dotColor: "#7C3AED",
    bg: "#F5F3FF",
    text: "#6D28D9",
    border: "#DDD6FE",
  },
  replied: {
    label: "Replied",
    dotColor: "#059669",
    bg: "#ECFDF5",
    text: "#047857",
    border: "#A7F3D0",
  },
  disqualified: {
    label: "Disqualified",
    dotColor: "#E11D48",
    bg: "#FFF1F2",
    text: "#BE123C",
    border: "#FECDD3",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = "",
  showDotOnly = false,
}) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    dotColor: "#71717A",
    bg: "#F4F4F5",
    text: "#71717A",
    border: "#E4E4E7",
  };

  if (showDotOnly) {
    return (
      <span
        title={config.label}
        style={{
          display: "inline-block",
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          backgroundColor: config.dotColor,
          flexShrink: 0,
        }}
        className={className}
      />
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "2px 7px",
        fontSize: "11px",
        fontWeight: 500,
        borderRadius: "4px",
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        lineHeight: 1.2,
      }}
      className={className}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          backgroundColor: config.dotColor,
        }}
      />
      {config.label}
    </span>
  );
};
