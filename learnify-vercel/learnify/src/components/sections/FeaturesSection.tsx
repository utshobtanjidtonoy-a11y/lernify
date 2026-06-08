const features = [
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Interactive Periodic Table",
    description: "Explore every element with rich detail cards, electron configurations, and real-world applications — all in a beautifully interactive experience.",
    color: "from-blue-500 to-blue-600",
    tag: "Chemistry",
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 7h16M4 12h10M4 17h6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Smart Formula Reference",
    description: "Instantly access, search, and understand thousands of science and math formulas with step-by-step breakdowns and worked examples.",
    color: "from-indigo-500 to-blue-500",
    tag: "All Subjects",
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Adaptive Quizzes",
    description: "Our AI-powered quiz engine adapts to your level in real time — focusing on the exact concepts you need to practice most.",
    color: "from-sky-500 to-blue-500",
    tag: "AI-Powered",
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Progress Tracking",
    description: "Visualize your learning journey with detailed analytics, streak tracking, and milestone rewards that keep you motivated every day.",
    color: "from-blue-500 to-cyan-500",
    tag: "Analytics",
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Learn at Your Pace",
    description: "No deadlines, no pressure. Pick up where you left off anytime, on any device. Your progress syncs automatically.",
    color: "from-blue-600 to-blue-400",
    tag: "Flexible",
  },
  {
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Community & Discussions",
    description: "Join a thriving community of learners. Ask questions, share insights, and collaborate with students from around the world.",
    color: "from-blue-500 to-indigo-500",
    tag: "Community",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-full border border-blue-100 dark:border-blue-800 mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white leading-tight mb-4">
            Everything you need to{" "}
            <span className="gradient-text">excel at science</span>
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
            Learnify brings together the most powerful learning tools into one elegant, student-first platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-6 hover:shadow-xl hover:shadow-blue-50/80 dark:hover:shadow-blue-900/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-800">
                  {feature.tag}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-200">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {feature.description}
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span>Learn more</span>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">Ready to transform your studying?</p>
          <button className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-blue-900/40 hover:shadow-blue-300 hover:from-blue-700 hover:to-blue-600 transition-all duration-300 cursor-pointer">
            Get Started for Free
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
