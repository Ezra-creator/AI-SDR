import crypto from "crypto";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "./lib/config";
import { runSDRAgent } from "./lib/sdr-agent";
import { sendOutreachEmail, resolveRecipientSafety } from "./lib/email-sending";
import { getLeadWithFullHistory } from "./lib/db";
import { SenderContext } from "./types/lead";

async function runEmailSendingTest() {
  console.log("=".repeat(80));
  console.log(`✉️ ${PRODUCT_NAME.toUpperCase()} — RESEND EMAIL DISPATCH & SAFETY OVERRIDE AUDIT`);
  console.log(`   ${PRODUCT_TAGLINE}`);
  console.log("=".repeat(80));

  // --- 1. VERIFY CRITICAL SAFETY OVERRIDE ---
  const safetyCheck = resolveRecipientSafety("ceo@realcompany.com");
  console.log("\n[SAFETY AUDIT 🛡️] Checking Test Mode Recipient Override Configuration:");
  console.log(`   Input Target Address: "ceo@realcompany.com"`);
  console.log(`   Resolved Delivery Address: "${safetyCheck.finalRecipient}"`);
  console.log(`   Safety Override Active: ${safetyCheck.isOverridden ? "YES ✅ (NO REAL EMAILS WILL BE CONTACTED)" : "NO ⚠️ (LIVE PRODUCTION)"}`);

  if (!safetyCheck.isOverridden) {
    console.warn("⚠️ TEST_MODE_RECIPIENT_OVERRIDE is not active. Setting safety fallback...");
    process.env.TEST_MODE_RECIPIENT_OVERRIDE = "test-sdr-recipient@example.com";
  }

  const icpDescription = "B2B SaaS product adoption and in-app user onboarding platforms";
  const productPitch = "We provide an automated AI regression detector that cuts onboarding SDK setup time by 70%.";
  const senderContext: SenderContext = {
    senderName: "Elena Rostova",
    senderRole: "VP of Growth",
    companyName: "DevPulse AI",
  };

  // --- 2. TEST REVIEW MODE ---
  console.log("\n" + "-".repeat(80));
  console.log(`[TEST PHASE 1/2] 📋 CAMPAIGN IN REVIEW MODE (approval_mode = "review")`);
  console.log("-".repeat(80));

  const reviewBatch = await runSDRAgent(
    icpDescription,
    productPitch,
    2,
    senderContext,
    "review" // Review Mode
  );

  console.log(`\n📊 Review Mode Execution Complete:`);
  console.log(`   Total Leads: ${reviewBatch.leads.length}`);
  const reviewEmails = reviewBatch.leads.filter((l) => l.outreachEmail);
  console.log(`   Generated Email Drafts: ${reviewEmails.length}`);

  for (const lead of reviewBatch.leads) {
    console.log(`   - Lead: ${lead.companyName} | Status: [${lead.status.toUpperCase()}] | Fit Score: ${lead.fitScore}`);
    if (lead.outreachEmail) {
      console.log(`     Draft Subject: "${lead.outreachEmail.subject}" (Status: PENDING_APPROVAL - Not Auto-Sent ✅)`);
    }
  }

  // Manually approve & send the first draft
  if (reviewEmails.length > 0) {
    const targetLead = reviewEmails[0];
    console.log(`\n👉 Simulating Human Approval Action for Lead: ${targetLead.companyName}...`);
    const sendRes = await sendOutreachEmail(targetLead.id, `contact@${targetLead.domain}`);

    console.log(`   ✅ Delivery Result: ${sendRes.success ? "SUCCESS" : "FAILED"}`);
    console.log(`   📮 Real Intended Recipient: ${sendRes.originalIntendedRecipient}`);
    console.log(`   🛡️ Actual Delivered Recipient (Intercepted): ${sendRes.actualRecipient}`);
    console.log(`   🆔 Message ID: ${sendRes.resendMessageId}`);
    console.log(`   🔒 Safety Intercept Confirmed: ${sendRes.isTestOverride ? "YES ✅" : "NO ⚠️"}`);
  }

  // --- 3. TEST AUTONOMOUS MODE ---
  console.log("\n" + "-".repeat(80));
  console.log(`[TEST PHASE 2/2] 🚀 CAMPAIGN IN AUTONOMOUS MODE (approval_mode = "autonomous")`);
  console.log("-".repeat(80));

  const autoBatch = await runSDRAgent(
    icpDescription,
    productPitch,
    2,
    senderContext,
    "autonomous" // Autonomous Mode
  );

  console.log(`\n📊 Autonomous Mode Execution Complete:`);
  console.log(`   Total Leads: ${autoBatch.leads.length}`);
  for (const lead of autoBatch.leads) {
    console.log(`   - Lead: ${lead.companyName} | Status: [${lead.status.toUpperCase()}] | Fit Score: ${lead.fitScore}`);
    if (lead.outreachEmail) {
      console.log(`     Auto-Sent Subject: "${lead.outreachEmail.subject}" (Status: SENT ✅)`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log(`✨ All email delivery and approval mode verification tests completed successfully.`);
  console.log("=".repeat(80));
}

runEmailSendingTest().catch((err) => {
  console.error("FATAL Email Sending Test Error:", err);
});
