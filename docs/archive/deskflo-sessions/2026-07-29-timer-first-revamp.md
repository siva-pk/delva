# Session — 2026-07-29 — Timer-first revamp: research, plan, sequencing

**Outcome:** Revamp direction settled and fully sequenced. No code written.

> **Note added later the same day:** this record uses the original "Phase 0–6" labels. They were
> renamed to named stages when ROADMAP.md was folded into BUILD-PLAN.md — read `Phase N` as
> `Stage N+1`. So "Phase 0" below is now **Stage 1 — Trust the numbers**.

---

## How it started

Question on the table: should deskflo abandon the all-in-one concept? Trigger was the 73%
zero-action bounce, plus the observation that hydration and stretch reminders actively interrupt
the focus timer they sit next to.

Proposal was: make the focus timer the hero with real depth (stats, task names), demote everything
else to small optional panels.

## Where it landed

The interruption critique was correct and turned out to be the most strongly-evidenced thing in
the whole session. But the research argued for a sharpened version of the proposal rather than a
pivot — because the break boundary is a *privileged* moment for a nudge, and deskflo is the only
tool that both runs the timer and owns the reminders.

Final thesis:

> The timer owns the session. Hydration, stretch and ambient sound are break-layer features that
> exist *because* the timer knows where your boundary is.

Six features → four. Tips and Notes cut.

## What got produced

| Doc | What it is |
|---|---|
| `docs/research/focus-science.md` | 8-section evidence brief with confidence tags + sources |
| `docs/BUILD-PLAN.md` | 28-item register, 7 phases, dependency-ordered |
| `docs/design/break-mode.md` | Full design for BP-01 + BP-06 |
| `docs/DECISIONS.md` | Dated entry incl. three reversals of earlier decisions |

## The research that actually changed decisions

- **Interruption at task boundary vs mid-task** — 3–27% more time, *twice* the errors. This is the
  scientific backbone of the whole redesign, and it reframes the break as an asset rather than the
  bundle being a liability.
- **Implementation intentions, d = 0.65** — makes the task-name field the highest-leverage single
  addition, *if* framed as an intention rather than a label.
- **Micro-break meta-analysis** — sobering: vigor d=.36, performance effect non-significant. Breaks
  reliably change how you feel, not how you perform. Kept the design honest.
- **Overjustification / SDT** — the finding that contradicted an existing logged decision on
  streaks.

Two claims were deliberately kept *out* of the product: the famous "23 minutes to refocus" stat
(widely cited, thin primary source) and strong hydration-cognition claims (2018 meta-analysis
shows an effect, 2019 crossover-only follow-up doesn't).

## Bugs found by reading the code

None of these were previously known. All three are logged as build items.

1. **`timer.js` loses time in background tabs** — `setInterval` tick-decrement is throttled by
   Chrome when hidden. The timer is most wrong exactly when used correctly. → BP-25
2. **The 73% bounce is inflated** — keyboard shortcuts fire no events; `welcome.js` has zero
   instrumentation, so the welcome screen was never measurable. → BP-26
3. **No event bus** — `stretch.js` cannot ask what the timer is doing. Architectural root of the
   interruption conflict. → BP-19

## Decisions made

- Cut tips entirely; cut Quick Notes entirely
- Landing page at `/`, dashboard to its own route; welcome overlay retired
- Remove the 5 SEO landing pages, with 301s
- Settings **drawer** (not page), governed by an inclusion rule
- Break mode: dimmed overlay; no stats/charts/tips on it; breaks auto-start, focus blocks don't
- Hydration: always loggable, only *prompted* at breaks
- Ambient sound runs continuously across the boundary
- Layout redo isolated to its own final phase, absorbing the visual refresh
- Extension parity deferred, with the debt written down

## Open / carried forward

- Nothing blocking. Phase 0 is ready to start.
- Long-break *duration* rule (2× short break is the obvious guess, untested)
- Whether a break should be reachable without a preceding focus block (leaning no)
- ROADMAP.md now overlaps BUILD-PLAN.md — fold or retire it once Phase 0 ships
- When tips are removed, note it in ANALYTICS.md: `tip-next` was the #2 event, so total event
  volume will drop for reasons unrelated to engagement

## Scale reality check

~31–40 sessions across 7 phases. At 5–10 hrs/week this is multi-quarter, not a month. Phases 0–2
(~12–15 sessions) are the minimum that makes the thesis true. If the plan has to shrink, cut from
Phase 6 downward, never from Phase 0.
