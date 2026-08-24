import { NextRequest, NextResponse } from "next/server";
import { getEmailById, updateEmailContent } from "../../../../../lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const emailId = resolvedParams.id;

    if (!emailId) {
      return NextResponse.json({ error: "Missing email ID" }, { status: 400 });
    }

    const bodyJson = await request.json();
    const { subject, body } = bodyJson;

    if (!subject || !body || typeof subject !== "string" || typeof body !== "string") {
      return NextResponse.json(
        { error: "Both subject and body are required strings." },
        { status: 400 }
      );
    }

    const email = await getEmailById(emailId);
    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    if (email.status === "sent") {
      return NextResponse.json(
        { error: "Cannot edit an email that has already been sent" },
        { status: 400 }
      );
    }

    const updated = await updateEmailContent(emailId, subject.trim(), body.trim());

    return NextResponse.json({
      success: true,
      email: updated,
      message: "Email content updated successfully.",
    });
  } catch (error: any) {
    console.error("[API Edit Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
