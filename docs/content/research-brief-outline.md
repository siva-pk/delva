# D-16 — The research brief as a public series

**Status: draft. Not published.**

`docs/research/focus-science.md` is already written and is the credibility asset. This turns it into
a public series without diluting it.

## Why a series rather than one page

A single long page gets read once and shared once. A series gives repeated reasons to link back,
each post answering one question someone is already searching for, and each one able to stand alone
in a forum reply without looking like an advert.

## Running order

Ordered so the two least self-serving posts go first. The series has to read as "here is what the
research says", not "here is why you should buy my timer" — and the fastest way to establish that is
to publish something that argues *against* a feature the product could have sold.

1. **Why time blindness isn't a character flaw** — the mechanism, plainly. The most-searched
   question and the one people most want a non-judgemental answer to.
2. **Why streaks backfire** — argues against a feature Delva deliberately doesn't have. Cites the
   overjustification effect (§7). This is the post that proves the series isn't marketing.
3. **Why reminders shouldn't interrupt you** — interruption cost, and why the break is where a nudge
   belongs (§1, §5). Doubles as an explanation of a real design decision.
4. **What a bounded interval actually does** — the pre-committed interval as the active ingredient
   (§2). The honest version, including what the evidence does *not* establish.
5. **Implementation intentions: the highest-leverage sentence you can write** — d = 0.65 (§3), what
   the effect size means and what it doesn't.
6. **Why estimating is hard, and why knowing your own error helps** — the planning fallacy. This is
   the one that leads naturally to Delva, and it goes last for that reason.

## Draft — post 2, "Why streaks backfire"

> Almost every habit app gives you a streak. Miss a day and it resets to zero, and the reset is
> supposed to be the point: you won't want to lose your progress, so you'll show up.
>
> There's a well-documented problem with that. When you attach an external reward to something a
> person was doing for their own reasons, the external reward can *replace* the internal one rather
> than adding to it. Psychologists call it the overjustification effect. The behaviour survives as
> long as the reward does, and gets weaker when it stops.
>
> A streak counter is exactly that shape. The work stops being "I want to finish this" and starts
> being "I don't want to lose my number". That trade is bad on a normal week and much worse on a
> hard one — because the day you most need a way back in is the day the app tells you that you have
> nothing left to protect.
>
> There's a second problem specific to anyone with rejection sensitivity, which is common alongside
> ADHD. A reset streak isn't neutral information. It reads as a verdict.
>
> None of this means progress shouldn't be visible. It means the visible thing shouldn't be
> breakable. A count of what you did this week is information. A number that punishes you for one
> bad Tuesday is a threat, and threats are not what gets people back to a desk.
>
> *[Siva: check §7 for the exact citation before this goes out, and cut the rejection-sensitivity
> paragraph if you'd rather not make a claim about a population you're part of but haven't cited.]*

## Where these go

Own domain first — `delva.app/writing/` — so the links accrue to the product. Cross-post only where
it's genuinely on-topic, and never as a drive-by link. See `community-plan.md`.

## Not done

Posts 1 and 3–6 are outlined, not written. Post 2 is drafted above and still needs the citation
checked against §7 rather than trusted from a summary.
