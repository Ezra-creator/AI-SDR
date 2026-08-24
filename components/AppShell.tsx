"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Sidebar } from "./Sidebar";
import { PipelineBoard } from "./PipelineBoard";
import { CampaignsTable } from "./CampaignsTable";
import { SettingsPanel } from "./SettingsPanel";
import { LeadDetailPanel } from "./LeadDetailPanel";
import { NewCampaignForm } from "./NewCampaignForm";
import { TestModeBanner } from "./TestModeBanner";
import { ApprovalMode, CampaignRecord } from "../types/lead";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const AppShell: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<"pipeline" | "campaigns" | "settings">("pipeline");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState<boolean>(false);
  const [globalApprovalMode, setGlobalApprovalMode] = useState<ApprovalMode>("review");
  const [isUpdatingMode, setIsUpdatingMode] = useState<boolean>(false);

  // 1. Fetch campaigns
  const { data: campaignData, mutate: mutateCampaigns } = useSWR("/api/campaigns", fetcher, {
    refreshInterval: 8000,
  });
  const campaigns: CampaignRecord[] = campaignData?.campaigns || [];

  // 2. Fetch leads
  const leadsUrl = selectedCampaignId
    ? `/api/leads?campaignId=${selectedCampaignId}`
    : "/api/leads";
  const { data: leadsData, mutate: mutateLeads, isLoading: leadsLoading } = useSWR(
    leadsUrl,
    fetcher,
    { refreshInterval: 6000 }
  );
  const leads = leadsData?.leads || [];

  // 3. Fetch Settings
  const { data: settings } = useSWR("/api/settings", fetcher);

  const handleToggleApprovalMode = async (newMode: ApprovalMode) => {
    setGlobalApprovalMode(newMode);

    if (selectedCampaignId) {
      setIsUpdatingMode(true);
      try {
        await fetch(`/api/campaigns/${selectedCampaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approval_mode: newMode }),
        });
        mutateCampaigns();
        mutateLeads();
      } catch (err) {
        console.error("Error updating approval mode:", err);
      } finally {
        setIsUpdatingMode(false);
      }
    }
  };

  const handleRunAgentForCampaign = async (campaign: CampaignRecord) => {
    setSelectedCampaignId(campaign.id);
    setCurrentTab("pipeline");
    setIsNewCampaignOpen(true);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#FBFBFC" }}>
      {/* 1. Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setSelectedLeadId(null);
        }}
        campaigns={campaigns}
        selectedCampaignId={selectedCampaignId}
        onSelectCampaign={(id) => setSelectedCampaignId(id)}
        approvalMode={globalApprovalMode}
        onToggleApprovalMode={handleToggleApprovalMode}
        onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
        isUpdatingMode={isUpdatingMode}
      />

      {/* 2. Main Canvas */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header Bar */}
        <header
          style={{
            height: "44px",
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E4E4E7",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#18181B", textTransform: "capitalize" }}>
              {currentTab}
            </span>
            {selectedCampaignId && (
              <>
                <span style={{ color: "#A1A1AA", fontSize: "11px" }}>/</span>
                <span style={{ fontSize: "11px", color: "#4338CA" }}>
                  {campaigns.find((c) => c.id === selectedCampaignId)?.icp_description.substring(0, 28)}...
                </span>
              </>
            )}
          </div>

          {/* Right Header items */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TestModeBanner
              overrideEmail={settings?.testModeRecipientOverride}
              isActive={settings?.isTestOverrideActive}
            />

            <button
              onClick={() => {
                mutateLeads();
                mutateCampaigns();
              }}
              style={{
                padding: "3px 8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E4E7",
                borderRadius: "3px",
                fontSize: "11px",
                color: "#52525B",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>

            {currentTab === "pipeline" && (
              <button
                onClick={() => setIsNewCampaignOpen(true)}
                style={{
                  padding: "4px 10px",
                  backgroundColor: "#4338CA",
                  color: "#FFFFFF",
                  borderRadius: "3px",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                + New Campaign
              </button>
            )}
          </div>
        </header>

        {/* View Content */}
        <main style={{ padding: "16px 20px", flex: 1 }}>
          {currentTab === "pipeline" && (
            <PipelineBoard
              leads={leads}
              isLoading={leadsLoading}
              onSelectLead={(id) => setSelectedLeadId(id)}
              selectedLeadId={selectedLeadId}
              onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
              hasCampaigns={campaigns.length > 0}
            />
          )}

          {currentTab === "campaigns" && (
            <CampaignsTable
              campaigns={campaigns}
              onOpenNewCampaign={() => setIsNewCampaignOpen(true)}
              onSelectCampaignForPipeline={(id) => {
                setSelectedCampaignId(id);
                setCurrentTab("pipeline");
              }}
              onRunAgentForCampaign={handleRunAgentForCampaign}
            />
          )}

          {currentTab === "settings" && <SettingsPanel />}
        </main>
      </div>

      {/* Slide-in Lead Detail Drawer */}
      {selectedLeadId && (
        <LeadDetailPanel
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onLeadUpdated={() => {
            mutateLeads();
            mutateCampaigns();
          }}
        />
      )}

      {/* New Campaign Modal */}
      <NewCampaignForm
        isOpen={isNewCampaignOpen}
        onClose={() => setIsNewCampaignOpen(false)}
        onCampaignCreated={() => {
          mutateCampaigns();
          mutateLeads();
        }}
      />
    </div>
  );
};
