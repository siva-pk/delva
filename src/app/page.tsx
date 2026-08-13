import { TimerScreen } from "@/components/timer/TimerScreen";

/**
 * D-17 — the claim and a working timer, both above the fold.
 *
 * The timer is not behind a call to action. Comprehension shouldn't cost a
 * click: someone who lands here can read what Delva does and start a block
 * without navigating anywhere. Everything explanatory sits below it.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-24">
      <section className="flex w-full max-w-md flex-col items-center gap-8 pt-8">
        <h1 className="text-center text-2xl leading-snug font-medium text-balance sm:text-3xl">
          A focus timer that learns how long things actually take you.
        </h1>

        <TimerScreen />
      </section>

      <section className="mt-24 w-full max-w-xl border-t border-surface pt-12">
        <h2 className="text-lg font-medium">What it does differently</h2>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Most timers count down. Delva also records what you thought a task
          would take, next to what it actually took — and after enough sessions
          it can tell you the gap. If work reliably takes you half again as long
          as you expect, that&rsquo;s a useful thing to know. Project tools have
          tracked estimate versus actual for years, but for managers looking at
          teams. This does it for you, with nobody watching.
        </p>

        <h2 className="mt-10 text-lg font-medium">It stays yours</h2>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Sessions are stored on your device and work without an account. What
          you write in &ldquo;this session I&rsquo;ll…&rdquo; is never sent
          anywhere — not to analytics, not to us. Sign in only if you want your
          history backed up across devices.
        </p>

        <h2 className="mt-10 text-lg font-medium">No scores, no streaks to break</h2>
        <p className="mt-3 text-base leading-relaxed text-muted">
          There is no leaderboard, no ranking against anyone else, and no way to
          fail a session. A block you ended early is recorded as the minutes you
          actually served, which is the honest number and the one calibration
          needs.
        </p>
      </section>
    </main>
  );
}
