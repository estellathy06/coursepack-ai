"use client";

import React, { useState, useEffect } from "react";
import { 
  BookOpen, Target, BrainCircuit, HelpCircle, AlertTriangle, 
  Calendar, Download, FileDown, CheckCircle, RefreshCw, 
  ExternalLink, ChevronRight, CheckSquare, Square, Award,
  Info, ListChecks, Layers, BookMarked, ArrowLeft, ArrowRight,
  Star
} from "lucide-react";
import { StudyPack, DefinitionItem, QuizItem } from "@/utils/demoData";
import { generateMarkdown, generateAnkiCSV, downloadFile } from "@/utils/exporters";
import confetti from "canvas-confetti";

interface StudyPackDashboardProps {
  pack: StudyPack;
  examDate?: string;
  studyGoal?: string;
  weakAreas?: string;
  onClear: () => void;
}

export default function StudyPackDashboard({ pack, examDate, studyGoal, weakAreas, onClear }: StudyPackDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courseMap' | 'keyConcepts' | 'examFocus' | 'activeRecall' | 'quiz' | 'flashcards' | 'sevenDayPlan' | 'weakSpots'>('overview');
  
  // Recall Mastery States
  const [masteredRecall, setMasteredRecall] = useState<Record<number, boolean>>({});
  const [revealedRecall, setRevealedRecall] = useState<Record<number, boolean>>({});
  
  // Quiz Game States
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [incorrectQuestions, setIncorrectQuestions] = useState<QuizItem[]>([]);
  const [quizComplete, setQuizComplete] = useState(false);

  // Flashcards States
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardDifficulties, setCardDifficulties] = useState<Record<number, 'easy' | 'medium' | 'hard'>>({});

  // 7-Day Plan Progress
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  // Feedback States
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Reset states when pack changes
  useEffect(() => {
    setMasteredRecall({});
    setRevealedRecall({});
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setQuizSubmitted(false);
    setQuizScore(0);
    setIncorrectQuestions([]);
    setQuizComplete(false);
    setCurrentCardIdx(0);
    setIsFlipped(false);
    setCardDifficulties({});
    setCompletedTasks({});
    setFeedbackRating(0);
    setFeedbackText("");
    setHoverRating(0);
    setFeedbackStatus('idle');
    setFeedbackMessage("");
  }, [pack]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedbackRating === 0) {
      alert("Please select a star rating first!");
      return;
    }
    setFeedbackStatus('submitting');
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseCode: pack.courseCode,
          rating: feedbackRating,
          feedbackText: feedbackText,
          correctedConcepts: {
            courseName: pack.courseName,
            timestamp: new Date().toISOString(),
            feedbackText: feedbackText,
            conceptsSample: pack.definitions.slice(0, 3).map(d => ({ term: d.term, definition: d.definition }))
          }
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setFeedbackStatus('success');
        setFeedbackMessage("Thank you for your feedback! Your rating and corrections will help improve the accuracy of future generated study packs.");
        confetti({
          particleCount: 20,
          spread: 40,
          colors: ['#2563eb', '#60a5fa']
        });
      } else {
        throw new Error(data.message || "Failed to submit feedback.");
      }
    } catch (err: any) {
      setFeedbackStatus('error');
      setFeedbackMessage(err.message || "Failed to submit feedback. Please try again.");
    }
  };

  // Tab definitions
  const tabs = [
    { id: "overview", label: "Overview", icon: Info },
    { id: "courseMap", label: "Course Map", icon: BookOpen },
    { id: "keyConcepts", label: "Key Concepts", icon: BookMarked },
    { id: "examFocus", label: "Exam Focus", icon: Target },
    { id: "activeRecall", label: "Active Recall", icon: BrainCircuit },
    { id: "quiz", label: "Quiz", icon: HelpCircle },
    { id: "flashcards", label: "Flashcards", icon: Layers },
    { id: "sevenDayPlan", label: "7-Day Plan", icon: Calendar },
    { id: "weakSpots", label: "Weak Spots", icon: AlertTriangle },
  ] as const;

  // Active Recall Logic
  const toggleRecallMastery = (index: number) => {
    setMasteredRecall(prev => {
      const updated = { ...prev, [index]: !prev[index] };
      if (updated[index]) {
        confetti({
          particleCount: 15,
          spread: 30,
          origin: { y: 0.8 },
          colors: ['#2563eb', '#60a5fa']
        });
      }
      return updated;
    });
  };

  const toggleAnswerReveal = (index: number) => {
    setRevealedRecall(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const masteredCount = Object.values(masteredRecall).filter(Boolean).length;
  const recallPercentage = pack.activeRecall.length > 0 
    ? Math.round((masteredCount / pack.activeRecall.length) * 100) 
    : 0;

  // Quiz Gameplay Logic
  const handleOptionSelect = (optionIdx: number) => {
    if (quizSubmitted) return;
    setSelectedOption(optionIdx);
  };

  const handleQuizSubmit = () => {
    if (selectedOption === null || quizSubmitted) return;
    
    setQuizSubmitted(true);
    const currentQuestion = pack.quiz[currentQuizIndex];
    
    if (selectedOption === currentQuestion.correctAnswer) {
      setQuizScore(prev => prev + 1);
      confetti({
        particleCount: 25,
        spread: 50,
        colors: ['#10b981', '#60a5fa']
      });
    } else {
      setIncorrectQuestions(prev => {
        if (prev.find(q => q.id === currentQuestion.id)) return prev;
        return [...prev, currentQuestion];
      });
    }
  };

  const handleQuizNext = () => {
    setSelectedOption(null);
    setQuizSubmitted(false);
    
    if (currentQuizIndex + 1 < pack.quiz.length) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizComplete(true);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  const restartQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizComplete(false);
  };

  // Flashcard Actions
  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx(prev => (prev + 1) % pack.definitions.length);
    }, 150);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentCardIdx(prev => (prev - 1 + pack.definitions.length) % pack.definitions.length);
    }, 150);
  };

  const setCardDifficulty = (level: 'easy' | 'medium' | 'hard') => {
    setCardDifficulties(prev => ({ ...prev, [currentCardIdx]: level }));
    // Automatically go to next card after marking
    setTimeout(() => {
      handleNextCard();
    }, 400);
  };

  // 7-Day Plan Logic
  const toggleTask = (day: number, taskIdx: number) => {
    const key = `${day}-${taskIdx}`;
    setCompletedTasks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const totalTasksCount = pack.sevenDayPlan.reduce((acc, day) => acc + day.tasks.length, 0);
  const completedTasksCount = Object.values(completedTasks).filter(Boolean).length;
  const cramProgressPercentage = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  // Exporters Trigger
  const handleExportMarkdown = () => {
    const content = generateMarkdown(pack);
    downloadFile(content, `${pack.courseCode.replace(/\s+/g, "_")}_Study_Pack.md`, "text/markdown");
  };

  const handleExportAnki = () => {
    const content = generateAnkiCSV(pack);
    downloadFile(content, `${pack.courseCode.replace(/\s+/g, "_")}_Anki_Deck.txt`, "text/plain");
  };

  return (
    <div className="w-full space-y-5">
      
      {/* Top dashboard header info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-bold font-mono tracking-wider text-blue-600 bg-blue-50 border border-blue-100 rounded">
              {pack.courseCode}
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              {pack.courseName}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{pack.university}</p>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-blue-500" /> Notion MD
          </button>
          <button
            onClick={handleExportAnki}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-blue-500" /> Anki CSV
          </button>
          <button
            onClick={onClear}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" /> New Pack
          </button>
        </div>
      </div>

      {/* Tabs navigation - Pill selector in QuillBot style */}
      <div className="bg-slate-100 p-1 rounded-xl flex overflow-x-auto scrollbar-none gap-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/40"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.id === "weakSpots" && (pack.weakSpots.length + incorrectQuestions.length) > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-rose-100 text-rose-600">
                  {pack.weakSpots.length + incorrectQuestions.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tabs Panel Content */}
      <div className="min-h-[350px] animate-fade-in">

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="quill-card rounded-2xl p-5 border border-slate-200">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Course Description
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {pack.summary}
              </p>
            </div>

            {/* Custom Student Metadata Display */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="quill-card rounded-2xl p-4 border border-slate-200 bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exam Date</span>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  {examDate ? new Date(examDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "Not Specified"}
                </p>
              </div>
              <div className="quill-card rounded-2xl p-4 border border-slate-200 bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Study Goal</span>
                <p className="text-xs font-semibold text-slate-700 mt-1 truncate">
                  {studyGoal || "General Review & Cram"}
                </p>
              </div>
              <div className="quill-card rounded-2xl p-4 border border-slate-200 bg-slate-50/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Focus Weak Areas</span>
                <p className="text-xs font-semibold text-slate-750 mt-1 truncate">
                  {weakAreas || "All Topics Coverage"}
                </p>
              </div>
            </div>

            {/* Quick stats review */}
            <div className="quill-card rounded-2xl p-5 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Study Pack Index</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-2 border-r border-slate-100">
                  <span className="text-2xl font-bold text-blue-600 font-mono">{pack.courseMap.length}</span>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Topic Periods</p>
                </div>
                <div className="p-2 border-r border-slate-100">
                  <span className="text-2xl font-bold text-blue-600 font-mono">{pack.definitions.length}</span>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Key Concepts</p>
                </div>
                <div className="p-2 border-r border-slate-100">
                  <span className="text-2xl font-bold text-blue-600 font-mono">{pack.activeRecall.length}</span>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Active Recall Qs</p>
                </div>
                <div className="p-2">
                  <span className="text-2xl font-bold text-blue-600 font-mono">{pack.quiz.length}</span>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Quiz Questions</p>
                </div>
              </div>
            </div>

            {/* AI Feedback & Accuracy Widget */}
            <div className="quill-card rounded-2xl p-5 border border-slate-200 bg-white space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <BrainCircuit className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Help Improve AI Accuracy</h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    CoursePack AI learns from your ratings and corrections. Spot a formula mistake or explanation typo? Log it below so the AI adapts for future generations.
                  </p>
                </div>
              </div>

              {feedbackStatus === 'success' ? (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-800 text-xs flex items-start gap-2.5 animate-fade-in">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Feedback Received!</span>
                    <p className="text-slate-655 mt-1 leading-relaxed">{feedbackMessage}</p>
                    <button
                      onClick={() => {
                        setFeedbackStatus('idle');
                        setFeedbackRating(0);
                        setFeedbackText("");
                      }}
                      className="mt-2 font-bold text-blue-600 hover:text-blue-750 underline cursor-pointer"
                    >
                      Submit another feedback
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  {/* Rating Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Rate this pack:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 rounded hover:scale-110 active:scale-95 transition-transform text-slate-300 cursor-pointer"
                        >
                          <Star
                            className={`h-5 w-5 transition-colors ${
                              star <= (hoverRating || feedbackRating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {feedbackRating > 0 && (
                      <span className="text-xs font-bold text-slate-600 animate-fade-in">
                        {feedbackRating === 5 ? "Excellent!" : feedbackRating === 4 ? "Very Good" : feedbackRating === 3 ? "Good" : feedbackRating === 2 ? "Needs Improvement" : "Poor"}
                      </span>
                    )}
                  </div>

                  {/* Written Correction details */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Explain Corrections or Suggested Improvements
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="e.g. In the Key Concepts tab, the formula for Lagrange error has a sign typo, or page 2 CS 136 mapping missed the final recursion topic."
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-400 focus:outline-none rounded-xl p-3 text-xs text-slate-700 font-sans leading-relaxed resize-none"
                    />
                  </div>

                  {feedbackStatus === 'error' && (
                    <p className="text-xs text-rose-600 font-medium">{feedbackMessage}</p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={feedbackRating === 0 || feedbackStatus === 'submitting'}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all active:scale-[0.98] cursor-pointer ${
                        feedbackRating === 0 || feedbackStatus === 'submitting'
                          ? "bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      }`}
                    >
                      {feedbackStatus === 'submitting' ? "Submitting..." : "Submit AI Corrections"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Course Map */}
        {activeTab === "courseMap" && (
          <div className="space-y-4">
            <div className="grid gap-3.5">
              {pack.courseMap.map((item, idx) => (
                <div key={idx} className="quill-card quill-card-hover rounded-xl p-4.5 border border-slate-250 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded">
                        {item.week}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800">{item.topic}</h4>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {item.concepts.map((concept, cIdx) => (
                        <span key={cIdx} className="px-2 py-0.2 text-[10px] font-medium bg-slate-100 text-slate-500 rounded border border-slate-150">
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between gap-1 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-200">{item.weight}</span>
                    <span className="text-[9px] text-slate-400 italic">Ref: {item.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Key Concepts */}
        {activeTab === "keyConcepts" && (
          <div className="grid gap-4 sm:grid-cols-2">
            {pack.definitions.map((def, idx) => (
              <div key={idx} className="quill-card rounded-xl p-4.5 border border-slate-200 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                    <h4 className="text-xs font-bold text-blue-600">{def.term}</h4>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-150">{def.source}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{def.definition}</p>
                </div>

                {def.formula && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 font-mono text-[10px] text-blue-600 break-all">
                    {def.formula}
                  </div>
                )}
                
                {def.confusionPoint && (
                  <div className="text-[10px] text-rose-600 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                    <span className="font-bold uppercase text-[9px] tracking-wider block mb-0.5">Common Misconception:</span>
                    {def.confusionPoint}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Exam Focus */}
        {activeTab === "examFocus" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 mt-0.5 shrink-0">
                <Info className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-blue-900">Priority Exam Insights</h4>
                <p className="text-blue-700 leading-normal mt-0.5">
                  AI extracted exam directions based on syllabus rubrics, lecture importance indicators, and repeated assignments.
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {pack.examFocus.map((item, idx) => {
                const borderColors = {
                  High: "border-l-4 border-l-rose-500",
                  Medium: "border-l-4 border-l-amber-500",
                  Low: "border-l-4 border-l-blue-500"
                };
                const badgeColors = {
                  High: "bg-rose-50 text-rose-600 border border-rose-100",
                  Medium: "bg-amber-50 text-amber-600 border border-amber-100",
                  Low: "bg-blue-50 text-blue-600 border border-blue-100"
                };

                return (
                  <div key={idx} className={`quill-card rounded-xl p-5 border border-slate-200 ${borderColors[item.importance] || ""}`}>
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5 mb-3">
                      <h4 className="text-sm font-bold text-slate-800">{item.concept}</h4>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${badgeColors[item.importance]}`}>
                          {item.importance}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.2 rounded border border-slate-150">{item.source}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Why it's tested</span>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">{item.explanation}</p>
                      </div>
                      
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 text-xs">
                        <span className="text-blue-600 font-bold uppercase text-[9px] tracking-wide block mb-1">Expected Question Pattern</span>
                        <p className="text-slate-750 font-mono whitespace-pre-line leading-relaxed">{item.likelyQuestion}</p>
                      </div>

                      <div className="text-xs pt-1">
                        <span className="text-emerald-600 font-bold uppercase text-[9px] tracking-wide">Preparation Strategy</span>
                        <p className="text-slate-600 mt-0.5 italic">{item.tips}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: Active Recall */}
        {activeTab === "activeRecall" && (
          <div className="space-y-4">
            
            {/* Progress block */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs">
              <div>
                <h4 className="font-bold text-slate-700">Active Recall Testing</h4>
                <p className="text-slate-500">Mastered: {masteredCount} of {pack.activeRecall.length}</p>
              </div>
              <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${recallPercentage}%` }} />
              </div>
            </div>

            {/* Q&A Accordion list */}
            <div className="space-y-2.5">
              {pack.activeRecall.map((item, idx) => {
                const isMastered = masteredRecall[idx] || false;
                const isRevealed = revealedRecall[idx] || false;

                return (
                  <div 
                    key={idx}
                    className={`border rounded-xl transition-all duration-150 ${
                      isMastered 
                        ? "bg-emerald-50/10 border-emerald-250 opacity-80"
                        : isRevealed
                        ? "bg-white border-slate-300"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div 
                      onClick={() => toggleAnswerReveal(idx)}
                      className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRecallMastery(idx);
                          }}
                          className={`p-1 rounded transition-colors ${
                            isMastered 
                              ? "text-emerald-600" 
                              : "text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          {isMastered ? <CheckSquare className="h-4.5 w-4.5" /> : <Square className="h-4.5 w-4.5" />}
                        </button>
                        
                        <div className="min-w-0">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Question {idx + 1}</span>
                          <h4 className="text-xs md:text-sm font-semibold text-slate-800 truncate">{item.question}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="hidden sm:inline-block text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-150 font-mono">
                          {item.source}
                        </span>
                        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isRevealed ? "rotate-90" : ""}`} />
                      </div>
                    </div>

                    {isRevealed && (
                      <div className="px-10 pb-4 pt-1.5 border-t border-slate-100 space-y-3.5">
                        <div className="text-xs">
                          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider">Clue Hint:</span>
                          <p className="text-slate-500 italic mt-0.5">{item.hint}</p>
                        </div>
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs md:text-sm">
                          <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Response:</span>
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{item.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 6: Quiz */}
        {activeTab === "quiz" && (
          <div className="max-w-xl mx-auto space-y-4">
            {!quizComplete ? (
              <div className="quill-card rounded-2xl p-5 md:p-6 border border-slate-200 space-y-4">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
                  <span className="font-bold text-slate-400 uppercase">Question {currentQuizIndex + 1} of {pack.quiz.length}</span>
                  <span className="px-2 py-0.5 font-bold font-mono text-blue-600 bg-blue-50 border border-blue-100 rounded">Score: {quizScore}</span>
                </div>

                {/* Question */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 italic">Source: {pack.quiz[currentQuizIndex].source}</span>
                  <h3 className="text-sm md:text-base font-bold text-slate-850 leading-relaxed">{pack.quiz[currentQuizIndex].question}</h3>
                </div>

                {/* Options list */}
                <div className="space-y-2">
                  {pack.quiz[currentQuizIndex].options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === pack.quiz[currentQuizIndex].correctAnswer;
                    
                    let style = "bg-white border-slate-200 text-slate-650 hover:bg-slate-50 hover:border-slate-350";
                    
                    if (quizSubmitted) {
                      if (isCorrect) {
                        style = "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold";
                      } else if (isSelected) {
                        style = "bg-rose-50 border-rose-300 text-rose-800 font-semibold";
                      } else {
                        style = "bg-slate-50/50 border-slate-150 text-slate-400 opacity-60";
                      }
                    } else if (isSelected) {
                      style = "bg-blue-50/60 border-blue-400 text-blue-800 font-semibold";
                    }

                    return (
                      <button
                        key={idx}
                        disabled={quizSubmitted}
                        onClick={() => handleOptionSelect(idx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all cursor-pointer ${style}`}
                      >
                        <div className="flex items-start gap-2.5">
                          <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold border shrink-0 mt-0.5 ${
                            isSelected 
                              ? "bg-blue-600 text-white border-blue-600" 
                              : "bg-slate-100 border-slate-200 text-slate-500"
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-2 border-t border-slate-100">
                  {!quizSubmitted ? (
                    <button
                      disabled={selectedOption === null}
                      onClick={handleQuizSubmit}
                      className={`px-4.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        selectedOption === null
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      }`}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleQuizNext}
                      className="px-4.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
                    >
                      {currentQuizIndex + 1 < pack.quiz.length ? "Next Question →" : "See Summary"}
                    </button>
                  )}
                </div>

                {/* Explanation feedback */}
                {quizSubmitted && (
                  <div className={`p-3.5 rounded-xl border text-xs leading-relaxed animate-fade-in ${
                    selectedOption === pack.quiz[currentQuizIndex].correctAnswer
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  }`}>
                    <span className="font-bold uppercase text-[9px] tracking-wider block mb-0.5">
                      {selectedOption === pack.quiz[currentQuizIndex].correctAnswer ? "✓ Correct Answer" : "✗ Incorrect Answer"}
                    </span>
                    <p className="text-slate-650">{pack.quiz[currentQuizIndex].explanation}</p>
                  </div>
                )}

              </div>
            ) : (
              /* Quiz Finished Summary */
              <div className="quill-card rounded-2xl p-6 border border-slate-200 text-center space-y-5">
                <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-blue-50 border border-blue-100 text-blue-600">
                  <Award className="h-6 w-6" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800">Practice Quiz Complete</h4>
                  <p className="text-xs text-slate-500">Test results help isolate concept weak spots automatically.</p>
                </div>

                <div className="inline-block bg-slate-50 border border-slate-200 px-5 py-3.5 rounded-xl">
                  <span className="text-2xl font-extrabold font-mono text-blue-600">
                    {quizScore} <span className="text-slate-400 text-xs font-normal">/ {pack.quiz.length}</span>
                  </span>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                    {Math.round((quizScore / pack.quiz.length) * 100)}% Correct
                  </p>
                </div>

                {incorrectQuestions.length > 0 && (
                  <div className="text-left bg-rose-50 border border-rose-100 rounded-xl p-3.5 space-y-1 text-xs">
                    <span className="font-bold text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Weak Spots Updated
                    </span>
                    <p className="text-slate-500 text-[11px]">
                      {incorrectQuestions.length} missed question(s) added to the **Weak Spots** tab for self-assessment.
                    </p>
                  </div>
                )}

                <div className="flex justify-center gap-2">
                  <button
                    onClick={restartQuiz}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Retake Quiz
                  </button>
                  <button
                    onClick={() => setActiveTab("weakSpots")}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
                  >
                    View Weak Spots
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Flashcards (New 3D Flipping Experience) */}
        {activeTab === "flashcards" && (
          <div className="max-w-md mx-auto space-y-5 text-center">
            
            {/* Card Counter Progress */}
            <div className="text-xs text-slate-500 flex items-center justify-between px-1">
              <span>Key Concept Flashcards</span>
              <span className="font-bold font-mono text-slate-700">Card {currentCardIdx + 1} of {pack.definitions.length}</span>
            </div>

            {/* 3D Flipping Card Container */}
            <div 
              onClick={handleCardFlip}
              className="w-full h-64 cursor-pointer perspective-1000 select-none group"
            >
              <div className={`relative w-full h-full duration-300 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Front Side */}
                <div className="absolute inset-0 w-full h-full bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-350 transition-all flex flex-col justify-between p-6 backface-hidden">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-left">
                    Concept Definition Front
                  </span>
                  
                  <div className="text-center py-4">
                    <h3 className="text-base font-bold text-blue-600 font-sans tracking-tight leading-snug">
                      {pack.definitions[currentCardIdx].term}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono italic">
                      Source: {pack.definitions[currentCardIdx].source}
                    </p>
                  </div>

                  <span className="text-[10px] text-slate-400/80 font-medium">
                    Click card to reveal definition
                  </span>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 w-full h-full bg-blue-50/50 border border-blue-200 rounded-2xl shadow-sm flex flex-col justify-between p-6 backface-hidden rotate-y-180">
                  <div className="text-left space-y-3.5 overflow-y-auto max-h-[180px] pr-1">
                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest block">
                      Answer Back
                    </span>
                    
                    <div className="space-y-2">
                      <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed">
                        {pack.definitions[currentCardIdx].definition}
                      </p>
                      
                      {pack.definitions[currentCardIdx].formula && (
                        <div className="bg-white p-2 border border-blue-100 rounded font-mono text-[10px] text-blue-700 break-all">
                          {pack.definitions[currentCardIdx].formula}
                        </div>
                      )}

                      {pack.definitions[currentCardIdx].confusionPoint && (
                        <div className="bg-rose-50/60 p-2.5 rounded border border-rose-100 text-[10px] text-rose-700">
                          <strong className="block mb-0.5 uppercase tracking-wide text-[8px]">Don't get tricked:</strong>
                          {pack.definitions[currentCardIdx].confusionPoint}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-blue-400/80 font-medium">
                    Click card to view front
                  </span>
                </div>

              </div>
            </div>

            {/* Marking difficulties and navigation buttons */}
            <div className="space-y-4">
              
              {/* Difficulty selectors */}
              {isFlipped && (
                <div className="flex justify-center gap-2 animate-fade-in">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCardDifficulty('easy'); }}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      cardDifficulties[currentCardIdx] === 'easy'
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50"
                    }`}
                  >
                    Easy
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCardDifficulty('medium'); }}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      cardDifficulties[currentCardIdx] === 'medium'
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/50"
                    }`}
                  >
                    Medium
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setCardDifficulty('hard'); }}
                    className={`px-3 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                      cardDifficulties[currentCardIdx] === 'hard'
                        ? "bg-rose-500 text-white border-rose-500"
                        : "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100/50"
                    }`}
                  >
                    Hard
                  </button>
                </div>
              )}

              {/* Navigation Carousel Buttons */}
              <div className="flex items-center justify-between px-2 pt-1">
                <button
                  onClick={handlePrevCard}
                  className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-full transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                
                <span className="text-[10px] text-slate-400">
                  {cardDifficulties[currentCardIdx] ? (
                    <span className="capitalize font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Marked: {cardDifficulties[currentCardIdx]}
                    </span>
                  ) : "Self-test before exam day"}
                </span>

                <button
                  onClick={handleNextCard}
                  className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-full transition-colors cursor-pointer"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </div>

          </div>
        )}

        {/* Tab 8: 7-Day Plan */}
        {activeTab === "sevenDayPlan" && (
          <div className="space-y-4">
            
            {/* Progress Checklist bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs">
              <div>
                <h4 className="font-bold text-slate-700">Cram Schedule Progress</h4>
                <p className="text-slate-500">Tasks Complete: {completedTasksCount} of {totalTasksCount}</p>
              </div>
              <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${cramProgressPercentage}%` }} />
              </div>
            </div>

            {/* Days block list */}
            <div className="space-y-3.5">
              {pack.sevenDayPlan.map((dayPlan) => (
                <div key={dayPlan.day} className="quill-card rounded-xl p-4.5 border border-slate-200 grid md:grid-cols-4 gap-3.5">
                  <div className="md:border-r border-slate-100 md:pr-4 flex flex-col justify-center">
                    <span className="text-[10px] font-bold font-mono text-blue-600 uppercase">Day {dayPlan.day}</span>
                    <h4 className="text-xs md:text-sm font-bold text-slate-800 leading-snug mt-1">{dayPlan.focus}</h4>
                  </div>

                  <div className="md:col-span-3 space-y-1.5">
                    {dayPlan.tasks.map((task, tIdx) => {
                      const key = `${dayPlan.day}-${tIdx}`;
                      const isDone = completedTasks[key] || false;
                      return (
                        <div 
                          key={tIdx}
                          onClick={() => toggleTask(dayPlan.day, tIdx)}
                          className={`flex items-start gap-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none text-xs leading-normal ${
                            isDone 
                              ? "bg-slate-50 border-slate-150 opacity-60 text-slate-400"
                              : "bg-white border-slate-150 hover:border-slate-250 text-slate-750"
                          }`}
                        >
                          <button className={`shrink-0 mt-0.5 transition-colors ${isDone ? "text-emerald-500" : "text-slate-400"}`}>
                            {isDone ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                          </button>
                          <span className={isDone ? "line-through" : ""}>{task}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 9: Weak Spots */}
        {activeTab === "weakSpots" && (
          <div className="space-y-4">
            <div className="quill-card rounded-2xl p-5 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                Knowledge Remediation Panel
              </h3>

              <div className="space-y-3">
                {/* Standard weak spots from JSON */}
                {pack.weakSpots.map((item, idx) => (
                  <div key={`file-w-${idx}`} className="p-4 rounded-xl border border-rose-100 bg-rose-50/20 hover:border-rose-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs leading-relaxed">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <h4 className="font-bold text-slate-800 truncate">{item.concept}</h4>
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1 py-0.2 rounded border border-slate-150 shrink-0">{item.source}</span>
                      </div>
                      <p className="text-slate-500 pl-3 leading-normal">{item.coverage}</p>
                    </div>

                    <div className="bg-rose-50 p-2.5 rounded border border-rose-100 shrink-0 md:max-w-xs text-[11px] leading-relaxed">
                      <span className="font-extrabold text-rose-600 block text-[9px] uppercase tracking-wide mb-0.5">Remediation Action</span>
                      <p className="text-slate-650">{item.action}</p>
                    </div>
                  </div>
                ))}

                {/* Integration of missed quiz items */}
                {incorrectQuestions.map((q, idx) => (
                  <div key={`quiz-w-${idx}`} className="p-4 rounded-xl border border-amber-100 bg-amber-50/20 hover:border-amber-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs leading-relaxed">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <h4 className="font-bold text-slate-800 truncate">Quiz Practice Gap</h4>
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1 py-0.2 rounded border border-slate-150 shrink-0">{q.source}</span>
                      </div>
                      <p className="text-slate-500 pl-3 leading-normal truncate">Missed Question: "{q.question}"</p>
                    </div>

                    <div className="bg-amber-50 p-2.5 rounded border border-amber-100 shrink-0 md:max-w-xs text-[11px] leading-relaxed">
                      <span className="font-extrabold text-amber-600 block text-[9px] uppercase tracking-wide mb-0.5">Explanation Study</span>
                      <p className="text-slate-650">Verify correct options and review reasoning: {q.explanation}</p>
                    </div>
                  </div>
                ))}

                {pack.weakSpots.length === 0 && incorrectQuestions.length === 0 && (
                  <div className="text-center py-6 space-y-1">
                    <div className="mx-auto w-9 h-9 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100">
                      <CheckCircle className="h-4.5 w-4.5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Clear Study Shield</h4>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">No weak spots are logged. Complete a practice quiz or review focus lists to log areas.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
