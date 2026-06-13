import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Define the response schema for strict JSON output from Gemini
const studyPackSchema: any = {
  type: "object",
  properties: {
    courseCode: { type: "string" },
    courseName: { type: "string" },
    university: { type: "string" },
    summary: { type: "string" },
    courseMap: {
      type: "array",
      items: {
        type: "object",
        properties: {
          week: { type: "string" },
          topic: { type: "string" },
          concepts: {
            type: "array",
            items: { type: "string" }
          },
          weight: { type: "string" },
          source: { type: "string" }
        },
        required: ["week", "topic", "concepts", "weight", "source"]
      }
    },
    examFocus: {
      type: "array",
      items: {
        type: "object",
        properties: {
          concept: { type: "string" },
          importance: { type: "string" }, // High, Medium, Low
          explanation: { type: "string" },
          likelyQuestion: { type: "string" },
          tips: { type: "string" },
          source: { type: "string" }
        },
        required: ["concept", "importance", "explanation", "likelyQuestion", "tips", "source"]
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
          options: {
            type: "array",
            items: { type: "string" }
          },
          correctAnswer: { type: "integer" }, // 0-based index
          explanation: { type: "string" },
          source: { type: "string" }
        },
        required: ["id", "question", "options", "correctAnswer", "explanation", "source"]
      }
    },
    sevenDayPlan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "integer" },
          focus: { type: "string" },
          tasks: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["day", "focus", "tasks"]
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
    }
  },
  required: [
    "courseCode",
    "courseName",
    "university",
    "summary",
    "courseMap",
    "examFocus",
    "definitions",
    "activeRecall",
    "quiz",
    "sevenDayPlan",
    "weakSpots"
  ]
};

export async function POST(req: NextRequest) {
  try {
    const { text, courseCode, courseName, subject, focusAreas, userApiKey } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "No course material content provided. Please upload valid files." },
        { status: 400 }
      );
    }

    // Resolve API key: either user-provided or environment variable
    const apiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: "API_KEY_MISSING", 
          message: "No Gemini API Key found. Please add a key in settings or set GEMINI_API_KEY in your local environment."
        },
        { status: 401 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using gemini-1.5-flash as default, it's fast, has high context, and supports structured JSON outputs
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: studyPackSchema,
        temperature: 0.1, // Low temperature for factual grounding
      }
    });

    const systemPrompt = `You are an expert college course study assistant. Your task is to analyze the provided course materials (which may include syllabus text, lecture notes, slides, and rubric descriptions) and generate a highly structured, comprehensive "Exam Study Pack".

CRITICAL INSTRUCTIONS:
1. Ground every concept, definition, and plan in the uploaded materials. Under the "source" field for each item, cite the specific document section, week, page, or slide number where the information was extracted (e.g. "Lecture 4 Slides p. 12" or "Syllabus Section 4"). If a source cannot be identified, specify "Course Material".
2. DO NOT make up information or introduce external advanced concepts not covered in the materials.
3. DO NOT solve assignments or write essays for students. The goal is to facilitate study, active recall, and exam preparation.
4. If the provided materials are insufficient or lack detailed content, make the best out of what's provided, marking the source as "Estimated based on syllabus" where appropriate.
5. Identify "Weak Spots": points that are listed as important or highly-weighted in the syllabus/rubric but are barely discussed or missing in the lecture notes slides text.

Metadata provided by user:
- Course Code: ${courseCode || "Unknown"}
- Course Name: ${courseName || "Unknown"}
- Subject: ${subject || "General"}
- Focus Areas / Special Notes: ${focusAreas || "None"}`;

    const prompt = `Course Materials Content:
------------------------------------------
${text.slice(0, 150000)} 
------------------------------------------
Analyze the course materials above and generate the complete study pack JSON.`;

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: prompt }
    ]);

    const responseText = result.response.text();
    
    if (!responseText) {
      throw new Error("Empty response received from Gemini API.");
    }

    const studyPackData = JSON.parse(responseText);

    return NextResponse.json(studyPackData);

  } catch (error: any) {
    console.error("Error generating study pack:", error);
    
    let statusCode = 500;
    let errorMessage = error.message || "An unexpected error occurred during AI generation.";

    // Handle invalid API keys
    if (error.message?.includes("API key not valid") || error.status === 400 || error.message?.includes("API_KEY_INVALID")) {
      statusCode = 401;
      errorMessage = "The Gemini API Key provided is invalid. Please check your key and try again.";
    }

    return NextResponse.json(
      { error: "Generation failed", message: errorMessage },
      { status: statusCode }
    );
  }
}
