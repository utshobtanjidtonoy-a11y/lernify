"use client";

import { useEffect, useRef, useState } from "react";
import { generateElectronConfig } from "@/lib/chemistry/engine";
import type { ElectronConfig, SubshellConfig } from "@/lib/chemistry/engine";

interface Props {
  atomicNumber: number;
  symbol: string;
  elementColor?: string;
}

export default function ElectronConfigVisualization({ atomicNumber, symbol, elementColor = "#3b82f6" }: Props) {
  const [config, setConfig] = useState<ElectronConfig | null>(null);
  const [view, setView] = useState<"config" | "orbitals" | "shells">("config");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const cfg = generateElectronConfig(atomicNumber, symbol);
    setConfig(cfg);
  }, [atomicNumber, symbol]);

  // Shell animation
  useEffect(() => {
    if (view !== "shells") return;
    const canvas = canvasRef.current;
    if (!canvas || !config) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    function frame() {
      tRef.current += 0.018;
      drawShells(canvas!, config!, tRef.current, elementColor);
      animRef.current = requestAnimationFrame(frame);
    }
    frame();
    return () => { ro.disconnect(); cancelAnimationFrame(animRef.current); };
  }, [view, config, elementColor]);

  if (!config) return <div className="h-32 flex items-center justify-center text-slate-400 text-sm">Computing…</div>;

  return (
    <div className="space-y-3">
      {/* Tab */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {(["config","orbitals","shells"] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200 ${
              view === v ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {v === "config" ? "Configuration" : v === "orbitals" ? "Orbitals" : "Shell Model"}
          </button>
        ))}
      </div>

      {/* Configuration string */}
      {view === "config" && (
        <div className="space-y-3">
          <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-4">
            <p className="text-xs text-slate-400 mb-2">Full electron configuration:</p>
            <p className="font-mono text-sm text-green-400 leading-relaxed break-all">{config.fullConfig}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4">
            <p className="text-xs text-slate-400 mb-2">Shorthand (noble gas notation):</p>
            <p className="font-mono text-sm text-blue-600 dark:text-blue-400 leading-relaxed break-all">{config.shortConfig}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Valence e⁻", value: config.valenceElectrons, icon: "⚡" },
              { label: "Block", value: config.block.toUpperCase(), icon: "🔷" },
              { label: "Atomic №", value: atomicNumber, icon: "🔢" },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                <p className="text-base">{s.icon}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orbital diagram */}
      {view === "orbitals" && (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {config.shells.map(shell => (
            <div key={shell.shell}>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Shell {shell.shell}</p>
              {shell.subshells.map(sub => (
                <OrbitalRow key={sub.subshell} sub={sub} color={elementColor} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Shell model canvas */}
      {view === "shells" && (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" style={{ height: 220 }}>
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      )}
    </div>
  );
}

// ── Orbital row: boxes with up/down arrows ───────────────────────
function OrbitalRow({ sub, color }: { sub: SubshellConfig; color: string }) {
  const typeColors: Record<string, string> = {
    s: "#3b82f6", p: "#10b981", d: "#f59e0b", f: "#8b5cf6",
  };
  const tc = typeColors[sub.subshell.slice(-1)] ?? "#3b82f6";

  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xs font-mono font-bold w-8 text-slate-600 dark:text-slate-400" style={{ color: tc }}>
        {sub.subshell}
      </span>
      <div className="flex gap-1">
        {sub.orbitals.map((orb, i) => (
          <div key={i} className="w-8 h-8 border-2 rounded-lg flex items-center justify-center relative"
            style={{ borderColor: tc + "60", backgroundColor: tc + "10" }}>
            {orb.electrons >= 1 && (
              <span className="absolute top-0.5 text-xs leading-none" style={{ color: tc }}>↑</span>
            )}
            {orb.electrons === 2 && (
              <span className="absolute bottom-0.5 text-xs leading-none rotate-180" style={{ color: tc }}>↑</span>
            )}
          </div>
        ))}
      </div>
      <span className="text-xs text-slate-400">{sub.electrons}/{sub.capacity}</span>
    </div>
  );
}

// ── Shell model canvas draw ──────────────────────────────────────
function drawShells(canvas: HTMLCanvasElement, config: ElectronConfig, t: number, color: string) {
  const ctx = canvas.getContext("2d")!;
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H);

  const maxShells = config.shells.length;
  const shellRadius = Math.min(cx, cy) * 0.85 / maxShells;

  // Draw shells and electrons
  config.shells.forEach((shell, si) => {
    const r = (si + 1) * shellRadius;
    // Shell circle
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(100,116,139,0.3)`; ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);

    // Total electrons in shell
    const totalE = shell.subshells.reduce((s, sub) => s + sub.electrons, 0);
    for (let i = 0; i < totalE; i++) {
      const speed = 0.4 + si * 0.15;
      const angle = ((i / totalE) * Math.PI * 2) + t * speed * (si % 2 === 0 ? 1 : -1);
      const ex = cx + r * Math.cos(angle);
      const ey = cy + r * Math.sin(angle);
      const eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, 4);
      eg.addColorStop(0, "#fff");
      eg.addColorStop(1, color);
      ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fillStyle = eg; ctx.fill();
    }

    // Shell label
    ctx.fillStyle = "rgba(100,116,139,0.7)"; ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`n=${shell.shell} (${totalE}e)`, cx + r * 0.7 + 4, cy - r * 0.7 - 4);
  });

  // Nucleus
  const nr = Math.min(18, 6 + config.atomicNumber * 0.08);
  const ng = ctx.createRadialGradient(cx, cy, 2, cx, cy, nr);
  ng.addColorStop(0, "#fef9c3");
  ng.addColorStop(0.5, color);
  ng.addColorStop(1, darken(color, 0.3));
  ctx.beginPath(); ctx.arc(cx, cy, nr, 0, Math.PI * 2);
  ctx.fillStyle = ng; ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = `bold ${nr > 12 ? 11 : 8}px sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(config.symbol, cx, cy);
}

function darken(hex: string, amt: number): string {
  try {
    const n = parseInt(hex.replace("#",""), 16);
    const r = Math.max(0, ((n>>16)&0xff) - Math.round(255*amt));
    const g = Math.max(0, ((n>>8)&0xff)  - Math.round(255*amt));
    const b = Math.max(0,  (n&0xff)       - Math.round(255*amt));
    return `rgb(${r},${g},${b})`;
  } catch { return hex; }
}
