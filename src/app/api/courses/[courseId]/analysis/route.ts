import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId parameter" }, { status: 400 });
    }

    const analysis = await db.getCourseAnalysis(courseId);
    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error("[GET /api/courses/:courseId/analysis] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch course analysis" }, { status: 500 });
  }
}
