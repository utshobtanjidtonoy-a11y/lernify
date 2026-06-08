import { createClient } from "@/lib/supabase/server";
import { getSubjectsWithCounts } from "@/lib/database/formulaQueries";
import FormulaHubClient from "@/components/formulas/FormulaHubClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Formula Hub — Learnify" };

export default async function FormulaHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const subjects = await getSubjectsWithCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
          Formula Hub
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Browse, search and bookmark formulas across all subjects.
        </p>
      </div>
      <FormulaHubClient subjects={subjects} userId={user?.id} />
    </div>
  );
}
