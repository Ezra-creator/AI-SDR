# Vanguard SDR

> **Autonomous AI Sales Development Representative Engine**  
> An autonomous agent that discovers qualified B2B prospects matching an Ideal Customer Profile (ICP), conducts verifiable ground-truth web research, scores fit, drafts hyper-personalized cold outreach with code-enforced anti-spam validation, executes automated follow-ups with angle diversity, and manages pipeline stages on a CRM dashboard.

---

## 📸 Demo & Interface

![Vanguard SDR CRM Dashboard](/docs/demo-dashboard.png)
*Vanguard SDR Kanban Pipeline Dashboard — visualizing lead stages from discovery and grounded research through review, dispatch, follow-up sequencing, and reply tracking.*

---

## 🎯 The Core Problem With Most "AI Sales" Tools

Most AI-powered sales outreach tools produce generic, easily spotted spam. They take a generic cold email template and swap in `{first_name}` and `{company_name}`, or prompt an LLM with *"write a personalized sales email to [Company]"* without grounding it in verifiable facts. The result is generic fluff (*"I noticed your impressive growth in the industry..."*) that destroys buyer trust.

Even worse are tools that **hallucinate fake company details**—praising a company for an initiative they never launched or inventing a pain point they don't have. Fabricated personalization is far more damaging to reputation than a generic email.

### The Vanguard SDR Solution: Grounded Research & Anti-Spam Code Validation

Vanguard SDR enforces strict code-level guardrails rather than relying solely on system prompts:

1. **Multi-Source Ground-Truth Web Scraping**: The engine scrapes live company websites, recent press releases, and technical documentation, parsing clean DOM text and extracting verifiable claims paired with active source URLs.
2. **`researchQuality` Grading**: Every lead is evaluated as `good`, `moderate`, or `thin`. If research data is insufficient, outreach generation is blocked or flagged.
3. **Personalization Hook Mapping**: Outgoing emails must explicitly cite specific extracted facts (e.g. a recent product feature launch or SOC2 certification) and link to the exact source URL.
4. **Code-Level Blocklist & Anti-Spam Validation**: Every generated draft is programmatically screened against generic AI buzzwords (*"I hope this email finds you well"*, *"synergy"*, *"game-changer"*, *"leverage our"*, *"just bumping this"*). If detected, the email is rejected and regenerated.
5. **Strict Word Count Constraints**: Emails are enforced at 3–5 sentences (< 75 words) with low-friction, single-sentence CTAs.

---

## 🏗️ Architecture & Technical Design

```
                     +---------------------------------------------+
                     |         ICP Description & Product Pitch     |
                     +---------------------------------------------+
                                            |
                                            v
                     +---------------------------------------------+
                     |       Groq SDR Agent Orchestrator Loop      |
                     |       (Dynamic Function-Calling Loop)       |
                     +---------------------------------------------+
                               /            |             \
                              /             |              \
                             v              v               v
                +-------------------+ +-------------+ +--------------------+
                | searchForLeads()  | | researchLead| |   scoreICPFit()    |
                | (Bing/DDG/Yahoo)  | |  (Scraper)  | | (0-100 & Disqual.) |
                +-------------------+ +-------------+ +--------------------+
                                            |
                             (If Qualified: Score >= 60)
                                            |
                                            v
                                +-----------------------+
                                | generateOutreachEmail |
                                | (Anti-Spam Blocklist) |
                                +-----------------------+
                                            |
                                            v
                                +-----------------------+
                                |  Neon Postgres DB     |
                                |  (Serverless Storage) |
                                +-----------------------+
                                            |
                     +----------------------+----------------------+
                     |                                             |
           [ Review Mode Active ]                       [ Autonomous Mode Active ]
                     |                                             |
                     v                                             v
         Staged in Review Queue                        Automated Resend Dispatch
         (status: pending_approval)                   (status: sent + sent_at)
                     |                                             |
                     +----------------------+----------------------+
                                            |
                                            v
                                +-----------------------+
                                |  Safety Interceptor   |
                                | (TEST_MODE_OVERRIDE)  |
                                +-----------------------+
                                            |
                                            v
                                +-----------------------+
                                | Vercel Cron Follow-Up |
                                | (Angle-Diversity Rot) |
                                +-----------------------+
                                            |
                                            v
                                +-----------------------+
                                | Real-Time CRM Frontend|
                                |   (Next.js Dashboard) |
                                +-----------------------+
```

### Key Engineering Decisions

- **Agentic Function-Calling Loop**: Rather than running a brittle, hard-coded linear script, the Groq orchestrator model dynamically reasons about which tools to invoke (`searchForLeads`, `researchLead`, `scoreICPFit`, `generateOutreachEmail`). Leads that fail ICP qualification (score $< 60$) are immediately disqualified without wasting tokens or sending spam.
- **Review Mode vs. Autonomous Mode**: Outbound cold email carries real legal compliance and brand reputation risks. Vanguard SDR defaults to **Review Mode** (staging drafts as `pending_approval` for human sales rep sign-off) while offering an instant toggle to **Autonomous Mode** for trusted automated pipelines.
- **Angle-Diversity Follow-Up Sequencing**: Follow-up emails never use lazy *"just bumping this"* bumps. The system records previously used angles (`angle_used`) in Postgres and instructs the LLM to take a **genuinely distinct perspective** for each sequence turn (e.g. *Pain Point Focus* $\to$ *Recent News Hook* $\to$ *SDK Architecture Observation* $\to$ *Breakup Permission*), capped at 3 follow-ups max.
- **Fail-Safe Safety Override (`TEST_MODE_RECIPIENT_OVERRIDE`)**: When developing or testing, `TEST_MODE_RECIPIENT_OVERRIDE` intercepts **all** outgoing emails at the code level, routing them strictly to a designated developer inbox while preserving the original target address in subject and audit headers.
- **Neon Serverless Postgres**: Persistent relational storage (`@neondatabase/serverless`) stores campaigns, leads, research artifacts, and multi-turn email sequence histories with zero cold-start database connection pool exhaustion.

---

## 🛠️ Tech Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) | Server-side rendering, React 19 client components, unified API routes. |
| **Language** | TypeScript 5 | Strict end-to-end type safety for leads, traces, and DB entities. |
| **LLM Engine** | Groq SDK (`openai/gpt-oss-120b`, `qwen/qwen3.6-27b`) | Sub-second inference latency with automatic multi-model rate-limit fallback. |
| **Database** | Neon Serverless Postgres | Auto-scaling relational storage over WebSockets with SQL migrations. |
| **Email Dispatch** | Resend API | Reliable email delivery engine with safety interception wrapper. |
| **State & Cache** | SWR | Stale-while-revalidate client cache with background polling intervals. |
| **Styling** | Vanilla CSS + Design Tokens | Attio & Linear-inspired high-density CRM aesthetic with Inter typography. |
| **Scheduler** | Vercel Cron | Automated weekday follow-up evaluation endpoint (`/api/cron/follow-ups`). |

---

## 📁 Repository Structure

```
AI Sales Development Rep/
├── app/
│   ├── api/
│   │   ├── agent/run/route.ts        # POST: Triggers autonomous SDR agent execution
│   │   ├── campaigns/route.ts        # GET/POST: Campaign CRUD and lead counts
│   │   ├── campaigns/[id]/route.ts   # GET/PATCH: Approval mode and follow-up settings
│   │   ├── cron/follow-ups/route.ts  # GET/POST: Scheduled follow-up sequence evaluator
│   │   ├── emails/[id]/approve/route.ts # POST: Human review approval & Resend dispatch
│   │   ├── emails/[id]/edit/route.ts # PATCH: In-place subject/body editing
│   │   ├── emails/[id]/reject/route.ts # POST: Draft rejection
│   │   ├── leads/route.ts            # GET: Filtered lead queries
│   │   ├── leads/[id]/route.ts       # GET: Full lead history & research
│   │   ├── leads/[id]/replied/route.ts # POST: Reply registration & sequence halt
│   │   └── settings/route.ts         # GET: Live configuration & safety status
│   ├── globals.css                   # Dense B2B design system tokens & Inter font
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Main CRM Dashboard entrypoint
├── components/
│   ├── AppShell.tsx                  # Master responsive layout with sidebar and header
│   ├── Sidebar.tsx                   # 240px sidebar with mode toggle & campaign switcher
│   ├── PipelineBoard.tsx             # Kanban board (desktop) & tabbed list (mobile)
│   ├── PipelineColumn.tsx            # Status column with collapsible counters
│   ├── LeadCard.tsx                  # Compact lead card with fit score badge
│   ├── LeadDetailPanel.tsx           # Slide-in drawer with verified research & thread
│   ├── EmailHistoryItem.tsx          # Sequence cards with inline Approve/Edit/Reject
│   ├── CampaignsTable.tsx            # Data-dense campaigns table
│   ├── NewCampaignForm.tsx           # Modal for ICP configuration & live SDR execution
│   ├── SettingsPanel.tsx             # Safety controls and infrastructure status
│   ├── StatusBadge.tsx               # Crisp status dot indicators
│   └── TestModeBanner.tsx            # Prominent safety recipient override banner
├── lib/
│   ├── config.ts                     # Configuration constants and thresholds
│   ├── groq-client.ts                # Groq SDK client with live model fallbacks
│   ├── db.ts                         # Neon Postgres client and typed queries
│   ├── migrate.ts                    # Schema migration runner
│   ├── web-research.ts               # Lead discovery & ground-truth page research
│   ├── lead-scoring.ts               # ICP scoring and disqualification evaluator
│   ├── email-generation.ts           # Grounded outreach generator with anti-spam checks
│   ├── email-sending.ts              # Resend email dispatcher with safety override
│   ├── follow-up-engine.ts           # Multi-turn follow-up engine with angle diversity
│   ├── sdr-agent.ts                  # Autonomous function-calling agent loop
│   └── search/
│       ├── search-provider.ts        # Multi-engine search provider (Bing/DDG/Yahoo)
│       └── page-scraper.ts           # Noise-free HTML parser and text extractor
├── migrations/
│   ├── 001_init_schema.sql           # Campaigns, leads, research, and emails schema
│   └── 002_follow_up_sequencing.sql  # Scheduling, angle tracking, and reply columns
├── types/
│   └── lead.ts                       # Complete TypeScript interfaces
├── test-research-pipeline.ts         # Test 1: Grounded research and scoring audit
├── test-personalization.ts           # Test 2: Outreach personalization & blocklist audit
├── test-sdr-agent.ts                 # Test 3: Autonomous agent loop audit
├── test-persistence.ts               # Test 4: Neon Postgres persistence audit
├── test-email-sending.ts             # Test 5: Email delivery, approval modes & safety audit
└── test-follow-up.ts                 # Test 6: Follow-up sequencing & angle diversity audit
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js 18+ or 20+
- A [Groq API Key](https://console.groq.com)
- A [Neon Postgres Database](https://neon.tech)
- A [Resend API Key](https://resend.com) (optional for simulated test sending)

### 2. Clone & Install
```bash
git clone https://github.com/your-username/vanguard-sdr.git
cd vanguard-sdr
npm install --legacy-peer-deps
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Groq Inference API Key (Required)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Neon Serverless Postgres Connection String (Required for DB persistence)
DATABASE_URL=postgresql://user:password@ep-your-database-id.region.aws.neon.tech/neondb?sslmode=require

# Resend Outbound Email API Key (Required for live email delivery)
RESEND_API_KEY=re_your_resend_api_key_here

# CRITICAL SAFETY OVERRIDE: Redirects ALL outbound emails to this test address
# Defaults to active to prevent accidental live outreach to real companies
TEST_MODE_RECIPIENT_OVERRIDE=your-test-inbox@example.com
```

### 4. Run Database Migrations
Apply the initial schema and follow-up sequencing tables to Neon:
```bash
npm run migrate
```

### 5. Launch the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to access the CRM Dashboard.

---

## 🧪 Comprehensive Test Suites

Run the verified standalone test scripts to audit each engine layer:

```bash
# 1. Test Grounded Web Research & ICP Scoring
npm run test:pipeline

# 2. Test Email Personalization & Anti-Spam Phrase Validation
npm run test:personalization

# 3. Test Autonomous Agent Function-Calling Loop
npm run test:agent

# 4. Test Neon Postgres Persistence & Full History Joins
npm run test:persistence

# 5. Test Email Sending, Review Mode, Autonomous Mode & Safety Override
npm run test:email

# 6. Test Automatic Follow-Up Sequencing & Angle Diversity
npm run test:followup
```

---

## ⚠️ Known Limitations & Operational Considerations

To maintain engineering transparency, the current version has the following intentional boundaries:

1. **Manual Reply Marking (No Inbound Inbox Monitoring Yet)**: The system currently provides a dedicated API endpoint (`POST /api/leads/[id]/replied`) and dashboard button to mark replies. Automated IMAP/webhook email inbox monitoring is designed for v2.
2. **Web Search vs. Dedicated B2B Business Graph APIs**: Lead discovery uses live search engines (Bing, DuckDuckGo, Yahoo) to remain free-tier accessible. Integrating dedicated B2B data providers (Apollo, ZoomInfo, Clearbit) would increase contact accuracy and company coverage at high enterprise volumes.
3. **Free-Tier API Rate Limits**: Groq, Resend, and Neon free tiers are optimized for small campaigns and portfolio demonstrations, not 10,000+ leads/day continuous bursts.
4. **Email Deliverability & Domain Infrastructure**: High-volume cold outbound in production requires dedicated secondary domain warming, SPF/DKIM/DMARC alignment, and spam-rate monitoring.

---

## 🗺️ Production Roadmap (Scaling to Enterprise)

- [ ] **Inbound Webhook Reply Detection**: Automated webhook listeners for Resend / SendGrid to parse prospect replies and trigger sentiment analysis.
- [ ] **Multi-User & Role-Based Access Control (RBAC)**: Team workspace segmentation allowing sales reps to review their individual pipeline queues.
- [ ] **A/B Angle Conversion Telemetry**: Real-time statistical analysis comparing open and reply rates across distinct follow-up angles (*Recent News* vs. *Architecture Observations* vs. *Metric ROI*).
- [ ] **Two-Way CRM Synchronization**: Native integrations with Salesforce, HubSpot, and Attio to sync leads and activity logs directly into enterprise systems of record.
- [ ] **Automated Domain Warmup & Inbox Rotation**: Smart throttling across multiple sending domains to ensure maximum inbox deliverability.

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
