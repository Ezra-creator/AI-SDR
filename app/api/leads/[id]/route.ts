import { NextRequest, NextResponse } from "next/server";
import { getLeadWithFullHistory } from "../../../../lib/db";

export async function GET(
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

    return NextResponse.json({ fullHistory });
  } catch (error: any) {
    console.error("[API Lead Detail Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
