"use client";

import { useEffect, useRef, useState } from "react";
import type { ParsedReaction } from "@/lib/chemistry/engine";

interface Props {
  reaction: ParsedReaction;
}

type Phase = "before" | "during" | "after";

const ELEMENT_COLORS: Record<string, string> = {
  H: "#60a5fa", O: "#ef4444", C: "#6b7280", N: "#3b82f6", Cl: "#10b981",
  Na: "#f59e0b", Fe: "#cd7f32", Ca: "#84cc16", S: "#eab308", P: "#f97316",
  default: "#94a3b8",
};

function elColor(el: string): string {
  return ELEMENT_COLORS[el] ?? ELEMENT_COLORS.default;
}

export default function ReactionAnimation({ reaction }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);
  const [phase, setPhase] = useState<Phase>("before");
  const [autoPlay, setAutoPlay] = useState(false);
  const autoRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    function loop() {
      tRef.current += 0.02;
      draw(canvas!, reaction, phase, tRef.current);
      animRef.current = requestAnimationFrame(loop);
    }
    loop();
    return () => { ro.disconnect(); cancelAnimationFrame(animRef.current); };
  }, [reaction, phase]);

  // Auto-play sequence
  useEffect(() => {
    autoRef.current = autoPlay;
    if (!autoPlay) return;
    tRef.current = 0;
    setPhase("before");
    const t1 = setTimeout(() => { if (autoRef.current) { setPhase("during"); tRef.current = 0; } }, 2200);
    const t2 = setTimeout(() => { if (autoRef.current) { setPhase("after");  tRef.current = 0; } }, 4400);
    const t3 = setTimeout(() => { if (autoRef.current) setAutoPlay(false); }, 6600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [autoPlay]);

  const PHASE_COLORS: Record<Phase, string> = {
    before: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    during: "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    after:  "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  };

  return (
    <div className="space-y-4">
      {/* Phase tabs */}
      <div className="flex gap-2">
        {(["before","during","after"] as Phase[]).map(p => (
          <button key={p} onClick={() => { setPhase(p); tRef.current = 0; setAutoPlay(false); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl border capitalize transition-all duration-200 ${
              phase === p ? PHASE_COLORS[p] : "bg-slate-50 dark:bg-slate-800/60 text-slate-400 border-slate-200 dark:border-slate-700"
            }`}>
            {p === "before" ? "⚗️ Before" : p === "during" ? "⚡ Reaction" : "✅ After"}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900" style={{ height: 200 }}>
        <canvas ref={canvasRef} className="w-full h-full" />
        <div className={`absolute top-2 right-3 px-3 py-1 rounded-full text-xs font-bold border ${PHASE_COLORS[phase]}`}>
          {phase.toUpperCase()}
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button onClick={() => { setAutoPlay(true); tRef.current = 0; }}
          disabled={autoPlay}
          className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors">
          ▶ Auto-Play
        </button>
        {(["before","during","after"] as Phase[]).map(p => (
          <button key={p} onClick={() => { setPhase(p); tRef.current = 0; setAutoPlay(false); }}
            className="flex-1 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl capitalize transition-colors">
            {p}
          </button>
        ))}
      </div>

      {/* Phase description */}
      <div className={`p-3 rounded-xl border text-xs ${PHASE_COLORS[phase]}`}>
        {phase === "before" && "Reactant molecules are intact. Bonds within each molecule are stable."}
        {phase === "during" && "Energy input breaks existing bonds. Atoms rearrange. Bond breaking and formation occur simultaneously."}
        {phase === "after"  && "Product molecules formed. New bonds stabilised. Energy may be released."}
      </div>
    </div>
  );
}

// ── Canvas draw ──────────────────────────────────────────────────
function draw(canvas: HTMLCanvasElement, reaction: ParsedReaction, phase: Phase, t: number) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Dark background
  ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H);

  const molecules = phase === "after" ? reaction.products : reaction.reactants;
  const count = molecules.length;
  if (!count) { drawNoData(ctx, W, H); return; }

  const slotW = W / count;

  molecules.forEach((mol, mi) => {
    const cx = slotW * mi + slotW / 2;
    const cy = H / 2;
    const elements = Object.entries(mol.atomMap);
    const n = elements.length;

    if (phase === "during") {
      // Shaking + bond-breaking particles
      const shake = Math.sin(t * 8 + mi) * 5;
      drawMoleculeExploding(ctx, cx + shake, cy, mol.formula, elements, t, mi);
    } else {
      drawMoleculeStable(ctx, cx, cy, mol.formula, elements, t, mi);
    }

    // Label
    ctx.fillStyle = "#64748b"; ctx.font = "10px monospace"; ctx.textAlign = "center";
    ctx.fillText(`${mol.coefficient > 1 ? mol.coefficient : ""}${mol.formula}`, cx, H - 8);
  });

  // Arrow between reactants and products
  if (phase === "during") {
    ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2;
    ctx.font = "11px sans-serif"; ctx.fillStyle = "#fbbf24"; ctx.textAlign = "center";
    ctx.fillText("REACTING…", W / 2, 16);
  }
}

function drawMoleculeStable(
  ctx: CanvasRenderingContext2D, cx: number, cy: number,
  formula: string, elements: [string, number][], t: number, seed: number
) {
  const n = elements.length;
  const bob = Math.sin(t * 1.2 + seed) * 4;
  const cy2 = cy + bob;

  if (n === 1) {
    drawAtomCircle(ctx, cx, cy2, 20, elements[0][0]);
    return;
  }

  // Arrange atoms in a row/ring
  const spacing = 36;
  const totalW = (n - 1) * spacing;
  const startX = cx - totalW / 2;

  // Bonds first
  for (let i = 0; i < n - 1; i++) {
    const ax = startX + i * spacing;
    const bx = startX + (i + 1) * spacing;
    ctx.strokeStyle = "rgba(148,163,184,0.6)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ax, cy2); ctx.lineTo(bx, cy2); ctx.stroke();
  }

  // Atoms
  for (let i = 0; i < n; i++) {
    drawAtomCircle(ctx, startX + i * spacing, cy2, 16, elements[i][0]);
  }
}

function drawMoleculeExploding(
  ctx: CanvasRenderingContext2D, cx: number, cy: number,
  formula: string, elements: [string, number][], t: number, seed: number
) {
  const n = elements.length;
  // Atoms flying apart
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + seed;
    const dist = Math.sin(t * 3) * 30 + 15;
    const ax = cx + Math.cos(angle) * dist;
    const ay = cy + Math.sin(angle) * dist;

    // Bond line (breaking — dashed)
    ctx.strokeStyle = "rgba(251,191,36,0.4)"; ctx.lineWidth = 2;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ax, ay); ctx.stroke();
    ctx.setLineDash([]);

    // Electron spark
    const spark = t * 6 + i;
    const sx = ax + Math.cos(spark) * 8;
    const sy = ay + Math.sin(spark) * 8;
    ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24"; ctx.fill();

    drawAtomCircle(ctx, ax, ay, 14, elements[i][0]);
  }

  // Energy burst at centre
  const burst = (Math.sin(t * 5) + 1) / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 * burst);
  grad.addColorStop(0, `rgba(251,191,36,${burst * 0.8})`);
  grad.addColorStop(1, "transparent");
  ctx.beginPath(); ctx.arc(cx, cy, 18 * burst, 0, Math.PI * 2);
  ctx.fillStyle = grad; ctx.fill();
}

function drawAtomCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, el: string) {
  const color = elColor(el);
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
  g.addColorStop(0, color + "dd");
  g.addColorStop(1, color);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.font = `bold ${r > 14 ? 11 : 9}px sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(el, x, y);
}

function drawNoData(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = "#475569"; ctx.font = "13px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("Enter a reaction to visualize", W / 2, H / 2);
}
