"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleBookmarkAction } from "@/lib/database/formulaActions";
import type { FormulaWithRelations, FormulaDifficulty } from "@/lib/database/types";

const DIFFICULTY_STYLES: Record<FormulaDifficulty, string> = {
  beginner:     "bg-green-100  dark:bg-green-950/40  text-green-700  dark:text-green-400  border-green-200  dark:border-green-800",
  intermediate: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  advanced:     "bg-red-100    dark:bg-red-950/40    text-red-700    dark:text-red-400    border-red-200    dark:border-red-800",
};

interface Props { formula: FormulaWithRelations; }

export default function FormulaDetail({ formula: f }: Props) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(f.is_bookmarked ?? false);
  const [copied, setCopied]         = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
    startTransition(() => { void toggleBookmarkAction(f.id, bookmarked); });
  };

  const copyFormula = () => {
    navigator.clipboard.writeText(f.formula_plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">

      {/* ── Back button ────────────────────────────────────────── */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back to Formula Hub
      </button>

      {/* ── Hero card ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
        {/* Subject colour strip */}
        <div className="h-1.5 w-full" style={{ backgroundColor: f.subject?.color ?? "#3b82f6" }} />

        <div className="p-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold">
            <span style={{ color: f.subject?.color ?? "#3b82f6" }}>{f.subject?.icon} {f.subject?.name}</span>
            <span className="text-slate-300 dark:text-slate-600">›</span>
            <span className="text-slate-400 dark:text-slate-500">{f.chapter?.name}</span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              {f.is_important && <span className="mr-2 text-yellow-400">⭐</span>}
              {f.title}
            </h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Bookmark */}
              <button
                onClick={toggleBookmark}
                disabled={isPending}
                className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all duration-200 ${
                  bookmarked
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-500 hover:border-blue-300"
                }`}
                title={bookmarked ? "Remove bookmark" : "Bookmark this formula"}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"
                  fill={bookmarked ? "currentColor" : "none"}
                  stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Formula display */}
          <div className="relative bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/30 dark:to-slate-800/60 rounded-2xl px-6 py-6 mb-5 text-center border border-blue-100 dark:border-blue-900/40">
            <p className="text-2xl lg:text-3xl font-mono font-black text-slate-900 dark:text-white tracking-wide select-all">
              {f.formula_plain}
            </p>
            <button
              onClick={copyFormula}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-all duration-200"
            >
              {copied ? (
                <><svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/></svg> Copied!</>
              ) : (
                <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" strokeLinejoin="round"/></svg> Copy</>
              )}
            </button>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${DIFFICULTY_STYLES[f.difficulty]}`}>
              {f.difficulty.charAt(0).toUpperCase() + f.difficulty.slice(1)}
            </span>
            {f.tags.map((tag) => (
              <span key={tag} className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Description ────────────────────────────────────────── */}
      {f.description && (
        <Section icon="📖" title="Description">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.description}</p>
        </Section>
      )}

      {/* ── Variables ──────────────────────────────────────────── */}
      {f.variables?.length > 0 && (
        <Section icon="🔤" title="Variables">
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {f.variables.map((v, i) => (
              <div key={i} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                <div className="w-14 flex-shrink-0">
                  <span className="inline-flex items-center justify-center px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-sm font-bold font-mono rounded-lg border border-blue-100 dark:border-blue-900">
                    {v.symbol}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{v.name}</p>
                  {v.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{v.description}</p>
                  )}
                </div>
                {v.unit && (
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg flex-shrink-0 font-mono">
                    {v.unit}
                  </span>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── Worked Example ─────────────────────────────────────── */}
      {f.example && (
        <Section icon="✏️" title="Worked Example">
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/40 rounded-xl p-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{f.example}</p>
          </div>
        </Section>
      )}

      {/* ── Derivation ─────────────────────────────────────────── */}
      {f.derivation && (
        <Section icon="🧮" title="Derivation">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
              {f.derivation}
            </p>
          </div>
        </Section>
      )}

      {/* ── Notes ──────────────────────────────────────────────── */}
      {f.notes && (
        <Section icon="💡" title="Notes & Tips">
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/40 rounded-xl p-4">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{f.notes}</p>
          </div>
        </Section>
      )}

      {/* ── Meta ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-400 dark:text-slate-500 pt-2">
        <span>Added {new Date(f.created_at).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}</span>
        {f.updated_at !== f.created_at && (
          <span>· Updated {new Date(f.updated_at).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })}</span>
        )}
      </div>
    </div>
  );
}

// ── Reusable section wrapper ──────────────────────────────────────
function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white mb-4">
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}
