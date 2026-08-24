import { NextRequest, NextResponse } from "next/server";
import { getEmailById, updateEmailStatus } from "../../../../../lib/db";
import { sendOutreachEmail } from "../../../../../lib/email-sending";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const emailId = resolvedParams.id;

    if (!emailId) {
      return NextResponse.json({ error: "Missing email ID" }, { status: 400 });
    }

    const email = await getEmailById(emailId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    if (email.status === "sent") {
      return NextResponse.json(
        { error: "Email has already been sent" },
        { status: 400 }
      );
    }

    // 1. Mark status as approved
    await updateEmailStatus(emailId, "approved");

    // 2. Trigger real sending via Resend (with safety override)
    const sendResult = await sendOutreachEmail(emailId);

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: sendResult.error || "Failed to send email via Resend",
          isTestOverride: sendResult.isTestOverride,
          actualRecipient: sendResult.actualRecipient,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId,
      status: "sent",
      resendMessageId: sendResult.resendMessageId,
      actualRecipient: sendResult.actualRecipient,
      originalIntendedRecipient: sendResult.originalIntendedRecipient,
      isTestOverride: sendResult.isTestOverride,
    });
  } catch (error: any) {
    console.error("[API Approve Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
