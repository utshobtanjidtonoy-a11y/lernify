"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── CREATE ────────────────────────────────────────────────────────
export async function createRoutineAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const daysRaw = formData.get("days_of_week") as string;
  const days_of_week = daysRaw
    ? daysRaw.split(",").map(Number).filter((n) => n >= 0 && n <= 6)
    : [];

  const { data, error } = await supabase.from("routines").insert({
    user_id: user.id,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    subject: (formData.get("subject") as string) || null,
    color: (formData.get("color") as string) || "#3b82f6",
    days_of_week,
    start_time: (formData.get("start_time") as string) || null,
    duration_minutes: parseInt(formData.get("duration_minutes") as string) || 30,
    is_active: true,
  }).select().single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/routines");
  revalidatePath("/dashboard");
  return { success: true, routine: data };
}

// ── UPDATE ────────────────────────────────────────────────────────
export async function updateRoutineAction(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const daysRaw = formData.get("days_of_week") as string;
  const days_of_week = daysRaw
    ? daysRaw.split(",").map(Number).filter((n) => n >= 0 && n <= 6)
    : [];

  const { data, error } = await supabase
    .from("routines")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      subject: (formData.get("subject") as string) || null,
      color: (formData.get("color") as string) || "#3b82f6",
      days_of_week,
      start_time: (formData.get("start_time") as string) || null,
      duration_minutes: parseInt(formData.get("duration_minutes") as string) || 30,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/routines");
  revalidatePath("/dashboard");
  return { success: true, routine: data };
}

// ── TOGGLE ACTIVE ─────────────────────────────────────────────────
export async function toggleRoutineAction(id: string, is_active: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("routines")
    .update({ is_active })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/routines");
  return { success: true };
}

// ── DELETE ────────────────────────────────────────────────────────
export async function deleteRoutineAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("routines")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard/routines");
  revalidatePath("/dashboard");
  return { success: true };
}

// ── MARK COMPLETE / UNCOMPLETE TODAY ─────────────────────────────
export async function toggleCompletionAction(
  routineId: string,
  completionId: string | null
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const today = new Date().toISOString().split("T")[0];

  if (completionId) {
    // Un-complete: delete the record
    await supabase
      .from("routine_completions")
      .delete()
      .eq("id", completionId)
      .eq("user_id", user.id);
  } else {
    // Complete: insert (ignore conflict = already done)
    await supabase.from("routine_completions").upsert({
      routine_id: routineId,
      user_id: user.id,
      completed_on: today,
    });
  }

  revalidatePath("/dashboard/routines");
  revalidatePath("/dashboard");
  return { success: true };
}
