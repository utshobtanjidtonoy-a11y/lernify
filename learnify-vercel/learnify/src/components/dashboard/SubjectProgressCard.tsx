"use client";

import { useState } from "react";
import type { SubjectStat } from "@/lib/database/types";
import { formatMinutes } from "@/lib/xpLevels";

interface Props {
  subjects: SubjectStat[];
  allTimeMinutes: number;
}

export default function SubjectProgressCard({ subjects, allTimeMinutes }: Props) {
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? subjects : subjects.slice(0, 4);

  const formatDate = (d: string | null) => {
    if (!d) return "Never";
    const date = new Date(d + "T12:00:00");
    const today = new Date().toISOString().split("T")[0];
    const yest  = new Date(); yest.setDate(yest.getDate() - 1);
    if (d === today) return "Today";
    if (d === yest.toISOString().split("T")[0]) return "Yesterday";
    return date.toLocaleDateString("en", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Subject Progress</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {subjects.length > 0
              ? `${subjects.length} subject${subjects.length > 1 ? "s" : ""} · ${formatMinutes(allTimeMinutes)} total`
              : "No sessions logged yet"}
          </p>
        </div>
        {subjects.length > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{subjects.length}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">subjects</p>
          </div>
        )}
      </div>

      {subjects.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-3xl mb-3">📚</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No subjects yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Log a study session to track subject progress.
          </p>
        </div>
      ) : (
        <>
          {/* Subject rows */}
          <div className="space-y-4">
            {visible.map((s, i) => (
              <div key={s.subject}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    {/* Rank badge */}
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                      style={{ backgroundColor: s.color }}>
                      {i + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{s.subject}</span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">{s.xp_total} XP</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{formatMinutes(s.minutes_total)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${s.percentage}%`, backgroundColor: s.color }}
                  />
                </div>

                {/* Sub-info */}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {s.sessions} session{s.sessions !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    Last: {formatDate(s.last_studied)} · {s.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Show more / less */}
          {subjects.length > 4 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-5 w-full py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl transition-colors duration-200"
            >
              {expanded ? "Show less ▲" : `Show ${subjects.length - 4} more ▼`}
            </button>
          )}

          {/* All-time summary pills */}
          <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800 flex flex-wrap gap-2">
            {subjects.slice(0, 3).map((s) => (
              <div
                key={s.subject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: s.color + "18", color: s.color }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.subject} · {s.percentage}%
              </div>
            ))}
            {subjects.length > 3 && (
              <div className="flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                +{subjects.length - 3} more
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
