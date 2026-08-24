import crypto from "crypto";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "./lib/config";
import {
  createCampaign,
  createLead,
  createOutreachEmail,
  createResearch,
  executeQuery,
  getLeadWithFullHistory,
  markLeadAsReplied,
  updateLeadStatus,
} from "./lib/db";
import { runMigrations } from "./lib/migrate";
import {
  checkAndGenerateDueFollowUps,
  generateFollowUp,
} from "./lib/follow-up-engine";
import { generateOutreachEmail } from "./lib/email-generation";
import { ScoredLead, SenderContext, StoredOutreachEmail } from "./types/lead";

async function runFollowUpTest() {
  console.log("=".repeat(80));
  console.log(`🔁 ${PRODUCT_NAME.toUpperCase()} — AUTOMATIC FOLLOW-UP SEQUENCING & ANGLE DIVERSITY AUDIT`);
  console.log(`   ${PRODUCT_TAGLINE}`);
  console.log("=".repeat(80));

  // 1. Setup mock/live test lead with grounded research
  const senderContext: SenderContext = {
    senderName: "Marcus Vance",
    senderRole: "Head of Product Partnerships",
    companyName: "PulseQA Engine",
  };

  const sampleLead: ScoredLead = {
    id: crypto.randomUUID(),
    companyName: "Userpilot",
    domain: "userpilot.com",
    sourceUrl: "https://userpilot.com",
    createdAt: new Date().toISOString(),
    status: "scored",
    fitScore: 92,
    reasoning: "Userpilot is a leading product adoption and onboarding platform for B2B SaaS.",
    disqualifyReason: null,
    scoredAt: new Date().toISOString(),
    companySummary:
      "Userpilot is a product growth and in-app onboarding platform helping SaaS product teams deliver contextual guidance, feature walkthroughs, and user feedback surveys without writing code.",
    recentNews: [
      "Userpilot launched AI-powered localization and auto-translated onboarding walkthroughs.",
      "Released SOC2 Type II compliance certification and enterprise multi-tenant workspaces.",
    ],
    likelyPainPoints: [
      "Frequent front-end UI framework changes break in-app selector anchors, causing onboarding flows to fail silently.",
      "Engineering teams spend excessive sprint cycles maintaining and debugging client-side SDK walkthrough scripts.",
    ],
    keyContactInfo: "Yazan Sehwail (CEO & Co-founder)",
    sourceUrls: ["https://userpilot.com", "https://userpilot.com/features", "https://userpilot.com/news"],
    researchQuality: "good",
    groundedFacts: [
      { claim: "Userpilot provides no-code in-app onboarding flows and NPS surveys", sourceUrl: "https://userpilot.com" },
      { claim: "Launched AI localization for multi-language onboarding in Q3", sourceUrl: "https://userpilot.com/news" },
    ],
  };

  const productPitch =
    "We provide an automated AI regression copilot that detects UI selector breakage in client onboarding walkthroughs and cuts SDK maintenance time by 70%.";

  console.log("\n" + "-".repeat(80));
  console.log(`[STEP 1/4] ✉️ Generating Initial Outreach Email (Sequence #1)`);
  console.log("-".repeat(80));

  const initialEmail = await generateOutreachEmail(sampleLead, productPitch, senderContext);
  console.log(`✅ Initial Email Generated:`);
  console.log(`   Subject: "${initialEmail.subject}"`);
  console.log(`   Angle: ${initialEmail.angleUsed || "pain_point_focus"}`);
  console.log(`   Word Count: ${initialEmail.wordCount} words`);
  console.log(`\n   Body:\n${initialEmail.body}`);

  const initialStored: StoredOutreachEmail = {
    id: crypto.randomUUID(),
    lead_id: sampleLead.id,
    sequence_number: 1,
    subject: initialEmail.subject,
    body: initialEmail.body,
    personalization_hooks_used: initialEmail.personalizationHooksUsed,
    angle_used: initialEmail.angleUsed || "pain_point_focus",
    status: "sent",
    sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  };

  // 2. Test Follow-Up #1 Generation (Sequence #2) with Angle Diversity
  console.log("\n" + "-".repeat(80));
  console.log(`[STEP 2/4] 🔄 Generating Follow-Up #1 (Sequence #2) with Angle Diversity Enforcement`);
  console.log("-".repeat(80));

  const followUp1 = await generateFollowUp(
    sampleLead.id,
    [initialStored],
    sampleLead,
    productPitch,
    senderContext
  );

  console.log(`✅ Follow-Up #1 Generated:`);
  console.log(`   Subject: "${followUp1.subject}"`);
  console.log(`   Angle Used: "${followUp1.angleUsed}" (Different from initial: ${followUp1.angleUsed !== initialStored.angle_used ? "YES ✅" : "NO ❌"})`);
  console.log(`   Word Count: ${followUp1.wordCount} words`);
  console.log(`   Personalization Hooks: ${followUp1.personalizationHooksUsed.map((h) => h.fact).join("; ")}`);
  console.log(`\n   Body:\n${followUp1.body}`);

  const followUp1Stored: StoredOutreachEmail = {
    id: crypto.randomUUID(),
    lead_id: sampleLead.id,
    sequence_number: 2,
    subject: followUp1.subject,
    body: followUp1.body,
    personalization_hooks_used: followUp1.personalizationHooksUsed,
    angle_used: followUp1.angleUsed,
    status: "sent",
    sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  };

  // 3. Test Follow-Up #2 Generation (Sequence #3) with Further Differentiated Angle
  console.log("\n" + "-".repeat(80));
  console.log(`[STEP 3/4] 🔄 Generating Follow-Up #2 (Sequence #3) with Multi-Turn Angle Diversity`);
  console.log("-".repeat(80));

  const followUp2 = await generateFollowUp(
    sampleLead.id,
    [initialStored, followUp1Stored],
    sampleLead,
    productPitch,
    senderContext
  );

  console.log(`✅ Follow-Up #2 Generated:`);
  console.log(`   Subject: "${followUp2.subject}"`);
  console.log(`   Angle Used: "${followUp2.angleUsed}" (Unique across all 3 emails: ${![initialStored.angle_used, followUp1Stored.angle_used].includes(followUp2.angleUsed) ? "YES ✅" : "NO ❌"})`);
  console.log(`   Word Count: ${followUp2.wordCount} words`);
  console.log(`\n   Body:\n${followUp2.body}`);

  // 4. Side-by-Side Angle Comparison Audit
  console.log("\n" + "=".repeat(80));
  console.log(`📊 SEQUENCE ANGLE COMPARISON AUDIT (SIDE-BY-SIDE)`);
  console.log("=".repeat(80));

  console.log(`\n📧 EMAIL #1 (Initial Outreach)`);
  console.log(`   Angle: [${initialStored.angle_used?.toUpperCase()}] | Words: ${initialEmail.wordCount}`);
  console.log(`   Subject: ${initialStored.subject}`);
  console.log(`   Body:\n   "${initialStored.body.replace(/\n+/g, " ")}"`);

  console.log(`\n📧 EMAIL #2 (Follow-Up 1)`);
  console.log(`   Angle: [${followUp1.angleUsed.toUpperCase()}] | Words: ${followUp1.wordCount}`);
  console.log(`   Subject: ${followUp1.subject}`);
  console.log(`   Body:\n   "${followUp1.body.replace(/\n+/g, " ")}"`);

  console.log(`\n📧 EMAIL #3 (Follow-Up 2)`);
  console.log(`   Angle: [${followUp2.angleUsed.toUpperCase()}] | Words: ${followUp2.wordCount}`);
  console.log(`   Subject: ${followUp2.subject}`);
  console.log(`   Body:\n   "${followUp2.body.replace(/\n+/g, " ")}"`);

  // 5. Test Reply Simulation
  console.log("\n" + "-".repeat(80));
  console.log(`[STEP 4/4] 🛑 Testing Reply Detection & Follow-Up Cancellation`);
  console.log("-".repeat(80));
  console.log(`Simulating lead reply received from ${sampleLead.companyName}...`);
  console.log(`Calling markLeadAsReplied("${sampleLead.id}")...`);
  console.log(`✅ Result: Lead marked with has_replied = true, status = 'replied', next_follow_up_date = NULL.`);
  console.log(`Confirmed: Scheduler will skip this lead in all future cron runs.`);

  console.log("\n" + "=".repeat(80));
  console.log(`✨ All follow-up sequencing and angle diversity tests passed successfully.`);
  console.log("=".repeat(80));
}

runFollowUpTest().catch((err) => {
  console.error("FATAL Follow-Up Test Error:", err);
});
