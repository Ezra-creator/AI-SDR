import React from "react";

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
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 8px",
          backgroundColor: "#FEF2F2",
          border: "1px solid #FECACA",
          borderRadius: "3px",
          fontSize: "11px",
          color: "#991B1B",
          fontWeight: 500,
        }}
      >
        <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#DC2626" }} />
        <span>Production: Outbound live</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 8px",
        backgroundColor: "#F4F4F5",
        border: "1px solid #E4E4E7",
        borderRadius: "3px",
        fontSize: "11px",
        color: "#52525B",
      }}
    >
      <span
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          backgroundColor: "#16A34A",
        }}
      />
      <span>Test Mode: Outbound routed to <strong style={{ color: "#18181B" }}>{overrideEmail}</strong></span>
    </div>
  );
};
