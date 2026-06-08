"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { parseReaction, inferGeometry, REACTION_TYPE_INFO } from "@/lib/chemistry/engine";
import type { ParsedReaction } from "@/lib/chemistry/engine";

const BondingVisualization      = dynamic(() => import("./BondingVisualization"),      { ssr: false });
const GeometryVisualization     = dynamic(() => import("./GeometryVisualization"),     { ssr: false });
const ElectronConfigVisualization = dynamic(() => import("./ElectronConfigVisualization"), { ssr: false });
const ReactionAnimation         = dynamic(() => import("./ReactionAnimation"),         { ssr: false });
const AIExplanationPanel        = dynamic(() => import("./AIExplanationPanel"),        { ssr: false });

const EXAMPLE_REACTIONS = [
  "2H2 + O2 -> 2H2O",
  "CH4 + 2O2 -> CO2 + 2H2O",
  "N2 + 3H2 -> 2NH3",
  "Na + Cl -> NaCl",
  "2HCl + Ca(OH)2 -> CaCl2 + 2H2O",
  "Fe2O3 + 3CO -> 2Fe + 3CO2",
  "2Al + 3Cl2 -> 2AlCl3",
];

const ELEMENT_COLORS: Record<string, string> = {
  H: "#60a5fa", O: "#ef4444", C: "#6b7280", N: "#3b82f6",
  Cl: "#10b981", Na: "#f59e0b", Fe: "#cd7f32", Ca: "#84cc16",
  S: "#eab308", P: "#f97316",
};
function elColor(el: string) { return ELEMENT_COLORS[el] ?? "#94a3b8"; }

export default function ChemistryEngineClient() {
  const [input, setInput]             = useState("2H2 + O2 -> 2H2O");
  const [reaction, setReaction]       = useState<ParsedReaction | null>(null);
  const [activeTab, setActiveTab]     = useState<"reaction"|"bonding"|"geometry"|"electrons"|"ai">("reaction");
  const [selectedElement, setSelectedElement] = useState<{ symbol: string; atomicNumber: number; color: string } | null>(null);
  const [isPending, startTransition]  = useTransition();
  const [error, setError]             = useState<string | null>(null);

  const analyse = (eq?: string) => {
    const eq2 = (eq ?? input).trim();
    if (!eq2) return;
    setError(null);
    startTransition(() => {
      try {
        const parsed = parseReaction(eq2);
        if (!parsed.reactants.length && !parsed.products.length) {
          setError("Could not parse reaction. Check format: e.g. H2 + O2 -> H2O");
          return;
        }
        setReaction(parsed);
        setActiveTab("reaction");
        // Auto-select first element for electron config tab
        const firstEl = parsed.reactants[0]?.atoms[0]?.symbol;
        if (firstEl) {
          const z = getApproxAtomicNumber(firstEl);
          if (z) setSelectedElement({ symbol: firstEl, atomicNumber: z, color: elColor(firstEl) });
        }
      } catch (e: any) {
        setError("Parse error: " + e.message);
      }
    });
  };

  const TABS = [
    { id: "reaction",  label: "⚡ Reaction",   disabled: !reaction },
    { id: "bonding",   label: "🔗 Bonding",    disabled: !reaction },
    { id: "geometry",  label: "🔷 Geometry",   disabled: !reaction },
    { id: "electrons", label: "🌀 Electrons",  disabled: !reaction },
    { id: "ai",        label: "🤖 AI",         disabled: !reaction },
  ] as const;

  // For geometry — pick first multi-atom product/reactant
  const geometryMol = reaction
    ? [...reaction.products, ...reaction.reactants].find(m => Object.keys(m.atomMap).length > 1)
    : null;
  const geometry = geometryMol ? inferGeometry(geometryMol.atomMap) : "tetrahedral";

  // For bonding
  const r0 = reaction?.reactants[0];
  const r1 = reaction?.reactants[1] ?? reaction?.reactants[0];
  const el0 = r0 ? Object.keys(r0.atomMap)[0] : "H";
  const el1 = r1 ? Object.keys(r1.atomMap)[0] : "O";

  return (
    <div className="space-y-5">

      {/* ── Reaction Input ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
          Enter Chemical Equation
        </p>
        <div className="flex gap-3 mb-3">
          <div className="relative flex-1">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && analyse()}
              placeholder="e.g. 2H2 + O2 -> 2H2O"
              className="w-full px-4 py-3 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 dark:text-slate-200 placeholder-slate-400"
            />
            {input && (
              <button onClick={() => setInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          <button onClick={() => analyse()} disabled={isPending}
            className="px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2">
            {isPending ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
            Analyse
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl mb-3">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Example reactions */}
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Examples:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_REACTIONS.map(eq => (
              <button key={eq} onClick={() => { setInput(eq); analyse(eq); }}
                className="px-2.5 py-1 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-950/40 hover:text-blue-700 dark:hover:text-blue-400 rounded-lg transition-colors duration-150">
                {eq}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Parsed result summary ───────────────────────────────── */}
      {reaction && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Equation display */}
            <div className="flex-1">
              <p className="text-xs text-slate-400 mb-1">Parsed equation</p>
              <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {reaction.reactants.map(r => `${r.coefficient > 1 ? r.coefficient : ""}${r.formula}`).join(" + ")}
                {" → "}
                {reaction.products.map(p => `${p.coefficient > 1 ? p.coefficient : ""}${p.formula}`).join(" + ")}
              </p>
            </div>
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 text-xs font-bold rounded-xl text-white"
                style={{ backgroundColor: REACTION_TYPE_INFO[reaction.reactionType].color }}>
                {REACTION_TYPE_INFO[reaction.reactionType].label}
              </span>
              <span className={`px-3 py-1.5 text-xs font-bold rounded-xl border ${
                reaction.isBalanced
                  ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
              }`}>
                {reaction.isBalanced ? "✓ Balanced" : "✗ Unbalanced"}
              </span>
              <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900 capitalize">
                {reaction.bondingType}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab navigation ──────────────────────────────────────── */}
      {reaction && (
        <>
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`flex-1 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 disabled:opacity-40"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── REACTION TAB ─────────────────────────────────────── */}
          {activeTab === "reaction" && <ReactionAnimation reaction={reaction} />}

          {/* ── BONDING TAB ──────────────────────────────────────── */}
          {activeTab === "bonding" && (
            <div className="space-y-4">
              <BondingVisualization
                bondType={reaction.bondingType === "mixed" ? "covalent" : reaction.bondingType}
                element1={el0}
                element2={el1}
                color1={elColor(el0)}
                color2={elColor(el1)}
              />
              <BondingTypeInfo bondType={reaction.bondingType} />
            </div>
          )}

          {/* ── GEOMETRY TAB ─────────────────────────────────────── */}
          {activeTab === "geometry" && (
            <div className="space-y-4">
              {geometryMol ? (
                <GeometryVisualization
                  geometry={geometry}
                  formula={geometryMol.formula}
                  color={elColor(Object.keys(geometryMol.atomMap).find(e => e !== "H") ?? "C")}
                />
              ) : (
                <p className="text-center text-sm text-slate-400 py-8">No multi-atom molecule found for geometry display.</p>
              )}
            </div>
          )}

          {/* ── ELECTRONS TAB ────────────────────────────────────── */}
          {activeTab === "electrons" && (
            <div className="space-y-4">
              {/* Element picker */}
              <div className="flex flex-wrap gap-2">
                {[...new Set([
                  ...reaction.reactants.flatMap(r => Object.keys(r.atomMap)),
                  ...reaction.products.flatMap(p => Object.keys(p.atomMap)),
                ])].map(el => {
                  const z = getApproxAtomicNumber(el);
                  return z ? (
                    <button key={el} onClick={() => setSelectedElement({ symbol: el, atomicNumber: z, color: elColor(el) })}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all duration-200 ${
                        selectedElement?.symbol === el
                          ? "text-white border-transparent"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-300"
                      }`}
                      style={selectedElement?.symbol === el ? { backgroundColor: elColor(el) } : {}}>
                      {el} (Z={z})
                    </button>
                  ) : null;
                })}
              </div>

              {selectedElement ? (
                <ElectronConfigVisualization
                  atomicNumber={selectedElement.atomicNumber}
                  symbol={selectedElement.symbol}
                  elementColor={selectedElement.color}
                />
              ) : (
                <p className="text-center text-sm text-slate-400 py-6">Select an element above.</p>
              )}
            </div>
          )}

          {/* ── AI TAB ───────────────────────────────────────────── */}
          {activeTab === "ai" && <AIExplanationPanel reaction={reaction} />}
        </>
      )}

      {/* Empty state */}
      {!reaction && !isPending && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <p className="text-5xl mb-4">⚗️</p>
          <p className="text-lg font-bold text-slate-800 dark:text-white mb-1">Chemistry Engine Ready</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
            Enter any chemical equation above and click Analyse.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Supports: H₂O, NaCl, CH₄, complex organic compounds and more.
          </p>
        </div>
      )}
    </div>
  );
}

function BondingTypeInfo({ bondType }: { bondType: string }) {
  const info: Record<string, { title: string; desc: string; examples: string }> = {
    ionic:     { title: "Ionic Bond", desc: "Complete transfer of electrons from metal to non-metal. Strong electrostatic attraction between ions.", examples: "NaCl, MgO, CaF₂" },
    covalent:  { title: "Covalent Bond", desc: "Sharing of electron pairs between non-metal atoms. Can be single, double, or triple bonds.", examples: "H₂O, CO₂, CH₄" },
    metallic:  { title: "Metallic Bond", desc: "Delocalised electrons form a sea around positive metal ions. Responsible for conductivity and malleability.", examples: "Fe, Cu, Au" },
    coordinate:{ title: "Coordinate (Dative) Bond", desc: "Both electrons in the bond are donated by one atom (the Lewis base) to another (the Lewis acid).", examples: "NH₄⁺, [Cu(NH₃)₄]²⁺" },
    mixed:     { title: "Mixed Bonding", desc: "This reaction involves both ionic and covalent bonds in different molecules.", examples: "NaOH, NH₄Cl" },
  };
  const d = info[bondType] ?? info.covalent;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">{d.title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{d.desc}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">Examples: {d.examples}</p>
    </div>
  );
}

// Approximate Z lookup for common elements
const Z_TABLE: Record<string, number> = {
  H:1,He:2,Li:3,Be:4,B:5,C:6,N:7,O:8,F:9,Ne:10,
  Na:11,Mg:12,Al:13,Si:14,P:15,S:16,Cl:17,Ar:18,
  K:19,Ca:20,Sc:21,Ti:22,V:23,Cr:24,Mn:25,Fe:26,Co:27,Ni:28,Cu:29,Zn:30,
  Ga:31,Ge:32,As:33,Se:34,Br:35,Kr:36,Rb:37,Sr:38,Y:39,Zr:40,
  Nb:41,Mo:42,Tc:43,Ru:44,Rh:45,Pd:46,Ag:47,Cd:48,In:49,Sn:50,
  Sb:51,Te:52,I:53,Xe:54,Cs:55,Ba:56,La:57,Ce:58,Pr:59,Nd:60,
  Pm:61,Sm:62,Eu:63,Gd:64,Tb:65,Dy:66,Ho:67,Er:68,Tm:69,Yb:70,
  Lu:71,Hf:72,Ta:73,W:74,Re:75,Os:76,Ir:77,Pt:78,Au:79,Hg:80,
  Tl:81,Pb:82,Bi:83,Po:84,At:85,Rn:86,Fr:87,Ra:88,Ac:89,Th:90,
  Pa:91,U:92,Np:93,Pu:94,Am:95,Cm:96,Bk:97,Cf:98,Es:99,Fm:100,
};
function getApproxAtomicNumber(symbol: string): number | null {
  return Z_TABLE[symbol] ?? null;
}
