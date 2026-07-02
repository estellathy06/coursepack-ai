import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/utils/db";

const studyPlanResponseSchema: any = {
  type: "object",
  properties: {
    targetScore: { type: "string" },
    daysRemaining: { type: "integer" },
    scoreStrategy: { type: "string" },
    dailySchedule: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "integer" },
          focus: { type: "string" },
          studyDurationHours: { type: "number" },
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                task: { type: "string" },
                importance: { type: "string" }, // High, Medium, Low
                source: { type: "string" },
                predictedProbability: { type: "integer" } // 0-100
              },
              required: ["task", "importance", "source"]
            }
          },
          expectedMastery: { type: "string" }
        },
        required: ["day", "focus", "studyDurationHours", "tasks", "expectedMastery"]
      }
    },
    mustDoTasks: { type: "array", items: { type: "string" } },
    optionalTasks: { type: "array", items: { type: "string" } },
    riskWarnings: { type: "array", items: { type: "string" } },
    nextActions: { type: "array", items: { type: "string" } }
  },
  required: [
    "targetScore",
    "daysRemaining",
    "scoreStrategy",
    "dailySchedule",
    "mustDoTasks",
    "optionalTasks",
    "riskWarnings",
    "nextActions"
  ]
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const {
      userId,
      daysRemaining,
      targetScore,
      dailyAvailableHours,
      currentLevel,
      userApiKey,
      forceRegenerate,
    } = await req.json();

    if (!courseId || !userId || !daysRemaining || !targetScore || !dailyAvailableHours || !currentLevel) {
      return NextResponse.json({
        error: "Missing required inputs (userId, daysRemaining, targetScore, dailyAvailableHours, currentLevel)"
      }, { status: 400 });
    }

    // 1. Fetch Course Analysis
    const analysis = await db.getCourseAnalysis(courseId);
    if (!analysis) {
      return NextResponse.json({
        error: "NO_ANALYSIS",
        message: "No final exam analysis found. Please run 'Analyze Final Exam' first to structure the course materials."
      }, { status: 400 });
    }

    // 2. Cache Check: Check if a similar study plan is already cached across matching courses in the system
    const matchingCourseIds = await db.getMatchingCourseIds(courseId);
    const allPlans = await db.getStudyPlansForCourses(matchingCourseIds);

    const cachedPlan = allPlans.find(
      (p) =>
        !forceRegenerate &&
        p.target_score === targetScore &&
        p.days_remaining === Number(daysRemaining) &&
        p.daily_available_hours === Number(dailyAvailableHours) &&
        p.generated_from_analysis_version === analysis.analysis_version
    );

    if (cachedPlan) {
      console.log(`[Study Plan] Shared Cache hit. Returning cached plan version ${analysis.analysis_version} from course ${cachedPlan.course_id}`);
      // Ensure target parameters are updated for this specific student's course
      await db.updateCourse(courseId, {
        target_score: targetScore,
        daily_available_hours: Number(dailyAvailableHours),
        current_level: currentLevel,
      });
      return NextResponse.json({ success: true, plan: cachedPlan });
    }

    // 3. Resolve API Key
    const apiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "API_KEY_MISSING",
        message: "No Gemini API Key found. Please set your key in the settings panel."
      }, { status: 401 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro", // Token optimization: use stronger model for final strategic reasoning & study plan generation
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: studyPlanResponseSchema,
        temperature: 0.2,
      }
    });

    const systemPrompt = `You are a strategic study coordinator helping international college students optimize their exam scores under tight timelines.
You will receive the structured Course Analysis JSON (containing topic frequency, exam probability, difficulty levels, and source files).
Your goal is to build a day-by-day study roadmap for the student based on:
- Days Remaining: ${daysRemaining} days
- Target Score: ${targetScore}
- Daily available hours: ${dailyAvailableHours} hours
- Student's current baseline self-assessment: ${currentLevel} (weak, average, strong)

TAILOR THE STRATEGY BY TARGET SCORE:
- Target Score "50%" (Pass Level Prep): Minimize effort, focus ONLY on the highest probability topics (probability > 75%) and easiest questions. Instruct the student to skip/ignore difficult or low-frequency topics completely. Minimize study hours. Focus on the shortest path to pass.
- Target Score "60%" (Comfortable Pass): Focus on high and medium probability topics. Skip extremely difficult edge cases. Build basic computational skills.
- Target Score "70%" or "80%+" (High Score/Honors): Highly intense review. Include mock exams, complex practice problems, deep error analysis, and hard topics. 

IMPORTANT POLICIES:
- Do NOT promise a guaranteed pass or a guaranteed grade. Use phrases like "increase your chance of success" or "target a passing-level preparation".
- Recommend tasks that direct students to work with their uploaded materials (e.g., "Review Homework 2 Q1", "Practice Quiz Question 3").
- Output the daily schedule matching the user's available time. Total hours assigned each day must not exceed ${dailyAvailableHours}.`;

    const userPrompt = `Here is the structured Course Analysis:
----------------------------------------------
${JSON.stringify({
  summary: analysis.summary,
  topics: analysis.extracted_topics,
  topicFrequency: analysis.topic_frequency,
  predictedExamTopics: analysis.predicted_exam_topics,
  difficultyBreakdown: analysis.difficulty_breakdown,
  recommendedPriority: analysis.difficulty_breakdown?.recommendedPriority || [],
  questionBank: analysis.question_bank,
})}
----------------------------------------------
Generate a structured study plan JSON.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error("Empty response received from Gemini API.");
    }

    const planJson = JSON.parse(responseText);

    // Save plan to DB
    const savedPlan = await db.saveStudyPlan({
      user_id: userId,
      course_id: courseId,
      target_score: targetScore,
      days_remaining: Number(daysRemaining),
      daily_available_hours: Number(dailyAvailableHours),
      plan_json: planJson,
      generated_from_analysis_version: analysis.analysis_version,
    });

    // Also update course target parameters
    await db.updateCourse(courseId, {
      target_score: targetScore,
      daily_available_hours: Number(dailyAvailableHours),
      current_level: currentLevel,
    });

    return NextResponse.json({ success: true, plan: savedPlan });
  } catch (error: any) {
    console.error("[POST /api/courses/:courseId/study-plan] Error:", error);
    let message = error.message || "An unexpected error occurred while generating study plan.";
    if (error.message?.includes("API key not valid") || error.status === 400 || error.message?.includes("API_KEY_INVALID")) {
      message = "The Gemini API Key provided is invalid. Please check your key in the settings panel.";
    }
    return NextResponse.json({ error: "Study plan generation failed", message }, { status: 500 });
  }
}
