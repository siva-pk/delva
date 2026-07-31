# Delva — Strategy

**Written 2026-07-30.** This is the reasoning behind what Delva is and how it's meant to make
money. CLAUDE.md carries the operational summary; this file carries the *why*, so that a future
session can disagree with it on the merits rather than re-derive it from scratch.

Delva is the successor to **deskflo**. What deskflo built is not being thrown away — the research
base, the design decisions and most of the product logic carry over. What's being replaced is the
positioning, which didn't work, and the architecture, which can't support what comes next.

---

## 1. Why deskflo was abandoned

deskflo was *"a free, calm, no-signup focus timer for desk workers."* Reviewing the 2026 market:

- The "best pomodoro app" lists are ten deep in free competitors — Pomofocus, Forest, Focus Keeper,
  TickTick, Marinara, Foci.
- **Foci** advertises itself as *"free, with no ads and no premium tier."* That was deskflo's exact
  positioning, already occupied by someone else.
- deskflo's differentiator — free, calm, no signup — is the **category default**, not a
  differentiator.

The late-stage feature ("reminders wait for your break") is genuinely good, but it is **a feature,
not a moat.** Any of those ten could ship it in a weekend.

Traffic bore this out: ~8 sessions/day, 285 unique sessions over 36 days. Not a monetization
problem — a *distribution* problem caused by having nothing distinctive to say.

## 2. The finding that produced the pivot

Every non-obvious design decision made in deskflo's final week maps onto published **ADHD design
requirements** — decisions made for "calm" reasons that turn out to be the documented needs of a
specific, underserved, high-willingness-to-pay audience.

| deskflo decision | ADHD research |
|---|---|
| Streak survives one missed day; dimmed 🌿 rather than a dead 🔥 | *"Generic productivity apps punish inconsistency with dead streaks and guilt-inducing gaps."* The #1 stated abandonment reason |
| Reminders never interrupt a focus block | Interrupting hyperfocus is destructive |
| Close-out is "Done / Still going" — no failure state | *"Guilt-free design that praises users even when they stop midway"* |
| Zero is an invitation, never "0 of 4" | Rejection sensitivity; cold zeros read as judgement |
| No stats, streaks or charts on the break screen | Recovery needs reduced top-down control |

**The pivot is a repositioning, not a rebuild.** The product was built for calm; calm is what this
audience is starving for.

## 3. Vision

> **A private focus timer that learns how long things actually take you.**

Built first for the people who lose track of time hardest — and in a short-video attention economy,
that population is growing, not shrinking.

## 4. Audience

- **Beachhead — ADHD / neurodivergent adults.** $2.78B market. Willingness to pay **$5–15/mo**.
  Fewer than 10 serious competitors against 40K+ monthly searches. And critically: *"large,
  underserved, and extremely vocal about sharing resources they love"* — a word-of-mouth engine,
  which is what "organic growth" actually requires.
- **Expansion — freelancers and consultants.** Where mis-estimation converts directly into lost
  income: *"freelancers lose up to 15% of billable hours to poor documentation and estimation
  errors."*
- **Ceiling — anyone who loses their afternoon.** Everyone underestimates. ADHD users underestimate
  more and pay more for it.

**ADHD is the beachhead, not the ceiling.** No repositioning is needed to expand — the claim is
already universal.

## 5. The moat

**Accumulated personal calibration.** *"You said 30 minutes. It took 55. Here's your real number."*

Why this holds where a feature wouldn't:

- It **compounds** — six months of history is worth more than day one
- It **cannot be copied off you** — a competitor can clone the feature, not your history
- It creates genuine **switching cost** without a lock-in gimmick
- It attacks **time blindness**, the most-cited complaint of the beachhead audience

### The gap is specific and verified

Estimate-vs-actual reporting **already exists** — in ClickUp, Jira and ActiTime. But only in one
shape: **manager-facing**, project-scoped, timesheet-driven, framed around *"identify overworked
employees"* and *"assess your team's estimation accuracy."*

Nobody ships **personal calibration with nobody watching.**

The ADHD-specific tools (Tiimo, Focus Bear, SparkDay, Saner.AI) all address time blindness by
*displaying* time — visual timers, colour blocks, timelines. **None of them learns your error.**

And the mechanism is independently validated: *"After 10–15 projects with tracked time, estimates
based on historical data are consistently more accurate than any fixed multiplier."* Your own
history beats any generic rule — which is the moat stated as a research finding.

## 6. Monetization

- **Target:** $1–3k/mo, grown organically, **no ads** — ever.
- **Model:** free core forever. Paid unlocks calibration depth, history and sync.
- **Price:** $5–8/mo, **plus a lifetime option.** The research is explicit that apps get *"deleted
  out of guilt when subscription renewals approach"* — this audience needs an honest exit.
- **Math:** ~170–500 subscribers. At 3–5% conversion that's 3,500–16,000 MAU — 15–65× deskflo's
  traffic. Comparable: **Focusmate, ~$1M ARR at $7–8/mo** with an ADHD-heavy base.
- **Students are ruled out as a primary market** — low purchasing power, conditioned to free, and
  the only viable model there is ad-supported, which is off the table.

### Gates — do not build monetization early

| Gate | Trigger | Build |
|---|---|---|
| **0 — now** | <1k MAU | Distribution and product only. **No billing code.** |
| **1** | ~1k MAU | Accounts + sync, free. Learn whether anyone wants it before charging. |
| **2** | ~5k MAU | Paid tier. Calibration depth as the flagship. |
| **3** | Inbound from teams | B2B licences — **only if it arrives unprompted.** |

At Gate 0 the correct amount of monetization work is **zero**. It is very easy to spend three months
on Stripe instead of the thing that is actually binding.

## 7. Growth

**Content + community + word of mouth.** In that order.

The strongest asset is already written: `docs/research/focus-science.md` is a genuine research brief
with real citations — Gollwitzer & Sheeran (d = 0.65 across 94 studies), Masicampo & Baumeister,
Harkin et al., the interruption-cost literature. Every design decision in this product traces to one
of them, **verifiably**.

That supports a claim almost nobody in this category can make:

> **Every design decision in this app traces to a citation. Here they are.**

Published, that brief is simultaneously a content series, a credibility moat, and the reason Delva
is obviously not the eleventh pomodoro timer.

**On the Chrome Web Store:** it is a **retention** surface, not an acquisition channel. The median
extension has **17 installs**, only 0.2% exceed 1M users, and productivity is 55.5% of the store
(62,000 extensions). *"A discovery channel, not a marketing strategy."* Do not plan growth around it.

## 8. Architecture

**Backend with real persistence, from the start.** The reasoning is not "features later" — it's that
**the moat cannot live in localStorage.** Calibration history is the strategic asset, and browser
storage is wiped silently by clearing site data, switching browsers, or getting a new laptop. Six
months of accumulated calibration, gone, with no recovery.

- **Stack:** Next.js on Vercel + Supabase (auth, Postgres, cron in one).
- **Local-first as engineering, not as marketing.** The timer must stay instant and work offline;
  the server is durability and scheduled insight jobs, never in the critical path.
- **The schema is the real foundation.** Stacks are replaceable; the data model isn't.
  - **Store raw rows, derive aggregates.** You can always recompute an average; you can never
    recover a field you didn't store.
  - **Store local timezone and local wall-clock**, not just UTC. *"Your Tuesday afternoons are your
    worst"* is unrecoverable from UTC once people travel or DST shifts.

### On privacy — a deliberate change of position

deskflo's *"nothing leaves your device"* is **retired as positioning**. It's weak differentiation —
every competitor claims it — and it blocks the sync that makes the moat durable.

It is **kept as practice**, because it costs almost nothing:

- Row-level security from day one — the difference between "solid" and "leaked everyone's sessions"
- Working export and hard delete
- Never log intention text anywhere you wouldn't read aloud

**And be accurate about what this data is.** The intention field is free text about someone's life —
people will type *"prepare for the custody hearing"*. Attached to an email, that is personally
identifiable and occasionally sensitive. This is **taking custody of personal data, not avoiding
it**, and it brings real obligations: a lawful basis, deletion on request, breach notification, and
a privacy policy that describes what actually happens.

## 9. Guardrails — do not undo without a logged decision

- **No ads.** Ever. This also rules out the student market as primary.
- **No ranking, scoring or comparison between users.** §7: social comparison is the strongest
  overjustification risk, and rejection sensitivity makes it actively harmful to the beachhead
  audience. *Shared presence and accountability remain open* — Focusmate proves the model — but
  that is a different mechanism from a leaderboard.
- **No manager dashboards or employee reporting.** That's the crowded, well-defended market, and it
  contradicts everything else here.
- **No efficacy claims for focus sounds.** The evidence is *"inconclusive at best"* — 5 of 14
  studies supportive, 8 contradictory. Ship the sounds; describe them honestly. Being the app that
  tells the truth about weak evidence is itself a differentiator.
- **Never paywall the core timer.**
- **No cold zeros, no failure states, no punishing streaks.**
- **No treatment or medical claims.** Serving a clinical population is a responsibility, not a
  marketing skin.

## 10. Risks, named

1. **The friction assumption — the one that can kill it.** An estimate is friction, added at the
   start of a session, for an audience that abandons apps over friction. If fewer than roughly a
   third of sessions carry an estimate, the moat never forms. **Test this before building pricing.**
   Mitigations: optional, one-tap chips rather than typing, and visible payoff early.
2. **Funded competitors.** Tiimo and Focus Bear are real companies with real teams. You cannot
   out-feature them at 5–10 hrs/week. The narrow wedge *is* the defence.
3. **Name collision.** "Delva" is one letter from "delve" and search engines autocorrect. Survivable
   (Lyft, Flickr) but real; always pair the name with the tagline.
4. **Analytics stay parked** until ~100 users/day. Below that, nothing measured separates signal
   from noise.

---

## Appendix — what this supersedes

Carried over from deskflo, unchanged and still binding:

- `docs/research/focus-science.md` — the evidence base
- `docs/design/break-mode.md` — break-mode design, including the three deviations in §12

Retired:

- **"Vanilla JS is a hard constraint."** Its stated justification was *"speed and simplicity are the
  product's differentiators."* They aren't; they're the category default.
- **"Zero signup / nothing leaves your device"** as positioning — see §8.
- **"Four features, not six."** The product is now one hero (focus + calibration) with a wellbeing
  break layer (hydration, stretch, ambient) that exists because the timer knows where the boundary
  is. Those stay; they stop being co-headliners.
- **BP-23 / BP-24 / BP-10 / BP-16** — deskflo build-plan items, all obsolete. See
  `docs/archive/deskflo-BUILD-PLAN.md`.

Full pre-pivot history is preserved in `docs/archive/`.
