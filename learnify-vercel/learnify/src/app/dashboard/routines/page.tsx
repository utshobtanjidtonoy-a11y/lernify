import { createClient } from "@/lib/supabase/server";
import { getRoutinesWithStatus, getDailyRoutineProgress, getRoutineCompletionHistory } from "@/lib/database/queries";
import RoutinesManager from "@/components/dashboard/RoutinesManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Routines — Learnify" };

export default async function RoutinesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [routines, dailyProgress, history] = await Promise.all([
    getRoutinesWithStatus(user.id),
    getDailyRoutineProgress(user.id),
    getRoutineCompletionHistory(user.id, 30),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
          Routine Builder
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Build consistent study habits with daily routines.
        </p>
      </div>
      <RoutinesManager
        initialRoutines={routines}
        dailyProgress={dailyProgress}
        completionHistory={history}
        userId={user.id}
      />
    </div>
  );
}
