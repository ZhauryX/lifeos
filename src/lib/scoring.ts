import { Task, ScoredTask } from "@/types";

export function calculateDaysUntilDeadline(deadline: string): number {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  return diffDays;
}

export function calculateUrgency(daysUntilDeadline: number): number {
  if (daysUntilDeadline <= 0) return 100;
  if (daysUntilDeadline === 1) return 80;
  if (daysUntilDeadline === 2) return 60;
  if (daysUntilDeadline === 3) return 45;
  if (daysUntilDeadline <= 5) return 30;
  if (daysUntilDeadline <= 7) return 20;
  return 10;
}

export function calculateImportanceScore(importance: number): number {
  return importance * 15;
}

export function calculateEfficiencyScore(estimatedMinutes: number): number {
  if (estimatedMinutes <= 30) return 20;
  if (estimatedMinutes <= 60) return 15;
  if (estimatedMinutes <= 120) return 10;
  return 5;
}

export function calculateTaskScore(task: Task): number {
  const daysUntil = calculateDaysUntilDeadline(task.deadline);
  const urgency = calculateUrgency(daysUntil);
  const importanceScore = calculateImportanceScore(task.importance);
  const efficiency = calculateEfficiencyScore(task.estimatedMinutes);
  
  return Math.round(urgency * 0.5 + importanceScore * 0.35 + efficiency * 0.15);
}

export function calculateRiskIfIgnored(task: Task, availableMinutes: number): number {
  const daysUntil = calculateDaysUntilDeadline(task.deadline);
  const baseRisk = calculateUrgency(daysUntil);
  const timePressure = Math.min(50, (task.estimatedMinutes / availableMinutes) * 100);
  const importanceRisk = task.importance * 10;
  return Math.round(Math.min(100, baseRisk + timePressure * 0.3 + importanceRisk));
}

export function generateReason(task: Task, daysUntil: number, urgency: number): string {
  if (daysUntil <= 1) return "Due very soon — highest urgency";
  if (daysUntil <= 3) return "Approaching deadline";
  if (task.importance >= 4) return "High importance task";
  if (task.estimatedMinutes <= 30) return "Quick win — builds momentum";
  if (task.actualMinutes > 0 && task.actualMinutes < task.estimatedMinutes) return "In progress — finish it";
  return "Balanced priority";
}

export function scoreTasks(tasks: Task[], availableMinutes: number): ScoredTask[] {
  return tasks
    .filter(t => !t.completed)
    .map(task => {
      const daysUntil = calculateDaysUntilDeadline(task.deadline);
      const urgency = calculateUrgency(daysUntil);
      return {
        ...task,
        score: calculateTaskScore(task),
        urgency,
        riskIfIgnored: calculateRiskIfIgnored(task, availableMinutes),
        daysUntilDeadline: daysUntil,
        reason: generateReason(task, daysUntil, urgency),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function getNextMove(tasks: Task[], availableMinutes: number): ScoredTask | null {
  const scored = scoreTasks(tasks, availableMinutes);
  return scored[0] || null;
}

export function getTotalWorkload(tasks: Task[]): number {
  return tasks.filter(t => !t.completed).reduce((sum, t) => sum + t.estimatedMinutes, 0);
}

export function getRiskLevel(totalWorkload: number, availableMinutes: number): "low" | "medium" | "high" | "critical" {
  const ratio = totalWorkload / Math.max(1, availableMinutes);
  if (ratio >= 3) return "critical";
  if (ratio >= 2) return "high";
  if (ratio >= 1) return "medium";
  return "low";
}

export function getStats(tasks: Task[]): {
  total: number;
  completed: number;
  pending: number;
  totalMinutes: number;
  completedMinutes: number;
  streak: number;
} {
  const completed = tasks.filter(t => t.completed);
  const pending = tasks.filter(t => !t.completed);
  return {
    total: tasks.length,
    completed: completed.length,
    pending: pending.length,
    totalMinutes: tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0),
    completedMinutes: completed.reduce((sum, t) => sum + t.actualMinutes, 0),
    streak: calculateStreak(tasks),
  };
}

function calculateStreak(tasks: Task[]): number {
  const completedTasks = tasks
    .filter(t => t.completed && t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const task of completedTasks) {
    const taskDate = new Date(task.completedAt!);
    taskDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((currentDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
      currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    } else if (diffDays > streak) {
      break;
    }
  }
  return streak;
}