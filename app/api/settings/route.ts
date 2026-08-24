import { NextResponse } from "next/server";
import { APP_CONFIG, DEFAULT_GROQ_MODEL, PRODUCT_NAME, PRODUCT_TAGLINE } from "../../../lib/config";
import { resolveRecipientSafety } from "../../../lib/email-sending";

export async function GET() {
  const safety = resolveRecipientSafety("contact@target.com");

  return NextResponse.json({
    productName: PRODUCT_NAME,
    productTagline: PRODUCT_TAGLINE,
    defaultModel: APP_CONFIG.groq.defaultModel || DEFAULT_GROQ_MODEL,
    testModeRecipientOverride: safety.overrideEmail,
    isTestOverrideActive: safety.isOverridden,
    isDbConfigured: !!(
      process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("your_password") &&
      process.env.DATABASE_URL.trim() !== ""
    ),
    isResendConfigured: !!(
      process.env.RESEND_API_KEY &&
      !process.env.RESEND_API_KEY.includes("your_resend_api_key") &&
      process.env.RESEND_API_KEY.trim() !== ""
    ),
  });
}
