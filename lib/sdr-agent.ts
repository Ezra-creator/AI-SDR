import crypto from "crypto";
import { APP_CONFIG, DEFAULT_GROQ_MODEL } from "./config";
import { createChatCompletionWithFallback } from "./groq-client";
import { searchForLeads, researchLead } from "./web-research";
import { scoreICPFit } from "./lead-scoring";
import { generateOutreachEmail } from "./email-generation";
import { sendOutreachEmail } from "./email-sending";
import {
  createCampaign,
  createLead,
  createOutreachEmail as dbCreateOutreachEmail,
  createResearch as dbCreateResearch,
  updateLeadStatus as dbUpdateLeadStatus,
} from "./db";
import {
  AgentBatchResult,
  AgentToolTrace,
  ApprovalMode,
  DiscoveredLeadCandidate,
  OutreachEmail,
  ResearchedLead,
  ScoredLead,
  SenderContext,
} from "../types/lead";

/**
 * OpenAI / Groq Tool definitions for the SDR Agent orchestrator.
 */
export const SDR_AGENT_TOOLS: any[] = [
  {
    type: "function",
    function: {
      name: "searchForLeads",
      description:
        "Searches the live web to discover real, verifiable company candidate leads matching an Ideal Customer Profile (ICP) description.",
      parameters: {
        type: "object",
        properties: {
          icpDescription: {
            type: "string",
            description: "The targeted description of ideal customer profile (e.g. industry, product type, target audience).",
          },
          count: {
            type: "number",
            description: "The desired number of companies to discover (e.g. 3 to 10).",
          },
        },
        required: ["icpDescription", "count"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "researchLead",
      description:
        "Conducts multi-source web research on a specific company to extract grounded company summary, likely pain points, recent news, and verifiable facts.",
      parameters: {
        type: "object",
        properties: {
          companyName: {
            type: "string",
            description: "The official name of the candidate company.",
          },
          domain: {
            type: "string",
            description: "The official web domain of the company (e.g. 'linear.app').",
          },
        },
        required: ["companyName", "domain"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scoreICPFit",
      description:
        "Rigorously evaluates a researched company against the stated ICP criteria, producing a 0-100 fit score, reasoning, and disqualification reason if weak fit.",
      parameters: {
        type: "object",
        properties: {
          leadId: {
            type: "string",
            description: "The ID of the researched lead to score.",
          },
          companyName: {
            type: "string",
            description: "The company name.",
          },
          icpCriteria: {
            type: "string",
            description: "The target ICP criteria to evaluate against.",
          },
        },
        required: ["leadId", "companyName", "icpCriteria"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generateOutreachEmail",
      description:
        "Generates a concise, highly personalized cold outreach email grounded in verified research findings for a qualified lead. Do not call this for disqualified leads.",
      parameters: {
        type: "object",
        properties: {
          leadId: {
            type: "string",
            description: "The ID of the qualified scored lead.",
          },
          companyName: {
            type: "string",
            description: "The company name.",
          },
          productPitch: {
            type: "string",
            description: "The product or service value proposition to pitch.",
          },
        },
        required: ["leadId", "companyName", "productPitch"],
      },
    },
  },
];

/**
 * Autonomous SDR Agent loop with toggleable Review Mode vs Autonomous Mode sending.
 */
export async function runSDRAgent(
  icpDescription: string,
  productPitch: string,
  targetLeadCount: number = 3,
  senderContext: SenderContext = {
    senderName: "Alex Rivera",
    senderRole: "Head of Partnerships",
    companyName: "Vanguard Systems",
  },
  approvalMode: ApprovalMode = "review",
  existingCampaignId?: string
): Promise<AgentBatchResult> {
  console.log("=".repeat(80));
  console.log(`🤖 STARTING VANGUARD SDR AGENTIC PIPELINE`);
  console.log(`   ICP Target: "${icpDescription}"`);
  console.log(`   Pitch: "${productPitch}"`);
  console.log(`   Target Count: ${targetLeadCount} leads`);
  console.log(`   ⚙️ MODE: [${approvalMode.toUpperCase()}] (${approvalMode === "review" ? "Manual Review Required Before Sending" : "Auto-Sending Immediately Upon Generation"})`);
  console.log("=".repeat(80));

  let campaignId = existingCampaignId;
  const isDbConfigured = !!(
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes("your_password") &&
    process.env.DATABASE_URL.trim() !== ""
  );

  if (isDbConfigured && !campaignId) {
    try {
      const campaign = await createCampaign({
        icp_description: icpDescription,
        product_pitch: productPitch,
        sender_name: senderContext.senderName,
        sender_role: senderContext.senderRole,
        sender_company: senderContext.companyName,
        approval_mode: approvalMode,
      });
      campaignId = campaign.id;
      console.log(`[Vanguard SDR DB] 🗄️ Created campaign record: ${campaignId}`);
    } catch (dbErr: any) {
      console.warn(`[Vanguard SDR DB] Warning: Could not create campaign in DB: ${dbErr.message}`);
    }
  }

  const discoveredMap = new Map<string, DiscoveredLeadCandidate>();
  const leadIdByDomain = new Map<string, string>();
  const researchedMap = new Map<string, ResearchedLead>();
  const scoredMap = new Map<string, ScoredLead>();
  const toolTraces: AgentToolTrace[] = [];

  const maxIterations = Math.max(12, targetLeadCount * APP_CONFIG.agent.maxIterationsMultiplier);
  let iteration = 0;
  let isComplete = false;

  const messages: any[] = [
    {
      role: "system",
      content: `You are Vanguard SDR, an autonomous AI Sales Development Representative engine.
Your mission is to find ${targetLeadCount} real companies matching the user's ICP, research each thoroughly using real web data, score their fit, and write personalized outreach emails ONLY for qualified leads.

OPERATING PRINCIPLES:
1. First, search for candidate leads using searchForLeads.
2. For each discovered lead, call researchLead to gather real grounded facts.
3. For each researched lead, call scoreICPFit to evaluate ICP alignment.
4. If a lead scores >= ${APP_CONFIG.agent.qualifyingScoreThreshold} (Qualified), call generateOutreachEmail to draft a tailored email.
5. If a lead is disqualified (score < ${APP_CONFIG.agent.qualifyingScoreThreshold}), DO NOT generate an email for it.
6. When all candidate leads have been evaluated and qualified leads have emails generated, finish with a final concise status summary.`,
    },
    {
      role: "user",
      content: `Please discover, research, score, and generate outreach for ${targetLeadCount} leads matching this ICP:
ICP: "${icpDescription}"
Product Pitch: "${productPitch}"
Sender Context: ${senderContext.senderName}, ${senderContext.senderRole} at ${senderContext.companyName}`,
    },
  ];

  while (iteration < maxIterations && !isComplete) {
    iteration++;
    console.log(`\n[Agent Loop] 🔄 Iteration ${iteration}/${maxIterations}...`);

    let response: any;
    try {
      response = await createChatCompletionWithFallback({
        model: APP_CONFIG.groq.defaultModel || DEFAULT_GROQ_MODEL,
        messages,
        tools: SDR_AGENT_TOOLS,
        tool_choice: "auto",
        temperature: 0.1,
      });
    } catch (err: any) {
      console.error(`[Agent Loop] ❌ Error in agent completion:`, err.message || err);
      break;
    }

    const message = response.choices[0]?.message;
    if (!message) break;

    messages.push(message);

    if (!message.tool_calls || message.tool_calls.length === 0) {
      console.log(`\n[Agent Loop] 🏁 Orchestrator completed task:`);
      console.log(`   "${message.content?.trim() || "All pipeline tasks finished."}"`);
      isComplete = true;
      break;
    }

    for (const toolCall of message.tool_calls) {
      const functionName = toolCall.function.name;
      let args: any = {};
      try {
        args = JSON.parse(toolCall.function.arguments || "{}");
      } catch {
        args = {};
      }

      const startTime = Date.now();
      let toolResultStr = "";
      let paramsSummary = "";

      // 1. TOOL: searchForLeads
      if (functionName === "searchForLeads") {
        paramsSummary = `icp: "${args.icpDescription}", count: ${args.count}`;
        console.log(`\n👉 [TOOL CALL] searchForLeads(${paramsSummary})`);

        try {
          const candidates = await searchForLeads(args.icpDescription || icpDescription, args.count || targetLeadCount);
          for (const cand of candidates) {
            discoveredMap.set(cand.domain, cand);

            if (isDbConfigured && !leadIdByDomain.has(cand.domain)) {
              try {
                const leadRecord = await createLead({
                  company_name: cand.companyName,
                  domain: cand.domain,
                  source_url: cand.sourceUrl,
                  icp_id: campaignId || null,
                  status: "discovered",
                });
                leadIdByDomain.set(cand.domain, leadRecord.id);
              } catch (dbLeadErr: any) {
                console.warn(`[Vanguard SDR DB] Could not persist lead ${cand.companyName}:`, dbLeadErr.message);
              }
            }
          }

          toolResultStr = JSON.stringify({
            status: "success",
            countDiscovered: candidates.length,
            candidates: candidates.map((c) => ({
              companyName: c.companyName,
              domain: c.domain,
              sourceUrl: c.sourceUrl,
            })),
          });
          console.log(`   [TOOL RESULT] Discovered ${candidates.length} leads: ${candidates.map((c) => c.companyName).join(", ")}`);
        } catch (err: any) {
          toolResultStr = JSON.stringify({ status: "error", message: err.message || "Search failed" });
          console.log(`   [TOOL RESULT] Error in search: ${err.message}`);
        }
      }

      // 2. TOOL: researchLead
      else if (functionName === "researchLead") {
        paramsSummary = `"${args.companyName}", "${args.domain}"`;
        console.log(`\n👉 [TOOL CALL] researchLead(${paramsSummary})`);

        try {
          const research = await researchLead(args.companyName, args.domain);
          const leadId = leadIdByDomain.get(args.domain) || crypto.randomUUID();
          leadIdByDomain.set(args.domain, leadId);

          const rLead: ResearchedLead = {
            id: leadId,
            companyName: args.companyName,
            domain: args.domain,
            sourceUrl: `https://${args.domain}`,
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

          researchedMap.set(leadId, rLead);
          researchedMap.set(args.domain, rLead);

          if (isDbConfigured) {
            try {
              let dbLeadId = leadId;
              try {
                const existingLead = await createLead({
                  id: dbLeadId,
                  company_name: args.companyName,
                  domain: args.domain,
                  source_url: `https://${args.domain}`,
                  icp_id: campaignId || null,
                  status: "researched",
                });
                dbLeadId = existingLead.id;
              } catch {
                await dbUpdateLeadStatus(dbLeadId, "researched");
              }

              await dbCreateResearch({
                lead_id: dbLeadId,
                company_summary: research.companySummary,
                recent_news: research.recentNews,
                likely_pain_points: research.likelyPainPoints,
                source_urls: research.sourceUrls,
                research_quality: research.researchQuality,
                grounded_facts: research.groundedFacts,
              });
              console.log(`[Vanguard SDR DB] 🗄️ Saved research for ${args.companyName}`);
            } catch (dbResearchErr: any) {
              console.warn(`[Vanguard SDR DB] Could not persist research for ${args.companyName}:`, dbResearchErr.message);
            }
          }

          toolResultStr = JSON.stringify({
            status: "success",
            leadId,
            companyName: args.companyName,
            domain: args.domain,
            researchQuality: research.researchQuality,
            summarySnippet: research.companySummary.substring(0, 150) + "...",
            painPointsFound: research.likelyPainPoints.length,
            groundedFactsCount: research.groundedFacts.length,
          });
          console.log(`   [TOOL RESULT] Research complete for ${args.companyName} (Lead ID: ${leadId}, Quality: ${research.researchQuality})`);
        } catch (err: any) {
          toolResultStr = JSON.stringify({ status: "error", message: err.message || "Research failed" });
          console.log(`   [TOOL RESULT] Research error for ${args.companyName}: ${err.message}`);
        }
      }

      // 3. TOOL: scoreICPFit
      else if (functionName === "scoreICPFit") {
        paramsSummary = `leadId: "${args.leadId}", company: "${args.companyName}"`;
        console.log(`\n👉 [TOOL CALL] scoreICPFit(${paramsSummary})`);

        try {
          let rLead = researchedMap.get(args.leadId);
          if (!rLead) {
            rLead = Array.from(researchedMap.values()).find(
              (l) => l.companyName.toLowerCase() === (args.companyName || "").toLowerCase()
            );
          }

          if (!rLead) {
            toolResultStr = JSON.stringify({
              status: "error",
              message: `Researched lead not found for ID '${args.leadId}'. Please research the lead first.`,
            });
            console.log(`   [TOOL RESULT] Researched lead data not found.`);
          } else {
            const scoreResult = await scoreICPFit(rLead, args.icpCriteria || icpDescription);
            const isQualified = scoreResult.fitScore >= APP_CONFIG.agent.qualifyingScoreThreshold && !scoreResult.disqualifyReason;
            const newStatus = isQualified ? "scored" : "disqualified";

            const scoredLead: ScoredLead = {
              ...rLead,
              fitScore: scoreResult.fitScore,
              reasoning: scoreResult.reasoning,
              disqualifyReason: scoreResult.disqualifyReason,
              status: newStatus,
              scoredAt: new Date().toISOString(),
            };

            scoredMap.set(rLead.id, scoredLead);

            if (isDbConfigured) {
              try {
                await dbUpdateLeadStatus(rLead.id, newStatus, scoreResult.fitScore);
                console.log(`[Vanguard SDR DB] 🗄️ Updated lead ${rLead.companyName} status: ${newStatus}, score: ${scoreResult.fitScore}`);
              } catch (dbScoreErr: any) {
                console.warn(`[Vanguard SDR DB] Could not update lead score in DB:`, dbScoreErr.message);
              }
            }

            toolResultStr = JSON.stringify({
              status: "success",
              leadId: rLead.id,
              companyName: rLead.companyName,
              fitScore: scoreResult.fitScore,
              isQualified,
              disqualifyReason: scoreResult.disqualifyReason,
              reasoning: scoreResult.reasoning,
            });
            console.log(`   [TOOL RESULT] Score: ${scoreResult.fitScore}/100 -> ${isQualified ? "QUALIFIED" : `DISQUALIFIED (${scoreResult.disqualifyReason})`}`);
          }
        } catch (err: any) {
          toolResultStr = JSON.stringify({ status: "error", message: err.message || "Scoring failed" });
          console.log(`   [TOOL RESULT] Scoring error: ${err.message}`);
        }
      }

      // 4. TOOL: generateOutreachEmail
      else if (functionName === "generateOutreachEmail") {
        paramsSummary = `leadId: "${args.leadId}", company: "${args.companyName}"`;
        console.log(`\n👉 [TOOL CALL] generateOutreachEmail(${paramsSummary})`);

        try {
          let sLead = scoredMap.get(args.leadId);
          if (!sLead) {
            sLead = Array.from(scoredMap.values()).find(
              (l) => l.companyName.toLowerCase() === (args.companyName || "").toLowerCase()
            );
          }

          if (!sLead) {
            toolResultStr = JSON.stringify({
              status: "error",
              message: `Scored lead not found for '${args.leadId}'. Please score the lead first.`,
            });
            console.log(`   [TOOL RESULT] Scored lead not found.`);
          } else {
            const email = await generateOutreachEmail(sLead, args.productPitch || productPitch, senderContext);
            const initialEmailStatus = approvalMode === "autonomous" ? "approved" : "pending_approval";
            const leadStatus = approvalMode === "autonomous" ? "sent" : "pending_approval";

            sLead.outreachEmail = email;
            sLead.status = leadStatus;

            let emailId: string = crypto.randomUUID();

            if (isDbConfigured) {
              try {
                const storedEmail = await dbCreateOutreachEmail({
                  lead_id: sLead.id,
                  sequence_number: 1,
                  subject: email.subject,
                  body: email.body,
                  personalization_hooks_used: email.personalizationHooksUsed,
                  angle_used: email.angleUsed || "pain_point_focus",
                  status: initialEmailStatus,
                });
                emailId = storedEmail.id;
                await dbUpdateLeadStatus(sLead.id, leadStatus);
                console.log(`[Vanguard SDR DB] 🗄️ Saved outreach email for ${sLead.companyName} (status: ${initialEmailStatus})`);
              } catch (dbEmailErr: any) {
                console.warn(`[Vanguard SDR DB] Could not persist email in DB:`, dbEmailErr.message);
              }
            }

            // AUTONOMOUS MODE: Auto-send immediately
            if (approvalMode === "autonomous") {
              console.log(`🚀 [AUTONOMOUS MODE ACTIVE] Automatically sending outreach email to ${sLead.companyName}...`);
              const sendResult = await sendOutreachEmail(emailId, `contact@${sLead.domain}`);
              console.log(`[AUTONOMOUS SEND RESULT] Sent: ${sendResult.success} (Recipient: ${sendResult.actualRecipient})`);

              // Schedule first follow-up in DB
              if (isDbConfigured) {
                try {
                  const { scheduleNextFollowUp } = require("./db");
                  await scheduleNextFollowUp(sLead.id, 4, 0);
                  console.log(`[Vanguard SDR DB] ⏰ Scheduled Follow-Up #1 in 4 days for ${sLead.companyName}`);
                } catch {}
              }
            } else {
              console.log(`📋 [REVIEW MODE ACTIVE] Email saved as 'pending_approval'. Waiting for manual human approval.`);
            }

            toolResultStr = JSON.stringify({
              status: "success",
              leadId: sLead.id,
              emailId,
              companyName: sLead.companyName,
              subject: email.subject,
              wordCount: email.wordCount,
              approvalMode,
              deliveryStatus: approvalMode === "autonomous" ? "sent" : "pending_approval",
            });
            console.log(`   [TOOL RESULT] Email created (${email.wordCount} words, Mode: ${approvalMode.toUpperCase()})`);
          }
        } catch (err: any) {
          toolResultStr = JSON.stringify({ status: "error", message: err.message || "Email generation failed" });
          console.log(`   [TOOL RESULT] Email generation error: ${err.message}`);
        }
      } else {
        toolResultStr = JSON.stringify({ status: "error", message: `Unknown function '${functionName}'` });
      }

      const durationMs = Date.now() - startTime;
      toolTraces.push({
        timestamp: new Date().toISOString(),
        tool: functionName,
        paramsSummary,
        resultSummary: toolResultStr.length > 200 ? toolResultStr.substring(0, 200) + "..." : toolResultStr,
        durationMs,
      });

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: toolResultStr,
      });
    }
  }

  if (iteration >= maxIterations && !isComplete) {
    console.warn(`\n[Agent Loop] ⚠️ Maximum iteration cap (${maxIterations}) reached without clean completion.`);
  }

  const finalLeads = Array.from(scoredMap.values());
  const qualifiedCount = finalLeads.filter((l) => l.fitScore >= APP_CONFIG.agent.qualifyingScoreThreshold).length;
  const disqualifiedCount = finalLeads.length - qualifiedCount;

  return {
    campaignId,
    icpDescription,
    productPitch,
    totalDiscovered: discoveredMap.size,
    totalResearched: Array.from(new Set(Array.from(researchedMap.values()).map((l) => l.id))).length,
    totalScored: finalLeads.length,
    totalQualified: qualifiedCount,
    totalDisqualified: disqualifiedCount,
    leads: finalLeads,
    toolTraces,
    iterations: iteration,
    completed: isComplete,
  };
}
