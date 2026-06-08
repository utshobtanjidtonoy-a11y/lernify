// ── Supabase Database Types ──────────────────────────────────────
// Matches schema.sql exactly

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

// ── profiles ────────────────────────────────────────────────────
export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  xp_points: number;
  streak_days: number;
  last_active: string | null; // date string YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

// ── routines ────────────────────────────────────────────────────
export interface Routine {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  color: string;
  days_of_week: number[]; // 0=Sun … 6=Sat
  start_time: string | null; // "HH:MM:SS"
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type RoutineInsert = Omit<Routine, "id" | "created_at" | "updated_at">;
export type RoutineUpdate = Partial<Omit<Routine, "id" | "user_id" | "created_at" | "updated_at">>;

// ── tasks ────────────────────────────────────────────────────────
export interface Task {
  id: string;
  user_id: string;
  routine_id: string | null;
  title: string;
  description: string | null;
  subject: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null; // date string YYYY-MM-DD
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskInsert = Omit<Task, "id" | "created_at" | "updated_at">;
export type TaskUpdate = Partial<Omit<Task, "id" | "user_id" | "created_at" | "updated_at">>;

// ── study_progress ───────────────────────────────────────────────
export interface StudyProgress {
  id: string;
  user_id: string;
  subject: string;
  topic: string | null;
  minutes_studied: number;
  date: string; // YYYY-MM-DD
  notes: string | null;
  xp_earned: number;
  created_at: string;
  updated_at: string;
}

export type StudyProgressInsert = Omit<StudyProgress, "id" | "created_at" | "updated_at">;
export type StudyProgressUpdate = Partial<Omit<StudyProgress, "id" | "user_id" | "created_at" | "updated_at">>;

// ── Dashboard summary (assembled from multiple tables) ───────────
export interface DashboardStats {
  xp_points: number;
  streak_days: number;
  total_minutes_today: number;
  tasks_done_today: number;
  tasks_total_today: number;
}

// ── routine_completions ──────────────────────────────────────────
export interface RoutineCompletion {
  id: string;
  routine_id: string;
  user_id: string;
  completed_on: string; // YYYY-MM-DD
  note: string | null;
  created_at: string;
}

export type RoutineCompletionInsert = Omit<RoutineCompletion, "id" | "created_at">;

// ── Routine with today's completion status ───────────────────────
export interface RoutineWithStatus extends Routine {
  is_completed_today: boolean;
  completion_id: string | null;
  total_completions: number;
}

// ── Full Student Dashboard data ──────────────────────────────────
export interface XPLevel {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  color: string;
}

export interface WeeklyData {
  date: string;          // YYYY-MM-DD
  dayLabel: string;      // "Mon"
  minutes: number;
  xp: number;
  isToday: boolean;
}

export interface SubjectStat {
  subject: string;
  minutes_total: number;
  xp_total: number;
  sessions: number;
  last_studied: string | null;
  color: string;
  percentage: number;
}

export interface StreakCalendarDay {
  date: string;
  studied: boolean;
  minutes: number;
}

export interface StudentDashboardData {
  profile: Profile;
  stats: DashboardStats;
  routineProgress: { done: number; total: number; percentage: number };
  weeklyData: WeeklyData[];
  subjectStats: SubjectStat[];
  streakCalendar: StreakCalendarDay[];   // last 28 days
  todayMinutes: number;
  todayXP: number;
  weeklyMinutes: number;
  weeklyXP: number;
  allTimeMinutes: number;
  longestStreak: number;
}

// ── Formula Hub Types ────────────────────────────────────────────
export type FormulaDifficulty = "beginner" | "intermediate" | "advanced";

export interface FormulaVariable {
  symbol: string;
  name: string;
  unit: string;
  description: string;
}

export interface FormulaSubject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface FormulaChapter {
  id: string;
  subject_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Formula {
  id: string;
  chapter_id: string;
  subject_id: string;
  title: string;
  formula_latex: string;
  formula_plain: string;
  description: string | null;
  derivation: string | null;
  variables: FormulaVariable[];
  example: string | null;
  notes: string | null;
  tags: string[];
  difficulty: FormulaDifficulty;
  is_important: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Joined types
export interface FormulaWithRelations extends Formula {
  chapter: FormulaChapter;
  subject: FormulaSubject;
  is_bookmarked?: boolean;
}

export interface ChapterWithFormulas extends FormulaChapter {
  formulas: Formula[];
  formula_count: number;
}

export interface SubjectWithChapters extends FormulaSubject {
  chapters: ChapterWithFormulas[];
  total_formulas: number;
}
