"use client";

import { HYDRATION_DAILY_GOAL } from "@/lib/reminders/content";

/**
 * The always-visible water control, required by break-mode.md §6.
 *
 * The resolution to §5-says-break vs the-analytics-say-don't-gate-it is to
 * **separate logging from prompting**. Logging a glass is a two-second
 * self-initiated act, not an interruption — §1 is about *involuntary*
 * interruptions — so it stays available in every phase, including mid-focus.
 * Only the *prompt* waits for a break.
 *
 * Deliberately not a chart, a streak or a percentage: this renders during a
 * focus block, and §4's ban on stats exists for the same reason here.
 */
export function WaterControl({
  glasses,
  onLog,
}: {
  glasses: number;
  onLog: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onLog}
      // The count is in the accessible name rather than shouted visually.
      aria-label={`Log a glass of water. ${glasses} of ${HYDRATION_DAILY_GOAL} today.`}
      className="rounded-full bg-surface px-3 py-1.5 text-sm text-muted hover:text-text focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span aria-hidden="true">
        Water {glasses}/{HYDRATION_DAILY_GOAL}
      </span>
    </button>
  );
}
