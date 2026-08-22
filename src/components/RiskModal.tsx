"use client";

import { X, AlertTriangle, TrendingUp, TrendingDown, Clock, Target } from "lucide-react";
import { ScoredTask } from "@/types";
import { calculateUrgency, calculateDaysUntilDeadline } from "@/lib/scoring";

interface RiskModalProps {
  task: ScoredTask | null;
  onClose: () => void;
  availableMinutes: number;
}

export function RiskModal({ task, onClose, availableMinutes }: RiskModalProps) {
  if (!task) return null;

  const currentRisk = task.riskIfIgnored;
  const daysLeft = task.daysUntilDeadline;
  
  // Calculate future risk if ignored
  const futureDays = Math.max(0, daysLeft - 1);
  const futureUrgency = calculateUrgency(futureDays);
  const timePressure = Math.min(50, (task.estimatedMinutes / availableMinutes) * 100);
  const importanceRisk = task.importance * 10;
  const futureRisk = Math.round(Math.min(100, futureUrgency + timePressure * 0.3 + importanceRisk));
  
  const riskIncrease = futureRisk - currentRisk;

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return "text-red-500";
    if (risk >= 60) return "text-orange-500";
    if (risk >= 40) return "text-yellow-500";
    return "text-green-500";
  };

  const getRiskBg = (risk: number) => {
    if (risk >= 80) return "bg-red-500/10 border-red-500/20";
    if (risk >= 60) return "bg-orange-500/10 border-orange-500/20";
    if (risk >= 40) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-green-500/10 border-green-500/20";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl animate-slide-up">
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Analysis</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <p className="font-medium text-gray-900 dark:text-white mb-2">{task.name}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {task.estimatedMinutes} min</span>
              <span className="flex items-center gap-1"><Target className="w-4 h-4" /> Importance {task.importance}/5</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${getRiskBg(currentRisk)}`}>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Current Risk
              </div>
              <div className="text-4xl font-bold {getRiskColor(currentRisk)}">{currentRisk}%</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">If you work on it now</p>
            </div>
            
            <div className="p-4 rounded-xl border {getRiskBg(futureRisk)}">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                If Ignored (1 day)
              </div>
              <div className="text-4xl font-bold {getRiskColor(futureRisk)}">{futureRisk}%</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Risk after 1 day delay</p>
            </div>
          </div>

          {riskIncrease > 0 && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 animate-pulse">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-1">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Risk increases by {riskIncrease}%</span>
              </div>
              <p className="text-sm text-red-600 dark:text-red-400">
                Delaying this task makes it significantly more dangerous. 
                {daysLeft <= 1 ? "It's due very soon!" : `Each day of delay adds pressure.`}
              </p>
            </div>
          )}

          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-2">
              <Target className="w-5 h-5" />
              <span className="font-medium">Why this is your next move</span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Score: {task.score}/100 • Urgency: {task.urgency}/100 • Importance: {task.importance}/5 • Efficiency bonus applied
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}