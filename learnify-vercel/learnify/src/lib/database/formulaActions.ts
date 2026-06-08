"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ── Toggle bookmark ───────────────────────────────────────────────
export async function toggleBookmarkAction(formulaId: string, isBookmarked: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (isBookmarked) {
    await supabase
      .from("formula_bookmarks")
      .delete()
      .eq("user_id", user.id)
      .eq("formula_id", formulaId);
  } else {
    await supabase
      .from("formula_bookmarks")
      .upsert({ user_id: user.id, formula_id: formulaId });
  }

  revalidatePath("/dashboard/formulas");
  revalidatePath(`/dashboard/formulas/formula/${formulaId}`);
  return { success: true };
}

// ── Add a new formula (user-contributed) ─────────────────────────
export async function addFormulaAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const chapterId = formData.get("chapter_id") as string;
  const subjectId = formData.get("subject_id") as string;

  if (!chapterId || !subjectId) return { error: "Chapter and Subject required" };

  const tagsRaw = formData.get("tags") as string;
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  const { data, error } = await supabase.from("formulas").insert({
    chapter_id:    chapterId,
    subject_id:    subjectId,
    title:         formData.get("title") as string,
    formula_latex: formData.get("formula_latex") as string,
    formula_plain: formData.get("formula_plain") as string,
    description:   (formData.get("description") as string) || null,
    example:       (formData.get("example") as string) || null,
    notes:         (formData.get("notes") as string) || null,
    variables:     JSON.parse((formData.get("variables") as string) || "[]"),
    difficulty:    (formData.get("difficulty") as string) || "beginner",
    tags,
    is_important:  formData.get("is_important") === "true",
  }).select().single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard/formulas");
  return { success: true, id: data.id };
}
