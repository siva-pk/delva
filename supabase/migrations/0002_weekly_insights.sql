-- D-11 · Scheduled insights
--
-- Weekly, quiet, opt-in. The job only ever writes a row; it never emails, and
-- there is no delivery channel here yet on purpose.
--
-- ⚠ UNVERIFIED. There is no Supabase project and no local Postgres on the
-- machine this was written on (B-02/B-06), so this file has been parsed
-- against the real Postgres grammar and never executed. `cron.schedule` in
-- particular requires pg_cron to be enabled on the project first.

create table public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Monday of the week covered, in the user's own local terms.
  week_starting date not null,
  kind text not null,
  -- Rendered sentence. Stored so a later change of wording cannot silently
  -- rewrite what a user was already told.
  body text not null,
  -- The counts behind it, so the claim can be checked rather than trusted.
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  unique (user_id, week_starting, kind)
);

create index insights_user_week_idx
  on public.insights (user_id, week_starting desc);

alter table public.insights enable row level security;

create policy "insights are readable by their owner"
  on public.insights for select
  using ((select auth.uid()) = user_id);

create policy "insights are deletable by their owner"
  on public.insights for delete
  using ((select auth.uid()) = user_id);

-- No insert/update policy for users: insights are written by the scheduled job
-- running as a privileged role, never by a client.

-- ---------------------------------------------------------------------------
-- The weekly job
-- ---------------------------------------------------------------------------

/*
 * Mirrors src/lib/calibration/patterns.ts, which is the tested implementation.
 *
 * The thresholds are the same and they are the point: a bucket needs at least
 * 4 sessions, the week needs at least 12, and the bucket has to be a clear 15
 * points below the user's own baseline before it is worth saying anything.
 * Below that the honest output is nothing at all, so no row is written.
 *
 * Everything groups on `local_started_at`, never `started_at` — the claim is
 * about the clock on the user's wall.
 */
create or replace function public.compute_weekly_insights(target_week date default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  week_start date := coalesce(target_week, (current_date - interval '7 days')::date);
  written integer := 0;
begin
  insert into public.insights (user_id, week_starting, kind, body, evidence)
  select
    stats.user_id,
    week_start,
    'worst-bucket',
    format(
      '%s %ss are where your blocks are least likely to run their course — %s%% against your usual %s%%.',
      stats.day_name,
      stats.part_of_day,
      round(stats.bucket_rate * 100),
      round(stats.overall_rate * 100)
    ),
    jsonb_build_object(
      'bucket_sessions', stats.bucket_sessions,
      'bucket_rate', stats.bucket_rate,
      'overall_sessions', stats.overall_sessions,
      'overall_rate', stats.overall_rate
    )
  from (
    select
      buckets.user_id,
      buckets.day_name,
      buckets.part_of_day,
      buckets.bucket_sessions,
      buckets.bucket_rate,
      totals.overall_sessions,
      totals.overall_rate,
      row_number() over (
        partition by buckets.user_id order by buckets.bucket_rate asc
      ) as worst_rank
    from (
      select
        s.user_id,
        to_char(s.local_started_at, 'FMDay') as day_name,
        case
          when extract(hour from s.local_started_at) < 12 then 'morning'
          when extract(hour from s.local_started_at) < 17 then 'afternoon'
          else 'evening'
        end as part_of_day,
        count(*) as bucket_sessions,
        avg((s.outcome = 'completed')::int)::numeric as bucket_rate
      from public.sessions s
      where s.local_started_at >= week_start
        and s.local_started_at < week_start + 7
      group by 1, 2, 3
      having count(*) >= 4
    ) buckets
    join (
      select
        s.user_id,
        count(*) as overall_sessions,
        avg((s.outcome = 'completed')::int)::numeric as overall_rate
      from public.sessions s
      where s.local_started_at >= week_start
        and s.local_started_at < week_start + 7
      group by 1
      having count(*) >= 12
    ) totals on totals.user_id = buckets.user_id
    where buckets.bucket_rate <= totals.overall_rate - 0.15
  ) stats
  join public.profiles p on p.id = stats.user_id
  where stats.worst_rank = 1
    -- Opt-in, and it means opt-in.
    and p.weekly_insights_opt_in
  on conflict (user_id, week_starting, kind) do nothing;

  get diagnostics written = row_count;
  return written;
end;
$$;

revoke all on function public.compute_weekly_insights(date) from public, anon, authenticated;

-- Mondays, 08:00 UTC. Requires pg_cron enabled on the project.
-- select cron.schedule(
--   'delva-weekly-insights',
--   '0 8 * * 1',
--   $$select public.compute_weekly_insights();$$
-- );
