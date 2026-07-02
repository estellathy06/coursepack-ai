import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId dynamic parameter" }, { status: 400 });
    }

    const materials = await db.getMaterials(courseId);

    return NextResponse.json({ success: true, materials });
  } catch (error: any) {
    console.error("[GET /api/courses/:courseId/materials] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch materials" }, { status: 500 });
  }
}
