# Design — Break Mode

**Status: SHIPPED in Stage 3 (2026-07-29) and verified live on deskflo.app.**
Three deliberate deviations from this document, recorded in §12.

Testing found two §8 accessibility violations in the first implementation: `aria-live` on the whole
panel would have announced the countdown every second, and two dim-text elements measured 4.18:1
against a 4.5:1 requirement. Both fixed — the panel now measures ≥ 5.48:1 throughout, in both themes.

Covers BP-01 (reminder suppression) and BP-06 (break as a distinct mode) from
[docs/BUILD-PLAN.md](../BUILD-PLAN.md). Evidence references (§N) point to
[docs/research/focus-science.md](../research/focus-science.md).

---

## 1. What the code actually does today

Worth stating precisely, because the conflict is architectural, not a missing `if`.

[`js/stretch.js:234-254`](../../js/stretch.js) runs `_startCountdown()` as a completely
independent `setInterval`. When it hits zero it fires a browser notification **and** opens a modal
(`_openModal()`), unconditionally, then immediately restarts its own countdown. It has no reference
to the timer and no way to ask what the timer is doing.

[`js/timer.js:152-171`](../../js/timer.js) `onComplete()` flips `state.isWork`, resets `timeLeft`,
and renders — but sets `state.running = false`, so **the break never auto-starts.** The user has to
press Start again to begin their break.

[`js/app.js:169-185`](../../js/app.js) boots each module in sequence. There is no event bus, no
shared session state, and no way for one module to observe another. `app.js:27-31` maintains a
namespace bridge because the codebase is mid-migration — `storage`, `streaks`, `audio`,
`hydration`, `stretch` live on `window.Deskflo.*` while `timer`, `notes`, `tips`, `ambient` still
use old globals.

**So: modules are mutually blind by design.** Stretch *cannot* know a focus block is running. That
is the root cause, and no amount of patching stretch.js fixes it properly.

---

## 2. The prerequisite — `js/session.js`

Break mode, reminder suppression, the end-of-session close-out (BP-04) and distraction capture
(BP-05) all need the same missing thing: **one module that owns the phase and lets others
subscribe.** Build it once.

```
IDLE ──start──▶ FOCUS ──complete──▶ BREAK ──complete──▶ IDLE
                  │                    │
                  └──── skip/reset ────┘
```

`window.Deskflo.session` exposes:
- `phase()` → `'idle' | 'focus' | 'break'`
- `on(event, fn)` / `emit(event, payload)` — minimal pub/sub, no dependency
- Events: `focus:start`, `focus:complete`, `break:start`, `break:complete`, `phase:change`

Roughly 60 lines. Every subsequent item gets cheaper once it exists. Follow the
`window.Deskflo.*` convention (storage.js is the model), not the old globals.

Consumers change like this:
- `stretch.js` — countdown still ticks, but on fire it calls `session.phase()`. If `'focus'`,
  enqueue instead of popping the modal.
- `timer.js` — `onComplete()` emits instead of only re-rendering.
- New `break.js` — owns the break screen, subscribes to `break:start`.

---

## 3. Reminder queue policy

Suppression alone isn't a design — a 50-minute block can accumulate two stretch reminders and
several hydration nudges. Releasing all of them at the boundary just relocates the interruption.

**Rules:**
1. **At most one nudge per break.** Never stack.
2. **Priority when both are queued:** hydration if the user is behind their daily pace, otherwise
   stretch. Hydration is the cheaper action and the stickier behaviour (392 logs / 38 sessions).
3. **Drop stale items.** A stretch reminder queued two blocks ago is discarded, not shown. The
   queue holds intent, not history.
4. **Browser notifications follow the same gate** — currently `stretch.js:184-194` fires one
   regardless of state, which is worse than the modal because it escapes the tab.
5. **Long break (every 4th) may show one nudge plus one optional secondary.** §5 supports longer,
   richer recovery periods.

---

## 4. Break screen — layout and content

A **full takeover of the dashboard area**, not a modal. Modals are dismissable interruptions; the
break is where the user is supposed to be. Triggered by `data-phase="break"` on
`document.documentElement`, mirroring the existing `data-theme` pattern (`app.js:64-72`).

**Visual treatment**
- Dim the surrounding UI substantially; the break panel is the only lit element.
- Reuse the existing `.break-mode` ring class (`timer.js:93-98`) — colour language already exists.
- Large, soft countdown. Low contrast, no urgency styling. This is not a deadline.
- Ambient sound continues uninterrupted across the boundary — it's the one support feature that
  doesn't demand attention, and it's the "keep the tab open" retention layer.

**Content hierarchy (in order)**
1. Time remaining — large, calm.
2. **One** suggested physical action — the queued nudge, or a default "look away from the screen"
   if the queue is empty.
3. Distractions captured during the session (BP-05), if any. Read-only here — the point is that
   they were safely parked, not that you action them now.
4. A single quiet exit: "Back to work early".

**Deliberately absent — this is the design decision, not an oversight**
- No stats, session counts, streaks, charts, or heatmaps.
- No tips.
- No feedback prompt.
- No hydration *chart*, only the single action if queued.

§5 is explicit: recovery from directed-attention fatigue needs *soft fascination* and reduced
top-down control. A "review your progress" panel on the break screen is more directed attention —
it actively works against the thing the break exists to do. Every competitor puts stats here
(§8); that's the mistake worth not copying.

---

## 5. Auto-start asymmetry

**Breaks auto-start. Focus blocks do not.**

Today neither does (`timer.js:155`). The asymmetry is deliberate:

- **Break auto-starts** because the user is meant to physically leave. Requiring a click to start
  your break means the break doesn't start until you come back — which is exactly backwards, and
  is probably suppressing break usage right now.
- **Focus does not auto-start** because §2 identifies the *pre-committed bounded interval* as the
  active ingredient. A focus block you didn't choose to begin isn't a commitment. Auto-rolling into
  work also strips the moment where the intention gets set (BP-03).

Consequence: after a break completes, land on a ready-to-start focus state with the intention
field focused — not a running timer.

---

## 6. Hydration placement — resolving Build Plan open question #3

The tension: §5 says hydration belongs in the break; the analytics say it's the one behaviour
that's actually working and shouldn't be gated behind anything.

**Resolution — separate logging from prompting.**
- **Logging stays always available.** The `H` shortcut (`app.js:145-148`) keeps working in every
  phase, including mid-focus, and a minimal always-visible control remains. Logging a glass is a
  two-second self-initiated act, not an interruption — §1 is about *involuntary* interruptions.
- **Prompting happens only at breaks.** deskflo never initiates a hydration nudge during focus.

This keeps the sticky behaviour unsuppressed and removes only the interrupting half.

---

## 7. What this removes

`#stretch-modal` and its handlers (`stretch.js:256-275`, `413-440`) become dead once the break
screen owns stretch presentation. That is a net simplification: one popup path deleted, one mode
added.

Possible secondary benefit — the stretch-shuffle spike (57 events / 7 sessions) may partly be
users rejecting a *randomly* chosen stretch under time pressure (`_randomIdx()`, `stretch.js:141-146`).
In break mode there's no pressure and one clear "different" affordance. Worth measuring rather
than assuming; it does not on its own resolve the shuffle item.

---

## 8. Accessibility

- Phase change announced via `aria-live="polite"`. Do not steal focus mid-typing.
- **Escape must not exit break mode** — it's a phase, not a dialog. Escape currently closes the
  stretch modal (`stretch.js:436-440`); that handler goes away with the modal.
- Dimming must survive `prefers-reduced-motion` — fade transitions become instant, not absent.
- The break panel needs a real heading and logical tab order; "Back to work early" must be
  keyboard reachable.
- Dimmed text still has to clear WCAG AA. Calm is not an excuse for 2.5:1 contrast.

---

## 9. Files touched

| File | Change |
|---|---|
| `js/session.js` | **New.** Phase state + pub/sub. |
| `js/break.js` | **New.** Break screen controller. |
| `js/timer.js` | Emit lifecycle events; auto-start break; default preset → Deep (§2). |
| `js/stretch.js` | Gate countdown fire on phase; enqueue; delete modal path. |
| `js/hydration.js` | Gate *prompts* only; logging unchanged. |
| `js/app.js` | Init `session` first; init `break`; namespace bridge for new modules. |
| `index.html` | Break panel markup; script tags. |
| `css/style.css` | `[data-phase="break"]` treatment. |
| Extension SW | Mirror the gate (BP-16) — otherwise alarms contradict the web behaviour. |

---

## 10. Resolved questions (2026-07-29)

1. **Replace or overlay?** → **Overlay with dim for v1.** Far less invasive to `index.html`, and
   reversible if it doesn't land.

2. **Tab hidden during a break?** → Decided as follows.
   This depends on BP-25 (timestamp-based timing) being fixed first — with the current
   tick-decrement approach a hidden tab simply loses time, so there is no correct behaviour to
   implement until the clock is trustworthy.

   Once remaining time is computed from a target timestamp:
   - The break continues in real time regardless of visibility. Wall-clock is the truth.
   - On `visibilitychange` back to visible, recompute and re-render immediately.
   - **If the break expired while hidden, do not snap straight into a running focus block.**
     Advance to the idle ready-state with a brief acknowledgement ("Break's over — ready when you
     are") and the intention field focused. This preserves the §5 asymmetry: work requires a
     deliberate start, and a user returning to the tab has *just* context-switched, which is the
     worst moment to be dropped into a running timer.
   - If the break expired a long time ago (say >2× its length), treat the cycle as abandoned and
     return to plain idle without the acknowledgement — resuming a 4-hour-old break is noise.

3. **Skip-break tracking** → **Yes, track it.** A high skip rate is the clearest single signal
   that the break design is wrong, and it's the main falsifier for this whole design. Fold into
   BP-17/BP-26 instrumentation.

4. ~~**Does break mode apply on the SEO landing pages?**~~ **Not applicable** — the 5 landing
   pages are being removed (BP-24).

5. **Long-break cadence** → **Every 4th break is long; fixed, not configurable, for v1.**
   Longer breaks produce meaningfully better recovery (§5 meta-regression), and a short break
   every time under-serves that. Four is the Pomodoro convention and nothing in the research
   contradicts it — but nothing in the research *specifies* it either, so it's a convention
   choice, not an evidence-backed one. Keeping it fixed avoids adding a setting to defend before
   there's any signal that people want to change it. Revisit if users ask.

## 12. Deviations made while implementing (2026-07-29)

Three things this document specified were changed at build time. Each is a
deliberate call, not an oversight.

**1. The stretch modal was NOT deleted (§7).** This document assumed break mode
would own all stretch presentation. Two problems with that:

- `js/stretch.js` is loaded standalone by `/stretch-reminder/`, which has no
  timer, no session and no break screen. Suppressing there would turn a working
  standalone tool into one that silently never reminds you.
- A user with no timer running has no boundary to wait for. Suppressing while
  `phase === 'idle'` would mean reminders simply never arrive for anyone not
  using the timer.

So the gate is on `'focus'` and `'break'` only. Idle keeps the modal, and
stretch.js tolerates a missing `session` / `reminders` entirely. §7's "net
simplification" does not happen yet; BP-24 removes the landing page, at which
point deleting the modal becomes a smaller decision.

**2. The break screen does not start the guided exercise (§4.2).** The exercise
timer renders inside the stretch card, which break mode dims to 18% and covers
with the overlay. A "Start 30s" button there would produce feedback the user
cannot see. The break screen's stretch action is **"Show another"** instead; the
guided timer stays on the card for the idle path. A self-contained break screen
is the point, and reaching into a dimmed card from it is not.

**3. Long-break duration resolved as 2x the short break** (§11's first open
question). It scales with the preset, which is the property that matters — a long
break after a 90-minute block should not be the same length as one after 15
minutes. Untested, as flagged.

**One known small hole.** A stretch reminder that fires *during* a break is
enqueued, but the break screen has already taken its one nudge, and the queue is
cleared at the next `focus:start`. So that intent is silently dropped. It is
consistent with "at most one nudge per break" and "the queue holds intent, not
history", and it is rare in practice (a 10-minute break versus a 30-minute
stretch interval). Worth revisiting only if it turns out to matter.

## 11. Still open

- Long-break *duration*. If 50/10 is the default, is the long break 20 min? 30? Scaling it off
  the preset (2× the short break) is the obvious rule but untested.
- Whether the break overlay should be reachable deliberately — i.e. can a user take a break
  without having run a focus block? Leaning no for v1: the break exists relative to a session.
