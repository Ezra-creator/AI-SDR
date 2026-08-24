import crypto from "crypto";
import { PRODUCT_NAME } from "./lib/config";
import { searchForLeads, researchLead } from "./lib/web-research";
import { scoreICPFit } from "./lib/lead-scoring";
import { generateOutreachEmail } from "./lib/email-generation";
import { ResearchedLead, ScoredLead, SenderContext } from "./types/lead";

async function runPersonalizationTest() {
  console.log("=".repeat(80));
  console.log(`✉️ ${PRODUCT_NAME.toUpperCase()} — OUTREACH PERSONALIZATION & VALIDATION TEST`);
  console.log("=".repeat(80));

  const icpDescription = "B2B SaaS product adoption and in-app user onboarding platforms";
  const productPitch = "We provide an automated AI engineering co-pilot that detects UI regressions and reduces onboarding SDK integration time from 3 weeks to 2 days.";
  const senderContext: SenderContext = {
    senderName: "Elena Rostova",
    senderRole: "VP of Growth",
    companyName: "DevPulse AI",
  };

  console.log(`\n📌 SENDER: ${senderContext.senderName}, ${senderContext.senderRole} at ${senderContext.companyName}`);
  console.log(`📌 PRODUCT PITCH: "${productPitch}"`);
  console.log(`📌 ICP TARGET: "${icpDescription}"\n`);

  // Step 1: Discover real leads
  console.log(`[1/4] 🌐 Discovering candidate companies matching ICP...`);
  const candidates = await searchForLeads(icpDescription, 3);

  if (candidates.length === 0) {
    console.error("❌ No real candidate companies found.");
    return;
  }

  // Step 2: Research & Score each candidate
  console.log(`\n[2/4] 🔎 Conducting grounded web research & scoring for ${candidates.length} leads...`);
  const scoredLeads: ScoredLead[] = [];

  for (const cand of candidates) {
    const research = await researchLead(cand.companyName, cand.domain);
    const rLead: ResearchedLead = {
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

    const scoring = await scoreICPFit(rLead, icpDescription);
    const sLead: ScoredLead = {
      ...rLead,
      fitScore: scoring.fitScore,
      reasoning: scoring.reasoning,
      disqualifyReason: scoring.disqualifyReason,
      status: scoring.disqualifyReason || scoring.fitScore < 50 ? "disqualified" : "scored",
      scoredAt: new Date().toISOString(),
    };

    scoredLeads.push(sLead);
  }

  // Step 3: Generate outreach emails with validation
  console.log(`\n[3/4] ✍️ Generating and validating outreach emails for scored leads...`);

  for (const lead of scoredLeads) {
    const email = await generateOutreachEmail(lead, productPitch, senderContext);
    lead.outreachEmail = email;
    lead.status = "outreach_generated";
  }

  // Step 4: Display complete evaluation report
  console.log("\n" + "=".repeat(80));
  console.log(`📑 ${PRODUCT_NAME.toUpperCase()} — PERSONALIZATION EVALUATION & AUDIT`);
  console.log("=".repeat(80));

  for (const lead of scoredLeads) {
    const email = lead.outreachEmail!;
    console.log(`\n🏢 COMPANY: ${lead.companyName} (${lead.domain})`);
    console.log(`   Fit Score: ${lead.fitScore}/100 [${lead.status.toUpperCase()}]`);
    console.log(`   Research Quality: ${lead.researchQuality.toUpperCase()}`);
    console.log(`   Word Count: ${email.wordCount} words (Target: 40-100 words)`);
    console.log(`   Validation Warning: ${email.genericityWarning || "NONE - PASSED ALL STRICT CHECKS ✅"}`);

    console.log(`\n   📬 SUBJECT LINE:`);
    console.log(`      ${email.subject}`);

    console.log(`\n   ✉️ EMAIL BODY:`);
    console.log("   " + "-".repeat(60));
    email.body.split("\n").forEach((line) => console.log(`   ${line}`));
    console.log("   " + "-".repeat(60));

    console.log(`\n   🎯 Specific Research Facts Used as Personalization Hooks:`);
    if (email.personalizationHooksUsed && email.personalizationHooksUsed.length > 0) {
      email.personalizationHooksUsed.forEach((h, i) => {
        console.log(`      ${i + 1}. "${h.fact}"`);
        console.log(`         Source: ${h.sourceUrl}`);
      });
    } else {
      console.log(`      None cited.`);
    }

    console.log("-".repeat(80));
  }

  console.log(`\n✨ Personalization test completed.`);
}

runPersonalizationTest().catch((err) => {
  console.error("Fatal test error:", err);
});
