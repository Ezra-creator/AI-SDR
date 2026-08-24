import { NextRequest, NextResponse } from "next/server";
import { createCampaign, executeQuery } from "../../../lib/db";
import { CampaignRecord } from "../../../types/lead";

export async function GET() {
  try {
    const campaigns = await executeQuery<CampaignRecord & { lead_count: number }>(
      `SELECT c.id, c.icp_description, c.product_pitch, c.sender_name, c.sender_role, c.sender_company,
              c.approval_mode, c.follow_up_interval_days, c.max_follow_ups, c.created_at,
              COUNT(l.id)::int as lead_count
       FROM campaigns c
       LEFT JOIN leads l ON l.icp_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error("[API Campaigns GET Error]:", error);
    // If DB is unconfigured, return empty array gracefully
    return NextResponse.json({ campaigns: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      icp_description,
      product_pitch,
      sender_name,
      sender_role,
      sender_company,
      approval_mode,
      follow_up_interval_days,
      max_follow_ups,
    } = body;

    if (!icp_description || !product_pitch || !sender_name || !sender_company) {
      return NextResponse.json(
        { error: "Missing required fields: icp_description, product_pitch, sender_name, sender_company" },
        { status: 400 }
      );
    }

    const campaign = await createCampaign({
      icp_description,
      product_pitch,
      sender_name,
      sender_role: sender_role || "Sales Development Rep",
      sender_company,
      approval_mode: approval_mode === "autonomous" ? "autonomous" : "review",
      follow_up_interval_days: follow_up_interval_days ? Number(follow_up_interval_days) : 4,
      max_follow_ups: max_follow_ups ? Number(max_follow_ups) : 3,
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    console.error("[API Campaigns POST Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create campaign" },
      { status: 500 }
    );
  }
}
