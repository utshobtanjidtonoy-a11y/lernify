-- ============================================================
-- LEARNIFY — SUPABASE DATABASE SCHEMA
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Enable UUID extension ────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES
--    Auto-created when a user signs up (via trigger)
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  avatar_url   text,
  bio          text,
  xp_points    integer not null default 0,
  streak_days  integer not null default 0,
  last_active  date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();


-- ============================================================
-- 2. ROUTINES
--    Study routines / schedules created by users
-- ============================================================
create table if not exists public.routines (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  subject     text,
  color       text not null default '#3b82f6',
  days_of_week integer[] default '{}',   -- 0=Sun, 1=Mon, ... 6=Sat
  start_time  time,
  duration_minutes integer default 30,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.routines enable row level security;

create policy "Users can CRUD their own routines"
  on public.routines for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger routines_updated_at
  before update on public.routines
  for each row execute procedure public.set_updated_at();

create index routines_user_id_idx on public.routines(user_id);


-- ============================================================
-- 3. TASKS
--    To-do items linked to a routine (optional) or standalone
-- ============================================================
create type public.task_priority as enum ('low', 'medium', 'high');
create type public.task_status   as enum ('todo', 'in_progress', 'done');

create table if not exists public.tasks (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  routine_id   uuid references public.routines(id) on delete set null,
  title        text not null,
  description  text,
  subject      text,
  priority     public.task_priority not null default 'medium',
  status       public.task_status   not null default 'todo',
  due_date     date,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can CRUD their own tasks"
  on public.tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

create index tasks_user_id_idx   on public.tasks(user_id);
create index tasks_status_idx    on public.tasks(status);
create index tasks_due_date_idx  on public.tasks(due_date);


-- ============================================================
-- 4. STUDY_PROGRESS
--    Tracks time spent studying per subject per day
-- ============================================================
create table if not exists public.study_progress (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  subject          text not null,
  topic            text,
  minutes_studied  integer not null default 0,
  date             date not null default current_date,
  notes            text,
  xp_earned        integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, subject, date)   -- one record per subject per day
);

alter table public.study_progress enable row level security;

create policy "Users can CRUD their own study progress"
  on public.study_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger study_progress_updated_at
  before update on public.study_progress
  for each row execute procedure public.set_updated_at();

create index study_progress_user_id_idx on public.study_progress(user_id);
create index study_progress_date_idx    on public.study_progress(date);
create index study_progress_subject_idx on public.study_progress(subject);


-- ============================================================
-- DONE ✅
-- Tables created: profiles, routines, tasks, study_progress
-- RLS enabled on all tables
-- Auto-profile trigger on signup
-- ============================================================
