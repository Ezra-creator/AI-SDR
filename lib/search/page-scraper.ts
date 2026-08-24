import axios from "axios";
import * as cheerio from "cheerio";
import { APP_CONFIG } from "../config";

export interface ScrapedPageResult {
  url: string;
  title: string;
  textContent: string;
  success: boolean;
  error?: string;
}

/**
 * Fetches and cleans textual content from a webpage URL.
 */
export async function scrapePageContent(url: string): Promise<ScrapedPageResult> {
  try {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;

    const response = await axios.get(formattedUrl, {
      headers: {
        "User-Agent": APP_CONFIG.search.userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: APP_CONFIG.search.requestTimeoutMs,
      maxRedirects: 5,
    });

    const html = response.data;
    if (typeof html !== "string") {
      return {
        url: formattedUrl,
        title: "",
        textContent: "",
        success: false,
        error: "Non-HTML response received",
      };
    }

    const $ = cheerio.load(html);

    // Remove noise elements
    $(
      "script, style, svg, noscript, nav, footer, iframe, header, [role='banner'], [role='navigation'], [role='contentinfo'], .cookie-banner, #cookie-notice"
    ).remove();

    const title = $("title").text().trim() || $("h1").first().text().trim() || "";

    // Extract main text or body text
    const mainContent = $("main, #main, article, .content, #content, body").first();
    let text = (mainContent.length ? mainContent.text() : $("body").text())
      .replace(/\s+/g, " ")
      .trim();

    if (text.length > APP_CONFIG.research.maxCharsPerPage) {
      text = text.substring(0, APP_CONFIG.research.maxCharsPerPage) + "... [truncated]";
    }

    return {
      url: formattedUrl,
      title,
      textContent: text,
      success: text.length > 50,
      error: text.length <= 50 ? "Insufficient content on page" : undefined,
    };
  } catch (error: any) {
    return {
      url,
      title: "",
      textContent: "",
      success: false,
      error: error.message || "Failed to fetch page",
    };
  }
}
