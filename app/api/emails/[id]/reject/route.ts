import { NextRequest, NextResponse } from "next/server";
import { getEmailById, updateEmailStatus } from "../../../../../lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
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
        { error: "Cannot reject an email that has already been sent" },
        { status: 400 }
      );
    }

    // Mark status as rejected
    const updated = await updateEmailStatus(emailId, "rejected");

    return NextResponse.json({
      success: true,
      emailId,
      status: "rejected",
      message: "Email draft marked as rejected",
    });
  } catch (error: any) {
    console.error("[API Reject Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
