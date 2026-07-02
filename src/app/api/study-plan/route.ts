import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const plans = await db.getStudyPlans(userId);
    return NextResponse.json({ success: true, plans });
  } catch (error: any) {
    console.error("[GET /api/study-plan] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch study plans" }, { status: 500 });
  }
}
