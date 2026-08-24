"use client";

import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import { Sidebar } from "./Sidebar";
import { PipelineBoard } from "./PipelineBoard";
import { CampaignsTable } from "./CampaignsTable";
import { SettingsPanel } from "./SettingsPanel";
import { LeadDetailPanel } from "./LeadDetailPanel";
import { NewCampaignForm } from "./NewCampaignForm";
import { TestModeBanner } from "./TestModeBanner";
import { ApprovalMode, CampaignRecord } from "../types/lead";
import { PlusCircle, RefreshCw } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const AppShell: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<"pipeline" | "campaigns" | "settings">("pipeline");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState<boolean>(false);
  const [globalApprovalMode, setGlobalApprovalMode] = useState<ApprovalMode>("review");
  const [isUpdatingMode, setIsUpdatingMode] = useState<boolean>(false);

  // 1. Fetch campaigns with auto-revalidation
  const { data: campaignData, mutate: mutateCampaigns } = useSWR("/api/campaigns", fetcher, {
    refreshInterval: 8000,
  });
  const campaigns: CampaignRecord[] = campaignData?.campaigns || [];

  // 2. Fetch leads (filtered by selectedCampaignId if set)
  const leadsUrl = selectedCampaignId
    ? `/api/leads?campaignId=${selectedCampaignId}`
    : "/api/leads";
  const { data: leadsData, mutate: mutateLeads, isLoading: leadsLoading, isValidating } = useSWR(
    leadsUrl,
    fetcher,
    { refreshInterval: 6000 }
  );
  const leads = leadsData?.leads || [];

  // 3. Fetch Settings
  const { data: settings } = useSWR("/api/settings", fetcher);

  // Mode Toggle Handler
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
      {/* 1. Persistent Sidebar */}
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

      {/* 2. Main Content Canvas */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: "50px",
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E4E4E7",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          {/* Breadcrumb / Context title */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#18181B", textTransform: "capitalize" }}>
              {currentTab}
            </span>
            {selectedCampaignId && (
              <>
                <span style={{ color: "#A1A1AA" }}>/</span>
                <span style={{ fontSize: "12px", color: "#4338CA", fontWeight: 600 }}>
                  {campaigns.find((c) => c.id === selectedCampaignId)?.icp_description.substring(0, 32)}...
                </span>
              </>
            )}
          </div>

          {/* Right Header items */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <TestModeBanner
              overrideEmail={settings?.testModeRecipientOverride}
              isActive={settings?.isTestOverrideActive}
            />

            <button
              onClick={() => {
                mutateLeads();
                mutateCampaigns();
              }}
              title="Refresh Pipeline Data"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 8px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E4E7",
                borderRadius: "4px",
                fontSize: "11px",
                color: "#52525B",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={12} className={isValidating ? "animate-spin" : ""} style={isValidating ? { animation: "spin 1s linear infinite" } : {}} />
              <span>Refresh</span>
            </button>

            {currentTab === "pipeline" && (
              <button
                onClick={() => setIsNewCampaignOpen(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 12px",
                  backgroundColor: "#4338CA",
                  color: "#FFFFFF",
                  borderRadius: "4px",
                  border: "none",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <PlusCircle size={13} />
                <span>New Campaign</span>
              </button>
            )}
          </div>
        </header>

        {/* View Switcher Container */}
        <main style={{ padding: "20px 24px", flex: 1 }}>
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

      {/* 3. Slide-in Lead Detail Panel */}
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

      {/* 4. New Campaign Modal */}
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
