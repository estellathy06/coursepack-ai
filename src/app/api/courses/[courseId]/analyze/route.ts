import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/utils/db";

const analysisResponseSchema: any = {
  type: "object",
  properties: {
    courseSummary: { type: "string" },
    topics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          week: { type: "string" },
          topic: { type: "string" },
          concepts: { type: "array", items: { type: "string" } },
          weight: { type: "string" },
          source: { type: "string" }
        },
        required: ["week", "topic", "concepts", "weight", "source"]
      }
    },
    topicFrequency: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          frequencyScore: { type: "integer" },
          explanation: { type: "string" }
        },
        required: ["topic", "frequencyScore", "explanation"]
      }
    },
    predictedExamTopics: {
      type: "array",
      items: {
        type: "object",
        properties: {
          concept: { type: "string" },
          importance: { type: "string" }, // High, Medium, Low
          explanation: { type: "string" },
          likelyQuestion: { type: "string" },
          tips: { type: "string" },
          source: { type: "string" },
          probabilityScore: { type: "integer" }, // 0-100 prediction
          predictionMethod: { type: "string" }, // "Probability-based" or "Gap-based"
          mcQuestionsPercentage: { type: "integer" }, // 0-100
          longAnswerQuestionsPercentage: { type: "integer" }, // 0-100
          gapAnalysis: { type: "string" } // Detail for Gap-based method
        },
        required: [
          "concept",
          "importance",
          "explanation",
          "likelyQuestion",
          "tips",
          "source",
          "probabilityScore",
          "predictionMethod",
          "mcQuestionsPercentage",
          "longAnswerQuestionsPercentage"
        ]
      }
    },
    definitions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          term: { type: "string" },
          definition: { type: "string" },
          formula: { type: "string" },
          confusionPoint: { type: "string" },
          source: { type: "string" }
        },
        required: ["term", "definition", "source"]
      }
    },
    activeRecall: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
          hint: { type: "string" },
          source: { type: "string" }
        },
        required: ["question", "answer", "hint", "source"]
      }
    },
    quiz: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctAnswer: { type: "integer" }, // 0-based index
          explanation: { type: "string" },
          source: { type: "string" }
        },
        required: ["id", "question", "options", "correctAnswer", "explanation", "source"]
      }
    },
    weakSpots: {
      type: "array",
      items: {
        type: "object",
        properties: {
          concept: { type: "string" },
          coverage: { type: "string" },
          action: { type: "string" },
          source: { type: "string" }
        },
        required: ["concept", "coverage", "action", "source"]
      }
    },
    difficultyLevels: {
      type: "object",
      properties: {
        Easy: { type: "integer" },
        Medium: { type: "integer" },
        Hard: { type: "integer" }
      },
      required: ["Easy", "Medium", "Hard"]
    },
    recommendedPriority: { type: "array", items: { type: "string" } }
  },
  required: [
    "courseSummary",
    "topics",
    "topicFrequency",
    "predictedExamTopics",
    "definitions",
    "activeRecall",
    "quiz",
    "weakSpots",
    "difficultyLevels",
    "recommendedPriority"
  ]
};

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
    console.error("[GET /api/courses/:courseId/analyze] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch analysis" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const { userApiKey } = await req.json();

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId parameter" }, { status: 400 });
    }

    // Load all course materials
    const materials = await db.getMaterials(courseId);
    if (materials.length === 0) {
      return NextResponse.json({ error: "No course materials uploaded. Please upload syllabus or lecture notes first." }, { status: 400 });
    }

    // Get Course Code/Name for context
    const courseInfo = await db.getCourse(courseId) || { course_code: "GEN-101", name: "Current Course" };

    // Concatenate material text
    const aggregatedText = materials.map((m) => `Material Name: ${m.name}\nType: ${m.material_type}\nText:\n${m.text}\n=== END OF MATERIAL ===`).join("\n\n");
    const sourceIds = materials.map((m) => m.id);

    // Resolve API Key
    const apiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "API_KEY_MISSING",
        message: "No Gemini API Key found. Please set your key in the UI settings or server environment."
      }, { status: 401 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: analysisResponseSchema,
        temperature: 0.1,
      }
    });

    const systemPrompt = `You are a professional academic analyst specialized in college exam preparation.
Your job is to read all uploaded materials for the course ${courseInfo.course_code || "GEN-101"}: "${courseInfo.name || "Current Course"}".
Extract the structures, concepts, question banks, exam trends, and difficulties.
BE CONSERVATIVE AND SOURCE-GROUNDED:
- First, count and identify the total list of topics taught in the course during the semester.
- Analyze past exams (if provided) and syllabus weights to determine what percentage of multiple-choice questions (mcQuestionsPercentage) and what percentage of long-answer questions (longAnswerQuestionsPercentage) came from each topic historically.
- Predict likely exam content using TWO distinct methods:
  1. "Probability-based" Prediction: Look at previous years' exams and count which topics or question types recur consistently. Rank them as high probability. Set predictionMethod to "Probability-based".
  2. "Gap-based" Prediction: Compare topics taught in the lecture/syllabus with those in the practice exams. If a topic was taught during the semester but is omitted or absent in the practice exams, flag it. Set predictionMethod to "Gap-based" and explain this omission in "gapAnalysis" (e.g., "Taught in class, but omitted in practice exams").
- Extract question examples directly from homeworks, quizzes, and previous exams.
- Map the sources (e.g. "Lecture 2 Slides, p.5" or "Homework 3 Q2") in the 'source' or 'historicalSource' fields.
- Estimate exam probability scores (0 to 100) based on consistency, weight, or gap significance.
- Classify question difficulties into Easy, Medium, Hard.
- Provide a summary and prioritize topics by relevance.`;

    const userPrompt = `Below are the course materials:
----------------------------------------------
${aggregatedText.slice(0, 300000)}
----------------------------------------------
Generate a structured course analysis JSON according to the schema.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);

    const responseText = result.response.text();
    if (!responseText) {
      throw new Error("Empty response received from Gemini API.");
    }

    const parsedJson = JSON.parse(responseText);

    // Save/Cache Analysis
    // Get current analysis to increment version
    const existingAnalysis = await db.getCourseAnalysis(courseId);
    const nextVersion = existingAnalysis ? existingAnalysis.analysis_version + 1 : 1;

    const savedAnalysis = await db.saveCourseAnalysis({
      course_id: courseId,
      summary: parsedJson.courseSummary || "No summary generated",
      extracted_topics: parsedJson.topics || [],
      topic_frequency: parsedJson.topicFrequency || [],
      predicted_exam_topics: parsedJson.predictedExamTopics || [],
      question_bank: {
        quiz: parsedJson.quiz || [],
        activeRecall: parsedJson.activeRecall || [],
        definitions: parsedJson.definitions || [],
        weakSpots: parsedJson.weakSpots || []
      },
      difficulty_breakdown: {
        difficultyLevels: parsedJson.difficultyLevels || { Easy: 0, Medium: 0, Hard: 0 },
        recommendedPriority: parsedJson.recommendedPriority || []
      },
      source_material_ids: sourceIds,
      analysis_version: nextVersion,
    });

    // Update course review status to Ready
    await db.updateCourse(courseId, { review_status: "Ready" });

    return NextResponse.json({ success: true, analysis: savedAnalysis });
  } catch (error: any) {
    console.error("[POST /api/courses/:courseId/analyze] Error:", error);
    let message = error.message || "An unexpected error occurred during AI analysis.";
    if (error.message?.includes("API key not valid") || error.status === 400 || error.message?.includes("API_KEY_INVALID")) {
      message = "The Gemini API Key provided is invalid. Please check your key in the settings panel.";
    }
    return NextResponse.json({ error: "Analysis failed", message }, { status: 500 });
  }
}
