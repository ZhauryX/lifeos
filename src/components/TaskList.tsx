"use client";

import { useState } from "react";
import { CheckCircle2, Trash2, AlertTriangle, Clock, Star, Calendar, Edit2, MoreHorizontal, BookOpen, Briefcase, User, Heart, MoreHorizontal as MoreHorizontalIcon } from "lucide-react";
import { Task, ScoredTask, Category } from "@/types";
import { calculateDaysUntilDeadline } from "@/lib/scoring";

interface TaskListProps {
  tasks: Task[];
  scoredTasks: ScoredTask[];
  categories: Category[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onShowRisk: (task: ScoredTask) => void;
  onUpdateActual: (id: string, minutes: number) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-3.5 h-3.5" />,
  Briefcase: <Briefcase className="w-3.5 h-3.5" />,
  User: <User className="w-3.5 h-3.5" />,
  Heart: <Heart className="w-3.5 h-3.5" />,
  MoreHorizontal: <MoreHorizontalIcon className="w-3.5 h-3.5" />,
};

const categoryColors: Record<string, string> = {
  "bg-blue-500": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "bg-green-500": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "bg-purple-500": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-red-500": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "bg-gray-500": "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

export function TaskList({ tasks, scoredTasks, categories, onToggle, onDelete, onShowRisk, onUpdateActual }: TaskListProps) {
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editActual, setEditActual] = useState(0);

  const getCategory = (name: string) => categories.find(c => c.name === name);

  if (pendingTasks.length === 0 && completedTasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-lg font-medium">No tasks yet</p>
        <p className="text-sm mt-1">Add your first task above</p>
      </div>
    );
  }

  const riskColors = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };

  const riskLabels = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  const getRiskLevel = (risk: number) => {
    if (risk >= 80) return "critical";
    if (risk >= 60) return "high";
    if (risk >= 40) return "medium";
    return "low";
  };

  return (
    <div className="space-y-4">
      {pendingTasks.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending ({pendingTasks.length})
          </h3>
          <div className="space-y-2">
            {scoredTasks.map((task, index) => {
              const daysLeft = task.daysUntilDeadline;
              const riskLevel = getRiskLevel(task.riskIfIgnored);
              const isNextMove = index === 0;
              const cat = getCategory(task.category);
              
              if (editingId === task.id) {
                return (
                  <div key={task.id} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={task.name}
                        onChange={e => setEditingId(task.id)}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        autoFocus
                      />
                      <button onClick={() => setEditingId(null)} className="p-2 text-gray-500 hover:text-gray-700">
                        <MoreHorizontalIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={editActual || task.actualMinutes}
                        onChange={e => setEditActual(parseInt(e.target.value) || 0)}
                        min={0}
                        max={480}
                        placeholder="Actual minutes"
                        className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => { onUpdateActual(task.id, editActual || task.actualMinutes); setEditingId(null); setEditActual(0); }}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isNextMove
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-lg"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onToggle(task.id)}
                      className={`mt-1 w-5 h-5 rounded border-2 flex-shrink-0 transition-colors ${
                        task.completed
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                      }`}
                    >
                      {task.completed && <CheckCircle2 className="w-5 h-5 text-white" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold text-gray-900 dark:text-white ${task.completed ? "line-through text-gray-400" : ""}`}>
                          {task.name}
                        </h4>
                        {isNextMove && (
                          <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full animate-pulse">
                            NEXT MOVE
                          </span>
                        )}
                        {cat && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[cat.color]}`}>
                            {categoryIcons[cat.icon]} {cat.name}
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${riskColors[riskLevel]} text-white`}>
                          {riskLabels[riskLevel]}
                        </span>
                      </div>
                      
                      {task.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{task.notes}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {daysLeft === 0 ? "Due today" : daysLeft === 1 ? "Tomorrow" : `In ${daysLeft} days`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {task.estimatedMinutes} min
                          {task.actualMinutes > 0 && <span className="text-blue-600 dark:text-blue-400">({task.actualMinutes} done)</span>}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {task.importance}/5
                        </span>
                        {task.recurring !== "none" && (
                          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                            <MoreHorizontalIcon className="w-3.5 h-3.5" />
                            {task.recurring}
                          </span>
                        )}
                      </div>

                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, (task.score / 100) * 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => onShowRisk(task)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          What if I ignore this?
                        </button>
                        <button
                          onClick={() => { setEditingId(task.id); setEditActual(task.actualMinutes); }}
                          className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 flex items-center gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                          Log time
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => onDelete(task.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {completedTasks.length > 0 && (
        <details className="group">
          <summary className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer py-2">
            <Clock className="w-4 h-4" />
            Completed ({completedTasks.length})
            <span className="ml-auto text-xs text-gray-400">Click to expand</span>
          </summary>
          <div className="space-y-2 mt-2 pb-2 border-t border-gray-200 dark:border-gray-700">
            {completedTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-white line-through">{task.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {task.estimatedMinutes} min • {task.actualMinutes} done • Importance {task.importance}/5
                    {task.completedAt && ` • Done ${new Date(task.completedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => onToggle(task.id)}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}