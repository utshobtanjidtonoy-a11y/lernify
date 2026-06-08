import type { XPLevel } from "@/lib/database/types";

export const XP_LEVELS: XPLevel[] = [
  { level: 1,  title: "Newcomer",     minXP: 0,     maxXP: 100,   color: "#94a3b8" },
  { level: 2,  title: "Curious",      minXP: 100,   maxXP: 300,   color: "#60a5fa" },
  { level: 3,  title: "Explorer",     minXP: 300,   maxXP: 600,   color: "#34d399" },
  { level: 4,  title: "Student",      minXP: 600,   maxXP: 1000,  color: "#a78bfa" },
  { level: 5,  title: "Scholar",      minXP: 1000,  maxXP: 1500,  color: "#f59e0b" },
  { level: 6,  title: "Apprentice",   minXP: 1500,  maxXP: 2200,  color: "#f97316" },
  { level: 7,  title: "Learner",      minXP: 2200,  maxXP: 3000,  color: "#ec4899" },
  { level: 8,  title: "Achiever",     minXP: 3000,  maxXP: 4000,  color: "#14b8a6" },
  { level: 9,  title: "Expert",       minXP: 4000,  maxXP: 5500,  color: "#6366f1" },
  { level: 10, title: "Master",       minXP: 5500,  maxXP: 7500,  color: "#eab308" },
  { level: 11, title: "Champion",     minXP: 7500,  maxXP: 10000, color: "#ef4444" },
  { level: 12, title: "Legend",       minXP: 10000, maxXP: 99999, color: "#3b82f6" },
];

export function getXPLevel(xp: number): XPLevel & { progress: number } {
  // findLast polyfill for broader compatibility
  let level = XP_LEVELS[0];
  for (const l of XP_LEVELS) {
    if (xp >= l.minXP) level = l;
  }
  const next   = XP_LEVELS.find((l) => l.level === level.level + 1);
  const range  = (next?.minXP ?? level.maxXP) - level.minXP;
  const earned = xp - level.minXP;
  const progress = next ? Math.min(Math.round((earned / range) * 100), 100) : 100;
  return { ...level, progress };
}

export function formatXP(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toString();
}

export function formatMinutes(mins: number): string {
  if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${mins}m`;
}
