"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateTaskStatusAction, deleteTaskAction } from "@/lib/database/taskActions";
import type { Task } from "@/lib/database/types";

const PRIORITY_COLORS: Record<string, string> = {
  high:   "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400",
  medium: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400",
  low:    "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400",
};

export default function TasksWidget({ userId }: { userId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const today = new Date().toISOString().split("T")[0];

    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .or(`due_date.eq.${today},due_date.is.null`)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setTasks(data ?? []));
  }, [userId]);

  const toggle = (task: Task) => {
    const next = task.status === "done" ? "todo" : "done";
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: next } : t));
    startTransition(() => { void updateTaskStatusAction(task.id, next); });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Today's Tasks</h2>
        <a href="/dashboard/tasks" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline">
          View all →
        </a>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-2xl mb-2">✅</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">No tasks yet.</p>
          <a href="/dashboard/tasks" className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1 inline-block hover:underline">
            Add your first task →
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                task.status === "done"
                  ? "opacity-50 bg-slate-50 dark:bg-slate-800/40"
                  : "bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800"
              }`}
            >
              <button
                onClick={() => toggle(task)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                  task.status === "done"
                    ? "bg-blue-500 border-blue-500"
                    : "border-slate-300 dark:border-slate-600 hover:border-blue-400"
                }`}
              >
                {task.status === "done" && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-200"}`}>
                  {task.title}
                </p>
                {task.subject && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{task.subject}</p>
                )}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg flex-shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
