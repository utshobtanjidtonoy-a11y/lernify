"use client";

import { useState, useTransition } from "react";
import type { ParsedReaction } from "@/lib/chemistry/engine";
import { REACTION_TYPE_INFO } from "@/lib/chemistry/engine";

interface Props {
  reaction: ParsedReaction;
}

export default function AIExplanationPanel({ reaction }: Props) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const typeInfo = REACTION_TYPE_INFO[reaction.reactionType];

  const generateExplanation = () => {
    setError(null);
    startTransition(() => { void (async () => {
      try {
        const prompt = buildPrompt(reaction);
        // Call our server-side API route (keeps API key secure)
        const res = await fetch("/api/chemistry/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setExplanation(data.explanation ?? "");
      } catch (e: any) {
        setError(e.message ?? "Failed to generate explanation");
      }
    })(); });
  };

  const oxidationEvents = reaction.oxidationChanges.filter(c => c.role !== "unchanged" && c.role !== "unknown");

  return (
    <div className="space-y-4">
      {/* Reaction type badge */}
      <div className="flex items-center gap-3 p-4 rounded-2xl border"
        style={{ backgroundColor: typeInfo.color + "12", borderColor: typeInfo.color + "40" }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs"
          style={{ backgroundColor: typeInfo.color }}>
          {reaction.reactionType.slice(0,2).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{typeInfo.label} Reaction</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{typeInfo.description}</p>
        </div>
      </div>

      {/* Atom balance table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Atom Balance</p>
        <div className="space-y-1.5">
          {Object.entries(reaction.atomBalance).map(([el, v]) => (
            <div key={el} className="flex items-center gap-3">
              <span className="w-6 text-xs font-bold text-slate-700 dark:text-slate-300">{el}</span>
              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-2 rounded-full transition-all duration-500 ${v.balanced ? "bg-green-500" : "bg-red-400"}`}
                  style={{ width: `${Math.min((v.left / Math.max(v.left, v.right, 1)) * 100, 100)}%` }} />
              </div>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400 w-16 text-right">
                {v.left} → {v.right}
              </span>
              <span className={`text-xs font-bold w-6 text-center ${v.balanced ? "text-green-500" : "text-red-400"}`}>
                {v.balanced ? "✓" : "✗"}
              </span>
            </div>
          ))}
        </div>
        <p className={`mt-3 text-xs font-semibold ${reaction.isBalanced ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
          {reaction.isBalanced ? "✓ Equation is balanced" : "✗ Equation is NOT balanced"}
        </p>
      </div>

      {/* Oxidation changes */}
      {oxidationEvents.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Oxidation State Changes</p>
          <div className="grid grid-cols-2 gap-2">
            {oxidationEvents.map(oc => (
              <div key={oc.element}
                className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                  oc.role === "oxidized" ? "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900" :
                  "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900"
                }`}>
                <span className="text-lg font-black text-slate-700 dark:text-slate-300 w-6">{oc.element}</span>
                <div>
                  <p className={`text-xs font-bold ${oc.role === "oxidized" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}>
                    {oc.role === "oxidized" ? "Oxidised ↑" : "Reduced ↓"}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">{oc.before ?? "?"} → {oc.after ?? "?"}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Bonding type detected: <span className="font-semibold text-slate-600 dark:text-slate-300 capitalize">{reaction.bondingType}</span>
          </p>
        </div>
      )}

      {/* AI Explanation */}
      <div className="bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-950/20 dark:to-slate-900 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span className="text-base">🤖</span> AI Explanation
          </p>
          {!explanation && (
            <button onClick={generateExplanation} disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors">
              {isPending ? (
                <><svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg> Generating…</>
              ) : "Generate"}
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {!explanation && !isPending && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
            Click Generate for an AI-powered explanation of this reaction including reaction type, oxidation states, electron transfer, and bond formation.
          </p>
        )}

        {isPending && (
          <div className="space-y-2 py-2">
            {[80, 65, 90, 55].map((w, i) => (
              <div key={i} className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {explanation && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{explanation}</p>
            <button onClick={() => setExplanation(null)}
              className="mt-3 text-xs text-slate-400 hover:text-blue-600 transition-colors">
              ↺ Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function buildPrompt(reaction: ParsedReaction): string {
  const reactantStr = reaction.reactants.map(r => `${r.coefficient > 1 ? r.coefficient : ""}${r.formula}`).join(" + ");
  const productStr  = reaction.products.map(p => `${p.coefficient > 1 ? p.coefficient : ""}${p.formula}`).join(" + ");
  const balancedNote = reaction.isBalanced ? "The equation is balanced." : "Note: the equation may not be balanced.";

  const oxidisedEls = reaction.oxidationChanges.filter(c => c.role === "oxidized").map(c => c.element).join(", ");
  const reducedEls  = reaction.oxidationChanges.filter(c => c.role === "reduced").map(c => c.element).join(", ");

  return `You are a chemistry teacher explaining a chemical reaction to a high school or university student.

Reaction: ${reactantStr} → ${productStr}
Reaction type detected: ${reaction.reactionType}
Bonding type: ${reaction.bondingType}
${balancedNote}
${oxidisedEls ? `Elements oxidised: ${oxidisedEls}` : ""}
${reducedEls  ? `Elements reduced: ${reducedEls}` : ""}

Please explain this reaction clearly covering:
1. What type of reaction this is and why
2. What bonds are broken and what bonds are formed
3. Oxidation state changes (if any) and electron transfer
4. The driving force behind this reaction
5. Real-world significance or application

Keep the explanation concise, clear, and educational. Use simple language. Do not use LaTeX. Use plain text with unicode subscripts where needed.`;
}
