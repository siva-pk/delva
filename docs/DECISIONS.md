# Decisions Log — Delva

Reverse-chronological. Each entry: date, decision, why, and status if still open. Append new entries
at the top.

This is the durable memory of *why* things are the way they are. Read it before re-opening a settled
question.

**Pre-pivot history** (deskflo, 2026-04 → 2026-07-30) is preserved in
`docs/archive/deskflo-DECISIONS.md`. It is still worth reading — most of the design reasoning
carries over unchanged.

---

## 2026-08-12 — Phase D, and a deliberate deviation from break-mode §4

**The close-out stays on the break screen.** `break-mode.md` §4 lists "no feedback prompt" among
the break's deliberate absences, and the close-out is a prompt. This is a knowing deviation, in the
spirit of the three already recorded in §12:

- BUILD-PLAN D-07 is newer than break-mode and Delva-specific, and it puts the close-out "at the
  break" explicitly.
- The close-out is what produces `task_completed` and the session chain. Without it at the boundary,
  the answer has to be asked later — by which point the user has context-switched and the answer is
  worse, or never given at all. Calibration then has nothing to distinguish "took 20 minutes" from
  "gave up after 20 minutes".
- §4's reasoning is about *stats* — panels that invite you to evaluate yourself against a number.
  "Where did you get to with X?" is a question about the work, asked once, with two answers and no
  wrong one.

**What did move off the break screen:** the estimate-vs-actual line ("You said 30. It took 45.").
That genuinely is a session stat and §4 is right about it — it now shows back in idle, next to the
estimate for the block about to start, which reads better anyway.

### Corrections from review (same day)

**The reminder queue was never emptied.** `pending` only ever grew. One stretch reminder was
re-served at break after break, and once it aged past the staleness cutoff it sat there permanently
while `raise`'s dedupe-by-kind refused every replacement — so stretch reminders stopped for good
after about 90 minutes. Now cleared when a focus block starts, which is safe precisely *because*
focus blocks never auto-start: every one of them begins with that click, so there is no path into
`focus` that skips it.

**Hydration was unreachable.** Nothing ever raised a hydration nudge, so that whole branch, the
priority rule and the pace check were dead code. Worse, §6's load-bearing half was missing entirely:
logging must be available in every phase including mid-focus, because logging a glass is a
self-initiated two-second act and §1 is about *involuntary* interruption. There is now an
always-visible control, and it persists per local day.

**Ambient sound was orphaned by its own controls.** They rendered only when idle, so starting a
block unmounted the only way to stop a sound that kept playing — and on return the UI showed nothing
selected while it played, so selecting again layered a second voice over the first. The player is a
singleton now and the controls stay mounted outside the phase switch.

**"Nothing else measures it" was an overclaim** on the landing page, contradicted by this project's
own CLAUDE.md, which notes that ClickUp, Jira and ActiTime all do estimate-vs-actual. Reworded to
the claim that is actually defensible: they do it for managers looking at teams; this does it for
you, with nobody watching. The content plan's own rule is that one overreaching claim spends the
credibility — it applies to the product page too.

---

## 2026-08-12 — D-04: timer and session phase machine

**Rebuilt from the archive docs, not ported** — there is no deskflo source in this repo (B-01).
`docs/design/break-mode.md` §2/§5/§10 and the deskflo decisions log pin down nearly all of it; the
gaps are marked `TODO(B-01)` in code. Two of deskflo's five presets are simply unrecorded, so
"Short" and "Long" are reconstructions.

**The machine is a pure function** (`src/lib/timer/machine.ts`), with `now` passed in on every
event. Every subtle rule here is a rule about *time*, and time is exactly what cannot be exercised
reliably through a React component. It has 22 tests, all against a fixed epoch — no `Date.now()`
anywhere in the suite.

**Phase is not running-state.** A paused block is still `focus`; a break not yet visible is already
`break`. There is a `running` boolean and it is separate.

**Remaining derives from `targetAt`.** The display tick is a 250 ms counter that recomputes from the
target and never accumulates — a throttled tab loses frames, never time. Tested by asking for
remaining time 10 minutes after start with zero ticks delivered.

**Breaks auto-start; focus does not.** One function starts a break and it always sets
`running: true`; `toIdle()` always sets `running: false`.

**A break that expires while the tab is hidden lands in idle with "Break's over — ready when you
are"** — never a running focus block, because the user has just context-switched. Past 2× the break
length the cycle is treated as abandoned and the acknowledgement is dropped.

**Emissions live in state, not a ref.** The first version pushed completed sessions onto a ref from
inside the reducer. React may invoke a reducer twice for the same event, which would have written
the finished block twice into the data the moat is built on. Caught by the React compiler lint,
which was right.

**Durations are served, not planned.** `plannedFocusSeconds` and `servedSeconds` are both recorded,
paused time is excluded from served, and an open pause at the moment a block ends still counts.

---

## 2026-08-12 — D-03: auth

**Magic link, no passwords.** Nothing to forget, nothing to reset, no password handling in the
codebase at all. For an audience that abandons over friction, a password field at the door is
friction with no upside — the account exists for durability, not for security theatre.

**Auth is additive and never a gate.** The proxy refreshes the session cookie and returns; it does
not redirect. `getCurrentUser()` returns `null` as a normal state and swallows failures, because
sync being down must never take the timer down with it. There is no "sign in to continue" anywhere,
and there won't be until Gate 1.

**`middleware.ts` → `proxy.ts`.** Next 16 deprecates the middleware convention and warns on every
build. Migrated with the official codemod now rather than carrying the warning through the rest of
the build.

**Sign-out is POST-only** — a GET sign-out can be fired by any `<img>` on any page. It also leaves
local history alone: signing out stops sync, it is not a request to erase the device.

**Failure messages are deliberately generic.** Supabase's own error text can distinguish a known
address from an unknown one, which leaks whether someone has an account.

**Unverified (B-02):** no Supabase project exists, so the magic-link round trip, the code exchange
and the cookie refresh have never actually run. The unconfigured path *is* verified — the sign-in
page degrades to an honest "not configured on this deployment" message instead of throwing.

**Only half of D-03 landed.** Local storage and sync are sequenced to arrive with D-08, since
neither has anything to store until the timer and history exist. Recorded as B-07 — the first
version of this entry read as though D-03 were finished.

### Corrections from review (same day)

**Refreshed auth cookies were written to the response only.** Server Components read `cookies()`
from the *request*, so a user returning after token expiry would be refreshed by the proxy and then
rendered signed-out by the page — and with refresh-token reuse detection on, risked having the
session revoked outright. Cookies are now written to both, with the response rebuilt from the
mutated request.

**The profile row had a single point of failure.** `create trigger` on `auth.users` needs an owner
role that `supabase db push` may not have, and the whole migration would abort on it. The trigger is
now wrapped so an insufficient-privilege failure is a notice rather than a hard stop, and
`ensureProfile()` creates the row idempotently on first authenticated load. Without a profile there
is no `daily_goal_sessions`, and "3 of your 4" has no 4.

---

## 2026-08-12 — D-02: schema

Written as `supabase/migrations/0001_initial_schema.sql`. Unapplied — there is no Supabase project
and no local Postgres (B-02, B-06). Validated against the real Postgres grammar; that is syntax
only.

**`estimate_source` (`chip` / `custom` / `suggested`) — the non-obvious column.** Once D-10 starts
*suggesting* a corrected estimate, an accepted suggestion is no longer an independent guess by the
user. Folding those rows back into the bias calculation would make calibration measure its own
output and converge on a number that means nothing. The distinction has to exist in the row from the
first write, because it cannot be reconstructed later.

**`suggested_estimate_minutes` stored even when not taken.** Answers "are the suggestions any good?"
later without adding a field and losing all history before it.

**`planned_focus_seconds` kept alongside `served_seconds`, never instead.** Duration is what was
served; the *difference* between promised and served is what makes an abandoned session legible.
Storing one would destroy the other.

**`local_started_at` is `timestamp without time zone` and `local_tz` is an IANA name, not an
offset.** Offsets change twice a year and cannot be reversed into a zone. Together these are what
make "your Tuesday afternoons" (D-11) answerable at all.

**No `failed` outcome.** `completed` / `abandoned` / `skipped`, where "abandoned" is descriptive
rather than a judgement. There are no failure states in this product.

**Intention text lives in the user's RLS-scoped row and nowhere else** — 500-char cap, no index, no
copy in any event payload.

**Session ids are client-generated.** A block started signed-out and offline keeps its identity when
it later syncs, which is what makes sync idempotent rather than duplicating rows.

### Correction from review (same day) — `continued_from_session_id`

The first version had no way to link a block to the one it continues, and that would have inverted
the sign of the calibration number on the commonest case there is. Estimate 30 minutes, then three
25-minute blocks joined by "Still going" (D-07) — 75 minutes of real work against a 30-minute
estimate. Carry the estimate onto the continuation rows and D-09 sees three rows of "estimated 30,
served 25" and reports the user as *over-cautious*; leave it off and the 50 minutes of overrun are
simply invisible. Adjacency in `started_at` can't recover it, because it can't distinguish
"Still going" from "Done, then started something similar" — only the close-out choice knows, and
only at that moment.

Exactly the failure the file's own header warns about, missed on the first pass and caught in
review. `estimate_source` was added for a subtler version of the same argument.

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
