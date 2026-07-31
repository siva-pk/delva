# Session — 2026-07-29 — Stage 1: Trust the numbers

**Outcome:** All five Stage 1 items built and verified locally. Two previously-unknown bugs found
and fixed. Nothing user-visible. Not deployed.

---

## Files

**New**
| File | Purpose |
|---|---|
| `js/analytics.js` | Umami wrapper so non-DOM code can report. Queues events fired before the deferred tracker loads; caps the queue so a blocked tracker can't grow memory. |
| `js/vitals.js` | Core Web Vitals via native `PerformanceObserver`. No dependency. |

**Changed:** `js/timer.js`, `js/stretch.js`, `js/app.js`, `js/welcome.js`, `index.html`,
`build.js`, `sw.js`

## What was verified, and how

Umami is live on `localhost`, so tests drove modules directly and stubbed `umami.track` rather
than clicking instrumented buttons — otherwise the test run would have polluted the production
analytics this stage exists to repair. (Two localhost pageviews did get through on page load
before this was noticed. Harmless, but they're in the data.)

| Check | Result |
|---|---|
| Timer under simulated background throttling | 2-minute wall-clock jump reflected exactly. Old code: 1 second. |
| Pause after the jump | Recomputes from real remaining time, no drift |
| All four keyboard shortcuts | Fire correct event names with `source: keyboard` |
| Typing guard | Shortcuts still suppressed inside a textarea |
| `welcome-dismiss` | Fires with `method: cta`; `df_welcomed` stays `"true"` (backwards compatible) |
| `web-vitals` | Fires exactly once; second visibilitychange does not re-report; empty payload not sent |
| Mobile 375px | Zero horizontal overflow |
| Cache hash | Changes on real code edit, restores on revert, ignores comment-only edits |

**Not verified:** `lcp` / `fcp` / `cls` / `inp`. The test browser never painted — a page hidden
before first paint gets no paint or layout-shift entries at all, by spec — so those code paths
were never exercised. Only `ttfb` was confirmed end to end. Needs one check in a real browser
after deploy.

## The two bugs

**1. The service worker would have blocked this entire stage from reaching returning users.**

`sw.js` is cache-first with no expiry. `build.js` hardcoded `CACHE_VERSION = 'deskflo-v2'`. A
browser only re-installs a service worker when the sw.js bytes change — so every build produced a
byte-identical file, no re-install fired, the precache was never refreshed, and returning visitors
would have kept running the old bundle forever.

The irony is exact: a stage whose only purpose is to measure engaged users would have shipped to
new visitors only. Cache name is now derived from a hash of the built assets.

**2. `index.html` loaded `js/weather.js`, which does not exist.** A 404 on every page load, absent
from the build manifest too. Removed.

## Judgement calls made without asking

- **Stretch default → 30m** (BP-22 asked which of the two was intended). The docblock, the DOM's
  default `active` button and the usage data all said 30; only the initialiser said 45.
- **Hand-rolled vitals** rather than the `web-vitals` library — a runtime dependency contradicts
  the hard vanilla-JS constraint, and the library would outweigh what it measures.
- **INP approximated as the slowest interaction** rather than the 98th percentile. Identical for
  low-interaction pages, pessimistic elsewhere — the safe direction for a regression signal.
- **Extension left untouched.** Its `js/` is a fork, so the timer fix didn't propagate. The diff is
  mechanical but untestable without loading the unpacked extension; an unverified fix to a
  store-reviewed artifact is worse than a tracked divergence.
- **Only one mobile fix applied.** 22 controls are under the 44px iOS guideline, but only the
  hydration Reset button (26×15) failed WCAG 2.5.8's 24×24. BP-14a is scoped to showstoppers; the
  rest is BP-14b, and five of them are on pages BP-24 deletes anyway.

## Next

1. **Deploy.** Stage 1 is worth nothing until it's live.
2. Confirm the `web-vitals` event carries all five metrics in a real browser.
3. Wait a week or two, then re-baseline. **The bounce number will improve on its own** — that's
   the instrumentation being fixed, not the product. Don't read it as a win.
4. Then Stage 2, BP-19 `js/session.js`.
