import React, { useState } from "react";
import { X, Sparkles, Zap, Eye, Play, CheckCircle2, Loader2 } from "lucide-react";
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
    setProgressStage("Creating campaign record...");

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

      // 2. If runImmediate selected, trigger live agent pipeline
      if (runImmediate) {
        setProgressStage("Searching live web for matching candidate companies...");

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

        setProgressStage("Lead discovery, multi-source research & scoring completed!");
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
        backgroundColor: "rgba(24, 24, 27, 0.4)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "560px",
          maxWidth: "100%",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E4E7",
          borderRadius: "8px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #E4E4E7",
            backgroundColor: "#FBFBFC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "4px",
                backgroundColor: "#EEF2FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={14} color="#4338CA" />
            </div>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#18181B" }}>
                New Target Campaign
              </h3>
              <p style={{ fontSize: "11px", color: "#71717A" }}>
                Configure ICP targeting and execute autonomous SDR research
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isRunning}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#71717A" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {runError && (
            <div style={{ padding: "8px 12px", backgroundColor: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA", borderRadius: "4px", fontSize: "12px" }}>
              {runError}
            </div>
          )}

          {/* ICP Description */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#18181B", display: "block", marginBottom: "4px" }}>
              Ideal Customer Profile (ICP) Criteria *
            </label>
            <textarea
              rows={2}
              required
              disabled={isRunning}
              value={icpDescription}
              onChange={(e) => setIcpDescription(e.target.value)}
              placeholder="e.g. B2B SaaS product adoption and user onboarding software companies"
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #E4E4E7",
                fontSize: "12px",
                lineHeight: 1.4,
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Product Pitch */}
          <div>
            <label style={{ fontSize: "11px", fontWeight: 600, color: "#18181B", display: "block", marginBottom: "4px" }}>
              Product Value Pitch (What We Solve) *
            </label>
            <textarea
              rows={2}
              required
              disabled={isRunning}
              value={productPitch}
              onChange={(e) => setProductPitch(e.target.value)}
              placeholder="e.g. We provide an automated AI regression copilot that cuts onboarding SDK setup time by 70%."
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #E4E4E7",
                fontSize: "12px",
                lineHeight: 1.4,
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Sender Context Columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "10px", fontWeight: 600, color: "#71717A", display: "block", marginBottom: "3px" }}>
                Sender Name
              </label>
              <input
                type="text"
                required
                disabled={isRunning}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #E4E4E7", fontSize: "11px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "10px", fontWeight: 600, color: "#71717A", display: "block", marginBottom: "3px" }}>
                Sender Role
              </label>
              <input
                type="text"
                required
                disabled={isRunning}
                value={senderRole}
                onChange={(e) => setSenderRole(e.target.value)}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #E4E4E7", fontSize: "11px" }}
              />
            </div>

            <div>
              <label style={{ fontSize: "10px", fontWeight: 600, color: "#71717A", display: "block", marginBottom: "3px" }}>
                Company Name
              </label>
              <input
                type="text"
                required
                disabled={isRunning}
                value={senderCompany}
                onChange={(e) => setSenderCompany(e.target.value)}
                style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #E4E4E7", fontSize: "11px" }}
              />
            </div>
          </div>

          {/* Mode & Target Count */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", paddingTop: "4px" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#18181B", display: "block", marginBottom: "4px" }}>
                Approval Mode
              </label>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setApprovalMode("review")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    padding: "7px 8px",
                    borderRadius: "4px",
                    border: approvalMode === "review" ? "1.5px solid #4338CA" : "1px solid #E4E4E7",
                    backgroundColor: approvalMode === "review" ? "#EEF2FF" : "#FFFFFF",
                    color: approvalMode === "review" ? "#4338CA" : "#52525B",
                    fontSize: "11px",
                    fontWeight: approvalMode === "review" ? 600 : 500,
                    cursor: "pointer",
                  }}
                >
                  <Eye size={12} />
                  <span>Review Mode</span>
                </button>

                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setApprovalMode("autonomous")}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    padding: "7px 8px",
                    borderRadius: "4px",
                    border: approvalMode === "autonomous" ? "1.5px solid #7C3AED" : "1px solid #E4E4E7",
                    backgroundColor: approvalMode === "autonomous" ? "#F5F3FF" : "#FFFFFF",
                    color: approvalMode === "autonomous" ? "#7C3AED" : "#52525B",
                    fontSize: "11px",
                    fontWeight: approvalMode === "autonomous" ? 600 : 500,
                    cursor: "pointer",
                  }}
                >
                  <Zap size={12} />
                  <span>Autonomous</span>
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#18181B", display: "block", marginBottom: "4px" }}>
                Target Lead Count (3–10)
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
                  padding: "7px 8px",
                  borderRadius: "4px",
                  border: "1px solid #E4E4E7",
                  fontSize: "12px",
                }}
              />
            </div>
          </div>

          {/* Progress / Live status banner when running */}
          {isRunning && (
            <div
              style={{
                padding: "10px 12px",
                backgroundColor: "#EEF2FF",
                border: "1px solid #C7D2FE",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#3730A3",
                fontSize: "12px",
              }}
            >
              <Loader2 size={15} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
              <div>
                <strong>Agent Research Pipeline Active:</strong> {progressStage}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px", paddingTop: "12px", borderTop: "1px solid #F4F4F5" }}>
            <button
              type="button"
              disabled={isRunning}
              onClick={onClose}
              style={{
                padding: "7px 14px",
                borderRadius: "4px",
                border: "1px solid #E4E4E7",
                backgroundColor: "#FFFFFF",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isRunning}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 16px",
                borderRadius: "4px",
                border: "none",
                backgroundColor: "#4338CA",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {isRunning ? (
                <>
                  <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                  <span>Researching Leads...</span>
                </>
              ) : (
                <>
                  <Play size={12} />
                  <span>Launch Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
