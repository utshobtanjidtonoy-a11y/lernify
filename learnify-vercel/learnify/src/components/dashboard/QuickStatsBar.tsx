import { formatMinutes } from "@/lib/xpLevels";

interface Props {
  allTimeMinutes: number;
  xpPoints: number;
  longestStreak: number;
  totalSessions: number;
}

export default function QuickStatsBar({
  allTimeMinutes, xpPoints, longestStreak, totalSessions,
}: Props) {
  const items = [
    { label: "All-Time Study",  value: formatMinutes(allTimeMinutes), icon: "⏱" },
    { label: "Total XP",        value: xpPoints.toLocaleString(),     icon: "⭐" },
    { label: "Longest Streak",  value: `${longestStreak}d`,           icon: "🏆" },
    { label: "Sessions Logged", value: totalSessions.toLocaleString(), icon: "📊" },
  ];

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item, i) => (
          <div key={item.label} className={`text-center ${i < items.length - 1 ? "lg:border-r lg:border-white/20" : ""}`}>
            <p className="text-2xl mb-1">{item.icon}</p>
            <p className="text-xl font-bold text-white">{item.value}</p>
            <p className="text-xs text-blue-200 font-medium">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
