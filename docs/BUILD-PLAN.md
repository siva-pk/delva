# Build Plan — Delva

**The single source of truth for what to build next.** Strategy and reasoning live in
`docs/STRATEGY.md`; this file is the sequence.

**Status:** nothing built. Repo contains ported docs only.

---

## Start here

> **D-01 — scaffold the project.** Next.js on Vercel, Supabase connected, deploy a holding page at
> delva.app. Nothing user-facing beyond "something is coming."

Everything below is ordered. The ordering is deliberate and explained — if you change it, log why.

---

## The one thing to protect

**Traffic is the binding constraint, not code.** Delva has no users. Every item below is either
building the smallest thing that can be tested, or getting in front of people.

Rewriting, re-architecting and polishing all feel like progress. They are not the constraint.

---

## Phase A — Foundation

*Goal: a real project with a real schema, deployed. No features yet.*

- [ ] **D-01 · Scaffold** — Next.js + Vercel + Supabase, delva.app live with a holding page.
- [ ] **D-02 · Schema** — the most consequential decision in this phase, because the data model is
  the moat and everything else is replaceable.
  - `sessions` — one row per focus block: `estimate_minutes`, `served_seconds`, `intention`,
    `outcome` (completed / abandoned / skipped), `preset`, `started_at`, `ended_at`,
    **`local_tz`** and **`local_started_at`**, `device`.
  - **Store raw, derive aggregates.** Never store only a computed average — you can recompute those
    forever, but you cannot recover a field you didn't write.
  - **Row-level security on from the start.** Not a later hardening pass.
- [ ] **D-03 · Auth** — Supabase auth. Optional at first: the app must work signed-out, with local
  storage, and sync when a user signs in. Local-first is engineering here, not marketing.

## Phase B — The core loop

*Goal: the product does its one thing. Port the logic; don't reinvent it.*

- [ ] **D-04 · Timer + session phase machine** — port from deskflo. This logic is subtle and was
  hard-won; port it deliberately rather than from memory.
  - Phase is `idle` / `focus` / `break` and is **not** running-state — a paused block is still
    `focus`; a break you haven't started is already `break`.
  - Remaining time derives from a **target timestamp**, never a per-tick decrement. Background tabs
    are throttled and a decrementing counter silently loses every skipped tick.
  - **Breaks auto-start; focus blocks do not.**
- [ ] **D-05 · Intention field** — *"This session I'll ___"*. The framing is the mechanism
  (d = 0.65); do not reword it to "Task name".
- [ ] **D-06 · Estimate capture** — ⚠ **the assumption everything rests on.**
  - One-tap chips (15 / 30 / 45 / 60 / 90), **optional**, never a blocking step.
  - A session with no estimate must work normally.
  - **Instrument the take-up rate.** If fewer than ~⅓ of sessions carry an estimate, the moat never
    forms — and that finding is worth more than anything else on this list.
- [ ] **D-07 · Close-out** — "Done / Still going" at the break. No failure state. "Still going"
  carries the intention into the next block, which *is* the distraction-capture mechanism.
- [ ] **D-08 · Session history** — served durations, grouped by local day. Escape user text before
  rendering; local is not the same as trusted.

## Phase C — The moat

*Goal: the thing nobody else does. Only worth building once D-06 shows people will estimate.*

- [ ] **D-09 · Calibration engine** — estimate vs actual, as plain local statistics.
  - Rolling personal bias: *"you underestimate by 45%"*.
  - Enough history to be honest about confidence — say nothing before ~10 sessions rather than
    saying something wrong.
- [ ] **D-10 · Calibration surface** — where the user meets it. *"You said 30. It took 55."*
  - Suggest a corrected estimate as a **default the user can override**, never an imposition.
- [ ] **D-11 · Scheduled insights** — Supabase cron. Weekly, quiet, opt-in. *"Your Tuesday
  afternoons are your worst"* — the reason `local_tz` exists in the schema.

## Phase D — Break layer

*Goal: the wellbeing sidecar. Ported, deliberately not a headline.*

- [ ] **D-12 · Break mode** — full design in `docs/design/break-mode.md`. **Never gains stats,
  streaks, charts or tips** — that's §5, not an oversight.
- [ ] **D-13 · Reminder queue** — nothing may interrupt a focus block. Enqueue, release at most one
  nudge per break. Policy in break-mode §3.
- [ ] **D-14 · Hydration + stretch** — port. Sidecar, not co-headliner.
- [ ] **D-15 · Ambient sound** — port `audio.js`; synthesised, zero audio files, no licensing.
  Premium sound pack later, **described honestly** — no efficacy claims.

## Phase E — Distribution

*Runs in parallel with everything above. This is the actual constraint.*

- [ ] **D-16 · Publish the research brief** — `focus-science.md` as a public content series. The
  credibility asset, already written.
- [ ] **D-17 · Landing page** — the claim plus a **working timer above the fold**. Comprehension
  without inserting a click before the tool.
- [ ] **D-18 · Content engine** — time blindness, estimation, why streaks backfire, why reminders
  shouldn't interrupt. Every post traces to a citation.
- [ ] **D-19 · Community** — ADHD communities, honestly and as a participant. This is where the
  audience is and how it shares.

## Deferred until a gate opens

- **Accounts as a requirement** — Gate 1 (~1k MAU). Optional sync before that.
- **Billing** — Gate 2 (~5k MAU). **No Stripe code before then.**
- **LLM insights** — Gate 2+, once history depth makes them non-fabricated.
- **B2B / team licences** — Gate 3, inbound only.
- **Body doubling / shared presence** — a genuine network-effect moat (Focusmate, ~$1M ARR), but a
  two-sided marketplace can't be bootstrapped at this scale. Not rejected; parked.
- **Mobile app** — the name and positioning were chosen to permit it. Not now.

## Explicitly not in scope

- Ads, in any form.
- Leaderboards, scores or comparison between users.
- Manager dashboards, team reporting, employee monitoring.
- Chrome extension — retention surface at best; the median extension has 17 installs.
- Any efficacy claim for sounds, or any treatment claim.

---

## How to read this file

- **Phases are ordered; items within a phase are roughly ordered.**
- **D-06 is the pivotal item.** If its take-up rate is bad, Phase C should not be built as specified
  and the strategy needs revisiting — that's a real outcome, not a failure.
- **When an item ships:** tick it, move the outcome into DECISIONS.md, and collapse the item to a
  stub. Don't let this file drift out of sync with reality — that happened twice in deskflo.
- **`§N` references** point to `docs/research/focus-science.md`.
