"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, CheckCircle, Clock, ListTodo, AlertTriangle, 
  HelpCircle, Sparkles, ShieldCheck, ChevronRight, Award, CheckSquare, Square
} from "lucide-react";

interface TaskItem {
  task: string;
  importance: "High" | "Medium" | "Low";
  source: string;
  predictedProbability?: number;
}

interface DaySchedule {
  day: number;
  focus: string;
  studyDurationHours: number;
  tasks: TaskItem[];
  expectedMastery: string;
}

interface StudyPlanJson {
  targetScore: string;
  daysRemaining: number;
  scoreStrategy: string;
  dailySchedule: DaySchedule[];
  mustDoTasks: string[];
  optionalTasks: string[];
  riskWarnings: string[];
  nextActions: string[];
}

interface StudyPlanSectionProps {
  courseId: string;
  planJson: StudyPlanJson;
  onRegenerate: () => void;
  loading: boolean;
}

export default function StudyPlanSection({ courseId, planJson, onRegenerate, loading }: StudyPlanSectionProps) {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [activeDay, setActiveDay] = useState<number>(1);

  // Load checkmark state from localStorage
  useEffect(() => {
    const key = `coursepack_completed_tasks_${courseId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setCompletedTasks(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored task checklist", e);
      }
    } else {
      setCompletedTasks({});
    }
  }, [courseId, planJson]);

  const toggleTask = (day: number, taskIdx: number) => {
    const taskKey = `${day}-${taskIdx}`;
    const updated = { ...completedTasks, [taskKey]: !completedTasks[taskKey] };
    setCompletedTasks(updated);

    const storageKey = `coursepack_completed_tasks_${courseId}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const schedule = planJson.dailySchedule || [];
  const totalTasks = schedule.reduce((sum, day) => sum + (day.tasks?.length || 0), 0);
  const completedCount = Object.keys(completedTasks).filter((k) => completedTasks[k]).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const getImportanceBadge = (importance: string) => {
    switch (importance) {
      case "High": return "bg-rose-50 border-rose-200 text-rose-700";
      case "Medium": return "bg-amber-50 border-amber-200 text-amber-700";
      default: return "bg-blue-50 border-blue-200 text-blue-700";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Card */}
      <div className="quill-card p-5 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600 animate-float" />
              <h3 className="text-base font-bold text-slate-800">
                Score Target: <span className="text-blue-600">{planJson.targetScore || "60%"} Prep</span>
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Generated for a {planJson.daysRemaining}-day cram timeline
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-semibold">Cram Progress:</span>
            <div className="w-32 h-2.5 bg-slate-100 rounded-full border border-slate-200 overflow-hidden relative">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-blue-600 font-mono">{progressPercent}%</span>
          </div>
        </div>

        {/* Strategy Description */}
        <div className="text-xs leading-relaxed text-slate-650 space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-150">
          <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider block">Strategic Focus Plan</span>
          <p>{planJson.scoreStrategy}</p>
        </div>

        {/* Target 50% vs 70% comparison helpers */}
        {planJson.targetScore === "50%" && (
          <div className="p-3.5 bg-rose-50/40 border border-rose-100 rounded-xl text-xs text-rose-800 space-y-1">
            <span className="font-bold text-[10px] uppercase tracking-wider block">Targeting 50% (Pass Only) Strategy:</span>
            <p className="text-slate-600 leading-normal">
              We have omitted complex proofs, formulas, and edge cases. To target 60%, click <span className="font-semibold text-blue-600 cursor-pointer hover:underline" onClick={onRegenerate}>Regenerate</span> and select 60% or 70% to add medium-priority practice and mock exercises.
            </p>
          </div>
        )}

        {planJson.targetScore === "70%" && (
          <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-xl text-xs text-emerald-800 space-y-1">
            <span className="font-bold text-[10px] uppercase tracking-wider block">Targeting 70%+ (High Score) Strategy:</span>
            <p className="text-slate-650 leading-normal">
              This plan includes comprehensive question sets, deep reviews of past quiz mistakes, and active recall. Focus on doing mock exam iterations.
            </p>
          </div>
        )}
      </div>

      {/* ⚠️ Risk Warnings (if any) */}
      {planJson.riskWarnings && planJson.riskWarnings.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 text-rose-900 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-600" />
            <span>Timeline Risk Warnings</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            {planJson.riskWarnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Daily schedule tabs & checklist split layout */}
      <div className="grid lg:grid-cols-5 gap-5 items-start">
        
        {/* Days Left Bar (2 columns) */}
        <div className="lg:col-span-2 space-y-2.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Study Calendar Timeline</span>
          
          <div className="grid gap-2">
            {schedule.map((dayPlan) => {
              const isActive = activeDay === dayPlan.day;
              // Check how many completed in this day
              const dayTasksCount = dayPlan.tasks?.length || 0;
              let dayCompleted = 0;
              for (let i = 0; i < dayTasksCount; i++) {
                if (completedTasks[`${dayPlan.day}-${i}`]) dayCompleted++;
              }
              const isFinished = dayTasksCount > 0 && dayCompleted === dayTasksCount;

              return (
                <div
                  key={dayPlan.day}
                  onClick={() => setActiveDay(dayPlan.day)}
                  className={`p-3.5 border rounded-xl cursor-pointer text-left transition-all duration-150 flex items-center justify-between ${
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                      : isFinished
                      ? "bg-emerald-50 border-emerald-250 text-slate-700 opacity-80"
                      : "bg-white border-slate-200 hover:border-slate-350 text-slate-650"
                  }`}
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <h4 className={`text-xs font-bold ${isActive ? "text-blue-100" : "text-blue-600"}`}>
                      Day {dayPlan.day}
                    </h4>
                    <p className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-slate-800"}`}>
                      {dayPlan.focus}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                      <Clock className="h-3 w-3" />
                      <span>{dayPlan.studyDurationHours} hrs budget</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono font-bold">
                      {dayCompleted}/{dayTasksCount}
                    </span>
                    <ChevronRight className={`h-4 w-4 opacity-60 ${isActive ? "text-white" : "text-slate-400"}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Day Tasks Checklist (3 columns) */}
        <div className="lg:col-span-3 quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-4">
          {schedule.filter(d => d.day === activeDay).map((dayPlan) => (
            <div key={dayPlan.day} className="space-y-4">
              
              {/* Day Header details */}
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                  Day {dayPlan.day} Study Pack checklist
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-2">
                  Focus: {dayPlan.focus}
                </h3>
                <p className="text-[11px] text-slate-450 mt-1 italic">
                  End goal: {dayPlan.expectedMastery}
                </p>
              </div>

              {/* Tasks Checklist */}
              <div className="space-y-3">
                {dayPlan.tasks?.map((task, idx) => {
                  const isChecked = completedTasks[`${dayPlan.day}-${idx}`] || false;

                  return (
                    <div 
                      key={idx}
                      onClick={() => toggleTask(dayPlan.day, idx)}
                      className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer select-none transition-all ${
                        isChecked 
                          ? "bg-slate-50 border-slate-200 opacity-70" 
                          : "bg-white border-slate-150 hover:border-slate-300"
                      }`}
                    >
                      <button className="shrink-0 mt-0.5 text-slate-450">
                        {isChecked ? (
                          <CheckSquare className="h-4.5 w-4.5 text-blue-600" />
                        ) : (
                          <Square className="h-4.5 w-4.5" />
                        )}
                      </button>

                      <div className="space-y-1 text-xs min-w-0 flex-1">
                        <p className={`font-semibold ${isChecked ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {task.task}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className={`px-1.5 py-0.2 rounded border uppercase tracking-wider text-[8px] font-bold ${getImportanceBadge(task.importance)}`}>
                            {task.importance}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-400">Source: {task.source}</span>
                          {task.predictedProbability !== undefined && (
                            <>
                              <span className="text-slate-400">|</span>
                              <span className="text-rose-600 font-mono font-bold">
                                {task.predictedProbability}% prob
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* 4. Must-Do vs Optional Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        
        <div className="quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle className="h-4 w-4 text-rose-500" /> Core Must-Do Priorities
          </h4>
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-2">
            {planJson.mustDoTasks?.map((task, i) => (
              <li key={i}>{task}</li>
            ))}
          </ul>
        </div>

        <div className="quill-card p-5 border border-slate-200 bg-white rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-blue-500" /> Target score booster tasks
          </h4>
          <ul className="list-disc pl-5 text-xs text-slate-600 space-y-2">
            {planJson.optionalTasks?.map((task, i) => (
              <li key={i}>{task}</li>
            ))}
          </ul>
        </div>

      </div>

      {/* 5. Recommended Next Actions */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 text-xs flex items-start gap-3">
        <ShieldCheck className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Next Recommended Study Actions:</span>
          <ul className="list-decimal pl-5 mt-1 space-y-1 text-slate-700">
            {planJson.nextActions?.map((act, i) => (
              <li key={i}>{act}</li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
