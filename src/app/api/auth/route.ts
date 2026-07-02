import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";

// Simulated hash helper (plain string for local testing)
const getPasswordHash = (password: string) => {
  // A simple representation. In production this would use bcrypt.
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return `hash_${hash}`;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, name, avatarUrl } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action parameter" }, { status: 400 });
    }

    if (action === "register" || action === "signup") {
      if (!email || !password || !name) {
        return NextResponse.json({ error: "Missing registration fields (email, password, name)" }, { status: 400 });
      }
      const hash = getPasswordHash(password);
      const user = await db.registerUser(email, hash, name);
      return NextResponse.json({ success: true, user });
    }

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Missing login fields (email, password)" }, { status: 400 });
      }
      const hash = getPasswordHash(password);
      const user = await db.loginUser(email, hash);
      if (!user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }
      return NextResponse.json({ success: true, user });
    }

    if (action === "google") {
      if (!email || !name) {
        return NextResponse.json({ error: "Missing Google auth fields (email, name)" }, { status: 400 });
      }
      const user = await db.getOrCreateGoogleUser(email, name, avatarUrl);
      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[POST /api/auth] Auth Error:", error);
    return NextResponse.json({ error: error.message || "Authentication failed" }, { status: 500 });
  }
}
