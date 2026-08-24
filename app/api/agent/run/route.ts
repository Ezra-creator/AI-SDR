import { NextRequest, NextResponse } from "next/server";
import { runSDRAgent } from "../../../../lib/sdr-agent";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      icp_description,
      product_pitch,
      target_lead_count,
      sender_name,
      sender_role,
      sender_company,
      approval_mode,
      campaign_id,
    } = body;

    if (!icp_description || !product_pitch) {
      return NextResponse.json(
        { error: "icp_description and product_pitch are required" },
        { status: 400 }
      );
    }

    const senderContext = {
      senderName: sender_name || "Alex Rivera",
      senderRole: sender_role || "Head of Partnerships",
      companyName: sender_company || "Vanguard Systems",
    };

    const count = target_lead_count ? Number(target_lead_count) : 3;
    const mode = approval_mode === "autonomous" ? "autonomous" : "review";

    console.log(`[API Agent Run] Starting agent execution for campaign: ${campaign_id || "New"}`);

    const result = await runSDRAgent(
      icp_description,
      product_pitch,
      count,
      senderContext,
      mode,
      campaign_id
    );

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("[API Agent Run Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute agent pipeline" },
      { status: 500 }
    );
  }
}
