"use client";

import React, { useEffect } from "react";
import { CheckCircle, ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import confetti from "canvas-confetti";

export default function SuccessPage() {
  // Trigger a full confetti shower when page loads
  useEffect(() => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#2563eb", "#60a5fa", "#3b82f6"]
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#2563eb", "#60a5fa", "#3b82f6"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="flex-1 flex flex-col justify-center items-center min-h-screen bg-slate-50 px-4 font-sans text-slate-650 antialiased">
      {/* Decorative Blob */}
      <div className="absolute top-[20%] left-[50%] translate-x-[-50%] w-[350px] h-[350px] bg-gradient-to-tr from-blue-200/40 to-sky-100/50 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xl shadow-slate-100 space-y-6">
        
        {/* Animated Check circle */}
        <div className="mx-auto w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center animate-bounce">
          <CheckCircle className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 border border-blue-100 text-blue-600 uppercase tracking-widest font-mono">
            Transaction Complete
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Premium Unlocked!
          </h1>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Thank you for your purchase. Your account has been upgraded, and your custom study pack generations are active.
          </p>
        </div>

        {/* What next detail */}
        <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-xl text-left text-xs space-y-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-blue-500" />
            What is now active:
          </h3>
          <ul className="space-y-2 text-slate-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>Priority queue processing for custom generated packs.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>Full file upload and syllabus parsing limit extended.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>Unlimited exports to Notion MD and Anki Decks.</span>
            </li>
          </ul>
        </div>

        {/* Back to Workspace button */}
        <a
          href="/"
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Study Workspace
        </a>
      </div>
      
      {/* Small copyright footer */}
      <p className="text-[10px] text-slate-400 mt-8">
        © 2026 CoursePack AI. Securely processed via Stripe.
      </p>
    </div>
  );
}
