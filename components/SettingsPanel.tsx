import React from "react";
import useSWR from "swr";
import { TestModeBanner } from "./TestModeBanner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const SettingsPanel: React.FC = () => {
  const { data: settings } = useSWR("/api/settings", fetcher);

  return (
    <div style={{ maxWidth: "680px", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#18181B" }}>
          Settings & Safety Controls
        </h2>
        <p style={{ fontSize: "11px", color: "#71717A" }}>
          Pipeline safety parameters and infrastructure status.
        </p>
      </div>

      {/* Flattened Definition List / Settings Grid */}
      <div style={{ borderTop: "1px solid #E4E4E7", display: "flex", flexDirection: "column" }}>
        {/* Row 1: Safety Guardrail */}
        <div style={{ padding: "12px 0", borderBottom: "1px solid #E4E4E7", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#18181B" }}>Recipient Override</span>
            <TestModeBanner
              overrideEmail={settings?.testModeRecipientOverride}
              isActive={settings?.isTestOverrideActive}
            />
          </div>
          <p style={{ fontSize: "11px", color: "#71717A", lineHeight: 1.35 }}>
            When active, all outbound outreach is redirected exclusively to the designated override email. Real recipient domains will never be contacted.
          </p>
        </div>

        {/* Row 2: Follow-up Cadence */}
        <div style={{ padding: "12px 0", borderBottom: "1px solid #E4E4E7", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "#18181B" }}>Follow-up Cadence</div>
            <div style={{ fontSize: "11px", color: "#71717A", marginTop: "2px" }}>
              Interval between automated sequence follow-ups
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#18181B" }}>4 Business Days</span>
            <div style={{ fontSize: "10px", color: "#A1A1AA" }}>Max 3 follow-ups (4 total)</div>
          </div>
        </div>

        {/* Row 3: Angle Diversity */}
        <div style={{ padding: "12px 0", borderBottom: "1px solid #E4E4E7", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "#18181B" }}>Angle Diversity Enforcement</div>
            <div style={{ fontSize: "11px", color: "#71717A", marginTop: "2px" }}>
              Rotates across Pain Point Focus, Recent News, SDK Architecture, and Breakup Permission
            </div>
          </div>
          <span style={{ fontSize: "11px", color: "#059669", fontWeight: 500 }}>Active</span>
        </div>

        {/* Row 4: Groq Inference Engine */}
        <div style={{ padding: "12px 0", borderBottom: "1px solid #E4E4E7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "#18181B" }}>Groq Model</div>
            <div style={{ fontSize: "11px", color: "#71717A" }}>Live verified LLM orchestrator</div>
          </div>
          <code style={{ fontSize: "11px", backgroundColor: "#F4F4F5", padding: "2px 6px", borderRadius: "3px", color: "#18181B" }}>
            {settings?.defaultModel || "openai/gpt-oss-120b"}
          </code>
        </div>

        {/* Row 5: Database Connection */}
        <div style={{ padding: "12px 0", borderBottom: "1px solid #E4E4E7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "#18181B" }}>Database Persistence</div>
            <div style={{ fontSize: "11px", color: "#71717A" }}>Neon Serverless Postgres / Local Fallback</div>
          </div>
          <span style={{ fontSize: "11px", color: settings?.isDbConfigured ? "#059669" : "#71717A" }}>
            {settings?.isDbConfigured ? "Connected" : "In-Memory Store"}
          </span>
        </div>

        {/* Row 6: Resend Email Engine */}
        <div style={{ padding: "12px 0", borderBottom: "1px solid #E4E4E7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "#18181B" }}>Resend Email Delivery</div>
            <div style={{ fontSize: "11px", color: "#71717A" }}>Outbound SMTP / API transport</div>
          </div>
          <span style={{ fontSize: "11px", color: settings?.isResendConfigured ? "#059669" : "#71717A" }}>
            {settings?.isResendConfigured ? "Configured" : "Mock Safe Mode"}
          </span>
        </div>
      </div>
    </div>
  );
};
