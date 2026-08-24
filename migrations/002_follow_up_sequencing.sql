-- ============================================================================
-- VANGUARD SDR — FOLLOW-UP SEQUENCING MIGRATION (002_follow_up_sequencing.sql)
-- ============================================================================

-- 1. Add follow-up scheduling and reply status columns to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS has_replied BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS next_follow_up_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS follow_up_count INTEGER NOT NULL DEFAULT 0;

-- 2. Add follow_up_interval_days to campaigns table (default 4 days)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS follow_up_interval_days INTEGER NOT NULL DEFAULT 4,
ADD COLUMN IF NOT EXISTS max_follow_ups INTEGER NOT NULL DEFAULT 3;

-- 3. Add angle_used column to outreach_emails table
ALTER TABLE outreach_emails
ADD COLUMN IF NOT EXISTS angle_used TEXT;

-- Indexes for efficient cron queries
CREATE INDEX IF NOT EXISTS idx_leads_follow_up_due ON leads(next_follow_up_date, has_replied, status);
