import React, { useState } from "react";
import { PipelineColumn } from "./PipelineColumn";
import { LeadCard } from "./LeadCard";

interface PipelineBoardProps {
  leads: any[];
  isLoading: boolean;
  onSelectLead: (leadId: string) => void;
  selectedLeadId: string | null;
  onOpenNewCampaign: () => void;
  hasCampaigns: boolean;
}

const COLUMNS = [
  { key: "researched", title: "Researched", dotColor: "#64748B", statuses: ["researched"] },
  { key: "scored", title: "Scored", dotColor: "#2563EB", statuses: ["scored"] },
  { key: "pending_approval", title: "Pending Approval", dotColor: "#D97706", statuses: ["pending_approval", "outreach_generated"] },
  { key: "sent", title: "Sent", dotColor: "#4F46E5", statuses: ["sent"] },
  { key: "followed_up", title: "Followed Up", dotColor: "#7C3AED", statuses: ["followed_up"] },
  { key: "replied", title: "Replied", dotColor: "#059669", statuses: ["replied"] },
  { key: "disqualified", title: "Disqualified", dotColor: "#E11D48", statuses: ["disqualified"], defaultCollapsed: true },
];

export const PipelineBoard: React.FC<PipelineBoardProps> = ({
  leads,
  isLoading,
  onSelectLead,
  selectedLeadId,
  onOpenNewCampaign,
  hasCampaigns,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileActiveTab, setMobileActiveTab] = useState("pending_approval");

  const filteredLeads = leads.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.company_name?.toLowerCase().includes(q) ||
      l.domain?.toLowerCase().includes(q) ||
      l.company_summary?.toLowerCase().includes(q)
    );
  });

  // Empty state: No campaigns yet
  if (!isLoading && !hasCampaigns && leads.length === 0) {
    return (
      <div
        style={{
          padding: "32px 0",
          maxWidth: "480px",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#18181B", marginBottom: "4px" }}>
          No campaigns created
        </h3>
        <p style={{ fontSize: "12px", color: "#71717A", lineHeight: 1.45, marginBottom: "12px" }}>
          Create a campaign with an Ideal Customer Profile (ICP) and value pitch to discover and research prospects.
        </p>
        <button
          onClick={onOpenNewCampaign}
          style={{
            padding: "6px 12px",
            backgroundColor: "#4338CA",
            color: "#FFFFFF",
            borderRadius: "3px",
            border: "none",
            fontSize: "12px",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          New Campaign
        </button>
      </div>
    );
  }

  const getColumnLeads = (statuses: string[]) => {
    return filteredLeads.filter((l) => statuses.includes(l.status));
  };

  const currentMobileColumn = COLUMNS.find((c) => c.key === mobileActiveTab) || COLUMNS[2];
  const mobileLeads = getColumnLeads(currentMobileColumn.statuses);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
      {/* Top Filter Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <input
          type="text"
          placeholder="Filter leads..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "220px",
            padding: "5px 8px",
            borderRadius: "3px",
            border: "1px solid #E4E4E7",
            backgroundColor: "#FFFFFF",
            fontSize: "11px",
            color: "#18181B",
          }}
        />

        <span style={{ fontSize: "11px", color: "#71717A" }}>
          {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}
        </span>
      </div>

      {/* Desktop Kanban */}
      <div className="pipeline-board">
        {COLUMNS.map((col) => {
          const colLeads = getColumnLeads(col.statuses);
          return (
            <PipelineColumn
              key={col.key}
              statusKey={col.key}
              title={col.title}
              dotColor={col.dotColor}
              leads={colLeads}
              onSelectLead={onSelectLead}
              selectedLeadId={selectedLeadId}
              defaultCollapsed={col.defaultCollapsed}
            />
          );
        })}
      </div>

      {/* Mobile Stream */}
      <div className="pipeline-mobile-view" style={{ display: "none" }}>
        <div
          style={{
            display: "flex",
            gap: "4px",
            overflowX: "auto",
            paddingBottom: "6px",
            borderBottom: "1px solid #E4E4E7",
            marginBottom: "8px",
          }}
        >
          {COLUMNS.map((col) => {
            const count = getColumnLeads(col.statuses).length;
            const isTabActive = mobileActiveTab === col.key;
            return (
              <button
                key={col.key}
                onClick={() => setMobileActiveTab(col.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 8px",
                  borderRadius: "3px",
                  border: isTabActive ? "1px solid #4338CA" : "1px solid #E4E4E7",
                  backgroundColor: isTabActive ? "#F4F4F5" : "#FFFFFF",
                  color: isTabActive ? "#18181B" : "#71717A",
                  fontSize: "11px",
                  fontWeight: isTabActive ? 600 : 400,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    backgroundColor: col.dotColor,
                  }}
                />
                <span>{col.title}</span>
                <span style={{ fontSize: "10px", color: "#A1A1AA" }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {mobileLeads.length === 0 ? (
            <div style={{ padding: "20px 0", color: "#A1A1AA", fontSize: "11px" }}>
              No leads in {currentMobileColumn.title}
            </div>
          ) : (
            mobileLeads.map((lead) => (
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

      <style jsx>{`
        @media (max-width: 768px) {
          .pipeline-mobile-view {
            display: flex !important;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
