"use client";

import { useState, useTransition } from "react";
import { logStudySessionAction } from "@/lib/database/progressActions";
import type { StudyProgress } from "@/lib/database/types";

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "English", "Other"];
const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#3b82f6",
  Physics: "#8b5cf6",
  Chemistry: "#10b981",
  Biology: "#f59e0b",
  History: "#ef4444",
  English: "#ec4899",
  Other: "#06b6d4",
};

interface Props {
  progress: StudyProgress[];
  userId: string;
}

export default function ProgressView({ progress, userId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ xp?: number; error?: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Build last 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split("T")[0];
  });

  const minutesByDay = days.map((date) => ({
    date,
    minutes: progress.filter((p) => p.date === date).reduce((s, p) => s + p.minutes_studied, 0),
    xp: progress.filter((p) => p.date === date).reduce((s, p) => s + p.xp_earned, 0),
  }));
  const maxMinutes = Math.max(...minutesByDay.map((d) => d.minutes), 1);

  // Subject breakdown
  const bySubject = SUBJECTS.map((subject) => ({
    subject,
    minutes: progress.filter((p) => p.subject === subject).reduce((s, p) => s + p.minutes_studied, 0),
    xp: progress.filter((p) => p.subject === subject).reduce((s, p) => s + p.xp_earned, 0),
  })).filter((s) => s.minutes > 0).sort((a, b) => b.minutes - a.minutes);

  const totalMinutes = progress.reduce((s, p) => s + p.minutes_studied, 0);
  const totalXP = progress.reduce((s, p) => s + p.xp_earned, 0);

  const handleLog = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResult(null);
    const formData = new FormData(e.currentTarget);
    startTransition(() => { void (async () => {
      const res = await logStudySessionAction(formData);
      if (res.success) {
        setResult({ xp: res.xp_earned });
        setShowForm(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setResult({ error: res.error });
      }
    })(); });
  };

  const inputClass = "w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-slate-200 placeholder-slate-400";

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Minutes (30d)", value: totalMinutes >= 60 ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` : `${totalMinutes}m`, icon: "⏱" },
          { label: "Total XP Earned", value: totalXP.toLocaleString(), icon: "⭐" },
          { label: "Subjects Studied", value: bySubject.length.toString(), icon: "📚" },
          { label: "Sessions Logged", value: progress.length.toString(), icon: "📊" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
            <p className="text-2xl mb-2">{stat.icon}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Log session */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Log Study Session</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/>
            </svg>
            Log Session
          </button>
        </div>

        {result?.xp && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <span className="text-lg">⭐</span>
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400">+{result.xp} XP earned!</p>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleLog} className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
            <div className="grid grid-cols-2 gap-3">
              <select name="subject" required className={inputClass}>
                <option value="">Subject *</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input name="minutes_studied" type="number" min="1" max="480" required placeholder="Minutes *" className={inputClass} />
            </div>
            <input name="topic" type="text" placeholder="Topic (optional)" className={inputClass} />
            <textarea name="notes" placeholder="Notes (optional)" rows={2} className={`${inputClass} resize-none`} />
            {result?.error && <p className="text-xs text-red-500">{result.error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={isPending} className="flex-1 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2">
                {isPending && <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>}
                {isPending ? "Saving…" : "Save Session"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* 14-day bar chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5">Last 14 Days</h2>
        <div className="flex items-end gap-1 h-32">
          {minutesByDay.map(({ date, minutes, xp }) => {
            const heightPct = (minutes / maxMinutes) * 100;
            const isToday = date === new Date().toISOString().split("T")[0];
            const label = new Date(date + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" });
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative">
                {minutes > 0 && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {minutes}m · +{xp}XP
                  </div>
                )}
                <div className="w-full" style={{ height: "112px", display: "flex", alignItems: "flex-end" }}>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? "bg-blue-500" : "bg-blue-200 dark:bg-blue-900"}`}
                    style={{ height: `${Math.max(heightPct * 1.12, minutes > 0 ? 8 : 2)}px` }}
                  />
                </div>
                <span className={`text-xs rotate-45 origin-left whitespace-nowrap ${isToday ? "font-bold text-blue-600 dark:text-blue-400" : "text-slate-400"}`} style={{ fontSize: "9px" }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject breakdown */}
      {bySubject.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5">By Subject</h2>
          <div className="space-y-3">
            {bySubject.map(({ subject, minutes, xp }) => {
              const pct = Math.round((minutes / totalMinutes) * 100);
              const color = SUBJECT_COLORS[subject] ?? "#3b82f6";
              return (
                <div key={subject}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{subject}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">+{xp} XP</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{minutes}m</span>
                      <span className="text-xs text-slate-400">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      {progress.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Recent Sessions</h2>
          <div className="space-y-2">
            {progress.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: SUBJECT_COLORS[p.subject] ?? "#3b82f6" }} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.subject}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(p.date + "T12:00:00").toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}
                      {p.topic ? ` · ${p.topic}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{p.minutes_studied}m</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">+{p.xp_earned} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
