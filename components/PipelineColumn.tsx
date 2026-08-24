import React, { useState } from "react";
import { LeadCard } from "./LeadCard";

interface PipelineColumnProps {
  statusKey: string;
  title: string;
  dotColor: string;
  leads: any[];
  onSelectLead: (leadId: string) => void;
  selectedLeadId: string | null;
  defaultCollapsed?: boolean;
}

export const PipelineColumn: React.FC<PipelineColumnProps> = ({
  statusKey,
  title,
  dotColor,
  leads,
  onSelectLead,
  selectedLeadId,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (isCollapsed) {
    return (
      <div
        onClick={() => setIsCollapsed(false)}
        className="kanban-col-collapsed"
        style={{
          height: "calc(100vh - 150px)",
          backgroundColor: "#F4F4F5",
          border: "1px solid #E4E4E7",
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "10px 0",
          gap: "8px",
          cursor: "pointer",
          userSelect: "none",
        }}
        title={`Expand ${title} (${leads.length})`}
      >
        <span
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontSize: "11px",
            fontWeight: 500,
            color: "#71717A",
            letterSpacing: "0.02em",
          }}
        >
          {title} ({leads.length})
        </span>
      </div>
    );
  }

  return (
    <div className="kanban-col">
      {/* Column Header */}
      <div
        style={{
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #E4E4E7",
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: "3px",
          borderTopRightRadius: "3px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: dotColor,
              display: "inline-block",
            }}
          />
          <span style={{ fontWeight: 600, fontSize: "12px", color: "#18181B" }}>
            {title}
          </span>
          <span style={{ fontSize: "11px", color: "#A1A1AA" }}>
            {leads.length}
          </span>
        </div>

        {statusKey === "disqualified" && (
          <button
            onClick={() => setIsCollapsed(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "10px",
              color: "#A1A1AA",
            }}
          >
            Hide
          </button>
        )}
      </div>

      {/* Column Body / Stack */}
      <div
        style={{
          padding: "6px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          overflowY: "auto",
          flex: 1,
        }}
      >
        {leads.length === 0 ? (
          <div
            style={{
              padding: "16px 8px",
              textAlign: "center",
              fontSize: "11px",
              color: "#A1A1AA",
            }}
          >
            None
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={() => onSelectLead(lead.id)}
              isSelected={selectedLeadId === lead.id}
            />
          ))
        )}
      </div>
    </div>
  );
};
