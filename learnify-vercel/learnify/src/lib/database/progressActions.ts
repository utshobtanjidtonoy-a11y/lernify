"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function logStudySessionAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const minutes = parseInt(formData.get("minutes_studied") as string) || 0;
  if (minutes <= 0) return { error: "Minutes must be greater than 0" };

  const today = new Date().toISOString().split("T")[0];
  const subject = formData.get("subject") as string;
  const xp = Math.floor(minutes * 2); // 2 XP per minute

  // Upsert study_progress (unique: user+subject+date)
  const { data: existing } = await supabase
    .from("study_progress")
    .select("id, minutes_studied, xp_earned")
    .eq("user_id", user.id)
    .eq("subject", subject)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("study_progress")
      .update({
        minutes_studied: existing.minutes_studied + minutes,
        xp_earned: existing.xp_earned + xp,
        topic: (formData.get("topic") as string) || null,
        notes: (formData.get("notes") as string) || null,
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("study_progress").insert({
      user_id: user.id,
      subject,
      topic: (formData.get("topic") as string) || null,
      minutes_studied: minutes,
      date: today,
      notes: (formData.get("notes") as string) || null,
      xp_earned: xp,
    });
  }

  // Add XP to profile
  await supabase.rpc("increment_xp", { user_id: user.id, amount: xp }).maybeSingle();
  // Fallback if RPC not available: direct update
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp_points")
    .eq("id", user.id)
    .single();
  if (profile) {
    await supabase
      .from("profiles")
      .update({ xp_points: (profile.xp_points ?? 0) + xp })
      .eq("id", user.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/progress");
  return { success: true, xp_earned: xp };
}
