import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { courseCode, rating, feedbackText, correctedConcepts, logId } = await req.json();

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    // Log feedback to server console for visibility
    console.log(`[AI Feedback Loop] Received feedback for ${courseCode || "Unknown"}:`);
    console.log(`- Rating: ${rating}/5 Stars`);
    console.log(`- Notes: "${feedbackText || "No text provided"}"`);
    if (correctedConcepts) {
      console.log(`- Corrections:`, JSON.stringify(correctedConcepts));
    }

    // If Supabase is configured, write to the database
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const tableUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/study_pack_feedback`;
        
        const response = await fetch(tableUrl, {
          method: "POST",
          headers: {
            "apikey": supabaseAnonKey,
            "Authorization": `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            rating,
            user_notes: feedbackText,
            corrected_concepts: correctedConcepts || null
          })
        });

        if (!response.ok) {
          const errMsg = await response.text();
          throw new Error(`Supabase insert failed: ${errMsg}`);
        }

        console.log("[AI Feedback Loop] Successfully saved feedback to Supabase Database.");
        
        return NextResponse.json({ 
          success: true, 
          message: "Feedback logged successfully in Supabase." 
        });

      } catch (dbError: any) {
        console.error("[AI Feedback Loop] Database insert error:", dbError);
        // Fall back to success response so the user UI doesn't crash
        return NextResponse.json({ 
          success: true, 
          message: "Feedback logged to server, but database write failed.",
          error: dbError.message 
        });
      }
    }

    // If no Supabase is configured
    return NextResponse.json({ 
      success: true, 
      message: "Feedback logged to console. Set SUPABASE_URL and SUPABASE_ANON_KEY to save in PostgreSQL." 
    });

  } catch (error: any) {
    console.error("Error processing feedback API:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback", message: error.message },
      { status: 500 }
    );
  }
}
