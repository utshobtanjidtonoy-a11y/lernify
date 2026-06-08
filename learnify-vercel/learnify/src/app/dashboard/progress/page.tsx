import { createClient } from "@/lib/supabase/server";
import { getStudyProgress } from "@/lib/database/queries";
import ProgressView from "@/components/dashboard/ProgressView";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Progress — Learnify" };

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const progress = await getStudyProgress(user.id, 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">Study Progress</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Track your study sessions and see how you're improving.
        </p>
      </div>
      <ProgressView progress={progress} userId={user.id} />
    </div>
  );
}
