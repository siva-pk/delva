# Analytics Snapshot — April 2026

Source: Umami export (event_data.csv, session_data.csv, website_event.csv), analyzed 2026-04-16.
Covers 2026-03-10 → 2026-04-16 (36 days, website only — extension analytics tracked separately
in chrome.storage.local, not yet merged into this view).

Re-run this analysis periodically and append a new dated section below rather than overwriting —
trend-over-time is more useful than a single snapshot.

---

## 2026-07-29 — Event schema after BP-17

**The old event set could not answer the questions the timer-first model raises.** It was designed
for a bundle-of-tools product: it counted feature touches, so it could tell you hydration was
popular but not whether anybody finished a focus block. BP-17 replaces the session-shaped events.

**Nothing here is meant to be read yet.** Analytics are parked until ~100 users/day (see
DECISIONS.md 2026-07-29). BP-17 shipped *with* Stages 3–4 rather than after them because the
before/after is unrecoverable otherwise.

### Session lifecycle (new — `js/timer.js`)

| Event | Payload | Answers |
|---|---|---|
| `session-start` | `preset`, `intentionSet` | Denominator for completion rate; intention adoption |
| `session-complete` | `preset`, `intentionSet`, `nextBreak` | Numerator for completion rate |
| `session-abandon` | `preset`, `intentionSet`, `servedPct` | Do people bail early or near the end? |
| `break-complete` | `abandoned` | Break engagement — did the break actually run out? |

**Completion rate** = `session-complete` / `session-start`. **Intention adoption** = share of
`session-start` with `intentionSet: true`. The most interesting cut is completion rate *split by*
`intentionSet` — that is the d = 0.65 claim from §3 tested on real users, and it is the single
number most worth waiting for traffic to be able to read.

### Break layer (new — `js/break.js`)

| Event | Payload | Answers |
|---|---|---|
| `break-start` | `kind`, `nudge`, `closeout` | Break entry; which nudge was released, if any |
| `break-skip` | `remaining`, `nudge` | **Skip rate — the main falsifier for the break design** |
| `break-nudge-action` | `kind` | Whether the released nudge gets acted on |
| `closeout` | `choice` (`done` / `continue`) | Share of sessions where the plan was kept |

A high `break-skip` rate is the clearest single signal the break-mode design is wrong. It is the
thing to look at first, ahead of anything flattering.

### Privacy constraint — do not relax this

**`intentionSet` is a boolean, deliberately.** The intention text is the most personal thing in the
app — literally what the user is working on — and deskflo's claim is that data stays on the device.
Neither the content nor its length is ever sent. If a future item wants "what do people work on?",
the answer is that the product cannot ask that without breaking its own promise.

### What disappeared, and why the totals drop

`tip-next` (was the #2 event by volume) and the `note-*` family are gone with BP-28 / BP-05. Total
event volume will fall noticeably versus the April snapshot **for reasons unrelated to engagement**.
Do not read the next snapshot's total as a regression.

---

## 2026-04-16 snapshot

**Top level**
- 285 unique sessions, 395 visits, 2,012 total events (740 pageviews + 1,272 custom events)
- ~8 sessions/day average
- Traffic from 20+ countries — US (99 sessions) and India (68) lead, then FR/GB/PH/DE/BR/MX

**Traffic sources**
- Reddit (reddit.com + com.reddit.frontpage combined): 36 sessions, 329 events — by far the
  highest-engagement source
- Google: 10 sessions, 30 events
- Direct/other: remainder
- **Takeaway: community (Reddit) outperforms SEO by ~10x on engagement so far.** Confirms the
  "community first" pivot in docs/DECISIONS.md.

**Feature usage (custom events, most → least used)**
| Event | Count | Unique sessions | Note |
|---|---|---|---|
| hydration-log | 392 | 38 | Most habitual feature — ~10 logs/user who engages |
| tip-next | 232 | 29 | Tip rotation well-used |
| timer-preset | 120 | 34 | 50/10 Deep Work most popular (51), then 15/3 Sprint (38), then 25/5 Classic (31) |
| toggle-theme | 89 | 25 | |
| timer-start | 76 | 32 | |
| ambient-play | 58 | 30 | deep-hum most popular (16), then white-noise (14), rain (14), cafe (9), fireplace (5) |
| stretch-shuffle | 57 | 7 | Concentrated in few sessions — users repeatedly rejecting suggested stretch |
| stretch-interval | 47 | 16 | 30m most popular (23), then 60m (13), 45m (11) |
| timer-switch-mode | 35 | 14 | |
| note-add-tab | 32 | 10 | Weakest core feature by usage |
| toggle-mute | 32 | 13 | |
| stretch-start | 25 | 18 | |
| feedback-open | 20 | 15 | |
| hydration-reset | 12 | 6 | |
| ambient-stop-all | 10 | 8 | |
| timer-reset | 8 | 4 | |
| feedback-submit | 7 | 5 | **65% drop-off from feedback-open → feedback-submit** |
| note-copy | 5 | 5 | |
| stretch-modal-skip | 4 | 3 | |
| stretch-pause | 4 | 2 | |

**Engagement / bounce**
- 73% of sessions (207/285) take zero action — pure bounce
- 27% (78/285) engaged with at least one tool
- 18% (52/285) are power users with 5+ actions
- Avg 7.1 events/session overall, but median is 1 (heavily skewed by power users)

**Landing pages** (SEO, live ~since early April)
| Page | Pageviews | Sessions |
|---|---|---|
| / (main dashboard) | 578 | 281 |
| /pomodoro-timer/ | 44 | 6 |
| /hydration-tracker/ | 33 | 4 |
| /stretch-reminder/ | 17 | 4 |
| /online-notepad/ | 16 | 4 |
| /ambient-sounds/ | 14 | 4 |
| /privacy | 8 | 6 |

Indexed and getting some traffic, but low volume relative to the effort — bridge-bar
conversion from landing page → full dashboard not yet measured directly.

**Devices / browsers**
- 62% laptop, 33% mobile, 4% desktop, 2% tablet
- Chrome 186 sessions, iOS Safari 51, Edge 14, Chrome iOS 13
- Windows 105, iOS 65, Mac OS 47, Android 33, Linux 33

**Timing**
- Busiest day: Thursday (70 sessions); highest event volume: Wednesday (439 events)
- Busiest hours: 4-9 AM UTC (aligns with morning-routine usage globally)

**Core Web Vitals**
- Not currently captured — lcp/inp/cls/fcp/ttfb all null in export. Umami performance
  tracking needs to be enabled/fixed. [OPEN ITEM]

---

## Key takeaways feeding the revamp

1. **Hydration is the retention anchor.** Any gamification/streak/score feature should be
   built around it first, not timer.
2. **Reddit >> SEO for now.** Keep landing pages live (sunk cost, zero maintenance) but don't
   invest further build time in SEO until organic volume grows.
3. **73% bounce is the #1 problem to fix.** The welcome screen (see DECISIONS.md) targets this
   directly — validate its impact in the next analytics snapshot.
4. **Feedback form has a leak.** 65% of people who open it don't submit — investigate friction.
5. **Notes is the weakest core tool.** Candidate for de-scoping or replacement in the revamp.
6. **Stretch-shuffle spike (57 events, 7 sessions)** suggests the stretch suggestion algorithm
   or exercise variety needs work — a small group is unhappy with what's offered.
