# Decisions Log — Delva

Reverse-chronological. Each entry: date, decision, why, and status if still open. Append new entries
at the top.

This is the durable memory of *why* things are the way they are. Read it before re-opening a settled
question.

**Pre-pivot history** (deskflo, 2026-04 → 2026-07-30) is preserved in
`docs/archive/deskflo-DECISIONS.md`. It is still worth reading — most of the design reasoning
carries over unchanged.

---

## 2026-08-12 — D-01: scaffold

**Decision:** Next.js 16 (App Router) + React 19 + Tailwind v4 + TypeScript, `src/` layout, `@/*`
alias. Supabase wired through `@supabase/ssr` rather than a bare `supabase-js` client, because
cookie-scoped server clients are what makes row-level security apply to the signed-in user instead
of to one shared identity — that matters from the first table (D-02), not from D-03.

**Turbopack, not Webpack.** Default in Next 16; no reason to opt out.

**Dark-only, no theme toggle.** A holding page doesn't need one, and the palette is a placeholder
that the real design work will replace. `globals.css` carries the AA-safe `--color-muted` token and
a comment on why small text is never dimmed with `opacity`.

**No email capture on the holding page.** BUILD-PLAN scopes D-01 to "something is coming", and a
capture form implies a table and a write path, which is D-02's decision to make. Open question worth
revisiting quickly: distribution is the binding constraint, and a holding page that takes no address
converts nothing. Deliberately deferred, not overlooked.

**`GET /api/health`** exists as a deployment check — it issues a real request to `/rest/v1/` on the
configured project and distinguishes `reachable` / `rejected` / `unreachable` / `unconfigured`. Not
linked from anywhere and not a user-facing surface.

The first version used `supabase.auth.getUser()` and was **wrong in the worst direction**: with no
session cookie, auth-js returns `AuthSessionMissingError` without issuing any HTTP request, so the
endpoint returned `{"ok":true,"supabase":"reachable"}` against a project that did not exist. Caught
in review. The lesson generalises — a check that verifies the deploy step must have an input for
which it fails, and this one had none.

**Status: partially done.** The code scaffold is built, builds clean, and the holding page renders.
The Supabase project and the Vercel deployment at `delva.app` are account actions and are not done —
D-01 stays unticked until they are.

---

## 2026-07-30 — The pivot: deskflo → Delva

**Decision:** Abandon deskflo's positioning and architecture. Start a new project, Delva, around a
different audience and a different moat. Carry over the research base, the design decisions and most
of the product logic; discard the positioning, the vanilla-JS constraint, the Chrome extension and
the SEO landing pages.

Full reasoning: `docs/STRATEGY.md`. This entry records what was decided and what it supersedes.

### Why deskflo was abandoned

Its positioning — *"a free, calm, no-signup focus timer for desk workers"* — is the **category
default**, not a differentiator. The 2026 "best pomodoro app" lists run ten deep in free
competitors, and **Foci** markets itself as *"free, no ads, no premium tier"*: deskflo's exact
pitch, already taken. The late feature ("reminders wait for your break") is good but copyable in a
weekend.

At ~8 sessions/day this was never a monetization problem. It was a distribution problem caused by
having nothing distinctive to say.

### The finding that produced the pivot

Every non-obvious decision made in deskflo's final week — forgiving streaks, non-interrupting
reminders, no failure states, invitations instead of cold zeros, no stats on the break screen — maps
almost exactly onto published **ADHD design requirements**. Those were made for "calm" reasons. They
happen to be what an underserved, high-willingness-to-pay audience is documented as needing.

**The pivot is a repositioning, not a rebuild.**

### What was decided

| | |
|---|---|
| **Vision** | A private focus timer that learns how long things actually take you |
| **Beachhead** | ADHD / neurodivergent adults — $2.78B market, $5–15/mo WTP, vocal sharing culture |
| **Moat** | Accumulated personal calibration — compounds, can't be copied off a user, attacks time blindness |
| **Revenue target** | $1–3k/mo, organic, no ads |
| **Model** | Free core forever; paid = calibration depth, history, sync. $5–8/mo plus a lifetime option |
| **Stack** | Next.js + Vercel + Supabase |
| **Name** | Delva, from *delve* (Old English *delfan*, to dig) — `delva.app` |

### Options considered and rejected

- **Students** — largest pomodoro audience, but low purchasing power, conditioned to free, and the
  only viable model is ad-supported. Ruled out by the no-ads constraint.
- **"Attention crisis" mainstream** — compelling narrative, but not a customer segment.
- **Teams / PM tooling** — estimate-vs-actual already exists there (ClickUp, Jira, ActiTime) as
  manager-facing reporting. Crowded, well-defended, and contradicts the positioning.
- **Freelancers as the *entry* market** — the pain is sharper (15% of billable hours lost) but the
  tooling is saturated (Toggl, Harvest, Clockify) and it needs billing features Delva doesn't have.
  Kept as **expansion**, not entry.
- **B2B / team licences** — the arithmetic is far kinder (ten 50-seat companies = $2k/mo vs ~500
  consumers), and it was explicitly offered. Not chosen; kept as Gate 3, inbound-only.

### Product decisions taken during this planning

- **Gamification — dropped.** Research supports it for ADHD (up to 30% improvement in trials) but
  also finds *"a good chance you'll abandon a gamified app within three months"* as novelty decays,
  plus sensory-overload risk. It would also reverse the forgiving-streaks decision made days
  earlier. The reconciling finding: *"when extrinsic rewards are paired with clear competence cues,
  they eventually become internalised."* **The calibration engine is the competence cue** — "your
  estimates were 45% off in June, they're 12% off now" is an earned reward that can't wear off. No
  points or badges layered on top.
- **AI insights — local statistics first, not an LLM.** *"You underestimate by 45%"*, *"your worst
  estimates are Tuesday afternoons"* are arithmetic. At low session counts an LLM produces
  confident nonsense, and it would mean shipping intention text to a third party. Revisit at Gate 2
  with real history depth.
- **Focus sounds — ship, but never claim efficacy.** The systematic review: 5 of 14 studies
  supportive, 8 contradictory, 1 mixed — *"inconclusive at best."* Much of the compelling 40Hz work
  is Alzheimer's research, not focus in healthy adults. The ADHD community is targeted relentlessly
  by brainwave marketing and has good detectors. **Being honest about weak evidence is itself a
  differentiator.**
- **Legitimacy comes from `focus-science.md`, not from sounds.** Gollwitzer & Sheeran (d = 0.65
  across 94 studies), Masicampo & Baumeister, Harkin et al. Every design decision traces to a
  citation, verifiably. Publishing that brief is simultaneously content, credibility and
  differentiation.

### Privacy — a deliberate reversal

deskflo's *"nothing leaves your device"* is **retired as positioning** (weak — everyone claims it;
and it blocks the sync that makes the moat durable) but **kept as practice** (RLS from day one,
working export and delete, never log intention text).

Recorded plainly because it was tempting to frame this as "we only store app data": **the intention
field is free text about someone's life.** People will type *"prepare for the custody hearing."*
Attached to an email that is personally identifiable and occasionally sensitive. This is taking
custody of personal data, not avoiding it, and it carries real obligations.

### On the Chrome extension — correcting an earlier claim

It was suggested during planning that the Chrome extension was an underexploited *growth* channel.
That was wrong. The median extension has **17 installs**, only 0.2% exceed 1M users, productivity is
55.5% of the store (62,000 extensions), and the Web Store is *"a discovery channel, not a marketing
strategy."* It is a **retention** surface at best. The deskflo extension is being dropped rather
than ported.

### The naming decision

Criteria settled through elimination: **suggestive rather than descriptive or abstract** (descriptive
marks like "Focusmate" barely protect and box you in; pure abstract buys no comprehension when
starting from zero traffic), **English roots**, 2–3 syllables, vowel ending.

Suggestive of **time or depth, never "focus"** — "focus" is the crowded word (Focusmate, Focus Bear,
Focus Keeper, Focus To-Do) and walking into it means competing on their vocabulary.

Rejected on collision, all verified: **Orra** (ORRA Fine Jewellery — India is a quarter of traffic),
**Elva** (ELVA Baltic IT, plus a financial-wellness app selling on "productivity"), **Solva**
(solva.io, 1M users), **Orva** (2024 trademark for an online non-downloadable PWA in a health
context — same class, adjacent domain), **Elvora/Alvora**, **Tide** (detergent + fintech), **Tally**
(Tally Solutions, huge in India). **Vessa** cleared every check but wasn't liked.

**Delva** — from *delve*, Old English *delfan*, to dig; to search deeply. Two syllables, vowel
ending, English root, and it says what a focus block is. No blocking trademark found. Known
namesakes: a Finnish industrial-metals firm (unrelated class) and a Utah business registration to
verify.

**Known cost, accepted:** "Delva" is one letter from "delve" and search engines autocorrect.
Survivable — Lyft, Flickr, Tumblr all live with it — but the name should always be paired with the
tagline.

### What carries over unchanged

- `docs/research/focus-science.md` — the evidence base
- `docs/design/break-mode.md` — including the three deliberate deviations in §12
- The product logic: session phase machine, reminder queue policy, timestamp-based clock, forgiving
  streaks, served-not-preset durations, goal-relative counters

### What is retired

- **"Vanilla JS is a hard constraint"** — its justification was *"speed and simplicity are the
  differentiators."* They're the category default.
- **"Zero signup / nothing leaves your device"** as positioning.
- **"Four features, not six"** — now one hero (focus + calibration) with a wellbeing break layer.
- **BP-23 / BP-24 / BP-10 / BP-16** and the whole deskflo build plan.
- The Chrome extension and the five SEO landing pages.

### The open risk

**Will people actually enter an estimate?** It's friction, at session start, for an audience that
abandons over friction. If fewer than roughly a third of sessions carry one, the moat never forms.
This is the assumption everything rests on and it should be tested early and cheaply — optional,
one-tap, with visible payoff — before anything is built on top of it.
