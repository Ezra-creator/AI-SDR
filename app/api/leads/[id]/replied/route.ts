import { NextRequest, NextResponse } from "next/server";
import { getLeadWithFullHistory, markLeadAsReplied } from "../../../../../lib/db";

/**
 * Manual reply webhook / endpoint.
 * When a sales rep or system identifies that a lead has replied to an email,
 * calling this endpoint immediately marks the lead as replied (has_replied = true)
 * and halts all future scheduled follow-ups.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const leadId = resolvedParams.id;

    if (!leadId) {
      return NextResponse.json({ error: "Missing lead ID" }, { status: 400 });
    }

    const fullHistory = await getLeadWithFullHistory(leadId);
    if (!fullHistory) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const updated = await markLeadAsReplied(leadId);

    console.log(`[Vanguard SDR Reply] 📬 Lead ${fullHistory.lead.company_name} marked as REPLIED. Future follow-ups paused.`);

    return NextResponse.json({
      success: true,
      leadId,
      companyName: fullHistory.lead.company_name,
      status: "replied",
      hasReplied: true,
      nextFollowUpDate: null,
      message: "Lead marked as replied. All further follow-up sequencing has been cancelled.",
    });
  } catch (error: any) {
    console.error("[API Reply Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
