"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, RotateCcw, Zap, Shield, AlertTriangle, Clock, Target, Download, Upload, Trash2, BarChart2, Moon, Sun, Monitor, Palette, BookOpen, Briefcase, User, Heart, MoreHorizontal, Volume2, VolumeX, X } from "lucide-react";
import { Task, ScoredTask, Settings as SettingsType, Category } from "@/types";
import { scoreTasks, getNextMove, getTotalWorkload, getRiskLevel, getStats } from "@/lib/scoring";
import { getTasks, getSettings, saveSettings, loadDemo, addTask, deleteTask, toggleTask, updateTask, getCategories, saveCategories, addCategory, deleteCategory, exportData, importData, clearAll } from "@/lib/storage";
import { AddTaskForm } from "./AddTaskForm";
import { TaskList } from "./TaskList";
import { FocusTimer } from "./FocusTimer";
import { RiskModal } from "./RiskModal";

const categoryIcons: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-4 h-4" />,
  Briefcase: <Briefcase className="w-4 h-4" />,
  User: <User className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  MoreHorizontal: <MoreHorizontal className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  "bg-blue-500": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  "bg-green-500": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "bg-purple-500": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  "bg-red-500": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "bg-gray-500": "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  "bg-orange-500": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  "bg-pink-500": "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  "bg-teal-500": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<SettingsType>({ availableMinutes: 120, theme: "system", focusSound: true, autoStartBreak: false });
  const [categories, setCategories] = useState<Category[]>([]);
  const [scoredTasks, setScoredTasks] = useState<ScoredTask[]>([]);
  const [nextMove, setNextMove] = useState<ScoredTask | null>(null);
  const [totalWorkload, setTotalWorkload] = useState(0);
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high" | "critical">("low");
  const [stats, setStats] = useState<ReturnType<typeof getStats>>({ total: 0, completed: 0, pending: 0, totalMinutes: 0, completedMinutes: 0, streak: 0 });
  const [showRiskFor, setShowRiskFor] = useState<ScoredTask | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", color: "bg-blue-500", icon: "BookOpen" });
  const [importJson, setImportJson] = useState("");

  const refreshScores = useCallback((currentTasks: Task[], availableMinutes: number) => {
    const scored = scoreTasks(currentTasks, availableMinutes);
    const next = getNextMove(currentTasks, availableMinutes);
    const total = getTotalWorkload(currentTasks);
    const risk = getRiskLevel(total, availableMinutes);
    const s = getStats(currentTasks);
    setScoredTasks(scored);
    setNextMove(next);
    setTotalWorkload(total);
    setRiskLevel(risk);
    setStats(s);
  }, []);

  useEffect(() => {
    const loadedTasks = getTasks();
    const loadedSettings = getSettings();
    const loadedCategories = getCategories();
    setTasks(loadedTasks);
    setSettings(loadedSettings);
    setCategories(loadedCategories);
    refreshScores(loadedTasks, loadedSettings.availableMinutes);
  }, [refreshScores]);

  const handleAddTask = (task: Omit<Task, "id" | "createdAt">) => {
    addTask(task);
    const updated = getTasks();
    setTasks(updated);
    refreshScores(updated, settings.availableMinutes);
  };

  const handleToggle = (id: string) => {
    toggleTask(id);
    const updated = getTasks();
    setTasks(updated);
    refreshScores(updated, settings.availableMinutes);
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
    const updated = getTasks();
    setTasks(updated);
    refreshScores(updated, settings.availableMinutes);
  };

  const handleUpdateActual = (id: string, minutes: number) => {
    updateTask(id, { actualMinutes: minutes });
    const updated = getTasks();
    setTasks(updated);
    refreshScores(updated, settings.availableMinutes);
  };

  const handleShowRisk = (task: ScoredTask) => {
    setShowRiskFor(task);
  };

  const handleCompleteFocus = () => {
    if (nextMove) {
      handleToggle(nextMove.id);
    }
  };

  const handleLoadDemo = () => {
    const demoTasks = loadDemo();
    setTasks(demoTasks);
    setSettings({ availableMinutes: 120, theme: "system", focusSound: true, autoStartBreak: false });
    refreshScores(demoTasks, 120);
  };

  const handleSettingsSave = (newSettings: Partial<SettingsType>) => {
    const updated = { ...settings, ...newSettings };
    saveSettings(updated);
    setSettings(updated);
    refreshScores(tasks, updated.availableMinutes);
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;
    const cat = addCategory(newCategory);
    setCategories(getCategories());
    setNewCategory({ name: "", color: "bg-blue-500", icon: "BookOpen" });
  };

  const handleDeleteCategory = (id: string) => {
    deleteCategory(id);
    setCategories(getCategories());
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const handleImport = () => {
    if (importData(importJson)) {
      const updatedTasks = getTasks();
      const updatedSettings = getSettings();
      const updatedCategories = getCategories();
      setTasks(updatedTasks);
      setSettings(updatedSettings);
      setCategories(updatedCategories);
      refreshScores(updatedTasks, updatedSettings.availableMinutes);
      setImportJson("");
      setShowImport(false);
    } else {
      alert("Invalid JSON file");
    }
  };

  const handleClearAll = () => {
    if (confirm("Delete ALL tasks, settings, and categories? This cannot be undone.")) {
      clearAll();
      setTasks([]);
      setSettings({ availableMinutes: 120, theme: "system", focusSound: true, autoStartBreak: false });
      setCategories([]);
      refreshScores([], 120);
    }
  };

  const riskColors = {
    low: "bg-green-500",
    medium: "bg-yellow-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  };

  const riskLabels = {
    low: "Under Control",
    medium: "Busy",
    high: "Overloaded",
    critical: "Critical",
  };

  const categoryColors: Record<string, string> = {
    "bg-blue-500": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "bg-green-500": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "bg-purple-500": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "bg-red-500": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "bg-gray-500": "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">LIFEOS</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Student Mission Control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowStats(!showStats)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400" title="Statistics">
              <BarChart2 className="w-5 h-5" />
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={handleLoadDemo} className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Load Demo
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              Available Today
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{settings.availableMinutes} min</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Shield className="w-4 h-4" />
              Total Workload
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{totalWorkload} min</div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
              Risk Level
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${riskColors[riskLevel]} text-white`}>
                {riskLabels[riskLevel]}
              </span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Zap className="w-4 h-4" />
              Streak
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.streak} days</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AddTaskForm onAdd={handleAddTask} categories={categories} />
            <TaskList
              tasks={tasks}
              scoredTasks={scoredTasks}
              categories={categories}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onShowRisk={handleShowRisk}
              onUpdateActual={handleUpdateActual}
            />
          </div>

          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                YOUR NEXT MOVE
              </h3>
              {nextMove ? (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 space-y-3">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{nextMove.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {nextMove.estimatedMinutes} min</span>
                    <span className="flex items-center gap-1"><Target className="w-4 h-4" /> Importance {nextMove.importance}/5</span>
                    {nextMove.actualMinutes > 0 && <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">({nextMove.actualMinutes} done)</span>}
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">{nextMove.reason}</p>
                  <div className="h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${Math.min(100, (nextMove.score / 100) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Priority Score: {nextMove.score}/100</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No pending tasks</p>
                  <p className="text-sm mt-1">Add a task to get started</p>
                </div>
              )}
            </div>

            <FocusTimer task={nextMove} onComplete={handleCompleteFocus} soundEnabled={settings.focusSound} />
          </div>
        </div>

        {showStats && stats.total > 0 && (
          <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5" />
                Statistics
              </h3>
              <button onClick={() => setShowStats(false)} className="p-1 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completed}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.pending}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              </div>
              <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.completedMinutes} min</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Time Logged</p>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completion rate: {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                {stats.totalMinutes > 0 && ` • Estimated total: ${Math.round(stats.totalMinutes / 60 * 10) / 10}h`}
              </p>
            </div>
          </div>
        )}
      </main>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h3>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Available Time Today: {settings.availableMinutes} minutes
                </label>
                <input
                  type="range"
                  min={15}
                  max={480}
                  step={15}
                  value={settings.availableMinutes}
                  onChange={e => handleSettingsSave({ availableMinutes: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>15 min</span>
                  <span>8 hours</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["light", "dark", "system"] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => handleSettingsSave({ theme: t })}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                        settings.theme === t
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      {t === "light" && <Sun className="w-5 h-5 mx-auto mb-1" />}
                      {t === "dark" && <Moon className="w-5 h-5 mx-auto mb-1" />}
                      {t === "system" && <Monitor className="w-5 h-5 mx-auto mb-1" />}
                      <div className="capitalize">{t}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.focusSound}
                    onChange={e => handleSettingsSave({ focusSound: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Focus completion sound</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoStartBreak}
                    onChange={e => handleSettingsSave({ autoStartBreak: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">Auto-start break after focus</span>
                </label>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <button onClick={() => { setShowSettings(false); setShowCategories(true); }} className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-2">
                  <Palette className="w-4 h-4" />
                  Manage Categories
                </button>
                <button onClick={() => { setShowSettings(false); setShowExport(true); }} className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
                <button onClick={() => { setShowSettings(false); setShowImport(true); }} className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  Import Data
                </button>
                <button onClick={handleClearAll} className="w-full px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCategories && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Categories</h3>
              <button onClick={() => setShowCategories(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <span className={`p-2 rounded-lg ${categoryColors[cat.color]}`}>
                    {categoryIcons[cat.icon] || <MoreHorizontal className="w-5 h-5" />}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white flex-1">{cat.name}</span>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Add Category</h4>
              <input
                type="text"
                value={newCategory.name}
                onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Category name"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <select
                  value={newCategory.color}
                  onChange={e => setNewCategory({ ...newCategory, color: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bg-blue-500">Blue</option>
                  <option value="bg-green-500">Green</option>
                  <option value="bg-purple-500">Purple</option>
                  <option value="bg-red-500">Red</option>
                  <option value="bg-gray-500">Gray</option>
                  <option value="bg-orange-500">Orange</option>
                  <option value="bg-pink-500">Pink</option>
                  <option value="bg-teal-500">Teal</option>
                </select>
                <select
                  value={newCategory.icon}
                  onChange={e => setNewCategory({ ...newCategory, icon: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BookOpen">📚 Study</option>
                  <option value="Briefcase">💼 Work</option>
                  <option value="User">👤 Personal</option>
                  <option value="Heart">❤️ Health</option>
                  <option value="MoreHorizontal">⋯ Other</option>
                </select>
              </div>
              <button onClick={handleAddCategory} className="w-full py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Data</h3>
              <button onClick={() => setShowExport(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Download a JSON backup of all your tasks, settings, and categories.</p>
            <button onClick={handleExport} className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Download Backup
            </button>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Data</h3>
              <button onClick={() => setShowImport(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Paste JSON from a previous export to restore your data.</p>
            <textarea
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              placeholder="Paste JSON here..."
              rows={8}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowImport(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700">
                Cancel
              </button>
              <button onClick={handleImport} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700">
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      <RiskModal task={showRiskFor} onClose={() => setShowRiskFor(null)} availableMinutes={settings.availableMinutes} />
    </div>
  );
}