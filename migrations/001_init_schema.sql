-- ============================================================================
-- VANGUARD SDR — NEON POSTGRES SCHEMA MIGRATION (001_init_schema.sql)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    icp_description TEXT NOT NULL,
    product_pitch TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    sender_company TEXT NOT NULL,
    approval_mode TEXT NOT NULL CHECK (approval_mode IN ('review', 'autonomous')) DEFAULT 'review',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    domain TEXT NOT NULL,
    source_url TEXT,
    icp_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (
        status IN (
            'discovered',
            'researched',
            'scored',
            'disqualified',
            'pending_approval',
            'sent',
            'followed_up',
            'replied'
        )
    ) DEFAULT 'discovered',
    fit_score INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on domain and campaign for lookup and deduping
CREATE INDEX IF NOT EXISTS idx_leads_campaign ON leads(icp_id);
CREATE INDEX IF NOT EXISTS idx_leads_domain ON leads(domain);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- 3. LEAD RESEARCH TABLE
CREATE TABLE IF NOT EXISTS lead_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    company_summary TEXT NOT NULL,
    recent_news JSONB NOT NULL DEFAULT '[]'::jsonb,
    likely_pain_points JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    research_quality TEXT NOT NULL CHECK (research_quality IN ('good', 'moderate', 'thin')) DEFAULT 'good',
    grounded_facts JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_research_lead_id ON lead_research(lead_id);

-- 4. OUTREACH EMAILS TABLE
CREATE TABLE IF NOT EXISTS outreach_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL DEFAULT 1,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    personalization_hooks_used JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK (
        status IN ('draft', 'pending_approval', 'approved', 'sent', 'rejected')
    ) DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_emails_lead_id ON outreach_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_emails_status ON outreach_emails(status);
