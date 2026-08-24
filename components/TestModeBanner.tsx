import React from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface TestModeBannerProps {
  overrideEmail?: string;
  isActive?: boolean;
}

export const TestModeBanner: React.FC<TestModeBannerProps> = ({
  overrideEmail = "test-sdr-recipient@example.com",
  isActive = true,
}) => {
  if (!isActive) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          backgroundColor: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: "4px",
          fontSize: "11px",
          color: "#991B1B",
          fontWeight: 500,
        }}
      >
        <AlertTriangle size={13} color="#DC2626" />
        <span>Live Production: Emails will reach real recipients</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        padding: "5px 12px",
        backgroundColor: "#F0FDF4",
        border: "1px solid #BBF7D0",
        borderRadius: "4px",
        fontSize: "11px",
        color: "#166534",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <ShieldCheck size={14} color="#16A34A" />
        <span style={{ fontWeight: 600 }}>SAFETY OVERRIDE ACTIVE:</span>
        <span style={{ color: "#15803D" }}>
          All outbound emails route strictly to <strong>{overrideEmail}</strong>
        </span>
      </div>
      <span
        style={{
          fontSize: "10px",
          padding: "1px 5px",
          backgroundColor: "#DCFCE7",
          border: "1px solid #86EFAC",
          borderRadius: "3px",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        FAIL-SAFE ON
      </span>
    </div>
  );
};
