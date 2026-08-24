import { Pool, neonConfig } from "@neondatabase/serverless";
import dotenv from "dotenv";
import {
  ApprovalMode,
  CampaignRecord,
  EmailStatus,
  LeadStatus,
  LeadWithFullHistory,
  PersonalizationHook,
  ResearchQuality,
  StoredLeadRecord,
  StoredLeadResearch,
  StoredOutreachEmail,
} from "../types/lead";

dotenv.config();

if (typeof WebSocket === "undefined") {
  try {
    const ws = require("ws");
    neonConfig.webSocketConstructor = ws;
  } catch {}
}

let poolInstance: Pool | null = null;

export function getDbPool(): Pool {
  if (poolInstance) {
    return poolInstance;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.trim() === "" || connectionString.includes("your_password")) {
    throw new Error(
      "[Vanguard SDR DB] Missing or placeholder DATABASE_URL in environment. Please configure a valid Neon Postgres connection string."
    );
  }

  poolInstance = new Pool({ connectionString });
  return poolInstance;
}

export async function executeQuery<T = any>(queryText: string, params: any[] = []): Promise<T[]> {
  try {
    const pool = getDbPool();
    const result = await pool.query(queryText, params);
    return result.rows as T[];
  } catch (error: any) {
    console.error(`[Vanguard SDR DB] Query execution failed: ${error.message || error}`);
    console.error(`Query: ${queryText}`);
    console.error(`Params:`, params);
    throw error;
  }
}

// ============================================================================
// CRUD OPERATIONS FOR CAMPAIGNS
// ============================================================================

export async function createCampaign(campaign: {
  icp_description: string;
  product_pitch: string;
  sender_name: string;
  sender_role: string;
  sender_company: string;
  approval_mode?: ApprovalMode;
  follow_up_interval_days?: number;
  max_follow_ups?: number;
}): Promise<CampaignRecord> {
  const rows = await executeQuery<CampaignRecord>(
    `INSERT INTO campaigns (
      icp_description, product_pitch, sender_name, sender_role, sender_company, approval_mode, follow_up_interval_days, max_follow_ups
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, icp_description, product_pitch, sender_name, sender_role, sender_company, approval_mode, follow_up_interval_days, max_follow_ups, created_at`,
    [
      campaign.icp_description,
      campaign.product_pitch,
      campaign.sender_name,
      campaign.sender_role,
      campaign.sender_company,
      campaign.approval_mode || "review",
      campaign.follow_up_interval_days || 4,
      campaign.max_follow_ups || 3,
    ]
  );

  return rows[0];
}

export async function getCampaignById(id: string): Promise<CampaignRecord | null> {
  const rows = await executeQuery<CampaignRecord>(
    `SELECT id, icp_description, product_pitch, sender_name, sender_role, sender_company, approval_mode, follow_up_interval_days, max_follow_ups, created_at
     FROM campaigns WHERE id = $1`,
    [id]
  );

  return rows.length > 0 ? rows[0] : null;
}

// ============================================================================
// CRUD OPERATIONS FOR LEADS
// ============================================================================

export async function createLead(lead: {
  id?: string;
  company_name: string;
  domain: string;
  source_url?: string | null;
  icp_id?: string | null;
  status?: LeadStatus;
  fit_score?: number | null;
  has_replied?: boolean;
  next_follow_up_date?: string | null;
  follow_up_count?: number;
}): Promise<StoredLeadRecord> {
  const idClause = lead.id ? "$1, $2, $3, $4, $5, $6, $7, $8, $9, $10" : "gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9";
  const params = lead.id
    ? [
        lead.id,
        lead.company_name,
        lead.domain,
        lead.source_url || null,
        lead.icp_id || null,
        lead.status || "discovered",
        lead.fit_score ?? null,
        lead.has_replied || false,
        lead.next_follow_up_date || null,
        lead.follow_up_count || 0,
      ]
    : [
        lead.company_name,
        lead.domain,
        lead.source_url || null,
        lead.icp_id || null,
        lead.status || "discovered",
        lead.fit_score ?? null,
        lead.has_replied || false,
        lead.next_follow_up_date || null,
        lead.follow_up_count || 0,
      ];

  const rows = await executeQuery<StoredLeadRecord>(
    `INSERT INTO leads (id, company_name, domain, source_url, icp_id, status, fit_score, has_replied, next_follow_up_date, follow_up_count)
     VALUES (${idClause})
     RETURNING id, company_name, domain, source_url, icp_id, status, fit_score, has_replied, next_follow_up_date, follow_up_count, created_at, updated_at`,
    params
  );

  return rows[0];
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  fitScore?: number | null,
  nextFollowUpDate?: string | null,
  followUpCount?: number
): Promise<StoredLeadRecord | null> {
  const updates: string[] = ["status = $1", "updated_at = NOW()"];
  const params: any[] = [status, leadId];
  let paramIdx = 3;

  if (fitScore !== undefined) {
    updates.push(`fit_score = $${paramIdx++}`);
    params.push(fitScore);
  }
  if (nextFollowUpDate !== undefined) {
    updates.push(`next_follow_up_date = $${paramIdx++}`);
    params.push(nextFollowUpDate);
  }
  if (followUpCount !== undefined) {
    updates.push(`follow_up_count = $${paramIdx++}`);
    params.push(followUpCount);
  }

  const rows = await executeQuery<StoredLeadRecord>(
    `UPDATE leads
     SET ${updates.join(", ")}
     WHERE id = $2
     RETURNING id, company_name, domain, source_url, icp_id, status, fit_score, has_replied, next_follow_up_date, follow_up_count, created_at, updated_at`,
    params
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function markLeadAsReplied(leadId: string): Promise<StoredLeadRecord | null> {
  const rows = await executeQuery<StoredLeadRecord>(
    `UPDATE leads
     SET has_replied = TRUE, status = 'replied', next_follow_up_date = NULL, updated_at = NOW()
     WHERE id = $1
     RETURNING id, company_name, domain, source_url, icp_id, status, fit_score, has_replied, next_follow_up_date, follow_up_count, created_at, updated_at`,
    [leadId]
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function scheduleNextFollowUp(
  leadId: string,
  intervalDays: number = 4,
  currentCount: number = 0
): Promise<void> {
  await executeQuery(
    `UPDATE leads
     SET next_follow_up_date = NOW() + ($1 || ' days')::INTERVAL,
         follow_up_count = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [intervalDays.toString(), currentCount + 1, leadId]
  );
}

export async function getLeadsByCampaign(campaignId: string): Promise<StoredLeadRecord[]> {
  return executeQuery<StoredLeadRecord>(
    `SELECT id, company_name, domain, source_url, icp_id, status, fit_score, has_replied, next_follow_up_date, follow_up_count, created_at, updated_at
     FROM leads
     WHERE icp_id = $1
     ORDER BY created_at DESC`,
    [campaignId]
  );
}

// ============================================================================
// CRUD OPERATIONS FOR LEAD RESEARCH
// ============================================================================

export async function createResearch(research: {
  lead_id: string;
  company_summary: string;
  recent_news?: string[];
  likely_pain_points?: string[];
  source_urls?: string[];
  research_quality?: ResearchQuality;
  grounded_facts?: any[];
}): Promise<StoredLeadResearch> {
  const quality = research.research_quality === "thin" ? "thin" : research.research_quality === "moderate" ? "moderate" : "good";

  const rows = await executeQuery<StoredLeadResearch>(
    `INSERT INTO lead_research (
      lead_id, company_summary, recent_news, likely_pain_points, source_urls, research_quality, grounded_facts
    ) VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6, $7::jsonb)
    RETURNING id, lead_id, company_summary, recent_news, likely_pain_points, source_urls, research_quality, grounded_facts, created_at`,
    [
      research.lead_id,
      research.company_summary,
      JSON.stringify(research.recent_news || []),
      JSON.stringify(research.likely_pain_points || []),
      JSON.stringify(research.source_urls || []),
      quality,
      JSON.stringify(research.grounded_facts || []),
    ]
  );

  return rows[0];
}

// ============================================================================
// CRUD OPERATIONS FOR OUTREACH EMAILS
// ============================================================================

export async function createOutreachEmail(email: {
  lead_id: string;
  sequence_number?: number;
  subject: string;
  body: string;
  personalization_hooks_used?: PersonalizationHook[];
  angle_used?: string | null;
  status?: EmailStatus;
  sent_at?: string | null;
}): Promise<StoredOutreachEmail> {
  const rows = await executeQuery<StoredOutreachEmail>(
    `INSERT INTO outreach_emails (
      lead_id, sequence_number, subject, body, personalization_hooks_used, angle_used, status, sent_at
    ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
    RETURNING id, lead_id, sequence_number, subject, body, personalization_hooks_used, angle_used, status, sent_at, created_at`,
    [
      email.lead_id,
      email.sequence_number || 1,
      email.subject,
      email.body,
      JSON.stringify(email.personalization_hooks_used || []),
      email.angle_used || null,
      email.status || "draft",
      email.sent_at || null,
    ]
  );

  return rows[0];
}

export async function getEmailById(emailId: string): Promise<StoredOutreachEmail | null> {
  const rows = await executeQuery<StoredOutreachEmail>(
    `SELECT id, lead_id, sequence_number, subject, body, personalization_hooks_used, angle_used, status, sent_at, created_at
     FROM outreach_emails
     WHERE id = $1`,
    [emailId]
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function updateEmailContent(
  emailId: string,
  subject: string,
  body: string
): Promise<StoredOutreachEmail | null> {
  const rows = await executeQuery<StoredOutreachEmail>(
    `UPDATE outreach_emails
     SET subject = $1, body = $2
     WHERE id = $3
     RETURNING id, lead_id, sequence_number, subject, body, personalization_hooks_used, angle_used, status, sent_at, created_at`,
    [subject, body, emailId]
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function updateEmailStatus(
  emailId: string,
  status: EmailStatus,
  sentAt?: string | null
): Promise<StoredOutreachEmail | null> {
  const sentAtClause = sentAt !== undefined ? `, sent_at = $3` : "";
  const params: any[] = [status, emailId];
  if (sentAt !== undefined) params.push(sentAt);

  const rows = await executeQuery<StoredOutreachEmail>(
    `UPDATE outreach_emails
     SET status = $1 ${sentAtClause}
     WHERE id = $2
     RETURNING id, lead_id, sequence_number, subject, body, personalization_hooks_used, angle_used, status, sent_at, created_at`,
    params
  );

  return rows.length > 0 ? rows[0] : null;
}

// ============================================================================
// FULL HISTORY JOIN & DUE FOLLOW-UP QUERIES
// ============================================================================

export async function getLeadWithFullHistory(leadId: string): Promise<LeadWithFullHistory | null> {
  const leadRows = await executeQuery<any>(
    `SELECT l.id, l.company_name, l.domain, l.source_url, l.icp_id, l.status, l.fit_score, l.has_replied,
            l.next_follow_up_date, l.follow_up_count, l.created_at, l.updated_at,
            c.id as c_id, c.icp_description as c_icp, c.product_pitch as c_pitch, c.sender_name as c_sname,
            c.sender_role as c_srole, c.sender_company as c_scompany, c.approval_mode as c_approval,
            c.follow_up_interval_days as c_interval, c.max_follow_ups as c_max_follow, c.created_at as c_created
     FROM leads l
     LEFT JOIN campaigns c ON l.icp_id = c.id
     WHERE l.id = $1`,
    [leadId]
  );

  if (leadRows.length === 0) {
    return null;
  }

  const row = leadRows[0];
  const lead: StoredLeadRecord = {
    id: row.id,
    company_name: row.company_name,
    domain: row.domain,
    source_url: row.source_url,
    icp_id: row.icp_id,
    status: row.status,
    fit_score: row.fit_score,
    has_replied: row.has_replied,
    next_follow_up_date: row.next_follow_up_date,
    follow_up_count: row.follow_up_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  const campaign: CampaignRecord | null = row.c_id
    ? {
        id: row.c_id,
        icp_description: row.c_icp,
        product_pitch: row.c_pitch,
        sender_name: row.c_sname,
        sender_role: row.c_srole,
        sender_company: row.c_scompany,
        approval_mode: row.c_approval,
        follow_up_interval_days: row.c_interval || 4,
        max_follow_ups: row.c_max_follow || 3,
        created_at: row.c_created,
      }
    : null;

  const researchRows = await executeQuery<StoredLeadResearch>(
    `SELECT id, lead_id, company_summary, recent_news, likely_pain_points, source_urls, research_quality, grounded_facts, created_at
     FROM lead_research
     WHERE lead_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [leadId]
  );

  const research: StoredLeadResearch | null = researchRows.length > 0 ? researchRows[0] : null;

  const emailRows = await executeQuery<StoredOutreachEmail>(
    `SELECT id, lead_id, sequence_number, subject, body, personalization_hooks_used, angle_used, status, sent_at, created_at
     FROM outreach_emails
     WHERE lead_id = $1
     ORDER BY sequence_number ASC, created_at ASC`,
    [leadId]
  );

  return {
    lead,
    research,
    emails: emailRows,
    campaign,
  };
}

export interface DueFollowUpItem {
  lead: StoredLeadRecord;
  campaign: CampaignRecord;
  research: StoredLeadResearch | null;
  previousEmails: StoredOutreachEmail[];
}

export async function getDueFollowUpLeads(): Promise<DueFollowUpItem[]> {
  const query = `
    SELECT l.id as lead_id, l.company_name, l.domain, l.source_url, l.icp_id, l.status, l.fit_score,
           l.has_replied, l.next_follow_up_date, l.follow_up_count, l.created_at as lead_created_at, l.updated_at as lead_updated_at,
           c.id as c_id, c.icp_description, c.product_pitch, c.sender_name, c.sender_role, c.sender_company,
           c.approval_mode, c.follow_up_interval_days, c.max_follow_ups, c.created_at as campaign_created_at
    FROM leads l
    JOIN campaigns c ON l.icp_id = c.id
    WHERE l.has_replied = FALSE
      AND l.status IN ('sent', 'followed_up')
      AND l.next_follow_up_date IS NOT NULL
      AND l.next_follow_up_date <= NOW()
      AND l.follow_up_count < c.max_follow_ups
    ORDER BY l.next_follow_up_date ASC
  `;

  const rows = await executeQuery<any>(query);
  const items: DueFollowUpItem[] = [];

  for (const row of rows) {
    const lead: StoredLeadRecord = {
      id: row.lead_id,
      company_name: row.company_name,
      domain: row.domain,
      source_url: row.source_url,
      icp_id: row.icp_id,
      status: row.status,
      fit_score: row.fit_score,
      has_replied: row.has_replied,
      next_follow_up_date: row.next_follow_up_date,
      follow_up_count: row.follow_up_count,
      created_at: row.lead_created_at,
      updated_at: row.lead_updated_at,
    };

    const campaign: CampaignRecord = {
      id: row.c_id,
      icp_description: row.icp_description,
      product_pitch: row.product_pitch,
      sender_name: row.sender_name,
      sender_role: row.sender_role,
      sender_company: row.sender_company,
      approval_mode: row.approval_mode,
      follow_up_interval_days: row.follow_up_interval_days,
      max_follow_ups: row.max_follow_ups,
      created_at: row.campaign_created_at,
    };

    const researchRows = await executeQuery<StoredLeadResearch>(
      `SELECT id, lead_id, company_summary, recent_news, likely_pain_points, source_urls, research_quality, grounded_facts, created_at
       FROM lead_research WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [lead.id]
    );

    const emailRows = await executeQuery<StoredOutreachEmail>(
      `SELECT id, lead_id, sequence_number, subject, body, personalization_hooks_used, angle_used, status, sent_at, created_at
       FROM outreach_emails WHERE lead_id = $1 ORDER BY sequence_number ASC`,
      [lead.id]
    );

    items.push({
      lead,
      campaign,
      research: researchRows[0] || null,
      previousEmails: emailRows,
    });
  }

  return items;
}
