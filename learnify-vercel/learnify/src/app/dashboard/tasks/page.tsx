import { createClient } from "@/lib/supabase/server";
import { getTasks } from "@/lib/database/queries";
import TasksManager from "@/components/dashboard/TasksManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tasks — Learnify" };

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const tasks = await getTasks(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Tasks</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your study tasks and to-dos.
        </p>
      </div>
      <TasksManager initialTasks={tasks} userId={user.id} />
    </div>
  );
}
