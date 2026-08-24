import React from "react";
import { CampaignRecord } from "../types/lead";

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
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#18181B" }}>
            Campaigns ({campaigns.length})
          </h2>
          <p style={{ fontSize: "11px", color: "#71717A" }}>
            Active targeting criteria and outbound sequencing.
          </p>
        </div>

        <button
          onClick={onOpenNewCampaign}
          style={{
            padding: "5px 12px",
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

      {/* Table */}
      {campaigns.length === 0 ? (
        <div style={{ padding: "32px 0", maxWidth: "480px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "#18181B", marginBottom: "4px" }}>
            No campaigns
          </h4>
          <p style={{ fontSize: "11px", color: "#71717A", marginBottom: "12px" }}>
            Create your first campaign to start discovering and researching leads.
          </p>
          <button
            onClick={onOpenNewCampaign}
            style={{
              padding: "5px 10px",
              backgroundColor: "#4338CA",
              color: "#FFFFFF",
              borderRadius: "3px",
              border: "none",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            New Campaign
          </button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E4E4E7",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#FBFBFC", borderBottom: "1px solid #E4E4E7", color: "#71717A", fontSize: "11px" }}>
                <th style={{ padding: "8px 12px", fontWeight: 600, width: "35%" }}>ICP Description</th>
                <th style={{ padding: "8px 12px", fontWeight: 600, width: "30%" }}>Pitch</th>
                <th style={{ padding: "8px 12px", fontWeight: 600 }}>Mode</th>
                <th style={{ padding: "8px 12px", fontWeight: 600 }}>Leads</th>
                <th style={{ padding: "8px 12px", fontWeight: 600 }}>Created</th>
                <th style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right" }}>Actions</th>
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
                    }}
                  >
                    <td style={{ padding: "8px 12px", color: "#18181B" }}>
                      <div style={{ fontWeight: 500, lineHeight: 1.35 }}>
                        {c.icp_description}
                      </div>
                      <div style={{ fontSize: "10px", color: "#71717A", marginTop: "1px" }}>
                        {c.sender_name} ({c.sender_company})
                      </div>
                    </td>

                    <td style={{ padding: "8px 12px", color: "#52525B" }}>
                      <div style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.35 }}>
                        {c.product_pitch}
                      </div>
                    </td>

                    <td style={{ padding: "8px 12px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 500,
                          padding: "1px 5px",
                          borderRadius: "2px",
                          backgroundColor: isAuto ? "#F5F3FF" : "#F4F4F5",
                          color: isAuto ? "#6D28D9" : "#52525B",
                          border: `1px solid ${isAuto ? "#DDD6FE" : "#E4E4E7"}`,
                        }}
                      >
                        {isAuto ? "Autonomous" : "Review"}
                      </span>
                    </td>

                    <td style={{ padding: "8px 12px", fontWeight: 500, color: "#18181B" }}>
                      {c.lead_count ?? 0}
                    </td>

                    <td style={{ padding: "8px 12px", color: "#71717A", fontSize: "11px", whiteSpace: "nowrap" }}>
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>

                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "4px" }}>
                        <button
                          onClick={() => onSelectCampaignForPipeline(c.id)}
                          style={{
                            padding: "3px 7px",
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E4E4E7",
                            borderRadius: "3px",
                            fontSize: "11px",
                            color: "#18181B",
                            cursor: "pointer",
                          }}
                        >
                          Pipeline
                        </button>

                        <button
                          onClick={() => onRunAgentForCampaign(c)}
                          disabled={isAgentRunning}
                          style={{
                            padding: "3px 8px",
                            backgroundColor: "#4338CA",
                            border: "none",
                            borderRadius: "3px",
                            fontSize: "11px",
                            fontWeight: 500,
                            color: "#FFFFFF",
                            cursor: "pointer",
                          }}
                        >
                          Run SDR
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
