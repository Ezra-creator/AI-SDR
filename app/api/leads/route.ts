import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "../../../lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const status = searchParams.get("status");

    let query = `
      SELECT l.id, l.company_name, l.domain, l.source_url, l.icp_id, l.status, l.fit_score,
             l.has_replied, l.next_follow_up_date, l.follow_up_count, l.created_at, l.updated_at,
             lr.company_summary, lr.research_quality,
             (SELECT COUNT(*) FROM outreach_emails oe WHERE oe.lead_id = l.id)::int as email_count,
             (SELECT oe.status FROM outreach_emails oe WHERE oe.lead_id = l.id ORDER BY oe.sequence_number DESC LIMIT 1) as latest_email_status
      FROM leads l
      LEFT JOIN lead_research lr ON lr.lead_id = l.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIdx = 1;

    if (campaignId) {
      query += ` AND l.icp_id = $${paramIdx++}`;
      params.push(campaignId);
    }

    if (status) {
      query += ` AND l.status = $${paramIdx++}`;
      params.push(status);
    }

    query += ` ORDER BY l.created_at DESC`;

    const leads = await executeQuery(query, params);

    return NextResponse.json({ leads });
  } catch (error: any) {
    console.error("[API Leads GET Error]:", error);
    return NextResponse.json({ leads: [] });
  }
}
