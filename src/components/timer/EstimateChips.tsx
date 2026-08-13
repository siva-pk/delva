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
          return (
            <button
              key={minutes}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : minutes, "chip")}
              className={`rounded-full px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent ${
                selected
                  ? "bg-accent text-bg"
                  : "bg-surface text-muted hover:text-text"
              }`}
            >
              {minutes}m
            </button>
          );
        })}
      </div>

      {/*
        A default the user can override, never an imposition: the number they
        chose stays chosen until they tap this.
      */}
      {suggested !== null && value !== null && suggested !== value ? (
        <p className="mt-3 text-sm text-muted">
          Going by your history, this kind of thing usually takes you nearer{" "}
          <button
            type="button"
            onClick={() => onChange(suggested, "suggested")}
            className="text-accent underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-accent"
          >
            {suggested}m
          </button>
          .
        </p>
      ) : null}
    </div>
  );
}
