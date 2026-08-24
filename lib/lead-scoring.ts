import { APP_CONFIG, DEFAULT_GROQ_MODEL } from "./config";
import { createChatCompletionWithFallback } from "./groq-client";
import { LeadScoringResult, ResearchedLead } from "../types/lead";

/**
 * Evaluates the ICP fit of a researched lead against stated ICP criteria.
 */
export async function scoreICPFit(
  leadData: ResearchedLead,
  icpCriteria: string
): Promise<LeadScoringResult> {
  console.log(`\n[Vanguard SDR] ⚖️ Scoring ICP fit for ${leadData.companyName} (${leadData.domain})...`);

  const factsText = leadData.groundedFacts && leadData.groundedFacts.length > 0
    ? leadData.groundedFacts.map((f, i) => `${i + 1}. [Verified via ${f.sourceUrl}]: ${f.claim}`).join("\n")
    : "No isolated fact claims (refer to company summary and verified pages below).";

  const prompt = `You are the lead qualification director at Vanguard SDR.
Evaluate the following researched lead strictly against the Ideal Customer Profile (ICP) criteria.

TARGET ICP CRITERIA:
"${icpCriteria}"

RESEARCHED LEAD DATA:
- Company Name: ${leadData.companyName}
- Domain: ${leadData.domain}
- Research Quality: ${leadData.researchQuality}
- Company Summary: ${leadData.companySummary}
- Recent News / Milestones: ${leadData.recentNews.join("; ") || "None found"}
- Likely Pain Points: ${leadData.likelyPainPoints.join("; ") || "None identified"}
- Key Contact Info: ${leadData.keyContactInfo || "Not identified"}
- Verified Grounded Facts:
${factsText}

SCORING GUIDELINES:
1. Score Range: 0 to 100 integer.
   - 80-100 (High Fit): Clear industry match, product/service alignment with ICP, strong pain point relevance.
   - 50-79 (Moderate Fit): Relevant industry or tangential product, but ambiguous size/focus.
   - 0-49 (Low / Disqualified Fit): Clear mismatch in industry, wrong business model (e.g. B2C when ICP is B2B), enterprise when ICP is SMB, or totally unrelated product.
2. DISQUALIFICATION:
   - If the fitScore is under 50 OR the lead violates core constraints (e.g. wrong industry, not software, opposite market), you MUST provide a specific "disqualifyReason" string explaining why.
   - If the lead is a good fit (>= 50), set "disqualifyReason" to null.
3. REASONING:
   - Provide a concise 2-3 sentence justification citing specific verified facts from the research.
   - DO NOT inflate fit scores. Strict qualification saves sales rep time.
4. If research quality is "thin", reflect the uncertainty in the score and reasoning.

Return strictly JSON matching:
{
  "fitScore": number,
  "reasoning": string,
  "disqualifyReason": string | null
}`;

  try {
    const completion = await createChatCompletionWithFallback({
      model: APP_CONFIG.groq.defaultModel || DEFAULT_GROQ_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an objective B2B sales lead qualification evaluator outputting JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    const fitScore = typeof parsed.fitScore === "number" ? Math.max(0, Math.min(100, Math.round(parsed.fitScore))) : 50;
    const disqualifyReason = fitScore < 50 ? parsed.disqualifyReason || "Failed to meet core ICP criteria." : parsed.disqualifyReason || null;
    const reasoning = parsed.reasoning || "Scored based on web research alignment with ICP.";

    console.log(`[Vanguard SDR] 📊 Score for ${leadData.companyName}: ${fitScore}/100 ${disqualifyReason ? `(Disqualified: ${disqualifyReason})` : "(Qualified)"}`);

    return {
      fitScore,
      reasoning,
      disqualifyReason,
    };
  } catch (error: any) {
    console.error(`[Vanguard SDR] Error during lead scoring for ${leadData.companyName}:`, error.message || error);
    return {
      fitScore: 0,
      reasoning: `Scoring failed due to error: ${error.message || error}`,
      disqualifyReason: "Error during scoring inference",
    };
  }
}
