import type { ReactNode } from "react";
import Link from "next/link";
import LearnifyLogo from "@/components/ui/LearnifyLogo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <Link href="/" aria-label="Back to homepage">
          <LearnifyLogo size="sm" />
        </Link>
        <Link
          href="/"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors duration-200"
        >
          ← Back to home
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer note */}
      <footer className="text-center py-6 text-xs text-slate-400 dark:text-slate-600">
        © {new Date().getFullYear()} Learnify. All rights reserved.
      </footer>
    </div>
  );
}
