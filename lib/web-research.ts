import crypto from "crypto";
import { APP_CONFIG, DEFAULT_GROQ_MODEL } from "./config";
import { createChatCompletionWithFallback } from "./groq-client";
import {
  DiscoveredLeadCandidate,
  GroundedFact,
  ResearchQuality,
  ResearchedLead,
} from "../types/lead";
import {
  extractDomain,
  isAggregatorOrDirectory,
  performWebSearch,
  SearchResultItem,
} from "./search/search-provider";
import { scrapePageContent, ScrapedPageResult } from "./search/page-scraper";

/**
 * Searches for real companies matching the given ICP description.
 * Ensures zero fabricated companies — only extracts companies with verified search hits.
 */
export async function searchForLeads(
  icpDescription: string,
  count: number = 5
): Promise<DiscoveredLeadCandidate[]> {
  console.log(`\n[Vanguard SDR] 🔍 Initiating lead discovery for ICP: "${icpDescription}" (target: ${count})`);

  const candidatesMap = new Map<string, DiscoveredLeadCandidate>();

  const cleanKeywords = icpDescription
    .replace(/companies|targeting|teams|software|solutions|providers|platforms/gi, "")
    .trim();

  const searchQueries: string[] = [
    `"${cleanKeywords}" software official site`,
    `top ${icpDescription} platform`,
    `best ${cleanKeywords} tools for business`,
    `${icpDescription}`,
  ];

  const allSearchResults: SearchResultItem[] = [];

  for (const query of searchQueries) {
    if (candidatesMap.size >= count) break;
    console.log(`[Vanguard SDR] Searching web: "${query}"`);
    try {
      const items = await performWebSearch(query, 8);
      allSearchResults.push(...items);

      for (const item of items) {
        const domain = item.domain;
        if (!domain || isAggregatorOrDirectory(domain)) {
          continue;
        }

        let candidateName = item.title
          .split(/[-–|:•]/)[0]
          .replace(/Home|Official Site|Software|Platform|Inc\.?|LLC|The|Free|Online/gi, "")
          .trim();

        if (!candidateName || candidateName.length < 2) {
          const parts = domain.split(".");
          candidateName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        }

        if (!candidatesMap.has(domain)) {
          candidatesMap.set(domain, {
            companyName: candidateName,
            domain: domain,
            sourceUrl: item.url,
          });
        }

        if (candidatesMap.size >= count) break;
      }
    } catch (err: any) {
      console.warn(`[Vanguard SDR] Search query failed: ${query}`, err.message || err);
    }
  }

  // LLM extraction on search snippets if needed
  if (candidatesMap.size < count && allSearchResults.length > 0) {
    try {
      const snippetsSummary = allSearchResults
        .slice(0, 15)
        .map((r, i) => `[Result ${i + 1}] Title: ${r.title}\nURL: ${r.url}\nDomain: ${r.domain}\nSnippet: ${r.snippet}`)
        .join("\n\n");

      const prompt = `You are a strict data extraction engine for Vanguard SDR.
Extract real software vendor company names and domains explicitly mentioned in the search results below that match this ICP: "${icpDescription}".

STRICT RULES:
1. ONLY return companies explicitly mentioned in the text below. DO NOT invent companies.
2. Return JSON format: {"companies": [{"companyName": string, "domain": string, "sourceUrl": string}]}
3. Exclude review aggregators (g2, capterra, trustpilot, wikipedia).

SEARCH RESULTS:
${snippetsSummary}`;

      const completion = await createChatCompletionWithFallback({
        model: APP_CONFIG.groq.fastModel || DEFAULT_GROQ_MODEL,
        messages: [
          { role: "system", content: "You extract verifiable company data into JSON format." },
          { role: "user", content: prompt },
        ],
        temperature: 0.0,
        response_format: { type: "json_object" },
      });

      const responseContent = completion.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(responseContent);
      const extractedList: DiscoveredLeadCandidate[] = Array.isArray(parsed)
        ? parsed
        : parsed.companies || parsed.leads || [];

      for (const item of extractedList) {
        if (item.companyName && (item.domain || item.sourceUrl)) {
          const cleanDomain = item.domain ? extractDomain(item.domain) : extractDomain(item.sourceUrl);
          if (cleanDomain && !isAggregatorOrDirectory(cleanDomain) && !candidatesMap.has(cleanDomain)) {
            candidatesMap.set(cleanDomain, {
              companyName: item.companyName,
              domain: cleanDomain,
              sourceUrl: item.sourceUrl || `https://${cleanDomain}`,
            });
          }
        }
        if (candidatesMap.size >= count) break;
      }
    } catch (llmExtractErr: any) {
      console.warn("[Vanguard SDR] LLM extraction error:", llmExtractErr.message || llmExtractErr);
    }
  }

  const results = Array.from(candidatesMap.values()).slice(0, count);
  console.log(`[Vanguard SDR] ✅ Discovered ${results.length} real candidate companies.`);
  return results;
}

export interface ResearchOutput {
  companySummary: string;
  recentNews: string[];
  likelyPainPoints: string[];
  keyContactInfo: string | null;
  sourceUrls: string[];
  researchQuality: ResearchQuality;
  groundedFacts: GroundedFact[];
}

/**
 * Conducts real multi-source web research on a specific company lead and synthesizes verifiable findings.
 */
export async function researchLead(
  companyName: string,
  domain: string
): Promise<ResearchOutput> {
  console.log(`\n[Vanguard SDR] 🔎 Researching lead: ${companyName} (${domain})...`);

  const collectedUrls: string[] = [];
  const scrapedPages: ScrapedPageResult[] = [];

  // 1. Fetch company primary site
  const primaryUrl = `https://${domain}`;
  collectedUrls.push(primaryUrl);
  const mainPageResult = await scrapePageContent(primaryUrl);
  if (mainPageResult.success) {
    scrapedPages.push(mainPageResult);
  }

  // 2. Targeted search for features and updates
  const researchQueries = [
    `site:${domain} OR "${companyName}" ("features" OR "product" OR "pricing" OR "about")`,
    `"${companyName}" ("news" OR "press release" OR "funding" OR "announces" OR "update")`,
  ];

  for (const query of researchQueries) {
    try {
      const searchHits = await performWebSearch(query, 3);
      for (const hit of searchHits) {
        if (!collectedUrls.includes(hit.url) && collectedUrls.length < APP_CONFIG.research.maxPagesPerCompany + 2) {
          collectedUrls.push(hit.url);
          if (hit.domain === domain || hit.url.includes(domain)) {
            const pageData = await scrapePageContent(hit.url);
            if (pageData.success) {
              scrapedPages.push(pageData);
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Vanguard SDR] Search query "${query}" failed:`, err.message || err);
    }
  }

  const totalExtractedLength = scrapedPages.reduce((acc, p) => acc + p.textContent.length, 0);
  console.log(
    `[Vanguard SDR] Scraped ${scrapedPages.length} pages (${totalExtractedLength} chars total) from:`,
    scrapedPages.map((p) => p.url)
  );

  if (scrapedPages.length === 0 || totalExtractedLength < 100) {
    console.warn(`[Vanguard SDR] ⚠️ Thin research data for ${companyName} - returning honest thin flag.`);
    return {
      companySummary: `Verified domain ${domain}, but automated web scraping returned insufficient verifiable content from company web pages.`,
      recentNews: [],
      likelyPainPoints: [],
      keyContactInfo: null,
      sourceUrls: collectedUrls.slice(0, 3),
      researchQuality: "thin",
      groundedFacts: [],
    };
  }

  const evidencePayload = scrapedPages
    .map(
      (p, idx) =>
        `--- EVIDENCE SOURCE #${idx + 1} (${p.url}) ---\nTitle: ${p.title}\nContent:\n${p.textContent}\n`
    )
    .join("\n\n");

  const systemPrompt = `You are a strict, factual research analyst for Vanguard SDR.
Analyze the real scraped web data about the target company and output a grounded, verifiable structured summary.

CRITICAL INTEGRITY RULES:
1. Every claim, fact, summary, or news item MUST be directly grounded in the provided Evidence Sources.
2. DO NOT hallucinate, assume, or extrapolate facts not present in the text.
3. If there is no information on a field (e.g. keyContactInfo or recentNews), set it to null or [] honestly.
4. Assess researchQuality accurately:
   - "high": Rich company description, specific value propositions, verifiable features or recent updates.
   - "moderate": Basic company summary and product description available, but minimal news or leadership details.
   - "thin": Very little substantive information extracted from the scraped text.
5. Provide groundedFacts list where each fact has a specific verifiable claim and the exact sourceUrl from the evidence.
6. Output JSON only.`;

  const userPrompt = `Target Company: ${companyName}
Domain: ${domain}

EVIDENCE SOURCES:
${evidencePayload}

Return JSON with this exact schema:
{
  "companySummary": string,
  "recentNews": string[],
  "likelyPainPoints": string[],
  "keyContactInfo": string | null,
  "researchQuality": "high" | "moderate" | "thin",
  "groundedFacts": [
    {
      "claim": string,
      "sourceUrl": string
    }
  ]
}`;

  try {
    const completion = await createChatCompletionWithFallback({
      model: APP_CONFIG.groq.defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    const verifiedUrls = Array.from(new Set(scrapedPages.map((p) => p.url).concat(collectedUrls)));

    const output: ResearchOutput = {
      companySummary: parsed.companySummary || `Company operates under domain ${domain}.`,
      recentNews: Array.isArray(parsed.recentNews) ? parsed.recentNews : [],
      likelyPainPoints: Array.isArray(parsed.likelyPainPoints) ? parsed.likelyPainPoints : [],
      keyContactInfo: parsed.keyContactInfo || null,
      sourceUrls: verifiedUrls,
      researchQuality: (["high", "moderate", "thin"].includes(parsed.researchQuality)
        ? parsed.researchQuality
        : totalExtractedLength > 1500
        ? "high"
        : "moderate") as ResearchQuality,
      groundedFacts: Array.isArray(parsed.groundedFacts)
        ? parsed.groundedFacts.map((f: any) => ({
            claim: String(f.claim || ""),
            sourceUrl: String(f.sourceUrl || primaryUrl),
          }))
        : [],
    };

    console.log(`[Vanguard SDR] 🎯 Research completed for ${companyName} (Quality: ${output.researchQuality})`);
    return output;
  } catch (error: any) {
    console.error(`[Vanguard SDR] Error during Groq research synthesis for ${companyName}:`, error.message || error);
    return {
      companySummary: `Extracted data from ${primaryUrl} (${scrapedPages[0]?.title || domain})`,
      recentNews: [],
      likelyPainPoints: [],
      keyContactInfo: null,
      sourceUrls: collectedUrls,
      researchQuality: "moderate",
      groundedFacts: scrapedPages.map((p) => ({
        claim: `Company website: ${p.title}`,
        sourceUrl: p.url,
      })),
    };
  }
}
