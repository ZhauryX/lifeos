"use client";

import { useState, FormEvent } from "react";
import { Plus, X, BookOpen, Briefcase, User, Heart, MoreHorizontal } from "lucide-react";

interface AddTaskFormProps {
  onAdd: (task: Omit<import("@/types").Task, "id" | "createdAt">) => void;
  categories: import("@/types").Category[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  User: <User className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  MoreHorizontal: <MoreHorizontal className="w-4 h-4" />,
};

export function AddTaskForm({ onAdd, categories }: AddTaskFormProps) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [importance, setImportance] = useState(3);
  const [category, setCategory] = useState(categories[0]?.name || "Study");
  const [notes, setNotes] = useState("");
  const [recurring, setRecurring] = useState<"none" | "daily" | "weekly">("none");

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !deadline) return;
    onAdd({
      name: name.trim(),
      deadline: new Date(deadline).toISOString(),
      estimatedMinutes,
      actualMinutes: 0,
      importance,
      category,
      notes: notes.trim(),
      completed: false,
      recurring,
    });
    setName("");
    setDeadline("");
    setEstimatedMinutes(30);
    setImportance(3);
    setCategory(categories[0]?.name || "Study");
    setNotes("");
    setRecurring("none");
    setShow(false);
  };

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="w-full py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add Task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 animate-slide-down">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">New Task</h3>
        <button type="button" onClick={() => setShow(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Task Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Physics Exam"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            min={today}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Minutes</label>
          <input
            type="number"
            value={estimatedMinutes}
            onChange={e => setEstimatedMinutes(Math.max(5, parseInt(e.target.value) || 5))}
            min={5}
            max={480}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Importance: {importance}/5</label>
          <input
            type="range"
            value={importance}
            onChange={e => setImportance(parseInt(e.target.value))}
            min={1}
            max={5}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Low</span>
            <span>Medium</span>
            <span>Critical</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>
                {categoryIcons[cat.icon] || <MoreHorizontal className="w-4 h-4" />} {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recurring</label>
        <select
          value={recurring}
          onChange={e => setRecurring(e.target.value as "none" | "daily" | "weekly")}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="none">None</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add details, links, reminders..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>
      <button type="submit" className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
        Add Task
      </button>
    </form>
  );
}