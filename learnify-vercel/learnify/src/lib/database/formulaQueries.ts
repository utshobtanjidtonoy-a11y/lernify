import { createClient } from "@/lib/supabase/server";
import type {
  FormulaSubject, FormulaChapter, Formula,
  FormulaWithRelations, SubjectWithChapters,
} from "./types";

// ── All subjects ─────────────────────────────────────────────────
export async function getFormulaSubjects(): Promise<FormulaSubject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("formula_subjects")
    .select("*")
    .order("sort_order");
  return data ?? [];
}

// ── Subjects with chapter + formula counts ────────────────────────
export async function getSubjectsWithCounts(): Promise<SubjectWithChapters[]> {
  const supabase = await createClient();

  const { data: subjects } = await supabase
    .from("formula_subjects")
    .select("*")
    .order("sort_order");

  if (!subjects?.length) return [];

  const { data: chapters } = await supabase
    .from("formula_chapters")
    .select("*, formulas(count)")
    .in("subject_id", subjects.map((s) => s.id))
    .order("sort_order");

  const chaptersBySubject = new Map<string, typeof chapters>();
  for (const ch of chapters ?? []) {
    const arr = chaptersBySubject.get(ch.subject_id) ?? [];
    arr.push(ch);
    chaptersBySubject.set(ch.subject_id, arr);
  }

  return subjects.map((s) => {
    const chs = (chaptersBySubject.get(s.id) ?? []).map((c: any) => ({
      ...c,
      formulas: [],
      formula_count: (c as any).formulas?.[0]?.count ?? 0,
    }));
    return {
      ...s,
      chapters: chs,
      total_formulas: chs.reduce((sum, c) => sum + c.formula_count, 0),
    };
  });
}

// ── Chapters for a subject ────────────────────────────────────────
export async function getChaptersBySubject(subjectSlug: string): Promise<FormulaChapter[]> {
  const supabase = await createClient();
  const { data: subject } = await supabase
    .from("formula_subjects")
    .select("id")
    .eq("slug", subjectSlug)
    .single();

  if (!subject) return [];

  const { data } = await supabase
    .from("formula_chapters")
    .select("*")
    .eq("subject_id", subject.id)
    .order("sort_order");
  return data ?? [];
}

// ── All formulas for a subject (with chapter + subject joined) ────
export async function getFormulasBySubject(
  subjectSlug: string,
  userId?: string
): Promise<FormulaWithRelations[]> {
  const supabase = await createClient();

  const { data: subject } = await supabase
    .from("formula_subjects")
    .select("*")
    .eq("slug", subjectSlug)
    .single();

  if (!subject) return [];

  const { data: formulas } = await supabase
    .from("formulas")
    .select("*, chapter:formula_chapters(*), subject:formula_subjects(*)")
    .eq("subject_id", subject.id)
    .order("sort_order");

  if (!formulas?.length) return [];

  // Attach bookmark status if userId provided
  let bookmarkedIds = new Set<string>();
  if (userId) {
    const { data: bookmarks } = await supabase
      .from("formula_bookmarks")
      .select("formula_id")
      .eq("user_id", userId);
    bookmarkedIds = new Set((bookmarks ?? []).map((b) => b.formula_id));
  }

  return formulas.map((f: any) => ({
    ...f,
    variables: Array.isArray(f.variables) ? f.variables : [],
    is_bookmarked: bookmarkedIds.has(f.id),
  })) as FormulaWithRelations[];
}

// ── Formulas for a specific chapter ──────────────────────────────
export async function getFormulasByChapter(
  subjectSlug: string,
  chapterSlug: string,
  userId?: string
): Promise<FormulaWithRelations[]> {
  const supabase = await createClient();

  const { data: chapter } = await supabase
    .from("formula_chapters")
    .select("*, subject:formula_subjects!inner(*)")
    .eq("slug", chapterSlug)
    .eq("formula_subjects.slug", subjectSlug)
    .single();

  if (!chapter) return [];

  const { data: formulas } = await supabase
    .from("formulas")
    .select("*, chapter:formula_chapters(*), subject:formula_subjects(*)")
    .eq("chapter_id", chapter.id)
    .order("sort_order");

  if (!formulas?.length) return [];

  let bookmarkedIds = new Set<string>();
  if (userId) {
    const { data: bookmarks } = await supabase
      .from("formula_bookmarks")
      .select("formula_id")
      .eq("user_id", userId);
    bookmarkedIds = new Set((bookmarks ?? []).map((b) => b.formula_id));
  }

  return formulas.map((f: any) => ({
    ...f,
    variables: Array.isArray(f.variables) ? f.variables : [],
    is_bookmarked: bookmarkedIds.has(f.id),
  })) as FormulaWithRelations[];
}

// ── Single formula by ID ──────────────────────────────────────────
export async function getFormulaById(
  id: string,
  userId?: string
): Promise<FormulaWithRelations | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("formulas")
    .select("*, chapter:formula_chapters(*), subject:formula_subjects(*)")
    .eq("id", id)
    .single();

  if (!data) return null;

  let isBookmarked = false;
  if (userId) {
    const { data: bm } = await supabase
      .from("formula_bookmarks")
      .select("id")
      .eq("user_id", userId)
      .eq("formula_id", id)
      .maybeSingle();
    isBookmarked = !!bm;
  }

  return {
    ...data,
    variables: Array.isArray(data.variables) ? data.variables : [],
    is_bookmarked: isBookmarked,
  } as FormulaWithRelations;
}

// ── Full-text search across formulas ─────────────────────────────
export async function searchFormulas(
  query: string,
  userId?: string,
  filters?: {
    subjectId?: string;
    difficulty?: string;
    isImportant?: boolean;
  }
): Promise<FormulaWithRelations[]> {
  const supabase = await createClient();

  let q = supabase
    .from("formulas")
    .select("*, chapter:formula_chapters(*), subject:formula_subjects(*)")
    .order("is_important", { ascending: false })
    .order("sort_order")
    .limit(50);

  if (query.trim()) {
    // Search in title, description, formula_plain, tags
    q = q.or(
      `title.ilike.%${query}%,formula_plain.ilike.%${query}%,description.ilike.%${query}%`
    );
  }

  if (filters?.subjectId) q = q.eq("subject_id", filters.subjectId);
  if (filters?.difficulty) q = q.eq("difficulty", filters.difficulty);
  if (filters?.isImportant) q = q.eq("is_important", true);

  const { data } = await q;
  if (!data?.length) return [];

  let bookmarkedIds = new Set<string>();
  if (userId) {
    const { data: bookmarks } = await supabase
      .from("formula_bookmarks")
      .select("formula_id")
      .eq("user_id", userId);
    bookmarkedIds = new Set((bookmarks ?? []).map((b) => b.formula_id));
  }

  return data.map((f: any) => ({
    ...f,
    variables: Array.isArray(f.variables) ? f.variables : [],
    is_bookmarked: bookmarkedIds.has(f.id),
  })) as FormulaWithRelations[];
}

// ── Bookmarks ─────────────────────────────────────────────────────
export async function getBookmarkedFormulas(userId: string): Promise<FormulaWithRelations[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("formula_bookmarks")
    .select("formula:formulas(*, chapter:formula_chapters(*), subject:formula_subjects(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .map((b) => b.formula)
    .filter(Boolean)
    .map((f: any) => ({
      ...f,
      variables: Array.isArray(f.variables) ? f.variables : [],
      is_bookmarked: true,
    })) as FormulaWithRelations[];
}
