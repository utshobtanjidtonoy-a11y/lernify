"use client";

import { useEffect, useRef } from "react";
import { GEOMETRIES } from "@/lib/chemistry/engine";

interface Props {
  geometry: string;
  formula: string;
  color?: string;
}

export default function GeometryVisualization({ geometry, formula, color = "#3b82f6" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      renderFrame();
    });
    ro.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    function renderFrame() {
      tRef.current += 0.012;
      const ctx = canvas!.getContext("2d")!;
      const W = canvas!.width, H = canvas!.height;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);
      drawGeometry(ctx, W, H, geometry, color, tRef.current);
      animRef.current = requestAnimationFrame(renderFrame);
    }
    renderFrame();
    return () => { ro.disconnect(); cancelAnimationFrame(animRef.current); };
  }, [geometry, color]);

  const geo = GEOMETRIES[geometry] ?? GEOMETRIES["tetrahedral"];

  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50" style={{ height: 220 }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3 border border-blue-100 dark:border-blue-900">
          <p className="font-bold text-blue-700 dark:text-blue-400">{geo.name}</p>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">{geo.description}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Bond angle: <span className="text-blue-600 dark:text-blue-400">{geo.bondAngle}</span></p>
          <p className="text-slate-400 mt-1">e.g. {geo.examples.slice(0,2).join(", ")}</p>
        </div>
      </div>
    </div>
  );
}

function drawGeometry(ctx: CanvasRenderingContext2D, W: number, H: number, geometry: string, color: string, t: number) {
  const cx = W / 2, cy = H / 2 - 10;
  const r = Math.min(W, H) * 0.28;

  switch (geometry) {
    case "linear":            drawLinear(ctx, cx, cy, r, color, t); break;
    case "bent":              drawBent(ctx, cx, cy, r, color, t); break;
    case "trigonal_planar":   drawTrigonalPlanar(ctx, cx, cy, r, color, t); break;
    case "trigonal_pyramidal":drawTrigonalPyramidal(ctx, cx, cy, r, color, t); break;
    case "tetrahedral":       drawTetrahedral(ctx, cx, cy, r, color, t); break;
    case "trigonal_bipyramidal": drawTrigBipyramidal(ctx, cx, cy, r, color, t); break;
    case "octahedral":        drawOctahedral(ctx, cx, cy, r, color, t); break;
    default:                  drawTetrahedral(ctx, cx, cy, r, color, t);
  }
}

// ── Helpers ──────────────────────────────────────────────────────
function atom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, col: string, label: string) {
  const g = ctx.createRadialGradient(x - r*0.3, y - r*0.3, 1, x, y, r);
  g.addColorStop(0, col + "cc");
  g.addColorStop(1, col);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.2)"; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.font = `bold ${r > 14 ? 12 : 9}px sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
}

function bond(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, col: string, dashed = false) {
  ctx.save();
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = "round";
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function angleArc(ctx: CanvasRenderingContext2D, cx: number, cy: number, a1: number, a2: number, r: number, label: string, color: string) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, r, a1, a2); ctx.stroke();
  const midAngle = (a1 + a2) / 2;
  const lx = cx + (r + 12) * Math.cos(midAngle);
  const ly = cy + (r + 12) * Math.sin(midAngle);
  ctx.fillStyle = color; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(label, lx, ly);
  ctx.restore();
}

function drawLinear(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string, t: number) {
  const rot = Math.sin(t * 0.5) * 0.15;
  const x1 = cx + Math.cos(Math.PI + rot) * r;
  const y1 = cy + Math.sin(Math.PI + rot) * r;
  const x2 = cx + Math.cos(rot) * r;
  const y2 = cy + Math.sin(rot) * r;
  bond(ctx, x1, y1, x2, y2, "#94a3b8");
  atom(ctx, x1, y1, 16, "#60a5fa", "H");
  atom(ctx, cx, cy, 20, col, "C");
  atom(ctx, x2, y2, 16, "#60a5fa", "H");
  angleArc(ctx, cx, cy, Math.PI + rot, rot > 0 ? rot : 2*Math.PI + rot, 28, "180°", "#6366f1");
}

function drawBent(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string, t: number) {
  const spread = (104.5 * Math.PI) / 180;
  const base = -Math.PI / 2 + Math.sin(t * 0.5) * 0.1;
  const a1 = base - spread / 2, a2 = base + spread / 2;
  const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
  const x2 = cx + Math.cos(a2) * r, y2 = cy + Math.sin(a2) * r;
  // Lone-pair indicators
  for (let i = 0; i < 2; i++) {
    const lp = base + Math.PI + (i - 0.5) * 0.4;
    const lx = cx + Math.cos(lp) * 26, ly = cy + Math.sin(lp) * 26;
    ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI*2);
    ctx.fillStyle = "#fbbf24"; ctx.fill();
  }
  bond(ctx, cx, cy, x1, y1, "#94a3b8");
  bond(ctx, cx, cy, x2, y2, "#94a3b8");
  atom(ctx, x1, y1, 16, "#60a5fa", "H");
  atom(ctx, x2, y2, 16, "#60a5fa", "H");
  atom(ctx, cx, cy, 20, col, "O");
  angleArc(ctx, cx, cy, a1, a2, 30, "104.5°", "#6366f1");
}

function drawTrigonalPlanar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string, t: number) {
  const positions = [0, 1, 2].map(i => {
    const angle = (i * 2 * Math.PI) / 3 + Math.sin(t * 0.4) * 0.05;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as [number, number];
  });
  positions.forEach(([x, y]) => bond(ctx, cx, cy, x, y, "#94a3b8"));
  atom(ctx, cx, cy, 20, col, "B");
  positions.forEach(([x, y]) => atom(ctx, x, y, 15, "#10b981", "F"));
  const a0 = 0, a1 = (2*Math.PI)/3;
  angleArc(ctx, cx, cy, a0, a1, 32, "120°", "#6366f1");
}

function drawTrigonalPyramidal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string, t: number) {
  const rot = t * 0.4;
  const positions = [0, 1, 2].map(i => {
    const angle = (i * 2 * Math.PI) / 3 + rot;
    return [cx + Math.cos(angle) * r * 0.9, cy + 14 + Math.sin(angle) * r * 0.55] as [number, number];
  });
  positions.forEach(([x, y]) => bond(ctx, cx, cy - 10, x, y, "#94a3b8"));
  // Lone pair at top
  ctx.beginPath(); ctx.arc(cx, cy - 36, 5, 0, Math.PI*2);
  ctx.fillStyle = "#fbbf24"; ctx.fill();
  ctx.font = "9px sans-serif"; ctx.fillStyle = "#d97706"; ctx.textAlign = "center";
  ctx.fillText("LP", cx, cy - 46);
  atom(ctx, cx, cy - 10, 20, col, "N");
  positions.forEach(([x, y]) => atom(ctx, x, y, 15, "#60a5fa", "H"));
  angleArc(ctx, cx, cy + 4, -Math.PI*0.8, -Math.PI*0.2, 28, "107°", "#6366f1");
}

function drawTetrahedral(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string, t: number) {
  const rot = t * 0.35;
  const pts: [number, number, boolean][] = [
    [cx, cy - r, false],
    [cx + Math.cos(rot) * r * 0.9, cy + r * 0.35 + Math.sin(rot) * r * 0.3, false],
    [cx + Math.cos(rot + 2.094) * r * 0.9, cy + r * 0.35 + Math.sin(rot + 2.094) * r * 0.3, false],
    [cx + Math.cos(rot + 4.189) * r * 0.9, cy + r * 0.35 + Math.sin(rot + 4.189) * r * 0.3, false],
  ];
  pts.forEach(([x, y, dashed]) => bond(ctx, cx, cy, x, y, "#94a3b8", dashed));
  atom(ctx, cx, cy, 20, col, "C");
  pts.forEach(([x, y]) => atom(ctx, x, y, 15, "#60a5fa", "H"));
  angleArc(ctx, cx, cy, -Math.PI/2, -Math.PI/2 + 1.91, 30, "109.5°", "#6366f1");
}

function drawTrigBipyramidal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string, t: number) {
  const rot = t * 0.3;
  const axial: [number, number][] = [[cx, cy - r], [cx, cy + r]];
  const equatorial: [number, number][] = [0, 1, 2].map(i => {
    const a = (i * 2 * Math.PI) / 3 + rot;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.5] as [number, number];
  });
  [...axial, ...equatorial].forEach(([x, y]) => bond(ctx, cx, cy, x, y, "#94a3b8"));
  atom(ctx, cx, cy, 20, col, "P");
  axial.forEach(([x, y]) => atom(ctx, x, y, 14, "#10b981", "F"));
  equatorial.forEach(([x, y]) => atom(ctx, x, y, 14, "#10b981", "F"));
  ctx.fillStyle = "#6366f1"; ctx.font = "9px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("90° (ax)", cx + r * 0.55, cy - r * 0.45);
  ctx.fillText("120° (eq)", cx - r * 0.65, cy + r * 0.6);
}

function drawOctahedral(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string, t: number) {
  const rot = t * 0.25;
  const axis: [number, number][] = [[cx, cy - r], [cx, cy + r]];
  const plane: [number, number][] = [0, 1, 2, 3].map(i => {
    const a = (i * Math.PI) / 2 + rot;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.45] as [number, number];
  });
  [...axis, ...plane].forEach(([x, y]) => bond(ctx, cx, cy, x, y, "#94a3b8"));
  atom(ctx, cx, cy, 20, col, "S");
  axis.forEach(([x, y]) => atom(ctx, x, y, 13, "#10b981", "F"));
  plane.forEach(([x, y]) => atom(ctx, x, y, 13, "#10b981", "F"));
  ctx.fillStyle = "#6366f1"; ctx.font = "9px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("All 90°", cx, cy + r + 16);
}
