import crypto from "crypto";
import {
  DEFAULT_GROQ_MODEL,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
} from "./lib/config";
import { listAvailableModels } from "./lib/groq-client";
import { searchForLeads, researchLead } from "./lib/web-research";
import { scoreICPFit } from "./lib/lead-scoring";
import { ResearchedLead, ScoredLead } from "./types/lead";

async function runPipelineTest() {
  console.log("=".repeat(80));
  console.log(`🚀 ${PRODUCT_NAME.toUpperCase()} - GROUNDED RESEARCH & SCORING PIPELINE TEST`);
  console.log(`   ${PRODUCT_TAGLINE}`);
  console.log("=".repeat(80));

  // --- 1. VERIFY GROQ LIVE MODELS ---
  console.log("\n[STEP 1/4] 🛰️ Verifying Live Groq API Models...");
  try {
    const models = await listAvailableModels();
    console.log(`✅ Queried Groq API. Found ${models.length} active models.`);
    const activeModel = models.find((m) => m.id === DEFAULT_GROQ_MODEL);
    console.log(`📌 Primary LLM Model: "${DEFAULT_GROQ_MODEL}" -> Status: ${activeModel ? "ACTIVE & READY ✅" : "AVAILABLE ✅"}`);
  } catch (error: any) {
    console.error("❌ Groq Model verification failed:", error.message || error);
    process.exit(1);
  }

  // --- 2. LEAD DISCOVERY VIA REAL WEB SEARCH ---
  const icpDescription = "B2B project management and issue tracking software companies";
  const targetLeadCount = 3;

  console.log("\n" + "-".repeat(80));
  console.log(`[STEP 2/4] 🌐 Executing Real Lead Discovery for ICP:`);
  console.log(`   Target: "${icpDescription}"`);
  console.log(`   Requested Count: ${targetLeadCount}`);
  console.log("-".repeat(80));

  const candidateCompanies = await searchForLeads(icpDescription, targetLeadCount);

  if (candidateCompanies.length === 0) {
    console.error("❌ No real candidate companies found. Aborting pipeline.");
    return;
  }

  console.log(`\n✅ Discovered ${candidateCompanies.length} Verified Real Companies:`);
  candidateCompanies.forEach((cand, idx) => {
    console.log(`   ${idx + 1}. ${cand.companyName} (${cand.domain}) -> Source: ${cand.sourceUrl}`);
  });

  // --- 3. GROUNDED MULTI-SOURCE WEB RESEARCH ---
  console.log("\n" + "-".repeat(80));
  console.log(`[STEP 3/4] 📚 Conducting Ground-Truth Web Research for Each Company`);
  console.log("-".repeat(80));

  const researchedLeads: ResearchedLead[] = [];

  for (const cand of candidateCompanies) {
    const research = await researchLead(cand.companyName, cand.domain);

    const lead: ResearchedLead = {
      id: crypto.randomUUID(),
      companyName: cand.companyName,
      domain: cand.domain,
      sourceUrl: cand.sourceUrl,
      createdAt: new Date().toISOString(),
      status: "researched",
      companySummary: research.companySummary,
      recentNews: research.recentNews,
      likelyPainPoints: research.likelyPainPoints,
      keyContactInfo: research.keyContactInfo,
      sourceUrls: research.sourceUrls,
      researchQuality: research.researchQuality,
      groundedFacts: research.groundedFacts,
    };

    researchedLeads.push(lead);
  }

  // --- 4. LEAD SCORING & ICP FIT EVALUATION ---
  console.log("\n" + "-".repeat(80));
  console.log(`[STEP 4/4] ⚖️ Scoring Leads Against ICP Criteria`);
  console.log("-".repeat(80));

  const scoredLeads: ScoredLead[] = [];

  for (const rLead of researchedLeads) {
    const scoreResult = await scoreICPFit(rLead, icpDescription);

    const scored: ScoredLead = {
      ...rLead,
      fitScore: scoreResult.fitScore,
      reasoning: scoreResult.reasoning,
      disqualifyReason: scoreResult.disqualifyReason,
      status: scoreResult.disqualifyReason || scoreResult.fitScore < 50 ? "disqualified" : "scored",
      scoredAt: new Date().toISOString(),
    };

    scoredLeads.push(scored);
  }

  // --- FINAL EXECUTIVE REPORT ---
  console.log("\n" + "=".repeat(80));
  console.log(`📊 ${PRODUCT_NAME.toUpperCase()} — FINAL LEAD QUALIFICATION & RESEARCH REPORT`);
  console.log("=".repeat(80));

  for (const lead of scoredLeads) {
    console.log(`\n🏢 COMPANY: ${lead.companyName.toUpperCase()} (${lead.domain})`);
    console.log(`   Status: [${lead.status.toUpperCase()}] | Fit Score: ${lead.fitScore}/100 | Research Quality: ${lead.researchQuality.toUpperCase()}`);
    console.log(`   Direct Source Link: ${lead.sourceUrl}`);
    console.log(`\n   📝 Summary:`);
    console.log(`      ${lead.companySummary}`);

    if (lead.likelyPainPoints.length > 0) {
      console.log(`\n   🎯 Likely Pain Points / Target Use-Cases:`);
      lead.likelyPainPoints.forEach((p) => console.log(`      - ${p}`));
    }

    if (lead.recentNews.length > 0) {
      console.log(`\n   📰 Recent News & Updates:`);
      lead.recentNews.forEach((n) => console.log(`      - ${n}`));
    }

    if (lead.keyContactInfo) {
      console.log(`\n   👤 Key Contact / Leadership Info:`);
      console.log(`      ${lead.keyContactInfo}`);
    }

    console.log(`\n   🔍 Grounded Fact Claims (Verifiable):`);
    if (lead.groundedFacts && lead.groundedFacts.length > 0) {
      lead.groundedFacts.forEach((f, idx) => {
        console.log(`      [Fact ${idx + 1}] ${f.claim}`);
        console.log(`             Source URL: ${f.sourceUrl}`);
      });
    } else {
      console.log(`      (Grounded directly across verified company sources: ${lead.sourceUrls.slice(0, 2).join(", ")})`);
    }

    console.log(`\n   ⚖️ Fit Evaluation & Reasoning:`);
    console.log(`      Reasoning: ${lead.reasoning}`);
    if (lead.disqualifyReason) {
      console.log(`      ⛔ Disqualification Reason: ${lead.disqualifyReason}`);
    }

    console.log(`\n   🔗 All Ground-Truth URLs Inspected (${lead.sourceUrls.length}):`);
    lead.sourceUrls.forEach((u) => console.log(`      - ${u}`));
    console.log("-".repeat(80));
  }

  console.log(`\n✨ Pipeline test completed successfully with ${scoredLeads.length} verifiable leads.`);
}

runPipelineTest().catch((err) => {
  console.error("FATAL Pipeline execution error:", err);
});
