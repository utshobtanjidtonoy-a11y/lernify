"use client";

// roundRect polyfill for older environments
function safeRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

import { useEffect, useRef, useState, useCallback } from "react";

const G = 9.8;
const SCALE = 5; // pixels per meter

interface Point { x: number; y: number; }

export default function ProjectileVisualization() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const animRef    = useRef<number>(0);
  const running    = useRef(false);
  const trail      = useRef<Point[]>([]);

  const [speed,  setSpeed]  = useState(25);
  const [angle,  setAngle]  = useState(45);
  const [info, setInfo] = useState({ x: 0, y: 0, vx: 0, vy: 0, t: 0 });
  const [results, setResults] = useState<{ range: number; height: number; time: number } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const getFloor = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas ? canvas.height - 50 : 250;
  }, []);

  const draw = useCallback((px = 80, py = -1, vx = 0, vy = 0, t = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx   = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const floor = getFloor();

    ctx.clearRect(0, 0, W, H);

    // Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, floor);
    skyGrad.addColorStop(0, "#f0f9ff");
    skyGrad.addColorStop(1, "#bfdbfe");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, floor);

    // Ground
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(0, floor, W, H - floor);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(0, floor, W, 6);

    // Grid lines (faint)
    ctx.strokeStyle = "rgba(148,163,184,0.25)";
    ctx.lineWidth = 1;
    for (let gx = 80; gx < W; gx += 60) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, floor); ctx.stroke();
    }
    for (let gy = floor - 50; gy > 0; gy -= 50) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // Theoretical parabola (preview)
    const θ = (angle * Math.PI) / 180;
    ctx.strokeStyle = "rgba(99,102,241,0.3)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const totalT = (2 * speed * Math.sin(θ)) / G;
    for (let ti = 0; ti <= totalT; ti += 0.05) {
      const px2 = 80 + speed * Math.cos(θ) * ti * SCALE;
      const py2 = floor - speed * Math.sin(θ) * ti * SCALE + 0.5 * G * ti * ti * SCALE;
      if (ti === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
      if (py2 > floor) break;
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Trail
    if (trail.current.length > 1) {
      ctx.strokeStyle = "rgba(59,130,246,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      trail.current.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }

    const ry = py < 0 ? floor : py;

    // Angle arc + arrow at launch
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(80, floor, 35, -θ, 0, true);
    ctx.stroke();
    ctx.fillStyle = "#6366f1";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${angle}°`, 90, floor - 10);

    // Velocity vector
    if (running.current || t > 0) {
      const vscale = 2.5;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(px, ry);
      ctx.lineTo(px + vx * vscale, ry - vy * vscale);
      ctx.stroke();
      ctx.fillStyle = "#ef4444";
      const vAngle = Math.atan2(-vy, vx);
      ctx.save();
      ctx.translate(px + vx * vscale, ry - vy * vscale);
      ctx.rotate(vAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(-12, -5); ctx.lineTo(-12, 5);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // Ball
    const ballR = 12;
    const ballGrad = ctx.createRadialGradient(px - 3, ry - 3, 2, px, ry, ballR);
    ballGrad.addColorStop(0, "#93c5fd");
    ballGrad.addColorStop(1, "#1d4ed8");
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(px, ry, ballR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1e40af";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Ground marker line at landing
    if (results) {
      const landX = 80 + results.range * SCALE;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(landX, floor - 20); ctx.lineTo(landX, floor + 10); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${results.range.toFixed(1)}m`, landX, floor - 24);
    }

    // HUD overlay
    ctx.fillStyle = "rgba(15,23,42,0.65)";
    ctx.beginPath(); safeRoundRect(ctx, 8, 8, 170, running.current ? 95 : 60, 10); ctx.fill();
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    const u0x = speed * Math.cos(θ);
    const u0y = speed * Math.sin(θ);
    ctx.fillText(`Launch: ${speed} m/s @ ${angle}°`, 16, 26);
    ctx.fillText(`uₓ = ${u0x.toFixed(1)} m/s  uᵧ = ${u0y.toFixed(1)} m/s`, 16, 43);
    if (running.current) {
      ctx.fillText(`t = ${t.toFixed(2)} s`, 16, 60);
      ctx.fillText(`vₓ=${vx.toFixed(1)}  vᵧ=${vy.toFixed(1)} m/s`, 16, 77);
      ctx.fillText(`x=${((px-80)/SCALE).toFixed(1)}m  y=${((floor-ry)/SCALE).toFixed(1)}m`, 16, 94);
    }
  }, [angle, speed, results]);

  const launch = () => {
    cancelAnimationFrame(animRef.current);
    running.current = true;
    trail.current = [];
    setIsRunning(true);
    setResults(null);

    const θ  = (angle * Math.PI) / 180;
    const u0x = speed * Math.cos(θ);
    const u0y = speed * Math.sin(θ);
    const floor = getFloor();
    let px = 80, py = floor, vx = u0x, vy = u0y, t = 0;
    const dt = 0.025;

    function step() {
      if (!running.current) return;
      t  += dt;
      vy -= G * dt;
      px += vx * dt * SCALE;
      py -= vy * dt * SCALE;

      trail.current.push({ x: px, y: py });
      if (trail.current.length > 300) trail.current.shift();

      setInfo({ x: parseFloat(((px - 80) / SCALE).toFixed(1)), y: parseFloat(((floor - py) / SCALE).toFixed(1)), vx: parseFloat(vx.toFixed(1)), vy: parseFloat(vy.toFixed(1)), t: parseFloat(t.toFixed(2)) });

      if (py >= floor) {
        py = floor;
        running.current = false;
        setIsRunning(false);
        const range = (px - 80) / SCALE;
        const maxH  = (speed * Math.sin(θ)) ** 2 / (2 * G);
        const tof   = 2 * speed * Math.sin(θ) / G;
        setResults({ range: parseFloat(range.toFixed(2)), height: parseFloat(maxH.toFixed(2)), time: parseFloat(tof.toFixed(2)) });
        draw(px, py, vx, vy, t);
        return;
      }

      draw(px, py, vx, vy, t);
      animRef.current = requestAnimationFrame(step);
    }
    animRef.current = requestAnimationFrame(step);
  };

  const reset = () => {
    cancelAnimationFrame(animRef.current);
    running.current = false;
    trail.current = [];
    setIsRunning(false);
    setResults(null);
    setInfo({ x: 0, y: 0, vx: 0, vy: 0, t: 0 });
    const θ = (angle * Math.PI) / 180;
    draw(80, -1, speed * Math.cos(θ), speed * Math.sin(θ), 0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      reset();
    });
    ro.observe(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    reset();
    return () => { ro.disconnect(); cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => { if (!isRunning) reset(); }, [angle, speed]);

  const sliderClass = "w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500";

  return (
    <div className="space-y-4">
      <div className="relative bg-slate-50 dark:bg-slate-800/40 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700" style={{ height: 260 }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Live info row */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: "Time",   value: `${info.t}s`,    color: "text-blue-600 dark:text-blue-400" },
          { label: "X",      value: `${info.x}m`,    color: "text-indigo-600 dark:text-indigo-400" },
          { label: "Y",      value: `${info.y}m`,    color: "text-green-600 dark:text-green-400" },
          { label: "vₓ",     value: `${info.vx}m/s`, color: "text-orange-600 dark:text-orange-400" },
          { label: "vᵧ",     value: `${info.vy}m/s`, color: "text-purple-600 dark:text-purple-400" },
        ].map((d) => (
          <div key={d.label} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2 text-center">
            <p className={`text-xs font-bold ${d.color}`}>{d.value}</p>
            <p className="text-xs text-slate-400">{d.label}</p>
          </div>
        ))}
      </div>

      {/* Results */}
      {results && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Range",       value: `${results.range} m`,  icon: "📏", color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
            { label: "Max Height",  value: `${results.height} m`, icon: "📐", color: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800" },
            { label: "Time of Flight", value: `${results.time} s`, icon: "⏱", color: "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800" },
          ].map((r) => (
            <div key={r.label} className={`p-3 rounded-xl border text-center ${r.color}`}>
              <p className="text-lg">{r.icon}</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{r.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{r.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between mb-1">
            <span>Initial Speed</span><span className="text-blue-600 dark:text-blue-400">{speed} m/s</span>
          </label>
          <input type="range" min="5" max="50" value={speed} onChange={(e) => { setSpeed(+e.target.value); }} className={sliderClass} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between mb-1">
            <span>Launch Angle</span><span className="text-blue-600 dark:text-blue-400">{angle}°</span>
          </label>
          <input type="range" min="5" max="85" value={angle} onChange={(e) => { setAngle(+e.target.value); }} className={sliderClass} />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={launch} disabled={isRunning} className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors">
          🚀 Launch
        </button>
        <button onClick={reset} className="flex-1 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors">
          ↺ Reset
        </button>
      </div>

      <p className="text-xs text-center text-slate-400 dark:text-slate-500 font-mono">
        R = u²·sin(2θ)/g = {speed}²·sin({2 * angle}°)/9.8 = <span className="font-bold text-blue-600 dark:text-blue-400">{(speed ** 2 * Math.sin((2 * angle * Math.PI) / 180) / G).toFixed(1)} m</span>
      </p>
    </div>
  );
}
