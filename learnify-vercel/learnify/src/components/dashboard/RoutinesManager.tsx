"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import {
  createRoutineAction,
  updateRoutineAction,
  deleteRoutineAction,
  toggleRoutineAction,
  toggleCompletionAction,
} from "@/lib/database/routineActions";
import type { RoutineWithStatus } from "@/lib/database/types";

// ── Constants ────────────────────────────────────────────────────
const DAY_LABELS  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SUBJECTS    = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "English", "Other"];
const PALETTE     = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#ec4899","#06b6d4","#f97316"];

interface DailyProgress { done: number; total: number; percentage: number; }
interface HistoryItem   { completed_on: string; routine_id: string; }

interface Props {
  initialRoutines: RoutineWithStatus[];
  dailyProgress: DailyProgress;
  completionHistory: HistoryItem[];
  userId: string;
}

// ── Default form state ───────────────────────────────────────────
const EMPTY_FORM = {
  title: "", description: "", subject: "", start_time: "",
  duration_minutes: "30", color: PALETTE[0], days_of_week: [] as number[],
};

export default function RoutinesManager({
  initialRoutines, dailyProgress, completionHistory, userId,
}: Props) {
  const [routines, setRoutines]           = useState<RoutineWithStatus[]>(initialRoutines);
  const [progress, setProgress]           = useState(dailyProgress);
  const [modal, setModal]                 = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget]       = useState<RoutineWithStatus | null>(null);
  const [form, setForm]                   = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast]                 = useState<string | null>(null);
  const [isPending, startTransition]      = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);

  // Focus title when modal opens
  useEffect(() => {
    if (modal) setTimeout(() => titleRef.current?.focus(), 80);
  }, [modal]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Form helpers ───────────────────────────────────────────────
  const setField = (k: keyof typeof EMPTY_FORM, v: string | number[]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const toggleDay = (d: number) =>
    setField("days_of_week",
      form.days_of_week.includes(d)
        ? form.days_of_week.filter((x) => x !== d)
        : [...form.days_of_week, d]
    );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setModal("create");
  };

  const openEdit = (r: RoutineWithStatus) => {
    setForm({
      title: r.title,
      description: r.description ?? "",
      subject: r.subject ?? "",
      start_time: r.start_time?.slice(0, 5) ?? "",
      duration_minutes: r.duration_minutes.toString(),
      color: r.color,
      days_of_week: [...r.days_of_week],
    });
    setEditTarget(r);
    setModal("edit");
  };

  const closeModal = () => { setModal(null); setEditTarget(null); };

  // ── Recalculate progress from current routines state ──────────
  const recalcProgress = (updated: RoutineWithStatus[]) => {
    const todayDow = new Date().getDay();
    const scheduled = updated.filter(
      (r) => r.is_active && r.days_of_week.includes(todayDow)
    );
    const done = scheduled.filter((r) => r.is_completed_today).length;
    const total = scheduled.length;
    setProgress({ done, total, percentage: total ? Math.round((done / total) * 100) : 0 });
  };

  // ── SUBMIT: Create ─────────────────────────────────────────────
  const handleCreate = () => {
    if (!form.title.trim()) return;
    const fd = buildFormData(form);
    const optimistic: RoutineWithStatus = {
      id: `temp-${Date.now()}`, user_id: userId,
      title: form.title, description: form.description || null,
      subject: form.subject || null, color: form.color,
      days_of_week: form.days_of_week,
      start_time: form.start_time || null,
      duration_minutes: parseInt(form.duration_minutes) || 30,
      is_active: true,
      is_completed_today: false, completion_id: null, total_completions: 0,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    const next = [optimistic, ...routines];
    setRoutines(next);
    recalcProgress(next);
    closeModal();
    setToast("Routine created!");

    startTransition(() => { void (async () => {
      const res = await createRoutineAction(fd);
      if (res?.error) {
        setRoutines((prev) => prev.filter((r) => r.id !== optimistic.id));
        setToast("Error: " + res.error);
      } else if (res?.routine) {
        setRoutines((prev) =>
          prev.map((r) => r.id === optimistic.id
            ? { ...res.routine!, is_completed_today: false, completion_id: null, total_completions: 0 }
            : r
          )
        );
      }
    })(); });
  };

  // ── SUBMIT: Edit ───────────────────────────────────────────────
  const handleEdit = () => {
    if (!editTarget || !form.title.trim()) return;
    const fd = buildFormData(form);
    const next = routines.map((r) =>
      r.id === editTarget.id
        ? { ...r, title: form.title, description: form.description || null,
            subject: form.subject || null, color: form.color,
            days_of_week: form.days_of_week,
            start_time: form.start_time || null,
            duration_minutes: parseInt(form.duration_minutes) || 30 }
        : r
    );
    setRoutines(next);
    recalcProgress(next);
    closeModal();
    setToast("Routine updated!");

    startTransition(() => { void (async () => {
      const res = await updateRoutineAction(editTarget.id, fd);
      if (res?.error) setToast("Error: " + res.error);
    })(); });
  };

  // ── Toggle active ──────────────────────────────────────────────
  const handleToggleActive = (r: RoutineWithStatus) => {
    const next = routines.map((x) =>
      x.id === r.id ? { ...x, is_active: !x.is_active } : x
    );
    setRoutines(next);
    recalcProgress(next);
    startTransition(() => { void toggleRoutineAction(r.id, !r.is_active); });
  };

  // ── Delete ─────────────────────────────────────────────────────
  const handleDelete = (id: string) => {
    const next = routines.filter((r) => r.id !== id);
    setRoutines(next);
    recalcProgress(next);
    setDeleteConfirm(null);
    setToast("Routine deleted.");
    startTransition(() => { void deleteRoutineAction(id); });
  };

  // ── Mark complete / uncomplete ─────────────────────────────────
  const handleToggleComplete = (r: RoutineWithStatus) => {
    const wasCompleted = r.is_completed_today;
    const next = routines.map((x) =>
      x.id === r.id
        ? { ...x,
            is_completed_today: !wasCompleted,
            completion_id: wasCompleted ? null : "optimistic",
            total_completions: wasCompleted ? x.total_completions - 1 : x.total_completions + 1,
          }
        : x
    );
    setRoutines(next);
    recalcProgress(next);

    startTransition(() => { void toggleCompletionAction(r.id, wasCompleted ? r.completion_id : null); });
  };

  // ── Today's schedule ──────────────────────────────────────────
  const todayDow     = new Date().getDay();
  const todayName    = DAY_LABELS[todayDow];
  const todayRoutines = routines.filter(
    (r) => r.is_active && r.days_of_week.includes(todayDow)
  ).sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));

  // 30-day heatmap
  const heatmapDays = buildHeatmap(completionHistory, 30);

  return (
    <div className="space-y-6">

      {/* ── TOAST ──────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-fade-in">
          <span>✓</span> {toast}
        </div>
      )}

      {/* ── DAILY PROGRESS HERO ─────────────────────────────────── */}
      <DailyProgressCard progress={progress} todayName={todayName} />

      {/* ── TODAY'S SCHEDULE ────────────────────────────────────── */}
      {todayRoutines.length > 0 && (
        <TodaySchedule routines={todayRoutines} onToggle={handleToggleComplete} />
      )}

      {/* ── HEATMAP ─────────────────────────────────────────────── */}
      <CompletionHeatmap days={heatmapDays} />

      {/* ── ALL ROUTINES ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            All Routines
            <span className="ml-2 text-sm font-normal text-slate-400">({routines.length})</span>
          </h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors duration-200"
          >
            <PlusIcon /> New Routine
          </button>
        </div>

        {routines.length === 0 ? (
          <EmptyState onCreate={openCreate} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {routines.map((r) => (
              <RoutineCard
                key={r.id}
                routine={r}
                onEdit={() => openEdit(r)}
                onDelete={() => setDeleteConfirm(r.id)}
                onToggleActive={() => handleToggleActive(r)}
                onToggleComplete={() => handleToggleComplete(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL ───────────────────────────────────────────────── */}
      {modal && (
        <RoutineModal
          mode={modal}
          form={form}
          titleRef={titleRef}
          onChange={setField}
          onToggleDay={toggleDay}
          onSubmit={modal === "create" ? handleCreate : handleEdit}
          onClose={closeModal}
          isPending={isPending}
        />
      )}

      {/* ── DELETE CONFIRM ──────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white text-center mb-1">Delete Routine?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-5">
              This will also delete all completion history for this routine. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// DAILY PROGRESS CARD
// ────────────────────────────────────────────────────────────────
function DailyProgressCard({ progress, todayName }: { progress: DailyProgress; todayName: string }) {
  const pct = progress.percentage;
  const circumference = 2 * Math.PI * 40;
  const dash = (pct / 100) * circumference;

  const msg =
    pct === 100 ? "All done! Incredible work 🎉" :
    pct >= 50   ? "Great progress, keep going! 💪" :
    pct > 0     ? "Good start! Stay on track 🚀" :
    progress.total === 0 ? "No routines scheduled for today." :
    "Let's get started! 💪";

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-blue-200 text-sm font-medium mb-1">{todayName}'s Progress</p>
          <h2 className="text-3xl font-bold mb-1">{pct}%</h2>
          <p className="text-blue-100 text-sm">{msg}</p>
          {progress.total > 0 && (
            <p className="text-blue-200 text-xs mt-2">
              {progress.done} of {progress.total} routines completed
            </p>
          )}
        </div>

        {/* Circular progress */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8"/>
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke="white" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {progress.total > 0 && (
        <div className="mt-5">
          <div className="h-2 bg-white/20 rounded-full">
            <div
              className="h-2 bg-white rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// TODAY'S SCHEDULE
// ────────────────────────────────────────────────────────────────
function TodaySchedule({
  routines, onToggle,
}: { routines: RoutineWithStatus[]; onToggle: (r: RoutineWithStatus) => void }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
      <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
        Today's Schedule
        <span className="ml-2 text-sm font-normal text-slate-400">({routines.length} routines)</span>
      </h2>
      <div className="space-y-2">
        {routines.map((r) => (
          <div
            key={r.id}
            className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
              r.is_completed_today
                ? "bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40"
                : "bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800"
            }`}
          >
            {/* Complete toggle */}
            <button
              onClick={() => onToggle(r)}
              className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                r.is_completed_today
                  ? "bg-green-500 border-green-500"
                  : "border-slate-300 dark:border-slate-600 hover:border-green-400"
              }`}
            >
              {r.is_completed_today && (
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>

            {/* Color dot */}
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${r.is_completed_today ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-white"}`}>
                {r.title}
              </p>
              {(r.subject || r.start_time) && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {r.start_time ? r.start_time.slice(0, 5) + " · " : ""}{r.subject ?? ""}
                </p>
              )}
            </div>

            {/* Duration */}
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">
              {r.duration_minutes}m
            </span>

            {r.is_completed_today && (
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 flex-shrink-0">Done ✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// COMPLETION HEATMAP (30 days)
// ────────────────────────────────────────────────────────────────
type HeatmapDay = { date: string; count: number; label: string };

function CompletionHeatmap({ days }: { days: HeatmapDay[] }) {
  const max = Math.max(...days.map((d) => d.count), 1);
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
      <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">30-Day Completion History</h2>
      <div className="flex gap-1 flex-wrap">
        {days.map((d) => {
          const intensity = d.count === 0 ? 0 : Math.ceil((d.count / max) * 4);
          const colors = [
            "bg-slate-100 dark:bg-slate-800",
            "bg-blue-100 dark:bg-blue-950/60",
            "bg-blue-300 dark:bg-blue-800",
            "bg-blue-500",
            "bg-blue-700",
          ];
          return (
            <div
              key={d.date}
              title={`${d.label}: ${d.count} completed`}
              className={`w-7 h-7 rounded-md transition-all duration-200 ${colors[intensity]} cursor-default hover:scale-110`}
            />
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-slate-400">Less</span>
        {["bg-slate-100 dark:bg-slate-800","bg-blue-100","bg-blue-300","bg-blue-500","bg-blue-700"].map((c,i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-xs text-slate-400">More</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// ROUTINE CARD
// ────────────────────────────────────────────────────────────────
function RoutineCard({
  routine: r, onEdit, onDelete, onToggleActive, onToggleComplete,
}: {
  routine: RoutineWithStatus;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onToggleComplete: () => void;
}) {
  const todayDow = new Date().getDay();
  const isScheduledToday = r.is_active && r.days_of_week.includes(todayDow);

  return (
    <div
      className={`group relative bg-white dark:bg-slate-900 border rounded-2xl p-5 transition-all duration-200 hover:shadow-md ${
        r.is_active
          ? "border-slate-100 dark:border-slate-800"
          : "border-slate-100 dark:border-slate-800 opacity-60"
      }`}
    >
      {/* Completed today badge */}
      {r.is_completed_today && (
        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          ✓ Done
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: r.color + "22" }}
        >
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: r.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900 dark:text-white truncate pr-8">{r.title}</p>
          {r.subject && <p className="text-xs text-slate-400 dark:text-slate-500">{r.subject}</p>}
          {r.description && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">{r.description}</p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4 flex-wrap">
        {r.start_time && (
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {r.start_time.slice(0, 5)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {r.duration_minutes}m
        </span>
        <span className="text-slate-300 dark:text-slate-600">·</span>
        <span>{r.total_completions}× completed</span>
      </div>

      {/* Day pills */}
      {r.days_of_week.length > 0 && (
        <div className="flex gap-1 mb-4">
          {DAY_LABELS.map((label, i) => (
            <span
              key={i}
              className={`w-6 h-6 rounded-md text-xs flex items-center justify-center font-bold transition-all duration-200 ${
                r.days_of_week.includes(i)
                  ? "text-white"
                  : "text-slate-200 dark:text-slate-700"
              }`}
              style={r.days_of_week.includes(i) ? { backgroundColor: r.color } : {}}
            >
              {label[0]}
            </span>
          ))}
        </div>
      )}

      {/* Mini progress bar: this week */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400 dark:text-slate-500">This week</span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {r.total_completions > 0 ? `${r.total_completions} sessions` : "No completions yet"}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              backgroundColor: r.color,
              width: `${Math.min((r.total_completions / 7) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-50 dark:border-slate-800">
        {/* Mark complete (only if scheduled today) */}
        {isScheduledToday && (
          <button
            onClick={onToggleComplete}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 ${
              r.is_completed_today
                ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-950/60"
                : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/60"
            }`}
          >
            {r.is_completed_today ? (
              <><CheckIcon /> Completed</>
            ) : (
              <><CircleIcon /> Mark Done</>
            )}
          </button>
        )}

        {/* Edit */}
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all duration-200"
          title="Edit routine"
        >
          <EditIcon />
        </button>

        {/* Pause/Resume */}
        <button
          onClick={onToggleActive}
          className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 ${
            r.is_active
              ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              : "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30"
          }`}
          title={r.is_active ? "Pause routine" : "Resume routine"}
        >
          {r.is_active ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
          title="Delete routine"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// ROUTINE MODAL (Create / Edit)
// ────────────────────────────────────────────────────────────────
function RoutineModal({
  mode, form, titleRef, onChange, onToggleDay, onSubmit, onClose, isPending,
}: {
  mode: "create" | "edit";
  form: typeof EMPTY_FORM;
  titleRef: React.RefObject<HTMLInputElement | null>;
  onChange: (k: keyof typeof EMPTY_FORM, v: string | number[]) => void;
  onToggleDay: (d: number) => void;
  onSubmit: () => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const inputClass =
    "w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {mode === "create" ? "Create New Routine" : "Edit Routine"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
              <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Routine Name <span className="text-blue-500">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              placeholder="e.g. Morning Math Practice"
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="What will you do in this routine?"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Subject + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => onChange("subject", e.target.value)}
                className={inputClass}
              >
                <option value="">None</option>
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Duration (mins)</label>
              <input
                type="number" min="5" max="480"
                value={form.duration_minutes}
                onChange={(e) => onChange("duration_minutes", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Start time */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Start Time</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => onChange("start_time", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Days of week */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Repeat On <span className="text-slate-400 font-normal">({form.days_of_week.length} days selected)</span>
            </label>
            <div className="flex gap-2">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onToggleDay(i)}
                  className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all duration-200 ${
                    form.days_of_week.includes(i)
                      ? "text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-slate-700"
                  }`}
                  style={form.days_of_week.includes(i) ? { backgroundColor: form.color } : {}}
                >
                  {label.slice(0, 2)}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange("color", c)}
                  className={`w-8 h-8 rounded-full transition-all duration-200 ${
                    form.color === c ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ring-slate-400 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: form.color + "22" }}
            >
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: form.color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{form.title || "Routine name…"}</p>
              <p className="text-xs text-slate-400">
                {form.days_of_week.length > 0
                  ? form.days_of_week.map((d) => DAY_LABELS[d]).join(", ")
                  : "No days selected"}{" "}
                · {form.duration_minutes}m
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!form.title.trim() || isPending}
            className="flex-1 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isPending && <Spinner />}
            {mode === "create" ? "Create Routine" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// EMPTY STATE
// ────────────────────────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
      <div className="text-5xl mb-4">🗓️</div>
      <p className="text-lg font-bold text-slate-800 dark:text-white mb-1">No routines yet</p>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Create your first routine to build consistent study habits.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
      >
        <PlusIcon /> Create First Routine
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────
function buildFormData(form: typeof EMPTY_FORM): FormData {
  const fd = new FormData();
  fd.set("title", form.title);
  fd.set("description", form.description);
  fd.set("subject", form.subject);
  fd.set("start_time", form.start_time);
  fd.set("duration_minutes", form.duration_minutes);
  fd.set("color", form.color);
  fd.set("days_of_week", form.days_of_week.join(","));
  return fd;
}

function buildHeatmap(history: HistoryItem[], days: number): HeatmapDay[] {
  const countByDate = new Map<string, number>();
  for (const h of history) {
    countByDate.set(h.completed_on, (countByDate.get(h.completed_on) ?? 0) + 1);
  }
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const date = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en", { month: "short", day: "numeric" });
    return { date, count: countByDate.get(date) ?? 0, label };
  });
}

// ── Tiny icon components ─────────────────────────────────────────
const PlusIcon  = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/></svg>;
const EditIcon  = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const TrashIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const PauseIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16" rx="1" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="4" width="4" height="16" rx="1" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const PlayIcon  = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const CheckIcon = () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const CircleIcon = () => <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>;
const Spinner   = () => <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>;
