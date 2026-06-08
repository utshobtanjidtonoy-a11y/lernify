"use client";

import { useState, useTransition } from "react";
import type { User } from "@supabase/supabase-js";
import { updateProfile } from "@/lib/auth/actions";

export default function ProfileForm({ user }: { user: User | null }) {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = user?.user_metadata?.full_name ?? "";
  const email = user?.email ?? "";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const provider = user?.app_metadata?.provider ?? "email";

  const initials = displayName
    ? displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : email[0]?.toUpperCase() ?? "?";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(() => { void (async () => {
      const result = await updateProfile(formData);
      if (result?.error) setError(result.error);
      else setSuccess(true);
    })(); });
  }

  const inputClass =
    "w-full px-4 py-3 text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 focus:border-transparent transition-all duration-200";

  return (
    <div className="space-y-6">
      {/* Avatar card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-5">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-2xl object-cover ring-4 ring-blue-100 dark:ring-blue-900" />
        ) : (
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold ring-4 ring-blue-100 dark:ring-blue-900">
            {initials}
          </div>
        )}
        <div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{displayName || "No name set"}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{email}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-800">
              {provider === "google" ? "🔗 Google" : "✉️ Email"}
            </span>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5">Edit Profile</h2>

        {success && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-xl">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22 4 12 14.01 9 11.01" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">Profile updated successfully!</p>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-xl">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Full Name
            </label>
            <input
              name="fullName"
              type="text"
              defaultValue={displayName}
              placeholder="Your full name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              disabled
              className={`${inputClass} opacity-60 cursor-not-allowed`}
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">Email cannot be changed here.</p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-600 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-blue-300/50 transition-all duration-200"
          >
            {isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Saving…
              </>
            ) : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Account info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Account Details</h2>
        <div className="space-y-3">
          {[
            { label: "User ID", value: user?.id ?? "—" },
            { label: "Sign-in Method", value: provider === "google" ? "Google OAuth" : "Email & Password" },
            { label: "Account Created", value: user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—" },
          ].map((item) => (
            <div key={item.label} className="flex items-start justify-between gap-4 py-3 border-b border-slate-50 dark:border-slate-800/80 last:border-0">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex-shrink-0">{item.label}</p>
              <p className="text-sm text-slate-800 dark:text-slate-200 text-right font-medium truncate max-w-[200px]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
