export interface Task {
  id: string;
  name: string;
  deadline: string;
  estimatedMinutes: number;
  actualMinutes: number;
  importance: number;
  category: string;
  notes: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  recurring?: "none" | "daily" | "weekly";
}

export interface Settings {
  availableMinutes: number;
  theme: "light" | "dark" | "system";
  focusSound: boolean;
  autoStartBreak: boolean;
}

export interface ScoredTask extends Task {
  score: number;
  urgency: number;
  riskIfIgnored: number;
  daysUntilDeadline: number;
  reason: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}