"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, CheckCircle2, X, Clock, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { ScoredTask } from "@/types";

interface FocusTimerProps {
  task: ScoredTask | null;
  onComplete: () => void;
  soundEnabled: boolean;
}

export function FocusTimer({ task, onComplete, soundEnabled }: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => (task ? task.estimatedMinutes * 60 : 0));
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showMinutes, setShowMinutes] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const taskIdRef = useRef<string | null>(task?.id || null);

  useEffect(() => {
    if (task && task.id !== taskIdRef.current) {
      taskIdRef.current = task.id;
      setTimeLeft(task.estimatedMinutes * 60);
      setIsRunning(false);
      setCompleted(false);
      setShowMinutes(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [task]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setCompleted(true);
            if (soundEnabled && audioRef.current) {
              audioRef.current.play().catch(() => {});
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, soundEnabled]);

  useEffect(() => {
    audioRef.current = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=");
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = task ? ((task.estimatedMinutes * 60 - timeLeft) / (task.estimatedMinutes * 60)) * 100 : 0;

  if (!task) {
    return (
      <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 text-center">
        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-600 dark:text-gray-400">Add a task to start a focus session</p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
      <div className="relative z-10 mb-6">
        <p className="text-xs font-medium text-blue-200 uppercase tracking-wider mb-1">FOCUS SESSION</p>
        <h3 className="text-xl font-bold">{task.name}</h3>
        <p className="text-blue-100 mt-1">{task.estimatedMinutes} minutes • Risk if ignored: {task.riskIfIgnored}%</p>
      </div>

      <div className="relative w-48 h-48 mx-auto mb-6">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="8"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="white"
            strokeWidth="8"
            strokeDasharray={552.92}
            strokeDashoffset={552.92 * (1 - progress / 100)}
            strokeLinecap="round"
            className="transition-all duration-300"
            filter="drop-shadow(0 4px 12px rgba(255,255,255,0.3))"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-mono font-bold tabular-nums">{formatTime(timeLeft)}</span>
          <span className="text-sm text-blue-200">{completed ? "Complete!" : isRunning ? "Focusing..." : "Ready"}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        {completed ? (
          <>
            <button
              onClick={onComplete}
              className="px-6 py-3 rounded-xl bg-white/20 text-white font-medium hover:bg-white/30 transition-colors flex items-center gap-2 shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5" />
              Mark Done
            </button>
            <button
              onClick={() => { setCompleted(false); setTimeLeft(task.estimatedMinutes * 60); }}
              className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setTimeLeft(Math.max(0, timeLeft - 60))}
              className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="-1 min"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="px-8 py-3 rounded-xl bg-white text-blue-600 font-bold hover:bg-white/90 transition-colors flex items-center gap-2 shadow-lg"
            >
              {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              {isRunning ? "Pause" : "Start Focus"}
            </button>
            <button
              onClick={() => setTimeLeft(Math.min(task.estimatedMinutes * 60, timeLeft + 60))}
              className="p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="+1 min"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-white/10">
        <button
          onClick={() => setShowMinutes(!showMinutes)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            showMinutes
              ? "bg-white/20 text-white"
              : "bg-white/10 text-blue-100 hover:bg-white/20"
          }`}
        >
          {showMinutes ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span>{showMinutes ? "Minutes" : "Seconds"}</span>
        </button>
        <div className="flex-1" />
        <button
          onClick={() => { setIsRunning(false); setTimeLeft(task.estimatedMinutes * 60); }}
          className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
}