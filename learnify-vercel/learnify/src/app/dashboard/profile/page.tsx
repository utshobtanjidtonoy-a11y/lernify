import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/dashboard/ProfileForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile — Learnify",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
          Your Profile
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage your account details and preferences.
        </p>
      </div>

      <ProfileForm user={user} />
    </div>
  );
}
