# Decisions Log

Reverse-chronological. Each entry: date, decision, why, and status if still open.
Append new entries at the top. This is the durable memory of *why* things are the way they are —
future Claude Code sessions and future-you should be able to read this instead of re-litigating
settled questions.

---

## 2026-07-30 — Stage 6 complete; BP-14b cleared the accessibility debt

**Decision:** BP-27, BP-07, BP-08, BP-09 and BP-14b all built, tested and **shipped**, each verified
live. Stage 6 is done. Remaining in the plan: BP-23 / BP-24, then BP-10.

**BP-14b's result:** zero WCAG AA contrast failures across 289 distinct text/background combinations
locally and 232 live, in both themes, on the dashboard, settings drawer, session history, feedback
dialog and break mode, plus the five landing pages. Zero WCAG 2.5.8 (24x24) target-size failures.
Zero horizontal overflow at 375px.

**Fixed at the token level**, not call site by call site — `--text-muted` alone had 30 call sites.
`--text-secondary` 4.18 → ~7.0:1, `--text-muted` 2.22 → ~5.2:1, and dark theme's muted was worse
still at ~2.6:1. New families added because the brand hues cannot carry small text:
`--accent-text` / `--sage-text` / `--water-text` for foreground,
`--accent-strong` / `--sage-strong` / `--water-strong` for filled-button backgrounds.

**The most consequential fix was the primary buttons' own labels.** White on `--accent` measured
3.29:1, on `--sage` 3.52:1, on `--water` 2.96:1. A filled button's label sits on the fill, so
white-on-fill is the ratio that matters, and the base hues never cleared it. The most important
button in the product had a sub-AA label for its whole life.

**Two rules worth keeping**

1. **Opacity is not a safe way to dim text.** Six elements used `opacity: 0.5–0.8`, which composites
   the colour back toward the background — so *no amount of darkening the token could have fixed
   them*. Retuning tokens alone would have left them failing while the audit reported success. All
   replaced with real colours at full opacity.
2. **Unrated stars measured 1.34:1** — you could not tell the control was there. WCAG 1.4.11 wants
   3:1 for the visual information that identifies a component, not just for text.

**Four bugs in my own audit, each of which produced a confident wrong answer.** Recording these
because the measurement being wrong is worse than the bug being missed — a green audit is a claim.

| Audit bug | Wrong answer it gave |
|---|---|
| Read the *parent's* background instead of the element's own | White button labels reported at 1.04:1 |
| Ignored cumulative `opacity` | Hid the six opacity failures entirely |
| Then, once opacity was added, counted content *behind* the break overlay | 83 phantom failures |
| Ran before the async stylesheet applied | 84 phantom failures, and a "buttons have lost their fill" scare |

That last one matters beyond the audit: **`index.html` loads the stylesheet with
`rel=preload` + an onload swap, so it applies asynchronously.** Anything measuring computed style has
to wait for `document.styleSheets` to actually contain the rules, or it measures unstyled DOM. Emoji
glyphs (they paint their own colour) and `disabled` controls also have to be excluded.

**Deploy-polling correction, second occurrence.** BP-14b was CSS-only, so the JS bundle hash never
changed and a poll watching `app.<hash>.js` timed out for ten minutes on a deploy that had already
landed. **Poll a content marker in whichever asset actually changed** — or the SW cache name — not a
fixed asset's hash.

**Honest remainder:** 20–32 interactive targets per surface are still under the 44x44 iOS
*guideline*. That is not WCAG AA, and many are inline links and pills where 44px would break the
layout. BP-10 rebuilds this surface and is the right place to revisit it.

---

## 2026-07-30 — Deploy validation was checking the wrong URL

**Found while verifying BP-09 live.** The dashboard reported `Deskflo.history` as undefined even
though the deploy had gone through minutes earlier.

**The cause was the validation method, not the deploy.** Bare `/` was serving the previous bundle
while `/?probe=<random>` served the new one — **both with `cf-cache-status: HIT`**. A query string
makes a different Cloudflare edge cache key, so a random-query URL always fetches a fresh entry from
the origin. Polling that URL therefore reports "deployed" as soon as the *origin* has the new build,
while real visitors on bare `/` are still being served the edge's older copy.

It self-heals — bare `/` caught up within seconds — so this is propagation lag, not a caching bug,
and `max-age=0, must-revalidate` is doing its job. But every deploy check up to this point used a
query-string URL, which means:

1. **"Deployed" was declared early** on each of them.
2. **BP-09's first live validation ran against the old bundle** and produced a false failure.

**The rule, for anything that checks a deploy from now on: poll bare `/`.** Never a URL with a
query string. If a cache-busting fetch is genuinely needed for some other reason, do not also treat
it as evidence that users are seeing the new build.

**Second, smaller gotcha from the same session.** A CSS *transition* cannot be measured in an
undisplayed browser pane, because no frames are composited and the transition never advances — the
break-mode dimming read `opacity: 1` and looked like a regression until the transition was
neutralised, at which point it resolved to the correct `0.18`. Assert end states with transitions
disabled rather than waiting and re-reading.

---

## 2026-07-30 — BP-27 settings drawer: the inclusion rule did most of the work

**Decision:** Built, tested and **shipped** the settings drawer; **verified live on deskflo.app.**
**Applying BP-27's own inclusion rule cut its "likely contents" list roughly in half** — which is the
item working as designed, not falling short.

Live confirmation: four groups, seven controls, contrast 5.48:1 throughout, a goal change driving the
hydration card immediately, reduce-motion setting the document attribute, and the wipe arming without
touching data and disarming on close.

**What shipped:** the three goals that were previously hardcoded (focus blocks/day, glasses/day,
stretches/day), reminders on/off, browser notifications on/off, completion chime, reduce motion, and
export / clear-all. A drawer on desktop, a bottom sheet below 700px.

**What the rule removed, and why each is a better decision than a toggle**

- **Auto-start toggles.** BP-20 settled the asymmetry on evidence — the *pre-committed* bounded
  interval is the active ingredient (§2). A toggle would reopen a question we answered, which is
  exactly the "setting because we couldn't decide" smell the rule names.
- **Default preset.** The last-used preset already persists. That's a better default than a picker
  because it requires no decision from the user at all.
- **Custom timer lengths.** Already inline under the presets, in context. Mirroring them would create
  two sources of truth for one value.
- **Theme and master mute.** Already one click away in the header. A control in two places invites
  the two copies to disagree.
- **Ambient volumes / long-break cadence.** Already per-sound; fixed at 4 respectively.

**The Data section earns its place as positioning.** "Everything stays on this device — export it or
wipe it, anytime" makes the privacy claim tangible rather than asserted. Export writes only
`df_`-prefixed keys; the wipe is two-step, disarms itself after 5 seconds and on drawer close, and
leaves non-`df_` keys alone. Verified end to end, including that the four keys which reappear after
the reload are freshly-zeroed records rather than surviving data.

**Two bugs found by testing**

1. **The backdrop never unhid**, so clicking outside didn't close the drawer and nothing dimmed —
   `open()` only unhid the panel.
2. **Changing a goal didn't re-render the dependent card.** Setting the water goal to 3 left the card
   reading "of 8 glasses today" until some unrelated action re-rendered it. Fixed by adding
   `settings.onChange()` and having hydration.js subscribe.

**A contrast pattern worth naming, because this is now twice.** The drawer shipped its first version
failing WCAG AA: the row hints measured **2.22:1** and the group notes **4.18:1**. Stage 3's break
panel had the identical failure. The cause is the same both times — reaching for `--text-muted` or
`--text-secondary` for small secondary text out of habit.

Measured against `--bg`:

| Token | Ratio | Verdict |
|---|---|---|
| `--text-muted` | 2.22:1 | Fails badly. Decorative only. |
| `--text-secondary` | 4.18:1 | Fails below 24px (18.7px bold) |
| `--overlay-text-dim` | 5.48:1 | Passes |

`--overlay-text-dim` is now documented in style.css as **the** AA-safe dim tone rather than a
break-mode-specific colour. **Open debt:** `--text-muted` is still used for small text elsewhere in
the app (preset tags, clock date, brand tagline, various hints) and those all fail AA. That predates
this work and belongs to BP-14b, but it is a real accessibility problem and should not be discovered
a third time.

---

## 2026-07-29 — Stage 5 half-built: BP-23 blocked on a baseline that doesn't exist

**Decision:** Built and **shipped** BP-11 (positioning copy) and BP-13 (shortened feedback form),
both verified live. **Deliberately did NOT build BP-23 or BP-24**, and recorded them as blocked
rather than pending.

**Testing note worth keeping:** the break-mode dimming appeared to read `opacity: 1` live. It is
correct — with the CSS transition neutralised it resolves to `0.18`. The readings were an artifact of
an undisplayed browser pane not compositing frames, so the 0.6s transition never advanced. Any future
check of a *transitioned* property has to account for that; assert the end state with transitions
disabled rather than waiting and hoping.

**Why BP-23 is blocked.** Its own acceptance test is *"sessions-with-a-completed-focus-block,
absolute, before vs after."* The event that measures that — `session-complete` — did not exist until
BP-17 shipped a few hours earlier the same day. **There is no before-period.** Shipping BP-23 now
would permanently destroy the ability to answer its own question.

That matters more than it would for most items, because BP-23 is the one change in the plan most
likely to make things *worse*: it inserts a click between arrival and the tool, reversing the
product's central differentiator. The plan says the tradeoff "should be measured, not assumed away" —
so shipping it unmeasured would contradict its own instruction. Blocking it is the plan-faithful
reading, not caution for its own sake.

**Unblock condition:** a `session-complete` baseline over a normal stretch of real traffic — 2–4
weeks of collection *and* enough volume to separate signal from noise, i.e. the ~100 users/day
threshold already set for analytics.

**BP-24 is blocked behind it** because BP-23's landing page is the 301 destination for the five
retired pages. The plan is explicit that retiring them without redirects is the one way to make it
actively harmful, so it waits.

**Most of BP-23's value landed anyway, without the risk.** Its case was comprehension — "an
all-in-one dashboard" is not a promise anyone parses in two seconds. BP-11 fixed that in copy on the
surfaces that already exist: title, meta description, OG/Twitter, `h1`, schema.org, and the welcome
overlay, which is the de-facto front door while BP-23 waits. No click inserted, nothing to reverse.
What is still unaddressed is only the SEO/positioning surface, which is not urgent at this traffic.

**BP-13 — what the 65% abandon rate was actually about.** The form did not *require* a category:
`feedback.js` only ever required one of rating / category / message. So the chips were already
optional and still cost a full labelled section, making a quick note look like a survey. Removing
them is a pure reduction in perceived length. `category: null` is still sent so the Worker's payload
shape is unchanged. Chose "single text field plus optional rating" over the "true one-click path" the
item also offered: a star tap that submits immediately is easy to hit by accident and there is no way
to retract it.

**One bug this surfaced:** `resetForm()` hard-coded the button label `'Send Feedback'`, so shortening
the button to "Send" would have been reverted every time the modal was reopened — the new copy would
have appeared only on the very first open per page load.

---

## 2026-07-29 — Stage 4 shipped: the session means something

**Decision:** Built, tested and **deployed** all of Stage 4. **Verified live on deskflo.app** — the
intention field starts a block on Enter, the close-out appears at the break only when an intention
was set, "Still going" carries it forward and "Done" clears it. Every new event fired with the right
payload and the intention text appeared in none of them.

This was also the first deploy with **no transitional stale load** — the network-first service
worker landed Stage 4 on the very first request, which is the caching work from Stage 2 paying off.

**What shipped**

- **BP-03 — the intention field.** New `js/intention.js`, plus `#intention-form` under the timer.
  Gollwitzer & Sheeran 2006 (94 independent tests) put implementation intentions at **d = 0.65** —
  the largest effect in the whole research brief, larger than anything else in the plan.
  **The framing is the mechanism, not decoration:** "This session I'll ___" is a commitment,
  "Task name" is metadata, at identical input cost. Enter submits and starts the block, because
  typing your plan and then hunting for a button is a seam that doesn't need to exist.
- **BP-04 — the close-out.** At the break: the intention echoed back, with *Done* / *Still going*.
  It takes the break screen's single content slot first and hands over to the nudge once answered,
  so the screen still presents one thing at a time.
- **BP-17 — new-model analytics.** `session-start` / `session-complete` / `session-abandon` /
  `break-complete` in `timer.js`; `closeout` in `break.js`. Full schema and the questions each
  event answers are in ANALYTICS.md.

**"Still going" IS the distraction capture.** Choosing it leaves the intention in place for the next
block; "Done" clears it. Masicampo & Baumeister's finding is that an unfinished goal stops intruding
once it feels *handled* — not once it's written down or finished. Carrying the plan forward handles
it. So §4's mechanism lands at **zero new UI**: no capture panel, no note surface, and no partial
reversal of BP-05. This is the "one line inside BP-04's close-out" the plan allowed for, and it
turned out to need no line at all.

**Two design calls**

1. **The close-out appears only when an intention was set.** There is nothing to close otherwise, and
   asking "did you finish what you planned?" of someone who planned nothing is noise. It also makes
   the close-out a small reward for setting an intention rather than a tax on skipping one. Costs
   nothing analytically — completion rate comes from the timer events either way.
2. **`intentionSet` is a boolean, permanently.** The intention text is the most personal thing in the
   app — literally what the user is working on — and the product claims data stays on the device.
   Neither content nor length is ever sent. If some future item wants "what do people work on?",
   the answer is that deskflo cannot ask without breaking its own promise.

**One bug found by testing:** `break-start` reported `nudge: null` whenever a close-out took the slot,
because `_shown` was only set by the nudge renderer — which hadn't run yet. That would have
understated nudge delivery in precisely the sessions where an intention was set, i.e. the ones the
d = 0.65 claim will be judged on. Fixed by setting it at resolve time.

**Also confirmed:** the intention text never appears in any analytics payload; the field is inert to
the Space/R/H/M shortcuts while focused; `/pomodoro-timer/` runs `timer.js` with neither
`intention.js` nor `analytics.js` loaded and the new `_track` / `_hasIntention` guards hold; and the
whole flow works identically in the minified bundle.

**Note on reading this later:** analytics remain parked until ~100 users/day. The number most worth
waiting for is **completion rate split by `intentionSet`** — that is the d = 0.65 claim tested on
real users rather than borrowed from a meta-analysis.

---

## 2026-07-29 — Stage 3 shipped: the focus block is protected

**Decision:** Built, tested, and **deployed** all of Stage 3 ("Protect the focus block").
**Verified live on deskflo.app.** With this, Stages 1–3 are done and the thesis is true in
production — everything remaining in BUILD-PLAN is optional depth.

**The live confirmation that matters:** a stretch reminder fired 31 minutes into a 50-minute focus
block. No modal, **no browser notification**, intent queued, still in focus. At the boundary the
break auto-started and released that one stretch as its nudge. That is the original complaint fixed
end to end in production, not just locally.

Also confirmed live: 50/10 default with all five presets, `data-phase` cycling idle → focus →
break, the dashboard dimming to 0.18 behind a translucent overlay, Escape not exiting, "Back to work
early" landing on a ready (not running) focus block and emitting `break-skip`, contrast ≥ 5.48:1,
375px with presets wrapped to two rows at 49px, all five landing pages including
`/stretch-reminder/` still falling back to its modal with no session module, and zero console
errors anywhere.

**The caching work paid off, and one prediction held exactly.** The first live load served the OLD
page — the transitional stale load predicted when moving off the cache-first worker. One reload
fixed it permanently, and the infrastructure now measures correct in production: HTML at
`max-age=0, must-revalidate`, the hashed bundle at `immutable`, `sw.js` always revalidated, and the
new worker's cache holding the *new* HTML rather than a stale copy. Stage 1's CLS fix is also live —
`web-vitals` now reports `cls: 0` instead of omitting it.

Written and tested in two passes — the code was written while shell tooling was unavailable, so the
whole thing sat unverified for a while before the test pass ran. Three real bugs came out of it, two
found by re-reading the code and one only by measuring.

**What was built**

- **BP-01 — reminder suppression + queue.** New `js/reminders.js` owns the policy from
  break-mode.md §3: at most one nudge per break, hydration prioritised only when the user is
  behind pace, and staleness implemented by clearing the queue on every `focus:start` so only
  intents from the block you just finished can surface. `stretch.js` and `hydration.js` enqueue
  instead of interrupting when `phase` is `focus` or `break`. **Browser notifications go through the
  same gate** — previously both modules fired them regardless of phase, which is worse than a modal
  because it escapes the tab entirely.
- **BP-20 — auto-start asymmetry.** Breaks auto-start; focus blocks still require a deliberate
  press. This is the design, not an inconsistency: §2 identifies the *pre-committed bounded
  interval* as the active ingredient, so a block you did not choose to begin is not a commitment,
  and auto-rolling into work would skip the moment BP-03 is about to make load-bearing.
- **BP-06 — break mode.** New `js/break.js` plus `#break-panel` and `[data-phase="break"]` CSS.
  Overlay-with-dim, translucent so the dashboard stays faintly visible behind it — a break should
  read as "deskflo, paused", not a different screen. Contains **no stats, streaks, charts or tips**,
  which is the design decision rather than an omission (§5: recovery needs soft fascination, and a
  progress panel is more directed attention). Escape does not exit. Skip rate is tracked from the
  first release, because it is the main falsifier for the whole approach.
- **BP-02 — presets.** Five: Classic 25/5, **Deep 50/10 as the new default**, Sprint 15/3,
  Ultradian 90/20, and Custom with persisted durations. 90/20 is offered but its ultradian basis is
  weaker than usually presented; it earns a slot because some people work in long blocks, not
  because 90 is a special number.

**Also landed, not separately itemised**

- **Long breaks:** every 4th, at 2× the short break. Resolves BUILD-PLAN's open question by the
  "obvious but untested" rule. Scaling off the preset is the property that matters — a long break
  after a 90-minute block should not equal one after 15 minutes.
- **Abandoned-break rule (§10.2):** a break that expired more than 2× its length ago completes
  silently. Chiming and notifying about a four-hour-old break is noise.

**Three deviations from the approved design, all deliberate** (recorded in break-mode.md §12)

1. **The stretch modal was NOT deleted**, contrary to §7. `stretch.js` is loaded standalone by
   `/stretch-reminder/`, which has no timer or session module, and an idle user has no boundary to
   wait for. Gating on idle would have turned a working standalone tool into one that silently never
   reminds you. The gate covers `focus` and `break` only.
2. **The break screen does not start the guided exercise.** That timer renders inside the stretch
   card, which break mode dims to 18% and covers — the button would have produced feedback the user
   cannot see. The action is "Show another" instead.
3. **Long-break duration** resolved as above rather than left open.

**Known hole, accepted:** a stretch reminder firing *during* a break is enqueued, but the break
already took its one nudge and the queue clears at the next `focus:start` — so it is dropped. It is
consistent with both "one nudge per break" and "the queue holds intent, not history", and rare in
practice (10-minute break vs 30-minute stretch interval).

**Three bugs found and fixed**

1. **`aria-live="polite"` wrapped the whole break panel** — including the countdown. A screen reader
   would have re-announced the time every second for the entire break. §8 asks for the *phase
   change* to be announced, not the clock. `aria-live` moved to the heading; the countdown is
   explicitly `aria-live="off"`, matching how `#timer-time` already works.
2. **Two break-screen elements failed WCAG AA.** The eyebrow (12px bold) and the exit link (13px)
   measured **4.18:1** on `--text-secondary`, under the 4.5:1 required at those sizes — the 3:1
   large-text allowance doesn't start until 24px, or 18.7px bold. §8 says in as many words that calm
   is not an excuse for poor contrast, so this was a direct violation of the design. Added a
   dedicated `--overlay-text-dim` per theme. Everything on the panel now measures **≥ 5.48:1** in
   both themes.
3. **The nudge button stayed disabled between breaks.** Clicking "Log a glass" disabled it and
   nothing re-enabled it, so the next break would have opened with a spent button reading
   "Logged ✓". Found by re-reading, before any testing.

Also caught by review before testing: the break panel was fully opaque, which made the dimming
behind it pointless. It is now translucent (`--overlay`), so a break reads as "deskflo, paused"
rather than a different screen.

**What was verified:** the full four-cycle run to a long break (3:00 short breaks, 6:00 on the 4th);
breaks auto-starting and focus *not* auto-starting; all five queue rules including priority flipping
in both directions around pace; a real stretch countdown firing mid-focus with **no modal and no
notification**, and the same countdown firing while idle with both; Escape not exiting; custom
preset clamping, persistence, and refusing to move a deadline already running; contrast in both
themes; 375px layout; source *and* minified bundle; all five landing pages; and a service-worker
update simulation. Zero console errors throughout.

**The one that mattered most:** `/stretch-reminder/` loads `stretch.js` with no `session` and no
`reminders` module. Confirmed it still shows its modal, fires its notification and runs the guided
exercise — which is exactly why the modal was kept rather than deleted.

---

## 2026-07-29 — Pre-deploy test pass found a second cache bug

**Found while testing Stage 2 before pushing, not by planned work.**

**1. `immutable` was pointed at unversioned filenames — this would have blocked the deploy.**
`_headers` marked `/app.min.js` and `/style.min.css` as `max-age=31536000, immutable`, with a
comment claiming it was "safe because filenames change on rebuild". They never did. `immutable`
tells the browser never to revalidate, so a returning visitor was pinned to a year-old bundle — and
the service worker could not rescue it, because `cache.addAll()` reads through the HTTP cache and
would have populated its fresh cache with stale bytes. Since `index.html` is only cached an hour,
the real-world result was **new HTML paired with old JS**, and Stage 2 removes two cards the old JS
still initialises.

This is the same class of bug as the hardcoded SW cache name found in Stage 1, one layer down —
both ship silently to new visitors only. Two of these in two stages is a pattern: **any caching
rule that promises immutability has to be checked against what actually changes per build.**

Fixed by fingerprinting: `app.<hash>.js` / `style.<hash>.css`, every reference rewritten by
build.js, `_headers` matching `/app.*.js` and `/style.*.css`. `immutable` is now true rather than
asserted.

**2. Umami tracked `localhost`.** Every local test run put events into production analytics — two
per run. Small, but exactly the wrong kind of small in a dataset this size, and it had been
happening for as long as there has been local testing. The script tag now carries
`data-domains="deskflo.app"` on all seven pages; the tracker still loads and `umami.track()` is
still safe to call, it just no-ops off-domain.

**Process note:** both bugs were in the deploy path, not the feature code, and neither would have
been caught by testing the app's behaviour alone. The full pre-deploy pass — clean build from an
empty `dist/`, source *and* minified bundle, all five landing pages, service-worker update
simulation — is worth repeating before each stage ships.

---

## 2026-07-29 — Analytics parked until ~100 users/day

**Decision:** No analytics read is scheduled, and no build item waits on one, until traffic reaches
roughly **100 users/day** (new + returning). Called by Siva.

**Why:** at ~8 sessions/day the numbers can't separate a real effect from noise. A "signal" at that
volume is a handful of sessions, and treating it as one is worse than ignoring it — it invites
reversing good decisions on a bad reading. Build against the thesis and docs/research/focus-science.md
instead; those are the strongest evidence available at this scale.

**What this does not mean:** the instrumentation stays on and keeps collecting. Stage 1's purpose
was to have data that is *correct when there is finally enough of it* — that purpose is unchanged,
only the reading is deferred. BP-17 (re-instrument for the new model) also stays in Stage 4: it is
cheap, and it has to land *with* the changes it measures or the before/after is unrecoverable.

**Consequence:** BUILD-PLAN's "Reading the results" is now gated on the threshold rather than on a
calendar. The 73% figure remains dead regardless — it was measured with broken instrumentation.

---

## 2026-07-29 — Stage 2 built: the modules can finally talk

**Decision:** Built all of Stage 2 ("Give the modules a shared brain"). **Not deployed yet.**

**What shipped**

- **BP-19 — `js/session.js`.** One module owning the phase (`idle` / `focus` / `break`) with
  `on()` / `emit()` pub/sub. `timer.js` is its sole driver — nothing else writes to it, so there is
  exactly one place the phase can be wrong. **Verified** end to end by driving the real timer with a
  skewed `Date.now()`: idle → focus → break → idle, correct events in order, session counter
  incremented, and pause/resume did *not* re-fire `focus:start`.
- **BP-28 — tips removed.** `js/tips.js`, the 100-tip content, the tip bar DOM and its CSS.
- **BP-05 — Quick Notes removed from the dashboard.** Card, CSS, script tag, precache entry.
- **BP-21 — namespace migration finished.** `timer.js` and `ambient.js` moved onto
  `window.Deskflo.*`; the alias block in `app.js` is deleted. Two of the four modules still on bare
  globals were deleted rather than migrated, exactly as the plan predicted. **Verified** no legacy
  alias survives on `window` (the one remaining `window.Storage` is the native DOM interface).

**Two design calls made during the build**

1. **Phase is not running-state.** A paused focus block is still `focus`; a break the user hasn't
   pressed Start on is already `break`. This matters for BP-01: the queued nudge should be released
   when the user *reaches* the boundary, not when they get round to starting the break clock.
   `completeFocus()` therefore emits `focus:complete` and `break:start` at the same instant — BP-20
   will make that gap disappear anyway by auto-starting breaks.
2. **Phase is not persisted.** A phase restored from localStorage would claim a focus block that
   stopped existing when the tab closed. Reload starts idle.

**The stage was not invisible, contrary to plan.** Removing two cards left a hole in the 2-column
grid. Holding layout: the timer spans full width as the hero, hydration and stretch pair beneath
it, ambient stays full width, and the timer's inner content is capped at 620px and centred so the
Start button doesn't stretch across a monitor. This is a hole-filler, not a redesign — BP-10 still
owns the rebuild.

**`js/notes.js` was NOT deleted — this reverses part of BP-05.** `/online-notepad/` is an indexed
SEO page carrying inbound traffic and it loads that module standalone; deleting it would have
broken a live page with no redirect, which BP-24 explicitly calls out as the one way to make these
removals actively harmful. The module is now out of `index.html`, `JS_FILES` and `sw.js` and
survives only for that page, with a docblock saying so. BP-24 deletes page and module together.

**Two live-page breakages caught before shipping, both caused by BP-21.** `/pomodoro-timer/` called
`Timer.init()` and `/ambient-sounds/` called `Ambient.init()` — both globals the migration removed.
Fixed to `window.Deskflo.*`, and `/pomodoro-timer/` now also loads `session.js` (without it,
pressing Start would have thrown). A third, quieter one: the clean build would have crashed copying
the deleted `js/notes.js`, and only passed initially because a stale `dist/` made the copy a no-op.
**All five landing pages re-verified against the built output.**

`js/landing-bridge.js` is down from five aliases to one (`window.Storage`, for notes.js).

**Debt this created:** tips are gone from the web app but `extension/js/tips.js` still ships, so
the extension's New Tab keeps a feature the product no longer has — including the "share deskflo"
tip injected every 10th rotation. Folded into BP-16.

---

## 2026-07-29 — Stage 1 built: the numbers are now trustworthy

**Decision:** Built all of Stage 1 ("Trust the numbers") from docs/BUILD-PLAN.md. Nothing
user-visible. **Not deployed yet** — and it is worth nothing until it is, because the entire point
is to start collecting data that isn't wrong.

**What shipped**

- **BP-26 — instrumentation.** New `js/analytics.js` wraps Umami so non-DOM code can report. The
  four keyboard shortcuts now fire the same event names as their buttons, tagged
  `source: keyboard`; the buttons gained `data-umami-event-source="button"` so both halves are
  comparable instead of one being an unlabelled remainder. `welcome.js` went from zero events to
  `welcome-show` / `welcome-dismiss` (with `method`: cta / backdrop / escape), which finally makes
  the never-executable "validate welcome screen impact" item answerable before BP-23 retires the
  overlay. It also now uses `Deskflo.storage` instead of raw `localStorage`, restoring the
  private-browsing fallback. Backwards compatible: the old raw `"true"` JSON-parses to boolean
  `true`, so existing users aren't re-welcomed.
- **BP-25 — timestamp clock.** `timer.js` and `stretch.js` derive remaining time from a target
  timestamp instead of decrementing per tick, and re-sync on `visibilitychange`. **Verified:** with
  wall-clock advanced two minutes while ticks were throttled, the display jumped the full two
  minutes; the old code showed one second.
- **BP-22 — stretch default** 45m → 30m, matching the docblock, the DOM's `active` button, and the
  usage data (23 uses vs 11).
- **BP-15 — Core Web Vitals.** New `js/vitals.js`, native `PerformanceObserver`, no dependency
  (~90 lines vs a library that would outweigh what it measures). Reports once on
  visibilitychange→hidden.
- **BP-14a — mobile smoke test.** No showstoppers: zero horizontal overflow at 375px. One real
  failure found and fixed — the hydration Reset button had a 26×15px hit area, below WCAG 2.5.8's
  24×24 minimum. Fixed with padding plus negative margin, so the target grew without moving
  anything. 21 other controls sit under the 44px iOS guideline but clear 24×24; deferred to BP-14b
  rather than smuggled into a smoke test.

**Two bugs found while working, neither previously known:**

1. **The service worker made shipping impossible.** `sw.js` is cache-first with no expiry, and
   `build.js` hardcoded `CACHE_VERSION = 'deskflo-v2'`. A browser only re-installs a service worker
   when the sw.js *bytes* change, so every build emitted an identical file → no re-install → no
   re-precache → **returning visitors would have kept the old `app.min.js` indefinitely.** Stage 1
   would have reached new visitors only, i.e. precisely not the engaged users whose behaviour it
   exists to measure. Fixed: the cache name is now a hash of the built output. Verified a real code
   change produces a new hash, a revert restores the old one, and a comment-only change produces no
   cache churn.
2. **`index.html` loaded a `js/weather.js` that doesn't exist** — a 404 on every page load, and not
   in the build manifest either. Removed.

**Deliberately not done:**
- **The extension was left alone.** `extension/js/` is a full fork, not a shared build, so the
  timer fix did not propagate — its clock is still wrong. The diff is mechanical but untestable
  without loading the unpacked extension, and shipping an unverified fix to a store-reviewed
  artifact is worse than a tracked divergence. Logged under BP-16.

**Deployed and verified live on deskflo.app the same day.** Confirmed in production: the timer
absorbs a simulated 3-minute background stall exactly; all four keyboard shortcuts fire with
`source: keyboard`; the stretch default is 30m; the target-size fix is applied; the service worker
is running under a hashed cache name (`deskflo-3445cd2f`) with zero failed requests, so the
`weather.js` 404 is gone.

**Live testing found one bug in the new code, fixed same day.** The `web-vitals` event arrived
carrying `lcp` / `fcp` / `ttfb` but no `cls` — the page had zero layout shifts, so the observer
never fired and the value stayed null. A page with no layout shift is the *good* outcome and the
common one here, so omitting it reproduced the exact "null in every export" problem this work
existed to fix, just with a different cause. `cls` now starts at a measured 0 whenever the observer
installs. `inp` deliberately keeps the old behaviour: no interaction means no data, and reporting
0 ms would claim an instant response that never happened.

**Status:** Shipped. Stage 2 (BP-19 `session.js`) is unblocked. Let the data collect for a week or
two first — the re-baseline it produces is the input to every later judgement, and the bounce
number will improve immediately without anything having actually improved. That is the
instrumentation being repaired, not the product.

---

## 2026-07-29 — Timer-first revamp: direction set, plan sequenced

**Decision:** The revamp direction is settled. deskflo stops being an all-in-one bundle and
becomes a focus timer with a break layer, under one thesis:

> The timer owns the session. Hydration, stretch and ambient sound are **break-layer** features
> that exist *because* the timer knows where your boundary is.

The product drops from six features to four: Focus Timer (hero) + hydration, stretch, ambient.
**Tips and Quick Notes are cut entirely.**

**Why:** Starting question was whether to abandon the all-in-one concept — the trigger being the
73% zero-action bounce rate plus the observation that hydration/stretch reminders interrupt the
focus timer they're meant to sit alongside. That interruption critique turned out to be correct
and well-supported (see docs/research/focus-science.md §1: interruptions mid-task vs at a task
boundary cost 3–27% more time and *twice* the errors; attention residue is worst when the
interrupted task was time-pressured and unfinished — the literal definition of a running
Pomodoro).

But the research pointed somewhere better than a pivot: the break boundary is a *privileged*
moment to deliver a nudge, and deskflo is the only tool that both runs the timer and owns the
reminders — so it's structurally the only one that can nudge at the right time. That converts
"all-in-one" from a bundle into a mechanism, keeps hydration (the strongest retention signal in
the analytics), and stakes out ground no competitor occupies — none of them design the break.

**Key sub-decisions:**
- **Cut tips** — 232 events look strong but only 10% of sessions touched them; read as novelty,
  not habit. Unfalsifiable with current instrumentation, cheap to reverse (static content).
- **Cut Quick Notes** — weakest feature, crowded category. The §4 distraction-capture *mechanism*
  survives only as one field in the end-of-session close-out, not as a panel.
- **Landing page at `/`, dashboard moves to its own route.** Welcome overlay is retired with it.
- **Remove the 5 SEO landing pages** (with 301s) — reverses the 2026-04 decision below.
- **Settings drawer, not page** — with an inclusion rule so it can't become a dumping ground.
- **Break mode** designed in full: dimmed overlay, no stats/charts/tips on it, breaks auto-start
  while focus blocks do not.

**Reversals of earlier logged decisions:**
1. **SEO landing pages stay live** (2026-04, below) → **removed.** They're standalone tools that
   contradict the timer-owns-the-session model, for ~124 pageviews of return.
2. **"Streaks are core to retention, Duolingo-style"** (Foundational, below) → **qualified.** The
   overjustification literature says streaks bolted onto behaviour someone already wants can shift
   motivation from internal to external. Not dropped — made forgiving, goal-relative, never
   leaderboarded.
3. **Visual refresh should stay separate from layout work** (2026-04, below) → **folded in.** That
   was right when the layout change meant "demote some cards"; since it's now a ground-up rebuild,
   building in the old visual language and redoing it later is pure waste.

**Bugs found during the code read (not previously known):**
- **Timer loses time in background tabs.** `timer.js` decrements per `setInterval` tick, which
  Chrome throttles heavily in hidden tabs — so the timer is most wrong exactly when it's being
  used correctly. Needs to be timestamp-based.
- **The 73% bounce figure is inflated.** Every tracked event is a `data-umami-event` on a button,
  but the keyboard shortcuts call module functions directly (`app.js:129-157`) and fire nothing.
  `welcome.js` has no instrumentation at all — meaning the welcome screen's impact was never
  measurable. Re-baseline after fixing.
- **Modules are mutually blind.** No event bus; `stretch.js` cannot ask what the timer is doing.
  This is the architectural root of the interruption conflict, not a missing conditional.

**Status:** Planned, sequenced, not started. 28 items across 7 named stages in docs/BUILD-PLAN.md
(~31–40 sessions, a multi-quarter commitment at 5–10 hrs/week). Stages 1–3 are the minimum that
makes the thesis true; everything after is optional. **Nothing has been built yet.**

**Housekeeping (same day):** ROADMAP.md was retired and folded into BUILD-PLAN.md. Two overlapping
plan files was the actual source of confusion, and numeric "Phase 0–6" labels communicated nothing
about what each block of work does — stages are now named for their outcome, with per-item
"do this / where / done when" lines. Old numbers map `Phase N` → `Stage N+1`.

---

## 2026-04-16 — Revamp kickoff + docs system established

**Decision:** Project had gone idle with thin traction. Rather than guessing at a revamp,
pulled real Umami analytics (see docs/ANALYTICS.md) and decided to let usage data — not
instinct — drive the next round of feature work. Also moved all project context/decisions
into this repo (CLAUDE.md + docs/) so Claude Code has persistent memory across sessions instead
of relying on chat history that doesn't carry over.

**Why:** 5 weeks live, no systematic review had happened. Chat-based planning was getting lost
between sessions.

**Status:** Open — revamp priorities to be finalized in docs/ROADMAP.md.
*(ROADMAP.md was retired 2026-07-29 and folded into docs/BUILD-PLAN.md.)*

---

## 2026-04 — Distribution: community over SEO (ratio, not replacement)

**Decision:** Shift effort to ~70% community / 30% SEO for the next 3 months, based on both
a fellow builder's feedback and the analytics confirming Reddit traffic outperforms Google
traffic ~10x on engagement. SEO landing pages stay live (cost nothing to maintain) but no
further SEO build-out until organic volume justifies it.

**Why:** At near-zero users, SEO's 3-6 month compounding timeline is too slow. Community
(Reddit, X/Twitter, Indie Hackers) can bring engaged users immediately. Long-tail SEO keywords
(e.g. "desk stretch reminder for office workers") are still worth owning since giants like
Pomofocus don't target them — but generic head terms ("pomodoro timer") are not winnable
against 4M+ visit incumbents.

**Rejected alternative:** Abandoning SEO entirely, as one builder suggested — rejected because
long-tail SEO is low-cost, low-competition, and compounds even while community is the primary
channel.

---

## 2026-04 — Weekly rhythm for solo builder bandwidth

**Decision:** Daily 30 min community presence (X + one Reddit community, 3-5 genuine replies,
no self-promo links). Twice-weekly 1hr: fix top user feedback item, ship, post about it.
Weekly 30 min: review Search Console/Umami, observe only. Biweekly: one larger community post.

**Why:** Solo builder, 5-10 hrs/week budget. Flywheel = user feedback → fix → ship → post →
new users → more feedback. Confirmed as the right instinct — user was already doing this
(fixing only user-reported feedback, not speculative features) before it was formalized.

---

## 2026-04 — Welcome screen replaces simple banner idea

**Decision:** Built a one-time full welcome overlay (not a dismissable banner) shown on first
visit only, gated by localStorage `df_welcomed`. Includes: problem statement ("5 tabs open
just to stay functional"), full feature grid, a "hidden superpowers" section (streaks,
keyboard shortcuts, sound layering, privacy — things users would never discover on their own),
and a warm feedback invitation. Dismisses via CTA button, backdrop click, or Escape — no X/skip
button (felt too ad-like).

**Why:** Analytics showed 73% zero-action bounce rate. Original plan was a slim dismissable
banner + empty-state nudges, but that undersells the product's depth. A proper welcome moment
that explains the "why" and surfaces hidden features was judged more likely to convert
first-time visitors into users.

**Status:** Implemented, prompt handed to Claude Code. Impact not yet validated against
analytics — check bounce rate in next snapshot.

---

## 2026-04 — Design system reference explored, not adopted wholesale

**Decision:** Reviewed an AI-generated "Digital Sanctuary" design system (Plus Jakarta Sans,
tonal-layering surfaces with no borders, 2rem+ radii, slate-teal primary #46636d) built for a
much larger hypothetical SaaS product (sidebar nav, accounts, insights dashboards, community
features). Decided to steal the *visual principles* — no-border tonal surfaces, bolder radii,
generous spacing, Plus Jakarta Sans typography, calmer color palette — and apply them to the
existing single-page dashboard layout. Explicitly rejected the sidebar navigation, multi-page
structure, and account system as premature for the current feature set.

**Why:** The visual language is a genuine upgrade (a preview mock was generated and approved
directionally), but current deskflo's speed/simplicity/no-signup positioning would be
undermined by copying a multi-page SaaS structure built for a different, larger product.

**Status:** Preview approved directionally. Full v2 visual conversion not yet scheduled —
revisit priority in ROADMAP.md. *(Superseded 2026-07-29: the visual conversion is now folded into
BP-10, the Stage 7 layout redo in docs/BUILD-PLAN.md. ROADMAP.md was retired.)*

---

## 2026-04 — SEO landing pages: tool-first layout

**Decision:** Built 5 standalone landing pages (/pomodoro-timer/, /ambient-sounds/,
/stretch-reminder/, /hydration-tracker/, /online-notepad/), each with a persistent
non-intrusive "bridge bar" back to the main dashboard, and later corrected so the working
tool appears ABOVE the SEO text (not below) — matching how Pomofocus and similar sites lead
with the tool the user searched for, with explanatory copy below the fold for Google.

**Why:** Single-page dashboard was competing for generic "productivity tools" keywords with no
chance of ranking. Individual pages targeting specific long-tail search intent both rank
independently and preserve the "everything in one tab" dashboard as the core product via the
bridge bar.

**Status:** Live, indexed. See ANALYTICS.md for current traffic — low volume so far,
not a current investment priority (see community-over-SEO decision above).

---

## 2026-03/04 — Chrome extension: New Tab overwhelm + timer sync fix

**Decision:** Initial extension implementation overrode New Tab with the full dashboard,
causing (a) an overwhelming experience opening 20-50x/day and (b) multiple timer instances
running out of sync across tabs. Reworked to: New Tab shows a minimal glanceable view (clock,
date, one rotating tip, today's stats, "Open Dashboard" button); clicking it (or the toolbar
icon) opens/focuses a single pinned dashboard tab. Background service worker + chrome.alarms
handle stretch/hydration reminders reliably regardless of which tab is focused. Dashboard
claims an "active_dashboard" lock in storage so only one instance runs timers.

**Why:** New Tab is high-frequency, low-intensity real estate (see Momentum extension as
reference) — a full dashboard there is too much. Multiple tab instances writing timer state
independently caused desync.

**Status:** Implemented.

---

## 2026-03/04 — Chrome extension analytics gap

**Decision:** Umami doesn't work inside the extension due to Content Security Policy
restrictions on external network calls. Built a lightweight internal event tracker
(DeskFlo.analytics) that logs events to chrome.storage.local, with a stubbed (not yet active)
beacon function to forward events to an external endpoint later.

**Why:** Needed usage visibility in the extension without violating CSP or adding a heavy
dependency. Local-first tracking is consistent with the product's privacy stance.

**Status:** Implemented, beacon not yet activated. Extension analytics NOT currently merged
with website Umami data in ANALYTICS.md — future work.

---

## 2026-03 — Non-invasive extension → website linking

**Decision:** Added subtle links back to deskflo.app from within the extension: clickable
brand signature in New Tab footer, "or use on the web →" secondary link, dashboard footer link,
a periodic "share" tip inserted every 10th tip rotation, and a small footer line in the stretch
popup. All styled identically to surrounding muted text — no banners, popups, or "rate us"
prompts. Each touchpoint tagged with its own analytics event so under-performing ones can be
cut.

**Why:** Wanted a distribution bridge between extension and website without compromising the
calm, ad-free feel that's core to the product's identity.

**Status:** Implemented.

---

## 2026-03 — Chrome Web Store listing: permissions and data disclosure

**Decision:** Requested only `storage`, `notifications`, `alarms`, and `tabs` permissions —
each with a written justification tying it directly to a specific user-facing feature (reminder
delivery, single-dashboard-instance enforcement). Declared "User activity" as the only
collected data category (internal anonymous event tracking), explicitly denying PII, health,
financial, location, and browsing history collection. No remote code — Google Fonts CSS is a
stylesheet, not executable code, so doesn't count.

**Why:** Chrome Web Store rejects extensions that request unjustified permissions or misstate
data collection. Minimal permissions also build user trust and speed up review.

**Status:** Submitted for review.

---

## 2026-03 — Bug fixes and zero-state UX pass

**Decision:** Fixed a batch of launch-blocking issues: hydration "✓ GOAL" badge showing at 0
glasses, stretch popup visible in DOM before trigger, "Loading tip..."/"--:--" placeholder
flashes on load, stretch pause/resume added, proactive browser notifications wired up
(permission requested only on first user-initiated Start click, never on page load), and
zero-state copy changed from cold counts ("0 sessions") to inviting prompts ("Ready to
focus?").

**Why:** QA pass before launch surfaced these as both bugs and UX gaps that would undermine
first impressions.

**Status:** Implemented.

---

## Earlier — Foundational product decisions (see project transcript for full detail)

- **Killed weather widget** — violated "no permissions on load" principle and added latency;
  OS-level weather already covers this need.
- **Tips shuffled via Fisher-Yates at load, no visible counter** — builds curiosity rather than
  showing "tip 4/100."
- **No localization for MVP** — 100 tips are culturally nuanced; translation deferred.
- **Streaks are core to retention** (Duolingo-style), hidden entirely when count = 0 rather
  than showing "0 day streak."
- **Ambient sounds are the "keep the tab open all day" layer** — key retention feature,
  synthesized via Web Audio API (zero external audio files, instant load).
- **Monetization phased:** Free → tasteful ads at 1K DAU → Premium ($3-5/mo) at 5K DAU →
  Affiliate. Never paywall core tools — paywall the data/sync layer only, once accounts exist.
- **Storage abstraction (js/store.js)** built from the start of the extension work so
  chrome.storage.local can later be swapped for API-backed sync (accounts, cross-device)
  without touching UI code.
- **Naming:** "deskflow" was taken, became "deskflo". Domain: deskflo.app.
