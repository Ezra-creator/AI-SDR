import React from "react";
import useSWR from "swr";
import {
  ShieldCheck,
  Cpu,
  Database,
  Mail,
  Clock,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { TestModeBanner } from "./TestModeBanner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const SettingsPanel: React.FC = () => {
  const { data: settings } = useSWR("/api/settings", fetcher);

  return (
    <div style={{ maxWidth: "720px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Title */}
      <div>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#18181B" }}>
          Pipeline Engine Settings & Safety Controls
        </h2>
        <p style={{ fontSize: "12px", color: "#71717A", marginTop: "2px" }}>
          Configure SDR safety overrides, autonomous sending parameters, and AI model orchestration.
        </p>
      </div>

      {/* 1. Safety Override Section */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E4E7",
          borderRadius: "6px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={16} color="#059669" />
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#18181B" }}>
            Critical Outbound Safety Guardrails
          </h3>
        </div>

        <TestModeBanner
          overrideEmail={settings?.testModeRecipientOverride}
          isActive={settings?.isTestOverrideActive}
        />

        <p style={{ fontSize: "12px", color: "#52525B", lineHeight: 1.45 }}>
          Vanguard SDR is engineered with a code-enforced recipient safety interceptor. When active, <strong>no real third-party domains will receive outreach</strong>; all emails are automatically redirected to your designated test address with an audit header.
        </p>
      </div>

      {/* 2. Automated Follow-Up Configuration */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E4E7",
          borderRadius: "6px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Clock size={16} color="#7C3AED" />
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#18181B" }}>
            Automated Follow-Up Cadence & Angle Diversity
          </h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ padding: "10px", backgroundColor: "#FBFBFC", border: "1px solid #E4E4E7", borderRadius: "4px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#71717A" }}>
              Default Follow-Up Interval
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181B", marginTop: "2px" }}>
              4 Business Days
            </div>
          </div>

          <div style={{ padding: "10px", backgroundColor: "#FBFBFC", border: "1px solid #E4E4E7", borderRadius: "4px" }}>
            <div style={{ fontSize: "11px", fontWeight: 600, color: "#71717A" }}>
              Maximum Follow-Up Emails
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#18181B", marginTop: "2px" }}>
              3 Follow-Ups (4 total)
            </div>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "#52525B", lineHeight: 1.4 }}>
          Each follow-up automatically rotates among distinct angles: <em>Recent News Hooks</em>, <em>SDK Architecture Observations</em>, <em>Quantifiable ROI Metrics</em>, and <em>Breakup Permission</em>.
        </div>
      </div>

      {/* 3. Infrastructure & AI Integration Status */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E4E7",
          borderRadius: "6px",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Cpu size={16} color="#4338CA" />
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#18181B" }}>
            Active AI & Backend Services
          </h3>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "#FBFBFC", border: "1px solid #F4F4F5", borderRadius: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Cpu size={14} color="#4338CA" />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#18181B" }}>Groq LLM Engine</span>
            </div>
            <span style={{ fontSize: "11px", color: "#4338CA", fontWeight: 600 }}>
              {settings?.defaultModel || "openai/gpt-oss-120b (Active)"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "#FBFBFC", border: "1px solid #F4F4F5", borderRadius: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Database size={14} color="#059669" />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#18181B" }}>Neon Serverless Postgres</span>
            </div>
            <span style={{ fontSize: "11px", color: settings?.isDbConfigured ? "#059669" : "#71717A", fontWeight: 600 }}>
              {settings?.isDbConfigured ? "Connected ✅" : "Mock In-Memory"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "#FBFBFC", border: "1px solid #F4F4F5", borderRadius: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Mail size={14} color="#D97706" />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#18181B" }}>Resend Email API</span>
            </div>
            <span style={{ fontSize: "11px", color: settings?.isResendConfigured ? "#059669" : "#71717A", fontWeight: 600 }}>
              {settings?.isResendConfigured ? "Configured ✅" : "Mock Safe Mode"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
