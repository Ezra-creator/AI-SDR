import React, { useState } from "react";
import { PipelineColumn } from "./PipelineColumn";
import { LeadCard } from "./LeadCard";
import { PlusCircle, Search, Filter, Sparkles, Inbox } from "lucide-react";

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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 20px",
          textAlign: "center",
          maxWidth: "460px",
          margin: "40px auto",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E4E7",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "6px",
            backgroundColor: "#EEF2FF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <Sparkles size={20} color="#4338CA" />
        </div>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#18181B", marginBottom: "6px" }}>
          No leads discovered yet
        </h3>
        <p style={{ fontSize: "12px", color: "#71717A", lineHeight: 1.5, marginBottom: "20px" }}>
          Create your first target campaign with an Ideal Customer Profile (ICP) and value pitch. Vanguard SDR will discover real companies on the live web, research verified facts, and score qualification.
        </p>
        <button
          onClick={onOpenNewCampaign}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            backgroundColor: "#4338CA",
            color: "#FFFFFF",
            borderRadius: "4px",
            border: "none",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <PlusCircle size={14} />
          <span>Create First Campaign</span>
        </button>
      </div>
    );
  }

  // Filter leads into columns
  const getColumnLeads = (statuses: string[]) => {
    return filteredLeads.filter((l) => statuses.includes(l.status));
  };

  const currentMobileColumn = COLUMNS.find((c) => c.key === mobileActiveTab) || COLUMNS[2];
  const mobileLeads = getColumnLeads(currentMobileColumn.statuses);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      {/* Top Filter & Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", width: "260px" }}>
          <Search
            size={13}
            color="#A1A1AA"
            style={{ position: "absolute", left: "9px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search company, domain, summary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "6px 8px 6px 28px",
              borderRadius: "4px",
              border: "1px solid #E4E4E7",
              backgroundColor: "#FFFFFF",
              fontSize: "12px",
              color: "#18181B",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#71717A", fontWeight: 500 }}>
            Total Leads: <strong>{filteredLeads.length}</strong>
          </span>
        </div>
      </div>

      {/* 1. Desktop Kanban Board */}
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

      {/* 2. Mobile Responsive Tabbed List View */}
      <div className="pipeline-mobile-view" style={{ display: "none" }}>
        {/* Mobile Stage Selector Tabs */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            overflowX: "auto",
            paddingBottom: "8px",
            borderBottom: "1px solid #E4E4E7",
            marginBottom: "12px",
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
                  gap: "5px",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  border: isTabActive ? "1px solid #4338CA" : "1px solid #E4E4E7",
                  backgroundColor: isTabActive ? "#EEF2FF" : "#FFFFFF",
                  color: isTabActive ? "#4338CA" : "#52525B",
                  fontSize: "11px",
                  fontWeight: isTabActive ? 600 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: col.dotColor,
                  }}
                />
                <span>{col.title}</span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "1px 4px",
                    borderRadius: "8px",
                    backgroundColor: isTabActive ? "#C7D2FE" : "#F4F4F5",
                    color: isTabActive ? "#312E81" : "#71717A",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Vertical List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {mobileLeads.length === 0 ? (
            <div
              style={{
                padding: "32px 16px",
                textAlign: "center",
                color: "#A1A1AA",
                fontSize: "12px",
                fontStyle: "italic",
              }}
            >
              No leads in {currentMobileColumn.title} stage
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
