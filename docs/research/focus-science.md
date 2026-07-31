# Focus Science — Research Brief

Compiled 2026-07-29 to ground the "timer-first" revamp (see BUILD-PLAN.md) in evidence rather than
instinct. Each section states the finding, the confidence level, and the concrete product
implication for deskflo.

**How to read the confidence tags:**
- **Solid** — meta-analysed or replicated, safe to design around and to state publicly.
- **Mixed** — real signal, contested magnitude. Design around it, but don't put it in marketing copy.
- **Weak** — widely repeated, thin primary evidence. Use as intuition only. Never cite publicly.

---

## 1. Interruption cost — the strongest case in the whole brief

**Finding.** Interrupting someone mid-task is materially worse than interrupting them at a task
boundary. Bailey & Konstan's work found that peripheral tasks presented mid-execution cost 3–27%
more completion time, **twice the errors**, 31–106% more annoyance, and twice the anxiety versus
the same interruption delivered at a boundary between tasks. Powers & Scerbo (2023) and a 2024
Frontiers review confirm the mechanism: coarse breakpoints (between chunks) produce much smaller
resumption costs than fine breakpoints (within a chunk). Critically, **deferring an interruption
by just a few seconds to reach a boundary mitigates most of the damage.**

Sophie Leroy's 2009 "attention residue" work explains the persistence: when you switch tasks, part
of your attention stays with the prior task. The effect is **strongest when the prior task was
time-pressured and left unfinished.** A running Pomodoro is, by construction, exactly that — a
time-pressured unfinished task. It is the worst possible moment to fire a notification.

**Confidence:** Solid.

**Caveat on the famous number.** The widely-cited "23 minutes 15 seconds to recover" attributed to
Gloria Mark appears in interviews far more reliably than in her published papers — a primary
printed source is hard to pin down. **Confidence: Weak. Do not use this figure in deskflo copy.**
The breakpoint findings above say the same thing and are properly sourced.

**Implication for deskflo — this is the whole redesign.**
Reminders must never fire during an active focus block. Queue them and release at the break
boundary. But the bigger point is strategic: the science says the break boundary is a
*privileged* moment for delivering a nudge. deskflo is the only tool in this space that both
runs the timer and owns the reminders — meaning it's the only one that structurally *can* nudge
at the right moment. That turns "all-in-one" from a bundle into a mechanism.

---

## 2. Interval length — 25 minutes is not sacred, and your users already know it

**Finding.** The 25-minute Pomodoro is convention, not a research result. Attention span on
focused tasks is commonly put at 10–20 minutes; focus quality degrades noticeably after 45–50
minutes. Flow research puts the "entry ramp" at roughly **15–25 minutes of uninterrupted work
before flow begins** — which means a classic 25-minute Pomodoro tends to end right around the
moment flow starts.

The active ingredient is not the number. It's the **pre-committed, bounded interval**, which
lowers the activation threshold for starting hard work by making the commitment finite and
specific. Timeboxing research supports this for task initiation and procrastination, with the
caveat that self-chosen, short-term boxes help while chronic imposed time pressure harms.

The often-quoted "52 minutes work / 17 minutes break" comes from DeskTime, a company blog analysis
of its own users — not peer review. **Confidence on that specific ratio: Weak.**

**Ultradian rhythms (BRAC).** Kleitman's ~90-minute rest-activity cycle is well established during
sleep. For *waking* cognitive performance the evidence is contested — Monk (1995) found limited
support for strict 90-minute cycles. The general principle that energy fluctuates in waves is
sound; the specific 90-minute number is not. **Confidence: Mixed.**

**Implication for deskflo.** Your analytics already agree with the theory: 50/10 Deep Work is your
most-used preset (51 uses vs 31 for Classic 25/5). Theory and revealed preference point the same
way. **Make 50/10 the default.** Offer a 90/20 ultradian preset for the deep-work crowd. Allow
fully custom intervals — the pre-commitment is the mechanism, so let people choose their own
number. Keep 25/5 available; don't privilege it.

---

## 3. Task naming — the highest-leverage single feature to add

**Finding.** Gollwitzer & Sheeran's 2006 meta-analysis of 94 independent tests found
implementation intentions ("if situation Y, then I will do Z") improve goal attainment at
**d = 0.65** — medium-to-large. The average person using an if-then plan outperformed roughly 74%
of people holding the same goal without a plan. Mechanism: the plan pre-loads the situational cue
so the behaviour fires more automatically.

Masicampo & Baumeister (2011), "Consider It Done!", is the companion finding. Unfinished goals
produce intrusive thoughts during unrelated tasks and measurably impair performance on them —
**but making a concrete plan for the unfinished goal eliminates the effect, without finishing the
task.** The loop closes when the goal feels *handled*, not when it's done.

**Confidence:** Solid, both.

**Implication for deskflo.** A plain "Task name" text box leaves most of this value on the table.
Two cheap upgrades capture it:
- Frame the field as an intention, not a label. "This session I'll ___" beats "Task name".
  Same input cost, meaningfully better prompt.
- **End-of-session close-out.** When the timer completes, ask: done / continue / capture what's
  left. That's a one-tap Zeigarnik close, and it's what turns the session log from a stopwatch
  history into a record of intentions kept.

---

## 4. Distraction capture — what Quick Notes should become

**Finding.** Newport's shutdown ritual works by guaranteeing every open loop is either planned or
captured somewhere trusted, which is precisely the Masicampo & Baumeister mechanism above. The
capture doesn't need to resolve the thought — it needs to make the thought feel handled.

**Confidence:** Solid as applied psychology (it's Masicampo's mechanism); the specific ritual is
practitioner advice, not a trial.

**Implication for deskflo.** Don't delete Quick Notes — **repurpose it.** A general-purpose
notepad competes with every note app on earth and lost (32 events / 10 sessions). A *session-scoped
distraction parking lot* — one keystroke to dump an intrusive thought mid-session, surfaced back
to you at the break — is a different product, has a research basis, and only makes sense inside a
timer. That's a feature no standalone timer offers and no note app can offer.

---

## 5. Break design — where nearly every timer app gets it wrong

**Finding.** The micro-break meta-analysis (Albulescu et al. 2022, PLOS One; 22 samples, N=2,335)
is more sobering than the productivity-blog consensus:
- Vigor: **d = .36**. Fatigue reduction: **d = .35**. Both significant but *small*.
- Overall performance: **non-significant.** Significant only for low-cognitive-demand tasks.
- Meta-regression: **longer breaks produce bigger performance boosts.** Recovering from genuinely
  depleting work likely needs more than 10 minutes.

Attention Restoration Theory (Kaplan) adds the quality dimension: recovery from directed-attention
fatigue requires *soft fascination* and a sense of being away — bottom-up attention that lets
top-down control rest. A 2025 systematic review and meta-analysis found nature-exposure restoration
effects are moderated by duration and are **larger for already-fatigued people**.

**Confidence:** Solid on both, with the honest read being "breaks reliably help how you *feel*;
they do not reliably restore performance on hard work unless they're long enough and restful
enough."

**Implication for deskflo.** The break is a distinct mode, not the dashboard with a different
number on it. Dim the screen. No stats, no charts, no "review your progress" CTA — that's more
directed attention, which is the opposite of restoration. One suggested physical action (water,
stretch, look away), ambient sound continuing. Let break length scale with cycles completed, since
the meta-regression favours longer breaks for real recovery. **This is exactly where hydration and
stretch belong, and the evidence says so.**

---

## 6. Hydration and movement — keep, but don't oversell

**Finding.** Wittbrodt & Millard-Stafford's 2018 meta-analysis (33 studies, 280 effect sizes)
found dehydration impairs **attention at ES = −0.52**, motor coordination −0.40, and executive
function −0.24, with effects concentrated above ~2% body-mass water deficit. However, a 2019
follow-up restricted to 10 crossover-design experiments found **no significant impairment** — a
genuine live disagreement in the literature.

**Confidence:** Mixed. Attention is the most affected domain, which is on-thesis for a focus tool
— but typical office mild dehydration sits below the threshold where effects are clearest.

**Implication for deskflo.** Keep hydration. It's your stickiest feature by a wide margin (392
logs across 38 sessions), it's a benign habit, and it fits the break slot perfectly. But do **not**
build marketing claims like "dehydration is destroying your focus" — that overstates a contested
literature, and this product's credibility is part of its appeal.

---

## 7. Stats and streaks — the finding that contradicts a logged decision

**Finding, part one — monitoring works.** Harkin et al. (Psychological Bulletin, APA) found
monitoring goal progress promotes attainment, and the effect is **stronger when people review
recorded data against their goal** rather than merely recording it. Locke & Latham's goal-setting
theory, across 35 years, consistently finds goals + feedback outperform goals alone. The
motivational driver is the *discrepancy signal* — the visible gap between current state and target.

**Finding, part two — streaks can backfire.** The overjustification effect (Deci 1971 onward) is
that adding external rewards to intrinsically motivated behaviour shifts the perceived locus of
motivation from internal to external and reduces intrinsic interest. A 2023 meta-analysis in
*Educational Technology Research and Development* found gamification improves perceived autonomy
and relatedness but has **minimal impact on competence**, and SDT work is explicit that game
elements can either support or thwart basic needs depending on application. Points and streaks
layered onto something someone already wanted to do is the classic risk case.

**Confidence:** Solid on both.

**Implication for deskflo — this challenges an existing decision.** DECISIONS.md records "streaks
are core to retention (Duolingo-style)" as a foundational choice. The research doesn't say drop
streaks, but it does say the naive version is the risky one:
- Show progress **against a goal the user chose themselves** (autonomy-supporting) rather than a
  bare count. "3 of your 4 sessions" beats "3 sessions."
- Make streaks **forgiving** — a breakable chain punishes exactly the people who already want the
  habit, and a broken streak is a common quit trigger.
- The existing convention of hiding zero-states rather than showing a cold "0" is already the
  right instinct here. Keep it.
- No leaderboards or social comparison, ever. That's the strongest overjustification risk and it
  clashes with the product's calm positioning.

---

## 8. Competitive landscape

Current serious focus tools — Session, Flow, Focus, Deep Focus, Focus Bear, RescueTime, Sunsama.
Table-stakes features are consistent: per-task/project session logging, daily/weekly/monthly stats,
heatmaps, daily goals, and app/website blocking. Focus Bear targets ADHD with structured blocks;
Flow leans on Apple-ecosystem sync; RescueTime does passive background tracking.

**Two structural gaps worth noting:**
1. Almost all are native apps, most are paid, and most require signup. deskflo's
   web / instant / no-signup / free position remains genuinely differentiated.
2. **None of them design the break.** They count down to zero and show a number. Section 5 says
   break quality is where the actual recovery happens, and Section 1 says the boundary is where a
   nudge belongs. That's an unoccupied position.

---

## Synthesis — what the research actually recommends

The evidence does not support abandoning the all-in-one concept. It supports **re-ranking it
around a mechanism**:

> The timer owns the session. Hydration, stretch, and sound are break-layer features that exist
> *because* the timer knows where your boundary is.

That single sentence resolves the conflict identified in the current product (Section 1), keeps
hydration — the only proven retention anchor — rather than demoting the strongest signal in the
analytics, justifies cutting generic Notes in favour of something only a timer can offer
(Section 4), and stakes out the one position competitors have left open (Section 8).

**Ranked by evidence strength × implementation cost:**

| Change | Evidence | Cost |
|---|---|---|
| Suppress reminders during focus; release at break boundary | Solid (§1) | Low |
| Default preset → 50/10; add custom + 90/20 | Solid + own analytics (§2) | Low |
| Task field framed as an intention, not a label | Solid, d=0.65 (§3) | Low |
| End-of-session close-out (done / continue / capture) | Solid (§3) | Low |
| Notes → session distraction parking lot | Solid (§4) | Medium |
| Break as a distinct dimmed mode, not the dashboard | Solid (§5) | Medium |
| Stats compared against a self-chosen goal | Solid (§7) | Medium |
| Revisit naive streak design | Solid (§7) | Low |

---

## Sources

**Interruption and attention residue**
- [Leroy 2009, *Why is it so hard to do my work?* — OBHDP](https://ideas.repec.org/a/eee/jobhdp/v109y2009i2p168-181.html)
- [Sophie Leroy — attention residue, UW Bothell](https://www.uwb.edu/business/faculty/sophie-leroy/attention-residue)
- [Bailey & Konstan, *On the need for attention-aware systems* — ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S074756320500107X)
- [Powers & Scerbo 2023, *Interruptions at Different Breakpoints and Frequencies* — PubMed](https://pubmed.ncbi.nlm.nih.gov/33861143/)
- [*Opportune moments for task interruptions* — Frontiers in Psychology 2024](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2024.1465323/full)
- [On the "23 minutes" figure — sourcing critique](https://blog.oberien.de/2023/11/05/23-minutes-15-seconds.html)

**Interval length, flow, ultradian**
- [Basic rest–activity cycle (Kleitman) — Wikipedia](https://en.wikipedia.org/wiki/Basic_rest%E2%80%93activity_cycle)
- [*Turning Time from Enemy into an Ally Using the Pomodoro Technique* — arXiv](https://arxiv.org/pdf/1402.4320)
- [Is the Pomodoro technique effective? — Brown Daily Herald fact check](https://www.browndailyherald.com/article/2026/03/fact-check-is-the-pomodoro-technique-actually-effective-for-studying)
- [Flow state overview — Simply Psychology](https://www.simplypsychology.com/articles/flow-state-psychology-guide)

**Intentions, unfinished goals, capture**
- [Gollwitzer & Sheeran 2006 meta-analysis (d = 0.65) — ResearchGate](https://www.researchgate.net/publication/37367696_Implementation_Intentions_and_Goal_Achievement_A_Meta-Analysis_of_Effects_and_Processes)
- [Gollwitzer, *Implementation Intentions: Strong Effects of Simple Plans* (PDF)](https://www.prospectivepsych.org/sites/default/files/pictures/Gollwitzer_Implementation-intentions-1999.pdf)
- [Masicampo & Baumeister 2011, *Consider It Done!* — ResearchGate](https://www.researchgate.net/publication/51234294_Consider_It_Done_Plan_Making_Can_Eliminate_the_Cognitive_Effects_of_Unfulfilled_Goals)
- [Cal Newport, *Deep Work* — shutdown ritual summary](https://www.todoist.com/inspiration/deep-work)

**Breaks and restoration**
- [Albulescu et al. 2022, *"Give me a break!"* micro-break meta-analysis — PLOS One](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0272460)
- [Attention Restoration Theory — Wikipedia](https://en.wikipedia.org/wiki/Attention_restoration_theory)
- [Nature exposure and attention restoration, duration-moderated meta-analysis 2025 — ScienceDirect](https://www.sciencedirect.com/science/article/pii/S027249442500115X)

**Hydration**
- [Wittbrodt & Millard-Stafford 2018, *Dehydration Impairs Cognitive Performance: A Meta-analysis*](https://www.semanticscholar.org/paper/Dehydration-Impairs-Cognitive-Performance:-A-Wittbrodt-Millard-Stafford/0f47a12158a92e32cdaad4e8896099e8e8ebf1cc)
- [Rosinger et al. 2024, ad libitum dehydration and sustained attention — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11144104/)

**Monitoring, goals, gamification**
- [Harkin et al., *Does Monitoring Goal Progress Promote Goal Attainment?* — APA Psychological Bulletin (PDF)](https://www.apa.org/pubs/journals/releases/bul-bul0000025.pdf)
- [Gamification meta-analysis 2023 — Educational Technology Research and Development](https://link.springer.com/article/10.1007/s11423-023-10337-7)
- [*Gamification in Action* — selfdeterminationtheory.org (PDF)](https://selfdeterminationtheory.org/wp-content/uploads/2020/10/2018_RutledgeWalshEtAl_Gamification.pdf)
- [Overjustification effect — Wikipedia](https://en.wikipedia.org/wiki/Overjustification_effect)

**Competitive landscape**
- [Best focus apps for deep work 2026 — Flown](https://flown.com/blog/deep-work/focus-apps)
- [Best deep work tracker apps 2026 — Lifestack](https://lifestack.ai/blog/deep-work-tracker)
