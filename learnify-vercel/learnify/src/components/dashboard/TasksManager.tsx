"use client";

import { useState, useTransition } from "react";
import { createTaskAction, updateTaskStatusAction, deleteTaskAction } from "@/lib/database/taskActions";
import type { Task, TaskStatus, TaskPriority } from "@/lib/database/types";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  high:   "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  medium: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  low:    "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "English", "Other"];

interface Props {
  initialTasks: Task[];
  userId: string;
}

export default function TasksManager({ initialTasks, userId }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const newTask: Task = {
      id: `temp-${Date.now()}`,
      user_id: userId,
      routine_id: null,
      title: formData.get("title") as string,
      description: null,
      subject: (formData.get("subject") as string) || null,
      priority: (formData.get("priority") as TaskPriority) ?? "medium",
      status: "todo",
      due_date: (formData.get("due_date") as string) || null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setShowForm(false);
    (e.target as HTMLFormElement).reset();

    startTransition(() => { void (async () => {
      const res = await createTaskAction(formData);
      if (res?.error) {
        setFormError(res.error);
        setTasks((prev) => prev.filter((t) => t.id !== newTask.id));
      }
    })(); });
  };

  const handleStatus = (task: Task, status: TaskStatus) => {
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status } : t));
    startTransition(() => { void updateTaskStatusAction(task.id, status); });
  };

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    startTransition(() => { void deleteTaskAction(id); });
  };

  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  const inputClass = "w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500";

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Filter tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(["all", "todo", "in_progress", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                filter === f
                  ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {f === "all" ? "All" : STATUS_LABELS[f]}{" "}
              <span className="opacity-60">({counts[f]})</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="ml-auto flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors duration-200"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/>
            <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/>
          </svg>
          New Task
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-5 space-y-4">
          <p className="text-sm font-bold text-slate-900 dark:text-white">Create New Task</p>
          {formError && <p className="text-xs text-red-500">{formError}</p>}
          <input name="title" type="text" required placeholder="Task title *" className={inputClass} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select name="subject" className={inputClass}>
              <option value="">Subject (optional)</option>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select name="priority" className={inputClass} defaultValue="medium">
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input name="due_date" type="date" className={inputClass} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-xl transition-colors duration-200">
              Create Task
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors duration-200">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <p className="text-3xl mb-3">📝</p>
          <p className="text-slate-600 dark:text-slate-400 font-medium">No tasks here.</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            {filter === "all" ? "Create your first task to get started!" : `No ${STATUS_LABELS[filter as TaskStatus]} tasks.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border rounded-2xl transition-all duration-200 group ${
                task.status === "done"
                  ? "border-slate-100 dark:border-slate-800 opacity-60"
                  : "border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800/50 hover:shadow-sm"
              }`}
            >
              {/* Status toggle */}
              <button
                onClick={() => handleStatus(task, task.status === "done" ? "todo" : "done")}
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

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${task.status === "done" ? "line-through text-slate-400" : "text-slate-900 dark:text-white"}`}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {task.subject && <span className="text-xs text-slate-400 dark:text-slate-500">{task.subject}</span>}
                  {task.due_date && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Due {new Date(task.due_date + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>

              {/* Priority badge */}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border flex-shrink-0 ${PRIORITY_STYLES[task.priority]}`}>
                {task.priority}
              </span>

              {/* Status select */}
              <select
                value={task.status}
                onChange={(e) => handleStatus(task, e.target.value as TaskStatus)}
                className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 flex-shrink-0"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>

              {/* Delete */}
              <button
                onClick={() => handleDelete(task.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
