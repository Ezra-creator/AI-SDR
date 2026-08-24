import { APP_CONFIG, DEFAULT_GROQ_MODEL } from "./config";
import { createChatCompletionWithFallback } from "./groq-client";
import { OutreachEmail, PersonalizationHook, ScoredLead, SenderContext } from "../types/lead";

const BANNED_GENERIC_PHRASES: string[] = [
  "i hope this email finds you well",
  "i hope this finds you well",
  "hope this email finds you well",
  "hope you're having a great week",
  "hope you are doing well",
  "in today's fast-paced world",
  "in today's fast paced world",
  "in today's competitive landscape",
  "i wanted to reach out",
  "i am reaching out to",
  "i'm reaching out to",
  "i came across your company",
  "i stumbled upon your company",
  "i noticed your company is doing great work",
  "i was impressed by",
  "synergy",
  "leverage our",
  "unlock the potential",
  "game-changer",
  "revolutionary platform",
  "cutting-edge solution",
  "let's hop on a call",
  "grab 15 minutes on your calendar",
  "pick your brain",
];

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function findBannedPhrases(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_GENERIC_PHRASES.filter((phrase) => lower.includes(phrase));
}

export function validateHooksAgainstResearch(
  hooks: PersonalizationHook[],
  leadData: ScoredLead
): { valid: boolean; ungroundedHooks: string[] } {
  if (!hooks || hooks.length === 0) {
    return { valid: false, ungroundedHooks: ["No personalization hooks cited."] };
  }

  const allResearchCorpus = [
    leadData.companySummary,
    ...leadData.recentNews,
    ...leadData.likelyPainPoints,
    ...(leadData.groundedFacts || []).map((f) => `${f.claim} ${f.sourceUrl}`),
    ...leadData.sourceUrls,
  ]
    .join(" ")
    .toLowerCase();

  const ungroundedHooks: string[] = [];

  for (const hook of hooks) {
    const significantWords = hook.fact
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !["company", "platform", "software", "their", "about", "which", "these"].includes(w));

    const matches = significantWords.filter((w) => allResearchCorpus.includes(w));
    const matchRatio = significantWords.length > 0 ? matches.length / significantWords.length : 0;

    if (significantWords.length >= 2 && matchRatio < 0.4) {
      ungroundedHooks.push(hook.fact);
    }
  }

  return {
    valid: ungroundedHooks.length === 0,
    ungroundedHooks,
  };
}

export async function generateOutreachEmail(
  leadData: ScoredLead,
  productPitch: string,
  senderContext: SenderContext
): Promise<OutreachEmail> {
  console.log(`\n[Vanguard SDR] ✉️ Generating outreach email for ${leadData.companyName} (${leadData.domain})...`);

  const researchSummary = `
- Company: ${leadData.companyName} (${leadData.domain})
- Fit Score: ${leadData.fitScore}/100
- Research Quality: ${leadData.researchQuality}
- Company Summary: ${leadData.companySummary}
- Recent News/Updates: ${leadData.recentNews.join("; ") || "None found"}
- Likely Pain Points: ${leadData.likelyPainPoints.join("; ") || "None specified"}
- Verified Grounded Facts:
${(leadData.groundedFacts || []).map((f) => `  * ${f.claim} (Source: ${f.sourceUrl})`).join("\n") || "  * Refer to company summary and verified domain."}
`;

  const buildPrompt = (rejectionReason?: string) => `
You are an elite, top-performing SDR writing a high-conversion cold outreach email.

SENDER:
- Name: ${senderContext.senderName}
- Role: ${senderContext.senderRole}
- Company: ${senderContext.companyName}

PRODUCT / SERVICE OFFERING (WHAT WE DO):
"${productPitch}"

TARGET LEAD RESEARCH DATA (GROUND TRUTH):
${researchSummary}

STRICT WRITING RULES:
1. OPEN WITH A REAL OBSERVATION: The very first sentence MUST mention a concrete fact from the research above (e.g. an engineering workflow, a specific feature of theirs, or a recent update).
2. NO GENERIC OPENERS: NEVER start with "I hope this finds you well", "I noticed your company", "I was impressed by", or corporate pleasantries.
3. DIRECT LOGICAL BRIDGE: Connect their specific reality/pain point to how our solution directly addresses it in 1 sentence.
4. MAXIMUM BREVITY: Exactly 3 to 5 sentences total (under 100 words). Busy decision makers ignore long emails.
5. NATURAL HUMAN VOICE: Write like a direct peer. Zero buzzwords (no "synergy", "leverage", "unlock", "game-changer", "revolutionary"). No exclamation marks.
6. LOW-FRICTION CTA: End with a specific, easy 1-sentence question (e.g. "Are you currently handling X internally, or open to seeing a 2-minute workflow?"). Do NOT ask for a 30-minute phone call.
7. CITE THE HOOK: Explicitly cite the specific research fact and sourceUrl in personalizationHooksUsed.
${rejectionReason ? `\n⚠️ PREVIOUS ATTEMPT FAILED VALIDATION: ${rejectionReason}. Fix this immediately!` : ""}

Return JSON format:
{
  "subject": string (under 6 words, lowercase/natural style),
  "body": string (3-5 sentences, plain text with paragraph breaks),
  "personalizationHooksUsed": [
    {
      "fact": string,
      "sourceUrl": string
    }
  ]
}`;

  let attempts = 0;
  const maxAttempts = 2;
  let lastRejectionReason = "";

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const completion = await createChatCompletionWithFallback({
        model: APP_CONFIG.groq.defaultModel || DEFAULT_GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an elite B2B sales development representative who writes ultra-concise, grounded cold emails.",
          },
          { role: "user", content: buildPrompt(lastRejectionReason || undefined) },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      });

      const rawContent = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(rawContent);

      const subject = parsed.subject || `${leadData.companyName} + ${senderContext.companyName}`;
      const body = parsed.body || "";
      const hooks: PersonalizationHook[] = Array.isArray(parsed.personalizationHooksUsed)
        ? parsed.personalizationHooksUsed
        : [];

      // POST-GENERATION VALIDATION CHECKS
      const wordCount = countWords(body);
      const bannedFound = findBannedPhrases(body);
      const hookValidation = validateHooksAgainstResearch(hooks, leadData);

      const warnings: string[] = [];

      if (bannedFound.length > 0) {
        if (attempts < maxAttempts) {
          lastRejectionReason = `Contained banned generic phrases: ${bannedFound.join(", ")}`;
          console.warn(`[Vanguard SDR] ⚠️ Regeneration triggered (Attempt ${attempts}): ${lastRejectionReason}`);
          continue;
        } else {
          warnings.push(`Contains generic phrases: ${bannedFound.join(", ")}`);
        }
      }

      if (!hookValidation.valid) {
        warnings.push(`Ungrounded personalization claims: ${hookValidation.ungroundedHooks.join("; ")}`);
      }

      if (wordCount > 120) {
        warnings.push(`Email length (${wordCount} words) exceeds optimal 120-word ceiling.`);
      }

      if (leadData.researchQuality === "thin") {
        warnings.push("Lead research was thin; personalization hooks have limited public verification.");
      }

      const genericityWarning = warnings.length > 0 ? warnings.join(" | ") : null;

      const fallbackHooks: PersonalizationHook[] = (leadData.groundedFacts || []).slice(0, 1).map((f) => ({
        fact: f.claim,
        sourceUrl: f.sourceUrl,
      }));

      console.log(`[Vanguard SDR] ✅ Email generated (${wordCount} words, ${hooks.length} hooks, warnings: ${genericityWarning ? "YES" : "NONE"})`);

      return {
        subject,
        body,
        personalizationHooksUsed: hooks.length > 0 ? hooks : fallbackHooks,
        angleUsed: "pain_point_focus",
        genericityWarning,
        wordCount,
        generatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error(`[Vanguard SDR] Error generating outreach email (attempt ${attempts}):`, err.message || err);
      if (attempts >= maxAttempts) {
        return {
          subject: `Question regarding ${leadData.companyName}`,
          body: `Hi team,\n\nSaw ${leadData.companyName}'s work in ${leadData.domain}. We help teams streamline workflows with ${productPitch}.\n\nOpen to a brief comparison?`,
          personalizationHooksUsed: [],
          genericityWarning: "Fallback email generated due to model error.",
          wordCount: 22,
          generatedAt: new Date().toISOString(),
        };
      }
    }
  }

  return {
    subject: `Question regarding ${leadData.companyName}`,
    body: `Hi team,\n\nSaw ${leadData.companyName}'s focus on engineering tools. We help teams with ${productPitch}.\n\nWould you be open to exploring this?`,
    personalizationHooksUsed: [],
    genericityWarning: "Generated with default fallback.",
    wordCount: 21,
    generatedAt: new Date().toISOString(),
  };
}
