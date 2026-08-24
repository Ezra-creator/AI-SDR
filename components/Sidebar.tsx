import React from "react";
import { ApprovalMode, CampaignRecord } from "../types/lead";

interface SidebarProps {
  currentTab: "pipeline" | "campaigns" | "settings";
  onSelectTab: (tab: "pipeline" | "campaigns" | "settings") => void;
  campaigns: CampaignRecord[];
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string | null) => void;
  approvalMode: ApprovalMode;
  onToggleApprovalMode: (mode: ApprovalMode) => void;
  onOpenNewCampaign: () => void;
  isUpdatingMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
  approvalMode,
  onToggleApprovalMode,
  onOpenNewCampaign,
  isUpdatingMode = false,
}) => {
  const activeCampaign = campaigns.find((c) => c.id === selectedCampaignId);
  const currentMode = activeCampaign ? activeCampaign.approval_mode : approvalMode;

  return (
    <aside
      style={{
        width: "220px",
        height: "100vh",
        backgroundColor: "#FFFFFF",
        borderRight: "1px solid #E4E4E7",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 20,
        userSelect: "none",
      }}
    >
      {/* 1. Header Wordmark */}
      <div
        style={{
          padding: "14px 14px 10px 14px",
          borderBottom: "1px solid #F4F4F5",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "13px", letterSpacing: "0.02em", color: "#18181B" }}>
          VANGUARD <span style={{ color: "#4338CA" }}>SDR</span>
        </div>
        <div style={{ fontSize: "10px", color: "#A1A1AA", fontWeight: 400 }}>
          Lead Intelligence Engine
        </div>
      </div>

      {/* 2. Navigation List */}
      <nav style={{ padding: "8px 6px", display: "flex", flexDirection: "column", gap: "1px" }}>
        <button
          onClick={() => onSelectTab("pipeline")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "6px 8px",
            borderRadius: "3px",
            border: "none",
            backgroundColor: currentTab === "pipeline" ? "#F4F4F5" : "transparent",
            color: currentTab === "pipeline" ? "#18181B" : "#71717A",
            fontWeight: currentTab === "pipeline" ? 600 : 400,
            fontSize: "12px",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span>Pipeline</span>
        </button>

        <button
          onClick={() => onSelectTab("campaigns")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "6px 8px",
            borderRadius: "3px",
            border: "none",
            backgroundColor: currentTab === "campaigns" ? "#F4F4F5" : "transparent",
            color: currentTab === "campaigns" ? "#18181B" : "#71717A",
            fontWeight: currentTab === "campaigns" ? 600 : 400,
            fontSize: "12px",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span>Campaigns</span>
          <span style={{ fontSize: "10px", color: "#A1A1AA" }}>
            {campaigns.length}
          </span>
        </button>

        <button
          onClick={() => onSelectTab("settings")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "6px 8px",
            borderRadius: "3px",
            border: "none",
            backgroundColor: currentTab === "settings" ? "#F4F4F5" : "transparent",
            color: currentTab === "settings" ? "#18181B" : "#71717A",
            fontWeight: currentTab === "settings" ? 600 : 400,
            fontSize: "12px",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span>Settings</span>
        </button>
      </nav>

      {/* 3. Campaign Scope Filter */}
      <div style={{ padding: "8px 10px", marginTop: "4px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: 600, color: "#A1A1AA", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Scope
          </span>
          <button
            onClick={onOpenNewCampaign}
            style={{
              fontSize: "10px",
              color: "#4338CA",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            + New
          </button>
        </div>

        <select
          value={selectedCampaignId || ""}
          onChange={(e) => onSelectCampaign(e.target.value || null)}
          style={{
            width: "100%",
            padding: "4px 6px",
            borderRadius: "3px",
            border: "1px solid #E4E4E7",
            backgroundColor: "#FFFFFF",
            fontSize: "11px",
            color: "#18181B",
            cursor: "pointer",
          }}
        >
          <option value="">All Campaigns ({campaigns.length})</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icp_description.length > 24
                ? c.icp_description.substring(0, 24) + "..."
                : c.icp_description}
            </option>
          ))}
        </select>
      </div>

      <div style={{ flex: 1 }} />

      {/* 4. Execution Mode Segmented Control */}
      <div
        style={{
          margin: "10px",
          padding: "8px",
          backgroundColor: "#FBFBFC",
          border: "1px solid #E4E4E7",
          borderRadius: "4px",
        }}
      >
        <div style={{ fontSize: "10px", fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: "6px" }}>
          Outbound Mode
        </div>

        <div style={{ display: "flex", backgroundColor: "#E4E4E7", borderRadius: "3px", padding: "1px" }}>
          <button
            onClick={() => onToggleApprovalMode("review")}
            disabled={isUpdatingMode}
            style={{
              flex: 1,
              padding: "4px 0",
              fontSize: "10px",
              fontWeight: currentMode === "review" ? 600 : 500,
              backgroundColor: currentMode === "review" ? "#FFFFFF" : "transparent",
              color: currentMode === "review" ? "#18181B" : "#71717A",
              border: "none",
              borderRadius: "2px",
              cursor: "pointer",
            }}
          >
            Review
          </button>
          <button
            onClick={() => onToggleApprovalMode("autonomous")}
            disabled={isUpdatingMode}
            style={{
              flex: 1,
              padding: "4px 0",
              fontSize: "10px",
              fontWeight: currentMode === "autonomous" ? 600 : 500,
              backgroundColor: currentMode === "autonomous" ? "#FFFFFF" : "transparent",
              color: currentMode === "autonomous" ? "#4338CA" : "#71717A",
              border: "none",
              borderRadius: "2px",
              cursor: "pointer",
            }}
          >
            Autonomous
          </button>
        </div>

        <div style={{ fontSize: "10px", color: "#A1A1AA", marginTop: "4px", lineHeight: 1.25 }}>
          {currentMode === "review"
            ? "Requires manual approval before send."
            : "Sends qualified drafts immediately."}
        </div>
      </div>
    </aside>
  );
};
