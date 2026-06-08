"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { toggleBookmarkAction } from "@/lib/database/formulaActions";
import type { SubjectWithChapters, FormulaWithRelations, FormulaDifficulty } from "@/lib/database/types";

// Lazy-load heavy canvas components
const NewtonVisualization    = dynamic(() => import("./NewtonVisualization"),    { ssr: false, loading: () => <VisLoader /> });
const ProjectileVisualization = dynamic(() => import("./ProjectileVisualization"), { ssr: false, loading: () => <VisLoader /> });
const WaveVisualization      = dynamic(() => import("./WaveVisualization"),      { ssr: false, loading: () => <VisLoader /> });

const DIFF_STYLES: Record<FormulaDifficulty, string> = {
  beginner:     "bg-green-100  dark:bg-green-950/40  text-green-700  dark:text-green-400",
  intermediate: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400",
  advanced:     "bg-red-100    dark:bg-red-950/40    text-red-700    dark:text-red-400",
};

const SSC_SLUGS = [
  "physical-quantities","motion","force","work-energy-power",
  "states-of-matter","heat-temperature","waves-sound","light",
  "static-electricity","current-electricity",
];

interface Props {
  physicsSubject: SubjectWithChapters | null;
  userId?: string;
}

export default function PhysicsHubClient({ physicsSubject, userId }: Props) {
  const [tab, setTab]                     = useState<"formulas" | "visualizations">("formulas");
  const [level, setLevel]                 = useState<"all" | "ssc" | "hsc">("all");
  const [search, setSearch]               = useState("");
  const [expandedChapterId, setExpanded]  = useState<string | null>(null);
  const [chapterFormulas, setChFormulas]  = useState<Record<string, FormulaWithRelations[]>>({});
  const [loadingChapter, setLoadingCh]    = useState<string | null>(null);
  const [activeVis, setActiveVis]         = useState<"newton" | "projectile" | "wave">("newton");

  if (!physicsSubject) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="text-lg font-bold text-slate-800 dark:text-white mb-2">Physics data not found</p>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Run <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">physics_hub_migration.sql</code> in Supabase first.</p>
      </div>
    );
  }

  const chapters = physicsSubject.chapters ?? [];
  const visibleChapters = chapters.filter((ch) => {
    const matchLevel =
      level === "all" ? true :
      level === "ssc" ? SSC_SLUGS.includes(ch.slug) :
      !SSC_SLUGS.includes(ch.slug);
    const matchSearch = search
      ? ch.name.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchLevel && matchSearch;
  });

  const toggleChapter = async (chId: string) => {
    if (expandedChapterId === chId) { setExpanded(null); return; }
    setExpanded(chId);
    if (chapterFormulas[chId]) return;
    setLoadingCh(chId);
    const supabase = createClient();
    const { data } = await supabase
      .from("formulas")
      .select("*, chapter:formula_chapters(*), subject:formula_subjects(*)")
      .eq("chapter_id", chId)
      .order("sort_order");
    setChFormulas((prev) => ({
      ...prev,
      [chId]: (data ?? []).map((f) => ({
        ...f,
        variables: Array.isArray(f.variables) ? f.variables : [],
        is_bookmarked: false,
      })) as FormulaWithRelations[],
    }));
    setLoadingCh(null);
  };

  const sscCount = chapters.filter((c) => SSC_SLUGS.includes(c.slug)).length;
  const hscCount = chapters.length - sscCount;

  return (
    <div className="space-y-5">

      {/* ── Tab bar ─────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        <button onClick={() => setTab("formulas")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
            tab === "formulas"
              ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
          }`}>
          📐 Chapter Formulas
        </button>
        <button onClick={() => setTab("visualizations")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
            tab === "visualizations"
              ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
          }`}>
          🎮 Visualizations
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════
          FORMULAS TAB
      ═══════════════════════════════════════════════════════ */}
      {tab === "formulas" && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Chapters", value: chapters.length, icon: "📚", color: "from-blue-500 to-blue-600" },
              { label: "SSC Chapters",   value: sscCount,        icon: "🏫", color: "from-green-500 to-green-600" },
              { label: "HSC Chapters",   value: hscCount,        icon: "🎓", color: "from-purple-500 to-purple-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-center">
                <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-lg mx-auto mb-2`}>
                  {s.icon}
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Search + level filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chapters…"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-slate-200 placeholder-slate-400" />
            </div>

            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {(["all", "ssc", "hsc"] as const).map((l) => (
                <button key={l} onClick={() => setLevel(l)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wide transition-all duration-200 ${
                    level === l
                      ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                  }`}>
                  {l === "all" ? "All" : l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Chapter accordion */}
          {visibleChapters.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-slate-600 dark:text-slate-400 font-medium">No chapters match your filters.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visibleChapters.map((ch) => {
                const isSsc = SSC_SLUGS.includes(ch.slug);
                const isOpen = expandedChapterId === ch.id;
                const formulas = chapterFormulas[ch.id] ?? [];

                return (
                  <div key={ch.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-md">
                    {/* Chapter header */}
                    <button onClick={() => toggleChapter(ch.id)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-200 text-left">
                      {/* Colour dot */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: isSsc ? "#22c55e22" : "#8b5cf622" }}>
                        <span className="text-lg">{isSsc ? "🏫" : "🎓"}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{ch.name}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            isSsc ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                                  : "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400"
                          }`}>
                            {isSsc ? "SSC" : "HSC"}
                          </span>
                        </div>
                        {ch.description && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{ch.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                          {ch.formula_count} formula{ch.formula_count !== 1 ? "s" : ""}
                        </span>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </button>

                    {/* Formulas panel */}
                    {isOpen && (
                      <div className="border-t border-slate-50 dark:border-slate-800 px-4 pb-4 pt-3">
                        {loadingChapter === ch.id ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[1,2,3].map((i) => (
                              <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                            ))}
                          </div>
                        ) : formulas.length === 0 ? (
                          <p className="text-sm text-slate-400 text-center py-6">No formulas yet in this chapter.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {formulas.map((f) => (
                              <FormulaCard key={f.id} formula={f} userId={userId} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
          VISUALIZATIONS TAB
      ═══════════════════════════════════════════════════════ */}
      {tab === "visualizations" && (
        <div className="space-y-5">
          {/* Vis selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { id: "newton",     emoji: "🧱", title: "Newton's Laws",     desc: "F=ma, friction, momentum" },
              { id: "projectile", emoji: "🚀", title: "Projectile Motion",  desc: "Range, height, time of flight" },
              { id: "wave",       emoji: "🌊", title: "Wave Motion",        desc: "Transverse, longitudinal, standing" },
            ] as const).map((v) => (
              <button key={v.id} onClick={() => setActiveVis(v.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  activeVis === v.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-800"
                }`}>
                <p className="text-2xl mb-2">{v.emoji}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{v.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{v.desc}</p>
              </button>
            ))}
          </div>

          {/* Active visualization card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
            {/* Title + related formulas */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeVis === "newton"     ? "🧱 Newton's Laws of Motion" :
                   activeVis === "projectile" ? "🚀 Projectile Motion" :
                                               "🌊 Wave Motion"}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {activeVis === "newton"     ? "Adjust sliders to see F=ma in action with real-time force vectors." :
                   activeVis === "projectile" ? "Launch a projectile and observe range, height and trajectory." :
                                               "Explore transverse, longitudinal and standing wave properties."}
                </p>
              </div>
            </div>

            {/* The canvas visualization */}
            {activeVis === "newton"     && <NewtonVisualization />}
            {activeVis === "projectile" && <ProjectileVisualization />}
            {activeVis === "wave"       && <WaveVisualization />}
          </div>

          {/* Related formulas for active vis */}
          <RelatedFormulas active={activeVis} userId={userId} />
        </div>
      )}
    </div>
  );
}

// ── Related formulas for the active visualization ─────────────────
function RelatedFormulas({ active, userId }: { active: string; userId?: string }) {
  const [formulas, setFormulas] = useState<FormulaWithRelations[]>([]);
  const [loaded, setLoaded] = useState(false);

  const searchTerms: Record<string, string> = {
    newton: "newton force",
    projectile: "projectile",
    wave: "wave",
  };

  useEffect(() => {
    const supabase = createClient();
    const term = searchTerms[active] ?? active;
    supabase
      .from("formulas")
      .select("*, chapter:formula_chapters(*), subject:formula_subjects(*)")
      .ilike("title", `%${term.split(" ")[0]}%`)
      .limit(4)
      .then(({ data }) => {
        setFormulas((data ?? []).map((f: any) => ({
          ...f, variables: Array.isArray(f.variables) ? f.variables : [], is_bookmarked: false,
        })) as FormulaWithRelations[]);
        setLoaded(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (!loaded || formulas.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Related Formulas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {formulas.map((f) => <FormulaCard key={f.id} formula={f} userId={userId} />)}
      </div>
    </div>
  );
}

// ── Formula card ──────────────────────────────────────────────────
function FormulaCard({ formula: f, userId }: { formula: FormulaWithRelations; userId?: string }) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(f.is_bookmarked ?? false);
  const [, startTransition] = useTransition();

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    setBookmarked(!bookmarked);
    startTransition(() => { void toggleBookmarkAction(f.id, bookmarked); });
  };

  return (
    <div onClick={() => router.push(`/dashboard/formulas/formula/${f.id}`)}
      className="group relative bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl p-4 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">

      {f.is_important && <span className="absolute top-2.5 right-8 text-yellow-400 text-xs">⭐</span>}

      {userId && (
        <button onClick={toggleBookmark}
          className={`absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center rounded transition-colors duration-200 ${
            bookmarked ? "text-blue-600 dark:text-blue-400" : "text-slate-300 dark:text-slate-600 hover:text-blue-500"
          }`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 pr-8 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
        {f.title}
      </h4>

      <div className="bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-center mb-2">
        <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">{f.formula_plain}</p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${DIFF_STYLES[f.difficulty]}`}>
          {f.difficulty}
        </span>
        {f.tags[0] && (
          <span className="text-xs text-slate-400 dark:text-slate-500">#{f.tags[0]}</span>
        )}
      </div>
    </div>
  );
}

function VisLoader() {
  return (
    <div className="h-48 flex items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col items-center gap-3">
        <svg className="w-8 h-8 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".2" strokeWidth="3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <p className="text-xs text-slate-400 font-medium">Loading visualization…</p>
      </div>
    </div>
  );
}
