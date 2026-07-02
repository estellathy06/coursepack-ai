import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    const courses = await db.getCourses(userId);
    const schools = await db.getSchools();
    
    // Get programs grouped or flat
    const programs = await db.getPrograms();

    return NextResponse.json({
      courses,
      schools,
      programs,
    });
  } catch (error: any) {
    console.error("[GET /api/courses] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      name,
      courseCode,
      schoolName,
      programName,
      examDate,
      targetScore,
      dailyAvailableHours,
      currentLevel,
    } = await req.json();

    if (!userId || !name || !courseCode) {
      return NextResponse.json({ error: "Missing required fields (userId, name, courseCode)" }, { status: 400 });
    }

    let schoolId: string | undefined = undefined;
    let programId: string | undefined = undefined;

    // Handle school creation if text is provided
    if (schoolName && schoolName.trim().length > 0) {
      const school = await db.createSchool(schoolName.trim());
      schoolId = school.id;

      // Handle program creation under that school
      if (programName && programName.trim().length > 0) {
        const program = await db.createProgram(schoolId, programName.trim());
        programId = program.id;
      }
    }

    const course = await db.createCourse({
      user_id: userId,
      name: name.trim(),
      course_code: courseCode.trim().toUpperCase(),
      school_id: schoolId,
      program_id: programId,
      exam_date: examDate || undefined,
      target_score: targetScore || "60%",
      daily_available_hours: Number(dailyAvailableHours) || 2,
      current_level: currentLevel || "average",
      review_status: "Not Started",
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/courses] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create course" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId parameter" }, { status: 400 });
    }

    await db.deleteCourse(courseId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/courses] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete course" }, { status: 500 });
  }
}
