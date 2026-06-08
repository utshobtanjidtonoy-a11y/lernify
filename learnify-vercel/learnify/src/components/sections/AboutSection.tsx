const values = [
  { emoji: "🎯", title: "Student-First", description: "Every decision we make starts with one question: does this help students learn better?" },
  { emoji: "🔬", title: "Science-Driven", description: "Built on proven cognitive science — spaced repetition, active recall, and deliberate practice." },
  { emoji: "🌍", title: "Accessible to All", description: "Quality education shouldn't have a price tag. Our core tools are free, forever." },
  { emoji: "⚡", title: "Always Improving", description: "We ship updates weekly, driven by feedback from our student community." },
];

const team = [
  { name: "Sofia Chen",  role: "Co-Founder & CEO",    initials: "SC", color: "from-blue-500 to-blue-600" },
  { name: "Marcus Lee",  role: "Head of Curriculum",  initials: "ML", color: "from-indigo-500 to-blue-500" },
  { name: "Priya Nair",  role: "Lead Engineer",       initials: "PN", color: "from-sky-500 to-blue-500" },
  { name: "James Park",  role: "Design Lead",         initials: "JP", color: "from-blue-600 to-cyan-500" },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-24 lg:py-32 bg-slate-50 dark:bg-slate-900 relative overflow-hidden transition-colors duration-300">
      <div
        className="absolute inset-0 opacity-20 dark:opacity-5 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #93c5fd 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-full border border-blue-100 dark:border-blue-800 mb-4">
            About Us
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
            We believe learning should feel{" "}
            <span className="gradient-text">like an adventure</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
            Learnify was founded by students who were tired of boring textbooks and passive studying. We built the tool we wish we had.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Left: story */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-100 dark:border-slate-700 shadow-sm">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Our Mission</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                To make world-class science and mathematics education accessible to every student, regardless of their background, school, or resources. We combine pedagogy, design, and technology to create experiences that spark genuine curiosity.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
              <blockquote className="text-lg font-medium leading-relaxed italic mb-4">
                "The goal is not just to pass an exam — it's to build a real, lasting understanding of how the world works."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">SC</div>
                <div>
                  <p className="text-sm font-semibold text-white">Sofia Chen</p>
                  <p className="text-xs text-blue-200">Co-Founder & CEO</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-blue-50 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-200 group"
              >
                <span className="text-2xl mb-3 block">{value.emoji}</span>
                <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1.5 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-200">
                  {value.title}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Meet the Team</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Passionate educators and engineers building the future of learning.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {team.map((member) => (
            <div
              key={member.name}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-50 dark:border-slate-700 shadow-sm text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${member.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-lg font-bold shadow-md group-hover:scale-105 transition-transform duration-200`}>
                {member.initials}
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
