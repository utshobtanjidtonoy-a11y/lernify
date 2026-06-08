-- ============================================================
-- LEARNIFY — ROUTINE BUILDER MIGRATION
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add description column if missing (safe)
alter table public.routines
  add column if not exists description text;

-- 2. NEW TABLE: routine_completions
--    Tracks each time a user marks a routine as done on a specific date
-- ============================================================
create table if not exists public.routine_completions (
  id          uuid primary key default uuid_generate_v4(),
  routine_id  uuid not null references public.routines(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  completed_on date not null default current_date,
  note        text,
  created_at  timestamptz not null default now(),

  -- one completion record per routine per day
  unique (routine_id, completed_on)
);

alter table public.routine_completions enable row level security;

create policy "Users can CRUD their own completions"
  on public.routine_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index routine_completions_user_idx     on public.routine_completions(user_id);
create index routine_completions_routine_idx  on public.routine_completions(routine_id);
create index routine_completions_date_idx     on public.routine_completions(completed_on);

-- ============================================================
-- DONE ✅  routine_completions table created
-- ============================================================
