# Session — 2026-07-29 — Stage 2: Give the modules a shared brain

**Outcome:** All four Stage 2 items built. Three latent breakages found and fixed. Verified against
both source and the minified build. Not deployed.

---

## Files

**New**
| File | Purpose |
|---|---|
| `js/session.js` | Phase state (`idle` / `focus` / `break`) + pub/sub. ~120 lines with the reasoning in it. |

**Deleted:** `js/tips.js`
**Changed:** `js/timer.js`, `js/ambient.js`, `js/app.js`, `js/notes.js`, `js/landing-bridge.js`,
`js/storage.js`, `index.html`, `css/style.css`, `build.js`, `sw.js`, `README.md`,
`pomodoro-timer/index.html`, `ambient-sounds/index.html`

## What was verified, and how

Umami runs on `localhost`, so `umami.track` was stubbed before anything was clicked. Tested twice:
once against source on :8123, once against the minified `dist/` bundle on :8124 — mangling and
concatenation order are exactly the kind of thing that only breaks in the build.

| Check | Result |
|---|---|
| Full session cycle via the real timer (skewed `Date.now()`) | idle → focus → break → idle; events in order; counter incremented |
| Pause / resume mid-focus | Phase stays `focus`, `focus:start` does **not** re-fire |
| `reset()` while idle | No-op, emits nothing |
| Unsubscribe returned by `on()` | Listener detached, later transitions silent |
| Legacy globals on `window` | None (`window.Storage` is the native DOM interface, not our alias) |
| Keyboard shortcuts after migration | All four still fire with `source: keyboard` |
| Minified bundle | All 9 `Deskflo.*` modules survive; full cycle works |
| Layout 1280px | Timer 1222px full width, content capped 620px centred; hydration + stretch paired; no empty cell |
| Layout 375px | Single column, zero horizontal overflow |
| Console errors / failed requests | Zero, on every page |
| All 5 SEO landing pages, against `dist/` | Working |

## The three breakages

All three were caused by BP-21, and none were predicted by the plan.

1. **`/pomodoro-timer/` and `/ambient-sounds/` called `Timer.init()` / `Ambient.init()`** — globals
   the migration removed. Both are live indexed pages. Fixed to `window.Deskflo.*`.
   `/pomodoro-timer/` also needed `session.js` added: `timer.js` now calls into it on Start, so
   without it the button would have thrown.

2. **`/online-notepad/` loads `js/notes.js` standalone.** BP-05 said delete the module outright.
   Doing so would have killed an indexed page carrying inbound traffic with no redirect — the exact
   failure BP-24 warns about. Module restored, removed from the dashboard bundle, docblocked as
   landing-page-only. BP-24 deletes both together.

3. **The clean build would have crashed.** `build.js` copies `js/notes.js` for the landing pages
   but skips files already present in `dist/`. The first build after the deletion passed only
   because a stale `dist/` made it a no-op. Caught by `rm -rf dist && npm run build`.

The pattern is worth remembering: **`js/` is shared with the SEO landing pages, not private to the
dashboard.** Any module deletion or export rename has to be checked against all five.

## Judgement calls made without asking

- **Timer spans full width.** Removing two cards left an empty cell in the 2-column grid. Making
  the timer the full-width hero fills it and matches the thesis. Its inner content is capped at
  620px and centred, or the Start button stretches across a monitor and reads as a toolbar. This
  is a hole-filler; BP-10 still owns the real rebuild.
- **Phase is not running-state.** A break the user hasn't started is already `break`. BP-01 should
  release its nudge when the user reaches the boundary, not when they start the break clock.
- **Phase is not persisted.** A restored phase would claim a focus block that no longer exists.
- **SEO metadata corrected, not rewritten.** The title, description, OG/Twitter cards and
  schema.org featureList all promised Quick Notes. Removed the claims for features that no longer
  exist; left positioning alone — that's BP-11.
- **Welcome overlay trimmed to four features.** Same reason. BP-23 retires it entirely.
- **Extension untouched.** Still a fork. Its tips.js ships a feature the product no longer has —
  tracked under BP-16.

## Next

1. **Deploy.** Stage 1's CLS fix is still waiting on a deploy too — both go out together.
2. Then Stage 3, BP-01 — the reason BP-19 exists. Read `docs/design/break-mode.md` §3 first.
3. Analytics stay parked until ~100 users/day.
