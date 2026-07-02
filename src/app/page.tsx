"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, AlertCircle, FileText, ArrowRight, 
  HelpCircle, Mail, Check, ShieldCheck, Zap, Star,
  BookOpen, Target, Calendar, ListTodo, Layers,
  ChevronRight, Award, Lock, Loader2, BrainCircuit,
  Plus, ArrowLeft, Trash2, RefreshCw, BookMarked, Settings, Info, BarChart2,
  CheckSquare, Square, Home, User, GraduationCap, CheckCircle, LogOut, Key,
  Eye, EyeOff
} from "lucide-react";
import FileUploader from "@/components/FileUploader";
import ExamPredictionSection from "@/components/ExamPredictionSection";
import StudyPlanSection from "@/components/StudyPlanSection";
import { calculateSchedule, ScheduledCourse } from "@/utils/scheduler";
import { Course, School, Program, CourseAnalysis, StudyPlan, UserAccount } from "@/utils/db";
import { demoStudyPacks } from "@/utils/demoData";
import confetti from "canvas-confetti";

type NavTab = 'home' | 'dashboard' | 'courses' | 'upload' | 'analysis' | 'studyPlan' | 'progress' | 'account';

export default function Page() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [regSchoolId, setRegSchoolId] = useState("");
  const [regSchoolName, setRegSchoolName] = useState("");
  const [regProgramId, setRegProgramId] = useState("");
  const [regProgramName, setRegProgramName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("student.demo@gmail.com");
  const [googleName, setGoogleName] = useState("Alex Study");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showReviewWorkspace, setShowReviewWorkspace] = useState(false);

  // Navigation State
  const [currentNavTab, setCurrentNavTab] = useState<NavTab>('home');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'courseMap' | 'keyConcepts' | 'activeRecall' | 'quiz' | 'flashcards' | 'weakSpots'>('courseMap');
  
  // Data lists
  const [courses, setCourses] = useState<Course[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [uniqueCourses, setUniqueCourses] = useState<{ name: string; courseCode: string }[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, CourseAnalysis | null>>({});
  const [plans, setPlans] = useState<Record<string, StudyPlan | null>>({});
  
  // App variables
  const [dailyHoursLimit, setDailyHoursLimit] = useState<number>(4);
  const [loading, setLoading] = useState(false);

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

  // New Dropdown and Days-till-Exam Form States
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [daysTillExam, setDaysTillExam] = useState("");

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

  // Account Settings: School/Major editor state
  const [acctEditingSchool, setAcctEditingSchool] = useState(false);
  const [acctSchoolId, setAcctSchoolId] = useState("");
  const [acctSchoolName, setAcctSchoolName] = useState("");
  const [acctProgramId, setAcctProgramId] = useState("");
  const [acctProgramName, setAcctProgramName] = useState("");
  const [acctSaving, setAcctSaving] = useState(false);
  const [acctError, setAcctError] = useState("");
  const [acctSuccess, setAcctSuccess] = useState("");

  // Helper: check if school/major change is locked (within 30 days)
  const getSchoolEditLockInfo = () => {
    if (!currentUser?.school_updated_at) return { locked: false, nextDate: null };
    const lastChanged = new Date(currentUser.school_updated_at).getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const unlockTime = lastChanged + thirtyDaysMs;
    if (Date.now() < unlockTime) {
      return { locked: true, nextDate: new Date(unlockTime) };
    }
    return { locked: false, nextDate: null };
  };

  // Helper: resolve display name for school/program IDs
  const getSchoolName = (id?: string) => schools.find((s) => s.id === id)?.name || "Not set";
  const getProgramName = (id?: string) => programs.find((p) => p.id === id)?.name || "Not set";

  // Handler: save school/major changes
  const handleSaveSchoolProgram = async () => {
    if (!currentUser) return;
    setAcctSaving(true);
    setAcctError("");
    setAcctSuccess("");

    try {
      const payload: Record<string, string> = {
        action: "update-profile",
        userId: currentUser.id,
      };
      if (acctSchoolId === "custom" && acctSchoolName.trim()) {
        payload.schoolName = acctSchoolName.trim();
      } else if (acctSchoolId && acctSchoolId !== "custom") {
        payload.schoolId = acctSchoolId;
      }
      if (acctProgramId === "custom" && acctProgramName.trim()) {
        payload.programName = acctProgramName.trim();
      } else if (acctProgramId && acctProgramId !== "custom") {
        payload.programId = acctProgramId;
      }

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      // Update local user state
      setCurrentUser(data.user);
      localStorage.setItem("coursepack_active_user", JSON.stringify(data.user));
      setAcctSuccess("University and major updated successfully!");
      setAcctEditingSchool(false);

      // Refresh schools/programs lists in case new ones were created
      try {
        const schoolsRes = await fetch("/api/courses?type=schools");
        const schoolsData = await schoolsRes.json();
        if (schoolsData.schools) setSchools(schoolsData.schools);
        const programsRes = await fetch("/api/courses?type=programs");
        const programsData = await programsRes.json();
        if (programsData.programs) setPrograms(programsData.programs);
      } catch { /* ignore refresh failures */ }
    } catch (err: any) {
      setAcctError(err.message);
    } finally {
      setAcctSaving(false);
    }
  };

  // 1. Initial Load & Check Login Status
  useEffect(() => {
    // Check if user session exists
    const storedUser = localStorage.getItem("coursepack_active_user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        setCurrentUser(u);
        loadDashboardData(u.id);
      } catch (e) {
        console.error("Failed to parse stored active user session", e);
      }
    }

    // Load initial dropdown list data for registration
    const loadInitialLists = async () => {
      try {
        const res = await fetch("/api/courses?userId=guest");
        if (res.ok) {
          const data = await res.json();
          setSchools(data.schools || []);
          setPrograms(data.programs || []);
          setUniqueCourses(data.uniqueCourses || []);
        }
      } catch (err) {
        console.error("Failed to load initial registration dropdown data:", err);
      }
    };
    loadInitialLists();

    setWaitlistCount(Math.floor(Math.random() * 200) + 840);

    // Setup daily hours limit
    const storedHours = localStorage.getItem("coursepack_daily_hours_limit");
    if (storedHours) {
      setDailyHoursLimit(Number(storedHours));
    }
  }, []);

  const loadDashboardData = async (uid: string) => {
    setLoading(true);
    setGenerationError(null);
    try {
      // Fetch courses
      const courseRes = await fetch(`/api/courses?userId=${uid}`);
      if (!courseRes.ok) throw new Error("Failed to load courses");
      const data = await courseRes.json();
      setCourses(data.courses || []);
      setSchools(data.schools || []);
      setPrograms(data.programs || []);
      setUniqueCourses(data.uniqueCourses || []);

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
      if (data.courses && data.courses.length > 0) {
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

  // Auth Operations
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      alert("Please enter both email and password.");
      return;
    }
    if (authTab === 'signup' && !authName) {
      alert("Please enter your name.");
      return;
    }

    setAuthLoading(true);
    setGenerationError(null);
    try {
      const payload: any = {
        action: authTab,
        email: authEmail,
        password: authPassword,
        name: authName
      };

      if (authTab === 'signup') {
        payload.schoolId = regSchoolId === "custom" ? "" : regSchoolId;
        payload.schoolName = regSchoolId === "custom" ? regSchoolName : "";
        payload.programId = regProgramId === "custom" ? "" : regProgramId;
        payload.programName = regProgramId === "custom" ? regProgramName : "";
      }

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Authentication failed");
      }

      const user = resData.user;
      localStorage.setItem("coursepack_active_user", JSON.stringify(user));
      setCurrentUser(user);
      confetti({ particleCount: 40, spread: 60 });
      await loadDashboardData(user.id);
      setCurrentNavTab('dashboard');
    } catch (err: any) {
      setGenerationError(err.message || "Authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleMockLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleLoading(true);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "google",
          email: googleEmail,
          name: googleName,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${googleEmail}`
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Google login failed");
      }

      const user = resData.user;
      localStorage.setItem("coursepack_active_user", JSON.stringify(user));
      setCurrentUser(user);
      setShowGoogleModal(false);
      confetti({ particleCount: 50, spread: 70 });
      await loadDashboardData(user.id);
      setCurrentNavTab('dashboard');
    } catch (err: any) {
      alert(`Google Login Error: ${err.message}`);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem("coursepack_active_user");
    setCurrentUser(null);
    setCourses([]);
    setPlans({});
    setAnalyses({});
    setActiveCourseId(null);
    setCurrentNavTab('home');
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
    if (!currentUser) return;

    if (!newCourseCode || !newCourseCode.trim()) {
      alert("Please enter a course code.");
      return;
    }

    // Resolve Exam Date from Days till Exam (max 14 days)
    let resolvedExamDate = "";
    if (daysTillExam) {
      const days = Math.min(14, Math.max(1, Number(daysTillExam) || 1));
      resolvedExamDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    }

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          courseCode: newCourseCode.trim(),
          examDate: resolvedExamDate || undefined,
          targetScore: newTargetScore,
          dailyAvailableHours: Number(newDailyHours),
          currentLevel: newBaseLevel
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to add course");
      }

      setNewCourseCode("");
      setDaysTillExam("");
      setShowAddCourse(false);
      
      confetti({ particleCount: 30, spread: 50 });
      await loadDashboardData(currentUser.id);
      setCurrentNavTab('courses');
    } catch (err: any) {
      alert(`Error creating course: ${err.message}`);
    }
  };

  // 3. Delete Course
  const handleDeleteCourse = async (courseId: string) => {
    if (!currentUser) return;
    if (!confirm("Are you sure you want to delete this course and all of its materials?")) return;
    try {
      const response = await fetch(`/api/courses?userId=${currentUser.id}&courseId=${courseId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setActiveCourseId(null);
        await loadDashboardData(currentUser.id);
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
    if (!currentUser) return;
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
      
      await loadDashboardData(currentUser.id);
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
        body: JSON.stringify({}) // Uses server keys implicitly
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
    if (!currentUser) return;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    setPlanningCourseId(courseId);
    setGenerationError(null);
    try {
      const response = await fetch(`/api/courses/${courseId}/study-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          daysRemaining: getDaysRemaining(course.exam_date),
          targetScore: course.target_score || "60%",
          dailyAvailableHours: course.daily_available_hours || 2,
          currentLevel: course.current_level || "average",
          forceRegenerate: force
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
    // If not logged in, force mock google login or alert
    if (!currentUser) {
      alert("Please log in or click Google Login first to load templates in your workspace!");
      setAuthTab('login');
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setLoading(true);
    try {
      const demo = demoStudyPacks[key];
      if (!demo) return;

      const courseRes = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          name: demo.courseName,
          courseCode: demo.courseCode,
          schoolName: demo.university,
          programName: "Computer Science & Mathematics",
          examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
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
      await loadDashboardData(currentUser.id);
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

  const triggerStripeCheckout = () => {
    alert("Public Beta Active: Premium features are fully unlocked for all users at no cost!");
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
            onClick={() => {
              if (!currentUser) {
                alert("Please log in first.");
                return;
              }
              setCurrentNavTab('dashboard');
            }}
            className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${currentNavTab === 'dashboard' ? "text-blue-600 bg-blue-50" : "hover:text-blue-600"}`}
          >
            Dashboard
          </button>

          <button
            onClick={() => {
              if (!currentUser) {
                alert("Please log in first.");
                return;
              }
              setCurrentNavTab('courses');
            }}
            className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${currentNavTab === 'courses' ? "text-blue-600 bg-blue-50" : "hover:text-blue-600"}`}
          >
            Courses
          </button>

          <button
            onClick={() => {
              if (!currentUser) {
                alert("Please log in first.");
                return;
              }
              setCurrentNavTab('upload');
            }}
            className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${currentNavTab === 'upload' ? "text-blue-600 bg-blue-50" : "hover:text-blue-600"}`}
          >
            Upload
          </button>

          <button
            onClick={() => {
              if (!currentUser) {
                alert("Please log in first.");
                return;
              }
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
              if (!currentUser) {
                alert("Please log in first.");
                return;
              }
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
            onClick={() => {
              if (!currentUser) {
                alert("Please log in first.");
                return;
              }
              setCurrentNavTab('progress');
            }}
            className={`px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${currentNavTab === 'progress' ? "text-blue-600 bg-blue-50" : "hover:text-blue-600"}`}
          >
            Progress
          </button>

          <button
            onClick={() => {
              if (!currentUser) {
                alert("Please log in first.");
                return;
              }
              setCurrentNavTab('account');
            }}
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
                TAB 1: HOME (LANDING PAGE & AUTHENTICATION SCREENS)
                ======================================================== */}
            {currentNavTab === 'home' && (
              <div className="space-y-12">
                
                {/* Hero Header & Dual Layout (Marketing on left, Login on right if not logged in) */}
                <section className="grid lg:grid-cols-5 gap-8 items-center py-6 md:py-10 text-left">
                  
                  {/* Left Column: Product pitch (3 cols) */}
                  <div className="lg:col-span-3 space-y-6">
                    <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs bg-blue-50 border border-blue-100 text-blue-600 font-bold uppercase tracking-wider font-mono">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>AI Study Pack & Cram Planner</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-905 leading-[1.15]">
                      Turn your course files into a complete <span className="text-blue-600">exam study pack</span>
                    </h1>

                    <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-xl">
                      Upload your syllabus, lecture slides, notes, or rubrics. Get a structured daily study plan, active recall questions, and interactive quizzes tailored to your target scores.
                    </p>

                    {currentUser && (
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => setCurrentNavTab('dashboard')}
                          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/10 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          Go to Dashboard <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleLogOut}
                          className="px-5 py-3 rounded-xl bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          Log Out
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Auth Card or Demo packs selector (2 cols) */}
                  <div className="lg:col-span-2">
                    {!currentUser ? (
                      <div className="quill-card p-6 border border-slate-250 bg-white rounded-2xl shadow-lg space-y-4">
                        
                        {/* Tab Headers */}
                        <div className="grid grid-cols-2 border-b border-slate-100 pb-2 text-center text-xs font-bold">
                          <button
                            type="button"
                            onClick={() => {
                              setAuthTab('login');
                              setGenerationError(null);
                              setShowPassword(false);
                            }}
                            className={`pb-2 border-b-2 transition-all cursor-pointer ${authTab === 'login' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"}`}
                          >
                            Sign In
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthTab('signup');
                              setGenerationError(null);
                              setShowPassword(false);
                            }}
                            className={`pb-2 border-b-2 transition-all cursor-pointer ${authTab === 'signup' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400"}`}
                          >
                            Register
                          </button>
                        </div>

                        {/* Traditional Form */}
                        <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs text-left">
                          {authTab === 'signup' && (
                            <>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Full Name</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Jane Doe"
                                  value={authName}
                                  onChange={(e) => setAuthName(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2 text-slate-750"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">University / School</label>
                                <select
                                  required
                                  value={regSchoolId}
                                  onChange={(e) => {
                                    setRegSchoolId(e.target.value);
                                    if (e.target.value !== "custom") {
                                      setRegSchoolName("");
                                    }
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2 text-slate-750"
                                >
                                  <option value="">-- Select University --</option>
                                  {schools.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                  <option value="custom">+ Add custom university...</option>
                                </select>
                                {regSchoolId === "custom" && (
                                  <input
                                    type="text"
                                    required
                                    placeholder="Enter custom university name"
                                    value={regSchoolName}
                                    onChange={(e) => setRegSchoolName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2 text-slate-750 mt-1.5"
                                  />
                                )}
                              </div>

                              <div className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Major / Program</label>
                                <select
                                  required
                                  value={regProgramId}
                                  onChange={(e) => {
                                    setRegProgramId(e.target.value);
                                    if (e.target.value !== "custom") {
                                      setRegProgramName("");
                                    }
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2 text-slate-750"
                                >
                                  <option value="">-- Select Major/Program --</option>
                                  {programs
                                    .filter((p) => !regSchoolId || regSchoolId === "custom" || p.school_id === regSchoolId)
                                    .map((p) => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                  <option value="custom">+ Add custom major...</option>
                                </select>
                                {regProgramId === "custom" && (
                                  <input
                                    type="text"
                                    required
                                    placeholder="Enter custom major name"
                                    value={regProgramName}
                                    onChange={(e) => setRegProgramName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2 text-slate-750 mt-1.5"
                                  />
                                )}
                              </div>
                            </>
                          )}

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Gmail / Email</label>
                            <input
                              type="email"
                              required
                              placeholder="student@gmail.com"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2 text-slate-750"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Password</label>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="••••••••"
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl pl-3.5 pr-10 py-2 text-slate-750"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 cursor-pointer"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (authTab === 'login' ? "Log In" : "Sign Up")}
                          </button>
                        </form>

                        <div className="relative text-center text-[10px] text-slate-350">
                          <span className="bg-white px-2 relative z-10 font-bold uppercase">or</span>
                          <div className="absolute top-[50%] left-0 right-0 h-px bg-slate-100" />
                        </div>

                        {/* Google Sign In simulation */}
                        <button
                          type="button"
                          onClick={() => {
                            setGoogleEmail("student.demo@gmail.com");
                            setGoogleName("Alex Study");
                            setShowGoogleModal(true);
                          }}
                          className="w-full py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.14 3.01-1.02 4.19l3.12 2.42c1.83-1.69 2.95-4.18 2.95-6.46z"/>
                            <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.12-2.42c-.88.59-2.01.94-3.32.94-2.55 0-4.71-1.72-5.48-4.04H1.81v2.5C3.79 21.94 7.62 24 12 24z"/>
                            <path fill="#FBBC05" d="M6.52 15.57a7.17 7.17 0 0 1 0-4.57V8.5H1.81a11.94 11.94 0 0 0 0 10.92l4.71-3.85z"/>
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.62 0 3.79 2.06 1.81 5.92L6.52 9.77c.77-2.32 2.93-4.04 5.48-4.04z"/>
                          </svg>
                          Sign in with Google
                        </button>
                      </div>
                    ) : (
                      /* If logged in: Staged course dashboard tips */
                      <div className="quill-card p-6 border border-slate-200 bg-white rounded-2xl space-y-4 shadow-sm text-left text-xs">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block font-mono">Simulated Workspace</span>
                        <h4 className="font-extrabold text-slate-800 text-sm">Welcome back, {currentUser.name}!</h4>
                        <p className="text-slate-450 leading-relaxed">
                          Your profile has {courses.length} active courses. You can go to the Dashboard to review today's priorities.
                        </p>
                        
                        <div className="pt-2 border-t border-slate-100 flex gap-2">
                          <button
                            onClick={() => setCurrentNavTab('dashboard')}
                            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl cursor-pointer"
                          >
                            Open Dashboard
                          </button>
                        </div>
                      </div>
                    )}
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

                {/* Public Testing Sandbox Notice */}
                <section className="py-8 border-t border-slate-200 space-y-6">
                  <div className="text-center space-y-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600">Public Beta Sandbox</h3>
                    <h2 className="text-2xl font-extrabold text-slate-900">Free sandbox access active</h2>
                  </div>

                  <div className="max-w-2xl mx-auto bg-blue-50/50 border border-blue-200 rounded-2xl p-6 md:p-8 text-center space-y-4 shadow-sm">
                    <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Zap className="h-5 w-5 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-sm">Testing Active Until December 2026</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        CoursePack AI is currently free of charge. You can upload slide notes, generate countdown cram calendars, and view exam predictions without limits using active sandbox tokens and API credentials.
                      </p>
                    </div>
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            alert("Please sign in or register first to unlock dashboard access.");
                            return;
                          }
                          setCurrentNavTab('courses');
                        }}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                      >
                        Start Adding Courses Now
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
            {currentNavTab === 'dashboard' && currentUser && (
              <div className="space-y-6 text-left">
                <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Today's Study Schedule</h2>
                    <p className="text-xs text-slate-400">
                      Recommended daily study allocations calculated dynamically based on priority score parameters.
                    </p>
                  </div>
                  <div className="text-xs font-bold text-slate-500">
                    Active User: <span className="text-blue-650 font-mono">{currentUser.name}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  
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
                                  priorityLabel === 'High' ? "bg-amber-50 border-amber-255 text-amber-600" :
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

                  <div className="md:col-span-1 space-y-4">
                    
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
            {currentNavTab === 'courses' && currentUser && (
              <div className="space-y-6 text-left">
                
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

                            <h3 className="font-bold text-slate-850 text-xs truncate">{course.school_name || course.name}</h3>
                            <p className="text-[10px] text-slate-400 truncate">{course.program_name || "General Major"}</p>

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
                            <span className="text-[10px] text-slate-455 font-bold">{course.material_count || 0} files</span>
                            <div className="flex gap-2">
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
            {currentNavTab === 'upload' && currentUser && (
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
                          <option key={c.id} value={c.id}>{c.course_code}</option>
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
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
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
            {currentNavTab === 'analysis' && currentUser && (
              <div className="space-y-6 text-left">
                
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-450 uppercase">Active Course Profile:</span>
                    <select
                      value={activeCourseId || ""}
                      onChange={(e) => setActiveCourseId(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-705 focus:outline-none"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.course_code}</option>
                      ))}
                    </select>
                  </div>

                  {activeAnalysis && (
                    <button
                      onClick={() => setShowReviewWorkspace(!showReviewWorkspace)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-750 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <BookMarked className="h-4 w-4 text-blue-500" />
                      {showReviewWorkspace ? "Hide Review Workspace" : "Open Flashcards & Quizzes"}
                    </button>
                  )}
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
                      className="px-4.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      {analyzingCourseId ? "Analyzing..." : "Analyze Final Exam"}
                    </button>
                  </div>
                )}

                {/* Sub layout for interactive tabs when predicting is ready */}
                {activeAnalysis && showReviewWorkspace && (
                  <div className="border-t border-slate-200 pt-6 mt-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Interactive Study Pack Workspace</h3>
                    <ReviewWorkspaceTabs parsedWorkspace={parsedWorkspace} />
                  </div>
                )}

              </div>
            )}

            {/* ========================================================
                TAB 6: STUDY PLAN
                ======================================================== */}
            {currentNavTab === 'studyPlan' && currentUser && (
              <div className="space-y-6 text-left">
                
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-450 uppercase">Active Course Profile:</span>
                    <select
                      value={activeCourseId || ""}
                      onChange={(e) => setActiveCourseId(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-705 focus:outline-none"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.course_code}</option>
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
                      className="px-4.5 py-2 bg-blue-600 disabled:bg-slate-250 text-white text-xs font-bold rounded-xl cursor-pointer"
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
            {currentNavTab === 'progress' && currentUser && (
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
                TAB 8: ACCOUNT (SIMULATED SUBSCRIPTION & LOG OUT)
                ======================================================== */}
            {currentNavTab === 'account' && currentUser && (() => {
              const lockInfo = getSchoolEditLockInfo();
              return (
              <div className="space-y-6 text-left max-w-xl mx-auto">
                <div className="border-b border-slate-200 pb-3">
                  <h2 className="text-lg font-black text-slate-805 tracking-tight">Account Settings</h2>
                  <p className="text-xs text-slate-400">Manage your profile, university, and billing preferences.</p>
                </div>

                {/* Profile Card */}
                <div className="quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-4 shadow-sm flex items-center gap-4">
                  {currentUser.avatar_url ? (
                    <img src={currentUser.avatar_url} alt="avatar" className="w-12 h-12 rounded-full border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-150 text-blue-600 flex items-center justify-center font-bold text-lg">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-1 flex-1">
                    <h3 className="font-bold text-slate-800 text-sm">{currentUser.name}</h3>
                    <p className="text-xs text-slate-450">{currentUser.email}</p>
                    <p className="text-[10px] text-slate-400">Member since {new Date(currentUser.created_at).toLocaleDateString()}</p>
                  </div>

                  <button
                    onClick={handleLogOut}
                    className="p-2 border border-rose-200 hover:bg-rose-50 text-rose-500 rounded-xl transition-all cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* University & Major Section */}
                <div className="quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-705 uppercase tracking-wide flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-blue-500" /> University & Major
                    </h3>
                    {!acctEditingSchool && (
                      <button
                        disabled={lockInfo.locked}
                        onClick={() => {
                          setAcctSchoolId(currentUser.school_id || "");
                          setAcctProgramId(currentUser.program_id || "");
                          setAcctSchoolName("");
                          setAcctProgramName("");
                          setAcctError("");
                          setAcctSuccess("");
                          setAcctEditingSchool(true);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          lockInfo.locked
                            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                            : "bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100"
                        }`}
                        title={lockInfo.locked ? `Locked until ${lockInfo.nextDate?.toLocaleDateString()}` : "Change university and major"}
                      >
                        {lockInfo.locked ? <Lock className="h-3 w-3" /> : <Settings className="h-3 w-3" />}
                        {lockInfo.locked ? "Locked" : "Change"}
                      </button>
                    )}
                  </div>

                  {/* Current values display */}
                  {!acctEditingSchool && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">University</span>
                        <span className="font-semibold text-slate-800 text-xs">{getSchoolName(currentUser.school_id)}</span>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Major / Program</span>
                        <span className="font-semibold text-slate-800 text-xs">{getProgramName(currentUser.program_id)}</span>
                      </div>
                    </div>
                  )}

                  {/* Lock notice */}
                  {!acctEditingSchool && lockInfo.locked && lockInfo.nextDate && (
                    <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-700">
                      <Lock className="h-3.5 w-3.5 shrink-0" />
                      <span>You can change your university and major again on <strong>{lockInfo.nextDate.toLocaleDateString()}</strong>. Changes are allowed once per month.</span>
                    </div>
                  )}

                  {/* Success message */}
                  {acctSuccess && (
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[10px] text-emerald-700">
                      <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{acctSuccess}</span>
                    </div>
                  )}

                  {/* Edit form */}
                  {acctEditingSchool && (
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">University / School</label>
                        <select
                          value={acctSchoolId}
                          onChange={(e) => {
                            setAcctSchoolId(e.target.value);
                            if (e.target.value !== "custom") setAcctSchoolName("");
                          }}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-750"
                        >
                          <option value="">-- Select University --</option>
                          {schools.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                          <option value="custom">+ Add custom university...</option>
                        </select>
                        {acctSchoolId === "custom" && (
                          <input
                            type="text"
                            placeholder="Enter custom university name"
                            value={acctSchoolName}
                            onChange={(e) => setAcctSchoolName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-750 mt-1.5"
                          />
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Major / Program</label>
                        <select
                          value={acctProgramId}
                          onChange={(e) => {
                            setAcctProgramId(e.target.value);
                            if (e.target.value !== "custom") setAcctProgramName("");
                          }}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-750"
                        >
                          <option value="">-- Select Major/Program --</option>
                          {programs
                            .filter((p) => !acctSchoolId || acctSchoolId === "custom" || p.school_id === acctSchoolId)
                            .map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          <option value="custom">+ Add custom major...</option>
                        </select>
                        {acctProgramId === "custom" && (
                          <input
                            type="text"
                            placeholder="Enter custom major name"
                            value={acctProgramName}
                            onChange={(e) => setAcctProgramName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3.5 py-2 text-xs text-slate-750 mt-1.5"
                          />
                        )}
                      </div>

                      {/* Error message */}
                      {acctError && (
                        <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[10px] text-rose-600">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span>{acctError}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-[10px] text-blue-600">
                        <Info className="h-3.5 w-3.5 shrink-0" />
                        <span>You can only change your university and major <strong>once per month</strong>. Make sure your selections are correct.</span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleSaveSchoolProgram}
                          disabled={acctSaving}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {acctSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          {acctSaving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          onClick={() => { setAcctEditingSchool(false); setAcctError(""); }}
                          disabled={acctSaving}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Billing panel */}
                <div className="quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-4 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-705 uppercase tracking-wide flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-blue-500" /> Premium Billing Tier
                  </h3>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-450 uppercase block font-mono">CURRENT PLAN</span>
                      <span className="font-bold text-slate-800 text-sm">Free Sandbox Access</span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold rounded text-[10px] uppercase font-mono">
                      Active Testing
                    </span>
                  </div>
                </div>

              </div>
              );
            })()}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="print:hidden border-t border-slate-200 bg-slate-50/40 py-8 px-4 text-center text-xs text-slate-400 space-y-1 mt-12">
        <p>© 2026 CoursePack AI. Built for college & university students.</p>
        <p className="text-[10px] text-slate-405 font-medium">All study analysis and plan compiled using active developer keys.</p>
      </footer>

      {/* ==========================================================
          MODAL: ADD COURSE MODAL
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
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                  <span>Course Code *</span>
                  <span className="text-[8px] text-blue-650 font-bold lowercase">Mandatory</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ECON 101"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3 py-2 text-slate-770"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Days till Exam (Max 14)</label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  placeholder="e.g. 7 (Optional)"
                  value={daysTillExam}
                  onChange={(e) => setDaysTillExam(e.target.value)}
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
          MODAL: MOCK GOOGLE LOGIN DIALOG SIMULATOR
          ========================================================== */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="quill-card rounded-2xl border border-slate-250 w-full max-w-sm p-6 space-y-4 bg-white shadow-2xl text-left">
            
            {/* Google Header */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-.14 3.01-1.02 4.19l3.12 2.42c1.83-1.69 2.95-4.18 2.95-6.46z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.12-2.42c-.88.59-2.01.94-3.32.94-2.55 0-4.71-1.72-5.48-4.04H1.81v2.5C3.79 21.94 7.62 24 12 24z"/>
                <path fill="#FBBC05" d="M6.52 15.57a7.17 7.17 0 0 1 0-4.57V8.5H1.81a11.94 11.94 0 0 0 0 10.92l4.71-3.85z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.22 0 12 0 7.62 0 3.79 2.06 1.81 5.92L6.52 9.77c.77-2.32 2.93-4.04 5.48-4.04z"/>
              </svg>
              <h3 className="font-bold text-sm text-slate-800">Sign in with Google</h3>
            </div>

            <form onSubmit={handleGoogleMockLogin} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl leading-normal text-slate-450">
                CoursePack AI requests access to your basic Google profile details. Select or customize your credentials below.
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Google Email</label>
                <input
                  type="email"
                  required
                  placeholder="name.gmail@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3 py-2 text-slate-750"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="Jane Student"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-blue-400 focus:outline-none rounded-xl px-3 py-2 text-slate-750"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={googleLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  {googleLoading ? "Connecting..." : "Confirm Sign-In"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );

  // Embedded Workspace Tabs Render (for tab 5 review section)
  function ReviewWorkspaceTabs({ parsedWorkspace }: { parsedWorkspace: any }) {
    return (
      <div className="space-y-5">
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

        {activeWorkspaceTab === "courseMap" && (
          <div className="grid gap-3">
            {parsedWorkspace.courseMap.map((item: any, idx: number) => (
              <div key={idx} className="quill-card p-4 border border-slate-200 bg-white rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded bg-blue-50 border border-blue-100 text-[9px] font-bold text-blue-600 uppercase font-mono">
                      {item.week || `Section ${idx + 1}`}
                    </span>
                    <h4 className="font-bold text-slate-805 text-xs">{item.topic}</h4>
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
                  <span className="text-[9px] font-bold text-slate-400 block font-mono">WEIGHT</span>
                  <span className="font-bold text-slate-700 text-xs font-mono">{item.weight || "N/A"}</span>
                </div>
              </div>
            ))}
          </div>
        )}

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
                  <div className="text-[10px] text-rose-650 bg-rose-50/50 p-2 rounded border border-rose-100">
                    <strong>Watch out: </strong>{def.confusionPoint}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

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

                <h3 className="font-bold text-slate-805 text-sm leading-relaxed">{parsedWorkspace.quiz[currentQuizIndex].question}</h3>

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
                      onClick={() => {
                        setQuizSubmitted(true);
                        if (selectedOption === parsedWorkspace.quiz[currentQuizIndex].correctAnswer) {
                          setQuizScore(prev => prev + 1);
                        }
                      }}
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
              <div className="quill-card p-6 border border-slate-200 bg-white rounded-xl text-center space-y-4 font-sans">
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

        {activeWorkspaceTab === "flashcards" && (
          <div className="max-w-md mx-auto space-y-4 text-center">
            {parsedWorkspace.definitions.length === 0 ? (
              <p className="text-xs text-slate-400">No definitions found.</p>
            ) : (
              <>
                <div className="relative w-full h-48 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                  <div className={`w-full h-full p-6 border border-slate-200 bg-white rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative shadow-sm ${isFlipped ? "rotate-y-180" : ""}`}>
                    {!isFlipped ? (
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block font-mono">Concept term</span>
                        <h3 className="font-extrabold text-slate-800 text-sm">{parsedWorkspace.definitions[currentCardIdx].term}</h3>
                        <span className="text-[9px] text-slate-400 absolute bottom-3">Click to Flip card</span>
                      </div>
                    ) : (
                      <div className="space-y-2 transform -scale-x-100 select-text">
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block font-mono">Explanation</span>
                        <p className="text-xs text-slate-650 leading-relaxed max-w-xs">{parsedWorkspace.definitions[currentCardIdx].definition}</p>
                        {parsedWorkspace.definitions[currentCardIdx].formula && (
                          <code className="text-[9px] p-1 bg-slate-50 border border-slate-150 font-mono rounded block">{parsedWorkspace.definitions[currentCardIdx].formula}</code>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center max-w-xs mx-auto text-xs">
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setTimeout(() => {
                        setCurrentCardIdx(prev => (prev - 1 + parsedWorkspace.definitions.length) % parsedWorkspace.definitions.length);
                      }, 100);
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold cursor-pointer"
                  >
                    ← Prev
                  </button>
                  <span className="font-bold text-slate-400">{currentCardIdx + 1} of {parsedWorkspace.definitions.length}</span>
                  <button
                    onClick={() => {
                      setIsFlipped(false);
                      setTimeout(() => {
                        setCurrentCardIdx(prev => (prev + 1) % parsedWorkspace.definitions.length);
                      }, 100);
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeWorkspaceTab === "weakSpots" && (
          <div className="grid gap-3 text-left">
            {parsedWorkspace.weakSpots.map((item: any, idx: number) => (
              <div key={idx} className="quill-card p-4.5 border border-l-4 border-l-rose-500 border-slate-200 bg-white rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <h4 className="font-extrabold text-slate-800">{item.concept}</h4>
                  <span className="text-[9px] text-slate-400 font-mono">Ref: {item.source}</span>
                </div>
                <p className="text-slate-600"><strong>Missing Coverage: </strong>{item.coverage}</p>
                <p className="text-rose-650 bg-rose-50/50 p-2 rounded border border-rose-100"><strong>Recommended action: </strong>{item.action}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    );
  }
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
