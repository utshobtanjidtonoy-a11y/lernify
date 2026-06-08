"use client";

import { useRef } from "react";

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);

  const scrollToSection = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-slate-950 pt-16 transition-colors duration-300"
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-blue-50 dark:bg-blue-950/30 rounded-full opacity-60 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-blue-100/40 dark:bg-blue-900/20 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.25] dark:opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle, #93c5fd 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-1/4 left-[12%] w-4 h-4 rounded-full bg-blue-400 opacity-60" style={{ animation: "float 5s ease-in-out infinite" }} />
        <div className="absolute top-1/3 right-[18%] w-3 h-3 rounded-full bg-blue-300 opacity-50" style={{ animation: "float 7s ease-in-out infinite 1s" }} />
        <div className="absolute bottom-1/3 left-[22%] w-5 h-5 rounded-full bg-blue-500/30 border border-blue-400" style={{ animation: "float 6s ease-in-out infinite 2s" }} />
        <div className="absolute bottom-1/4 right-[12%] w-2.5 h-2.5 rounded-full bg-blue-400 opacity-40" style={{ animation: "float 4.5s ease-in-out infinite 0.5s" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

          {/* Left: text */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full mb-6 animate-on-load">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Now in Beta — Join 10,000+ students
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-slate-900 dark:text-white leading-tight mb-6 animate-on-load"
              style={{ animationDelay: "0.1s" }}
            >
              Learn Smarter,
              <br />
              <span className="gradient-text">Not Harder.</span>
            </h1>

            <p
              className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 animate-on-load"
              style={{ animationDelay: "0.2s" }}
            >
              Learnify transforms the way students explore science and math —
              with interactive tools, intelligent feedback, and a curriculum
              built for real understanding.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-on-load"
              style={{ animationDelay: "0.3s" }}
            >
              <button
                onClick={() => scrollToSection("#features")}
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/40 hover:shadow-blue-300/60 hover:from-blue-700 hover:to-blue-600 transition-all duration-300 cursor-pointer"
              >
                Explore Features
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => scrollToSection("#about")}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200 cursor-pointer"
              >
                Learn More
              </button>
            </div>

            <div
              className="mt-10 flex items-center gap-6 justify-center lg:justify-start animate-on-load"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex -space-x-2">
                {["A", "B", "C", "D"].map((letter, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center text-white text-xs font-bold ${
                      ["bg-blue-400", "bg-blue-500", "bg-blue-300", "bg-blue-600"][i]
                    }`}
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">10,000+</span>{" "}
                students already learning
              </div>
            </div>
          </div>

          {/* Right: floating dashboard card */}
          <div
            className="flex-1 w-full max-w-lg lg:max-w-none animate-on-load"
            style={{ animationDelay: "0.35s", animation: "float 7s ease-in-out infinite" }}
          >
            <HeroDashboardCard />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 dark:text-slate-600 animate-bounce">
        <span className="text-xs font-medium tracking-widest uppercase">Scroll</span>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}

function HeroDashboardCard() {
  return (
    <div className="relative">
      <div className="absolute inset-4 bg-blue-300/20 dark:bg-blue-500/10 blur-2xl rounded-3xl" />

      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-blue-100/60 dark:shadow-blue-900/30 border border-blue-100 dark:border-slate-700/60 overflow-hidden">
        {/* Card header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-white/30" />
              <div className="w-3 h-3 rounded-full bg-white/30" />
              <div className="w-3 h-3 rounded-full bg-white/30" />
            </div>
            <span className="text-white/90 text-sm font-medium">Dashboard</span>
          </div>
        </div>

        {/* Card body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Good morning, Alex! 👋</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">Continue Learning</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Chemistry — Atomic Structure</span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">68%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full" style={{ width: "68%" }} />
            </div>
            <p className="text-xs text-slate-400 mt-2">5 of 8 lessons complete</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Streak", value: "12", icon: "🔥" },
              { label: "XP Points", value: "2.4k", icon: "⭐" },
              { label: "Rank", value: "#24", icon: "🏆" },
            ].map((stat) => (
              <div key={stat.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-base mb-0.5">{stat.icon}</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent</p>
            {[
              { title: "Periodic Table Quiz", score: "92%", tag: "Chemistry", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" },
              { title: "Quadratic Equations", score: "In Progress", tag: "Math", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" },
            ].map((item) => (
              <div key={item.title} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${item.color}`}>{item.tag}</div>
                  <span className="text-sm text-slate-700 dark:text-slate-200 font-medium">{item.title}</span>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{item.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 shadow-lg rounded-2xl px-3 py-2 flex items-center gap-2">
        <span className="text-lg">🎉</span>
        <div>
          <p className="text-xs font-bold text-slate-800 dark:text-white">New Achievement!</p>
          <p className="text-xs text-slate-400">7-day streak</p>
        </div>
      </div>

      <div className="absolute -bottom-4 -left-4 bg-blue-600 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 rounded-2xl px-3 py-2 flex items-center gap-2">
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        <p className="text-xs font-bold text-white">Top Performer</p>
      </div>
    </div>
  );
}
