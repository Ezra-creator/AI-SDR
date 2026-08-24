import { NextRequest, NextResponse } from "next/server";
import { checkAndGenerateDueFollowUps } from "../../../../lib/follow-up-engine";

/**
 * Cron endpoint for Vercel Cron or scheduled runners.
 * Evaluates all leads where a follow-up is due, generates differentiated next-angle emails,
 * and either sends them (Autonomous mode) or stages them as pending_approval (Review mode).
 */
export async function GET(request: NextRequest) {
  return handleCron();
}

export async function POST(request: NextRequest) {
  return handleCron();
}

async function handleCron() {
  try {
    const startTime = Date.now();
    const result = await checkAndGenerateDueFollowUps();
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      processedCount: result.processedCount,
      followUps: result.results,
    });
  } catch (error: any) {
    console.error("[Cron Follow-Ups Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process scheduled follow-ups" },
      { status: 500 }
    );
  }
}
