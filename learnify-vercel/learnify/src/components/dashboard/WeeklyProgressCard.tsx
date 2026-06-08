"use client";

import { useState } from "react";
import type { WeeklyData } from "@/lib/database/types";
import { formatMinutes } from "@/lib/xpLevels";

interface Props {
  weeklyData: WeeklyData[];
  weeklyMinutes: number;
  weeklyXP: number;
}

export default function WeeklyProgressCard({ weeklyData, weeklyMinutes, weeklyXP }: Props) {
  const [mode, setMode] = useState<"minutes" | "xp">("minutes");

  const values   = weeklyData.map((d) => mode === "minutes" ? d.minutes : d.xp);
  const maxVal   = Math.max(...values, 1);
  const avgDaily = weeklyMinutes > 0 ? Math.round(weeklyMinutes / 7) : 0;

  // Best day
  const bestDay = weeklyData.reduce((best, d) =>
    d.minutes > (best?.minutes ?? 0) ? d : best, weeklyData[0]
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Weekly Progress</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {mode === "minutes" ? formatMinutes(weeklyMinutes) : `${weeklyXP} XP`}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {mode === "minutes" ? `avg ${formatMinutes(avgDaily)}/day` : `avg ${Math.round(weeklyXP / 7)} XP/day`}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
          {(["minutes", "xp"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                mode === m
                  ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {m === "minutes" ? "⏱ Time" : "⭐ XP"}
            </button>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-28 mb-3">
        {weeklyData.map((d, i) => {
          const val    = mode === "minutes" ? d.minutes : d.xp;
          const pct    = (val / maxVal) * 100;
          const isBest = d.date === bestDay?.date && val > 0;

          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 group relative">
              {/* Tooltip */}
              {val > 0 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-10 font-semibold">
                  {mode === "minutes" ? formatMinutes(val) : `+${val} XP`}
                </div>
              )}

              {/* Bar */}
              <div className="w-full flex items-end" style={{ height: "88px" }}>
                <div
                  className={`w-full rounded-t-xl transition-all duration-700 ${
                    d.isToday
                      ? "bg-gradient-to-t from-blue-600 to-blue-400"
                      : isBest
                      ? "bg-gradient-to-t from-yellow-500 to-yellow-300"
                      : "bg-gradient-to-t from-blue-200 to-blue-100 dark:from-blue-900/80 dark:to-blue-800/40"
                  }`}
                  style={{ height: `${Math.max(pct * 0.88, val > 0 ? 8 : 2)}px` }}
                />
              </div>

              {/* Day label */}
              <span className={`text-xs font-semibold ${
                d.isToday ? "text-blue-600 dark:text-blue-400" :
                isBest    ? "text-yellow-600 dark:text-yellow-400" :
                "text-slate-400 dark:text-slate-500"
              }`}>
                {d.dayLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Best day callout */}
      {bestDay && bestDay.minutes > 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-xl border border-yellow-100 dark:border-yellow-900/40">
          <span className="text-base">🏅</span>
          <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-400">
            Best day: <span className="font-bold">{bestDay.dayLabel}</span> — {formatMinutes(bestDay.minutes)} studied, +{bestDay.xp} XP
          </p>
        </div>
      )}

      {/* No data placeholder */}
      {weeklyMinutes === 0 && (
        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <span className="text-base">📖</span>
          <p className="text-xs text-slate-500 dark:text-slate-400">No study sessions this week yet. Log one to get started!</p>
        </div>
      )}
    </div>
  );
}
