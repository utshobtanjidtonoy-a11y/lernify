"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskPriority, TaskStatus } from "@/lib/database/types";

export async function createTaskAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    subject: (formData.get("subject") as string) || null,
    priority: (formData.get("priority") as TaskPriority) ?? "medium",
    status: "todo",
    due_date: (formData.get("due_date") as string) || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/tasks");
  return { success: true };
}

export async function updateTaskStatusAction(id: string, status: TaskStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const completed_at = status === "done" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("tasks")
    .update({ status, completed_at })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTaskAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard");
  return { success: true };
}
