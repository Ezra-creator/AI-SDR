import { NextRequest, NextResponse } from "next/server";
import { executeQuery, getCampaignById } from "../../../../lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const campaignId = resolvedParams.id;

    const campaign = await getCampaignById(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const campaignId = resolvedParams.id;
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [campaignId];
    let paramIdx = 2;

    if (body.approval_mode !== undefined) {
      const mode = body.approval_mode === "autonomous" ? "autonomous" : "review";
      updates.push(`approval_mode = $${paramIdx++}`);
      values.push(mode);
    }

    if (body.follow_up_interval_days !== undefined) {
      updates.push(`follow_up_interval_days = $${paramIdx++}`);
      values.push(Number(body.follow_up_interval_days));
    }

    if (body.max_follow_ups !== undefined) {
      updates.push(`max_follow_ups = $${paramIdx++}`);
      values.push(Number(body.max_follow_ups));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const rows = await executeQuery(
      `UPDATE campaigns
       SET ${updates.join(", ")}
       WHERE id = $1
       RETURNING id, icp_description, product_pitch, sender_name, sender_role, sender_company, approval_mode, follow_up_interval_days, max_follow_ups, created_at`,
      values
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, campaign: rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
