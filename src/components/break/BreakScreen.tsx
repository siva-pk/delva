"use client";

import { useState } from "react";

import { DEFAULT_BREAK_ACTION, stretchAt } from "@/lib/reminders/content";
import type { Nudge } from "@/lib/reminders/queue";

import { TimeDisplay } from "../timer/TimeDisplay";

/**
 * The break screen. A full takeover, not a modal — modals are dismissable
 * interruptions, and the break is where the user is supposed to be.
 *
 * What is deliberately absent, per docs/design/break-mode.md §4, and why:
 * **no stats, no session counts, no streaks, no charts, no tips, no feedback
 * prompt.** §5 — recovery from directed-attention fatigue needs reduced
 * top-down control, and a "review your progress" panel is more directed
 * attention. It works against the only thing the break exists to do. Every
 * competitor puts stats here; that is the mistake worth not copying.
 *
 * Do not add anything to this screen without reading §4 and §5 first.
 */
export function BreakScreen({
  remainingMs,
  nudge,
  onLogWater,
  onBackToWork,
  children,
}: {
  remainingMs: number;
  nudge: Nudge | null;
  onLogWater: () => void;
  onBackToWork: () => void;
  children?: React.ReactNode;
}) {
  const [stretchIndex, setStretchIndex] = useState(0);

  return (
    <section
      aria-labelledby="break-heading"
      className="flex w-full max-w-md flex-col items-center gap-8"
    >
      <h2 id="break-heading" className="text-sm tracking-wide text-muted uppercase">
        Break
      </h2>

      {/* Large, calm, no urgency styling. This is not a deadline. */}
      <TimeDisplay remainingMs={remainingMs} muted />

      {/* Exactly one suggested action. Never a list, never a second card. */}
      <div className="w-full rounded-lg bg-surface p-4 text-center">
        {nudge?.kind === "hydration" ? (
          <>
            <p className="text-base text-text">Have some water.</p>
            <button
              type="button"
              onClick={onLogWater}
              className="mt-3 rounded-lg bg-bg px-5 py-2.5 text-sm text-text focus-visible:ring-2 focus-visible:ring-accent"
            >
              Log a glass
            </button>
          </>
        ) : nudge?.kind === "stretch" ? (
          <>
            <p className="text-base text-text">{stretchAt(stretchIndex)}</p>
            <button
              type="button"
              onClick={() => setStretchIndex((index) => index + 1)}
              className="mt-3 rounded-lg bg-bg px-5 py-2.5 text-sm text-text focus-visible:ring-2 focus-visible:ring-accent"
            >
              Show another
            </button>
          </>
        ) : (
          <p className="text-base text-text">{DEFAULT_BREAK_ACTION}</p>
        )}
      </div>

      {/* The close-out belongs here; it is about the block that just ended. */}
      {children}

      {/* A single quiet exit. */}
      <button
        type="button"
        onClick={onBackToWork}
        className="rounded-lg bg-surface px-6 py-3 text-base text-muted hover:text-text focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        Back to work early
      </button>
    </section>
  );
}
