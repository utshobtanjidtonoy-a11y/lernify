"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toggleBookmarkAction } from "@/lib/database/formulaActions";
import type { SubjectWithChapters, FormulaWithRelations, FormulaDifficulty } from "@/lib/database/types";

const DIFFICULTY_STYLES: Record<FormulaDifficulty, string> = {
  beginner:     "bg-green-100  dark:bg-green-950/40  text-green-700  dark:text-green-400",
  intermediate: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400",
  advanced:     "bg-red-100    dark:bg-red-950/40    text-red-700    dark:text-red-400",
};

interface Props {
  subjects: SubjectWithChapters[];
  userId?: string;
}

export default function FormulaHubClient({ subjects, userId }: Props) {
  const router = useRouter();
  const [search, setSearch]             = useState("");
  const [activeSubjectId, setSubjectId] = useState<string | "all">("all");
  const [activeChapterId, setChapterId] = useState<string | "all">("all");
  const [difficulty, setDifficulty]     = useState<FormulaDifficulty | "all">("all");
  const [onlyImportant, setImportant]   = useState(false);
  const [view, setView]                 = useState<"subjects" | "browse">("subjects");

  // Search results from Supabase
  const [results, setResults]           = useState<FormulaWithRelations[]>([]);
  const [searching, startSearch]        = useTransition();
  const [searched, setSearched]         = useState(false);

  const activeSubject = subjects.find((s) => s.id === activeSubjectId);
  const chaptersForSubject = activeSubject?.chapters ?? [];

  // ── Live search ───────────────────────────────────────────────
  const handleSearch = (q: string) => {
    setSearch(q);
    if (q.length < 2 && !searched) return;
    setSearched(true);
    startSearch(async () => {
      const supabase = createClient();
      let query = supabase
        .from("formulas")
        .select("*, chapter:formula_chapters(*), subject:formula_subjects(*)")
        .order("is_important", { ascending: false })
        .order("sort_order")
        .limit(40);

      if (q.trim().length >= 2) {
        query = query.or(
          `title.ilike.%${q}%,formula_plain.ilike.%${q}%,description.ilike.%${q}%`
        );
      }
      if (activeSubjectId !== "all") query = query.eq("subject_id", activeSubjectId);
      if (activeChapterId !== "all") query = query.eq("chapter_id", activeChapterId);
      if (difficulty !== "all")       query = query.eq("difficulty", difficulty);
      if (onlyImportant)              query = query.eq("is_important", true);

      const { data } = await query;
      setResults(
        (data ?? []).map((f) => ({
          ...f,
          variables: Array.isArray(f.variables) ? f.variables : [],
          is_bookmarked: false,
        })) as FormulaWithRelations[]
      );
    });
  };

  // Apply filters without text query
  const handleFilter = () => {
    setSearched(true);
    handleSearch(search);
  };

  const clearAll = () => {
    setSearch(""); setSubjectId("all"); setChapterId("all");
    setDifficulty("all"); setImportant(false); setSearched(false); setResults([]);
  };

  const isFiltering = searched || search.length >= 2;

  return (
    <div className="space-y-6">

      {/* ── Search bar ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
            </svg>
            <input
              type="text" value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search formulas, e.g. 'Newton', 'quadratic', 'Boyle'…"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            />
            {search && (
              <button onClick={clearAll} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          {isFiltering && (
            <button onClick={clearAll} className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-red-500 bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors">
              Clear
            </button>
          )}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Subject filter */}
          <select
            value={activeSubjectId}
            onChange={(e) => { setSubjectId(e.target.value); setChapterId("all"); handleFilter(); }}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>

          {/* Chapter filter (only if subject selected) */}
          {activeSubjectId !== "all" && chaptersForSubject.length > 0 && (
            <select
              value={activeChapterId}
              onChange={(e) => { setChapterId(e.target.value); handleFilter(); }}
              className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="all">All Chapters</option>
              {chaptersForSubject.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}

          {/* Difficulty */}
          <select
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value as any); handleFilter(); }}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {/* Important toggle */}
          <button
            onClick={() => { setImportant(!onlyImportant); handleFilter(); }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 ${
              onlyImportant
                ? "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-yellow-300"
            }`}
          >
            ⭐ Important
          </button>

          {/* View toggle */}
          {!isFiltering && (
            <div className="ml-auto flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
              {(["subjects", "browse"] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 capitalize ${
                    view === v ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}>
                  {v === "subjects" ? "🗂 Subjects" : "📋 All"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SEARCH / FILTER RESULTS ───────────────────────────── */}
      {isFiltering ? (
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {searching ? "Searching…" : `${results.length} formula${results.length !== 1 ? "s" : ""} found`}
            {search && <span className="font-semibold text-slate-700 dark:text-slate-300"> for "{search}"</span>}
          </p>
          {searching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <EmptySearch onClear={clearAll} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.map((f) => (
                <FormulaCard key={f.id} formula={f} userId={userId} />
              ))}
            </div>
          )}
        </div>
      ) : view === "subjects" ? (
        /* ── SUBJECT CARDS ──────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {subjects.map((s) => (
            <SubjectCard key={s.id} subject={s} onSelect={() => { setSubjectId(s.id); setView("browse"); handleSearch(""); setSearched(true); }} />
          ))}
        </div>
      ) : (
        /* ── BROWSE ALL BY CHAPTER ──────────────────────────── */
        <BrowseView subjects={subjects} userId={userId} />
      )}
    </div>
  );
}

// ── Subject Card ──────────────────────────────────────────────────
function SubjectCard({ subject: s, onSelect }: { subject: SubjectWithChapters; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="text-left bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
    >
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm"
        style={{ backgroundColor: s.color + "22" }}>
        {s.icon ?? "📚"}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
        {s.name}
      </h3>
      {s.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{s.description}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
        <span>{s.chapters.length} chapters</span>
        <span>·</span>
        <span>{s.total_formulas} formulas</span>
      </div>
      {/* Chapter pills */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {s.chapters.slice(0, 3).map((c) => (
          <span key={c.id} className="px-2 py-0.5 text-xs font-medium rounded-lg"
            style={{ backgroundColor: s.color + "18", color: s.color }}>
            {c.name}
          </span>
        ))}
        {s.chapters.length > 3 && (
          <span className="px-2 py-0.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
            +{s.chapters.length - 3}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Browse by chapter (lazy loads formulas from client) ───────────
function BrowseView({ subjects, userId }: { subjects: SubjectWithChapters[]; userId?: string }) {
  const [expandedChapter, setExpanded] = useState<string | null>(null);
  const [chapterFormulas, setChapterFormulas] = useState<Record<string, FormulaWithRelations[]>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const toggleChapter = async (chapterId: string, subjectId: string) => {
    if (expandedChapter === chapterId) { setExpanded(null); return; }
    setExpanded(chapterId);
    if (chapterFormulas[chapterId]) return; // already loaded

    setLoading(chapterId);
    const supabase = createClient();
    const { data } = await supabase
      .from("formulas")
      .select("*, chapter:formula_chapters(*), subject:formula_subjects(*)")
      .eq("chapter_id", chapterId)
      .order("sort_order");

    setChapterFormulas((prev) => ({
      ...prev,
      [chapterId]: (data ?? []).map((f) => ({
        ...f,
        variables: Array.isArray(f.variables) ? f.variables : [],
        is_bookmarked: false,
      })) as FormulaWithRelations[],
    }));
    setLoading(null);
  };

  return (
    <div className="space-y-8">
      {subjects.map((s) => (
        <div key={s.id}>
          {/* Subject header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: s.color + "22" }}>
              {s.icon}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{s.name}</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">{s.total_formulas} formulas</span>
          </div>

          {/* Chapters accordion */}
          <div className="space-y-2">
            {s.chapters.map((ch) => (
              <div key={ch.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggleChapter(ch.id, s.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ch.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {ch.formula_count} formula{ch.formula_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedChapter === ch.id ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {expandedChapter === ch.id && (
                  <div className="px-4 pb-4 border-t border-slate-50 dark:border-slate-800">
                    {loading === ch.id ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                        {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                      </div>
                    ) : (chapterFormulas[ch.id] ?? []).length === 0 ? (
                      <p className="text-sm text-slate-400 pt-4 text-center py-6">No formulas in this chapter yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                        {(chapterFormulas[ch.id] ?? []).map((f) => (
                          <FormulaCard key={f.id} formula={f} userId={userId} compact />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Formula Card ──────────────────────────────────────────────────
export function FormulaCard({
  formula: f, userId, compact = false,
}: { formula: FormulaWithRelations; userId?: string; compact?: boolean }) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(f.is_bookmarked ?? false);
  const [isPending, startTransition] = useTransition();

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    setBookmarked(!bookmarked);
    startTransition(() => { void toggleBookmarkAction(f.id, bookmarked); });
  };

  return (
    <div
      onClick={() => router.push(`/dashboard/formulas/formula/${f.id}`)}
      className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* Important badge */}
      {f.is_important && (
        <div className="absolute top-3 right-10 text-yellow-400 text-sm" title="Important formula">⭐</div>
      )}

      {/* Bookmark */}
      {userId && (
        <button
          onClick={toggleBookmark}
          disabled={isPending}
          className={`absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg transition-all duration-200 ${
            bookmarked ? "text-blue-600 dark:text-blue-400" : "text-slate-300 dark:text-slate-600 hover:text-blue-500"
          }`}
          title={bookmarked ? "Remove bookmark" : "Bookmark"}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Subject + Chapter breadcrumb */}
      <div className="flex items-center gap-1.5 mb-2 pr-14">
        <span className="text-xs font-semibold" style={{ color: f.subject?.color ?? "#3b82f6" }}>
          {f.subject?.name}
        </span>
        <span className="text-slate-300 dark:text-slate-600 text-xs">›</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{f.chapter?.name}</span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors pr-8 line-clamp-2">
        {f.title}
      </h3>

      {/* Formula display */}
      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2.5 mb-3 text-center">
        <p className="text-sm font-mono font-bold text-slate-800 dark:text-slate-100 tracking-wide">
          {f.formula_plain}
        </p>
      </div>

      {!compact && f.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{f.description}</p>
      )}

      {/* Tags + difficulty */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${DIFFICULTY_STYLES[f.difficulty]}`}>
          {f.difficulty}
        </span>
        {f.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 animate-pulse">
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3 mb-3" />
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full mb-3" />
      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3" />
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
    </div>
  );
}

function EmptySearch({ onClear }: { onClear: () => void }) {
  return (
    <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
      <p className="text-4xl mb-4">🔍</p>
      <p className="text-lg font-bold text-slate-800 dark:text-white mb-1">No formulas found</p>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-5">Try different keywords or clear your filters.</p>
      <button onClick={onClear} className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors">
        Clear Search
      </button>
    </div>
  );
}
