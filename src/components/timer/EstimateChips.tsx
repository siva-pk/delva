"use client";

import type { EstimateSource } from "@/lib/timer/types";

const CHIPS = [15, 30, 45, 60, 90];

/**
 * "How long do you think this'll take?" — one tap, and skippable.
 *
 * ⚠ This is the assumption the whole strategy rests on (BUILD-PLAN D-06). It is
 * friction, at session start, for an audience that abandons over friction. So:
 *
 *   * It never blocks. There is no required state and no validation gate.
 *   * A session with no estimate runs completely normally.
 *   * Selecting is one tap. Deselecting is tapping the same chip again.
 *
 * If take-up comes in under roughly a third of sessions, the moat never forms —
 * and that finding is worth more than anything else in the plan. Take-up is
 * derivable from stored rows (`estimate_minutes is null` or not), so the
 * instrumentation is the schema, not a tracking call.
 */
export function EstimateChips({
  value,
  suggested,
  onChange,
}: {
  value: number | null;
  suggested: number | null;
  onChange: (minutes: number | null, source: EstimateSource) => void;
}) {
  return (
    <div className="w-full">
      <p id="estimate-label" className="text-sm text-muted">
        How long do you think it&rsquo;ll take?
      </p>

      <div
        role="group"
        aria-labelledby="estimate-label"
        className="mt-3 flex flex-wrap gap-2"
      >
        {CHIPS.map((minutes) => {
          const selected = value === minutes;
          const isSuggestion = suggested === minutes && value === null;
          return (
            <button
              key={minutes}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onChange(
                  selected ? null : minutes,
                  // An accepted suggestion is not an independent guess, and
                  // must not be fed back into the bias calculation as one.
                  isSuggestion ? "suggested" : "chip",
                )
              }
              className={`rounded-full px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent ${
                selected
                  ? "bg-accent text-bg"
                  : isSuggestion
                    ? "bg-surface text-text ring-1 ring-accent"
                    : "bg-surface text-muted hover:text-text"
              }`}
            >
              {minutes}m
            </button>
          );
        })}
      </div>

      {suggested !== null && value === null ? (
        <p className="mt-2 text-sm text-muted">
          Based on your history, {suggested}m is closer to what this usually
          takes.
        </p>
      ) : null}
    </div>
  );
}
