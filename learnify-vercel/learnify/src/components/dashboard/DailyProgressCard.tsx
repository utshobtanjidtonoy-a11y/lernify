"use client";

import { formatMinutes } from "@/lib/xpLevels";

interface Props {
  todayMinutes: number;
  todayXP: number;
  tasksDone: number;
  tasksTotal: number;
  routinesDone: number;
  routinesTotal: number;
  routinesPct: number;
}

const DAILY_GOAL_MINUTES = 60; // 1 hour daily goal

export default function DailyProgressCard({
  todayMinutes, todayXP,
  tasksDone, tasksTotal,
  routinesDone, routinesTotal, routinesPct,
}: Props) {
  const studyPct  = Math.min(Math.round((todayMinutes / DAILY_GOAL_MINUTES) * 100), 100);
  const taskPct   = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
  const overGoal  = todayMinutes > DAILY_GOAL_MINUTES;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Today's Progress</p>
        {todayXP > 0 && (
          <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 px-2.5 py-1 rounded-full">
            +{todayXP} XP today
          </span>
        )}
      </div>

      <div className="space-y-5">
        {/* Study time */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">📚</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Study Time</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatMinutes(todayMinutes)}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500"> / {DAILY_GOAL_MINUTES}m goal</span>
            </div>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${overGoal ? "bg-gradient-to-r from-green-400 to-green-500" : "bg-gradient-to-r from-blue-500 to-blue-400"}`}
              style={{ width: `${studyPct}%` }}
            />
          </div>
          <p className="text-xs mt-1 text-right font-medium">
            {overGoal
              ? <span className="text-green-600 dark:text-green-400">🎉 Goal crushed! +{todayMinutes - DAILY_GOAL_MINUTES}m extra</span>
              : <span className="text-slate-400 dark:text-slate-500">{studyPct}% — {DAILY_GOAL_MINUTES - todayMinutes}m left to goal</span>
            }
          </p>
        </div>

        {/* Tasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">✅</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tasks</span>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {tasksDone}<span className="text-slate-400 dark:text-slate-500 font-normal">/{tasksTotal}</span>
            </span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
              style={{ width: `${taskPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">{taskPct}% complete</p>
        </div>

        {/* Routines */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🗓️</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Routines</span>
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {routinesTotal === 0 ? "—" : <>{routinesDone}<span className="text-slate-400 dark:text-slate-500 font-normal">/{routinesTotal}</span></>}
            </span>
          </div>
          <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-700"
              style={{ width: `${routinesPct}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">
            {routinesTotal === 0 ? "No routines scheduled today" : `${routinesPct}% done`}
          </p>
        </div>
      </div>
    </div>
  );
}
