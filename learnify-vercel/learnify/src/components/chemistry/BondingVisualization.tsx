"use client";

import { useEffect, useRef, useState } from "react";
import type { BondingType } from "@/lib/chemistry/engine";

interface Props {
  bondType: BondingType;
  element1: string;
  element2: string;
  color1?: string;
  color2?: string;
}

export default function BondingVisualization({ bondType, element1, element2, color1 = "#3b82f6", color2 = "#ef4444" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

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

    function draw() {
      const ctx = canvas!.getContext("2d")!;
      const W = canvas!.width, H = canvas!.height;
      const cx = W / 2, cy = H / 2;
      tRef.current += 0.025;
      const t = tRef.current;

      ctx.clearRect(0, 0, W, H);
      // Background
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, H);

      if (bondType === "ionic") drawIonic(ctx, W, H, cx, cy, t, element1, element2, color1, color2);
      else if (bondType === "covalent") drawCovalent(ctx, W, H, cx, cy, t, element1, element2, color1, color2);
      else if (bondType === "metallic") drawMetallic(ctx, W, H, cx, cy, t, element1, color1);
      else drawCoordinate(ctx, W, H, cx, cy, t, element1, element2, color1, color2);

      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => { ro.disconnect(); cancelAnimationFrame(animRef.current); };
  }, [bondType, element1, element2, color1, color2]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40" style={{ height: 200 }}>
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute top-2 left-3 text-xs font-bold text-slate-500 dark:text-slate-400 capitalize">
        {bondType} Bond
      </div>
    </div>
  );
}

// ── Ionic: electron transfer animation ──────────────────────────
function drawIonic(ctx: CanvasRenderingContext2D, W: number, H: number, cx: number, cy: number, t: number, el1: string, el2: string, c1: string, c2: string) {
  const gap = Math.min(W * 0.22, 80);
  const x1 = cx - gap, x2 = cx + gap;

  // Electron transfer arc
  const arc = Math.sin(t * 0.8);
  const ex = x1 + (x2 - x1) * ((Math.sin(t * 1.2) + 1) / 2);
  const ey = cy - 30 * Math.sin(Math.PI * ((ex - x1) / (x2 - x1)));

  // Bond line
  ctx.strokeStyle = "rgba(148,163,184,0.4)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(x1 + 22, cy); ctx.lineTo(x2 - 22, cy); ctx.stroke();
  ctx.setLineDash([]);

  // Atom 1 (cation — loses electron)
  drawAtom(ctx, x1, cy, 22, c1, el1, "+");
  // Atom 2 (anion — gains electron)
  drawAtom(ctx, x2, cy, 22, c2, el2, "−");

  // Travelling electron
  const grd = ctx.createRadialGradient(ex, ey, 1, ex, ey, 7);
  grd.addColorStop(0, "#fff");
  grd.addColorStop(1, "#fbbf24");
  ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2);
  ctx.fillStyle = grd; ctx.fill();
  ctx.strokeStyle = "#d97706"; ctx.lineWidth = 1.5; ctx.stroke();

  // Label
  ctx.fillStyle = "#64748b"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("Electron transfer →", cx, cy + 42);
}

// ── Covalent: shared electron pair orbiting ──────────────────────
function drawCovalent(ctx: CanvasRenderingContext2D, W: number, H: number, cx: number, cy: number, t: number, el1: string, el2: string, c1: string, c2: string) {
  const gap = Math.min(W * 0.2, 75);
  const x1 = cx - gap, x2 = cx + gap;

  // Overlap region
  ctx.beginPath();
  ctx.arc(x1, cy, 30, 0, Math.PI * 2);
  ctx.fillStyle = c1 + "22"; ctx.fill();
  ctx.beginPath();
  ctx.arc(x2, cy, 30, 0, Math.PI * 2);
  ctx.fillStyle = c2 + "22"; ctx.fill();

  // Bond axis
  ctx.strokeStyle = "rgba(148,163,184,0.5)"; ctx.lineWidth = 1;
  ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.moveTo(x1 - 30, cy); ctx.lineTo(x2 + 30, cy); ctx.stroke();
  ctx.setLineDash([]);

  // Two shared electrons orbiting the bond centre
  for (let i = 0; i < 2; i++) {
    const phase = i * Math.PI;
    const ex = cx + 12 * Math.cos(t * 2 + phase);
    const ey = cy + 16 * Math.sin(t * 2 + phase);
    const eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, 6);
    eg.addColorStop(0, "#fff");
    eg.addColorStop(1, "#a78bfa");
    ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2);
    ctx.fillStyle = eg; ctx.fill();
    ctx.strokeStyle = "#7c3aed"; ctx.lineWidth = 1; ctx.stroke();
  }

  drawAtom(ctx, x1, cy, 22, c1, el1);
  drawAtom(ctx, x2, cy, 22, c2, el2);

  ctx.fillStyle = "#64748b"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("Shared electron pair", cx, cy + 45);
}

// ── Metallic: sea of electrons ───────────────────────────────────
function drawMetallic(ctx: CanvasRenderingContext2D, W: number, H: number, cx: number, cy: number, t: number, el: string, color: string) {
  // Lattice of 3×3 cations
  const spacing = Math.min(W * 0.18, 55);
  const positions: [number, number][] = [];
  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      positions.push([cx + col * spacing, cy + row * spacing * 0.85]);
    }
  }

  // Free electrons drifting
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + t * (0.4 + i * 0.07);
    const r = 18 + 60 * ((i * 1.3) % 1);
    const ex = cx + r * Math.cos(angle);
    const ey = cy + r * Math.sin(angle) * 0.5;
    if (ex < 8 || ex > W - 8 || ey < 8 || ey > H - 8) continue;
    const eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, 5);
    eg.addColorStop(0, "#fff"); eg.addColorStop(1, "#fbbf24");
    ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2);
    ctx.fillStyle = eg; ctx.fill();
    ctx.strokeStyle = "#d97706"; ctx.lineWidth = 1; ctx.stroke();
  }

  for (const [px, py] of positions) {
    if (px < 12 || px > W - 12 || py < 12 || py > H - 12) continue;
    drawAtom(ctx, px, py, 16, color, el, "+");
  }

  ctx.fillStyle = "#64748b"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("Delocalised electron sea", cx, H - 8);
}

// ── Coordinate: donor lone pair ──────────────────────────────────
function drawCoordinate(ctx: CanvasRenderingContext2D, W: number, H: number, cx: number, cy: number, t: number, el1: string, el2: string, c1: string, c2: string) {
  const gap = Math.min(W * 0.2, 75);
  const x1 = cx - gap, x2 = cx + gap;

  // Dative arrow
  ctx.strokeStyle = "#10b981"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x1 + 24, cy); ctx.lineTo(x2 - 24, cy); ctx.stroke();
  ctx.fillStyle = "#10b981";
  ctx.beginPath();
  ctx.moveTo(x2 - 22, cy);
  ctx.lineTo(x2 - 32, cy - 7);
  ctx.lineTo(x2 - 32, cy + 7);
  ctx.closePath(); ctx.fill();

  // Lone pair dots on donor
  const lx = x1 - 28;
  for (let i = 0; i < 2; i++) {
    const ldy = (i - 0.5) * 12;
    const pulse = 4 + Math.sin(t * 2) * 1.5;
    ctx.beginPath(); ctx.arc(lx, cy + ldy, pulse, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24"; ctx.fill();
    ctx.strokeStyle = "#d97706"; ctx.lineWidth = 1; ctx.stroke();
  }

  drawAtom(ctx, x1, cy, 22, c1, el1);
  drawAtom(ctx, x2, cy, 22, c2, el2);

  ctx.fillStyle = "#64748b"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("Lone pair donated →", cx, cy + 45);
  ctx.fillStyle = "#d97706"; ctx.font = "10px sans-serif";
  ctx.fillText("lone pair", lx, cy - 24);
}

// ── Atom circle helper ───────────────────────────────────────────
function drawAtom(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, label: string, charge?: string) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r);
  g.addColorStop(0, lighten(color, 0.6));
  g.addColorStop(1, color);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = darken(color, 0.3); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.font = `bold ${r > 18 ? 13 : 10}px sans-serif`; ctx.textAlign = "center";
  ctx.fillText(label, x, y + 4);
  if (charge) {
    ctx.fillStyle = "#fff"; ctx.font = "bold 9px sans-serif";
    ctx.fillText(charge, x + r * 0.7, y - r * 0.6);
  }
}

function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#",""), 16);
  const r = Math.min(255, ((n>>16)&0xff) + Math.round(255*amt));
  const g = Math.min(255, ((n>>8)&0xff)  + Math.round(255*amt));
  const b = Math.min(255,  (n&0xff)       + Math.round(255*amt));
  return `rgb(${r},${g},${b})`;
}
function darken(hex: string, amt: number): string {
  const n = parseInt(hex.replace("#",""), 16);
  const r = Math.max(0, ((n>>16)&0xff) - Math.round(255*amt));
  const g = Math.max(0, ((n>>8)&0xff)  - Math.round(255*amt));
  const b = Math.max(0,  (n&0xff)       - Math.round(255*amt));
  return `rgb(${r},${g},${b})`;
}
