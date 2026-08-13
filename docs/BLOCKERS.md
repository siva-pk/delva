# Blockers — things that need Siva

> **Start here when picking this back up.** The build run finished every code item it could. This
> file is what it couldn't, in the order worth doing them:
>
> 1. **B-02** — create the Supabase project and push the migrations. Everything server-side is
>    unverified until this happens, and `GET /api/health` goes green when it works.
> 2. **B-03** — deploy to Vercel, point delva.app at it.
> 3. **B-04** — the Phase E drafts in `docs/content/`, which need your voice and your accounts.
> 4. **B-01** — if the deskflo repo still exists, diff it against `src/lib/timer/` for the edge
>    cases that were fixed there and never written down.


Written during the autonomous build run started **2026-08-12**. Each entry: what is blocked, why it
needs a human, what I did instead, and what breaks if the workaround ships as-is.

Newest at the bottom. When one is resolved, strike it and note the date.

---

## B-01 · No deskflo source code in this repo

**Blocks:** D-04 (timer + phase machine), D-14 (hydration/stretch), D-15 (ambient sound / `audio.js`).

BUILD-PLAN says *port* this logic and warns: "This logic is subtle and was hard-won; port it
deliberately rather than from memory." There is no deskflo code here — `docs/archive/` is prose
only. Porting is not possible.

**Workaround:** rebuilt from the specification in `docs/archive/deskflo-BUILD-PLAN.md`,
`docs/archive/deskflo-DECISIONS.md` and `docs/design/break-mode.md`, which are detailed enough to
pin down most behaviour. Every place the docs underdetermine it is marked with a
`TODO(B-01)` comment in the code.

**Risk if unresolved:** the hard-won edge cases that were fixed in deskflo but never written down
are silently gone. If the old repo still exists, diffing it against `src/lib/timer/` is worth an
hour.

---

## B-02 · No Supabase project

**Blocks:** the second half of D-01, and live verification of D-02, D-03, D-11.

Creating the project and holding its keys is an account action.

**Workaround:** schema is written as versioned SQL under `supabase/migrations/`, unapplied. The app
is built against it and works fully signed-out on local storage, which is the intended
local-first behaviour anyway — so nothing is blocked from *running*, only from *syncing*.

**To resolve:** create the project, `supabase db push`, set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` locally and in Vercel. `GET /api/health` will go green when it works.

---

## B-03 · No Vercel deployment or domain

**Blocks:** "delva.app live" in D-01.

**Workaround:** none needed for building; the app runs locally. Deployment is a one-time account
action.

---

## B-04 · Phase E is not mine to execute

**Blocks:** D-16 (publish the research brief), D-18 (content engine), D-19 (community).

These are publishing and posting under Siva's name in ADHD communities. Outward-facing, in his
voice, on his accounts — not something to automate.

**Workaround:** drafts written into `docs/content/`, unpublished. Nothing has been posted anywhere.
D-17 (landing page) is code and is built normally.

---

## B-06 · No way to execute the migration locally

**Blocks:** real QA of D-02.

No Docker, no Supabase CLI, no `psql` on this machine, and no remote project (B-02). The migration
has never been run.

**Workaround:** validated with the real Postgres grammar (`pg-query-emscripten`) — 21 statements,
all parsing to the expected node types. That proves **syntax only**. It does not prove the enums
resolve, the `auth.users` references exist, the RLS policies behave, or the triggers fire.

**Risk if unresolved:** first `supabase db push` may fail on something a parser cannot see. Cheap to
find out — push it against a throwaway project before the real one.

---

## B-07 · D-03's sync half is deferred, not delivered

**Not blocked on Siva** — recorded here because the first version of the D-03 entry in DECISIONS.md
read as though D-03 were complete, and it isn't.

D-03 says the app must "work signed-out, with local storage, and **sync when a user signs in**." The
auth round trip landed; local storage and the sync path did not, because neither has anything to
store until the timer exists (D-04) and history is defined (D-08).

**Sequenced to land with D-08.** Until then `getCurrentUser()` / `ensureProfile()` have no callers,
nothing writes to `public.sessions`, and the RLS policies have no exercising code path.

---

## B-08 · Sync is still not built

**Not blocked on Siva** — recorded because B-07 promised it would land with D-08 and it did not.

The app is local-only. Auth works, `ensureProfile()` and `getCurrentUser()` exist, the RLS policies
are written — and nothing writes a session to Supabase. `syncedAt` is set to `null` on every stored
row and never updated.

**Why it kept slipping:** every item in the plan had a local-first path that worked without it, so
sync was never the thing blocking the next item. That is exactly how it ends up never being built.

**What it needs:** push unsynced rows on sign-in and after each session; reconcile on `id`, which is
client-generated precisely so this is idempotent. The local record mirrors the table column for
column, so it is a rename, not a reshape.

---

## B-09 · Known-minor, deliberately not fixed

Surfaced in review, judged not worth the code right now. Recorded so they are decisions rather than
oversights.

- **Two open tabs don't see each other's sessions.** The local cache invalidates on write but there
  is no `storage` event listener, so a block finished in one tab doesn't appear in the other's
  history until reload. No data loss — `appendSession` re-reads before writing.
- **A tab left open across midnight** keeps counting the new day's blocks against yesterday until
  something re-renders. Cosmetic, and it corrects itself on any interaction.
- **`break-mode.md` §4 now contradicts shipped behaviour.** It lists "no feedback prompt" among the
  break screen's deliberate absences; D-07 puts the close-out there. D-07 is newer and
  Delva-specific so it wins, but the ported doc should say so rather than silently disagreeing.

---

## B-05 · Phase C built ahead of its own gate

**Blocks:** nothing — this is a deliberate override, recorded so it isn't mistaken for drift.

BUILD-PLAN: Phase C is "only worth building once D-06 shows people will estimate." That gate needs
real users and cannot open during this run. Siva instructed the full plan be built regardless.

**Workaround:** built, with D-09's confidence thresholds honest about thin history (says nothing
before ~10 sessions). If real take-up comes in under ~⅓, Phase C should be revisited rather than
kept because it already exists.
