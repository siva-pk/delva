# Session — 2026-07-29 — Stage 3: Protect the focus block

**Outcome:** All four Stage 3 items built, tested, **deployed and verified live on deskflo.app**.
Three bugs found and fixed along the way. Stages 1–3 are now complete — the thesis is true in
production.

Written in one pass while shell tooling was unavailable, then tested in a second pass once it
recovered. Worth noting that the gap was useful: two of the three bugs were caught by re-reading the
code with no ability to run it.

---

## Files

**New**
| File | Purpose |
|---|---|
| `js/reminders.js` | Reminder queue + release policy (break-mode.md §3) |
| `js/break.js` | Break screen controller |

**Changed:** `js/timer.js`, `js/stretch.js`, `js/hydration.js`, `js/app.js`, `index.html`,
`css/style.css`, `build.js`, `sw.js`, `pomodoro-timer/index.html`

## What each item does

**BP-01 — suppression + queue.** The stretch countdown and the hydration nudge both keep running
during a focus block; what changed is what happens at zero. If `session.phase()` is `focus` or
`break` they record an intent in `reminders` and say nothing. At the break, `break.js` calls
`reminders.take({long})`, which releases **one** nudge — hydration first only if the user is behind
pace, otherwise stretch. Staleness is implemented structurally: the queue is cleared on every
`focus:start`, so only intents raised in the block you just finished can ever surface.

The browser notifications now go through the same gate. Previously both modules fired them
regardless of phase, which is the worst version of the bug — a notification escapes the tab, so it
interrupted even when deskflo wasn't the focused window.

**BP-20 — auto-start asymmetry.** `onComplete()` now calls `_run()` after a focus block, so the
break starts itself. A completed break does not auto-start the next focus block.

**BP-06 — break mode.** `[data-phase="break"]` on `<html>` dims the grid, header and footer; the
break panel is a translucent overlay so the dashboard stays faintly visible behind it. Content is
exactly three things: a large calm countdown, one suggested action, one quiet exit.

**BP-02 — presets.** Five presets, Deep 50/10 now the default, Custom persisted to
`df_timer_custom` with clamping (1–180 focus, 1–60 break).

## Judgement calls made without asking

- **The stretch modal survives.** `stretch.js` is loaded standalone by `/stretch-reminder/`, which
  has no session module — and an idle user has no boundary to wait for. Gating idle would have made
  a working standalone tool silently stop reminding anyone. This contradicts break-mode.md §7, so
  §12 was added to record it.
- **The break screen doesn't start the guided exercise.** That timer renders in the stretch card,
  behind the overlay at 18% opacity. A button producing invisible feedback is worse than no button;
  the action is "Show another" instead.
- **Long break = 2× the short break, every 4th.** Scales with the preset, which is the property
  that matters.
- **Abandoned breaks complete silently** (§10.2) — no chime or notification for a break that expired
  hours ago.
- **`role="region"`, not `role="dialog"`** on the break panel. A dialog implies dismissable, and
  Escape must not throw away a break.
- **Ambient card stays interactive during a break** at 42% rather than fully dimmed — sound
  continues across the boundary, so silencing its controls would contradict that.

## The three bugs

1. **`aria-live="polite"` wrapped the whole break panel**, countdown included — a screen reader would
   have announced the time every second for the entire break. §8 asks for the phase change to be
   announced, not the clock. Moved to the heading; countdown set to `aria-live="off"`, matching
   `#timer-time`.
2. **Two elements failed WCAG AA.** Eyebrow (12px bold) and exit link (13px) measured **4.18:1** —
   under 4.5:1, and the 3:1 large-text allowance doesn't apply until 24px / 18.7px bold. Added
   `--overlay-text-dim` per theme; everything now measures **≥ 5.48:1** in both.
3. **The nudge button stayed disabled between breaks** — the next break would have opened with a
   spent "Logged ✓" button. Caught by review.

Plus one design miss caught by review: the panel was fully opaque, which made the dimming behind it
pointless. Now translucent via `--overlay`.

## What was verified

| Check | Result |
|---|---|
| Four cycles to a long break | 3:00, 3:00, 3:00, then **6:00 "Long break"** — 2× rule and every-4th cadence exact |
| BP-20 asymmetry | Break auto-starts every time; focus never does, after either a natural end or "Back to work early" |
| Real stretch countdown mid-focus | **No modal, no notification**, intent queued |
| Same countdown while idle | Modal + notification fire, as before |
| Queue rule 1 — one per break | `take()` returns one and empties; second call returns `[]` |
| Queue rule 2 — priority | Hydration first when behind pace; **flips to stretch** when on pace |
| Queue rule 3 — staleness | Cleared on `focus:start`; duplicates collapse; invalid kinds rejected |
| Queue rule 5 — long break | Returns primary + one secondary |
| Escape during break | Does **not** exit |
| Hydration nudge action | Logs a glass, shows "Logged ✓", resets by the next break |
| Custom preset | Clamps 999→180 and 0→1, writes back to the field, persists, and does **not** move a running deadline |
| Contrast, both themes | Min 5.48:1 |
| 375px | Presets wrap to 2 rows at 49px min; break panel fits, no overflow |
| Source + minified | Identical behaviour |
| All 5 landing pages | Working |
| `/stretch-reminder/` with no session module | Modal, notification and guided exercise all still work |
| SW update simulation | New build picked up on first reload, old cache deleted |
| Console errors | Zero |

## Verified live on deskflo.app

| Check | Result |
|---|---|
| Reminder 31 min into a 50-min block | **No modal, no notification**, intent queued, still in focus |
| Boundary | Break auto-started, released that one stretch ("Spinal Twist"), queue emptied |
| Presets | All five present, 50/10 active, 50:00 on the clock |
| `data-phase` | idle → focus → break → idle |
| Dimming | Grid at 0.18 behind a translucent `rgba(241,235,225,0.93)` overlay |
| Escape during break | Does not exit |
| "Back to work early" | → idle, focus **not** auto-started, `break-skip` recorded with nudge + remaining |
| Contrast | ≥ 5.48:1, all elements |
| 375px | Presets wrap to 2 rows at 49px; break panel fits, no overflow |
| `web-vitals` | `cls: 0` present — Stage 1's fix is live too |
| Cache headers | HTML `max-age=0, must-revalidate`; hashed bundle `immutable`; `sw.js` revalidated |
| All 5 landing pages | 200, hashed CSS, working |
| `/stretch-reminder/` | Modal + notification + guided exercise all still work with no session module |
| Console errors | Zero |

**The stale-load prediction held exactly.** The first live load served the old page — the one
transitional load expected when moving off the cache-first worker. A single reload fixed it
permanently, and the new worker's cache now holds the *new* HTML rather than a stale copy.

## Next

Stage 4, BP-03 — the intention field (d = 0.65, largest effect in the brief), shipped together with
BP-17's re-instrumentation so the before/after is recoverable.
