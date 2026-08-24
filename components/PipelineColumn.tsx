import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { LeadCard } from "./LeadCard";
import { StatusBadge } from "./StatusBadge";

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
          height: "calc(100vh - 160px)",
          backgroundColor: "#F4F4F5",
          border: "1px solid #E4E4E7",
          borderRadius: "6px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "12px 0",
          gap: "12px",
          cursor: "pointer",
          userSelect: "none",
        }}
        title={`Expand ${title} (${leads.length})`}
      >
        <ChevronRight size={14} color="#71717A" />
        <span
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontSize: "11px",
            fontWeight: 600,
            color: "#52525B",
            letterSpacing: "0.02em",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            padding: "2px 4px",
            borderRadius: "10px",
            backgroundColor: "#E4E4E7",
            color: "#52525B",
          }}
        >
          {leads.length}
        </span>
      </div>
    );
  }

  return (
    <div className="kanban-col">
      {/* Column Header */}
      <div
        style={{
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #E4E4E7",
          backgroundColor: "#FFFFFF",
          borderTopLeftRadius: "5px",
          borderTopRightRadius: "5px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              backgroundColor: dotColor,
              display: "inline-block",
            }}
          />
          <span style={{ fontWeight: 600, fontSize: "12px", color: "#18181B" }}>
            {title}
          </span>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 600,
              padding: "1px 5px",
              borderRadius: "10px",
              backgroundColor: "#F4F4F5",
              color: "#71717A",
              border: "1px solid #E4E4E7",
            }}
          >
            {leads.length}
          </span>
        </div>

        {statusKey === "disqualified" && (
          <button
            onClick={() => setIsCollapsed(true)}
            title="Collapse column"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronDown size={14} color="#71717A" />
          </button>
        )}
      </div>

      {/* Column Body / Card Stack */}
      <div
        style={{
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          overflowY: "auto",
          flex: 1,
        }}
      >
        {leads.length === 0 ? (
          <div
            style={{
              padding: "24px 12px",
              textAlign: "center",
              fontSize: "11px",
              color: "#A1A1AA",
              fontStyle: "italic",
            }}
          >
            No leads in this stage
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
