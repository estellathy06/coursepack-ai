import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function POST(req: NextRequest) {
  try {
    const { courseId, name, materialType, text, size, wordCount } = await req.json();

    if (!courseId || !name || !materialType || !text) {
      return NextResponse.json(
        { error: "Missing required fields (courseId, name, materialType, text)" },
        { status: 400 }
      );
    }

    const material = await db.createMaterial({
      course_id: courseId,
      name: name.trim(),
      material_type: materialType,
      text: text,
      size: Number(size) || 0,
      word_count: Number(wordCount) || 0,
    });

    // Automatically update the course's review status if it was 'Not Started'
    const courseList = await db.getMaterials(courseId);
    if (courseList.length === 1) {
      await db.updateCourse(courseId, { review_status: "In Progress" });
    }

    return NextResponse.json({ success: true, material }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/materials/upload] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload material" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing material ID parameter" }, { status: 400 });
    }

    await db.deleteMaterial(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/materials/upload] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete material" }, { status: 500 });
  }
}
