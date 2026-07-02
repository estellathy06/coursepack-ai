"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Key, Sparkles, AlertCircle, FileText, ArrowRight, 
  HelpCircle, Mail, Check, ShieldCheck, Zap, Star,
  BookOpen, Target, Calendar, ListTodo, Layers,
  ChevronRight, Award, Lock, Loader2, BrainCircuit,
  Plus, ArrowLeft, Trash2, RefreshCw, BookMarked, Settings, Info, BarChart2,
  CheckSquare, Square
} from "lucide-react";
import FileUploader from "@/components/FileUploader";
import ExamPredictionSection from "@/components/ExamPredictionSection";
import StudyPlanSection from "@/components/StudyPlanSection";
import { calculateSchedule, ScheduledCourse } from "@/utils/scheduler";
import { Course, School, Program, CourseAnalysis, StudyPlan } from "@/utils/db";
import { demoStudyPacks } from "@/utils/demoData";
import confetti from "canvas-confetti";

export default function Home() {
  // Navigation & View states
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'materials' | 'analysis' | 'studyPlan' | 'reviewWorkspace'>('materials');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'courseMap' | 'keyConcepts' | 'activeRecall' | 'quiz' | 'flashcards' | 'weakSpots'>('courseMap');
  
  // Data lists
  const [courses, setCourses] = useState<Course[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, CourseAnalysis | null>>({});
  const [plans, setPlans] = useState<Record<string, StudyPlan | null>>({});
  
  // App variables
  const [userId, setUserId] = useState<string>("");
  const [dailyHoursLimit, setDailyHoursLimit] = useState<number>(4);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [userApiKey, setUserApiKey] = useState("");
  const [savedKey, setSavedKey] = useState("");

  // Stripe & Waitlist Mock
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string } | null>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentCardNumber, setPaymentCardNumber] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(842);

  // Add Course Form Fields
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newSchoolName, setNewSchoolName] = useState("");
  const [newProgramName, setNewProgramName] = useState("");
  const [newExamDate, setNewExamDate] = useState("");
  const [newTargetScore, setNewTargetScore] = useState("60%");
  const [newDailyHours, setNewDailyHours] = useState("2");
  const [newBaseLevel, setNewBaseLevel] = useState("average");

  // Upload Material Form Fields
  const [uploadCourseId, setUploadCourseId] = useState("");
  const [uploadMaterialType, setUploadMaterialType] = useState("Lecture Notes");
  const [uploadFileText, setUploadFileText] = useState("");
  const [uploadFileList, setUploadFileList] = useState<{ name: string; size: number }[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  // AI Generation triggers
  const [analyzingCourseId, setAnalyzingCourseId] = useState<string | null>(null);
  const [planningCourseId, setPlanningCourseId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Quiz interactive state
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  // Flashcards interactive state
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Active Recall interactive state
  const [masteredRecall, setMasteredRecall] = useState<Record<number, boolean>>({});
  const [revealedRecall, setRevealedRecall] = useState<Record<number, boolean>>({});

  const dashboardRef = useRef<HTMLDivElement>(null);

  // 1. Initial Load
  useEffect(() => {
    // Setup API Key
    const key = localStorage.getItem("coursepack_gemini_key") || "";
    setUserApiKey(key);
    setSavedKey(key);
    setWaitlistCount(Math.floor(Math.random() * 200) + 840);

    // Setup simulated user
    let uid = localStorage.getItem("coursepack_user_id") || "";
    if (!uid) {
      uid = crypto.randomUUID();
      localStorage.setItem("coursepack_user_id", uid);
    }
    setUserId(uid);

    // Load schedule preferences
    const storedHours = localStorage.getItem("coursepack_daily_hours_limit");
    if (storedHours) {
      setDailyHoursLimit(Number(storedHours));
    }

    loadDashboardData(uid);
  }, []);

  const loadDashboardData = async (uid: string) => {
    setLoading(true);
    try {
      // Fetch courses
      const courseRes = await fetch(`/api/courses?userId=${uid}`);
      if (!courseRes.ok) throw new Error("Failed to load courses");
      const data = await courseRes.json();
      setCourses(data.courses || []);
      setSchools(data.schools || []);
      setPrograms(data.programs || []);

      // Fetch study plans
      const planRes = await fetch(`/api/study-plan?userId=${uid}`);
      if (planRes.ok) {
        const planData = await planRes.json();
        const planMap: Record<string, StudyPlan> = {};
        planData.plans?.forEach((p: StudyPlan) => {
          planMap[p.course_id] = p;
        });
        setPlans(planMap);
      }

      // Fetch analyses
      const analysesMap: Record<string, CourseAnalysis | null> = {};
      if (data.courses) {
        for (const course of data.courses) {
          const anaRes = await fetch(`/api/courses/${course.id}/analysis`);
          if (anaRes.ok) {
            const anaData = await anaRes.json();
            analysesMap[course.id] = anaData.analysis || null;
          }
        }
      }
      setAnalyses(analysesMap);

    } catch (err: any) {
      console.error(err);
      setGenerationError("Failed to fetch dashboard data. Using local cache.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = () => {
    localStorage.setItem("coursepack_gemini_key", userApiKey);
    setSavedKey(userApiKey);
    setShowSettings(false);
    confetti({ particleCount: 30, spread: 40, colors: ["#2563eb", "#60a5fa"] });
  };

  const handleRemoveKey = () => {
    localStorage.removeItem("coursepack_gemini_key");
    setUserApiKey("");
    setSavedKey("");
    setShowSettings(false);
  };

  const handleHoursLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hours = Math.max(1, Math.min(24, Number(e.target.value) || 4));
    setDailyHoursLimit(hours);
    localStorage.setItem("coursepack_daily_hours_limit", String(hours));
  };

  // Helper to calculate days remaining
  const getDaysRemaining = (examDateStr?: string) => {
    if (!examDateStr) return 999;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const examDate = new Date(examDateStr);
    examDate.setHours(0, 0, 0, 0);
    const diffTime = examDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 2. Add Course
  const handleAddCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName || !newCourseCode) {
      alert("Please fill in the course name and code.");
      return;
    }

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: newCourseName,
          courseCode: newCourseCode,
          schoolName: newSchoolName,
          programName: newProgramName,
          examDate: newExamDate,
          targetScore: newTargetScore,
          dailyAvailableHours: Number(newDailyHours),
          currentLevel: newBaseLevel
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add course");
      }

      // Reset form
      setNewCourseName("");
      setNewCourseCode("");
      setNewSchoolName("");
      setNewProgramName("");
      setNewExamDate("");
      setShowAddCourse(false);
      
      confetti({ particleCount: 30, spread: 50 });
      loadDashboardData(userId);
    } catch (err: any) {
      alert(`Error creating course: ${err.message}`);
    }
  };

  // 3. Delete Course
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course and all of its materials?")) return;
    try {
      const res = await fetch(`/api/courses?id=${courseId}`, {
        method: "DELETE" // Wait, we can implement local Db deletion directly
      });
      // In db.ts deleteCourse is implemented. Let's make an API route or delete directly.
      // Wait, we can add a delete route or we can just invoke course deletion.
      // Let's call DELETE /api/courses?id=courseId
      // Let's check if the API supports it. In route.ts (courses) we only did GET/POST.
      // Let's create a DELETE endpoint in courses route or modify it.
      // Let's implement local DB reload.
      // Since db.ts has deleteCourse, we can edit src/app/api/courses/route.ts to support DELETE!
      // Wait! Let's do that right after or handle it.
      const response = await fetch(`/api/courses?userId=${userId}&courseId=${courseId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setActiveCourseId(null);
        loadDashboardData(userId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. File upload and parsed content linking
  const handleFilesProcessed = (text: string, filesList: { name: string; size: number }[]) => {
    setUploadFileText(text);
    setUploadFileList(filesList);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadCourseId) {
      alert("Please select a course to link this material to.");
      return;
    }
    if (!uploadFileText || uploadFileList.length === 0) {
      alert("Please drag and drop files and ensure they are parsed successfully.");
      return;
    }

    setUploadLoading(true);
    try {
      // Loop through parsed files and upload
      for (const file of uploadFileList) {
        await fetch("/api/materials/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId: uploadCourseId,
            name: file.name,
            materialType: uploadMaterialType,
            text: uploadFileText,
            size: file.size,
            wordCount: uploadFileText.split(/\s+/).length
          })
        });
      }

      setUploadFileText("");
      setUploadFileList([]);
      setShowUploadModal(false);
      confetti({ particleCount: 30, colors: ["#10b981", "#60a5fa"] });
      
      // Reload dashboard and if viewing active course, reload details
      loadDashboardData(userId);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadLoading(false);
    }
  };

  // 5. Final Exam AI Analysis Trigger
  const triggerExamAnalysis = async (courseId: string) => {
    setAnalyzingCourseId(courseId);
    setGenerationError(null);
    try {
      const response = await fetch(`/api/courses/${courseId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userApiKey: savedKey || undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to analyze final exam.");
      }

      const data = await response.json();
      setAnalyses((prev) => ({ ...prev, [courseId]: data.analysis }));
      
      // Update local course review status
      setCourses(prev => prev.map(c => c.id === courseId ? { ...c, review_status: "Ready" } : c));

      confetti({ particleCount: 50, spread: 80 });
      setActiveDetailTab("analysis");
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Gemini AI final exam analysis failed.");
    } finally {
      setAnalyzingCourseId(null);
    }
  };

  // 6. Study Plan AI Generation Trigger
  const triggerStudyPlan = async (courseId: string, force: boolean = false) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    setPlanningCourseId(courseId);
    setGenerationError(null);
    try {
      const response = await fetch(`/api/courses/${courseId}/study-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          daysRemaining: getDaysRemaining(course.exam_date),
          targetScore: course.target_score || "60%",
          dailyAvailableHours: course.daily_available_hours || 2,
          currentLevel: course.current_level || "average",
          forceRegenerate: force,
          userApiKey: savedKey || undefined
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to generate study plan.");
      }

      const data = await response.json();
      setPlans((prev) => ({ ...prev, [courseId]: data.plan }));
      setActiveDetailTab("studyPlan");
      confetti({ particleCount: 50, spread: 60, colors: ["#2563eb", "#60a5fa"] });
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Gemini AI study plan generation failed.");
    } finally {
      setPlanningCourseId(null);
    }
  };

  // 7. Load Demo Templates
  const handleLoadDemo = async (key: "CS136" | "MATH137" | "ECON101") => {
    setLoading(true);
    try {
      const demo = demoStudyPacks[key];
      if (!demo) return;

      // Make API calls or directly write to local db via POST endpoint.
      // First, create the course
      const courseRes = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: demo.courseName,
          courseCode: demo.courseCode,
          schoolName: demo.university,
          programName: "Computer Science & Mathematics",
          examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 5 days from now
          targetScore: "70%",
          dailyAvailableHours: 3,
          currentLevel: "average"
        })
      });

      if (!courseRes.ok) throw new Error("Failed to create demo course");
      const courseData = await courseRes.json();
      const courseId = courseData.course.id;

      // Link mock material
      await fetch("/api/materials/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          name: `${key}_Syllabus_and_Slides.txt`,
          materialType: "Lecture Notes",
          text: demo.summary + "\n" + demo.courseMap.map(c => c.topic).join("\n"),
          size: 1450,
          wordCount: 300
        })
      });

      // Write direct mock analysis and plan to db for persistence (we can call analyze/study-plan API)
      // Since calling AI would spend key tokens, we can mock create or bypass it.
      // But we can let the student click 'Analyze' on the detail page, which teaches them how to use it!
      // This is extremely interactive! The course is created, syllabus is uploaded, and they click 'Analyze'!
      
      confetti({ particleCount: 60 });
      loadDashboardData(userId);
      setActiveCourseId(courseId);
      setActiveDetailTab("materials");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Scheduling calculation
  const scheduledCourses: ScheduledCourse[] = calculateSchedule(courses, analyses, dailyHoursLimit);

  // Active Course details lookup
  const activeCourse = courses.find((c) => c.id === activeCourseId);
  const activeAnalysis = activeCourseId ? analyses[activeCourseId] : null;
  const activePlan = activeCourseId ? plans[activeCourseId] : null;

  // Render variables for workspace tabs
  const parsedWorkspace = activeAnalysis ? {
    courseCode: activeCourse?.course_code || "GEN-101",
    courseName: activeCourse?.name || "",
    university: activeCourse?.school_name || "",
    summary: activeAnalysis.summary,
    courseMap: activeAnalysis.extracted_topics || [],
    definitions: (activeAnalysis.question_bank as any)?.definitions || [],
    activeRecall: (activeAnalysis.question_bank as any)?.activeRecall || [],
    quiz: (activeAnalysis.question_bank as any)?.quiz || [],
    weakSpots: (activeAnalysis.question_bank as any)?.weakSpots || []
  } : null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white font-sans text-slate-650 antialiased">
      
      {/* Finals Specialty Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 text-white text-center py-2 px-4 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm print:hidden">
        <Sparkles className="h-3.5 w-3.5 animate-pulse shrink-0 text-white" />
        <span>Cram Planner College Edition: Upload materials, estimate probabilities, and prioritize study time!</span>
      </div>

      {/* Navigation Header */}
      <header className="print:hidden border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveCourseId(null)}>
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-base shadow-sm">
            CP
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-800">CoursePack AI</span>
            <span className="text-[9px] block text-blue-600 font-semibold uppercase tracking-wider font-mono leading-none mt-0.5">Cram Planner</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-550 transition-all cursor-pointer"
          >
            <Key className="h-3.5 w-3.5 text-blue-500" />
            {savedKey ? "Gemini Key Loaded" : "Load Gemini Key"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-10">
        
        {loading ? (
          <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-xs text-slate-400">Loading student workspace details...</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6 items-start">
            
            {/* LEFT COLUMN: Course Dashboard Sidebar (Hidden when viewing detail on small screens) */}
            <div className={`lg:col-span-1 space-y-6 ${activeCourseId ? "hidden lg:block" : "block"}`}>
              
              {/* Daily Allocation Preferences */}
              <div className="quill-card p-4.5 border border-slate-200 bg-slate-50/50 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Study Time Budget</h3>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Max study hours/day</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={dailyHoursLimit}
                    onChange={handleHoursLimitChange}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-700 focus:outline-none focus:border-blue-400"
                  />
                  <p className="text-[9px] text-slate-450 italic leading-snug">
                    Allocated dynamically across courses based on urgency and target difficulties.
                  </p>
                </div>
              </div>

              {/* Template Demos Trigger */}
              <div className="quill-card p-4 border border-slate-200 bg-white rounded-2xl space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Insert Demo Template</span>
                <div className="grid gap-2">
                  <button
                    onClick={() => handleLoadDemo("CS136")}
                    className="w-full text-left px-3 py-2 rounded-lg bg-blue-50/50 hover:bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-700 transition-colors cursor-pointer"
                  >
                    CS 136: Memory & BSTs
                  </button>
                  <button
                    onClick={() => handleLoadDemo("MATH137")}
                    className="w-full text-left px-3 py-2 rounded-lg bg-blue-50/50 hover:bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-700 transition-colors cursor-pointer"
                  >
                    MATH 137: Calculus Taylor Bounds
                  </button>
                  <button
                    onClick={() => handleLoadDemo("ECON101")}
                    className="w-full text-left px-3 py-2 rounded-lg bg-blue-50/50 hover:bg-blue-50 border border-blue-100 text-[11px] font-semibold text-blue-700 transition-colors cursor-pointer"
                  >
                    ECON 101: Tax & Market Cost Curves
                  </button>
                </div>
              </div>

              {/* Today's Study Priority Recommended Order */}
              {scheduledCourses.length > 0 && (
                <div className="quill-card p-4.5 border border-slate-250 bg-slate-50/20 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5">
                    <ListTodo className="h-4.5 w-4.5 text-blue-600" />
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Daily Priority List</h3>
                  </div>

                  <div className="space-y-2">
                    {scheduledCourses.map(({ course, priorityLabel, allocatedHours }) => {
                      if (allocatedHours === 0) return null;
                      const labelColors = {
                        Critical: "bg-rose-100 text-rose-700 border-rose-200",
                        High: "bg-amber-100 text-amber-700 border-amber-200",
                        Medium: "bg-blue-100 text-blue-700 border-blue-200",
                        Low: "bg-slate-100 text-slate-600 border-slate-200"
                      }[priorityLabel];

                      return (
                        <div key={course.id} className="p-2.5 border border-slate-150 rounded-xl bg-white flex items-center justify-between text-xs hover:border-slate-300">
                          <div className="min-w-0 pr-1">
                            <h4 className="font-extrabold text-slate-800 truncate">{course.course_code}</h4>
                            <span className={`inline-block px-1.5 py-0.2 rounded font-extrabold uppercase text-[8px] tracking-wide mt-1 border ${labelColors}`}>
                              {priorityLabel}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 block font-mono">ALLOTMENT</span>
                            <span className="font-mono font-bold text-blue-600">{allocatedHours} hrs</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: MAIN WORKSPACE OR DETAIL PANEL (3 columns) */}
            <div className="lg:col-span-3 space-y-6">

              {generationError && (
                <div className="p-4 rounded-xl border border-rose-150 bg-rose-50 text-rose-800 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                    <span>{generationError}</span>
                  </div>
                  <button onClick={() => setGenerationError(null)} className="text-rose-500 hover:text-rose-800">✕</button>
                </div>
              )}

              {/* VIEW A: COURSES LIST DASHBOARD */}
              {!activeCourseId ? (
                <div className="space-y-6">
                  
                  {/* Dashboard Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Courses Dashboard</h2>
                      <p className="text-xs text-slate-450 mt-1">
                        Organize study guides, scan for exam questions, and generate target schedules.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <FileText className="h-4 w-4 text-blue-500" />
                        Upload Material
                      </button>
                      <button
                        onClick={() => setShowAddCourse(true)}
                        className="px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/10 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        Add Course
                      </button>
                    </div>
                  </div>

                  {/* Empty state courses */}
                  {courses.length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-slate-200 bg-slate-50/50 rounded-3xl space-y-4">
                      <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                        <BookOpen className="h-5.5 w-5.5 animate-float" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-800">No active courses yet</h3>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Create a course or load a template demo from the sidebar, then upload slide/syllabus text files to generate a planner.
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setShowAddCourse(true)}
                          className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm cursor-pointer"
                        >
                          Create Your First Course
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {scheduledCourses.map(({ course, daysRemaining, priorityScore, priorityLabel }) => {
                        const statusColors = {
                          "Not Started": "bg-slate-100 text-slate-500 border-slate-200",
                          "In Progress": "bg-amber-50 text-amber-600 border-amber-200",
                          "Ready": "bg-emerald-50 text-emerald-600 border-emerald-250"
                        }[course.review_status || "Not Started"];

                        const daysColor = daysRemaining === -1 
                          ? "text-slate-400" 
                          : daysRemaining <= 3 
                          ? "text-rose-600 font-extrabold" 
                          : "text-slate-700 font-extrabold";

                        return (
                          <div
                            key={course.id}
                            className="quill-card quill-card-hover border border-slate-200 bg-white rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 uppercase">
                                  {course.course_code}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusColors}`}>
                                  {course.review_status || "Not Started"}
                                </span>
                              </div>

                              <div className="text-left">
                                <h3 className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors truncate">
                                  {course.name}
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                  {course.school_name} • {course.program_name}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 py-2 border-t border-b border-slate-100 text-left text-xs">
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Remaining Timeline</span>
                                  <span className={`text-[11px] ${daysColor}`}>
                                    {daysRemaining === -1 ? "Passed" : daysRemaining === 0 ? "Today!" : `${daysRemaining} days left`}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Target score</span>
                                  <span className="text-[11px] font-semibold text-slate-800">{course.target_score || "60%"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 text-xs pt-1">
                              <div className="text-left">
                                <span className="text-[9px] font-bold text-slate-450 block">STUDY FILES</span>
                                <span className="font-bold text-slate-700">{course.material_count || 0} uploaded</span>
                              </div>

                              <button
                                onClick={() => {
                                  setActiveCourseId(course.id);
                                  setActiveDetailTab(course.review_status === "Ready" ? "analysis" : "materials");
                                }}
                                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-0.5 shadow-sm shadow-blue-500/5"
                              >
                                Manage <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                
                // VIEW B: COURSE SPECIFIC DETAILS & ANALYSIS / PLANS PANEL
                <div className="space-y-6">
                  
                  {/* Detail Panel Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-4">
                    <div className="space-y-1 text-left">
                      <button
                        onClick={() => setActiveCourseId(null)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline cursor-pointer mb-2"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 uppercase">
                          {activeCourse?.course_code}
                        </span>
                        <h2 className="text-lg font-bold text-slate-900">{activeCourse?.name}</h2>
                      </div>
                      <p className="text-xs text-slate-400">
                        {activeCourse?.school_name} • {activeCourse?.program_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteCourse(activeCourseId)}
                        className="p-2 border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="Delete Course"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Course Detail sub-tabs */}
                  <div className="bg-slate-100 p-1 rounded-xl flex overflow-x-auto scrollbar-none gap-0.5">
                    <button
                      onClick={() => setActiveDetailTab("materials")}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        activeDetailTab === "materials"
                          ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Materials ({activeCourse?.material_count || 0})
                    </button>
                    
                    <button
                      onClick={() => {
                        if (!activeAnalysis) {
                          alert("Please analyze the final exam first to generate predictions.");
                          return;
                        }
                        setActiveDetailTab("analysis");
                      }}
                      disabled={!activeAnalysis}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        !activeAnalysis 
                          ? "text-slate-350 cursor-not-allowed" 
                          : activeDetailTab === "analysis"
                          ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Final Exam Prediction
                    </button>

                    <button
                      onClick={() => {
                        if (!activeAnalysis) {
                          alert("Please analyze the final exam first to structure the course contents.");
                          return;
                        }
                        setActiveDetailTab("studyPlan");
                      }}
                      disabled={!activeAnalysis}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        !activeAnalysis 
                          ? "text-slate-350 cursor-not-allowed" 
                          : activeDetailTab === "studyPlan"
                          ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Cram Study Plan
                    </button>

                    <button
                      onClick={() => {
                        if (!activeAnalysis) {
                          alert("Please analyze the final exam first.");
                          return;
                        }
                        setActiveDetailTab("reviewWorkspace");
                      }}
                      disabled={!activeAnalysis}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                        !activeAnalysis 
                          ? "text-slate-350 cursor-not-allowed" 
                          : activeDetailTab === "reviewWorkspace"
                          ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
                      }`}
                    >
                      <BookMarked className="h-3.5 w-3.5" />
                      Interactive Review Tabs
                    </button>
                  </div>

                  {/* SUB-TAB 1: MATERIALS UPLOAD AND LIST */}
                  {activeDetailTab === "materials" && (
                    <div className="space-y-6 text-left">
                      
                      {/* Upload Box card trigger */}
                      <div className="quill-card p-6 border border-slate-250 bg-slate-50/40 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-bold text-sm text-slate-800">Add course syllabus, slides, or old tests</h3>
                          <p className="text-xs text-slate-450 leading-relaxed max-w-md">
                            Upload documents for this course. High-probability questions will map directly from these texts.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setUploadCourseId(activeCourseId);
                            setShowUploadModal(true);
                          }}
                          className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
                        >
                          Add Material File
                        </button>
                      </div>

                      {/* Material Actions & List */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Course Material Documents</h3>
                          
                          {/* Trigger AI Analysis Button */}
                          {courses.find(c => c.id === activeCourseId)?.material_count && (
                            <button
                              disabled={analyzingCourseId !== null}
                              onClick={() => triggerExamAnalysis(activeCourseId)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                                analyzingCourseId
                                  ? "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed"
                                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white shadow-md shadow-blue-500/10 cursor-pointer"
                              }`}
                            >
                              {analyzingCourseId ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  AI analyzing ({((activeCourse?.material_count || 1) > 1) ? "takes 2 mins" : "30s"})...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5" />
                                  {activeAnalysis ? "Re-Analyze Final Exam" : "Analyze Final Exam"}
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* List items */}
                        <MaterialList courseId={activeCourseId} reloadTrigger={loading} />
                      </div>

                    </div>
                  )}

                  {/* SUB-TAB 2: AI FINAL EXAM PREDICTION */}
                  {activeDetailTab === "analysis" && activeAnalysis && (
                    <ExamPredictionSection analysis={activeAnalysis} />
                  )}

                  {/* SUB-TAB 3: CRAM STUDY PLAN */}
                  {activeDetailTab === "studyPlan" && activeAnalysis && (
                    <div className="space-y-6">
                      
                      {/* Configuration header bar */}
                      <div className="quill-card p-5 border border-slate-200 bg-slate-50/50 rounded-2xl flex flex-wrap gap-4 items-end text-xs text-left">
                        
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Days Left</label>
                          <input
                            type="number"
                            min={1}
                            value={activeCourse ? getDaysRemaining(activeCourse.exam_date) : 5}
                            disabled
                            className="w-16 bg-slate-200 border border-slate-300 rounded-lg p-1.5 text-center font-mono font-bold text-slate-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Target Score</label>
                          <select
                            value={activeCourse?.target_score || "60%"}
                            onChange={async (e) => {
                              const updated = await fetch(`/api/courses`, {
                                method: "POST", // In route we can handle custom pathing or just POST updates
                              });
                              // Let's directly update the database course field first
                              setCourses(prev => prev.map(c => c.id === activeCourseId ? { ...c, target_score: e.target.value } : c));
                            }}
                            className="bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-slate-700 focus:outline-none"
                          >
                            <option value="50%">50% (Pass Level)</option>
                            <option value="60%">60% (Comfortable Pass)</option>
                            <option value="70%">70% (B Grade Target)</option>
                            <option value="80%+">80%+ (High Score/A Target)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Daily Hours</label>
                          <select
                            value={activeCourse?.daily_available_hours || 2}
                            onChange={(e) => {
                              setCourses(prev => prev.map(c => c.id === activeCourseId ? { ...c, daily_available_hours: Number(e.target.value) } : c));
                            }}
                            className="bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-slate-700 focus:outline-none"
                          >
                            <option value={1}>1 hour/day</option>
                            <option value={2}>2 hours/day</option>
                            <option value={3}>3 hours/day</option>
                            <option value={4}>4 hours/day</option>
                            <option value={6}>6 hours/day</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-400 block">Base Assessment</label>
                          <select
                            value={activeCourse?.current_level || "average"}
                            onChange={(e) => {
                              setCourses(prev => prev.map(c => c.id === activeCourseId ? { ...c, current_level: e.target.value } : c));
                            }}
                            className="bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-slate-700 focus:outline-none"
                          >
                            <option value="weak">Weak Base (Needs Focus)</option>
                            <option value="average">Average Base</option>
                            <option value="strong">Strong Base</option>
                          </select>
                        </div>

                        <button
                          disabled={planningCourseId !== null}
                          onClick={() => triggerStudyPlan(activeCourseId, true)}
                          className={`px-4.5 py-2.5 font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ml-auto ${
                            planningCourseId
                              ? "bg-slate-100 border border-slate-200 text-slate-450 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {planningCourseId ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Re-planning...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3.5 w-3.5" />
                              Update & Plan Study
                            </>
                          )}
                        </button>
                      </div>

                      {/* StudyPlan component renderer */}
                      {activePlan ? (
                        <StudyPlanSection 
                          courseId={activeCourseId} 
                          planJson={activePlan.plan_json}
                          loading={planningCourseId !== null}
                          onRegenerate={() => triggerStudyPlan(activeCourseId, true)}
                        />
                      ) : (
                        <div className="p-8 text-center border border-slate-200 bg-white rounded-2xl space-y-4">
                          <div className="mx-auto w-10 h-10 rounded-full bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center">
                            <Calendar className="h-4.5 w-4.5 animate-float" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-800">Generate Study Plan Checklist</h4>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">
                              No study plan compiled yet. Click generating to map out a day-by-day checklist based on your target score.
                            </p>
                          </div>
                          <button
                            disabled={planningCourseId !== null}
                            onClick={() => triggerStudyPlan(activeCourseId)}
                            className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md cursor-pointer"
                          >
                            {planningCourseId ? "Planning..." : "Generate Study Plan"}
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                  {/* SUB-TAB 4: REUSABLE REVIEW WORKSPACE TABS */}
                  {activeDetailTab === "reviewWorkspace" && parsedWorkspace && (
                    <div className="space-y-5 text-left">
                      
                      {/* Workspace tabs navigator */}
                      <div className="flex flex-wrap border-b border-slate-200 text-xs font-semibold text-slate-450 gap-2 mb-4">
                        {[
                          { id: "courseMap", label: "Course Map" },
                          { id: "keyConcepts", label: "Key Concepts" },
                          { id: "activeRecall", label: "Active Recall" },
                          { id: "quiz", label: "Practice Quiz" },
                          { id: "flashcards", label: "Flashcards" },
                          { id: "weakSpots", label: "Weak Spots" }
                        ].map((wTab) => (
                          <button
                            key={wTab.id}
                            onClick={() => {
                              setActiveWorkspaceTab(wTab.id as any);
                              // Reset game indices
                              setCurrentQuizIndex(0);
                              setSelectedOption(null);
                              setQuizSubmitted(false);
                              setQuizScore(0);
                              setQuizComplete(false);
                              setCurrentCardIdx(0);
                              setIsFlipped(false);
                            }}
                            className={`pb-2 px-1 border-b-2 transition-all cursor-pointer ${
                              activeWorkspaceTab === wTab.id
                                ? "border-blue-600 text-blue-600 font-bold"
                                : "border-transparent hover:text-slate-700 hover:border-slate-300"
                            }`}
                          >
                            {wTab.label}
                          </button>
                        ))}
                      </div>

                      {/* Course Map Workspace */}
                      {activeWorkspaceTab === "courseMap" && (
                        <div className="grid gap-3">
                          {parsedWorkspace.courseMap.map((item: any, idx: number) => (
                            <div key={idx} className="quill-card p-4 border border-slate-200 bg-white rounded-xl flex items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.2 rounded bg-blue-50 border border-blue-100 text-[9px] font-bold text-blue-600 uppercase font-mono">
                                    {item.week || `Section ${idx + 1}`}
                                  </span>
                                  <h4 className="font-bold text-slate-800 text-xs">{item.topic}</h4>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.concepts?.map((c: string, cIdx: number) => (
                                    <span key={cIdx} className="px-2 py-0.5 rounded text-[9px] font-medium bg-slate-100 border border-slate-150 text-slate-500">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-[9px] font-bold text-slate-400 block">WEIGHT</span>
                                <span className="font-bold text-slate-705 text-xs font-mono">{item.weight || "N/A"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Key Concepts Workspace */}
                      {activeWorkspaceTab === "keyConcepts" && (
                        <div className="grid md:grid-cols-2 gap-4">
                          {parsedWorkspace.definitions.map((def: any, idx: number) => (
                            <div key={idx} className="quill-card p-4.5 border border-slate-200 bg-white rounded-xl flex flex-col justify-between space-y-3">
                              <div>
                                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 mb-2">
                                  <h4 className="font-bold text-blue-600 text-xs">{def.term}</h4>
                                  <span className="text-[9px] font-mono text-slate-400">Ref: {def.source}</span>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">{def.definition}</p>
                              </div>
                              {def.formula && (
                                <div className="bg-slate-50 p-2 border border-slate-150 font-mono text-[9px] text-blue-650 rounded break-all">
                                  {def.formula}
                                </div>
                              )}
                              {def.confusionPoint && (
                                <div className="text-[10px] text-rose-600 bg-rose-50/50 p-2 rounded border border-rose-100">
                                  <strong>Watch out: </strong>{def.confusionPoint}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Active Recall Workspace */}
                      {activeWorkspaceTab === "activeRecall" && (
                        <div className="space-y-2.5">
                          {parsedWorkspace.activeRecall.map((item: any, idx: number) => {
                            const isMastered = masteredRecall[idx] || false;
                            const isRevealed = revealedRecall[idx] || false;

                            return (
                              <div key={idx} className={`border rounded-xl transition-all ${isMastered ? "bg-emerald-50/10 border-emerald-250 opacity-80" : "bg-white border-slate-200"}`}>
                                <div 
                                  onClick={() => setRevealedRecall(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                  className="flex items-center justify-between p-3.5 cursor-pointer"
                                >
                                  <div className="flex items-center gap-3 min-w-0 pr-2">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setMasteredRecall(prev => ({ ...prev, [idx]: !prev[idx] }));
                                      }}
                                      className={`p-0.5 rounded text-slate-450 ${isMastered ? "text-emerald-600" : ""}`}
                                    >
                                      {isMastered ? <CheckSquare className="h-4.5 w-4.5" /> : <Square className="h-4.5 w-4.5" />}
                                    </button>
                                    <h4 className="text-xs font-bold text-slate-800 truncate">{item.question}</h4>
                                  </div>
                                  <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isRevealed ? "rotate-90" : ""}`} />
                                </div>
                                {isRevealed && (
                                  <div className="px-10 pb-4 pt-1.5 border-t border-slate-100 space-y-2.5 text-xs">
                                    <p className="text-slate-400 italic">Clue: {item.hint}</p>
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                                      {item.answer}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Practice Quiz Workspace */}
                      {activeWorkspaceTab === "quiz" && (
                        <div className="max-w-xl mx-auto space-y-4">
                          {parsedWorkspace.quiz.length === 0 ? (
                            <p className="text-center text-xs text-slate-400">No quiz questions generated.</p>
                          ) : !quizComplete ? (
                            <div className="quill-card p-5 border border-slate-200 bg-white rounded-xl space-y-4">
                              <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                                <span className="font-bold text-slate-400">Question {currentQuizIndex + 1} of {parsedWorkspace.quiz.length}</span>
                                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Score: {quizScore}</span>
                              </div>

                              <h3 className="font-bold text-slate-800 text-sm leading-relaxed">{parsedWorkspace.quiz[currentQuizIndex].question}</h3>

                              <div className="space-y-2">
                                {parsedWorkspace.quiz[currentQuizIndex].options?.map((opt: string, optIdx: number) => {
                                  const isSelected = selectedOption === optIdx;
                                  const isCorrect = optIdx === parsedWorkspace.quiz[currentQuizIndex].correctAnswer;
                                  let style = "bg-white border-slate-200 hover:bg-slate-50";

                                  if (quizSubmitted) {
                                    if (isCorrect) style = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
                                    else if (isSelected) style = "bg-rose-50 border-rose-300 text-rose-800 font-bold";
                                    else style = "opacity-60 bg-slate-50/50";
                                  } else if (isSelected) {
                                    style = "bg-blue-50 border-blue-400 text-blue-800 font-bold";
                                  }

                                  return (
                                    <button
                                      key={optIdx}
                                      disabled={quizSubmitted}
                                      onClick={() => setSelectedOption(optIdx)}
                                      className={`w-full text-left p-3 rounded-lg border text-xs transition-colors cursor-pointer ${style}`}
                                    >
                                      {String.fromCharCode(65 + optIdx)}. {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="flex justify-end pt-2 border-t border-slate-100">
                                {!quizSubmitted ? (
                                  <button
                                    disabled={selectedOption === null}
                                    onClick={() => setQuizSubmitted(true)}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    Submit Answer
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedOption(null);
                                      setQuizSubmitted(false);
                                      if (currentQuizIndex + 1 < parsedWorkspace.quiz.length) {
                                        setCurrentQuizIndex(prev => prev + 1);
                                      } else {
                                        setQuizComplete(true);
                                      }
                                    }}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    Next Question →
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="quill-card p-6 border border-slate-200 bg-white rounded-xl text-center space-y-4">
                              <Award className="h-10 w-10 text-blue-600 mx-auto" />
                              <h4 className="font-bold text-slate-800 text-sm">Practice Quiz Complete</h4>
                              <p className="text-xs text-slate-500">You scored {quizScore} out of {parsedWorkspace.quiz.length} correctly!</p>
                              <button
                                onClick={() => {
                                  setCurrentQuizIndex(0);
                                  setSelectedOption(null);
                                  setQuizSubmitted(false);
                                  setQuizScore(0);
                                  setQuizComplete(false);
                                }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                              >
                                Re-take Quiz
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Flashcards Workspace */}
                      {activeWorkspaceTab === "flashcards" && (
                        <div className="max-w-md mx-auto space-y-4 text-center">
                          {parsedWorkspace.definitions.length === 0 ? (
                            <p className="text-xs text-slate-400">No definitions found.</p>
                          ) : (
                            <>
                              <div className="relative w-full h-48 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                                <div className={`w-full h-full p-6 border border-slate-200 bg-white rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative shadow-sm ${isFlipped ? "rotate-y-18 rotate-180" : ""}`}>
                                  {!isFlipped ? (
                                    <div className="space-y-2">
                                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block">Concept term</span>
                                      <h3 className="font-extrabold text-slate-850 text-sm">{parsedWorkspace.definitions[currentCardIdx].term}</h3>
                                      <span className="text-[9px] text-slate-400 absolute bottom-3">Click to Flip card</span>
                                    </div>
                                  ) : (
                                    <div className="space-y-2 transform -scale-x-100 select-text">
                                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block">Explanation</span>
                                      <p className="text-xs text-slate-650 leading-relaxed max-w-xs">{parsedWorkspace.definitions[currentCardIdx].definition}</p>
                                      {parsedWorkspace.definitions[currentCardIdx].formula && (
                                        <code className="text-[9px] p-1 bg-slate-50 border border-slate-150 font-mono rounded block">{parsedWorkspace.definitions[currentCardIdx].formula}</code>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-between items-center max-w-xs mx-auto">
                                <button
                                  onClick={() => {
                                    setIsFlipped(false);
                                    setTimeout(() => {
                                      setCurrentCardIdx(prev => (prev - 1 + parsedWorkspace.definitions.length) % parsedWorkspace.definitions.length);
                                    }, 100);
                                  }}
                                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  ← Prev
                                </button>
                                <span className="text-xs font-bold text-slate-400">{currentCardIdx + 1} of {parsedWorkspace.definitions.length}</span>
                                <button
                                  onClick={() => {
                                    setIsFlipped(false);
                                    setTimeout(() => {
                                      setCurrentCardIdx(prev => (prev + 1) % parsedWorkspace.definitions.length);
                                    }, 100);
                                  }}
                                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Next →
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Weak Spots Workspace */}
                      {activeWorkspaceTab === "weakSpots" && (
                        <div className="grid gap-3">
                          {parsedWorkspace.weakSpots.map((item: any, idx: number) => (
                            <div key={idx} className="quill-card p-4.5 border border-l-4 border-l-rose-500 border-slate-200 bg-white rounded-xl text-xs space-y-2">
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                                <h4 className="font-extrabold text-slate-800">{item.concept}</h4>
                                <span className="text-[9px] text-slate-400">Ref: {item.source}</span>
                              </div>
                              <p className="text-slate-600"><strong>Missing Coverage: </strong>{item.coverage}</p>
                              <p className="text-rose-600 bg-rose-50/50 p-2 rounded border border-rose-100"><strong>Recommended action: </strong>{item.action}</p>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  )}

                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="print:hidden border-t border-slate-200 bg-slate-50/40 py-8 px-4 text-center text-xs text-slate-400 space-y-1 mt-12">
        <p>© 2026 CoursePack AI. Built for international & university students.</p>
        <p className="text-[10px] text-slate-400/80 font-medium">All student uploads are encrypted and processed privately via Google Gemini SDK.</p>
      </footer>

      {/* ==========================================================
          MODAL A: ADD COURSE MODAL
          ========================================================== */}
      {showAddCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleAddCourseSubmit} className="quill-card rounded-2xl border border-slate-250 w-full max-w-lg p-5 md:p-6 space-y-4 bg-white shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-blue-600" />
                Add New Study Course
              </h3>
              <button type="button" onClick={() => setShowAddCourse(false)} className="text-slate-400 hover:text-slate-650 text-xs font-semibold px-2">✕</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Microeconomics"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3 py-2 text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ECON 101"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3 py-2 text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">University / School</label>
                <input
                  type="text"
                  placeholder="e.g. University of Waterloo"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3 py-2 text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Program / Major</label>
                <input
                  type="text"
                  placeholder="e.g. Honours Mathematics"
                  value={newProgramName}
                  onChange={(e) => setNewProgramName(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3 py-2 text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Exam Date</label>
                <input
                  type="date"
                  required
                  value={newExamDate}
                  onChange={(e) => setNewExamDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3 py-2 text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Target Score</label>
                <select
                  value={newTargetScore}
                  onChange={(e) => setNewTargetScore(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none rounded-xl px-3 py-2 text-slate-700"
                >
                  <option value="50%">50% (Pass Level)</option>
                  <option value="60%">60% (Comfortable Pass)</option>
                  <option value="70%">70% (B Grade Target)</option>
                  <option value="80%+">80%+ (High Score/A Target)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Daily Study Time</label>
                <select
                  value={newDailyHours}
                  onChange={(e) => setNewDailyHours(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none rounded-xl px-3 py-2 text-slate-700"
                >
                  <option value="1">1 hour/day</option>
                  <option value="2">2 hours/day</option>
                  <option value="3">3 hours/day</option>
                  <option value="4">4 hours/day</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Base Assessment</label>
                <select
                  value={newBaseLevel}
                  onChange={(e) => setNewBaseLevel(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none rounded-xl px-3 py-2 text-slate-700"
                >
                  <option value="weak">Weak Base (Needs Focus)</option>
                  <option value="average">Average Base</option>
                  <option value="strong">Strong Base</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button type="button" onClick={() => setShowAddCourse(false)} className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer">Add Course</button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================================
          MODAL B: UPLOAD MATERIAL MODAL
          ========================================================== */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleUploadSubmit} className="quill-card rounded-2xl border border-slate-250 w-full max-w-lg p-5 md:p-6 space-y-4 bg-white shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-blue-600" />
                Upload Course Study Material
              </h3>
              <button type="button" onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-650 text-xs font-semibold px-2">✕</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Select Course</label>
                <select
                  value={uploadCourseId}
                  onChange={(e) => setUploadCourseId(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none rounded-xl px-3 py-2 text-slate-700"
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.course_code}: {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Material Class</label>
                <select
                  value={uploadMaterialType}
                  onChange={(e) => setUploadMaterialType(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:outline-none rounded-xl px-3 py-2 text-slate-700"
                >
                  <option value="Homework">Daily Homework</option>
                  <option value="Quiz">Quiz File</option>
                  <option value="Midterm">Midterm Exam</option>
                  <option value="Final Exam">Past Final Exam</option>
                  <option value="Lecture Notes">Lecture Notes / Slides</option>
                  <option value="Practice Questions">Practice Questions</option>
                  <option value="Other">Other Reference</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Document Files</label>
              <FileUploader 
                onFilesProcessed={handleFilesProcessed}
                onReset={() => {
                  setUploadFileText("");
                  setUploadFileList([]);
                }}
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button 
                type="button" 
                onClick={() => {
                  setUploadFileText("");
                  setUploadFileList([]);
                  setShowUploadModal(false);
                }} 
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={uploadLoading || uploadFileList.length === 0}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-semibold cursor-pointer"
              >
                {uploadLoading ? "Uploading..." : "Save Material"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================================
          MODAL C: API KEY SETTINGS MODAL
          ========================================================== */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="quill-card rounded-2xl border border-slate-250 w-full max-w-md p-5 bg-white shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Key className="h-4.5 w-4.5 text-blue-600" />
                Gemini API Key Credentials
              </h3>
              <button type="button" onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-650 text-xs font-semibold px-2">✕</button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-500">
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
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2 text-slate-705 font-mono"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex items-start gap-2 text-[10px] text-slate-400 leading-normal">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p>
                  Get a free key by logging into <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a> with any Gmail account and clicking "Create API Key".
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              {savedKey ? (
                <button
                  type="button"
                  onClick={handleRemoveKey}
                  className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
                >
                  Clear Config
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                >
                  Save Config
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// -------------------------------------------------------------
// HELPER COMPONENT: MATERIAL LIST
// -------------------------------------------------------------
interface MaterialListProps {
  courseId: string;
  reloadTrigger: boolean;
}

function MaterialList({ courseId, reloadTrigger }: MaterialListProps) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/courses/${courseId}/materials`);
        if (response.ok) {
          const data = await response.json();
          setMaterials(data.materials || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [courseId, reloadTrigger]);

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("Remove this document?")) return;
    try {
      const response = await fetch(`/api/courses/${courseId}/materials?materialId=${id}`, {
        method: "DELETE" // Wait, we can implement local Db deletion directly
      });
      // In db.ts deleteMaterial is implemented. Let's make an API route or delete directly.
      const res = await fetch(`/api/materials/upload?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setMaterials(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <p className="text-xs text-slate-400 text-center py-4">Loading materials...</p>;
  }

  if (materials.length === 0) {
    return (
      <div className="p-8 text-center border border-slate-200 bg-white rounded-2xl text-xs text-slate-400">
        No documents uploaded for this course yet.
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      {materials.map((mat) => {
        const typeColors = (({
          Homework: "bg-blue-50 border-blue-100 text-blue-600",
          Quiz: "bg-indigo-50 border-indigo-100 text-indigo-600",
          Midterm: "bg-amber-50 border-amber-100 text-amber-600",
          "Final Exam": "bg-rose-50 border-rose-100 text-rose-600",
          "Lecture Notes": "bg-emerald-50 border-emerald-100 text-emerald-600",
          "Practice Questions": "bg-purple-50 border-purple-100 text-purple-600",
          Other: "bg-slate-50 border-slate-100 text-slate-600"
        } as Record<string, string>)[mat.material_type]) || "bg-slate-50 border-slate-100 text-slate-600";

        return (
          <div key={mat.id} className="p-3 border border-slate-200 bg-white rounded-xl flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`p-2 rounded-lg ${typeColors} border shrink-0`}>
                <FileText className="h-4.5 w-4.5" />
              </div>

              <div className="min-w-0 text-left">
                <h4 className="font-bold text-slate-800 truncate pr-2">{mat.name}</h4>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-450 font-mono">
                  <span>{(mat.size / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span>{mat.word_count || 0} words</span>
                  <span>•</span>
                  <span>Type: {mat.material_type}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDeleteMaterial(mat.id)}
              className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-50 cursor-pointer"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
