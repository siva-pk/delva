# Build Plan — Timer-First Revamp

**The single source of truth for what to build next.** ROADMAP.md is gone — everything still live
from it is folded in here.

**Status:** **Stages 1–4 SHIPPED. Stage 5 half shipped** (BP-23 / BP-24 outstanding).
**Stage 6 COMPLETE 2026-07-30.** Remaining: BP-23, BP-24, BP-10.

---

## Start here

If you're opening this file to do work, the next task is:

> **BP-23 — landing page at `/`, dashboard to its own route.** Unblocked by owner decision
> 2026-07-30; the measurement cost is accepted and recorded in the Stage 5 block. **Ship it alone**,
> never in the same release as BP-10, then **BP-24** (retire the five SEO pages behind 301s).
>
> **Then BP-10** (Stage 7) — owner asked for the full redesign to be built and shipped. Note that
> `DeskFloV2.jsx`, the "approved preview" BP-10 refers to, is **not in the repo** — only the written
> principles from the 2026-04 DECISIONS entry survive.

**Stages 1–4 shipped and verified live 2026-07-29.** BP-11 + BP-13 shipped the same day; BP-27
shipped 2026-07-30.

⚠ **Everything below is depth, not the finish line.** If you stop now, the product is coherent: the
timer is honest, reminders no longer interrupt, and the break layer exists.

⚠ **Analytics are parked until traffic justifies them.** Decided 2026-07-29: at ~8 sessions/day
nothing measured is a signal, so no read is scheduled and no item waits on one. Revisit at
**~100 users/day** (new + returning). The instrumentation keeps collecting in the meantime — the
point of Stage 1 was to have trustworthy data *when* there's enough of it, not to read it now.
The 73% figure is dead either way; it was measured with broken instrumentation.

---

## The thesis every item serves

> The timer owns the session. Hydration, stretch and ambient sound are **break-layer** features
> that exist *because* the timer knows where your boundary is.

Not a bundle of tools sharing a page — one hero feature with a scientifically-justified support
layer. The product is **four features, not six**: Focus Timer (hero) + hydration, stretch, ambient.
Tips and Quick Notes are cut.

If a proposed item can't be checked against that sentence, it doesn't belong here.

---

## How to read this file

- **Seven stages, each independently shippable.** You can stop after any stage and production is
  still coherent — no half-finished feature left live.
- **Stages are named for what they do.** They used to be numbered "Phase 0–6", which said nothing.
  Old numbers map as: `Phase N` → `Stage N+1` (old Phase 0 = Stage 1).
- **`BP-nn` are stable IDs.** Other docs (DECISIONS.md, design/break-mode.md) reference them by
  number, so they never get renumbered even when items move stage.
- **`§N` references** point to sections in [docs/research/focus-science.md](research/focus-science.md).
  Analytics claims point to [docs/ANALYTICS.md](ANALYTICS.md).
- **"1 session"** ≈ one focused working block, not one hour.
- **When an item ships:** tick it, move the outcome into DECISIONS.md, delete the item from here.

### Scale check — read before committing

Seven stages ≈ **31–40 sessions**. At the 5–10 hrs/week in CLAUDE.md that is a multi-quarter
commitment, not a month.

**Done:** Stages 1–4 in full, BP-11 + BP-13 from Stage 5, BP-27 from Stage 6.
**Left:** ~14–21 sessions — BP-07 / BP-08 / BP-09 / BP-14b (Stage 6), BP-10 (Stage 7), plus BP-23 /
BP-24 whenever their baseline exists. All of it optional depth.

**Stages 1–3 were the real finish line, and they are shipped.** They were the minimum that makes the
thesis true. If the plan has to shrink, cut from Stage 7 downward, never from Stage 1.

---

# Stage 1 — Trust the numbers ✅ SHIPPED 2026-07-29

*Nothing user-visible. Full outcomes, including two bugs found during the work, are in
DECISIONS.md — this stub stays only so the stage numbering keeps its meaning.*

Delivered: BP-26 (instrument keyboard shortcuts + welcome overlay), BP-25 (timestamp-based
timer, in `timer.js` and `stretch.js`), BP-22 (stretch default 45m → 30m), BP-15 (Core Web
Vitals via native `PerformanceObserver`), BP-14a (mobile smoke test — no showstoppers; one
WCAG target-size failure fixed).

**Deployed and verified on deskflo.app 2026-07-29.** Timer, keyboard events, 30m default, the
target-size fix and the hashed service-worker cache all confirmed live. Live testing surfaced one
bug in the new code (CLS reported as missing rather than zero), fixed same day.

**One follow-up this stage created:** the extension now diverges — its own copies of `timer.js` /
`stretch.js` still have the tick-decrement clock. See "Deferred".

---

# Stage 2 — Give the modules a shared brain ✅ SHIPPED 2026-07-29

*Full outcomes in DECISIONS.md — this stub stays only so the stage numbering keeps its meaning.*

Delivered: BP-19 (`js/session.js` — phase state + pub/sub, driven solely by `timer.js`),
BP-28 (tips removed), BP-05 (Quick Notes removed from the dashboard), BP-21 (namespace
migration finished, `app.js` bridge deleted).

**User-visible after all** — the stage was planned as invisible, but deleting two cards is not.
The dashboard is four cards now: the timer spans full width as the hero, hydration and stretch
pair beneath it, ambient stays full width. That is a holding layout to avoid an empty grid cell,
not the redesign — BP-10 still owns that.

**One item did not go to plan.** `js/notes.js` was *not* deleted: `/online-notepad/` is an
indexed SEO page that loads it standalone. It now lives on solely for that page and is out of
`index.html`, `JS_FILES` and `sw.js`. BP-24 deletes page and module together, behind a 301.
`js/landing-bridge.js` is down to one alias for the same reason.

---

# Stage 3 — Protect the focus block ✅ SHIPPED 2026-07-29

**Deployed and verified live on deskflo.app.** Confirmed in production: a stretch reminder firing
31 minutes into a 50-minute block popped no modal and fired **no notification**, the intent queued,
and it was released as the single nudge when the break auto-started at the boundary. That is the
original complaint fixed, end to end, in production.

**Ships as:** the first user-visible change, and the smallest set that makes the thesis true.
**Why here:** this is the fix for the original complaint — hydration and stretch interrupting the
focus they sit next to. Ships without touching layout or positioning.

**If you only ever build Stages 1–3, the revamp still worked.** The conflict is fixed, the timer is
honest, and the break layer exists.

**What was built**

| Item | Where |
|---|---|
| BP-01 | New `js/reminders.js` (queue + policy); gates in `stretch.js` and `hydration.js` |
| BP-20 | `timer.js` `onComplete()` — breaks auto-start via `_run()`, focus does not |
| BP-06 | New `js/break.js` + `#break-panel` markup + `[data-phase="break"]` CSS |
| BP-02 | `timer.js` `PRESETS` — 5 presets, Deep 50/10 default, Custom persisted |

Also landed, not separately itemised: long breaks (every 4th, 2× the short break), and the §10.2
abandoned-break rule (a break that expired more than 2× its length ago completes silently instead
of chiming about a four-hour-old break).

**Three deviations from the design, all deliberate** — see
[break-mode.md §12](design/break-mode.md): the stretch modal was *not* deleted (the
`/stretch-reminder/` page and idle users both need it), the break screen does not start the guided
exercise (it would render behind the overlay), and long-break duration resolved as 2× the short
break.

**Two decisions worth not undoing**

- **Reminder queue policy** (break-mode §3): at most ONE nudge per break, hydration prioritised only
  when the user is behind pace, and staleness handled structurally — the queue clears on every
  `focus:start`, so only intents from the block you just finished can surface. Browser notifications
  go through the same gate; they used to fire regardless of phase, which is worse than a modal
  because it escapes the tab.
- **The break screen must never gain stats, streaks, charts or tips.** §5: recovery needs soft
  fascination and reduced top-down control, so a progress panel works against the thing the break
  exists for. Every competitor puts stats there — that's the mistake worth not copying.

---

# Stage 4 — Make the session mean something ✅ SHIPPED 2026-07-29

**Deployed and verified live.** The intention field starts a block on Enter, the close-out appears at
the break only when an intention was set, "Still going" carries it forward and "Done" clears it. The
intention text appeared in no analytics payload.

**Ships as:** the timer starts asking what you're doing and what happened.

| Item | Where |
|---|---|
| BP-03 | New `js/intention.js` + `#intention-form` in the timer card |
| BP-04 | `#break-closeout` in the break panel, driven by `js/break.js` |
| BP-17 | Session lifecycle events in `timer.js`; schema documented in [ANALYTICS.md](ANALYTICS.md) |

**The framing is the feature.** "This session I'll ___" is a commitment; "Task name" is metadata, at
identical input cost. Gollwitzer & Sheeran put implementation intentions at d = 0.65 across 94
tests. If anyone ever "simplifies" that label to a generic placeholder, the feature stops working
while still looking present — the copy is load-bearing.

**The close-out carries the intention forward, and that IS the distraction capture.** "Still going"
leaves the intention in place for the next block; "Done" clears it. Masicampo & Baumeister only
require that an unfinished goal feel *handled*, not that it be written down somewhere — so §4's
mechanism lands at zero new UI, with no note surface and no reversal of BP-05.

**Two decisions worth not undoing**

- **The close-out appears only when an intention was set.** There is nothing to close otherwise, and
  asking "did you finish?" about no plan is noise. It also means the close-out is a *reward* for
  setting an intention rather than a tax on skipping it.
- **`intentionSet` is a boolean and always will be.** The intention text never leaves the device.
  The privacy claim is load-bearing too; see ANALYTICS.md.

---

# Stage 5 — Say what it is  ⚠ HALF SHIPPED

**BP-11 and BP-13 are shipped and verified live** (2026-07-29). **BP-23 and BP-24 were blocked on a
missing baseline; Siva accepted that cost on 2026-07-30 and asked for them to be built anyway.**

## Why BP-23 is blocked — read this before "just doing it"

This item's own acceptance test is *"total dashboard engagement — specifically
sessions-with-a-completed-focus-block, absolute, before vs after."*

**There is no "before".** `session-complete` — the event that measures exactly that — did not exist
until BP-17 shipped on 2026-07-29. Ship BP-23 now and the before-period is a few hours of one
person's testing. The comparison the plan requires becomes permanently unavailable, and the question
"did adding a click before the tool help or hurt?" can never be answered.

That matters more than usual because BP-23 is **the one item in this plan most likely to make things
worse.** It inserts a click between arrival and the tool, reversing the product's central
differentiator. The plan says the tradeoff "should be measured, not assumed away" — so shipping it
unmeasured contradicts its own instruction.

**Consequence, recorded so nobody re-derives it later:** whatever the numbers look like after BP-23
ships, they cannot be attributed to BP-23. Do not read a later change in engagement as evidence for
or against the landing page. If the question ever needs a real answer it needs a
revert-and-remeasure, not a retrospective look at the data.

**BP-24 follows BP-23**, because BP-23's landing page is the 301 target for the five retired pages.
Retiring them without a destination is the one way the plan says to make it actively harmful.

**Most of BP-23's value was captured without it.** Its case was comprehension — "an all-in-one
dashboard" isn't a promise anyone parses in two seconds. BP-11 fixed that in the copy, on the
existing surfaces, with no click inserted and nothing to reverse. What remains unaddressed is
purely the SEO/positioning surface, which is not urgent at current traffic.

**Ships as:** a real front door.
**Why after the product changes:** a landing page promising "the focus timer that protects your
boundary" in front of a dashboard that still interrupts you is a promise the product doesn't keep.
Stage 3 makes the claim true; Stage 5 makes it legible.

- [ ] **BP-23 · Landing page at `/`; dashboard moves to its own route** — *unblocked by owner
  decision 2026-07-30; the measurement cost below stands and was accepted*
  - **The tradeoff is real and should be measured, not assumed away.** deskflo's positioning is
    "zero signup, sub-1s, the tool is right there." A landing page at `/` inserts a click between
    arrival and the tool — the one thing this product has never done. The case for it is
    comprehension: "an all-in-one dashboard" isn't a promise anyone parses in two seconds. The case
    against is that some people who would have clicked Start now bounce at the CTA instead.
  - **How to tell which happened:** total **dashboard** engagement — specifically
    sessions-with-a-completed-focus-block, absolute, before vs after. *Not* landing-page bounce
    rate, which will look better almost by definition since click-throughs are self-selected.
  - **Also:** this moves the SEO surface. `/` currently ranks as the tool.
  - **Retires the welcome overlay** (formerly BP-18).

- [x] **BP-11 · Positioning + hero copy rewrite around the thesis** ✅ *shipped 2026-07-29*
  - Now promises the Stage 3 behaviour: title, description, OG/Twitter, `h1` and schema.org all say
    the reminders wait for your break. The welcome overlay — the de-facto front door while BP-23 is
    blocked — was rewritten from bundle-of-tools framing ("you probably have a few tabs open") to
    the thesis, and its four features are described as one hero plus three break-layer supports.

- [ ] **BP-24 · Remove the 5 SEO landing pages + 301 redirects** — *follows BP-23*
  - **Not a plain delete. Two things need care:**
    1. **This reverses a logged decision.** DECISIONS.md ("SEO landing pages: tool-first layout")
       concluded they stay live because they cost nothing to maintain. The reversal is defensible —
       under the new thesis they're standalone tools contradicting the timer-owns-the-session
       model — but log it as a reversal with reasoning, not a silent drop.
    2. **They are indexed and carry inbound traffic** (124 pageviews in the April snapshot).
       Each needs a 301 to the most relevant destination, most likely the new landing page.
       **Retiring them without redirects is the one way to make this actively harmful rather than
       merely neutral.**

- [x] **BP-13 · Shorten the feedback form** ✅ *shipped 2026-07-29*
  - Three labelled sections → two. The category chips are gone: they were **already** optional in
    `feedback.js` (submit only ever required one of the three fields), so they cost a whole section
    of perceived length and bought a field nobody reads. `category: null` is still sent so the
    Worker's payload shape is unchanged. Message comes first now, rating is an inline row marked
    *optional*, button reads "Send".
  - **Not** the "true one-click path" the item also offered — a star tap that submits immediately is
    easy to hit by accident and unrecoverable once sent.

---

# Stage 6 — Depth for the people who stay ✅ COMPLETE 2026-07-30

**All five items done:** BP-27 (settings drawer), BP-07 (goal-relative stats), BP-08 (forgiving
streaks), BP-09 (session history), BP-14b (accessibility sweep).

**Ships as:** the reasons to come back.
**Honest caveat:** this stage serves the engaged ~18%, not the bounce problem. It is retention
depth, and it's correctly sequenced *after* the instrumentation and funnel work — otherwise it's
polish on a funnel we still can't measure.

- [x] **BP-27 · Settings drawer (not a page) + inclusion rule** ✅ *shipped + verified live 2026-07-30*
  - **New `js/settings.js` + `#settings-drawer`.** Slides from the right on desktop, becomes a
    bottom sheet below 700px. `⚙️` in the header capsule. Escape and backdrop both close it — unlike
    break mode, this *is* a dialog, so dismissable is correct.
  - **Applying the inclusion rule cut the "likely contents" list roughly in half**, which is the
    item working as intended rather than a shortfall. What shipped: the three previously-hardcoded
    daily goals (focus blocks, glasses, stretches), reminders on/off, browser notifications on/off,
    completion chime, reduce motion, and export/wipe.
  - **Deliberately excluded, with reasons in `js/settings.js`:** auto-start toggles (BP-20 settled
    that on evidence — a toggle reopens a decided question, which is precisely the smell the rule
    names), default preset (last-used already persists, which needs no decision at all), custom
    timer lengths (already inline, in context — duplicating them creates two sources of truth),
    theme and master mute (already one click away in the header), ambient volumes (already
    per-sound), long-break cadence (fixed at 4).
  - **Every setting drives real behaviour, verified:** goals feed hydration.js / stretch.js and
    re-render immediately; reminders-off suppresses modal, notification *and* queueing while the
    countdown keeps ticking; notifications-off silences only the notification and keeps the modal;
    chime-off silences the completion sound without affecting the timer.
  - **Data section:** export writes only `df_`-prefixed keys to a dated JSON file. Wipe is two-step
    (the button re-labels to "Tap again to erase everything", disarms after 5s and on drawer close)
    then reloads. Non-`df_` keys are untouched.
  - **Landing pages unaffected** — they don't load settings.js, and both goal accessors fall back to
    the old hardcoded values.
  - **Drawer or overlay panel, never a page.** DECISIONS.md rejected multi-page navigation as
    premature and that reasoning is unchanged. A drawer delivers the capability without starting
    down the multi-page road.
  - **Why it's structurally necessary, not nice-to-have:** today the settings *are* the inline card
    controls — timer presets, stretch intervals, theme, mute, ambient volumes. The moment the timer
    becomes the hero and support features are demoted to small panels, those controls have nowhere
    to live. Something has to catch them.
  - **Inclusion rule — a control earns a place only if it meets one of these:**
    1. **No defensible default exists** because users genuinely differ — interval length, hydration
       goal, session goal, reminder frequency.
    2. **It's a comfort or accessibility need** — sound, reduced motion, theme.
    3. **It's a data/privacy control** — export, wipe.

    Everything else gets a well-chosen default. Explicitly *failing* the rule: long-break cadence
    (fixed at 4 — [break-mode §10.5](design/break-mode.md)), and anything where we're unsure and
    would use a toggle to avoid deciding. **If a setting exists because we couldn't pick, that's a
    design smell, not a feature.**
  - **Likely contents:** *Timer* — custom lengths, default preset, auto-start (BP-20) · *Goals* —
    daily sessions, hydration glasses (hardcoded at 8 today), stretch target · *Reminders* —
    on/off, interval, browser notifications · *Sound* — master mute, chime, ambient defaults ·
    *Appearance* — theme, reduced motion · *Data* — export JSON, clear all.
  - **The Data section is positioning, not plumbing.** "Everything stays on this device — export it
    or wipe it, anytime" makes the privacy claim tangible instead of asserted. `storage.js` already
    exposes `clearAll()`, so it's cheap — and it's exactly the detail that earns goodwill in the
    communities driving your traffic.
  - **Must land before BP-07** — the user needs somewhere to choose the goal BP-07 measures against.

- [x] **BP-07 · Stats compared against a self-chosen goal, not bare counts** ✅ *2026-07-30*
  - Session badge reads **"3 of your 4"**, not "3 sessions". Stretch count likewise. §7: the
    motivational driver is the *discrepancy signal* — the visible gap between where you are and
    where you said you'd be — and a bare count contains no gap. Harkin et al. found the effect is
    stronger when people review data *against their goal* than when they merely record it.
  - The goal is the one chosen in BP-27's drawer, which is the other half of the finding: a
    self-chosen target is autonomy-supporting.
  - **Past the goal it stops measuring** — "3 done ✓" rather than "3 of your 2". A gap that has
    closed shouldn't keep being counted against.
  - **Zero still shows an invitation** ("Ready to focus?"), never "0 of 4". §7 says the existing
    hide-the-cold-zero convention was already right.

- [x] **BP-08 · Revisit streak design — forgiving, no leaderboards** ✅ *2026-07-30*
  - **A streak now survives one missed day.** Miss two and it resets. §7: a breakable chain
    punishes exactly the people who already have the habit, and a broken streak is a well-known
    quit trigger — the person most likely to abandon deskflo over a zeroed counter is the one who
    cared about it.
  - **The grace is visible, not hidden.** `checkStreak()` returns `inGrace`, and the badge shows a
    dimmed 🌿 instead of 🔥 with an honest `aria-label` ("4 days, one day missed"). Forgiving the
    miss shouldn't mean misrepresenting the run.
  - One day only — past that the number stops describing anything.
  - **This qualifies the logged "streaks are core to retention, Duolingo-style" decision** rather
    than dropping it. The naive version is the risky one. No leaderboards, ever — §7 is unambiguous
    that social comparison is the strongest overjustification risk.

- [x] **BP-09 · Session history + log** ✅ *2026-07-30*
  - New `js/history.js`. Focus and break blocks grouped by local day, in the settings drawer behind
    a `<details>` disclosure.
  - **Where it lives was forced, not chosen.** Not a page (multi-page rejected, and BP-27's drawer
    exists to avoid it), not the break screen (§5 — a log there works against recovery, the mistake
    every competitor makes), not a dashboard card (it would compete with the hero for the same
    glance, and BP-10 is about to rebuild that surface). A disclosure was what remained, and it
    suits a deliberate act.
  - **Duration is what was SERVED**, not the preset length — a block stopped at 6 of 15 minutes is
    a 6-minute record. BP-25 was the stated hard dependency and this is why: on the old
    tick-decrement clock every hidden-tab block would have logged a wrong duration, permanently.
  - Sub-30-second blocks aren't logged; a mis-tap isn't a session.
  - **The intention text is stored and shown locally, and never sent.** BP-17 still reports booleans
    only. It's escaped before rendering — local isn't trusted, and pasted markup would otherwise
    execute.
  - 200 records, newest first — over two weeks at a heavy 12 blocks/day, bounded without pruning.

- [x] **BP-14b · Full mobile + accessibility audit** ✅ *shipped + verified live 2026-07-30*
  - **Zero WCAG AA contrast failures across 289 text/background combinations**, both themes, on the
    dashboard, settings drawer, session history, feedback dialog and break mode, plus the five
    landing pages. **Zero WCAG 2.5.8 (24×24) target-size failures. Zero horizontal overflow at
    375px.**
  - **Fixed at the token level**, not call site by call site — `--text-muted` alone had 30 call
    sites. `--text-secondary` 4.18 → ~7.0:1, `--text-muted` 2.22 → ~5.2:1.
  - **New AA-safe families**, because the brand hues cannot carry small text:
    `--accent-text` / `--sage-text` / `--water-text` for foreground, and
    `--accent-strong` / `--sage-strong` / `--water-strong` for filled-button backgrounds.
  - **The most consequential fix: the primary buttons' own labels were below AA** — white on
    `--accent` measured 3.29:1, on `--sage` 3.52:1, on `--water` 2.96:1. A filled button's label
    sits on the fill, so white-on-fill is what matters, and the base hues never cleared it.
  - **Opacity is not a safe way to dim text.** Six elements used `opacity: 0.5–0.8`, which
    composites the colour back toward the background — no token change could ever have fixed them.
    All now use real colours at full opacity. **Don't reintroduce opacity-dimmed text.**
  - The unrated rating stars measured **1.34:1** — you couldn't tell the control existed.
  - `css/landing.css` fixed too, even though BP-24 deletes those pages next; it was three lines.

  **Honest remainder:** 20–32 interactive targets per surface are still under the **44×44 iOS
  guideline**. That is a guideline, not WCAG AA, and many are inline links and pills where 44px
  would break the layout. **BP-10 rebuilds this surface — revisit there.**

---

# Stage 7 — Rebuild the surface

**Ships as:** the product looking like what it now is.
**Size:** ~6–10 sessions (placeholder — needs its own design pass before this can be estimated
with any confidence).
**Deliberately last and deliberately alone.**

- [ ] **BP-10 · Full layout redo + visual language** — *complete redesign, not a re-ranking of cards*
  - **The visual refresh folds in here.** This reverses earlier advice in this plan. When BP-10
    meant "demote some cards", shipping a visual overhaul on top of a layout tweak would have made
    both unreadable. Since the layout is being **rebuilt from scratch**, building it in the *old*
    visual language and then redoing it is pure waste. A ground-up rebuild is exactly when a new
    visual language costs least. (Direction: the "Digital Sanctuary" principles from the 2026-04
    DECISIONS entry — no-border tonal surfaces, bolder 2rem+ radii, generous spacing, slate-teal
    primary. `DeskFloV2.jsx` was built as a preview and approved directionally, never converted.)
  - **Cheaper than it looks by the time it arrives:** tips and Notes are already gone, so two fewer
    surfaces to place; break mode, the settings drawer and session history all already exist, so
    the redesign is *arranging known components* rather than inventing them alongside a moving
    target.
  - **Isolation rule: never in the same release as BP-23.** If the layout and the landing page
    change together, neither result is readable.

---

## Reading the results

At ~8 sessions/day a meaningful read takes weeks, and A/B testing is not viable at this volume.
Ship in coherent stages and read trend; don't try to run experiments.

**Nothing is scheduled to be read until traffic reaches ~100 users/day** (decided 2026-07-29). At
~8 sessions/day the numbers cannot separate a real effect from noise, so acting on them is worse
than ignoring them — it invites reversing good decisions on a bad signal. Ship on the thesis and
the evidence base; the instrumentation collects quietly until there's enough of it.

When that threshold arrives:

1. **Re-baseline first.** The old 73% was measured with broken instrumentation. The post-BP-26
   number is the real starting point, and it will look better immediately without anything having
   improved.
2. **The one number worth waiting for: completion rate split by `intentionSet`.**
   `session-complete` / `session-start`, cut by whether an intention was named. That is the
   d = 0.65 claim from §3 tested on real users instead of borrowed from a meta-analysis, and it is
   the only thing here that could change what gets built next.
3. **Then, and only then, BP-23.** It is blocked precisely because it needs a `session-complete`
   baseline to be evaluable at all. Ship it alone, with nothing else in the release, or its effect
   is unattributable. **Never in the same release as BP-10** for the same reason.
4. **Note the event-volume drop.** BP-28 removed `tip-next`, the #2 event by volume. Total events
   will fall for reasons unrelated to engagement — record it in ANALYTICS.md or the trend reads as
   a regression.

---

## Deferred, with the debt written down

- **BP-16 · Extension: mirror suppression in the service worker.** `chrome.alarms` currently fires
  reminders regardless of what the dashboard is doing, so **the extension will keep doing the exact
  thing the web app is being redesigned to stop doing** until this ships. BP-01 is not truly
  complete without it. Acceptable short-term — extension traffic is small and untracked — but do
  not ship a *new* extension build in this state without a conscious decision to do so.
- **BP-28's extension cost — now live debt.** Tips are gone from the web app but `extension/js/
  tips.js` is a fork and still ships. The New Tab glance view keeps a feature the product no
  longer has, including the "share deskflo" tip injected every 10th rotation. Accepted; resolve
  with BP-16 before any new extension build.
- **The extension's clock is now wrong in a way the web app's isn't.** `extension/js/` is a full
  fork, not a shared build, so BP-25's timestamp fix did **not** propagate — `extension/js/timer.js`
  and `extension/js/stretch.js` still decrement per tick. Fixing them is mechanical (the same
  diff applies), but it is untestable without loading the unpacked extension, so it was left out
  of Stage 1 rather than shipped unverified. **Do this before any new extension build.**

## Closed items — kept so the IDs don't get reused

| ID | Fate |
|---|---|
| BP-12 | Single above-fold CTA → **absorbed into BP-23.** What survives is the sequencing principle: don't ship the landing page and the layout redo together, or neither result is readable. |
| BP-14 | Split into BP-14a (Stage 1, showstoppers) and BP-14b (Stage 6, full audit). |
| BP-18 | Fate of the welcome overlay → **resolved: removed**, replaced by BP-23's landing page. |

## Explicitly not in scope

- Account system / cross-device sync — `js/store.js` is ready for it, but there's no signal anyone
  is blocked.
- Monetization (ads/premium) — waits for DAU thresholds not yet reached.
- Multi-page / sidebar navigation — rejected for the current feature set. BP-27's drawer exists
  specifically to avoid it.
- Further SEO build-out. Blog-based SEO may replace the removed landing pages later.

## Ongoing — not part of any stage

Distribution work runs in parallel and never "ships":

- Keep the weekly community rhythm from DECISIONS.md: daily 30 min community presence, 2×/week
  fix-and-post, weekly analytics review (observe only), biweekly bigger post.
- **Dig into which specific Reddit posts/subreddits drove the 36 sessions / 329 events.** Reddit
  outperforms every other channel ~10× on events-per-session — find out why and repeat it
  deliberately rather than posting broadly.

---

## Still open

Small, non-blocking, decide at build time:

- **Long-break duration.** Cadence is settled (every 4th, fixed). If 50/10 is the default, is the
  long break 20 min? 30? Scaling off the preset (2× the short break) is the obvious rule, untested.
- **Can a break be taken without a preceding focus block?** Leaning no for v1 — the break exists
  relative to a session.

## Item index

| ID | Item | Stage |
|---|---|---|
| BP-01 | Suppress reminders during focus | 3 ✅ |
| BP-02 | Default 50/10 + custom intervals | 3 ✅ |
| BP-03 | Intention field | 4 ✅ |
| BP-04 | End-of-session close-out | 4 ✅ |
| BP-05 | Remove Quick Notes | 2 ✅ |
| BP-06 | Break mode | 3 ✅ |
| BP-07 | Stats vs self-chosen goal | 6 ✅ |
| BP-08 | Streak rework | 6 ✅ |
| BP-09 | Session history | 6 ✅ |
| BP-10 | Full layout redo | 7 |
| BP-11 | Positioning + hero copy | 5 ✅ |
| BP-12 | *(closed → BP-23)* | — |
| BP-13 | Shorten feedback form | 5 ✅ |
| BP-14 | *(split → 14a / 14b)* | — |
| BP-14a | Mobile smoke test | 1 ✅ |
| BP-14b | Full mobile audit | 6 ✅ |
| BP-15 | Core Web Vitals tracking | 1 ✅ |
| BP-16 | Extension parity | Deferred |
| BP-17 | New-model analytics | 4 ✅ |
| BP-18 | *(closed → removed)* | — |
| BP-19 | `js/session.js` | 2 ✅ |
| BP-20 | Break auto-start asymmetry | 3 ✅ |
| BP-21 | Namespace migration | 2 ✅ |
| BP-22 | Stretch default interval | 1 ✅ |
| BP-23 | Landing page + dashboard route | 5 |
| BP-24 | Remove SEO pages + 301s | 5 |
| BP-25 | Timestamp-based timer | 1 ✅ |
| BP-26 | Instrument shortcuts + CTA | 1 ✅ |
| BP-27 | Settings drawer | 6 ✅ |
| BP-28 | Remove tips | 2 ✅ |

## Designs

- Break mode → [docs/design/break-mode.md](design/break-mode.md)
- Evidence base → [docs/research/focus-science.md](research/focus-science.md)
