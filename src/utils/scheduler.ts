import { Course, CourseAnalysis } from "./db";

export interface ScheduledCourse {
  course: Course;
  daysRemaining: number;
  priorityScore: number; // 0 - 100
  allocatedHours: number; // Daily study hours allocated
  priorityLabel: "Critical" | "High" | "Medium" | "Low";
}

export function calculateSchedule(
  courses: Course[],
  analyses: Record<string, CourseAnalysis | null>,
  totalDailyHours: number = 4
): ScheduledCourse[] {
  if (courses.length === 0) return [];

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // 1. Calculate Priority Scores
  const coursesWithPriority = courses.map((course) => {
    // A. Days Remaining (Urgency) - 45% Weight
    let daysRemaining = 999;
    let urgencyScore = 0;

    if (course.exam_date) {
      const examDate = new Date(course.exam_date);
      examDate.setHours(0, 0, 0, 0);
      const diffTime = examDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysRemaining < 0) {
        // Exam passed
        daysRemaining = -1;
        urgencyScore = 0;
      } else if (daysRemaining === 0) {
        // Exam is today
        urgencyScore = 100;
      } else {
        // Closer means higher. 1 day -> 100, 2 days -> 75, 5 days -> 50, 10 days -> 25, 20+ days -> 5
        urgencyScore = Math.max(5, Math.min(100, 100 - (daysRemaining - 1) * 8));
      }
    } else {
      daysRemaining = 30; // default assumptions
      urgencyScore = 20;
    }

    // B. Target Score (Ambition) - 15% Weight
    let targetScoreScore = 50; // default 60% target
    const target = course.target_score || "60%";
    if (target.includes("80") || target.includes("90")) {
      targetScoreScore = 100;
    } else if (target.includes("70")) {
      targetScoreScore = 80;
    } else if (target.includes("60")) {
      targetScoreScore = 60;
    } else if (target.includes("50")) {
      targetScoreScore = 40;
    }

    // C. Current Base Level (Weakness) - 25% Weight
    let weaknessScore = 50; // average
    const level = course.current_level || "average";
    if (level === "weak") {
      weaknessScore = 100; // weak base needs more time
    } else if (level === "average") {
      weaknessScore = 60;
    } else if (level === "strong") {
      weaknessScore = 20; // strong base needs less time
    }

    // D. Predicted Exam High-Frequency Topics - 15% Weight
    let highFreqScore = 50; // default
    const analysis = analyses[course.id];
    if (analysis && Array.isArray(analysis.predicted_exam_topics)) {
      const highProbTopics = analysis.predicted_exam_topics.filter(
        (t: any) => (t.probabilityScore || t.probability_score || 0) >= 75
      ).length;
      // More high-probability topics = higher prep needed
      highFreqScore = Math.min(100, highProbTopics * 20);
    }

    // Weighted final priority score (0 - 100)
    let priorityScore = 0;
    if (daysRemaining >= 0) {
      priorityScore = Math.round(
        urgencyScore * 0.45 +
        weaknessScore * 0.25 +
        targetScoreScore * 0.15 +
        highFreqScore * 0.15
      );
    } else {
      priorityScore = 0; // Course is finished
    }

    // Determine Label
    let priorityLabel: "Critical" | "High" | "Medium" | "Low" = "Low";
    if (priorityScore >= 75) {
      priorityLabel = "Critical";
    } else if (priorityScore >= 55) {
      priorityLabel = "High";
    } else if (priorityScore >= 35) {
      priorityLabel = "Medium";
    }

    return {
      course,
      daysRemaining,
      priorityScore,
      priorityLabel,
      allocatedHours: 0,
    };
  });

  // Filter out courses that have already finished (daysRemaining < 0) for active time allocation
  const activeCourses = coursesWithPriority.filter((c) => c.daysRemaining >= 0);
  const totalActivePriority = activeCourses.reduce((sum, c) => sum + c.priorityScore, 0);

  if (totalActivePriority > 0 && totalDailyHours > 0) {
    // 2. Allocate time proportionally
    let allocatedTotal = 0;
    activeCourses.forEach((ac) => {
      // Raw proportion
      const rawAllocation = (ac.priorityScore / totalActivePriority) * totalDailyHours;
      // Round to nearest 0.5 hours
      let roundedAllocation = Math.round(rawAllocation * 2) / 2;
      
      // Ensure at least 0.5 hours if priority is critical/high and time permits
      if (roundedAllocation === 0 && ac.priorityScore >= 40) {
        roundedAllocation = 0.5;
      }

      ac.allocatedHours = roundedAllocation;
      allocatedTotal += roundedAllocation;
    });

    // 3. Adjust to strictly match user's total hours boundary
    // If we exceed or fall short, adjust the highest/lowest priority courses
    let diff = totalDailyHours - allocatedTotal;
    activeCourses.sort((a, b) => b.priorityScore - a.priorityScore);

    while (diff !== 0 && activeCourses.length > 0) {
      if (diff > 0) {
        // Add 0.5 hours to the highest priority course
        activeCourses[0].allocatedHours += 0.5;
        diff -= 0.5;
      } else {
        // Subtract 0.5 hours from the lowest active course that has positive hours
        const courseToReduce = [...activeCourses]
          .reverse()
          .find((c) => c.allocatedHours >= 0.5);
        if (courseToReduce) {
          courseToReduce.allocatedHours -= 0.5;
          diff += 0.5;
        } else {
          break; // Nothing to reduce
        }
      }
    }
  }

  // Return full list sorted by priority score descending
  return coursesWithPriority.sort((a, b) => b.priorityScore - a.priorityScore);
}
