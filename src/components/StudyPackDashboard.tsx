"use client";

import React, { useState, useEffect } from "react";
import { 
  BookOpen, Target, BrainCircuit, HelpCircle, AlertTriangle, 
  Calendar, Download, FileDown, CheckCircle, RefreshCw, 
  ExternalLink, ChevronRight, CheckSquare, Square, Award
} from "lucide-react";
import { StudyPack, ActiveRecallItem, QuizItem } from "@/utils/demoData";
import { generateMarkdown, generateAnkiCSV, downloadFile } from "@/utils/exporters";
import confetti from "canvas-confetti";

interface StudyPackDashboardProps {
  pack: StudyPack;
  onBack: () => void;
}

export default function StudyPackDashboard({ pack, onBack }: StudyPackDashboardProps) {
  const [activeTab, setActiveTab] = useState<'courseMap' | 'examFocus' | 'activeRecall' | 'quizMe' | 'weakSpots' | 'sevenDayPlan'>('courseMap');
  
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

  // 7-Day Plan Progress
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

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
    setCompletedTasks({});
  }, [pack]);

  // Tab definitions
  const tabs = [
    { id: "courseMap", label: "Course Map", icon: BookOpen },
    { id: "examFocus", label: "Exam Focus", icon: Target },
    { id: "activeRecall", label: "Active Recall", icon: BrainCircuit },
    { id: "quizMe", label: "Quiz Me", icon: HelpCircle },
    { id: "weakSpots", label: "Weak Spots", icon: AlertTriangle },
    { id: "sevenDayPlan", label: "7-Day Plan", icon: Calendar },
  ] as const;

  // Active Recall Logic
  const toggleRecallMastery = (index: number) => {
    setMasteredRecall(prev => {
      const updated = { ...prev, [index]: !prev[index] };
      // Play a small confetti effect if master is checked
      if (updated[index]) {
        confetti({
          particleCount: 15,
          spread: 30,
          origin: { y: 0.8 },
          colors: ['#8b5cf6', '#06b6d4']
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
      // Play a mini splash
      confetti({
        particleCount: 30,
        spread: 60,
        colors: ['#10b981', '#34d399']
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
      // Large confetti for finish!
      confetti({
        particleCount: 80,
        spread: 80,
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
    // Note: we preserve incorrectQuestions as "Weak Spots" until they do a complete run
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

  const handleExportPDF = () => {
    // Triggers standard system print. CSS @media print overrides will format this nicely!
    window.print();
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-6">
      
      {/* Screen layout wrapper (hidden during printing) */}
      <div className="print:hidden space-y-6">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <button
              onClick={onBack}
              className="text-xs text-zinc-500 hover:text-violet-400 font-medium flex items-center gap-1 mb-2 hover:translate-x-[-2px] transition-all"
            >
              ← Back to Dashboard
            </button>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-xs font-bold font-mono tracking-wider text-violet-400 bg-violet-500/10 border border-violet-500/25 rounded-md">
                {pack.courseCode}
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-zinc-100">
                {pack.courseName}
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-1">{pack.university}</p>
          </div>
          
          {/* Exporters Button Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-200 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-sky-400" /> Export to Notion
            </button>
            <button
              onClick={handleExportAnki}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-200 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" /> Export Anki CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-violet-600/90 hover:bg-violet-600 text-white shadow-md shadow-violet-600/10 transition-all cursor-pointer"
            >
              <FileDown className="h-3.5 w-3.5" /> Save PDF Study Pack
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto pb-1.5 scrollbar-thin border-b border-zinc-800/40">
          <div className="flex space-x-1.5 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-zinc-800/80 text-violet-400 border border-zinc-700/60"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 border border-transparent"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-violet-400" : "text-zinc-500"}`} />
                  {tab.label}
                  {tab.id === "weakSpots" && (pack.weakSpots.length + incorrectQuestions.length) > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/10 border border-rose-500/25 text-rose-400">
                      {pack.weakSpots.length + incorrectQuestions.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs Content Router */}
        <div className="min-h-[400px]">
          
          {/* Tab 1: Course Map */}
          {activeTab === "courseMap" && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-panel rounded-2xl p-6 border border-zinc-800/65">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
                  Course Summary & Syllabus Scope
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {pack.summary}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 px-1">
                  Weekly Topic Structure
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {pack.courseMap.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="glass-panel glass-panel-hover rounded-xl p-5 border border-zinc-800/70 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 border-b border-zinc-800/40 pb-2.5 mb-3">
                          <span className="text-xs font-bold text-violet-400 font-mono">
                            {item.week}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                            {item.weight}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-zinc-200 mb-2">
                          {item.topic}
                        </h4>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.concepts.map((concept, cIdx) => (
                            <span 
                              key={cIdx}
                              className="px-2 py-0.5 text-[11px] font-medium bg-zinc-800/40 text-zinc-400 rounded-md border border-zinc-800"
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 pt-2 border-t border-zinc-800/20 text-[10px] text-zinc-500 text-right font-medium italic">
                        Ref: {item.source}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Exam Focus */}
          {activeTab === "examFocus" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-amber-950/20 border border-amber-800/20 rounded-2xl p-5 flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-200">
                    Source-Based Concept Weighting
                  </h4>
                  <p className="text-xs text-amber-400/80 leading-relaxed mt-1">
                    These priority concepts are identified by cross-referencing slides frequency, assignment syllabus criteria, and rubric weights. Master these first!
                  </p>
                </div>
              </div>

              {/* Priority Areas */}
              <div className="space-y-4">
                {pack.examFocus.map((item, idx) => {
                  const borderColors = {
                    High: "border-l-4 border-l-rose-500 border-zinc-800/80",
                    Medium: "border-l-4 border-l-amber-500 border-zinc-800/80",
                    Low: "border-l-4 border-l-indigo-500 border-zinc-800/80"
                  };
                  const badgeColors = {
                    High: "bg-rose-500/10 text-rose-400 border border-rose-500/25",
                    Medium: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
                    Low: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/25"
                  };
                  
                  return (
                    <div 
                      key={idx}
                      className={`glass-panel rounded-2xl p-5 border ${borderColors[item.importance] || "border-zinc-800"} space-y-4`}
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800/40 pb-3">
                        <h4 className="text-sm font-bold text-zinc-100">{item.concept}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${badgeColors[item.importance]}`}>
                            {item.importance} Priority
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-800">
                            {item.source}
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-xs leading-relaxed">
                        <div className="space-y-1">
                          <span className="text-zinc-500 uppercase font-bold tracking-wider text-[10px]">Why it is tested:</span>
                          <p className="text-zinc-300 font-medium">{item.explanation}</p>
                        </div>
                        <div className="space-y-1 md:col-span-2 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/40">
                          <span className="text-zinc-500 uppercase font-bold tracking-wider text-[10px] text-violet-400">Likely Exam Question Pattern:</span>
                          <p className="text-zinc-200 font-mono mt-1 whitespace-pre-line leading-relaxed">{item.likelyQuestion}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-zinc-800/40 flex items-center justify-between text-xs">
                        <p className="text-zinc-400 italic">
                          <strong className="text-violet-400 font-semibold uppercase text-[10px] tracking-wider not-italic mr-1.5">Pro Tip:</strong> 
                          {item.tips}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Definitions and Formulas Summary Grid */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 px-1">
                  Essential Definitions & Formulas
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {pack.definitions.map((def, idx) => (
                    <div key={idx} className="glass-panel rounded-xl p-4.5 border border-zinc-800/60 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-violet-300">{def.term}</h4>
                          <span className="text-[9px] font-mono text-zinc-500">{def.source}</span>
                        </div>
                        <p className="text-xs text-zinc-300 mb-2 leading-relaxed">{def.definition}</p>
                        {def.formula && (
                          <div className="mt-2.5 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800 font-mono text-[11px] text-emerald-400 break-all">
                            {def.formula}
                          </div>
                        )}
                        {def.confusionPoint && (
                          <div className="mt-2.5 text-[11px] text-rose-400 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                            <span className="font-bold uppercase text-[9px] tracking-wider block mb-0.5">Common Trap:</span>
                            {def.confusionPoint}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Active Recall */}
          {activeTab === "activeRecall" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5">
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">Active Recall Mastery</h4>
                  <p className="text-xs text-zinc-500 mt-1">Review the questions, recall the answers, then test yourself.</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-violet-400">
                    {masteredCount} <span className="text-zinc-500 text-xs">/ {pack.activeRecall.length}</span>
                  </span>
                  <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1.5 border border-zinc-800">
                    <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${recallPercentage}%` }} />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {pack.activeRecall.map((item, idx) => {
                  const isMastered = masteredRecall[idx] || false;
                  const isRevealed = revealedRecall[idx] || false;

                  return (
                    <div 
                      key={idx}
                      className={`border rounded-xl transition-all duration-200 ${
                        isMastered 
                          ? "bg-zinc-900/20 border-emerald-500/20 opacity-75" 
                          : isRevealed
                          ? "bg-zinc-900/50 border-zinc-700/60"
                          : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700"
                      }`}
                    >
                      {/* Accordion Trigger */}
                      <div 
                        onClick={() => toggleAnswerReveal(idx)}
                        className="flex items-center justify-between p-4 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRecallMastery(idx);
                            }}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isMastered 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                                : "bg-zinc-800 border-zinc-700 hover:border-zinc-500 text-zinc-400"
                            }`}
                          >
                            <CheckSquare className={`h-4.5 w-4.5 ${isMastered ? "block" : "hidden"}`} />
                            <Square className={`h-4.5 w-4.5 ${isMastered ? "hidden" : "block"}`} />
                          </button>
                          
                          <div className="min-w-0">
                            <span className="text-xs text-zinc-500 font-mono font-bold block uppercase tracking-wider mb-0.5">
                              Question {idx + 1}
                            </span>
                            <h4 className="text-sm font-semibold text-zinc-200 truncate pr-6">
                              {item.question}
                            </h4>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="hidden sm:inline-block text-[10px] text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded font-mono border border-zinc-800">
                            {item.source}
                          </span>
                          <ChevronRight className={`h-4.5 w-4.5 text-zinc-500 transition-transform duration-200 ${isRevealed ? "rotate-90" : ""}`} />
                        </div>
                      </div>

                      {/* Accordion Content */}
                      {isRevealed && (
                        <div className="px-12 pb-4 pt-1 border-t border-zinc-800/40 space-y-3.5 animate-slide-down">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500/80">Hint:</span>
                            <p className="text-xs text-amber-300/90 italic">{item.hint}</p>
                          </div>
                          
                          <div className="space-y-1 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-violet-400">Answer:</span>
                            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap mt-1">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 4: Quiz Me */}
          {activeTab === "quizMe" && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
              {!quizComplete ? (
                <div className="glass-panel rounded-2xl p-6 border border-zinc-800/80 space-y-5">
                  
                  {/* Progress Header */}
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                    <span className="text-xs font-bold font-mono text-zinc-500 uppercase">
                      Question {currentQuizIndex + 1} of {pack.quiz.length}
                    </span>
                    <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded border border-violet-500/20">
                      Score: {quizScore}
                    </span>
                  </div>

                  {/* Question */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">
                      Ref: {pack.quiz[currentQuizIndex].source}
                    </span>
                    <h3 className="text-base font-semibold text-zinc-200 leading-relaxed">
                      {pack.quiz[currentQuizIndex].question}
                    </h3>
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {pack.quiz[currentQuizIndex].options.map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === pack.quiz[currentQuizIndex].correctAnswer;
                      
                      let btnStyle = "bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/60";
                      
                      if (quizSubmitted) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-medium";
                        } else if (isSelected) {
                          btnStyle = "bg-rose-500/10 border-rose-500/50 text-rose-300 font-medium";
                        } else {
                          btnStyle = "bg-zinc-900/20 border-zinc-900 text-zinc-600 opacity-60";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-violet-500/15 border-violet-500/60 text-violet-200 font-medium";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={quizSubmitted}
                          onClick={() => handleOptionSelect(idx)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold border mt-0.5 shrink-0 ${
                              isSelected 
                                ? "bg-violet-500 text-white border-violet-500" 
                                : "bg-zinc-800 border-zinc-700 text-zinc-400"
                            }`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className="pr-4">{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Submit / Next Actions */}
                  <div className="flex justify-end pt-3 border-t border-zinc-850">
                    {!quizSubmitted ? (
                      <button
                        disabled={selectedOption === null}
                        onClick={handleQuizSubmit}
                        className={`px-5 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                          selectedOption === null
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800"
                            : "bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/10"
                        }`}
                      >
                        Submit Answer
                      </button>
                    ) : (
                      <button
                        onClick={handleQuizNext}
                        className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/10 transition-all cursor-pointer"
                      >
                        {currentQuizIndex + 1 < pack.quiz.length ? "Next Question →" : "See Results"}
                      </button>
                    )}
                  </div>

                  {/* Feedback Explanation */}
                  {quizSubmitted && (
                    <div className={`p-4 rounded-xl border leading-relaxed animate-slide-up ${
                      selectedOption === pack.quiz[currentQuizIndex].correctAnswer
                        ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/5 border-rose-500/10 text-rose-400"
                    }`}>
                      <span className="font-bold uppercase text-[9px] tracking-wider block mb-1">
                        {selectedOption === pack.quiz[currentQuizIndex].correctAnswer ? "✓ Correct!" : "✗ Incorrect"}
                      </span>
                      <p className="text-xs text-zinc-300">
                        {pack.quiz[currentQuizIndex].explanation}
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                /* Quiz Complete Score Card */
                <div className="glass-panel rounded-2xl p-8 border border-zinc-800/80 text-center space-y-6">
                  <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 animate-bounce">
                    <Award className="h-8 w-8" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-zinc-200">Quiz Completed!</h3>
                    <p className="text-xs text-zinc-500">Practice tests reinforce retention. Take it again to reach 100%.</p>
                  </div>

                  <div className="inline-block bg-zinc-900 border border-zinc-850 px-6 py-4 rounded-2xl">
                    <span className="text-3xl font-extrabold font-mono text-violet-400">
                      {quizScore} <span className="text-zinc-500 text-sm font-normal">/ {pack.quiz.length}</span>
                    </span>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mt-1">
                      {Math.round((quizScore / pack.quiz.length) * 100)}% Accuracy
                    </p>
                  </div>

                  {incorrectQuestions.length > 0 && (
                    <div className="text-left bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 space-y-2">
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Added to Weak Spots
                      </span>
                      <p className="text-[11px] text-zinc-400">
                        The {incorrectQuestions.length} question(s) you missed have been compiled in the <strong>Weak Spots</strong> tab for targeted review.
                      </p>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-center gap-3">
                    <button
                      onClick={restartQuiz}
                      className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-200 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Retake Quiz
                    </button>
                    <button
                      onClick={() => setActiveTab("weakSpots")}
                      className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/10 transition-all cursor-pointer"
                    >
                      Check Weak Spots
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Weak Spots */}
          {activeTab === "weakSpots" && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-panel rounded-2xl p-6 border border-zinc-800/80 space-y-4">
                <div className="border-b border-zinc-800/50 pb-3">
                  <h3 className="text-sm font-bold text-zinc-200">Knowledge Gaps Identifier</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Gaps identified from syllabus weight discrepancies, missed quiz questions, or rubric check items.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Standard Weak spots generated from files */}
                  {pack.weakSpots.map((item, idx) => (
                    <div 
                      key={`file-weak-${idx}`}
                      className="p-4 rounded-xl border bg-zinc-950/40 border-rose-500/10 hover:border-rose-500/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <h4 className="text-sm font-semibold text-zinc-200">{item.concept}</h4>
                          <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-850">
                            {item.source}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 pl-3.5 leading-relaxed">{item.coverage}</p>
                      </div>
                      
                      <div className="shrink-0 bg-rose-500/5 border border-rose-500/10 rounded-lg p-2.5 md:max-w-xs">
                        <span className="text-[9px] uppercase font-extrabold tracking-wider text-rose-400 block mb-0.5">Action Plan:</span>
                        <p className="text-xs text-zinc-300 leading-relaxed">{item.action}</p>
                      </div>
                    </div>
                  ))}

                  {/* Incorrect quiz items integrated on the fly */}
                  {incorrectQuestions.map((q, idx) => (
                    <div 
                      key={`quiz-weak-${idx}`}
                      className="p-4 rounded-xl border bg-zinc-950/40 border-amber-500/10 hover:border-amber-500/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <h4 className="text-sm font-semibold text-zinc-200">Concept: Quiz Error</h4>
                          <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-850">
                            {q.source}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 pl-3.5 leading-relaxed truncate pr-6">
                          Missed question: "{q.question}"
                        </p>
                      </div>
                      
                      <div className="shrink-0 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5 md:max-w-xs">
                        <span className="text-[9px] uppercase font-extrabold tracking-wider text-amber-400 block mb-0.5">Action Plan:</span>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          Review why correct answer was option {q.correctAnswer + 1}. {q.explanation}
                        </p>
                      </div>
                    </div>
                  ))}

                  {pack.weakSpots.length === 0 && incorrectQuestions.length === 0 && (
                    <div className="text-center py-8 space-y-2">
                      <div className="mx-auto w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-200">No Weak Spots Found!</h4>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Amazing. Keep practicing the Active Recall questions and Quiz to test your mastery.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: 7-Day Plan */}
          {activeTab === "sevenDayPlan" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5">
                <div>
                  <h4 className="text-sm font-bold text-zinc-200">7-Day Study Progress</h4>
                  <p className="text-xs text-zinc-500 mt-1">Daily structured checklists leading up to exam day.</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-violet-400">
                    {completedTasksCount} <span className="text-zinc-500 text-xs">/ {totalTasksCount}</span>
                  </span>
                  <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden mt-1.5 border border-zinc-800">
                    <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${cramProgressPercentage}%` }} />
                  </div>
                </div>
              </div>

              {/* Day Cards */}
              <div className="space-y-4">
                {pack.sevenDayPlan.map((dayPlan) => (
                  <div 
                    key={dayPlan.day}
                    className="glass-panel rounded-2xl p-5 border border-zinc-800/60 grid md:grid-cols-4 gap-4"
                  >
                    {/* Left details */}
                    <div className="md:border-r md:border-zinc-800/60 md:pr-4 flex flex-col justify-center">
                      <span className="text-xs font-mono font-bold text-violet-400 uppercase tracking-wider">
                        Day {dayPlan.day}
                      </span>
                      <h4 className="text-sm font-bold text-zinc-200 mt-1 leading-snug">
                        {dayPlan.focus}
                      </h4>
                    </div>

                    {/* Right Checklist */}
                    <div className="md:col-span-3 space-y-2">
                      {dayPlan.tasks.map((task, tIdx) => {
                        const taskKey = `${dayPlan.day}-${tIdx}`;
                        const isDone = completedTasks[taskKey] || false;
                        return (
                          <div 
                            key={tIdx}
                            onClick={() => toggleTask(dayPlan.day, tIdx)}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                              isDone 
                                ? "bg-zinc-950/20 border-emerald-500/10 opacity-70"
                                : "bg-zinc-950/40 border-zinc-850 hover:border-zinc-800 text-zinc-300"
                            }`}
                          >
                            <button className={`mt-0.5 shrink-0 transition-colors ${isDone ? "text-emerald-400" : "text-zinc-500"}`}>
                              {isDone ? <CheckSquare className="h-4.5 w-4.5" /> : <Square className="h-4.5 w-4.5" />}
                            </button>
                            <span className={`text-xs leading-relaxed ${isDone ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                              {task}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 
        ========================================================================
        PRINT-ONLY TEXTBOOK LAYOUT
        This section is hidden in screen view and displays only when printing.
        It reformats the study pack into a clean black-and-white academic guide.
        ========================================================================
      */}
      <div className="hidden print:block text-zinc-900 bg-white font-serif p-8 leading-relaxed">
        
        {/* Academic Header */}
        <div className="border-b-2 border-zinc-900 pb-4 mb-6">
          <div className="flex justify-between items-baseline">
            <h1 className="text-3xl font-extrabold tracking-tight">{pack.courseCode}: {pack.courseName}</h1>
            <span className="text-sm font-sans font-semibold uppercase">{pack.university}</span>
          </div>
          <p className="text-sm font-sans text-zinc-600 mt-1">Comprehensive Source-Grounded Exam Study Pack</p>
        </div>

        {/* Section 1: Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold font-sans border-b border-zinc-400 pb-1 mb-3">1. Course Description & Scope</h2>
          <p className="text-sm leading-relaxed">{pack.summary}</p>
        </div>

        {/* Section 2: Course Map */}
        <div className="mb-8 page-break">
          <h2 className="text-xl font-bold font-sans border-b border-zinc-400 pb-1 mb-3">2. Course Structure & Topic Map</h2>
          <table className="w-full border-collapse text-left text-xs mb-4">
            <thead>
              <tr className="border-b-2 border-zinc-900 font-sans font-bold">
                <th className="py-2 pr-4">Week</th>
                <th className="py-2 pr-4">Topic</th>
                <th className="py-2 pr-4">Concepts</th>
                <th className="py-2 pr-4">Weight</th>
                <th className="py-2">Reference</th>
              </tr>
            </thead>
            <tbody>
              {pack.courseMap.map((item, idx) => (
                <tr key={idx} className="border-b border-zinc-300">
                  <td className="py-2.5 pr-4 font-bold">{item.week}</td>
                  <td className="py-2.5 pr-4">{item.topic}</td>
                  <td className="py-2.5 pr-4">{item.concepts.join(", ")}</td>
                  <td className="py-2.5 pr-4 font-semibold">{item.weight}</td>
                  <td className="py-2.5 italic text-zinc-600">{item.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Exam Focus Areas */}
        <div className="mb-8 page-break">
          <h2 className="text-xl font-bold font-sans border-b border-zinc-400 pb-1 mb-4">3. Exam Focus & Core Concepts</h2>
          <div className="space-y-6">
            {pack.examFocus.map((item, idx) => (
              <div key={idx} className="border-l-2 border-zinc-900 pl-4 space-y-2">
                <h3 className="text-base font-bold font-sans">{idx + 1}. {item.concept} ({item.importance} Priority)</h3>
                <p className="text-xs text-zinc-500 font-sans italic">Source: {item.source}</p>
                <p className="text-sm font-semibold">{item.explanation}</p>
                <div className="bg-zinc-100 p-3 rounded font-mono text-xs my-2 whitespace-pre-wrap">
                  <strong>Expected Question Format:</strong><br />
                  {item.likelyQuestion}
                </div>
                <p className="text-xs text-zinc-700"><strong>Preparation Strategy:</strong> {item.tips}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Key Definitions */}
        <div className="mb-8 page-break">
          <h2 className="text-xl font-bold font-sans border-b border-zinc-400 pb-1 mb-3">4. Definitions & Formulas</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            {pack.definitions.map((def, idx) => (
              <div key={idx} className="border border-zinc-300 p-3 rounded">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold font-sans">{def.term}</span>
                  <span className="text-[10px] text-zinc-500 italic font-sans">{def.source}</span>
                </div>
                <p className="leading-relaxed mb-2">{def.definition}</p>
                {def.formula && (
                  <div className="bg-zinc-100 p-1.5 rounded font-mono text-[10px] mt-1">
                    Formula: {def.formula}
                  </div>
                )}
                {def.confusionPoint && (
                  <p className="text-[10px] text-red-800 mt-1"><strong>Common Error:</strong> {def.confusionPoint}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Active Recall Questions */}
        <div className="mb-8 page-break">
          <h2 className="text-xl font-bold font-sans border-b border-zinc-400 pb-1 mb-3">5. Active Recall Questions</h2>
          <div className="space-y-4 text-sm">
            {pack.activeRecall.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <p className="font-bold">Q{idx + 1}. {item.question} <span className="font-sans font-normal text-xs text-zinc-500">({item.source})</span></p>
                <p className="text-xs text-zinc-600 font-sans italic">Hint: {item.hint}</p>
                <p className="pl-4 border-l border-zinc-400 text-zinc-800">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: Practice Quiz */}
        <div className="mb-8 page-break">
          <h2 className="text-xl font-bold font-sans border-b border-zinc-400 pb-1 mb-3">6. Practice Quiz</h2>
          <div className="space-y-5 text-sm">
            {pack.quiz.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <p className="font-bold">Q{idx + 1}. {item.question} <span className="font-sans font-normal text-xs text-zinc-500">({item.source})</span></p>
                <div className="grid grid-cols-2 gap-2 pl-4 text-xs font-sans">
                  {item.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full border border-zinc-500 flex items-center justify-center text-[8px] font-bold">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>
                <div className="pl-4 text-xs bg-zinc-50 p-2.5 rounded font-sans leading-relaxed text-zinc-700 border-l-2 border-zinc-400">
                  <strong>Answer:</strong> {String.fromCharCode(65 + item.correctAnswer)} - {item.options[item.correctAnswer]}<br />
                  <strong>Explanation:</strong> {item.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 7: Weak Spots */}
        <div className="mb-8 page-break">
          <h2 className="text-xl font-bold font-sans border-b border-zinc-400 pb-1 mb-3">7. Identifed Weak Spots & Action Plan</h2>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b-2 border-zinc-900 font-sans font-bold">
                <th className="py-2 pr-4">Concept</th>
                <th className="py-2 pr-4">Coverage Gap</th>
                <th className="py-2">Remediation Action</th>
              </tr>
            </thead>
            <tbody>
              {pack.weakSpots.map((item, idx) => (
                <tr key={idx} className="border-b border-zinc-300">
                  <td className="py-2.5 pr-4 font-bold">{item.concept}</td>
                  <td className="py-2.5 pr-4 text-zinc-650">{item.coverage}</td>
                  <td className="py-2.5 text-zinc-800">{item.action} <span className="italic text-zinc-500">({item.source})</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 8: 7-Day Cram Plan */}
        <div className="mb-8 page-break">
          <h2 className="text-xl font-bold font-sans border-b border-zinc-400 pb-1 mb-3">8. 7-Day Exam Cram Schedule</h2>
          <div className="space-y-4 text-xs font-sans">
            {pack.sevenDayPlan.map((dayPlan) => (
              <div key={dayPlan.day} className="border border-zinc-300 p-3.5 rounded">
                <p className="font-bold text-sm text-zinc-900 border-b border-zinc-200 pb-1 mb-2">Day {dayPlan.day}: {dayPlan.focus}</p>
                <ul className="list-disc pl-4 space-y-1 text-zinc-700">
                  {dayPlan.tasks.map((task, idx) => (
                    <li key={idx}>{task}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-500 font-sans border-t border-zinc-350 pt-4 mt-8">
          Generated via CoursePack AI (https://coursepack.ai)
        </div>
      </div>

    </div>
  );
}
