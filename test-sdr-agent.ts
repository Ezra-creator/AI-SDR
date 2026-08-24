import { PRODUCT_NAME, PRODUCT_TAGLINE } from "./lib/config";
import { runSDRAgent } from "./lib/sdr-agent";
import { SenderContext } from "./types/lead";

async function main() {
  console.log("=".repeat(80));
  console.log(`🤖 ${PRODUCT_NAME.toUpperCase()} — AGENTIC SDR PIPELINE TEST`);
  console.log(`   ${PRODUCT_TAGLINE}`);
  console.log("=".repeat(80));

  const icpDescription = "B2B SaaS customer onboarding and product walkthrough software companies";
  const productPitch = "We provide an automated AI test copilot that prevents UI breakage in client onboarding walkthroughs and cuts SDK maintenance by 70%.";
  const targetLeadCount = 4;

  const senderContext: SenderContext = {
    senderName: "Marcus Vance",
    senderRole: "Head of Strategic Growth",
    companyName: "PulseQA Engine",
  };

  const startTime = Date.now();

  const batchResult = await runSDRAgent(
    icpDescription,
    productPitch,
    targetLeadCount,
    senderContext
  );

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n" + "=".repeat(80));
  console.log(`📊 ${PRODUCT_NAME.toUpperCase()} — AGENT EXECUTION SUMMARY`);
  console.log("=".repeat(80));
  console.log(`⏱️ Duration: ${durationSec}s | Iterations: ${batchResult.iterations} | Completed: ${batchResult.completed ? "YES ✅" : "NO ⚠️"}`);
  console.log(`🔍 Total Discovered: ${batchResult.totalDiscovered}`);
  console.log(`📚 Total Researched: ${batchResult.totalResearched}`);
  console.log(`⚖️ Total Scored: ${batchResult.totalScored}`);
  console.log(`🏆 Qualified: ${batchResult.totalQualified} | ⛔ Disqualified: ${batchResult.totalDisqualified}`);

  // Display human-readable tool trace
  console.log("\n" + "-".repeat(80));
  console.log(`📜 COMPLETE AGENT TOOL-CALL TRACE (${batchResult.toolTraces.length} steps):`);
  console.log("-".repeat(80));

  batchResult.toolTraces.forEach((trace, idx) => {
    console.log(`[Step ${idx + 1}] ⚙️ ${trace.tool}(${trace.paramsSummary}) [${trace.durationMs}ms]`);
    console.log(`       ↳ Result: ${trace.resultSummary}`);
  });

  // Display evaluated leads and outreach
  console.log("\n" + "=".repeat(80));
  console.log(`📬 PROCESSED LEADS & PERSONALIZED OUTREACH:`);
  console.log("=".repeat(80));

  for (const lead of batchResult.leads) {
    const isQual = lead.fitScore >= 60 && !lead.disqualifyReason;
    console.log(`\n🏢 COMPANY: ${lead.companyName} (${lead.domain})`);
    console.log(`   Fit Score: ${lead.fitScore}/100 [${isQual ? "QUALIFIED ✅" : "DISQUALIFIED ⛔"}]`);
    console.log(`   Research Quality: ${lead.researchQuality.toUpperCase()}`);
    console.log(`   Reasoning: ${lead.reasoning}`);

    if (lead.disqualifyReason) {
      console.log(`   ⛔ Disqualification Reason: ${lead.disqualifyReason}`);
      console.log(`   💡 Outreach Email: [SKIPPED - Agent correctly avoided generating email for disqualified lead]`);
    }

    if (lead.outreachEmail) {
      console.log(`\n   ✉️ PERSONALIZED OUTREACH EMAIL (${lead.outreachEmail.wordCount} words):`);
      console.log(`      Subject: ${lead.outreachEmail.subject}`);
      console.log(`      Warnings: ${lead.outreachEmail.genericityWarning || "None ✅"}`);
      console.log(`      Body:`);
      lead.outreachEmail.body.split("\n").forEach((line) => console.log(`        ${line}`));

      if (lead.outreachEmail.personalizationHooksUsed.length > 0) {
        console.log(`      Personalization Hooks Used:`);
        lead.outreachEmail.personalizationHooksUsed.forEach((h) => {
          console.log(`        - "${h.fact}" (${h.sourceUrl})`);
        });
      }
    }

    console.log("-".repeat(80));
  }

  console.log(`\n🎉 Agent pipeline demonstration finished successfully.`);
}

main().catch((err) => {
  console.error("FATAL Agent test error:", err);
});
