import { formatMinutes, formatXP, getXPLevel } from "@/lib/xpLevels";

interface Props {
  streakDays: number;
  xpPoints: number;
  todayMinutes: number;
  routinesDone: number;
  routinesTotal: number;
  routinesPct: number;
  weeklyMinutes: number;
}

export default function StatsRow({
  streakDays, xpPoints, todayMinutes,
  routinesDone, routinesTotal, routinesPct, weeklyMinutes,
}: Props) {
  const lvl = getXPLevel(xpPoints);

  const cards = [
    {
      icon: "🔥",
      label: "Day Streak",
      value: `${streakDays}`,
      unit: streakDays === 1 ? "day" : "days",
      sub: streakDays >= 7 ? "🏆 Weekly goal!" : streakDays > 0 ? "Keep it up!" : "Start today!",
      gradient: "from-orange-400 to-orange-500",
      ring: "ring-orange-200 dark:ring-orange-900",
    },
    {
      icon: "⭐",
      label: "XP Points",
      value: formatXP(xpPoints),
      unit: `Level ${lvl.level}`,
      sub: lvl.title,
      gradient: "from-yellow-400 to-yellow-500",
      ring: "ring-yellow-200 dark:ring-yellow-900",
    },
    {
      icon: "📚",
      label: "Studied Today",
      value: todayMinutes >= 60
        ? `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`
        : `${todayMinutes}m`,
      unit: "today",
      sub: `${formatMinutes(weeklyMinutes)} this week`,
      gradient: "from-blue-500 to-blue-600",
      ring: "ring-blue-200 dark:ring-blue-900",
    },
    {
      icon: "🗓️",
      label: "Routines Today",
      value: routinesTotal === 0 ? "—" : `${routinesDone}/${routinesTotal}`,
      unit: routinesTotal === 0 ? "none scheduled" : `${routinesPct}% done`,
      sub: routinesPct === 100 ? "🎉 All done!" : routinesTotal === 0 ? "Check routines page" : `${routinesTotal - routinesDone} remaining`,
      gradient: "from-violet-500 to-violet-600",
      ring: "ring-violet-200 dark:ring-violet-900",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className={`w-11 h-11 bg-gradient-to-br ${c.gradient} rounded-xl flex items-center justify-center text-xl mb-3 ring-4 ${c.ring}`}>
            {c.icon}
          </div>
          <div className="flex items-end gap-1.5 mb-0.5">
            <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{c.value}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">{c.unit}</p>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{c.label}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}
