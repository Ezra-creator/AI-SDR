import Groq from "groq-sdk";
import { APP_CONFIG, DEFAULT_GROQ_MODEL, FAST_GROQ_MODEL } from "./config";

let groqInstance: Groq | null = null;

export const FALLBACK_MODELS = [
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-120b",
  "groq/compound-mini",
  "groq/compound",
];

/**
 * Retrieves or initializes the Groq client instance.
 */
export function getGroqClient(): Groq {
  if (groqInstance) {
    return groqInstance;
  }

  const apiKey = APP_CONFIG.groq.apiKey || process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_groq_api_key_here") {
    throw new Error(
      "[Vanguard SDR] Missing GROQ_API_KEY environment variable. Please configure it in your .env file or environment."
    );
  }

  groqInstance = new Groq({ apiKey });
  return groqInstance;
}

export interface ModelInfo {
  id: string;
  created: number;
  ownedBy: string;
  active: boolean;
  contextWindow?: number;
}

/**
 * Verifies live available models directly from the Groq API.
 */
export async function listAvailableModels(): Promise<ModelInfo[]> {
  try {
    const groq = getGroqClient();
    const response = await groq.models.list();

    const models: ModelInfo[] = response.data.map((m: any) => ({
      id: m.id,
      created: m.created || 0,
      ownedBy: m.owned_by || "groq",
      active: m.active !== false,
      contextWindow: m.context_window,
    }));

    return models;
  } catch (error: any) {
    console.error("[Vanguard SDR] Error listing Groq models:", error.message || error);
    throw error;
  }
}

/**
 * Executes a chat completion with automatic fallback across available Groq models
 * if rate limits (429) or temporary outages occur.
 */
export async function createChatCompletionWithFallback(
  params: any
): Promise<any> {
  const groq = getGroqClient();
  const requestedModel = params.model || APP_CONFIG.groq.defaultModel || DEFAULT_GROQ_MODEL;

  const candidateModels = Array.from(
    new Set([requestedModel, FAST_GROQ_MODEL, ...FALLBACK_MODELS])
  );

  let lastError: any = null;

  for (const modelId of candidateModels) {
    try {
      const response = await groq.chat.completions.create({
        ...params,
        model: modelId,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      if (err.status === 429 || err.message?.includes("Rate limit") || err.message?.includes("rate_limit")) {
        console.warn(`[Vanguard SDR] ⚠️ Model ${modelId} hit rate limit. Falling back to alternative model...`);
        continue;
      }
      // If it's another error, try fallback models as well
      console.warn(`[Vanguard SDR] Model ${modelId} returned error (${err.message}). Trying fallback...`);
    }
  }

  throw lastError || new Error("[Vanguard SDR] All Groq models failed.");
}
