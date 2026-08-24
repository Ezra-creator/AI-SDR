import React from "react";
import { PlusCircle, Play, Eye, Zap, Layers, ChevronRight } from "lucide-react";
import { ApprovalMode, CampaignRecord } from "../types/lead";

interface CampaignsTableProps {
  campaigns: Array<CampaignRecord & { lead_count?: number }>;
  onOpenNewCampaign: () => void;
  onSelectCampaignForPipeline: (campaignId: string) => void;
  onRunAgentForCampaign: (campaign: CampaignRecord) => void;
  isAgentRunning?: boolean;
}

export const CampaignsTable: React.FC<CampaignsTableProps> = ({
  campaigns,
  onOpenNewCampaign,
  onSelectCampaignForPipeline,
  onRunAgentForCampaign,
  isAgentRunning = false,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#18181B" }}>
            Target Campaigns ({campaigns.length})
          </h2>
          <p style={{ fontSize: "12px", color: "#71717A", marginTop: "2px" }}>
            Manage ICP targeting criteria, product value pitches, and outreach sequencing modes.
          </p>
        </div>

        <button
          onClick={onOpenNewCampaign}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
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
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Table */}
      {campaigns.length === 0 ? (
        <div
          style={{
            padding: "48px 20px",
            textAlign: "center",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E4E4E7",
            borderRadius: "6px",
          }}
        >
          <Layers size={32} color="#A1A1AA" style={{ margin: "0 auto 12px" }} />
          <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#18181B", marginBottom: "4px" }}>
            No campaigns created yet
          </h4>
          <p style={{ fontSize: "12px", color: "#71717A", marginBottom: "16px" }}>
            Launch your first campaign to define your ICP and start autonomous lead research.
          </p>
          <button
            onClick={onOpenNewCampaign}
            style={{
              padding: "7px 14px",
              backgroundColor: "#4338CA",
              color: "#FFFFFF",
              borderRadius: "4px",
              border: "none",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Create First Campaign
          </button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E4E4E7",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#FBFBFC", borderBottom: "1px solid #E4E4E7", color: "#71717A" }}>
                <th style={{ padding: "10px 14px", fontWeight: 600, width: "35%" }}>ICP Description</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, width: "30%" }}>Product Pitch</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Mode</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Leads</th>
                <th style={{ padding: "10px 14px", fontWeight: 600 }}>Created</th>
                <th style={{ padding: "10px 14px", fontWeight: 600, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const isAuto = c.approval_mode === "autonomous";
                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: "1px solid #F4F4F5",
                      transition: "background-color 0.1s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFAFA")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                  >
                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "#18181B" }}>
                      <div style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>
                        {c.icp_description}
                      </div>
                      <div style={{ fontSize: "11px", color: "#71717A", marginTop: "2px", fontWeight: 400 }}>
                        Sender: {c.sender_name} ({c.sender_company})
                      </div>
                    </td>

                    <td style={{ padding: "12px 14px", color: "#52525B" }}>
                      <div style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>
                        {c.product_pitch}
                      </div>
                    </td>

                    <td style={{ padding: "12px 14px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: "4px",
                          backgroundColor: isAuto ? "#F5F3FF" : "#F8FAFC",
                          color: isAuto ? "#6D28D9" : "#475569",
                          border: `1px solid ${isAuto ? "#DDD6FE" : "#CBD5E1"}`,
                        }}
                      >
                        {isAuto ? <Zap size={11} /> : <Eye size={11} />}
                        <span>{isAuto ? "Autonomous" : "Review"}</span>
                      </span>
                    </td>

                    <td style={{ padding: "12px 14px", fontWeight: 600, color: "#18181B" }}>
                      {c.lead_count ?? 0}
                    </td>

                    <td style={{ padding: "12px 14px", color: "#71717A", fontSize: "11px", whiteSpace: "nowrap" }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>

                    <td style={{ padding: "12px 14px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          onClick={() => onSelectCampaignForPipeline(c.id)}
                          style={{
                            padding: "4px 8px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E4E4E7",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "#4338CA",
                            cursor: "pointer",
                          }}
                        >
                          View Pipeline
                        </button>

                        <button
                          onClick={() => onRunAgentForCampaign(c)}
                          disabled={isAgentRunning}
                          title="Run Agent Pipeline for this campaign"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "3px",
                            padding: "4px 8px",
                            backgroundColor: "#4338CA",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#FFFFFF",
                            cursor: "pointer",
                          }}
                        >
                          <Play size={10} />
                          <span>Run SDR</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
