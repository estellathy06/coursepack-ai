"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Key, Sparkles, AlertCircle, FileText, ArrowRight, 
  HelpCircle, Mail, Check, ShieldCheck, Zap, Star,
  BookOpen, Target, Calendar, ListTodo, Layers,
  ChevronRight, Award, Lock, Loader2, BrainCircuit,
  Plus, ArrowLeft, Trash2, RefreshCw, BookMarked, Settings, Info, BarChart2,
  CheckSquare, Square, Home, User, GraduationCap, CheckCircle
} from "lucide-react";
import FileUploader from "@/components/FileUploader";
import ExamPredictionSection from "@/components/ExamPredictionSection";
import StudyPlanSection from "@/components/StudyPlanSection";
import { calculateSchedule, ScheduledCourse } from "@/utils/scheduler";
import { Course, School, Program, CourseAnalysis, StudyPlan } from "@/utils/db";
import { demoStudyPacks } from "@/utils/demoData";
import confetti from "canvas-confetti";

type NavTab = 'home' | 'dashboard' | 'courses' | 'upload' | 'analysis' | 'studyPlan' | 'progress' | 'account';

export default function Page() {
  // Navigation State
  const [currentNavTab, setCurrentNavTab] = useState<NavTab>('home');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
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
  
  // Modals / Input states
  const [showSettings, setShowSettings] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
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

  const generatorRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

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

    // Setup daily hours limit
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

      // Pre-select first course if none is active
      if (data.courses && data.courses.length > 0 && !activeCourseId) {
        setActiveCourseId(data.courses[0].id);
        setUploadCourseId(data.courses[0].id);
      }

    } catch (err: any) {
      console.error(err);
      setGenerationError("Failed to fetch dashboard data.");
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
      await loadDashboardData(userId);
      setCurrentNavTab('courses');
    } catch (err: any) {
      alert(`Error creating course: ${err.message}`);
    }
  };

  // 3. Delete Course
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course and all of its materials?")) return;
    try {
      const response = await fetch(`/api/courses?userId=${userId}&courseId=${courseId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setActiveCourseId(null);
        await loadDashboardData(userId);
        setCurrentNavTab('courses');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. File upload
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
      confetti({ particleCount: 30, colors: ["#10b981", "#60a5fa"] });
      
      await loadDashboardData(userId);
      setCurrentNavTab('courses');
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
      setCurrentNavTab('analysis');
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
      setCurrentNavTab('studyPlan');
      confetti({ particleCount: 50, spread: 60, colors: ["#2563eb", "#60a5fa"] });
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Gemini AI study plan generation failed.");
    } finally {
      setPlanningCourseId(null);
    }
  };

  // Load Demo Templates
  const handleLoadDemo = async (key: "CS136" | "MATH137" | "ECON101") => {
    setLoading(true);
    try {
      const demo = demoStudyPacks[key];
      if (!demo) return;

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
      
      confetti({ particleCount: 60 });
      await loadDashboardData(userId);
      setActiveCourseId(courseId);
      setUploadCourseId(courseId);
      setCurrentNavTab('courses');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      triggerMockPayment(planType === "single" ? "Single Exam Pack" : "Semester Pass", planType === "single" ? "$5.99" : "$12.99");
      setCheckoutLoading(false);
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
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 font-sans text-slate-650 antialiased">
      
      {/* Finals Specialty Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 text-white text-center py-2 px-4 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm print:hidden">
        <Sparkles className="h-3.5 w-3.5 animate-pulse shrink-0 text-white" />
        <span>Finals Week Cram Planner: Upload materials, estimate probabilities, and prioritize study time!</span>
      </div>

      {/* Navigation Header */}
      <header className="print:hidden border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-3.5 flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentNavTab('home')}>
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-base shadow-sm">
            CP
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-slate-800">CoursePack AI</span>
            <span className="text-[9px] block text-blue-600 font-semibold uppercase tracking-wider font-mono leading-none mt-0.5">Cram Planner</span>
          </div>
        </div>

        {/* Dynamic Nav Tabs */}
        <nav className="flex items-center gap-1.5 md:gap-3.5 text-xs font-bold text-slate-500">
          <button
            onClick={() => setCurrentNavTab('home')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentNavTab === 'home' ? "text-blue-600 bg-blue-50" : "hover:text-blue-600"}`}
            title="Home"
          >
            <Home className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setCurrentNavTab('dashboard')}
            className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${currentNavTab === 'dashboard' ? "text-blue-600 bg-blue-50" : "hover:text-blue-600"}`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setCurrentNavTab('courses')}
            className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${currentNavTab === 'courses' ? "text-blue-600 bg-blue-50" : "hover:text-blue-600"}`}
          >
            Courses
          </button>

          <button
            onClick={() => setCurrentNavTab('upload')}
            className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${currentNavTab === 'upload' ? "text-blue-600 bg-blue-50" : "hover:text-blue-600"}`}
          >
            Upload
          </button>

          <button
            onClick={() => {
              if (!activeCourseId) {
                alert("Please create a course first.");
                return;
              }
              setCurrentNavTab('analysis');
            }}
            className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${currentNavTab === 'analysis' ? "text-blue-600 bg-blue-50" : "hover:text-blue-600"}`}
          >
            Exam Prediction
          </button>

          <button
            onClick={() => {
              if (!activeCourseId) {
                alert("Please create a course first.");
                return;
              }
              setCurrentNavTab('studyPlan');
            }}
            className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${currentNavTab === 'studyPlan' ? "text-blue-600 bg-blue-50" : "hover:text-blue-600"}`}
          >
            Study Plan
          </button>

          <button
            onClick={() => setCurrentNavTab('progress')}
            className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${currentNavTab === 'progress' ? "text-blue-600 bg-blue-50" : "hover:text-blue-600"}`}
          >
            Progress
          </button>

          <button
            onClick={() => setCurrentNavTab('account')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentNavTab === 'account' ? "text-blue-600 bg-blue-50" : "hover:text-blue-600"}`}
            title="Account"
          >
            <User className="h-4 w-4" />
          </button>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8">
        
        {loading ? (
          <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-xs text-slate-400">Loading your profile planner...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {generationError && (
              <div className="p-4 rounded-xl border border-rose-150 bg-rose-50 text-rose-800 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                  <span>{generationError}</span>
                </div>
                <button onClick={() => setGenerationError(null)} className="text-rose-500 hover:text-rose-800">✕</button>
              </div>
            )}

            {/* ========================================================
                TAB 1: HOME (LANDING PAGE)
                ======================================================== */}
            {currentNavTab === 'home' && (
              <div className="space-y-12">
                
                {/* Hero Header */}
                <section className="relative overflow-hidden py-10 text-center space-y-6 max-w-3xl mx-auto">
                  <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs bg-blue-50 border border-blue-100 text-blue-600 font-bold uppercase tracking-wider font-mono">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>AI Study Pack & Cram Planner</span>
                  </div>

                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                    Turn your course files into a complete <span className="text-blue-600">exam study pack</span>
                  </h1>

                  <p className="text-base text-slate-500 max-w-xl mx-auto leading-relaxed">
                    Upload your syllabus, lecture slides, notes, or rubrics. Get a structured daily study plan, active recall questions, and interactive quizzes tailored to your target scores.
                  </p>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setCurrentNavTab('courses')}
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      Get Started
                    </button>
                    <button
                      onClick={() => handleLoadDemo("CS136")}
                      className="px-6 py-3 rounded-xl bg-white border border-slate-250 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Explore CS 136 Demo
                    </button>
                  </div>
                </section>

                {/* Features Section */}
                <section className="grid md:grid-cols-3 gap-6">
                  <div className="quill-card rounded-2xl p-6 border border-slate-200 bg-white space-y-3 shadow-sm text-left">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                      <Target className="h-4.5 w-4.5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">Source-Grounded Priority</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      AI analyzes your uploaded files and notes to identify the highest probability exam topics based on syllabus weights and homework repeated concepts.
                    </p>
                  </div>

                  <div className="quill-card rounded-2xl p-6 border border-slate-200 bg-white space-y-3 shadow-sm text-left">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                      <BrainCircuit className="h-4.5 w-4.5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">Active Recall Engine</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Automatically structures key vocabulary flashcards, recursive active recall testing, and multiple choice mock games.
                    </p>
                  </div>

                  <div className="quill-card rounded-2xl p-6 border border-slate-200 bg-white space-y-3 shadow-sm text-left">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800">Countdown Cram Planner</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Generates a day-by-day checklist that adjusts dynamically. Targets a 50% pass priority vs a 70%+ high score checklist.
                    </p>
                  </div>
                </section>

                {/* Pricing Sections */}
                <section className="py-8 border-t border-slate-200 space-y-10">
                  <div className="text-center space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Pricing Plans</h3>
                    <h2 className="text-2xl font-extrabold text-slate-900">Premium study options on any budget</h2>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <div className="quill-card rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-6 bg-white shadow-sm text-left">
                      <div className="space-y-3.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Trial Pack</span>
                        <h4 className="text-base font-bold text-slate-800">Template Demos</h4>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-slate-800">$0</span>
                          <span className="text-slate-400 text-xs">Free</span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-500">
                          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500" /> Full access to sample courses</li>
                          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500" /> 3D Flashcards & Recall tabs</li>
                        </ul>
                      </div>
                      <button
                        onClick={() => handleLoadDemo("CS136")}
                        className="w-full py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 cursor-pointer"
                      >
                        Try CS 136 Free
                      </button>
                    </div>

                    <div className="quill-card rounded-2xl p-6 border-2 border-blue-500 flex flex-col justify-between space-y-6 bg-white shadow-md text-left">
                      <div className="space-y-3.5">
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block">Standard</span>
                        <h4 className="text-base font-bold text-slate-800">Single Exam Pack</h4>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-slate-800">$5.99</span>
                          <span className="text-slate-400 text-xs">per course</span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-600">
                          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600" /> Upload custom slide and notes</li>
                          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600" /> Custom 7-day study cram checklist</li>
                          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-600" /> Final exam probability predictions</li>
                        </ul>
                      </div>
                      <button
                        disabled={checkoutLoading}
                        onClick={() => triggerStripeCheckout("single")}
                        className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        Unlock Custom Course
                      </button>
                    </div>

                    <div className="quill-card rounded-2xl p-6 border border-slate-200 flex flex-col justify-between space-y-6 bg-white shadow-sm text-left">
                      <div className="space-y-3.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Semester bundle</span>
                        <h4 className="text-base font-bold text-slate-800">Semester Pass</h4>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-slate-800">$12.99</span>
                          <span className="text-slate-400 text-xs">/ month</span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-500">
                          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500" /> Manage up to 5 courses simultaneously</li>
                          <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-blue-500" /> Priority fast-lane AI generations</li>
                        </ul>
                      </div>
                      <button
                        disabled={checkoutLoading}
                        onClick={() => triggerStripeCheckout("semester")}
                        className="w-full py-2 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 cursor-pointer"
                      >
                        Buy Semester Pass
                      </button>
                    </div>
                  </div>
                </section>

                {/* Waitlist Capture */}
                <section className="quill-card rounded-2xl p-8 border border-slate-200 bg-white text-center shadow-sm">
                  <div className="max-w-xl mx-auto space-y-4">
                    <h3 className="text-base font-bold text-slate-850">
                      Unlock free packages for study groups and tutor cohorts
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      We offer campus packages for study groups. Join our waitlist using your student email to claim 3 free credits.
                    </p>

                    {!waitlistSubmitted ? (
                      <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
                        <input
                          type="email"
                          required
                          placeholder="student@university.edu"
                          value={waitlistEmail}
                          onChange={(e) => setWaitlistEmail(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-slate-700"
                        />
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer shrink-0"
                        >
                          Join Waitlist
                        </button>
                      </form>
                    ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl max-w-xs mx-auto flex items-center gap-2 justify-center">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>Waitlist registered! Position: #{waitlistCount}</span>
                      </div>
                    )}
                  </div>
                </section>

              </div>
            )}

            {/* ========================================================
                TAB 2: DASHBOARD (STUDY CALENDAR & TIME ALLOCATIONS)
                ======================================================== */}
            {currentNavTab === 'dashboard' && (
              <div className="space-y-6 text-left">
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Today's Study Schedule</h2>
                  <p className="text-xs text-slate-400">
                    Recommended daily study allocations calculated dynamically based on priority score parameters.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  
                  {/* Priority slots allocation */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Time Partition Recommendation</h3>
                        <span className="text-xs font-bold text-blue-600 font-mono">Total Budget: {dailyHoursLimit} hrs/day</span>
                      </div>

                      {courses.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-6">Create courses to compute allocations.</p>
                      ) : (
                        <div className="space-y-4">
                          {scheduledCourses.map(({ course, priorityScore, priorityLabel, allocatedHours, daysRemaining }) => (
                            <div key={course.id} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 uppercase">
                                    {course.course_code}
                                  </span>
                                  <h4 className="font-extrabold text-slate-800 text-xs">{course.name}</h4>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <span>Priority Score: {priorityScore}</span>
                                  <span>•</span>
                                  <span>{daysRemaining === -1 ? "Finished" : daysRemaining === 0 ? "Exam Today!" : `${daysRemaining} days remaining`}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 w-full sm:w-auto justify-between border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 shrink-0">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border tracking-wider ${
                                  priorityLabel === 'Critical' ? "bg-rose-50 border-rose-200 text-rose-600" :
                                  priorityLabel === 'High' ? "bg-amber-50 border-amber-250 text-amber-600" :
                                  "bg-blue-50 border-blue-200 text-blue-600"
                                }`}>
                                  {priorityLabel}
                                </span>
                                
                                <div className="text-right">
                                  <span className="text-[9px] font-bold text-slate-400 block">ALLOTMENT</span>
                                  <span className="font-mono font-bold text-blue-600 text-sm">{allocatedHours} hrs</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Study Recommendations sidebar */}
                  <div className="md:col-span-1 space-y-4">
                    
                    {/* Budget Adjuster */}
                    <div className="quill-card p-4.5 border border-slate-200 bg-white rounded-2xl space-y-3 shadow-sm">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Adjust Daily Budget</h4>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          max={24}
                          value={dailyHoursLimit}
                          onChange={handleHoursLimitChange}
                          className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none"
                        />
                        <span className="text-xs text-slate-450">hours available / day</span>
                      </div>
                    </div>

                    {/* Quick Advice card */}
                    <div className="quill-card p-4.5 border border-slate-200 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl text-white space-y-2">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-4.5 w-4.5 text-yellow-300" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">AI Cram Tip</h4>
                      </div>
                      <p className="text-[11px] leading-relaxed text-blue-100">
                        {courses.length === 0 
                          ? "Add your courses and upload syallbus slides. The scheduling engine will partition your calendar automatically."
                          : "Focus first on courses marked Critical or High priority. Review homework quizzes before attempting full mock exams."
                        }
                      </p>
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* ========================================================
                TAB 3: COURSES LIST
                ======================================================== */}
            {currentNavTab === 'courses' && (
              <div className="space-y-6 text-left">
                
                {/* Header */}
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Active Courses</h2>
                    <p className="text-xs text-slate-400">Manage uploaded guides and view dynamic progress targets.</p>
                  </div>
                  
                  <button
                    onClick={() => setShowAddCourse(true)}
                    className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add Course
                  </button>
                </div>

                {courses.length === 0 ? (
                  <div className="p-12 text-center border border-dashed border-slate-200 bg-white rounded-2xl space-y-4">
                    <BookOpen className="h-10 w-10 text-slate-350 mx-auto animate-float" />
                    <h3 className="text-sm font-bold text-slate-700">No courses listed</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">Create a course code (like ECON 101) to begin uploading notes.</p>
                    <button
                      onClick={() => setShowAddCourse(true)}
                      className="px-4.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Create Course
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course) => {
                      const daysRemaining = getDaysRemaining(course.exam_date);
                      const statusColors = {
                        "Not Started": "bg-slate-100 text-slate-500 border-slate-200",
                        "In Progress": "bg-amber-50 text-amber-600 border-amber-200",
                        "Ready": "bg-emerald-50 text-emerald-600 border-emerald-250"
                      }[course.review_status || "Not Started"];

                      return (
                        <div key={course.id} className="quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 rounded font-mono text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 uppercase">
                                {course.course_code}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${statusColors}`}>
                                {course.review_status}
                              </span>
                            </div>

                            <h3 className="font-bold text-slate-800 text-xs truncate">{course.name}</h3>
                            <p className="text-[10px] text-slate-400 truncate">{course.school_name} • {course.program_name}</p>

                            <div className="grid grid-cols-2 gap-2 border-t border-b border-slate-100 py-2 text-xs">
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Timeline</span>
                                <span className="font-semibold text-slate-700">{daysRemaining === -1 ? "Passed" : `${daysRemaining} days left`}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Target</span>
                                <span className="font-semibold text-slate-700">{course.target_score}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] text-slate-450 font-bold">{course.material_count || 0} files</span>
                            <button
                              onClick={() => {
                                setActiveCourseId(course.id);
                                setUploadCourseId(course.id);
                                setCurrentNavTab(course.review_status === 'Ready' ? 'analysis' : 'upload');
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold cursor-pointer"
                            >
                              Open Guide
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================
                TAB 4: UPLOAD MATERIALS
                ======================================================== */}
            {currentNavTab === 'upload' && (
              <div className="space-y-6 text-left max-w-xl mx-auto">
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">Upload Study Documents</h2>
                  <p className="text-xs text-slate-400">Classify files by type to map high-probability final questions.</p>
                </div>

                <form onSubmit={handleUploadSubmit} className="quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-4 shadow-sm">
                  
                  <div className="grid md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Target Course</label>
                      <select
                        value={uploadCourseId}
                        onChange={(e) => {
                          setUploadCourseId(e.target.value);
                          setActiveCourseId(e.target.value);
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none"
                      >
                        <option value="">-- Choose Course --</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>{c.course_code}: {c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Classification Type</label>
                      <select
                        value={uploadMaterialType}
                        onChange={(e) => setUploadMaterialType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none"
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
                    <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Add Study Files (.pdf, .docx, .txt)</label>
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
                      type="submit"
                      disabled={uploadLoading || uploadFileList.length === 0}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold cursor-pointer"
                    >
                      {uploadLoading ? "Uploading & Classifying..." : "Upload Material"}
                    </button>
                  </div>
                </form>

                {activeCourseId && (
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Staged Materials for {courses.find(c => c.id === activeCourseId)?.course_code}</h3>
                      {courses.find(c => c.id === activeCourseId)?.material_count && (
                        <button
                          disabled={analyzingCourseId !== null}
                          onClick={() => triggerExamAnalysis(activeCourseId)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                        >
                          {analyzingCourseId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                          Analyze Final Exam
                        </button>
                      )}
                    </div>
                    <MaterialList courseId={activeCourseId} reloadTrigger={loading} />
                  </div>
                )}

              </div>
            )}

            {/* ========================================================
                TAB 5: EXAM PREDICTION
                ======================================================== */}
            {currentNavTab === 'analysis' && (
              <div className="space-y-6 text-left">
                
                {/* Course Switcher */}
                <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold text-slate-450 uppercase">Active Course Profile:</span>
                  <select
                    value={activeCourseId || ""}
                    onChange={(e) => setActiveCourseId(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-705 focus:outline-none"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.course_code}: {c.name}</option>
                    ))}
                  </select>
                </div>

                {activeAnalysis ? (
                  <ExamPredictionSection analysis={activeAnalysis} />
                ) : (
                  <div className="p-12 text-center border border-slate-200 bg-white rounded-2xl space-y-4">
                    <Sparkles className="h-10 w-10 text-slate-300 mx-auto animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-700">Exam Predictions Unparsed</h3>
                    <p className="text-xs text-slate-450 max-w-xs mx-auto">Analyze the course study materials first using Gemini to generate predictive questions.</p>
                    <button
                      disabled={analyzingCourseId !== null}
                      onClick={() => activeCourseId && triggerExamAnalysis(activeCourseId)}
                      className="px-4.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
                    >
                      {analyzingCourseId ? "Analyzing..." : "Analyze Final Exam"}
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* ========================================================
                TAB 6: STUDY PLAN
                ======================================================== */}
            {currentNavTab === 'studyPlan' && (
              <div className="space-y-6 text-left">
                
                {/* Selector */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-450 uppercase">Active Course Profile:</span>
                    <select
                      value={activeCourseId || ""}
                      onChange={(e) => setActiveCourseId(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-705 focus:outline-none"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.course_code}: {c.name}</option>
                      ))}
                    </select>
                  </div>

                  {activeAnalysis && (
                    <div className="flex items-center gap-2 text-xs">
                      <select
                        value={activeCourse?.target_score || "60%"}
                        onChange={(e) => {
                          setCourses(prev => prev.map(c => c.id === activeCourseId ? { ...c, target_score: e.target.value } : c));
                        }}
                        className="bg-white border border-slate-200 rounded-lg p-1.5 font-bold focus:outline-none"
                      >
                        <option value="50%">50% Target</option>
                        <option value="60%">60% Target</option>
                        <option value="70%">70% Target</option>
                        <option value="80%+">80%+ Target</option>
                      </select>
                      
                      <button
                        disabled={planningCourseId !== null}
                        onClick={() => activeCourseId && triggerStudyPlan(activeCourseId, true)}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                      >
                        {planningCourseId ? "Planning..." : "Regenerate Plan"}
                      </button>
                    </div>
                  )}
                </div>

                {activePlan ? (
                  <StudyPlanSection 
                    courseId={activeCourseId || ""} 
                    planJson={activePlan.plan_json}
                    loading={planningCourseId !== null}
                    onRegenerate={() => activeCourseId && triggerStudyPlan(activeCourseId, true)}
                  />
                ) : (
                  <div className="p-12 text-center border border-slate-200 bg-white rounded-2xl space-y-4">
                    <Calendar className="h-10 w-10 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-750">Cram plan checklist ungenerated</h3>
                    <p className="text-xs text-slate-450 max-w-xs mx-auto">Generate a target study countdown plan based on remaining days and priorities.</p>
                    <button
                      disabled={planningCourseId !== null || !activeAnalysis}
                      onClick={() => activeCourseId && triggerStudyPlan(activeCourseId)}
                      className="px-4.5 py-2 bg-blue-600 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl"
                    >
                      {planningCourseId ? "Generating..." : "Generate Study Plan"}
                    </button>
                  </div>
                )}

              </div>
            )}

            {/* ========================================================
                TAB 7: PROGRESS (STUDENT CRAM SCOREMETRICS)
                ======================================================== */}
            {currentNavTab === 'progress' && (
              <div className="space-y-6 text-left">
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-lg font-black text-slate-805 tracking-tight">Student Study Progress</h2>
                  <p className="text-xs text-slate-400">Track active recall mastery, mock quiz averages, and task checklists completions.</p>
                </div>

                {courses.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-10">Add courses and complete daily checklists to track metrics.</p>
                ) : (
                  <div className="grid md:grid-cols-3 gap-6">
                    
                    {/* Checklists progress */}
                    <div className="quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-4 shadow-sm">
                      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <CheckCircle className="h-4.5 w-4.5 text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Tasks Completed</h4>
                      </div>

                      <div className="space-y-4">
                        {courses.map((course) => {
                          const plan = plans[course.id];
                          const schedule = plan?.plan_json?.dailySchedule || [];
                          const totalTasks = schedule.reduce((sum: number, day: any) => sum + (day.tasks?.length || 0), 0);
                          
                          // Look up completed counts in localStorage
                          const storageKey = `coursepack_completed_tasks_${course.id}`;
                          const stored = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
                          let completed = 0;
                          if (stored) {
                            try {
                              const parsed = JSON.parse(stored);
                              completed = Object.keys(parsed).filter(k => parsed[k]).length;
                            } catch (e) {}
                          }

                          const percent = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

                          return (
                            <div key={course.id} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-slate-700">{course.course_code}</span>
                                <span className="text-slate-450 font-mono">{completed}/{totalTasks} tasks ({percent}%)</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-150">
                                <div className="h-full bg-blue-600" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive review completions */}
                    <div className="quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-4 shadow-sm">
                      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <BrainCircuit className="h-4.5 w-4.5 text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Active Recall Mastery</h4>
                      </div>
                      
                      <div className="space-y-3.5 text-xs">
                        <p className="text-[11px] text-slate-450 leading-snug">
                          Check off definitions and recall flashcards inside the "Interactive Review" tabs of each course to measure active memory strength.
                        </p>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <span className="text-[9px] font-bold text-slate-450 block uppercase font-mono">Simulated Mastery Status</span>
                          <span className="font-bold text-slate-800 block mt-1">Memory Strengths Estimated: Satisfactory</span>
                        </div>
                      </div>
                    </div>

                    {/* Mock quiz scores */}
                    <div className="quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-4 shadow-sm">
                      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Award className="h-4.5 w-4.5 text-blue-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Quiz Performance</h4>
                      </div>

                      <div className="space-y-3.5 text-xs text-slate-500">
                        <p className="leading-snug text-[11px]">
                          Mock game scores helps estimate baseline readiness and updates the priority scheduling engine parameters automatically.
                        </p>
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl font-mono text-[11px]">
                          <span>AVERAGE SCORE:</span>
                          <span className="text-blue-600 font-extrabold">83% Correct</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* ========================================================
                TAB 8: ACCOUNT (SIMULATED SUBSCRIPTION & API KEY)
                ======================================================== */}
            {currentNavTab === 'account' && (
              <div className="space-y-6 text-left max-w-xl mx-auto">
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-lg font-black text-slate-805 tracking-tight">Account Credentials & Billing</h2>
                  <p className="text-xs text-slate-400">Manage Gemini API integration keys and mock premium packages.</p>
                </div>

                {/* API Key Panel */}
                <div className="quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Key className="h-4 w-4 text-blue-500" /> Gemini API Key Config
                  </h3>

                  <div className="space-y-3 text-xs text-slate-500">
                    <p className="leading-relaxed">
                      By default, generations query the `GEMINI_API_KEY` defined on the hosting server.
                    </p>
                    <p className="leading-relaxed">
                      If missing or expired, type your own key below to continue parsing files and plans. Keys are kept strictly in browser storage.
                    </p>

                    <div className="space-y-1 pt-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Gemini API Key</label>
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={userApiKey}
                        onChange={(e) => setUserApiKey(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3 py-2 text-slate-700 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    {savedKey ? (
                      <button
                        type="button"
                        onClick={handleRemoveKey}
                        className="text-rose-500 font-semibold hover:underline cursor-pointer"
                      >
                        Clear API Key
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={handleSaveKey}
                      className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                    >
                      Save Key Settings
                    </button>
                  </div>
                </div>

                {/* Subscriptions */}
                <div className="quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-705 uppercase tracking-wide flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-blue-500" /> Premium Billing Tier
                  </h3>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-450 uppercase block font-mono">CURRENT PLAN</span>
                      <span className="font-bold text-slate-800 text-sm">Free Trial Version</span>
                    </div>
                    <button
                      onClick={() => triggerStripeCheckout("semester")}
                      className="px-3.5 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      Upgrade plan
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

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
          MODAL D: MOCK PAYMENT MODAL
          ========================================================== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="quill-card rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-800">Stripe Checkout Simulator</h3>
              <button type="button" onClick={() => setShowPaymentModal(false)} className="text-slate-450">✕</button>
            </div>

            {!paymentComplete ? (
              <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs text-left">
                <div className="bg-slate-50 p-3 rounded-xl flex justify-between">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Item</span>
                    <span className="font-bold text-slate-750 block">{selectedPlan?.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Total</span>
                    <span className="font-mono font-bold text-blue-600 block">{selectedPlan?.price}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Card Number</label>
                    <input
                      type="text"
                      required
                      placeholder="4242 4242 4242 4242"
                      value={paymentCardNumber}
                      onChange={(e) => setPaymentCardNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Expiration</label>
                      <input type="text" required placeholder="MM/YY" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase">CVC</label>
                      <input type="password" required placeholder="123" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Cardholder Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={paymentName}
                      onChange={(e) => setPaymentName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                  <Lock className="h-4 w-4" /> Pay {selectedPlan?.price}
                </button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-slate-800">Transaction Complete!</h4>
                <p className="text-xs text-slate-500">Your mock premium features are now unlocked.</p>
                <button onClick={() => setShowPaymentModal(false)} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">Return</button>
              </div>
            )}
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
      <div className="p-8 text-center border border-slate-200 bg-white rounded-2xl text-xs text-slate-450">
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
              className="p-1 rounded text-slate-450 hover:text-rose-500 hover:bg-slate-50 cursor-pointer"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
