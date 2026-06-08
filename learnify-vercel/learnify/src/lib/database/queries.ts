import { createClient } from "@/lib/supabase/server";
import type {
  Profile,
  Routine, RoutineInsert, RoutineUpdate,
  Task, TaskInsert, TaskUpdate,
  StudyProgress, StudyProgressInsert, StudyProgressUpdate,
  DashboardStats,
  WeeklyData, SubjectStat, StreakCalendarDay,
} from "./types";

// ── PROFILES ─────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export async function upsertProfile(
  userId: string,
  updates: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>
): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...updates })
    .select()
    .single();
  return data;
}

// Update streak: call once per day on dashboard load
export async function refreshStreak(userId: string): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: profile } = await supabase
    .from("profiles")
    .select("last_active, streak_days")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const last = profile.last_active;
  if (last === today) return; // already updated today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const newStreak = last === yesterdayStr ? (profile.streak_days ?? 0) + 1 : 1;

  await supabase
    .from("profiles")
    .update({ last_active: today, streak_days: newStreak })
    .eq("id", userId);
}

// ── ROUTINES ─────────────────────────────────────────────────────

export async function getRoutines(userId: string): Promise<Routine[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routines")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createRoutine(routine: RoutineInsert): Promise<Routine | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routines")
    .insert(routine)
    .select()
    .single();
  return data;
}

export async function updateRoutine(id: string, updates: RoutineUpdate): Promise<Routine | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("routines")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return data;
}

export async function deleteRoutine(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("routines").delete().eq("id", id);
}

// ── TASKS ────────────────────────────────────────────────────────

export async function getTasks(userId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getTodayTasks(userId: string): Promise<Task[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .or(`due_date.eq.${today},due_date.is.null`)
    .neq("status", "done")
    .order("priority", { ascending: false });
  return data ?? [];
}

export async function createTask(task: TaskInsert): Promise<Task | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .insert(task)
    .select()
    .single();
  return data;
}

export async function updateTask(id: string, updates: TaskUpdate): Promise<Task | null> {
  const supabase = await createClient();

  // Auto-set completed_at when marking done
  if (updates.status === "done" && !updates.completed_at) {
    updates.completed_at = new Date().toISOString();
  }
  if (updates.status !== "done") {
    updates.completed_at = null;
  }

  const { data } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
}

// ── STUDY PROGRESS ───────────────────────────────────────────────

export async function getStudyProgress(
  userId: string,
  days = 7
): Promise<StudyProgress[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const { data } = await supabase
    .from("study_progress")
    .select("*")
    .eq("user_id", userId)
    .gte("date", sinceStr)
    .order("date", { ascending: false });
  return data ?? [];
}

export async function logStudySession(
  entry: StudyProgressInsert
): Promise<StudyProgress | null> {
  const supabase = await createClient();

  // Upsert: if same user+subject+date exists, add minutes
  const { data: existing } = await supabase
    .from("study_progress")
    .select("id, minutes_studied, xp_earned")
    .eq("user_id", entry.user_id)
    .eq("subject", entry.subject)
    .eq("date", entry.date ?? new Date().toISOString().split("T")[0])
    .maybeSingle();

  if (existing) {
    const { data } = await supabase
      .from("study_progress")
      .update({
        minutes_studied: existing.minutes_studied + entry.minutes_studied,
        xp_earned: existing.xp_earned + entry.xp_earned,
        topic: entry.topic,
        notes: entry.notes,
      })
      .eq("id", existing.id)
      .select()
      .single();
    return data;
  }

  const { data } = await supabase
    .from("study_progress")
    .insert(entry)
    .select()
    .single();
  return data;
}

// ── DASHBOARD STATS (aggregated) ─────────────────────────────────

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const today = new Date().toISOString().split("T")[0];
  const supabase = await createClient();

  const [profileRes, minutesRes, tasksRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("xp_points, streak_days")
      .eq("id", userId)
      .single(),

    supabase
      .from("study_progress")
      .select("minutes_studied")
      .eq("user_id", userId)
      .eq("date", today),

    supabase
      .from("tasks")
      .select("status")
      .eq("user_id", userId)
      .or(`due_date.eq.${today},due_date.is.null`),
  ]);

  const totalMinutes = (minutesRes.data ?? []).reduce(
    (sum, r) => sum + r.minutes_studied, 0
  );
  const allTasks = tasksRes.data ?? [];
  const doneTasks = allTasks.filter((t) => t.status === "done").length;

  return {
    xp_points: profileRes.data?.xp_points ?? 0,
    streak_days: profileRes.data?.streak_days ?? 0,
    total_minutes_today: totalMinutes,
    tasks_done_today: doneTasks,
    tasks_total_today: allTasks.length,
  };
}

// ── ROUTINES WITH TODAY'S COMPLETION STATUS ───────────────────────
export async function getRoutinesWithStatus(userId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [routinesRes, completionsRes, allCompletionsRes] = await Promise.all([
    supabase
      .from("routines")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),

    // Today's completions
    supabase
      .from("routine_completions")
      .select("id, routine_id")
      .eq("user_id", userId)
      .eq("completed_on", today),

    // Total completions per routine (all time)
    supabase
      .from("routine_completions")
      .select("routine_id")
      .eq("user_id", userId),
  ]);

  const todayMap = new Map(
    (completionsRes.data ?? []).map((c: any) => [c.routine_id, c.id])
  );
  const totalMap = new Map<string, number>();
  for (const c of allCompletionsRes.data ?? []) {
    totalMap.set(c.routine_id, (totalMap.get(c.routine_id) ?? 0) + 1);
  }

  return (routinesRes.data ?? []).map((r: any) => ({
    ...r,
    is_completed_today: todayMap.has(r.id),
    completion_id: todayMap.get(r.id) ?? null,
    total_completions: totalMap.get(r.id) ?? 0,
  }));
}

// ── DAILY PROGRESS % (today's scheduled routines done/total) ─────
export async function getDailyRoutineProgress(userId: string): Promise<{
  done: number;
  total: number;
  percentage: number;
}> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const todayDow = new Date().getDay(); // 0=Sun

  // Active routines scheduled for today
  const { data: scheduled } = await supabase
    .from("routines")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .contains("days_of_week", [todayDow]);

  const total = scheduled?.length ?? 0;
  if (total === 0) return { done: 0, total: 0, percentage: 0 };

  const scheduledIds = scheduled!.map((r) => r.id);
  const { data: completions } = await supabase
    .from("routine_completions")
    .select("routine_id")
    .eq("user_id", userId)
    .eq("completed_on", today)
    .in("routine_id", scheduledIds);

  const done = completions?.length ?? 0;
  return { done, total, percentage: Math.round((done / total) * 100) };
}

// ── 30-DAY COMPLETION HISTORY (for streak/calendar) ──────────────
export async function getRoutineCompletionHistory(userId: string, days = 30) {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("routine_completions")
    .select("completed_on, routine_id")
    .eq("user_id", userId)
    .gte("completed_on", since.toISOString().split("T")[0])
    .order("completed_on", { ascending: false });

  return data ?? [];
}

// ── FULL STUDENT DASHBOARD DATA ───────────────────────────────────
export async function getStudentDashboardData(userId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const todayDow = new Date().getDay();

  // Build date ranges
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 27);
  const allTimeStart = "2024-01-01";

  const [
    profileRes,
    todayProgressRes,
    weekProgressRes,
    allProgressRes,
    tasksRes,
    scheduledRoutinesRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),

    supabase.from("study_progress").select("*")
      .eq("user_id", userId).eq("date", today),

    supabase.from("study_progress").select("*")
      .eq("user_id", userId)
      .gte("date", weekAgo.toISOString().split("T")[0])
      .order("date", { ascending: true }),

    supabase.from("study_progress").select("*")
      .eq("user_id", userId)
      .gte("date", allTimeStart)
      .order("date", { ascending: false }),

    supabase.from("tasks").select("status")
      .eq("user_id", userId)
      .or(`due_date.eq.${today},due_date.is.null`),

    supabase.from("routines").select("id")
      .eq("user_id", userId).eq("is_active", true)
      .contains("days_of_week", [todayDow]),
  ]);

  const profile = profileRes.data;
  const allProgress = allProgressRes.data ?? [];
  const weekProgress = weekProgressRes.data ?? [];
  const todayProgress = todayProgressRes.data ?? [];

  // ── Today stats ───────────────────────────────────────────────
  const todayMinutes = todayProgress.reduce((s, p) => s + p.minutes_studied, 0);
  const todayXP      = todayProgress.reduce((s, p) => s + p.xp_earned, 0);

  // ── Tasks ────────────────────────────────────────────────────
  const allTasks    = tasksRes.data ?? [];
  const doneTasks   = allTasks.filter((t) => t.status === "done").length;

  // ── Routine daily progress ───────────────────────────────────
  let routineProgress = { done: 0, total: 0, percentage: 0 };
  const scheduledIds = (scheduledRoutinesRes.data ?? []).map((r) => r.id);
  if (scheduledIds.length > 0) {
    const { data: completions } = await supabase
      .from("routine_completions")
      .select("routine_id")
      .eq("user_id", userId)
      .eq("completed_on", today)
      .in("routine_id", scheduledIds);
    const done2 = completions?.length ?? 0;
    routineProgress = {
      done: done2,
      total: scheduledIds.length,
      percentage: Math.round((done2 / scheduledIds.length) * 100),
    };
  }

  // ── Weekly chart (last 7 days) ────────────────────────────────
  const weeklyData: WeeklyData[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const date = d.toISOString().split("T")[0];
    const dayLabel = d.toLocaleDateString("en", { weekday: "short" });
    const rows = weekProgress.filter((p) => p.date === date);
    return {
      date, dayLabel,
      minutes: rows.reduce((s, p) => s + p.minutes_studied, 0),
      xp:      rows.reduce((s, p) => s + p.xp_earned, 0),
      isToday: date === today,
    };
  });

  const weeklyMinutes = weeklyData.reduce((s, d) => s + d.minutes, 0);
  const weeklyXP      = weeklyData.reduce((s, d) => s + d.xp, 0);

  // ── Subject breakdown (all time) ─────────────────────────────
  const SUBJECT_COLORS: Record<string, string> = {
    Mathematics:"#3b82f6", Physics:"#8b5cf6", Chemistry:"#10b981",
    Biology:"#f59e0b", History:"#ef4444", English:"#ec4899", Other:"#06b6d4",
  };
  const subjectMap = new Map<string, { minutes: number; xp: number; sessions: number; last: string }>();
  for (const p of allProgress) {
    const cur = subjectMap.get(p.subject) ?? { minutes: 0, xp: 0, sessions: 0, last: "" };
    subjectMap.set(p.subject, {
      minutes:  cur.minutes  + p.minutes_studied,
      xp:       cur.xp       + p.xp_earned,
      sessions: cur.sessions + 1,
      last: cur.last < p.date ? p.date : cur.last,
    });
  }
  const allTimeMinutes = allProgress.reduce((s, p) => s + p.minutes_studied, 0);
  const subjectStats: SubjectStat[] = Array.from(subjectMap.entries())
    .sort((a, b) => b[1].minutes - a[1].minutes)
    .map(([subject, s]) => ({
      subject,
      minutes_total: s.minutes,
      xp_total:      s.xp,
      sessions:      s.sessions,
      last_studied:  s.last || null,
      color:         SUBJECT_COLORS[subject] ?? "#3b82f6",
      percentage:    allTimeMinutes > 0 ? Math.round((s.minutes / allTimeMinutes) * 100) : 0,
    }));

  // ── 28-day streak calendar ────────────────────────────────────
  const studiedDates = new Map(allProgress.map((p: any) => [p.date, p.minutes_studied]));
  const streakCalendar: StreakCalendarDay[] = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (27 - i));
    const date = d.toISOString().split("T")[0];
    const minutes = studiedDates.get(date) ?? 0;
    return { date, studied: minutes > 0, minutes };
  });

  // ── Longest streak (from all-time data) ──────────────────────
  const uniqueDates = [...new Set(allProgress.map((p) => p.date))].sort();
  let longest = 0, cur = 0, prev = "";
  for (const date of uniqueDates) {
    if (prev) {
      const diff = (new Date(date).getTime() - new Date(prev).getTime()) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    } else { cur = 1; }
    longest = Math.max(longest, cur);
    prev = date;
  }

  return {
    profile: profile ?? { id: userId, full_name: null, avatar_url: null, bio: null,
      xp_points: 0, streak_days: 0, last_active: null,
      created_at: "", updated_at: "" },
    stats: {
      xp_points:           profile?.xp_points      ?? 0,
      streak_days:         profile?.streak_days     ?? 0,
      total_minutes_today: todayMinutes,
      tasks_done_today:    doneTasks,
      tasks_total_today:   allTasks.length,
    },
    routineProgress,
    weeklyData,
    subjectStats,
    streakCalendar,
    todayMinutes,
    todayXP,
    weeklyMinutes,
    weeklyXP,
    allTimeMinutes,
    longestStreak: Math.max(longest, profile?.streak_days ?? 0),
  };
}
