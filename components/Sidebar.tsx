import React from "react";
import {
  Kanban,
  Layers,
  Settings,
  Shield,
  Zap,
  Eye,
  PlusCircle,
} from "lucide-react";
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
        width: "240px",
        height: "100vh",
        backgroundColor: "#FFFFFF",
        borderRight: "1px solid #E4E4E7",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      {/* 1. Header / Logo Wordmark */}
      <div
        style={{
          padding: "16px 16px 12px 16px",
          borderBottom: "1px solid #F4F4F5",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            backgroundColor: "#4338CA",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontWeight: 700,
            fontSize: "12px",
            letterSpacing: "-0.05em",
          }}
        >
          V
        </div>
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: "13px",
              letterSpacing: "0.02em",
              color: "#18181B",
              lineHeight: 1.2,
            }}
          >
            VANGUARD <span style={{ color: "#4338CA" }}>SDR</span>
          </div>
          <div style={{ fontSize: "10px", color: "#A1A1AA", fontWeight: 500 }}>
            Lead Intelligence Engine
          </div>
        </div>
      </div>

      {/* 2. Navigation Items */}
      <nav style={{ padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
        <button
          onClick={() => onSelectTab("pipeline")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            width: "100%",
            padding: "7px 10px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: currentTab === "pipeline" ? "#EEF2FF" : "transparent",
            color: currentTab === "pipeline" ? "#4338CA" : "#52525B",
            fontWeight: currentTab === "pipeline" ? 600 : 500,
            fontSize: "12px",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.12s ease",
          }}
        >
          <Kanban size={15} color={currentTab === "pipeline" ? "#4338CA" : "#71717A"} />
          <span>Pipeline</span>
        </button>

        <button
          onClick={() => onSelectTab("campaigns")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            width: "100%",
            padding: "7px 10px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: currentTab === "campaigns" ? "#EEF2FF" : "transparent",
            color: currentTab === "campaigns" ? "#4338CA" : "#52525B",
            fontWeight: currentTab === "campaigns" ? 600 : 500,
            fontSize: "12px",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.12s ease",
          }}
        >
          <Layers size={15} color={currentTab === "campaigns" ? "#4338CA" : "#71717A"} />
          <span>Campaigns</span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "10px",
              padding: "1px 6px",
              borderRadius: "10px",
              backgroundColor: currentTab === "campaigns" ? "#C7D2FE" : "#F4F4F5",
              color: currentTab === "campaigns" ? "#312E81" : "#71717A",
              fontWeight: 600,
            }}
          >
            {campaigns.length}
          </span>
        </button>

        <button
          onClick={() => onSelectTab("settings")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            width: "100%",
            padding: "7px 10px",
            borderRadius: "4px",
            border: "none",
            backgroundColor: currentTab === "settings" ? "#EEF2FF" : "transparent",
            color: currentTab === "settings" ? "#4338CA" : "#52525B",
            fontWeight: currentTab === "settings" ? 600 : 500,
            fontSize: "12px",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.12s ease",
          }}
        >
          <Settings size={15} color={currentTab === "settings" ? "#4338CA" : "#71717A"} />
          <span>Settings</span>
        </button>
      </nav>

      {/* 3. Campaign Quick Switcher */}
      <div style={{ padding: "8px 12px", marginTop: "4px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "6px",
          }}
        >
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#71717A", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Active Campaign
          </span>
          <button
            onClick={onOpenNewCampaign}
            title="Create New Campaign"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "11px",
              color: "#4338CA",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            <PlusCircle size={13} />
            <span>New</span>
          </button>
        </div>

        <select
          value={selectedCampaignId || ""}
          onChange={(e) => onSelectCampaign(e.target.value || null)}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: "4px",
            border: "1px solid #E4E4E7",
            backgroundColor: "#FBFBFC",
            fontSize: "11px",
            color: "#18181B",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <option value="">All Campaigns ({campaigns.length})</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icp_description.length > 28
                ? c.icp_description.substring(0, 28) + "..."
                : c.icp_description}
            </option>
          ))}
        </select>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* 4. Mode Switcher (Review Mode vs Autonomous Mode) */}
      <div
        style={{
          margin: "12px",
          padding: "10px",
          backgroundColor: currentMode === "autonomous" ? "#F5F3FF" : "#F8FAFC",
          border: `1px solid ${currentMode === "autonomous" ? "#DDD6FE" : "#E2E8F0"}`,
          borderRadius: "6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            {currentMode === "autonomous" ? (
              <Zap size={14} color="#7C3AED" />
            ) : (
              <Eye size={14} color="#475569" />
            )}
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: currentMode === "autonomous" ? "#6D28D9" : "#334155",
                letterSpacing: "0.02em",
              }}
            >
              {currentMode === "autonomous" ? "AUTONOMOUS MODE" : "REVIEW MODE"}
            </span>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => onToggleApprovalMode(currentMode === "review" ? "autonomous" : "review")}
            disabled={isUpdatingMode}
            title={
              currentMode === "review"
                ? "Switch to Autonomous Mode (Auto-send immediately upon generation)"
                : "Switch to Review Mode (Stage drafts for manual approval)"
            }
            style={{
              position: "relative",
              width: "32px",
              height: "18px",
              borderRadius: "10px",
              backgroundColor: currentMode === "autonomous" ? "#7C3AED" : "#CBD5E1",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.15s ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "2px",
                left: currentMode === "autonomous" ? "16px" : "2px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: "#FFFFFF",
                transition: "left 0.15s ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
              }}
            />
          </button>
        </div>

        <div style={{ fontSize: "10px", color: currentMode === "autonomous" ? "#5B21B6" : "#64748B", lineHeight: 1.3 }}>
          {currentMode === "autonomous"
            ? "Leads scoring ≥60 are auto-emailed immediately via Resend."
            : "Emails stay in 'pending approval' until manually approved."}
        </div>
      </div>
    </aside>
  );
};
