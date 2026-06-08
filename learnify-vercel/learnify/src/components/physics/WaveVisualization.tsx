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

export default function WaveVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const tRef      = useRef(0);
  const running   = useRef(false);

  const [frequency,  setFrequency]  = useState(2);
  const [amplitude,  setAmplitude]  = useState(40);
  const [speed,      setSpeed]      = useState(200);
  const [waveType,   setWaveType]   = useState<"transverse" | "longitudinal" | "standing">("transverse");
  const [isRunning,  setIsRunning]  = useState(false);

  const wavelength  = speed / frequency;
  const period      = 1 / frequency;
  const angFreq     = 2 * Math.PI * frequency;
  const waveNumber  = 2 * Math.PI / wavelength;

  function draw(t: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const cy = H / 2;

    ctx.clearRect(0, 0, W, H);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#f0f9ff");
    bg.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Centre line
    ctx.strokeStyle = "rgba(148,163,184,0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
    ctx.setLineDash([]);

    if (waveType === "transverse") {
      // ── Transverse wave ──────────────────────────────────────
      // Draw filled wave body
      ctx.beginPath();
      ctx.moveTo(0, cy);
      for (let x = 0; x <= W; x += 2) {
        const y = amplitude * Math.sin(waveNumber * x - angFreq * t);
        ctx.lineTo(x, cy + y);
      }
      ctx.lineTo(W, cy);
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, cy - amplitude, 0, cy + amplitude);
      fillGrad.addColorStop(0, "rgba(59,130,246,0.15)");
      fillGrad.addColorStop(0.5, "rgba(59,130,246,0.05)");
      fillGrad.addColorStop(1, "rgba(59,130,246,0.15)");
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Wave line
      const lineGrad = ctx.createLinearGradient(0, 0, W, 0);
      lineGrad.addColorStop(0,   "#818cf8");
      lineGrad.addColorStop(0.5, "#3b82f6");
      lineGrad.addColorStop(1,   "#06b6d4");
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = amplitude * Math.sin(waveNumber * x - angFreq * t);
        if (x === 0) ctx.moveTo(x, cy + y); else ctx.lineTo(x, cy + y);
      }
      ctx.stroke();

      // Highlight crest particles
      for (let x = 0; x <= W; x += 30) {
        const y = amplitude * Math.sin(waveNumber * x - angFreq * t);
        const r = 4 + Math.abs(y) / amplitude * 3;
        ctx.beginPath();
        ctx.arc(x, cy + y, r, 0, Math.PI * 2);
        const alpha = 0.3 + 0.7 * Math.abs(y) / amplitude;
        ctx.fillStyle = `rgba(59,130,246,${alpha})`;
        ctx.fill();
      }

      // Wavelength annotation
      const λPx = (wavelength / speed) * W * frequency;
      const startX = (W - λPx) / 2;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(startX, cy - amplitude - 18);
      ctx.lineTo(startX + λPx, cy - amplitude - 18);
      ctx.stroke();
      ctx.setLineDash([]);
      ["←", "λ", "→"].forEach((char, i) => {
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(char === "λ" ? `λ=${wavelength.toFixed(1)}m` : char,
          i === 0 ? startX + 6 : i === 1 ? startX + λPx / 2 : startX + λPx - 6,
          cy - amplitude - 22);
      });

      // Amplitude annotation
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(16, cy); ctx.lineTo(16, cy - amplitude);
      ctx.stroke();
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`A=${amplitude}px`, 16, cy - amplitude - 8);

    } else if (waveType === "longitudinal") {
      // ── Longitudinal wave — compression/rarefaction ──────────
      const nParticles = 28;
      const spacing = W / nParticles;
      for (let i = 0; i < nParticles; i++) {
        const x0 = (i + 0.5) * spacing;
        const dx = amplitude * 0.6 * Math.sin(waveNumber * x0 - angFreq * t);
        const px = x0 + dx;
        // Color by compression (dx negative = compressed = darker)
        const compress = -dx / amplitude;
        const blue = Math.round(140 + compress * 115);
        const alpha = 0.4 + 0.6 * Math.abs(compress);
        ctx.beginPath();
        ctx.arc(px, cy, 7 + Math.abs(dx / amplitude) * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(29,78,216,${alpha})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(30,64,175,0.5)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Labels
      ctx.fillStyle = "#1d4ed8";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("← Compression →    ← Rarefaction →", W / 2, cy + amplitude + 24);

    } else {
      // ── Standing wave ────────────────────────────────────────
      const harmonics = 2;
      // Incident + reflected
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(99,102,241,0.4)";
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = amplitude * Math.sin(waveNumber * x - angFreq * t);
        if (x === 0) ctx.moveTo(x, cy + y); else ctx.lineTo(x, cy + y);
      }
      ctx.stroke();
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = amplitude * Math.sin(waveNumber * x + angFreq * t);
        if (x === 0) ctx.moveTo(x, cy + y); else ctx.lineTo(x, cy + y);
      }
      ctx.stroke();

      // Standing wave (sum)
      const sw = ctx.createLinearGradient(0, 0, W, 0);
      sw.addColorStop(0, "#8b5cf6"); sw.addColorStop(0.5, "#3b82f6"); sw.addColorStop(1, "#8b5cf6");
      ctx.strokeStyle = sw;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const y = 2 * amplitude * Math.sin(waveNumber * x) * Math.cos(angFreq * t);
        if (x === 0) ctx.moveTo(x, cy + y); else ctx.lineTo(x, cy + y);
      }
      ctx.stroke();

      // Node markers
      const nodeSpacing = W / (2 * harmonics);
      for (let i = 0; i <= 2 * harmonics; i++) {
        const nx = i * nodeSpacing;
        ctx.beginPath();
        ctx.arc(nx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ef4444";
        ctx.fill();
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("N", nx, cy + 18);
      }

      // Antinode markers
      for (let i = 0; i < 2 * harmonics; i++) {
        const anx = (i + 0.5) * nodeSpacing;
        ctx.beginPath();
        ctx.arc(anx, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#10b981";
        ctx.fill();
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("A", anx, cy + 18);
      }
    }

    // HUD
    ctx.fillStyle = "rgba(15,23,42,0.65)";
    ctx.beginPath(); safeRoundRect(ctx, 8, 8, 175, 68, 8); ctx.fill();
    ctx.fillStyle = "#f1f5f9";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`f = ${frequency} Hz`, 16, 26);
    ctx.fillText(`λ = ${wavelength.toFixed(1)} m`, 16, 43);
    ctx.fillText(`T = ${period.toFixed(3)} s`, 16, 60);
    ctx.fillText(`v = ${speed} m/s`, 100, 26);
    ctx.fillText(`ω = ${angFreq.toFixed(1)} rad/s`, 100, 43);
    ctx.fillText(`k = ${waveNumber.toFixed(2)} /m`, 100, 60);
  }

  function startAnim() {
    running.current = true;
    setIsRunning(true);
    const dt = 0.016;
    function frame() {
      if (!running.current) return;
      tRef.current += dt;
      draw(tRef.current);
      animRef.current = requestAnimationFrame(frame);
    }
    frame();
  }

  function stopAnim() {
    running.current = false;
    setIsRunning(false);
    cancelAnimationFrame(animRef.current);
  }

  function toggleAnim() {
    if (isRunning) stopAnim(); else startAnim();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw(tRef.current);
    });
    ro.observe(canvas);
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw(tRef.current);
    return () => { ro.disconnect(); cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => { draw(tRef.current); }, [frequency, amplitude, speed, waveType]);

  const sliderClass = "w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500";

  return (
    <div className="space-y-4">
      {/* Wave type tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {(["transverse", "longitudinal", "standing"] as const).map((t) => (
          <button key={t} onClick={() => setWaveType(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all duration-200 ${
              waveType === t
                ? "bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}>
            {t === "transverse" ? "🌊 Transverse" : t === "longitudinal" ? "🔴 Longitudinal" : "📍 Standing"}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div className="relative bg-slate-50 dark:bg-slate-800/40 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700" style={{ height: 230 }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Derived values */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Wavelength", value: `${wavelength.toFixed(2)} m`,    icon: "📏", color: "text-blue-600 dark:text-blue-400" },
          { label: "Period",     value: `${period.toFixed(3)} s`,        icon: "⏱",  color: "text-green-600 dark:text-green-400" },
          { label: "Angular ω",  value: `${angFreq.toFixed(1)} rad/s`,  icon: "🔄",  color: "text-purple-600 dark:text-purple-400" },
        ].map((d) => (
          <div key={d.label} className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-center">
            <p className="text-base mb-1">{d.icon}</p>
            <p className={`text-sm font-bold ${d.color}`}>{d.value}</p>
            <p className="text-xs text-slate-400">{d.label}</p>
          </div>
        ))}
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between mb-1">
            <span>Frequency</span><span className="text-blue-600 dark:text-blue-400">{frequency} Hz</span>
          </label>
          <input type="range" min="0.5" max="6" step="0.5" value={frequency}
            onChange={(e) => setFrequency(+e.target.value)} className={sliderClass} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between mb-1">
            <span>Amplitude</span><span className="text-blue-600 dark:text-blue-400">{amplitude}px</span>
          </label>
          <input type="range" min="10" max="70" value={amplitude}
            onChange={(e) => setAmplitude(+e.target.value)} className={sliderClass} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex justify-between mb-1">
            <span>Wave Speed</span><span className="text-blue-600 dark:text-blue-400">{speed} m/s</span>
          </label>
          <input type="range" min="50" max="500" step="10" value={speed}
            onChange={(e) => setSpeed(+e.target.value)} className={sliderClass} />
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={toggleAnim}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
            isRunning
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}>
          {isRunning ? "⏸ Pause" : "▶ Animate"}
        </button>
        <button onClick={() => { stopAnim(); tRef.current = 0; draw(0); }}
          className="flex-1 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors">
          ↺ Reset
        </button>
      </div>

      <p className="text-xs text-center text-slate-400 dark:text-slate-500 font-mono">
        v = fλ &nbsp;→&nbsp; {speed} = {frequency} × {wavelength.toFixed(1)} &nbsp;✓
      </p>
    </div>
  );
}
