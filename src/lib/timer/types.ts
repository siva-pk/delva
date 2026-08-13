/**
 * Phase is `idle` / `focus` / `break` and is **not** running-state.
 *
 * A paused focus block is still `focus`. A break the user hasn't started is
 * already `break`. Conflating the two is the specific mistake this type exists
 * to prevent — see docs/design/break-mode.md §2 and the deskflo decisions log.
 */
export type Phase = "idle" | "focus" | "break";

export type EstimateSource = "chip" | "custom" | "suggested";

export type SessionOutcome = "completed" | "abandoned" | "skipped";

export type TimerState = {
  phase: Phase;
  /** Independent of phase. See the note on `Phase`. */
  running: boolean;
  presetId: string;

  /**
   * Wall-clock instant the current interval ends, in epoch ms. Remaining time
   * is always derived from this — never decremented per tick. Background tabs
   * are throttled and a decrementing counter silently loses every skipped tick.
   * Null whenever nothing is running.
   */
  targetAt: number | null;
  /** Remaining ms, captured at the moment of pausing. Null unless paused. */
  remainingAtPause: number | null;

  /** When the current focus block first started. Null outside `focus`. */
  focusStartedAt: number | null;
  /** Instant the current running stretch began, for served-time accounting. */
  runningSince: number | null;
  /** Instant the current pause began. Null unless paused mid-focus. */
  pausedSince: number | null;
  /** Focus time actually served in this block, excluding paused time. */
  servedMs: number;
  pausedMs: number;

  /** Completed focus blocks this cycle — drives the every-4th long break. */
  completedFocusCount: number;

  intention: string;
  estimateMinutes: number | null;
  estimateSource: EstimateSource | null;
  suggestedEstimateMinutes: number | null;

  /**
   * Set when a break ran out while the tab was hidden and the user is being
   * eased back rather than dropped into a running block.
   */
  breakEndedWhileAway: boolean;
};

export type TimerEvent =
  | { type: "SET_PRESET"; presetId: string }
  | { type: "SET_INTENTION"; intention: string }
  | {
      type: "SET_ESTIMATE";
      minutes: number | null;
      source: EstimateSource | null;
    }
  | { type: "SUGGEST_ESTIMATE"; minutes: number | null }
  | { type: "START_FOCUS"; now: number }
  | { type: "PAUSE"; now: number }
  | { type: "RESUME"; now: number }
  /** Natural expiry of the current interval. */
  | { type: "COMPLETE"; now: number }
  /** User ends the current interval early. */
  | { type: "SKIP"; now: number }
  /** User abandons the whole cycle. */
  | { type: "RESET"; now: number }
  /** Tab became visible, or state was rehydrated from storage. */
  | { type: "SYNC"; now: number }
  /** Rehydrate a block that was in flight when the page went away. */
  | { type: "RESTORE"; state: TimerState }
  | { type: "DISMISS_AWAY_NOTICE" };

/** What gets handed to the store when a focus block ends, for any reason. */
export type CompletedSession = {
  presetId: string;
  plannedFocusSeconds: number;
  servedSeconds: number;
  pausedSeconds: number;
  outcome: SessionOutcome;
  intention: string;
  estimateMinutes: number | null;
  estimateSource: EstimateSource | null;
  suggestedEstimateMinutes: number | null;
  startedAt: number;
  endedAt: number;
};
