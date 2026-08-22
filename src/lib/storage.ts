import { Task, Settings, Category } from "@/types";

const TASKS_KEY = "lifeos_tasks";
const SETTINGS_KEY = "lifeos_settings";
const CATEGORIES_KEY = "lifeos_categories";

const DEFAULT_SETTINGS: Settings = {
  availableMinutes: 120,
  theme: "system",
  focusSound: true,
  autoStartBreak: false,
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Study", color: "bg-blue-500", icon: "BookOpen" },
  { id: "cat-2", name: "Work", color: "bg-green-500", icon: "Briefcase" },
  { id: "cat-3", name: "Personal", color: "bg-purple-500", icon: "User" },
  { id: "cat-4", name: "Health", color: "bg-red-500", icon: "Heart" },
  { id: "cat-5", name: "Other", color: "bg-gray-500", icon: "MoreHorizontal" },
];

const DEMO_TASKS: Task[] = [
  {
    id: "demo-1",
    name: "Physics Exam",
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    estimatedMinutes: 120,
    actualMinutes: 0,
    importance: 5,
    category: "Study",
    notes: "Chapters 1-5, focus on mechanics and thermodynamics",
    completed: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    recurring: "none",
  },
  {
    id: "demo-2",
    name: "Math Homework",
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    estimatedMinutes: 45,
    actualMinutes: 0,
    importance: 4,
    category: "Study",
    notes: "Problem set 3: calculus derivatives",
    completed: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    recurring: "none",
  },
  {
    id: "demo-3",
    name: "History Project",
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedMinutes: 120,
    actualMinutes: 0,
    importance: 3,
    category: "Study",
    notes: "Research WWII causes, create presentation slides",
    completed: false,
    createdAt: new Date().toISOString(),
    recurring: "none",
  },
  {
    id: "demo-4",
    name: "English Essay",
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedMinutes: 90,
    actualMinutes: 0,
    importance: 2,
    category: "Study",
    notes: "1500 words on modern literature",
    completed: false,
    createdAt: new Date().toISOString(),
    recurring: "none",
  },
];

export function getTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(TASKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function addTask(task: Omit<Task, "id" | "createdAt">): Task {
  const tasks = getTasks();
  const newTask: Task = {
    ...task,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  saveTasks([...tasks, newTask]);
  return newTask;
}

export function updateTask(id: string, updates: Partial<Task>): void {
  const tasks = getTasks();
  saveTasks(tasks.map(t => t.id === id ? { ...t, ...updates } : t));
}

export function deleteTask(id: string): void {
  const tasks = getTasks();
  saveTasks(tasks.filter(t => t.id !== id));
}

export function toggleTask(id: string): void {
  const tasks = getTasks();
  saveTasks(tasks.map(t => 
    t.id === id ? { 
      ...t, 
      completed: !t.completed,
      completedAt: !t.completed ? new Date().toISOString() : undefined,
    } : t
  ));
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getCategories(): Category[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const stored = localStorage.getItem(CATEGORIES_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategories(categories: Category[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

export function addCategory(category: Omit<Category, "id">): Category {
  const categories = getCategories();
  const newCategory: Category = { ...category, id: crypto.randomUUID() };
  saveCategories([...categories, newCategory]);
  return newCategory;
}

export function deleteCategory(id: string): void {
  const categories = getCategories();
  saveCategories(categories.filter(c => c.id !== id));
}

export function loadDemo(): Task[] {
  saveTasks(DEMO_TASKS);
  saveSettings({ availableMinutes: 120, theme: "system", focusSound: true, autoStartBreak: false });
  return DEMO_TASKS;
}

export function clearAll(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TASKS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  localStorage.removeItem(CATEGORIES_KEY);
}

export function exportData(): string {
  const data = {
    tasks: getTasks(),
    settings: getSettings(),
    categories: getCategories(),
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.tasks) saveTasks(data.tasks);
    if (data.settings) saveSettings(data.settings);
    if (data.categories) saveCategories(data.categories);
    return true;
  } catch {
    return false;
  }
}