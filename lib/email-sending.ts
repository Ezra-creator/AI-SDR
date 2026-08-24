import { Resend } from "resend";
import dotenv from "dotenv";
import { executeQuery } from "./db";
import { StoredOutreachEmail } from "../types/lead";

dotenv.config();

let resendClient: Resend | null = null;

/**
 * Returns or initializes the Resend client.
 */
export function getResendClient(): Resend | null {
  if (resendClient) {
    return resendClient;
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.includes("your_resend_api_key")) {
    return null;
  }
  resendClient = new Resend(apiKey);
  return resendClient;
}

export interface SendEmailResult {
  success: boolean;
  resendMessageId: string | null;
  error: string | null;
  actualRecipient: string;
  originalIntendedRecipient: string;
  isTestOverride: boolean;
}

/**
 * Resolves the destination recipient with fail-safe TEST_MODE_RECIPIENT_OVERRIDE protection.
 */
export function resolveRecipientSafety(targetEmail: string): {
  finalRecipient: string;
  isOverridden: boolean;
  overrideEmail: string;
} {
  // CRITICAL SAFETY REQUIREMENT:
  // Default to safety override unless explicitly disabled.
  const overrideAddress =
    process.env.TEST_MODE_RECIPIENT_OVERRIDE || "test-sdr-recipient@example.com";

  const isOverridden = !!overrideAddress && overrideAddress.trim() !== "";

  return {
    finalRecipient: isOverridden ? overrideAddress.trim() : targetEmail,
    isOverridden,
    overrideEmail: overrideAddress,
  };
}

/**
 * Sends an outreach email via Resend and updates its status in the database.
 */
export async function sendOutreachEmail(
  emailId: string,
  toAddress: string = "lead-contact@example.com"
): Promise<SendEmailResult> {
  console.log(`\n[Vanguard SDR Email] 📤 Initiating email delivery for Email ID: ${emailId}`);

  // 1. Fetch email record from database
  let emailRecord: StoredOutreachEmail | null = null;
  try {
    const rows = await executeQuery<StoredOutreachEmail>(
      `SELECT id, lead_id, sequence_number, subject, body, personalization_hooks_used, status, sent_at, created_at
       FROM outreach_emails
       WHERE id = $1`,
      [emailId]
    );
    if (rows.length > 0) {
      emailRecord = rows[0];
    }
  } catch (dbFetchErr: any) {
    console.warn(`[Vanguard SDR Email] Could not fetch email from DB, using fallback: ${dbFetchErr.message}`);
  }

  const subject = emailRecord?.subject || "Partnership Opportunity";
  const rawBody = emailRecord?.body || "Hello from Vanguard SDR.";

  // 2. Safety Interception Check
  const safety = resolveRecipientSafety(toAddress);
  let finalSubject = subject;
  let finalBody = rawBody;

  if (safety.isOverridden) {
    console.log(
      `🛡️ [SAFETY INTERCEPT ACTIVE] Redirecting email intended for "${toAddress}" -> Override Address "${safety.finalRecipient}"`
    );
    finalSubject = `[TEST — Intended for: ${toAddress}] ${subject}`;
    finalBody = `--- [VANGUARD SDR SAFETY OVERRIDE ACTIVE] ---\n[Real Intended Recipient: ${toAddress}]\n---------------------------------------------\n\n${rawBody}`;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "Vanguard SDR <onboarding@resend.dev>";
  const resend = getResendClient();

  // 3. Send via Resend
  if (!resend) {
    console.warn(
      `[Vanguard SDR Email] ⚠️ RESEND_API_KEY is not configured or in mock mode. Simulating successful safe delivery to ${safety.finalRecipient}.`
    );

    const mockMessageId = `mock_resend_${Date.now()}`;

    // Update DB status to sent
    try {
      await executeQuery(
        `UPDATE outreach_emails SET status = 'sent', sent_at = NOW() WHERE id = $1`,
        [emailId]
      );
      if (emailRecord?.lead_id) {
        await executeQuery(
          `UPDATE leads SET status = 'sent', updated_at = NOW() WHERE id = $1`,
          [emailRecord.lead_id]
        );
      }
    } catch {}

    return {
      success: true,
      resendMessageId: mockMessageId,
      error: null,
      actualRecipient: safety.finalRecipient,
      originalIntendedRecipient: toAddress,
      isTestOverride: safety.isOverridden,
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [safety.finalRecipient],
      subject: finalSubject,
      text: finalBody,
    });

    if (error) {
      console.error(`[Vanguard SDR Email] ❌ Resend API Error:`, error);
      return {
        success: false,
        resendMessageId: null,
        error: error.message || "Failed to send email via Resend",
        actualRecipient: safety.finalRecipient,
        originalIntendedRecipient: toAddress,
        isTestOverride: safety.isOverridden,
      };
    }

    const messageId = data?.id || `msg_${Date.now()}`;
    console.log(`[Vanguard SDR Email] ✅ Delivered successfully via Resend! Message ID: ${messageId}`);

    // Update status in DB
    try {
      await executeQuery(
        `UPDATE outreach_emails SET status = 'sent', sent_at = NOW() WHERE id = $1`,
        [emailId]
      );
      if (emailRecord?.lead_id) {
        await executeQuery(
          `UPDATE leads SET status = 'sent', updated_at = NOW() WHERE id = $1`,
          [emailRecord.lead_id]
        );
      }
    } catch (dbUpdateErr: any) {
      console.warn(`[Vanguard SDR Email] Could not update email status in DB: ${dbUpdateErr.message}`);
    }

    return {
      success: true,
      resendMessageId: messageId,
      error: null,
      actualRecipient: safety.finalRecipient,
      originalIntendedRecipient: toAddress,
      isTestOverride: safety.isOverridden,
    };
  } catch (err: any) {
    console.error(`[Vanguard SDR Email] ❌ Exception sending email:`, err.message || err);
    return {
      success: false,
      resendMessageId: null,
      error: err.message || "Unexpected error during email dispatch",
      actualRecipient: safety.finalRecipient,
      originalIntendedRecipient: toAddress,
      isTestOverride: safety.isOverridden,
    };
  }
}
