"use client";

import { getXPLevel, formatXP } from "@/lib/xpLevels";

interface Props { xp: number; }

export default function XPCard({ xp }: Props) {
  const lvl = getXPLevel(xp);
  const next = lvl.level < 12 ? lvl.maxXP : null;
  const needed = next ? next - xp : 0;

  // SVG ring
  const r = 44, circ = 2 * Math.PI * r;
  const dash = (lvl.progress / 100) * circ;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">XP Points</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatXP(xp)}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{xp.toLocaleString()} total XP</p>
        </div>

        {/* Ring */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor"
              strokeOpacity="0.08" strokeWidth="10" className="text-slate-300 dark:text-slate-700"/>
            <circle cx="50" cy="50" r={r} fill="none"
              stroke={lvl.color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
              className="transition-all duration-1000"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{lvl.level}</span>
            <span className="text-[9px] font-bold text-slate-400 leading-none mt-0.5">LVL</span>
          </div>
        </div>
      </div>

      {/* Level badge + progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: lvl.color }}
          >
            {lvl.title}
          </span>
          {next && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {needed.toLocaleString()} XP to Lvl {lvl.level + 1}
            </span>
          )}
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-1000"
            style={{ width: `${lvl.progress}%`, backgroundColor: lvl.color }}
          />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-right">{lvl.progress}% to next level</p>
      </div>
    </div>
  );
}
