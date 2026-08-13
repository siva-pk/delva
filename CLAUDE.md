# Delva — Project Context for Claude Code

Read automatically at the start of every session. Keep it current and honest.

- **Strategy and reasoning:** `docs/STRATEGY.md` — read it before proposing anything directional.
- **What to build next:** `docs/BUILD-PLAN.md`
- **Why things are the way they are:** `docs/DECISIONS.md`
- **Evidence base:** `docs/research/focus-science.md` — this is what the product is built against.

---

## What Delva is

> **A private focus timer that learns how long things actually take you.**

You name a session and say how long you think it'll take. Delva times it, asks how it went, and over
weeks builds a picture of your real pace — the gap between what you plan and what actually happens.

Live at: https://delva.app

**Successor to deskflo** (2026-07-30). Same research base and most of the same product logic; new
positioning, new architecture. Pre-pivot history is in `docs/archive/`.

## Who it's for

- **Beachhead:** ADHD / neurodivergent adults — underserved, $5–15/mo willingness to pay, and a
  community that shares tools it trusts.
- **Expansion:** freelancers and consultants, where bad estimates cost income.
- **Ceiling:** anyone who loses track of time.

ADHD is the beachhead, **not the ceiling** — the claim is universal, so no repositioning is needed
to grow outward.

## The moat

**Accumulated personal calibration.** It compounds with use, can't be copied off a user, and creates
real switching cost. Competitors address time blindness by *displaying* time; none of them **learns
your error**. Manager-facing estimate-vs-actual exists (ClickUp, Jira, ActiTime) — personal
calibration with nobody watching does not.

Everything else is a feature. This is the thing to protect.

## Guardrails — do not undo without a logged decision in DECISIONS.md

- **No ads.** Ever.
- **No ranking, scoring or comparison between users.** Overjustification risk (§7) and actively
  harmful given rejection sensitivity. *Shared presence / body doubling stays open* — that's a
  different mechanism from a leaderboard.
- **No manager dashboards or employee reporting.**
- **Never paywall the core timer.**
- **No cold zeros, no failure states, no punishing streaks.** Streaks forgive one missed day and say
  so honestly.
- **No efficacy claims for focus sounds** — the evidence is genuinely mixed. Describe honestly.
- **No treatment or medical claims.**
- **The intention text is personal data.** Never log it, never send it to analytics, never put it in
  an error report. Analytics record *whether* an intention was set, never its content.

## Design rules carried from deskflo — these are load-bearing

- **Reminders never interrupt a focus block.** Nothing may pop a modal or fire a notification during
  `focus` — enqueue and release at most one nudge per break. Policy: `docs/design/break-mode.md` §3.
- **"This session I'll ___" is the feature, not the label.** Implementation intentions carry
  d = 0.65 *because* they're framed as a commitment. Reworded to "Task name" the feature keeps
  looking present while doing nothing.
- **Breaks auto-start; focus blocks do not.** Deliberate asymmetry — a block you didn't choose to
  begin isn't a commitment.
- **The break screen never gains stats, streaks, charts or tips.** §5 — recovery needs reduced
  top-down control. Every competitor makes this mistake.
- **Counters are goal-relative** — "3 of your 4", not "3 sessions". Zero is an invitation.
- **Durations are what was *served*, not the preset length.** Anything else overstates abandoned
  sessions and corrupts calibration.
- **Small text uses the AA-safe tokens.** Never dim text with `opacity` — it composites toward the
  background, so no token value can rescue it. Use a real colour.

## Tech

- **Next.js on Vercel + Supabase** (auth, Postgres, cron).
- **Local-first as engineering, not marketing** — the timer stays instant and works offline; the
  server is durability and scheduled insight jobs, never in the critical path.
- **Schema principles:** store **raw rows, derive aggregates** — you can recompute an average, you
  can never recover an unstored field. Store **local timezone and wall-clock**, not just UTC, or
  "your Tuesday afternoons" becomes unanswerable.
- **Row-level security from day one.**
- Web Audio for all chimes and ambient sound — synthesised, zero audio files, no licensing.

## Working state

**D-01 scaffold is in.** Next 16 + React 19 + Tailwind v4 + TypeScript, Supabase clients wired via
`@supabase/ssr`, holding page at `/`, deployment check at `/api/health`. No timer, no schema, no
auth. The Supabase project and the Vercel deploy at delva.app are still outstanding. Next up is
**D-02 · Schema**. See `docs/BUILD-PLAN.md`.

Where things stand:
- **Gate 0** (<1k MAU) — distribution and product only. **No billing code.** See STRATEGY §6.
- **Analytics are parked** until ~100 users/day. Below that nothing measured separates signal from
  noise. Do not propose A/B tests or data reads.
- The **friction assumption is untested**: will people actually enter an estimate? That's the one
  that can kill the strategy, and it should be tested before anything is built on top of it.

## Who's building this

Solo builder (Siva), full-stack developer, ~5–10 hrs/week, based in Calgary. Revenue-goal side
project targeting $1–3k/mo grown organically.

**The standing trap:** rewriting and re-architecting feels like progress and is enjoyable;
distribution is neither. Traffic is the binding constraint, not code. Notice which one is being
chosen.

## End-of-session habit

When a session makes product or design decisions:
1. Append a dated entry to `docs/DECISIONS.md`
2. Update this file's "Working state" if it changed
3. Commit

`docs/` is the durable memory of this project across sessions — keep it honest.
