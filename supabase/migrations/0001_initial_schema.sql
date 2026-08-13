-- D-02 · Initial schema
--
-- Principles this file is built on (CLAUDE.md, BUILD-PLAN D-02):
--   * Store raw rows, derive aggregates. An average can be recomputed forever;
--     a field that was never written is gone. Nothing here stores a computed
--     value in place of its inputs.
--   * Store local timezone and wall-clock alongside UTC, or "your Tuesday
--     afternoons" (D-11) becomes unanswerable after the fact.
--   * Row-level security from the start, not a later hardening pass.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- No 'failed'. There are no failure states in this product (CLAUDE.md).
-- 'abandoned' is descriptive, not a judgement: the block was ended early.
create type public.session_outcome as enum ('completed', 'abandoned', 'skipped');

-- How the estimate got into the row. This distinction is load-bearing for
-- D-09/D-10: once Delva starts *suggesting* a corrected estimate, an accepted
-- suggestion is no longer an independent guess by the user. Folding those back
-- into the bias calculation would make calibration measure its own output.
create type public.estimate_source as enum ('chip', 'custom', 'suggested');

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Goal-relative counters need a goal: "3 of your 4", never "3 sessions".
  daily_goal_sessions smallint not null default 4
    check (daily_goal_sessions between 1 and 24),
  -- Last known timezone, used only to interpret a scheduled job's idea of
  -- "this week". Per-session truth lives on the session row.
  timezone text,
  weekly_insights_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- sessions — one row per focus block
-- ---------------------------------------------------------------------------

create table public.sessions (
  -- Client-generated so a signed-out session created offline keeps its
  -- identity when it later syncs. Makes sync idempotent.
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,

  preset text not null,
  -- What the preset promised. Kept *alongside* served_seconds, never instead
  -- of it: duration is what was served, and the difference between the two is
  -- exactly what makes an abandoned session legible.
  planned_focus_seconds integer not null check (planned_focus_seconds > 0),

  estimate_minutes integer check (estimate_minutes > 0 and estimate_minutes <= 1440),
  estimate_source public.estimate_source,
  -- What calibration proposed at the time, whether or not it was taken. Lets
  -- "are our suggestions any good?" be answered later without a new field.
  suggested_estimate_minutes integer check (suggested_estimate_minutes > 0),

  -- Personal data. Never logged, never sent to analytics, never put in an
  -- error report (CLAUDE.md). It lives here, in the user's own RLS-scoped row,
  -- and nowhere else.
  intention text check (char_length(intention) <= 500),

  -- Time actually served in `focus`, excluding paused time.
  served_seconds integer not null check (served_seconds >= 0),
  paused_seconds integer not null default 0 check (paused_seconds >= 0),

  outcome public.session_outcome not null,

  started_at timestamptz not null,
  ended_at timestamptz not null,

  -- IANA zone, e.g. 'America/Edmonton'. Not an offset — offsets change twice a
  -- year and cannot be reversed into a zone.
  local_tz text not null,
  -- Wall-clock time as the user experienced it. Deliberately timestamp WITHOUT
  -- time zone: this is "what the clock on their wall said", which is the thing
  -- "your Tuesday afternoons" is actually about.
  local_started_at timestamp not null,

  device text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sessions_ends_after_start check (ended_at >= started_at),
  -- An estimate without a source, or a source without an estimate, means the
  -- calibration input is ambiguous. Reject it at the door.
  constraint sessions_estimate_source_paired check (
    (estimate_minutes is null) = (estimate_source is null)
  )
);

-- History is read newest-first and grouped by local day (D-08).
create index sessions_user_local_started_idx
  on public.sessions (user_id, local_started_at desc);

-- The calibration engine (D-09) reads only rows that carry an independent
-- estimate, newest first.
create index sessions_user_calibration_idx
  on public.sessions (user_id, started_at desc)
  where estimate_minutes is not null;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger sessions_touch_updated_at
  before update on public.sessions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- New user → profile row
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;

create policy "profiles are readable by their owner"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "profiles are updatable by their owner"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles are insertable by their owner"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

create policy "sessions are readable by their owner"
  on public.sessions for select
  using ((select auth.uid()) = user_id);

create policy "sessions are insertable by their owner"
  on public.sessions for insert
  with check ((select auth.uid()) = user_id);

create policy "sessions are updatable by their owner"
  on public.sessions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Their data, their call.
create policy "sessions are deletable by their owner"
  on public.sessions for delete
  using ((select auth.uid()) = user_id);
