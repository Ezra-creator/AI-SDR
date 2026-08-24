import { PRODUCT_NAME, PRODUCT_TAGLINE } from "./lib/config";
import {
  getCampaignById,
  getLeadsByCampaign,
  getLeadWithFullHistory,
  getDbPool,
} from "./lib/db";
import { runMigrations } from "./lib/migrate";
import { runSDRAgent } from "./lib/sdr-agent";
import { SenderContext } from "./types/lead";

async function main() {
  console.log("=".repeat(80));
  console.log(`🗄️ ${PRODUCT_NAME.toUpperCase()} — NEON PERSISTENCE & ROUND-TRIP AUDIT`);
  console.log(`   ${PRODUCT_TAGLINE}`);
  console.log("=".repeat(80));

  // 1. Verify Database Configuration
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim() === "" || dbUrl.includes("your_password")) {
    console.error("\n❌ DATABASE_URL is not configured with a live Neon connection string.");
    console.log("💡 Please add your Neon connection string to .env in this format:");
    console.log("   DATABASE_URL=postgresql://[user]:[password]@[neon-host]/[dbname]?sslmode=require");
    console.log("\nTo get a free serverless Postgres instance in 30 seconds: https://neon.tech");
    process.exit(1);
  }

  // 2. Run Migrations
  console.log("\n[STEP 1/4] 🚀 Initializing Schema & Running Migrations...");
  try {
    await runMigrations();
  } catch (migErr: any) {
    console.error("❌ Migration failed:", migErr.message || migErr);
    process.exit(1);
  }

  // 3. Execute Real Agent Pipeline with Persistence
  console.log("\n[STEP 2/4] 🤖 Running Agentic Pipeline against Live Web & Neon DB...");
  const icpDescription = "B2B SaaS product adoption and in-app user onboarding software companies";
  const productPitch = "We provide an automated AI regression detector that cuts user onboarding SDK setup time by 70%.";
  const senderContext: SenderContext = {
    senderName: "Sarah Jenkins",
    senderRole: "Head of Growth",
    companyName: "Vanguard Tech",
  };

  const batchResult = await runSDRAgent(
    icpDescription,
    productPitch,
    3,
    senderContext,
    "review" // Approval mode
  );

  console.log(`\n[STEP 3/4] 📊 Pipeline Finished. Campaign ID: ${batchResult.campaignId || "N/A"}`);
  if (!batchResult.campaignId) {
    console.error("❌ No campaign ID generated. Aborting persistence audit.");
    return;
  }

  // 4. Query Back from Database (Round-Trip Verification)
  console.log("\n" + "-".repeat(80));
  console.log(`[STEP 4/4] 🔍 VERIFYING DURA-STORED RECORDS VIA DIRECT NEON QUERIES`);
  console.log("-".repeat(80));

  // Query Campaign
  const storedCampaign = await getCampaignById(batchResult.campaignId);
  console.log(`\n📁 STORED CAMPAIGN:`);
  console.log(`   ID: ${storedCampaign?.id}`);
  console.log(`   ICP: "${storedCampaign?.icp_description}"`);
  console.log(`   Pitch: "${storedCampaign?.product_pitch}"`);
  console.log(`   Sender: ${storedCampaign?.sender_name} (${storedCampaign?.sender_role} @ ${storedCampaign?.sender_company})`);
  console.log(`   Approval Mode: ${storedCampaign?.approval_mode}`);
  console.log(`   Created At: ${storedCampaign?.created_at}`);

  // Query Leads by Campaign
  const storedLeads = await getLeadsByCampaign(batchResult.campaignId);
  console.log(`\n👥 STORED LEADS IN CAMPAIGN (${storedLeads.length} leads found in DB):`);
  storedLeads.forEach((l, idx) => {
    console.log(`   ${idx + 1}. [${l.status.toUpperCase()}] ${l.company_name} (${l.domain}) | Fit Score: ${l.fit_score ?? "N/A"} | ID: ${l.id}`);
  });

  // Query Full History for each lead (Lead + Research + Outreach Emails join)
  console.log("\n" + "=".repeat(80));
  console.log(`📜 LEAD FULL HISTORY (ROUND-TRIP JOIN AUDIT)`);
  console.log("=".repeat(80));

  for (const lead of storedLeads) {
    const fullHistory = await getLeadWithFullHistory(lead.id);

    if (!fullHistory) {
      console.warn(`⚠️ Could not fetch full history for lead ID ${lead.id}`);
      continue;
    }

    console.log(`\n🏢 COMPANY: ${fullHistory.lead.company_name} (${fullHistory.lead.domain})`);
    console.log(`   Lead ID: ${fullHistory.lead.id}`);
    console.log(`   Status: [${fullHistory.lead.status.toUpperCase()}] | Fit Score: ${fullHistory.lead.fit_score ?? "N/A"}`);
    console.log(`   Created: ${fullHistory.lead.created_at} | Updated: ${fullHistory.lead.updated_at}`);

    if (fullHistory.research) {
      console.log(`\n   📚 Stored Research:`);
      console.log(`      Quality: ${fullHistory.research.research_quality.toUpperCase()}`);
      console.log(`      Summary: ${fullHistory.research.company_summary}`);
      console.log(`      Source URLs Count: ${fullHistory.research.source_urls.length}`);
      console.log(`      Grounded Facts Count: ${fullHistory.research.grounded_facts.length}`);
    } else {
      console.log(`   📚 Stored Research: [None stored for this lead]`);
    }

    if (fullHistory.emails && fullHistory.emails.length > 0) {
      console.log(`\n   ✉️ Stored Outreach Emails (${fullHistory.emails.length}):`);
      fullHistory.emails.forEach((em, idx) => {
        console.log(`      [Email #${idx + 1} - Seq ${em.sequence_number}] Status: [${em.status.toUpperCase()}]`);
        console.log(`      Subject: ${em.subject}`);
        console.log(`      Body Snippet: "${em.body.replace(/\n/g, " ").substring(0, 120)}..."`);
        console.log(`      Personalization Hooks: ${em.personalization_hooks_used.length} cited`);
      });
    } else {
      console.log(`   ✉️ Stored Outreach Emails: [None generated / Disqualified]`);
    }

    console.log("-".repeat(80));
  }

  console.log(`\n✨ Neon round-trip persistence audit completed successfully.`);
}

main().catch((err) => {
  console.error("FATAL Persistence Test Error:", err);
});
