"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Key, Sparkles, AlertCircle, FileText, ArrowRight, 
  HelpCircle, Mail, Check, ShieldCheck, Zap, Star,
  BookOpen, Target, Calendar, ListTodo, Layers, ArrowRightLeft,
  ChevronRight, Award, Lock, Loader2, BrainCircuit
} from "lucide-react";
import FileUploader from "@/components/FileUploader";
import StudyPackDashboard from "@/components/StudyPackDashboard";
import { StudyPack, demoStudyPacks } from "@/utils/demoData";
import confetti from "canvas-confetti";

export default function Home() {
  const [view, setView] = useState<'generating' | 'ready'>('ready');
  const [currentPack, setCurrentPack] = useState<StudyPack | null>(null);
  
  // Custom API key states
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");

  // Input states for custom pack generation
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [studyGoal, setStudyGoal] = useState("");
  const [weakAreas, setWeakAreas] = useState("");
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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentCardNumber, setPaymentCardNumber] = useState("");
  const [paymentName, setPaymentName] = useState("");

  // Refs for scrolling
  const generatorRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  // Load API key from local storage
  useEffect(() => {
    const key = localStorage.getItem("coursepack_gemini_key") || "";
    setUserApiKey(key);
    setSavedKey(key);
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
      // Set metadata matching the demo
      if (key === "CS136") {
        setCourseCode("CS 136");
        setCourseName("Elementary Algorithm Design and Data Abstraction");
        setExamDate("2026-06-25");
        setStudyGoal("Review pointer memory models, stacks and queues, and recursive trees.");
        setWeakAreas("Manual memory allocations, double-free pointer traps.");
      } else if (key === "MATH137") {
        setCourseCode("MATH 137");
        setCourseName("Calculus I for Honours Mathematics");
        setExamDate("2026-06-22");
        setStudyGoal("Master limit proofs, Taylor approximation bounds, and series tests.");
        setWeakAreas("Lagrange Taylor error bound calculations.");
      } else if (key === "ECON101") {
        setCourseCode("ECON 101");
        setCourseName("Introduction to Microeconomics");
        setExamDate("2026-06-27");
        setStudyGoal("Review competitive supply/demand curves, cost structs, game matrix.");
        setWeakAreas("Income and substitution curves for inferior goods.");
      } else if (key === "PSYCH101") {
        setCourseCode("PSYCH 101");
        setCourseName("Introductory Psychology");
        setExamDate("2026-06-29");
        setStudyGoal("Memorize neurostructures, rods vs cones, operant reinforcement schedules.");
        setWeakAreas("Action potential depolarization ion movements.");
      }
      
      setCurrentPack(demo);
      setView('ready');
      
      // Scroll to generator area where results are loaded side-by-side
      setTimeout(() => {
        generatorRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  // Generation steps animation
  const steps = [
    "Reading uploaded material contents...",
    "Finding syllabus structures & topics...",
    "Creating practice quiz questions...",
    "Building 7-day study cram plan..."
  ];

  const handleFilesProcessed = (text: string, filesList: { name: string; size: number }[]) => {
    // Append to text area
    setAggregatedText((prev) => (prev ? prev + "\n" + text : text));
    setUploadedFilesList((prev) => [...prev, ...filesList]);
  };

  const handleResetFiles = () => {
    setUploadedFilesList([]);
  };

  const triggerGeneration = async () => {
    if (!aggregatedText || !aggregatedText.trim()) {
      alert("Please upload files or paste course notes/syllabus directly into the material box.");
      return;
    }

    setView('generating');
    setGenerationStep(0);
    setGenerationError(null);

    // Start UI progress steps
    const interval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 3500);

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
          subject: "General",
          focusAreas: `Goal: ${studyGoal}. Weak Spots: ${weakAreas}`,
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
      setView('ready');
      setCurrentPack(data);

      confetti({
        particleCount: 50,
        spread: 80,
        colors: ['#2563eb', '#60a5fa']
      });

      generatorRef.current?.scrollIntoView({ behavior: "smooth" });

    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setView('ready');
      
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
      
      // Scroll to generator area to display error panel
      setTimeout(() => {
        generatorRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
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
    setTimeout(() => {
      setPaymentComplete(true);
      confetti({
        particleCount: 40,
        spread: 50,
        colors: ['#2563eb', '#60a5fa']
      });
    }, 1200);
  };

  const triggerStripeCheckout = async (planType: "single" | "semester") => {
    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ planType })
      });
      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.message || "Failed to create checkout session.");
      }
    } catch (error: any) {
      console.error("[Stripe Checkout Error]", error);
      alert(`Stripe Checkout Error: ${error.message}`);
      setCheckoutLoading(false);
    }
  };

  const clearCurrentPack = () => {
    setCurrentPack(null);
    setCourseCode("");
    setCourseName("");
    setExamDate("");
    setStudyGoal("");
    setWeakAreas("");
    setAggregatedText("");
    setUploadedFilesList([]);
    setGenerationError(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white font-sans text-slate-650 antialiased">
      
      {/* 
        ========================================================================
        PROMOTIONAL BANNER
        ========================================================================
      */}
      <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 text-white text-center py-2 px-4 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm print:hidden">
        <Sparkles className="h-3.5 w-3.5 animate-pulse shrink-0 text-white" />
        <span>Finals Week Special: All custom AI generations are completely FREE from June 12 to June 17!</span>
      </div>

      {/* 
        ========================================================================
        NAVIGATION BAR
        ========================================================================
      */}
      <header className="print:hidden border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => clearCurrentPack()}>
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-base shadow-sm">
            CP
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-800">CoursePack AI</span>
            <span className="text-[9px] block text-blue-600 font-semibold uppercase tracking-wider font-mono leading-none mt-0.5">College Edition</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-500">
          <button 
            onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Features
          </button>
          <button 
            onClick={() => {
              selectDemoPack("CS136");
            }}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Watch Demo
          </button>
          <button 
            onClick={() => pricingRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            Pricing
          </button>
          <button 
            onClick={() => generatorRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            Try Now
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <Key className="h-3.5 w-3.5 text-blue-500" />
            {savedKey ? "API Active" : "Set API Key"}
          </button>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="flex-1">

        {/* 
          ========================================================================
          HERO SECTION & PRODUCT PREVIEW
          ========================================================================
        */}
        <section className="print:hidden relative overflow-hidden py-16 md:py-24 max-w-6xl mx-auto px-4">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            
            {/* Tag badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs bg-blue-50 border border-blue-100 text-blue-600 font-bold uppercase tracking-wider font-mono">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Study Pack Generator</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Turn your course files into a complete <span className="text-blue-600">exam study pack</span>
            </h1>

            <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              Upload your syllabus, lecture slides, notes, or rubrics. Get a structured 7-day study plan, active recall questions, and interactive quizzes in under 3 minutes.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => generatorRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
              >
                Generate Free Study Pack
              </button>
              <button
                onClick={() => {
                  selectDemoPack("CS136");
                }}
                className="px-6 py-3 rounded-xl bg-white border border-slate-250 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Explore Sample Demos
              </button>
            </div>

          </div>

          {/* Product Preview Card with Gradient Blob background */}
          <div className="relative mt-16 max-w-4xl mx-auto flex justify-center">
            
            {/* Blob backing */}
            <div className="bg-blob top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]" />

            <div className="relative w-full quill-card rounded-2xl p-4.5 md:p-6 border border-slate-200 grid md:grid-cols-5 gap-4 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
              
              {/* Left Column Mockup - Upload File Area */}
              <div className="md:col-span-2 border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 text-left space-y-3.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Step 1: Upload Materials</span>
                
                <div className="border border-dashed border-slate-350 rounded-lg p-4 text-center bg-white">
                  <div className="mx-auto w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center mb-2">
                    <FileText className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-700">syllabus_cs136.pdf</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Successfully parsed (1.2 MB)</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-150 text-[10px] text-slate-600">
                    <span className="truncate pr-2 font-medium">lecture_slides_wk1_4.pdf</span>
                    <span className="text-emerald-500 shrink-0 font-bold">✓ Parsed</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-150 text-[10px] text-slate-600">
                    <span className="truncate pr-2 font-medium">grading_rubric.docx</span>
                    <span className="text-emerald-500 shrink-0 font-bold">✓ Parsed</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="w-full py-2 rounded-lg bg-blue-600 text-white text-[10px] font-bold text-center flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3" /> Generate Study Pack
                  </div>
                </div>
              </div>

              {/* Arrow Indicator in-between */}
              <div className="hidden md:flex flex-col justify-center items-center text-slate-300">
                <ArrowRightLeft className="h-6 w-6 text-blue-400" />
              </div>

              {/* Right Column Mockup - Generated Study Pack */}
              <div className="md:col-span-2 border border-slate-200/80 rounded-xl p-4 bg-white text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 text-[8px] font-bold font-mono text-blue-600 bg-blue-50 border border-blue-100 rounded">CS 136</span>
                      <h4 className="text-[11px] font-bold text-slate-800">Cram Pack Preview</h4>
                    </div>
                    <span className="text-[8px] text-slate-400 font-mono italic">AI Study Pack</span>
                  </div>

                  {/* Mock content blocks */}
                  <div className="space-y-2.5">
                    <div className="p-2 border-l-2 border-l-rose-500 bg-slate-50 rounded text-[10px]">
                      <span className="font-bold text-slate-800 block text-[9px]">High Priority: Pointer Memory Models</span>
                      <p className="text-slate-500 leading-normal mt-0.5">Tested on 25% of final exam. Memory allocation leaks are a common trap.</p>
                    </div>

                    <div className="p-2.5 border border-slate-200 bg-white rounded-lg text-[9px] font-mono text-blue-600 bg-slate-50/20">
                      <strong>Likely Question:</strong> Trace malloc allocations and fix conditional memory leaks.
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between text-[9px]">
                  <span className="text-slate-400">Includes Active Recall & Quizzes</span>
                  <span className="font-semibold text-blue-600 flex items-center gap-0.5">Explore tabs <ChevronRight className="h-2.5 w-2.5" /></span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 
          ========================================================================
          MAIN GENERATOR SECTION (TWO-COLUMN INTERFACE)
          ========================================================================
        */}
        <section 
          ref={generatorRef}
          className="py-12 md:py-16 border-t border-b border-slate-200 bg-slate-50/50"
        >
          <div className="max-w-6xl mx-auto px-4 space-y-8">
            
            <div className="text-center md:text-left space-y-1.5">
              <h2 className="text-2xl font-bold text-slate-900">Study Pack Workspace</h2>
              <p className="text-xs text-slate-500">
                Type details and copy materials into the left workspace. The complete prep kit will load instantly on the right.
              </p>
            </div>

            {/* Side-by-side desktop layout */}
            <div className="grid lg:grid-cols-5 gap-6 items-start">
              
              {/* Left Column: Input Settings (40% width on desktop) */}
              <div className="lg:col-span-2 quill-card rounded-2xl p-5 md:p-6 border border-slate-200 space-y-5 bg-white">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">1. Course Criteria</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Fill in course properties to tailor prompts and focus points.</p>
                </div>

                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Course Code</label>
                    <input
                      type="text"
                      placeholder="e.g. CS 136"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2.5 text-slate-700 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Exam Date</label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2 text-slate-700 transition-colors cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Course Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Elementary Algorithm Design"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2.5 text-slate-700 transition-colors"
                  />
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-3 text-xs">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">2. Study Customization</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Help the AI focus on specific study targets.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Study Goal</label>
                    <input
                      type="text"
                      placeholder="e.g. Get an A+, pass Taylor polynomial proofs"
                      value={studyGoal}
                      onChange={(e) => setStudyGoal(e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2.5 text-slate-700 transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Known Weak Areas</label>
                    <input
                      type="text"
                      placeholder="e.g. Memory leaks, Lagrange remainder error"
                      value={weakAreas}
                      onChange={(e) => setWeakAreas(e.target.value)}
                      className="w-full bg-white border border-slate-200 hover:border-slate-350 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2.5 text-slate-700 transition-colors"
                    />
                  </div>
                </div>

                {/* QuillBot-style bordered input textbox & File Upload */}
                <div className="space-y-3 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">3. Course Material Texts</h3>
                    {uploadedFilesList.length > 0 && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                        {uploadedFilesList.length} files parsed
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <FileUploader 
                      onFilesProcessed={handleFilesProcessed}
                      onReset={handleResetFiles}
                    />
                  </div>

                  {/* Large QuillBot Writing Area */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Extracted Course Text Area</label>
                    <textarea
                      placeholder="Or paste your syllabus, lecture slides notes, and rubric text directly here..."
                      value={aggregatedText}
                      onChange={(e) => setAggregatedText(e.target.value)}
                      rows={6}
                      className="w-full bg-white border border-slate-250 hover:border-slate-350 focus:border-blue-400 focus:outline-none rounded-xl p-3.5 text-xs text-slate-700 font-sans leading-relaxed resize-y placeholder:text-slate-400"
                    />
                    <div className="text-[10px] text-slate-400 text-right font-medium">
                      Character Count: {aggregatedText.length.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Main Generate Button */}
                <div className="pt-2">
                  {view === 'generating' ? (
                    <div className="w-full py-3 rounded-xl bg-blue-100 text-blue-600 text-xs font-bold text-center flex items-center justify-center gap-2 border border-blue-200">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span>AI is processing your materials...</span>
                    </div>
                  ) : (
                    <button
                      onClick={triggerGeneration}
                      disabled={!aggregatedText || !aggregatedText.trim()}
                      className={`w-full py-3.5 text-xs font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        !aggregatedText || !aggregatedText.trim()
                          ? "bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10"
                      }`}
                    >
                      <Sparkles className="h-4 w-4" /> Generate Study Pack (3 Minutes)
                    </button>
                  )}
                </div>

              </div>

              {/* Right Column: Output Dashboard Preview (60% width on desktop) */}
              <div className="lg:col-span-3 min-h-[500px]">
                
                {/* Generation loader step panel */}
                {view === 'generating' && (
                  <div className="quill-card rounded-2xl border border-slate-200 p-8 text-center bg-white h-full flex flex-col items-center justify-center space-y-6">
                    <div className="relative w-12 h-12">
                      <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                      <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm font-bold text-slate-800">Generating Study Pack</h4>
                      <p className="text-xs text-slate-500">We are processing syllabus, slides, and note files.</p>
                    </div>

                    <div className="w-full max-w-xs h-1.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden mx-auto">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${Math.round(((generationStep + 1) / steps.length) * 100)}%` }}
                      />
                    </div>

                    <p className="text-xs font-mono font-bold text-blue-600 animate-pulse">
                      {steps[generationStep]}
                    </p>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-150 text-[10px] text-slate-400 max-w-xs leading-normal">
                      Note: Large files can take up to 2 minutes to compile and analyze using the Gemini SDK. Please keep this tab active.
                    </div>
                  </div>
                )}

                {/* Error Panel if generation fails */}
                {view === 'ready' && generationError && (
                  <div className="quill-card rounded-2xl border border-rose-100 p-8 text-center bg-white space-y-4">
                    <div className="mx-auto w-10 h-10 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800">{generationError.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">{generationError.desc}</p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => setShowSettings(true)}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
                      >
                        Set API Key Settings
                      </button>
                    </div>
                  </div>
                )}

                {/* Loaded Output Dashboard */}
                {view === 'ready' && !generationError && currentPack && (
                  <div className="quill-card rounded-2xl border border-slate-200 p-5 bg-white shadow-sm">
                    <StudyPackDashboard 
                      pack={currentPack}
                      examDate={examDate}
                      studyGoal={studyGoal}
                      weakAreas={weakAreas}
                      onClear={clearCurrentPack}
                    />
                  </div>
                )}

                {/* Empty State / Instruction Placeholder */}
                {view === 'ready' && !generationError && !currentPack && (
                  <div className="quill-card rounded-2xl border border-slate-200 p-10 text-center bg-white h-full flex flex-col items-center justify-center space-y-6">
                    <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 animate-float" />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-sm font-bold text-slate-800">Your Exam Study Pack will appear here</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Enter your course criteria and paste course materials on the left, then click generate to get started.
                      </p>
                    </div>

                    <div className="w-full max-w-xs grid gap-2.5 py-4 border-t border-b border-slate-100 text-left text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>Overview & weekly syllabus structures</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>Interactive 3D Flippable Flashcards</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>Practice quizzes and active recall testing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>A full 7-day study cram checklist</span>
                      </div>
                    </div>

                    {/* Quick Demo Taglines */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Or Try a Sample Demo Pack instantly</span>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={() => selectDemoPack("CS136")}
                          className="px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-semibold border border-blue-100 transition-colors cursor-pointer"
                        >
                          CS 136 Demo
                        </button>
                        <button
                          onClick={() => selectDemoPack("MATH137")}
                          className="px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-semibold border border-blue-100 transition-colors cursor-pointer"
                        >
                          MATH 137 Demo
                        </button>
                        <button
                          onClick={() => selectDemoPack("ECON101")}
                          className="px-3 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-semibold border border-blue-100 transition-colors cursor-pointer"
                        >
                          ECON 101 Demo
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        </section>

        {/* 
          ========================================================================
          FEATURES SECTION
          ========================================================================
        */}
        <section 
          ref={featuresRef}
          className="print:hidden py-16 md:py-20 max-w-6xl mx-auto px-4 space-y-12"
        >
          <div className="text-center space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Student First AI Workflow</h3>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Designed for university exam preparation</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="quill-card rounded-2xl p-6 border border-slate-200 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                <Target className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Source-Grounded Priority</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gemini identifies high-frequency topics in your notes, slides, and syllabus grading rules, mapping out exactly what is likely to be tested.
              </p>
            </div>

            <div className="quill-card rounded-2xl p-6 border border-slate-200 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                <BrainCircuit className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Active Recall Engine</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Study with collapsible self-testing questions, dynamic 3D flippable definition flashcards, and interactive practice tests.
              </p>
            </div>

            <div className="quill-card rounded-2xl p-6 border border-slate-200 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                <Calendar className="h-4.5 w-4.5" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">7-Day Study Calendar</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                A daily progressive checklist that divides your course load into digestible review milestones leading straight to exam day.
              </p>
            </div>
          </div>
        </section>

        {/* 
          ========================================================================
          PRICING PLANS
          ========================================================================
        */}
        <section 
          ref={pricingRef}
          className="print:hidden py-16 md:py-20 border-t border-slate-200 bg-slate-50/50"
        >
          <div className="max-w-6xl mx-auto px-4 space-y-12">
            <div className="text-center space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 font-mono">Pricing Plans</h3>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Calm preparation on any budget</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              
              {/* Free Trial */}
              <div className="quill-card rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-6 bg-white">
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Demo Access</span>
                    <h4 className="text-base font-bold text-slate-800 mt-0.5">Template Trial</h4>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-800">$0</span>
                    <span className="text-slate-400 text-xs font-medium">Free</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-500">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500 shrink-0" /> Full access to sample courses</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500 shrink-0" /> 3D Flashcards & Recall tabs</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500 shrink-0" /> Notion & Anki exports</li>
                  </ul>
                </div>
                <button
                  onClick={() => generatorRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="w-full py-2.5 text-xs font-bold rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 transition-all cursor-pointer"
                >
                  Explore Demo Packs
                </button>
              </div>

              {/* Single Pack (Featured) */}
              <div className="quill-card rounded-2xl p-6 border-2 border-blue-500/50 flex flex-col justify-between space-y-6 bg-white relative shadow-lg shadow-blue-500/5">
                <div className="absolute top-0 right-6 translate-y-[-50%] px-2.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase bg-blue-600 text-white tracking-widest">
                  Featured
                </div>
                
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[9px] font-bold text-blue-600 uppercase block tracking-wider">Pay-As-You-Study</span>
                    <h4 className="text-base font-bold text-slate-800 mt-0.5">Single Exam Pack</h4>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-800">$5.99</span>
                    <span className="text-slate-400 text-xs font-medium">per course</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-655">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600 shrink-0" /> Upload custom slide and note files</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600 shrink-0" /> Custom 7-day study plan</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600 shrink-0" /> Interactive AI practice quiz</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600 shrink-0" /> PDF printing formats & exports</li>
                  </ul>
                </div>
                
                <button
                  disabled={checkoutLoading}
                  onClick={() => triggerStripeCheckout("single")}
                  className="w-full py-2.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {checkoutLoading ? "Connecting..." : "Unlock Custom Pack"}
                </button>
              </div>

              {/* Semester Pass */}
              <div className="quill-card rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-6 bg-white">
                <div className="space-y-3.5">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Unlimited Semester</span>
                    <h4 className="text-base font-bold text-slate-800 mt-0.5">Semester Bundle</h4>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-800">$12.99</span>
                    <span className="text-slate-400 text-xs font-medium">/ month</span>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-500">
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500 shrink-0" /> Generates up to 5 courses study packs</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500 shrink-0" /> Fast-lane AI request priorities</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500 shrink-0" /> Dynamic slide updates</li>
                    <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500 shrink-0" /> Custom focus topics panel</li>
                  </ul>
                </div>
                
                <button
                  disabled={checkoutLoading}
                  onClick={() => triggerStripeCheckout("semester")}
                  className="w-full py-2.5 text-xs font-bold rounded-lg bg-slate-100 border border-slate-200 hover:bg-slate-200/50 hover:border-slate-350 disabled:bg-slate-50 text-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {checkoutLoading ? "Connecting..." : "Buy Semester Pass"}
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* 
          ========================================================================
          WAITLIST CAPTURE
          ========================================================================
        */}
        <section className="print:hidden py-16 max-w-6xl mx-auto px-4">
          <div className="quill-card rounded-2xl p-8 border border-slate-200 bg-gradient-to-tr from-slate-50/50 to-white text-center relative overflow-hidden">
            <div className="max-w-xl mx-auto space-y-5">
              <h3 className="text-lg md:text-xl font-bold text-slate-800">
                Unlock free packs for student clubs and cohorts
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                We design tailored student portals for tutor programs and university societies. Leave your university email address below to join the waitlist and get 3 free credits.
              </p>

              {!waitlistSubmitted ? (
                <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-[50%] translate-y-[-50%] h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="student@university.edu"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer shrink-0"
                  >
                    Join Waitlist
                  </button>
                </form>
              ) : (
                <div className="p-3.5 rounded-xl border border-emerald-250 bg-emerald-50/40 text-emerald-700 max-w-xs mx-auto flex items-center justify-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                  <div className="text-left text-xs">
                    <span className="font-bold block">Waitlist Registration Active</span>
                    <span className="text-[10px] text-slate-500">You are position #{waitlistCount} on the list.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* Footer (Screen-only, hidden during print) */}
      <footer className="print:hidden border-t border-slate-200 bg-slate-50/40 py-8 px-4 text-center text-xs text-slate-400 space-y-1">
        <p>© 2026 CoursePack AI. Built for college & university students.</p>
        <p className="text-[10px] text-slate-400/80 font-medium">CoursePack AI is an independent student productivity tool and is not associated with any university.</p>
      </footer>

      {/* 
        ========================================================================
        MODAL 1: API CONFIGURATION MODAL
        ========================================================================
      */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="quill-card rounded-2xl border border-slate-250 w-full max-w-md p-5 md:p-6 space-y-4 bg-white shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Key className="h-4.5 w-4.5 text-blue-600" />
                Gemini API Credentials
              </h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-slate-650 text-xs font-semibold px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-500">
              <p className="leading-relaxed">
                By default, requests search for the `GEMINI_API_KEY` defined in the server's environment.
              </p>
              <p className="leading-relaxed">
                If the hosting server does not have an active key, you can enter your personal Gemini API Key below. It will be stored in your browser's <strong className="text-slate-850">localStorage</strong> and used only for requests made from this tab session.
              </p>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={userApiKey}
                  onChange={(e) => setUserApiKey(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2 text-slate-700 font-mono"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-start gap-2 text-[10px] text-slate-400 leading-normal">
                <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p>
                  Get a free key by logging into <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a> with any Gmail account and clicking "Create API Key".
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {savedKey ? (
                <button
                  onClick={handleRemoveKey}
                  className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                >
                  Clear Config
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveKey}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Save Config
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MODAL 2: MOCK STRIPE PAYMENT
        ========================================================================
      */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="quill-card rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4.5 bg-white shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-xs font-mono font-bold">S</span>
                <h3 className="font-bold text-sm text-slate-800">
                  Stripe Checkout Simulator
                </h3>
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-650 text-xs font-semibold px-2"
              >
                ✕
              </button>
            </div>

            {!paymentComplete ? (
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                
                {/* Billing details */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Billing Item</span>
                    <h4 className="font-bold text-slate-700">{selectedPlan?.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Total</span>
                    <p className="font-mono font-bold text-blue-600 text-sm">{selectedPlan?.price}</p>
                  </div>
                               {/* Fields */}
                <div className="space-y-3.5 text-xs text-slate-500">
                  
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="student@university.edu"
                      className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2.5 text-slate-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Card Details</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        maxLength={19}
                        placeholder="4242 4242 4242 4242"
                        value={paymentCardNumber}
                        onChange={(e) => {
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
                        className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2.5 text-slate-755 font-mono placeholder:text-slate-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentCardNumber("4242 4242 4242 4242");
                          setPaymentName("Jane Doe");
                        }}
                        className="absolute right-3 top-[50%] translate-y-[-50%] text-[8px] uppercase font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-100"
                      >
                        AutoFill
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Expiration</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        placeholder="MM / YY"
                        className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2.5 text-center font-mono placeholder:text-slate-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">CVC</label>
                      <input
                        type="password"
                        required
                        maxLength={3}
                        placeholder="123"
                        className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2.5 text-center font-mono placeholder:text-slate-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={paymentName}
                      onChange={(e) => setPaymentName(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2.5 text-slate-700"
                    />
                  </div>

                </div>   </div>

                {/* Pay Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/10 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Lock className="h-3.5 w-3.5 text-emerald-400" /> Pay {selectedPlan?.price}
                </button>

                <p className="text-[9px] text-slate-400 text-center leading-normal">
                  🔒 Payments are mock-processed in standard Stripe sandbox mode. No actual cards are billed.
                </p>

              </form>
            ) : (
              /* Payment Complete */
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Transaction Complete!</h4>
                  <p className="text-xs text-slate-500">Your mock premium credits are now active.</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-left text-xs max-w-xs mx-auto flex items-start gap-2">
                  <Zap className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-750 block">Premium Generated Unlocked</span>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">You can now parse custom course files on the left. The generator will prioritize your requests.</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                >
                  Return to Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
