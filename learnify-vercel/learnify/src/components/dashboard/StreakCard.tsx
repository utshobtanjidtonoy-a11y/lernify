"use client";

import type { StreakCalendarDay } from "@/lib/database/types";

interface Props {
  streakDays: number;
  longestStreak: number;
  calendar: StreakCalendarDay[];
}

export default function StreakCard({ streakDays, longestStreak, calendar }: Props) {
  const maxMinutes = Math.max(...calendar.map((d) => d.minutes), 1);

  // Split 28 days into 4 rows of 7
  const weeks: StreakCalendarDay[][] = [];
  for (let i = 0; i < 4; i++) weeks.push(calendar.slice(i * 7, i * 7 + 7));

  const today = new Date().toISOString().split("T")[0];
  const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
      {/* Header row */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Study Streak</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl">🔥</span>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{streakDays}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{streakDays === 1 ? "day" : "days"} in a row</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Best streak</p>
          <p className="text-xl font-bold text-orange-500">🏆 {longestStreak}d</p>
        </div>
      </div>

      {/* Streak message */}
      <div className={`mb-5 px-3 py-2 rounded-xl text-xs font-semibold ${
        streakDays >= 7  ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400" :
        streakDays >= 3  ? "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400" :
        streakDays >= 1  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400" :
        "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
      }`}>
        {streakDays >= 30 ? "🌟 Legendary! 30-day streak!" :
         streakDays >= 14 ? "🔥 On fire! 2-week streak!" :
         streakDays >= 7  ? "💪 Amazing! 1-week streak!" :
         streakDays >= 3  ? "🚀 Great momentum, keep it up!" :
         streakDays >= 1  ? "✅ Good start! Study tomorrow to grow your streak." :
         "📚 Start studying today to begin your streak!"}
      </div>

      {/* 28-day mini calendar */}
      <div>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">Last 28 days</p>
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_LABELS.map((l) => (
            <div key={l} className="text-center text-[10px] font-bold text-slate-300 dark:text-slate-600">{l}</div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day) => {
                const intensity = day.minutes === 0 ? 0 : Math.ceil((day.minutes / maxMinutes) * 4);
                const isToday = day.date === today;
                const bgClasses = [
                  "bg-slate-100 dark:bg-slate-800",
                  "bg-orange-200 dark:bg-orange-900/60",
                  "bg-orange-300 dark:bg-orange-800",
                  "bg-orange-400 dark:bg-orange-600",
                  "bg-orange-500 dark:bg-orange-500",
                ];
                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.minutes}m studied`}
                    className={`h-7 rounded-md transition-all duration-200 hover:scale-110 cursor-default relative ${bgClasses[intensity]} ${
                      isToday ? "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900" : ""
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 justify-end">
          <span className="text-[10px] text-slate-400">Less</span>
          {["bg-slate-100 dark:bg-slate-800","bg-orange-200","bg-orange-300","bg-orange-400","bg-orange-500"].map((c, i) => (
            <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span className="text-[10px] text-slate-400">More</span>
        </div>
      </div>
    </div>
  );
}
