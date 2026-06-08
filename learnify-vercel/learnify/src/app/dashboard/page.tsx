import { createClient }            from "@/lib/supabase/server";
import { getStudentDashboardData, refreshStreak } from "@/lib/database/queries";
import StatsRow            from "@/components/dashboard/StatsRow";
import XPCard              from "@/components/dashboard/XPCard";
import StreakCard          from "@/components/dashboard/StreakCard";
import DailyProgressCard   from "@/components/dashboard/DailyProgressCard";
import WeeklyProgressCard  from "@/components/dashboard/WeeklyProgressCard";
import SubjectProgressCard from "@/components/dashboard/SubjectProgressCard";
import QuickStatsBar       from "@/components/dashboard/QuickStatsBar";
import TasksWidget         from "@/components/dashboard/TasksWidget";
import StudyLogWidget      from "@/components/dashboard/StudyLogWidget";
import type { Metadata }   from "next";

export const metadata: Metadata = { title: "Dashboard — Learnify" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Refresh streak (no-op if already done today)
  await refreshStreak(user.id);

  const data = await getStudentDashboardData(user.id);

  const name      = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Learner";
  const firstName = name.split(" ")[0];
  const hour      = new Date().getHours();
  const greeting  =
    hour < 12 ? "Good morning" :
    hour < 18 ? "Good afternoon" : "Good evening";

  const totalSessions = data.subjectStats.reduce((s, sub) => s + sub.sessions, 0);

  // Recent progress for StudyLogWidget (last 7 days from weeklyData dates)
  const recentProgressForWidget = await (async () => {
    const { data: rows } = await (await createClient())
      .from("study_progress")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", data.weeklyData[0]?.date ?? new Date().toISOString().split("T")[0])
      .order("date", { ascending: false });
    return rows ?? [];
  })();

  return (
    <div className="space-y-6 pb-8">

      {/* ── Greeting ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {data.stats.streak_days > 0
              ? `🔥 ${data.stats.streak_days}-day streak — keep it going!`
              : "Ready to start your learning journey today?"}
          </p>
        </div>
        {/* Today's date */}
        <div className="hidden sm:block text-right flex-shrink-0">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {new Date().toLocaleDateString("en", { weekday: "long" })}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {new Date().toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* ── Top stats row ─────────────────────────────────────────── */}
      <StatsRow
        streakDays={data.stats.streak_days}
        xpPoints={data.stats.xp_points}
        todayMinutes={data.todayMinutes}
        routinesDone={data.routineProgress.done}
        routinesTotal={data.routineProgress.total}
        routinesPct={data.routineProgress.percentage}
        weeklyMinutes={data.weeklyMinutes}
      />

      {/* ── All-time banner ───────────────────────────────────────── */}
      <QuickStatsBar
        allTimeMinutes={data.allTimeMinutes}
        xpPoints={data.stats.xp_points}
        longestStreak={data.longestStreak}
        totalSessions={totalSessions}
      />

      {/* ── Main grid: XP + Streak ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <XPCard xp={data.stats.xp_points} />
        <StreakCard
          streakDays={data.stats.streak_days}
          longestStreak={data.longestStreak}
          calendar={data.streakCalendar}
        />
      </div>

      {/* ── Daily + Weekly progress ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyProgressCard
          todayMinutes={data.todayMinutes}
          todayXP={data.todayXP}
          tasksDone={data.stats.tasks_done_today}
          tasksTotal={data.stats.tasks_total_today}
          routinesDone={data.routineProgress.done}
          routinesTotal={data.routineProgress.total}
          routinesPct={data.routineProgress.percentage}
        />
        <WeeklyProgressCard
          weeklyData={data.weeklyData}
          weeklyMinutes={data.weeklyMinutes}
          weeklyXP={data.weeklyXP}
        />
      </div>

      {/* ── Subject progress ─────────────────────────────────────── */}
      <SubjectProgressCard
        subjects={data.subjectStats}
        allTimeMinutes={data.allTimeMinutes}
      />

      {/* ── Tasks + Study log ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TasksWidget userId={user.id} />
        <StudyLogWidget userId={user.id} recentProgress={recentProgressForWidget} />
      </div>

    </div>
  );
}
