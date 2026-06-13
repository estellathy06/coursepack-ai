"use client";

import React, { useState, useEffect } from "react";
import { 
  Key, Sparkles, AlertCircle, FileText, ArrowRight, 
  HelpCircle, Mail, Check, ShieldCheck, Zap, Star
} from "lucide-react";
import FileUploader from "@/components/FileUploader";
import StudyPackDashboard from "@/components/StudyPackDashboard";
import { StudyPack, demoStudyPacks } from "@/utils/demoData";
import confetti from "canvas-confetti";

export default function Home() {
  const [view, setView] = useState<'landing' | 'generating' | 'dashboard'>('landing');
  const [currentPack, setCurrentPack] = useState<StudyPack | null>(null);
  
  // Custom API key states
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");

  // Input states for custom pack generation
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [subject, setSubject] = useState("Computer Science");
  const [focusAreas, setFocusAreas] = useState("");
  const [aggregatedText, setAggregatedText] = useState("");
  const [uploadedFilesList, setUploadedFilesList] = useState<{ name: string; size: number }[]>([]);

  // Generation status states
  const [generationStep, setGenerationStep] = useState(0);
  const [generationError, setGenerationError] = useState<{ title: string; desc: string } | null>(null);

  // Waitlist form
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(842);

  // Stripe Mock Payment States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string } | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [paymentCardNumber, setPaymentCardNumber] = useState("");
  const [paymentName, setPaymentName] = useState("");

  // Load API key from local storage
  useEffect(() => {
    const key = localStorage.getItem("coursepack_gemini_key") || "";
    setUserApiKey(key);
    setSavedKey(key);
    
    // Set a random waitlist seed
    setWaitlistCount(Math.floor(Math.random() * 200) + 840);
  }, []);

  const handleSaveKey = () => {
    localStorage.setItem("coursepack_gemini_key", userApiKey);
    setSavedKey(userApiKey);
    setShowSettings(false);
  };

  const handleRemoveKey = () => {
    localStorage.removeItem("coursepack_gemini_key");
    setUserApiKey("");
    setSavedKey("");
    setShowSettings(false);
  };

  const selectDemoPack = (key: string) => {
    const demo = demoStudyPacks[key];
    if (demo) {
      setCurrentPack(demo);
      setView('dashboard');
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Generation steps animation
  const steps = [
    "Uploading course files to pipeline...",
    "Extracting document text using client-side parsers...",
    "Analyzing syllabus weights and assignment rubrics...",
    "Scanning lecture notes for core concepts and definitions...",
    "Running Gemini LLM to construct likely exam questions...",
    "Formulating active recall questions & flashcards...",
    "Structuring the 7-day study cram checklist...",
    "Done! Rendering your customized study pack..."
  ];

  const handleFilesProcessed = (text: string, filesList: { name: string; size: number }[]) => {
    setAggregatedText(text);
    setUploadedFilesList(filesList);
  };

  const handleResetFiles = () => {
    setAggregatedText("");
    setUploadedFilesList([]);
  };

  const triggerGeneration = async () => {
    if (!aggregatedText) {
      alert("Please upload and confirm at least one file first.");
      return;
    }

    setView('generating');
    setGenerationStep(0);
    setGenerationError(null);

    // Start UI text updates
    const interval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < steps.length - 2) {
          return prev + 1;
        }
        return prev;
      });
    }, 2500);

    try {
      const response = await fetch("/api/generate-pack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: aggregatedText,
          courseCode: courseCode || "GEN-101",
          courseName: courseName || "Custom Generated Course",
          subject,
          focusAreas,
          userApiKey: savedKey || undefined
        })
      });

      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json();
        if (errData.error === "API_KEY_MISSING") {
          throw new Error("API_KEY_MISSING");
        }
        throw new Error(errData.message || "Failed to generate study pack.");
      }

      const data = await response.json();
      setGenerationStep(steps.length - 1);
      
      // Delay slightly so user sees the "Done!" step
      setTimeout(() => {
        setCurrentPack(data);
        setView('dashboard');
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 1000);

    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      
      if (err.message === "API_KEY_MISSING") {
        setGenerationError({
          title: "Gemini API Key Required",
          desc: "We couldn't find a Gemini API Key on our server. Please click 'API Key Settings' in the top-right and paste your own Gemini API Key to test generation for free, or run the app locally with GEMINI_API_KEY environment variable."
        });
      } else {
        setGenerationError({
          title: "AI Generation Failed",
          desc: err.message || "An unexpected error occurred while communicating with Gemini."
        });
      }
    }
  };

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }
    setWaitlistSubmitted(true);
    setWaitlistCount(prev => prev + 1);
  };

  const triggerMockPayment = (planName: string, planPrice: string) => {
    setSelectedPlan({ name: planName, price: planPrice });
    setShowPaymentModal(true);
    setPaymentComplete(false);
    setPaymentCardNumber("");
    setPaymentName("");
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate transaction
    setTimeout(() => {
      setPaymentComplete(true);
      // Confetti for successful payment
      confetti({
        particleCount: 40,
        spread: 50,
        colors: ['#8b5cf6', '#10b981']
      });
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-zinc-950 font-sans selection:bg-violet-500/20">
      
      {/* Header (Screen-only, hidden during print) */}
      <header className="print:hidden border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setView('landing')}>
          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white font-bold text-lg shadow-md shadow-violet-600/15">
            CP
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-zinc-100">CoursePack AI</span>
            <span className="text-[10px] block text-violet-400 font-semibold uppercase tracking-wider font-mono">Waterloo MVP</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <Key className="h-3.5 w-3.5" />
            {savedKey ? "API Key Configured" : "API Key Settings"}
          </button>
        </div>
      </header>

      {/* Main View Router */}
      <main className="flex-1 flex flex-col justify-start">
        
        {/* LANDING PAGE VIEW */}
        {view === 'landing' && (
          <div className="space-y-16 py-12 md:py-20">
            
            {/* Hero Section */}
            <div className="max-w-4xl mx-auto text-center px-4 space-y-6">
              <div className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300 font-medium animate-pulse-slow">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                <span>Niche Exam Kit Generator for Waterloo Math & CS Students</span>
              </div>
              
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                Turn your course files into a complete <span className="text-gradient-purple-cyan">exam study pack</span>
              </h1>
              
              <p className="max-w-xl mx-auto text-sm md:text-base text-zinc-400 leading-relaxed">
                Upload your syllabus, lecture slides, notes, or rubrics. Get a structured 7-day cram plan, likely exam questions, active recall self-tests, and interactive quizzes in 3 minutes.
              </p>
            </div>

            {/* Quick Demo Section */}
            <div className="max-w-5xl mx-auto px-4 space-y-5 text-center">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                ⚡ Try an interactive demo instantly (No Upload / Key Required)
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {[
                  { code: "CS 136", name: "Algorithm & Memory (C)", key: "CS136", bg: "from-blue-600/10 to-indigo-600/5 hover:border-blue-500/30" },
                  { code: "MATH 137", name: "Calculus I (Analysis)", key: "MATH137", bg: "from-purple-600/10 to-violet-600/5 hover:border-purple-500/30" },
                  { code: "ECON 101", name: "Microeconomics Principles", key: "ECON101", bg: "from-cyan-600/10 to-teal-600/5 hover:border-cyan-500/30" },
                  { code: "PSYCH 101", name: "Introductory Psychology", key: "PSYCH101", bg: "from-rose-600/10 to-pink-600/5 hover:border-rose-500/30" }
                ].map((demo) => (
                  <button
                    key={demo.code}
                    onClick={() => selectDemoPack(demo.key)}
                    className={`glass-panel p-4 rounded-xl text-left border border-zinc-850 hover:scale-[1.01] hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br ${demo.bg}`}
                  >
                    <span className="text-[10px] font-bold font-mono text-zinc-400 block tracking-wider uppercase mb-1">Waterloo Template</span>
                    <h4 className="text-sm font-bold text-zinc-100">{demo.code}</h4>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">{demo.name}</p>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-violet-400 font-semibold">
                      <span>Explore Pack</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Creation Interface (Upload & Metadata inputs) */}
            <div className="max-w-3xl mx-auto px-4">
              <div className="glass-panel rounded-2xl p-6 md:p-8 border border-zinc-850 space-y-6">
                
                <div>
                  <h2 className="text-xl font-bold text-zinc-100">Create Study Pack</h2>
                  <p className="text-xs text-zinc-500 mt-1">Configure your course details and upload your lectures or notes to construct a customized cram pack.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Course Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CS 136, MATH 137"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-violet-500/60"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Course Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Elementary Algorithm Design"
                      value={courseName}
                      onChange={(e) => setCourseName(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-violet-500/60"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Subject Domain</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500/60 cursor-pointer"
                    >
                      <option>Computer Science</option>
                      <option>Mathematics</option>
                      <option>Economics</option>
                      <option>Psychology</option>
                      <option>Engineering</option>
                      <option>General Science</option>
                      <option>Business / Business Administration</option>
                      <option>Other / Humanities</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide flex items-center gap-1">
                      Focus Areas <span className="text-[10px] text-zinc-500 font-normal capitalize">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Memory allocation, limits proofs, tax graph"
                      value={focusAreas}
                      onChange={(e) => setFocusAreas(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-violet-500/60"
                    />
                  </div>
                </div>

                {/* File Dropzone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Course Files</label>
                  <FileUploader 
                    onFilesProcessed={handleFilesProcessed} 
                    onReset={handleResetFiles}
                  />
                </div>

                {/* Submit Action */}
                {aggregatedText && (
                  <button
                    onClick={triggerGeneration}
                    className="w-full py-3.5 text-xs font-bold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/15 hover:shadow-violet-600/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="h-4 w-4" /> Generate Study Pack (3 Minutes)
                  </button>
                )}

              </div>
            </div>

            {/* Pricing Tiers Section */}
            <div className="max-w-5xl mx-auto px-4 space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Simple Transparent Pricing</h3>
                <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-100">Pay only for what you study</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Free Plan */}
                <div className="glass-panel rounded-2xl p-6 border border-zinc-850 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Starter Pack</span>
                      <h4 className="text-lg font-bold text-zinc-100 mt-0.5">Demo Trial</h4>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-zinc-100">$0</span>
                      <span className="text-zinc-500 text-xs font-medium">Free</span>
                    </div>
                    <ul className="space-y-2.5 text-xs text-zinc-400">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Full access to sample courses</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> All 6 review tabs available</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Local exports (Notion & Anki)</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => {
                      window.scrollTo({ top: 300, behavior: "smooth" });
                    }}
                    className="w-full py-2.5 text-xs font-bold rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-all cursor-pointer"
                  >
                    Try Sample Courses
                  </button>
                </div>

                {/* Pay Per Course Pack (Featured) */}
                <div className="glass-panel rounded-2xl p-6 border-2 border-violet-500/40 relative flex flex-col justify-between space-y-6 shadow-xl shadow-violet-950/10 bg-gradient-to-b from-violet-950/15 to-transparent">
                  <div className="absolute top-0 right-6 translate-y-[-50%] px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-violet-600 text-white tracking-widest">
                    Best Value
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block">Targeted Cramming</span>
                      <h4 className="text-lg font-bold text-zinc-100 mt-0.5">Single Exam Pack</h4>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-zinc-100">$5.99</span>
                      <span className="text-zinc-500 text-xs font-medium">per course</span>
                    </div>
                    <ul className="space-y-2.5 text-xs text-zinc-300">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-400 shrink-0" /> Custom parsing for all uploaded files</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-400 shrink-0" /> Full 7-Day Cram Checklist</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-400 shrink-0" /> Interactive AI practice quiz & active recall</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-violet-400 shrink-0" /> Infinite PDF / Notion markdown exports</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => triggerMockPayment("Single Exam Pack", "$5.99")}
                    className="w-full py-2.5 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/10 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Unlock Single Pack
                  </button>
                </div>

                {/* Semester Bundle */}
                <div className="glass-panel rounded-2xl p-6 border border-zinc-850 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Full Semester</span>
                      <h4 className="text-lg font-bold text-zinc-100 mt-0.5">Semester Pass</h4>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-zinc-100">$12.99</span>
                      <span className="text-zinc-500 text-xs font-medium">/ month</span>
                    </div>
                    <ul className="space-y-2.5 text-xs text-zinc-400">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Generates packs for up to 5 courses</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Priority fast-lane AI queue</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Updates packs dynamically when you upload new slides</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Custom focus topics dashboard</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => triggerMockPayment("Semester Pass", "$12.99/mo")}
                    className="w-full py-2.5 text-xs font-bold rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-all cursor-pointer"
                  >
                    Purchase Semester Pass
                  </button>
                </div>

              </div>
            </div>

            {/* Email Waitlist Capture Section */}
            <div className="max-w-4xl mx-auto px-4">
              <div className="glass-panel rounded-2xl p-8 border border-zinc-850/80 bg-gradient-to-br from-zinc-900/60 to-zinc-950 text-center relative overflow-hidden">
                <div className="absolute top-[-30px] right-[-30px] w-60 h-60 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[-30px] left-[-30px] w-60 h-60 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="max-w-xl mx-auto space-y-6">
                  <h3 className="text-lg md:text-xl font-bold text-zinc-200">
                    Get free study packs for your courses next term
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    We are launching white-labeled portal portals for university student groups and clubs. Put down your email to join the waitlist and get 3 free custom packs when we launch premium.
                  </p>

                  {!waitlistSubmitted ? (
                    <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3.5 top-[50%] translate-y-[-50%] h-4 w-4 text-zinc-500" />
                        <input
                          type="email"
                          required
                          placeholder="Enter your university email (@uwaterloo.ca)"
                          value={waitlistEmail}
                          onChange={(e) => setWaitlistEmail(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-violet-500/60 placeholder:text-zinc-600"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/10 active:scale-[0.98] transition-all cursor-pointer shrink-0"
                      >
                        Join Waitlist
                      </button>
                    </form>
                  ) : (
                    <div className="p-4 rounded-xl border bg-emerald-500/5 border-emerald-500/10 text-emerald-400 max-w-sm mx-auto flex items-center justify-center gap-2.5">
                      <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                      <div className="text-left">
                        <span className="text-xs font-bold block">Successfully Registered!</span>
                        <span className="text-[10px] text-zinc-500">You are position #{waitlistCount} on the waitlist.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="max-w-5xl mx-auto px-4 text-center text-xs text-zinc-600 border-t border-zinc-900 pt-8 mt-12 space-y-1">
              <p>© 2026 CoursePack AI. Built for students, by students.</p>
              <p className="text-[10px]">CoursePack AI is an independent study aid and does not substitute for official university coursework or assessments.</p>
            </footer>

          </div>
        )}

        {/* AI GENERATION PROCESSING VIEW */}
        {view === 'generating' && (
          <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 max-w-xl mx-auto space-y-8">
            
            {/* If no error, show loading steps */}
            {!generationError ? (
              <div className="w-full text-center space-y-6">
                
                {/* Loader Spinner */}
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-zinc-850" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  <div className="absolute inset-2 rounded-full border border-dashed border-zinc-700/60 animate-pulse-slow" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-zinc-200">Generating Study Pack</h3>
                  <p className="text-xs text-zinc-500">Using Gemini LLM model to analyze course material files.</p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-zinc-900 border border-zinc-850 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all duration-500 ease-out"
                    style={{ width: `${Math.round(((generationStep + 1) / steps.length) * 100)}%` }}
                  />
                </div>

                {/* Current step text */}
                <div className="min-h-[30px]">
                  <p className="text-xs font-semibold text-violet-400 font-mono animate-pulse">
                    {steps[generationStep]}
                  </p>
                </div>

                <div className="p-3.5 bg-zinc-900/40 rounded-xl border border-zinc-850 text-[10px] text-zinc-500 max-w-sm mx-auto">
                  Please don't close this tab. Processing large slide decks or syllabi texts takes between 1 to 3 minutes.
                </div>

              </div>
            ) : (
              /* If error, show error detail card */
              <div className="glass-panel rounded-2xl p-6 border border-rose-500/20 text-center space-y-5">
                <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <AlertCircle className="h-6 w-6" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-zinc-200">{generationError.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {generationError.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-850 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setView('landing');
                      // Retain input state so they can try again or set API key
                    }}
                    className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-200 transition-all cursor-pointer"
                  >
                    Back to Form
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(true);
                    }}
                    className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/10 transition-all cursor-pointer"
                  >
                    Configure API Key
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* GENERATED STUDY PACK VIEW */}
        {view === 'dashboard' && currentPack && (
          <StudyPackDashboard 
            pack={currentPack} 
            onBack={() => {
              setView('landing');
              // Retain file upload state so they don't have to upload again if they just click back
            }}
          />
        )}

      </main>

      {/* 
        ========================================================================
        MODAL 1: API KEY CONFIGURATION
        ========================================================================
      */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel rounded-2xl border border-zinc-800 w-full max-w-md p-6 space-y-4.5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
              <h3 className="font-bold text-sm text-zinc-200 flex items-center gap-2">
                <Key className="h-4.5 w-4.5 text-violet-400" />
                Gemini API Key Settings
              </h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-zinc-400 leading-relaxed">
                By default, this website will communicate with the server backend and look for a `GEMINI_API_KEY` defined in the server's environment.
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                If the server lacks an environment key, you can enter your personal Gemini API Key below. This key will be saved locally in your browser's <strong className="text-zinc-200">localStorage</strong> and used only for requests from this client session.
              </p>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Your Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-violet-500/60"
                />
              </div>

              <div className="bg-zinc-900/60 border border-zinc-850 p-3 rounded-xl flex items-start gap-2.5 text-[10px] text-zinc-500">
                <AlertCircle className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                <p>
                  To obtain a free key, go to the <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-violet-400 hover:underline">Google AI Studio</a>, log in with any Google account, and click "Get API Key".
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-850 flex items-center justify-between">
              {savedKey ? (
                <button
                  onClick={handleRemoveKey}
                  className="text-xs font-semibold text-rose-400 hover:underline cursor-pointer"
                >
                  Clear Key
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-zinc-350 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKey}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL 2: STRIPE SIMULATED CHECKOUT
        ========================================================================
      */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel rounded-2xl border border-zinc-800 w-full max-w-md p-6 space-y-5 shadow-2xl bg-gradient-to-tr from-zinc-900 to-zinc-950">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-850 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-violet-500/10 text-violet-400 border border-violet-500/25 flex items-center justify-center text-xs font-mono font-bold">S</span>
                <h3 className="font-bold text-sm text-zinc-200">
                  Secure Checkout
                </h3>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {!paymentComplete ? (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                
                {/* Product Summary Banner */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Item Details</span>
                    <h4 className="font-bold text-zinc-200">{selectedPlan?.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Amount Due</span>
                    <p className="font-mono font-bold text-violet-400 text-sm">{selectedPlan?.price}</p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-3 text-xs">
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="student@uwaterloo.ca"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-violet-500/60"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={19}
                        placeholder="4242 4242 4242 4242"
                        value={paymentCardNumber}
                        onChange={(e) => {
                          // basic formatting
                          let v = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
                          let matches = v.match(/\d{4,16}/g);
                          let match = (matches && matches[0]) || "";
                          let parts = [];

                          for (let i = 0, len = match.length; i < len; i += 4) {
                            parts.push(match.substring(i, i + 4));
                          }

                          if (parts.length > 0) {
                            setPaymentCardNumber(parts.join(" "));
                          } else {
                            setPaymentCardNumber(v);
                          }
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 font-mono focus:outline-none focus:border-violet-500/60 placeholder:text-zinc-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentCardNumber("4242 4242 4242 4242");
                          setPaymentName("Waterloo Warrior");
                        }}
                        className="absolute right-3.5 top-[50%] translate-y-[-50%] text-[9px] uppercase font-extrabold text-violet-400 bg-violet-500/10 border border-violet-500/25 px-1.5 py-0.5 rounded cursor-pointer hover:bg-violet-500/20"
                      >
                        AutoFill
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Expiration</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="MM / YY"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 font-mono text-center focus:outline-none focus:border-violet-500/60 placeholder:text-zinc-700"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">CVC</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        placeholder="123"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 font-mono text-center focus:outline-none focus:border-violet-500/60 placeholder:text-zinc-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Waterloo Warrior"
                      value={paymentName}
                      onChange={(e) => setPaymentName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-violet-500/60"
                    />
                  </div>

                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full py-3 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/15 hover:shadow-violet-600/25 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Pay {selectedPlan?.price} Securely
                </button>

                <p className="text-[10px] text-zinc-500 text-center leading-normal mt-1">
                  🔒 Payments are simulated securely. Standard sandbox parameters are evaluated. No actual funds are charged.
                </p>

              </form>
            ) : (
              /* Success State */
              <div className="text-center space-y-5 py-4">
                <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Check className="h-6 w-6" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-zinc-200">Payment Completed!</h4>
                  <p className="text-xs text-zinc-500">
                    Thank you! Your simulated Premium token is active.
                  </p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs max-w-xs mx-auto text-left flex items-start gap-2.5">
                  <Zap className="h-4.5 w-4.5 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-zinc-300 block">Premium Generations Unlocked!</span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      You now have credits to generate custom study packs from your uploaded course slides. Try the file uploader above!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
