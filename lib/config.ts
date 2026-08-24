import dotenv from "dotenv";
dotenv.config();

export const PRODUCT_NAME = "Vanguard SDR";
export const PRODUCT_TAGLINE = "High-Precision Grounded AI Sales Development Representative";

/**
 * Verified live Groq models.
 */
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
export const FAST_GROQ_MODEL = "openai/gpt-oss-20b";

export const APP_CONFIG = {
  groq: {
    apiKey: process.env.GROQ_API_KEY || "",
    defaultModel: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
    fastModel: FAST_GROQ_MODEL,
    maxTokens: 4096,
    temperature: 0.1, // low temperature to ensure factual precision
  },
  search: {
    maxResultsPerQuery: 8,
    requestTimeoutMs: 12000,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    maxConcurrentSearches: 3,
  },
  research: {
    maxPagesPerCompany: 4,
    maxCharsPerPage: 10000,
    minContentLengthForHighQuality: 500,
  },
  agent: {
    maxIterationsMultiplier: 4,
    qualifyingScoreThreshold: 60,
  },
};
