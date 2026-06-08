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

import { useEffect, useRef, useState } from "react";

interface Block {
  x: number; y: number; vx: number; vy: number;
  ax: number; ay: number;
  mass: number; color: string; label: string;
  width: number; height: number;
}

export default function NewtonVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const stateRef  = useRef<{ block: Block; floor: number; running: boolean; t: number }>({
    block: { x: 60, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, mass: 5, color: "#3b82f6", label: "5 kg", width: 60, height: 40 },
    floor: 0,
    running: false,
    t: 0,
  });

  const [force, setForce]   = useState(20);
  const [mass,  setMass]    = useState(5);
  const [mu,    setMu]      = useState(0.1);   // friction coefficient
  const [info,  setInfo]    = useState({ a: 0, v: 0, p: 0, ke: 0 });
  const [running, setRunning] = useState(false);

  const G = 9.8;

  function reset() {
    const s = stateRef.current;
    s.running = false;
    s.t = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    s.floor = canvas.height - 60;
    s.block = { x: 60, y: s.floor - 40, vx: 0, vy: 0, ax: 0, ay: 0,
      mass, color: "#3b82f6", label: `${mass} kg`, width: 60, height: 40 };
    setRunning(false);
    setInfo({ a: 0, v: 0, p: 0, ke: 0 });
    draw();
  }

  function start() {
    const s = stateRef.current;
    s.running = true;
    const N  = mass * G;
    const f  = mu * N;
    const a  = (force - f) / mass;
    s.block.mass = mass;
    s.block.label = `${mass} kg`;
    s.block.ax = Math.max(0, a);
    setRunning(true);
    animate();
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { block, floor } = stateRef.current;
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#f0f9ff");
    grad.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Floor
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(0, floor, W, H - floor);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(0, floor, W, 4);

    // Floor grid lines
    ctx.strokeStyle = "#b0c4de";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, floor);
      ctx.lineTo(x + 20, floor + (H - floor));
      ctx.stroke();
    }

    // Shadow under block
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.beginPath();
    ctx.ellipse(block.x + block.width / 2, floor + 4, block.width / 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Block
    const bx = block.x, by = block.y;
    ctx.fillStyle = block.color;
    ctx.beginPath();
    safeRoundRect(ctx, bx, by, block.width, block.height, 6);
    ctx.fill();
    // Block shine
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.beginPath();
    safeRoundRect(ctx, bx + 6, by + 5, block.width - 12, 10, 4);
    ctx.fill();

    // Label
    ctx.fillStyle = "#fff";
    ctx.font = "bold 13px Poppins, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(block.label, bx + block.width / 2, by + block.height / 2 + 5);

    // Force arrow (if running)
    if (stateRef.current.running || block.vx > 0) {
      const arrowLen = Math.min(force * 3, 120);
      const ax = bx + block.width, ay = by + block.height / 2;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + arrowLen, ay);
      ctx.stroke();
      // Arrowhead
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.moveTo(ax + arrowLen, ay);
      ctx.lineTo(ax + arrowLen - 12, ay - 7);
      ctx.lineTo(ax + arrowLen - 12, ay + 7);
      ctx.closePath();
      ctx.fill();
      // F label
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`F=${force}N`, ax + 4, ay - 10);
    }

    // Friction arrow (opposing)
    if (block.vx > 0.1) {
      const N = mass * G;
      const fric = mu * N;
      const fLen = Math.min(fric * 3, 80);
      const fx = bx, fy = by + block.height / 2;
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx - fLen, fy);
      ctx.stroke();
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(fx - fLen, fy);
      ctx.lineTo(fx - fLen + 10, fy - 6);
      ctx.lineTo(fx - fLen + 10, fy + 6);
      ctx.closePath();
      ctx.fill();
      ctx.textAlign = "right";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`f=${fric.toFixed(1)}N`, fx - 4, fy - 8);
    }

    // Weight arrow
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + block.width / 2, by + block.height);
    ctx.lineTo(bx + block.width / 2, by + block.height + 30);
    ctx.stroke();
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.moveTo(bx + block.width / 2, by + block.height + 32);
    ctx.lineTo(bx + block.width / 2 - 6, by + block.height + 20);
    ctx.lineTo(bx + block.width / 2 + 6, by + block.height + 20);
    ctx.closePath();
    ctx.fill();
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`W=${(mass * G).toFixed(0)}N`, bx + block.width / 2, by + block.height + 46);

    // Normal force arrow
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx + block.width / 2, by);
    ctx.lineTo(bx + block.width / 2, by - 30);
    ctx.stroke();
    ctx.fillStyle = "#8b5cf6";
    ctx.beginPath();
    ctx.moveTo(bx + block.width / 2, by - 32);
    ctx.lineTo(bx + block.width / 2 - 6, by - 20);
    ctx.lineTo(bx + block.width / 2 + 6, by - 20);
    ctx.closePath();
    ctx.fill();
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`N=${(mass * G).toFixed(0)}N`, bx + block.width / 2, by - 36);
  }

  function animate() {
    const s = stateRef.current;
    if (!s.running) return;

    const dt = 0.016;
    s.t += dt;
    const b = s.block;
    b.vx += b.ax * dt;
    b.x  += b.vx * dt * 60; // scale pixels

    const canvas = canvasRef.current;
    if (!canvas) return;
    // Wrap
    if (b.x > canvas.width - b.width - 20) {
      b.x = canvas.width - b.width - 20;
      b.vx *= 0.3;
    }

    const a = b.ax;
    setInfo({
      a: parseFloat(a.toFixed(2)),
      v: parseFloat(b.vx.toFixed(2)),
      p: parseFloat((mass * b.vx).toFixed(2)),
      ke: parseFloat((0.5 * mass * b.vx * b.vx).toFixed(2)),
    });

    draw();
    if (s.running) animRef.current = requestAnimationFrame(animate);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeObserver = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      stateRef.current.floor = canvas.height - 60;
      stateRef.current.block.y = stateRef.current.floor - 40;
      draw();
    });
    resizeObserver.observe(canvas);
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    stateRef.current.floor = canvas.height - 60;
    stateRef.current.block.y = stateRef.current.floor - 40;
    draw();
    return () => { resizeObserver.disconnect(); cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => { reset(); }, [force, mass, mu]);

  const sliderClass = "w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500";

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div className="relative bg-slate-50 dark:bg-slate-800/40 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700" style={{ height: 220 }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Live readout */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Acceleration", value: `${info.a} m/s²`, color: "text-blue-600 dark:text-blue-400" },
          { label: "Velocity",     value: `${info.v} m/s`,  color: "text-green-600 dark:text-green-400" },
          { label: "Momentum",     value: `${info.p} kg·m/s`,color:"text-purple-600 dark:text-purple-400"},
          { label: "KE",           value: `${info.ke} J`,   color: "text-orange-600 dark:text-orange-400" },
        ].map((d) => (
          <div key={d.label} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-center">
            <p className={`text-sm font-bold ${d.color}`}>{d.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{d.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between mb-1">
            <span>Applied Force</span><span className="text-blue-600 dark:text-blue-400">{force} N</span>
          </label>
          <input type="range" min="5" max="100" value={force} onChange={(e) => setForce(+e.target.value)} className={sliderClass} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between mb-1">
            <span>Mass</span><span className="text-blue-600 dark:text-blue-400">{mass} kg</span>
          </label>
          <input type="range" min="1" max="20" value={mass} onChange={(e) => setMass(+e.target.value)} className={sliderClass} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between mb-1">
            <span>Friction (μ)</span><span className="text-blue-600 dark:text-blue-400">{mu}</span>
          </label>
          <input type="range" min="0" max="0.8" step="0.05" value={mu} onChange={(e) => setMu(+e.target.value)} className={sliderClass} />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button onClick={start} disabled={running}
          className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors">
          ▶ Apply Force
        </button>
        <button onClick={() => { stateRef.current.running = false; cancelAnimationFrame(animRef.current); reset(); }}
          className="flex-1 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
          ↺ Reset
        </button>
      </div>

      {/* Formula reminder */}
      <div className="text-xs text-slate-400 dark:text-slate-500 text-center">
        <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">F = ma</span>
        {" · "}a = (F − f) / m = ({force} − {(mu * mass * G).toFixed(1)}) / {mass} = <span className="font-semibold text-blue-600 dark:text-blue-400">{Math.max(0, (force - mu * mass * G) / mass).toFixed(2)} m/s²</span>
      </div>
    </div>
  );
}
