import { createClient } from "@/lib/supabase/server";
import { getSubjectsWithCounts } from "@/lib/database/formulaQueries";
import PhysicsHubClient from "@/components/physics/PhysicsHubClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Physics Hub — Learnify" };

export default async function PhysicsHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get physics subject with chapters + counts
  const allSubjects = await getSubjectsWithCounts();
  const physicsSubject = allSubjects.find((s) => s.slug === "physics") ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
          ⚛️ Physics Hub
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          SSC & HSC Physics — chapter-wise formulas and interactive visualizations.
        </p>
      </div>
      <PhysicsHubClient physicsSubject={physicsSubject} userId={user?.id} />
    </div>
  );
}
