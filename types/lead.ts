/**
 * Types definition for Vanguard SDR
 */

export type LeadStatus =
  | "discovered"
  | "researched"
  | "scored"
  | "disqualified"
  | "pending_approval"
  | "sent"
  | "followed_up"
  | "replied"
  | "outreach_generated";

export type ResearchQuality = "good" | "moderate" | "thin";

export type ApprovalMode = "review" | "autonomous";

export type EmailStatus = "draft" | "pending_approval" | "approved" | "sent" | "rejected";

export type EmailAngle =
  | "pain_point_focus"
  | "recent_news_hook"
  | "technical_architecture_observation"
  | "specific_metric_roi"
  | "direct_check_in"
  | "social_proof_comparison"
  | "breakup_permission";

export interface GroundedFact {
  claim: string;
  sourceUrl: string;
}

export interface DiscoveredLeadCandidate {
  companyName: string;
  domain: string;
  sourceUrl: string;
}

export interface Lead {
  id: string;
  companyName: string;
  domain: string;
  sourceUrl: string;
  createdAt: string;
  status: LeadStatus;
}

export interface ResearchedLead extends Lead {
  companySummary: string;
  recentNews: string[];
  likelyPainPoints: string[];
  keyContactInfo: string | null;
  sourceUrls: string[];
  researchQuality: ResearchQuality;
  groundedFacts: GroundedFact[];
}

export interface ScoredLead extends ResearchedLead {
  fitScore: number; // 0 - 100
  reasoning: string;
  disqualifyReason: string | null;
  scoredAt: string;
  outreachEmail?: OutreachEmail;
}

export interface ICPCriteria {
  industry?: string;
  companySize?: string;
  targetRole?: string;
  corePainPoints?: string[];
  productPitch?: string;
  rawDescription: string;
}

export interface LeadScoringResult {
  fitScore: number;
  reasoning: string;
  disqualifyReason: string | null;
}

export interface SenderContext {
  senderName: string;
  senderRole: string;
  companyName: string;
}

export interface PersonalizationHook {
  fact: string;
  sourceUrl: string;
}

export interface OutreachEmail {
  subject: string;
  body: string;
  personalizationHooksUsed: PersonalizationHook[];
  angleUsed?: string;
  genericityWarning: string | null;
  wordCount?: number;
  generatedAt?: string;
}

export interface AgentToolTrace {
  timestamp: string;
  tool: string;
  paramsSummary: string;
  resultSummary: string;
  durationMs: number;
}

export interface AgentBatchResult {
  campaignId?: string;
  icpDescription: string;
  productPitch: string;
  totalDiscovered: number;
  totalResearched: number;
  totalScored: number;
  totalQualified: number;
  totalDisqualified: number;
  leads: ScoredLead[];
  toolTraces: AgentToolTrace[];
  iterations: number;
  completed: boolean;
}

// --- DATABASE PERSISTENCE ENTITIES ---

export interface CampaignRecord {
  id: string;
  icp_description: string;
  product_pitch: string;
  sender_name: string;
  sender_role: string;
  sender_company: string;
  approval_mode: ApprovalMode;
  follow_up_interval_days: number;
  max_follow_ups: number;
  created_at: string;
}

export interface StoredLeadRecord {
  id: string;
  company_name: string;
  domain: string;
  source_url: string | null;
  icp_id: string | null;
  status: LeadStatus;
  fit_score: number | null;
  has_replied: boolean;
  next_follow_up_date: string | null;
  follow_up_count: number;
  created_at: string;
  updated_at: string;
}

export interface StoredLeadResearch {
  id: string;
  lead_id: string;
  company_summary: string;
  recent_news: string[];
  likely_pain_points: string[];
  source_urls: string[];
  research_quality: ResearchQuality;
  grounded_facts: GroundedFact[];
  created_at: string;
}

export interface StoredOutreachEmail {
  id: string;
  lead_id: string;
  sequence_number: number;
  subject: string;
  body: string;
  personalization_hooks_used: PersonalizationHook[];
  angle_used?: string | null;
  status: EmailStatus;
  sent_at: string | null;
  created_at: string;
}

export interface LeadWithFullHistory {
  lead: StoredLeadRecord;
  research: StoredLeadResearch | null;
  emails: StoredOutreachEmail[];
  campaign?: CampaignRecord | null;
}

export interface FollowUpGenerationResult {
  subject: string;
  body: string;
  personalizationHooksUsed: PersonalizationHook[];
  angleUsed: string;
  sequenceNumber: number;
  genericityWarning: string | null;
  wordCount: number;
}
