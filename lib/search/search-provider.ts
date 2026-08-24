import axios from "axios";
import * as cheerio from "cheerio";
import { APP_CONFIG } from "../config";

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  domain: string;
}

/**
 * Decodes Bing redirect link if present (format: /ck/a?!...&u=a1<base64>&...)
 */
export function decodeBingUrl(rawUrl: string): string {
  try {
    if (!rawUrl.includes("bing.com/ck/a?")) {
      return rawUrl;
    }
    const parsed = new URL(rawUrl);
    const uParam = parsed.searchParams.get("u");
    if (!uParam) return rawUrl;

    const base64Str = uParam.startsWith("a1") ? uParam.substring(2) : uParam;
    const decoded = Buffer.from(base64Str, "base64").toString("utf-8");
    if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
      return decoded;
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

/**
 * Decodes DuckDuckGo redirect link if present.
 */
export function decodeDdgUrl(rawUrl: string): string {
  try {
    if (rawUrl.startsWith("//")) {
      rawUrl = "https:" + rawUrl;
    }
    if (rawUrl.includes("duckduckgo.com/l/?uddg=")) {
      const parsed = new URL(rawUrl);
      const target = parsed.searchParams.get("uddg");
      if (target) return decodeURIComponent(target);
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}

/**
 * Extracts a clean root or sub-domain from a raw URL.
 */
export function extractDomain(rawUrl: string): string {
  try {
    let cleanUrl = decodeBingUrl(decodeDdgUrl(rawUrl));
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }
    const parsed = new URL(cleanUrl);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function cleanSearchUrl(rawUrl: string): string {
  return decodeBingUrl(decodeDdgUrl(rawUrl));
}

/**
 * List of domain patterns that are aggregators, social networks, or search engines rather than target company homepages.
 */
const NON_COMPANY_DOMAINS = [
  "bing.com",
  "google.com",
  "duckduckgo.com",
  "yahoo.com",
  "wikipedia.org",
  "reddit.com",
  "youtube.com",
  "quora.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "medium.com",
  "pinterest.com",
  "github.com",
  "apple.com",
  "play.google.com",
  "apps.apple.com",
  "trustpilot.com",
  "glassdoor.com",
  "indeed.com",
  "zoominfo.com",
  "crunchbase.com",
  "forbes.com",
  "techcrunch.com",
  "bloomberg.com",
  "businesswire.com",
  "prnewswire.com",
];

export function isAggregatorOrDirectory(domain: string): boolean {
  return NON_COMPANY_DOMAINS.some(
    (bad) => domain === bad || domain.endsWith("." + bad)
  );
}

/**
 * Executes a real multi-engine web search (Bing, DDG, Yahoo) to find live grounded results.
 */
export async function performWebSearch(
  query: string,
  limit: number = APP_CONFIG.search.maxResultsPerQuery
): Promise<SearchResultItem[]> {
  const results: SearchResultItem[] = [];
  const seenUrls = new Set<string>();

  const headers = {
    "User-Agent": APP_CONFIG.search.userAgent,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  // 1. Primary Engine: Bing (with US English parameters)
  try {
    const bingRes = await axios.get(
      `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en-US&cc=US&count=${limit * 2}`,
      {
        headers,
        timeout: APP_CONFIG.search.requestTimeoutMs,
      }
    );

    const $ = cheerio.load(bingRes.data);
    $("li.b_algo").each((_, el) => {
      if (results.length >= limit) return false;

      const titleEl = $(el).find("h2 a");
      const title = titleEl.text().trim();
      const rawHref = titleEl.attr("href") || "";
      const snippet = $(el).find(".b_caption p, .b_lineclamp").text().trim();

      const url = cleanSearchUrl(rawHref);
      const domain = extractDomain(url);

      if (url && domain && title && !seenUrls.has(url)) {
        seenUrls.add(url);
        results.push({ title, url, snippet, domain });
      }
    });
  } catch (err: any) {
    console.warn(`[SearchProvider] Bing search query "${query}" failed:`, err.message || err);
  }

  // 2. Secondary Engine: Yahoo search fallback
  if (results.length < limit) {
    try {
      const yahooRes = await axios.get(
        `https://search.yahoo.com/search?p=${encodeURIComponent(query)}&n=${limit * 2}`,
        {
          headers,
          timeout: APP_CONFIG.search.requestTimeoutMs,
        }
      );

      const $ = cheerio.load(yahooRes.data);
      $("div.dd.algo").each((_, el) => {
        if (results.length >= limit) return false;

        const titleEl = $(el).find("h3 a");
        const title = titleEl.text().trim();
        const rawHref = titleEl.attr("href") || "";
        const snippet = $(el).find(".compText").text().trim();

        const url = cleanSearchUrl(rawHref);
        const domain = extractDomain(url);

        if (url && domain && title && !seenUrls.has(url)) {
          seenUrls.add(url);
          results.push({ title, url, snippet, domain });
        }
      });
    } catch (err: any) {
      console.warn(`[SearchProvider] Yahoo search query "${query}" failed:`, err.message || err);
    }
  }

  return results;
}
