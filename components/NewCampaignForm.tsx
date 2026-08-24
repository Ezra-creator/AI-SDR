import React, { useState } from "react";
import { ApprovalMode } from "../types/lead";

interface NewCampaignFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: () => void;
}

export const NewCampaignForm: React.FC<NewCampaignFormProps> = ({
  isOpen,
  onClose,
  onCampaignCreated,
}) => {
  const [icpDescription, setIcpDescription] = useState(
    "B2B SaaS product adoption and in-app user onboarding platforms"
  );
  const [productPitch, setProductPitch] = useState(
    "We provide an automated AI regression copilot that detects UI selector breakage in client onboarding walkthroughs and cuts SDK maintenance by 70%."
  );
  const [senderName, setSenderName] = useState("Alex Rivera");
  const [senderRole, setSenderRole] = useState("Head of Growth");
  const [senderCompany, setSenderCompany] = useState("PulseQA Engine");
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>("review");
  const [targetCount, setTargetCount] = useState<number>(3);
  const [runImmediate, setRunImmediate] = useState<boolean>(true);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [progressStage, setProgressStage] = useState<string>("");
  const [runError, setRunError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setRunError(null);
    setProgressStage("Creating campaign...");

    try {
      // 1. Create Campaign
      const campRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          icp_description: icpDescription,
          product_pitch: productPitch,
          sender_name: senderName,
          sender_role: senderRole,
          sender_company: senderCompany,
          approval_mode: approvalMode,
          follow_up_interval_days: 4,
          max_follow_ups: 3,
        }),
      });

      const campData = await campRes.json();
      if (!campRes.ok) throw new Error(campData.error || "Failed to create campaign");

      const campaignId = campData.campaign?.id;

      // 2. Trigger live agent pipeline
      if (runImmediate) {
        setProgressStage("Searching web for candidate leads...");

        const runRes = await fetch("/api/agent/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaign_id: campaignId,
            icp_description: icpDescription,
            product_pitch: productPitch,
            target_lead_count: targetCount,
            sender_name: senderName,
            sender_role: senderRole,
            sender_company: senderCompany,
            approval_mode: approvalMode,
          }),
        });

        const runData = await runRes.json();
        if (!runRes.ok) throw new Error(runData.error || "Failed during agent execution");

        setProgressStage("Research and scoring completed.");
      }

      onCampaignCreated();
      onClose();
    } catch (err: any) {
      setRunError(err.message || "An error occurred");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(24, 24, 27, 0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "520px",
          maxWidth: "100%",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E4E7",
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #E4E4E7",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: "13px", color: "#18181B" }}>
            New Campaign
          </div>

          <button
            onClick={onClose}
            disabled={isRunning}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#71717A", fontSize: "13px" }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {runError && (
            <div style={{ padding: "6px 8px", backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA", borderRadius: "3px", fontSize: "11px" }}>
              {runError}
            </div>
          )}

          {/* ICP Description */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#18181B", display: "block", marginBottom: "3px" }}>
              Ideal Customer Profile (ICP)
            </label>
            <textarea
              rows={2}
              required
              disabled={isRunning}
              value={icpDescription}
              onChange={(e) => setIcpDescription(e.target.value)}
              placeholder="e.g. B2B SaaS product adoption and in-app user onboarding platforms"
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: "3px",
                border: "1px solid #E4E4E7",
                fontSize: "12px",
                lineHeight: 1.35,
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Product Pitch */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#18181B", display: "block", marginBottom: "3px" }}>
              Value Pitch
            </label>
            <textarea
              rows={2}
              required
              disabled={isRunning}
              value={productPitch}
              onChange={(e) => setProductPitch(e.target.value)}
              placeholder="e.g. We provide an automated AI regression copilot that detects UI selector breakage in client onboarding walkthroughs and cuts SDK maintenance by 70%."
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: "3px",
                border: "1px solid #E4E4E7",
                fontSize: "12px",
                lineHeight: 1.35,
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Sender Context */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <div>
              <label style={{ fontSize: "10px", color: "#71717A", display: "block", marginBottom: "2px" }}>
                Sender Name
              </label>
              <input
                type="text"
                required
                disabled={isRunning}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                style={{ width: "100%", padding: "4px 6px", borderRadius: "3px", border: "1px solid #E4E4E7", fontSize: "11px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "10px", color: "#71717A", display: "block", marginBottom: "2px" }}>
                Role
              </label>
              <input
                type="text"
                required
                disabled={isRunning}
                value={senderRole}
                onChange={(e) => setSenderRole(e.target.value)}
                style={{ width: "100%", padding: "4px 6px", borderRadius: "3px", border: "1px solid #E4E4E7", fontSize: "11px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "10px", color: "#71717A", display: "block", marginBottom: "2px" }}>
                Company
              </label>
              <input
                type="text"
                required
                disabled={isRunning}
                value={senderCompany}
                onChange={(e) => setSenderCompany(e.target.value)}
                style={{ width: "100%", padding: "4px 6px", borderRadius: "3px", border: "1px solid #E4E4E7", fontSize: "11px" }}
              />
            </div>
          </div>

          {/* Mode & Target Count */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", paddingTop: "2px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#18181B", display: "block", marginBottom: "3px" }}>
                Mode
              </label>
              <div style={{ display: "flex", backgroundColor: "#F4F4F5", padding: "1px", borderRadius: "3px" }}>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setApprovalMode("review")}
                  style={{
                    flex: 1,
                    padding: "4px 0",
                    fontSize: "11px",
                    fontWeight: approvalMode === "review" ? 600 : 500,
                    backgroundColor: approvalMode === "review" ? "#FFFFFF" : "transparent",
                    color: approvalMode === "review" ? "#18181B" : "#71717A",
                    border: "none",
                    borderRadius: "2px",
                    cursor: "pointer",
                  }}
                >
                  Review
                </button>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setApprovalMode("autonomous")}
                  style={{
                    flex: 1,
                    padding: "4px 0",
                    fontSize: "11px",
                    fontWeight: approvalMode === "autonomous" ? 600 : 500,
                    backgroundColor: approvalMode === "autonomous" ? "#FFFFFF" : "transparent",
                    color: approvalMode === "autonomous" ? "#4338CA" : "#71717A",
                    border: "none",
                    borderRadius: "2px",
                    cursor: "pointer",
                  }}
                >
                  Autonomous
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#18181B", display: "block", marginBottom: "3px" }}>
                Target Count (1–10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                disabled={isRunning}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "4px 6px",
                  borderRadius: "3px",
                  border: "1px solid #E4E4E7",
                  fontSize: "11px",
                }}
              />
            </div>
          </div>

          {/* Progress */}
          {isRunning && (
            <div style={{ padding: "6px 8px", backgroundColor: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: "3px", color: "#3730A3", fontSize: "11px" }}>
              Pipeline active: {progressStage}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", paddingTop: "8px", borderTop: "1px solid #F4F4F5" }}>
            <button
              type="button"
              disabled={isRunning}
              onClick={onClose}
              style={{
                padding: "5px 10px",
                borderRadius: "3px",
                border: "1px solid #E4E4E7",
                backgroundColor: "#FFFFFF",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isRunning}
              style={{
                padding: "5px 12px",
                borderRadius: "3px",
                border: "none",
                backgroundColor: "#4338CA",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {isRunning ? "Running..." : "Launch Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
