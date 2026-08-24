import { APP_CONFIG, DEFAULT_GROQ_MODEL } from "./config";
import { createChatCompletionWithFallback } from "./groq-client";
import {
  createOutreachEmail,
  getDueFollowUpLeads,
  getLeadWithFullHistory,
  scheduleNextFollowUp,
  updateLeadStatus,
} from "./db";
import { sendOutreachEmail } from "./email-sending";
import {
  FollowUpGenerationResult,
  PersonalizationHook,
  ResearchedLead,
  SenderContext,
  StoredOutreachEmail,
} from "../types/lead";
import { countWords, findBannedPhrases } from "./email-generation";

const BANNED_FOLLOW_UP_PHRASES = [
  "just bumping this",
  "bumping this to the top of your inbox",
  "just following up on my previous",
  "following up on my last email",
  "circling back",
  "checking in on my previous email",
  "wanted to see if you got my last note",
  "did you get a chance to read my previous email",
  "i hope this email finds you well",
  "synergy",
  "leverage our",
  "game-changer",
];

const ANGLE_DESCRIPTIONS: Record<string, string> = {
  pain_point_focus: "Directly addresses a specific operational bottleneck or workflow pain point.",
  recent_news_hook: "References a recent product release, funding milestone, or public announcement.",
  technical_architecture_observation: "Observations on their SDK, tech stack, or engineering architecture.",
  specific_metric_roi: "Highlights concrete time/cost savings (e.g. 70% reduction in setup time).",
  direct_check_in: "Ultra-brief, direct 2-sentence check-in asking if this is on their roadmap this quarter.",
  social_proof_comparison: "Mentions how similar teams in their category solve the same challenge.",
  breakup_permission: "Polite, zero-pressure closeout ('Assuming this isn't on your radar right now—let me know if timing improves later').",
};

/**
 * Generates an intelligent, differentiated follow-up email that enforces angle diversity.
 */
export async function generateFollowUp(
  leadId: string,
  previousEmails: StoredOutreachEmail[],
  leadDataOverride?: ResearchedLead,
  productPitchOverride?: string,
  senderContextOverride?: SenderContext
): Promise<FollowUpGenerationResult> {
  console.log(`\n[Vanguard SDR Follow-Up] 🔄 Generating follow-up for Lead ID: ${leadId}...`);

  // Fetch full context if not passed directly
  let companyName = leadDataOverride?.companyName || "Target Company";
  let domain = leadDataOverride?.domain || "";
  let summary = leadDataOverride?.companySummary || "";
  let news = leadDataOverride?.recentNews || [];
  let painPoints = leadDataOverride?.likelyPainPoints || [];
  let facts = leadDataOverride?.groundedFacts || [];
  let pitch = productPitchOverride || "Our AI copilot automates integration workflows and UI regression detection.";
  let sender: SenderContext = senderContextOverride || {
    senderName: "Alex Rivera",
    senderRole: "Head of Partnerships",
    companyName: "Vanguard SDR",
  };

  if (!leadDataOverride) {
    try {
      const fullHistory = await getLeadWithFullHistory(leadId);
      if (fullHistory) {
        companyName = fullHistory.lead.company_name;
        domain = fullHistory.lead.domain;
        summary = fullHistory.research?.company_summary || "";
        news = fullHistory.research?.recent_news || [];
        painPoints = fullHistory.research?.likely_pain_points || [];
        facts = fullHistory.research?.grounded_facts || [];
        if (fullHistory.campaign) {
          pitch = fullHistory.campaign.product_pitch;
          sender = {
            senderName: fullHistory.campaign.sender_name,
            senderRole: fullHistory.campaign.sender_role,
            companyName: fullHistory.campaign.sender_company,
          };
        }
      }
    } catch (err: any) {
      console.warn(`[Follow-Up] Could not fetch lead history from DB: ${err.message}`);
    }
  }

  const sequenceNumber = previousEmails.length + 1;
  const alreadyUsedAngles = previousEmails
    .map((e) => e.angle_used)
    .filter((a): a is string => !!a);

  // Format previous outreach thread for prompt context
  const previousThreadContext = previousEmails
    .map(
      (e, idx) =>
        `--- EMAIL #${idx + 1} (Sequence ${e.sequence_number}, Angle: "${e.angle_used || "initial_pitch"}") ---\nSubject: ${e.subject}\nBody:\n${e.body}\n`
    )
    .join("\n");

  const prompt = `You are an elite B2B SDR writing Follow-Up Email #${sequenceNumber} (out of max 4 in sequence).

TARGET COMPANY:
- Name: ${companyName} (${domain})
- Summary: ${summary}
- Recent News/Updates: ${news.join("; ") || "None"}
- Identified Pain Points: ${painPoints.join("; ") || "None"}
- Grounded Research Facts:
${facts.map((f) => `  * ${f.claim} (Source: ${f.sourceUrl})`).join("\n") || "  * Verified company domain"}

OUR VALUE PROPOSITION:
"${pitch}"

SENDER:
${sender.senderName}, ${sender.senderRole} at ${sender.companyName}

PREVIOUS EMAILS ALREADY SENT (DO NOT REPEAT):
${previousThreadContext || "No previous emails found in record."}

ALREADY USED ANGLES (STRICTLY FORBIDDEN TO REPEAT):
${alreadyUsedAngles.length > 0 ? alreadyUsedAngles.join(", ") : "None yet"}

AVAILABLE ANGLES TO CHOOSE FROM:
${Object.entries(ANGLE_DESCRIPTIONS)
  .filter(([angle]) => !alreadyUsedAngles.includes(angle))
  .map(([angle, desc]) => `- "${angle}": ${desc}`)
  .join("\n")}

STRICT FOLLOW-UP RULES:
1. ANGLE DIVERSITY: You MUST choose a genuinely DIFFERENT angle than what was used previously.
2. NO GENERIC BUMPS: NEVER start with "Just bumping this", "Following up on my last email", "Circling back", or "Checking in". It must offer fresh value or a distinct perspective.
3. CONCISENESS: Exactly 2 to 4 sentences (under 75 words).
4. NATURAL TONE: Natural peer-to-peer business voice, no buzzwords, no exclamation marks.
5. LOW-FRICTION CTA: End with a specific 1-sentence question.
${sequenceNumber >= 4 ? "6. THIS IS THE FINAL FOLLOW-UP: Use the 'breakup_permission' angle respectfully letting them know you won't clutter their inbox further unless requested." : ""}

Return JSON format:
{
  "subject": string (under 6 words, lowercase/clean format),
  "body": string (2-4 sentences with paragraph breaks),
  "angleUsed": string (one of the available angle identifiers),
  "personalizationHooksUsed": [
    {
      "fact": string,
      "sourceUrl": string
    }
  ]
}`;

  const completion = await createChatCompletionWithFallback({
    model: APP_CONFIG.groq.defaultModel || DEFAULT_GROQ_MODEL,
    messages: [
      {
        role: "system",
        content: "You are an elite SDR who writes ultra-concise, differentiated follow-up sequences with zero repetition.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const rawContent = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(rawContent);

  const subject = parsed.subject || `quick question on ${companyName}`;
  const body = parsed.body || "";
  const angleUsed = parsed.angleUsed || (sequenceNumber === 2 ? "recent_news_hook" : sequenceNumber === 3 ? "direct_check_in" : "breakup_permission");
  const hooks: PersonalizationHook[] = Array.isArray(parsed.personalizationHooksUsed)
    ? parsed.personalizationHooksUsed
    : [];

  const wordCount = countWords(body);
  const bannedMatches = BANNED_FOLLOW_UP_PHRASES.filter((phrase) =>
    body.toLowerCase().includes(phrase)
  );

  const warnings: string[] = [];
  if (bannedMatches.length > 0) {
    warnings.push(`Contains generic bump phrase: ${bannedMatches.join(", ")}`);
  }
  if (alreadyUsedAngles.includes(angleUsed)) {
    warnings.push(`Angle "${angleUsed}" was repeated from previous outreach.`);
  }

  const genericityWarning = warnings.length > 0 ? warnings.join(" | ") : null;

  console.log(
    `[Vanguard SDR Follow-Up] ✅ Generated Seq #${sequenceNumber} (Angle: ${angleUsed}, Words: ${wordCount}, Warning: ${genericityWarning || "NONE"})`
  );

  return {
    subject,
    body,
    personalizationHooksUsed: hooks.length > 0 ? hooks : (facts || []).slice(0, 1).map((f) => ({ fact: f.claim, sourceUrl: f.sourceUrl })),
    angleUsed,
    sequenceNumber,
    genericityWarning,
    wordCount,
  };
}

export interface DueFollowUpResult {
  processedCount: number;
  results: Array<{
    leadId: string;
    companyName: string;
    emailId: string;
    angleUsed: string;
    sequenceNumber: number;
    status: string;
    subject: string;
  }>;
}

/**
 * Scheduled worker that checks for due follow-ups across all active campaigns and leads.
 */
export async function checkAndGenerateDueFollowUps(): Promise<DueFollowUpResult> {
  console.log("\n[Vanguard SDR Cron] ⏰ Checking for leads with due follow-ups...");

  let dueItems: any[] = [];
  try {
    dueItems = await getDueFollowUpLeads();
  } catch (err: any) {
    console.warn(`[Vanguard SDR Cron] Error fetching due leads from DB: ${err.message}`);
    return { processedCount: 0, results: [] };
  }

  console.log(`[Vanguard SDR Cron] Found ${dueItems.length} leads due for follow-up.`);
  const results: any[] = [];

  for (const item of dueItems) {
    const { lead, campaign, research, previousEmails } = item;

    // Safety check: max follow-ups
    if (lead.follow_up_count >= campaign.max_follow_ups || lead.has_replied) {
      continue;
    }

    try {
      // 1. Generate differentiated follow-up
      const followUpData = await generateFollowUp(lead.id, previousEmails);

      const isAutonomous = campaign.approval_mode === "autonomous";
      const emailStatus = isAutonomous ? "approved" : "pending_approval";

      // 2. Persist email record
      const storedEmail = await createOutreachEmail({
        lead_id: lead.id,
        sequence_number: followUpData.sequenceNumber,
        subject: followUpData.subject,
        body: followUpData.body,
        personalization_hooks_used: followUpData.personalizationHooksUsed,
        angle_used: followUpData.angleUsed,
        status: emailStatus,
      });

      // 3. Handle Autonomous sending vs Review Mode
      if (isAutonomous) {
        console.log(`[Vanguard SDR Cron] 🚀 Auto-dispatching Follow-Up #${followUpData.sequenceNumber} to ${lead.company_name}...`);
        await sendOutreachEmail(storedEmail.id, `contact@${lead.domain}`);

        const nextCount = lead.follow_up_count + 1;
        if (nextCount < campaign.max_follow_ups) {
          await scheduleNextFollowUp(lead.id, campaign.follow_up_interval_days, nextCount);
        } else {
          // Completed sequence
          await updateLeadStatus(lead.id, "followed_up", undefined, null, nextCount);
        }
      } else {
        console.log(`[Vanguard SDR Cron] 📋 Follow-Up #${followUpData.sequenceNumber} for ${lead.company_name} saved as 'pending_approval'.`);
        await updateLeadStatus(lead.id, "pending_approval", undefined, undefined, lead.follow_up_count + 1);
      }

      results.push({
        leadId: lead.id,
        companyName: lead.company_name,
        emailId: storedEmail.id,
        angleUsed: followUpData.angleUsed,
        sequenceNumber: followUpData.sequenceNumber,
        status: isAutonomous ? "sent" : "pending_approval",
        subject: followUpData.subject,
      });
    } catch (leadErr: any) {
      console.error(`[Vanguard SDR Cron] Error processing follow-up for ${lead.company_name}:`, leadErr.message || leadErr);
    }
  }

  console.log(`[Vanguard SDR Cron] 🏁 Finished follow-up check. Processed: ${results.length} leads.`);
  return {
    processedCount: results.length,
    results,
  };
}
