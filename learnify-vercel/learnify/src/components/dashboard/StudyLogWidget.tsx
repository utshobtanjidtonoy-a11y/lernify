"use client";

import { useState, useTransition } from "react";
import { logStudySessionAction } from "@/lib/database/progressActions";
import type { StudyProgress } from "@/lib/database/types";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "English", "Other"];

interface Props {
  userId: string;
  recentProgress: StudyProgress[];
}

export default function StudyLogWidget({ userId, recentProgress }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ xp?: number; error?: string } | null>(null);

  const handleLog = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);
    const formData = new FormData(e.currentTarget);
    startTransition(() => { void (async () => {
      const res = await logStudySessionAction(formData);
      if (res.success) {
        setResult({ xp: res.xp_earned });
        setOpen(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setResult({ error: res.error });
      }
    })(); });
  };

  // Group by subject for today
  const today = new Date().toISOString().split("T")[0];
  const todayProgress = recentProgress.filter((p) => p.date === today);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Study Log</h2>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/>
          </svg>
          Log Session
        </button>
      </div>

      {/* XP earned flash */}
      {result?.xp && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/50 rounded-xl">
          <span className="text-lg">⭐</span>
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">+{result.xp} XP earned! Great work!</p>
        </div>
      )}

      {/* Inline log form */}
      {open && (
        <form onSubmit={handleLog} className="mb-5 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900 space-y-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-white">Log a study session</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Subject *</label>
              <select name="subject" required className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-slate-200">
                <option value="">Select…</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Minutes *</label>
              <input name="minutes_studied" type="number" min="1" max="480" placeholder="30" required className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-slate-200 placeholder-slate-400" />
            </div>
          </div>
          <input name="topic" type="text" placeholder="Topic (optional)" className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-slate-200 placeholder-slate-400" />
          {result?.error && <p className="text-xs text-red-500">{result.error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
              {isPending ? <Spinner /> : null}
              {isPending ? "Saving…" : "Save Session"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Today's log */}
      {todayProgress.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Today</p>
          {todayProgress.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.subject}</p>
                {p.topic && <p className="text-xs text-slate-400 dark:text-slate-500">{p.topic}</p>}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{p.minutes_studied}m</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">+{p.xp_earned} XP</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-2xl mb-2">📖</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">No sessions logged today.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Log a session to earn XP!</p>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}
