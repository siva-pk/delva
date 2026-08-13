import {
  DEFAULT_PRESET_ID,
  breakMsFor,
  focusMsFor,
  getPreset,
} from "./presets";
import type { CompletedSession, TimerEvent, TimerState } from "./types";

/**
 * The session phase machine, as a pure function.
 *
 * Pure on purpose: every subtle rule below (served-not-planned durations,
 * target-timestamp arithmetic, what happens when a break expires while the tab
 * is hidden) is a rule about *time*, and time is exactly what you cannot
 * exercise reliably through a React component. `now` is always passed in.
 *
 * Rules this encodes, each with a reason recorded elsewhere:
 *   * Phase is not running-state — a paused block is still `focus`.
 *   * Breaks auto-start; focus blocks do not (break-mode.md §5).
 *   * Remaining time derives from `targetAt`, never a per-tick decrement.
 *   * A block's duration is what was *served*, never the preset length.
 */

export type Transition = {
  state: TimerState;
  /** Emitted whenever a focus block ends, for any reason. */
  completed?: CompletedSession;
  /** Emitted when a break is ended early, for the skip-rate signal. */
  breakSkipped?: { remainingMs: number };
};

export function initialState(presetId: string = DEFAULT_PRESET_ID): TimerState {
  return {
    phase: "idle",
    running: false,
    presetId,
    targetAt: null,
    remainingAtPause: null,
    focusStartedAt: null,
    runningSince: null,
    pausedSince: null,
    servedMs: 0,
    pausedMs: 0,
    completedFocusCount: 0,
    intention: "",
    estimateMinutes: null,
    estimateSource: null,
    suggestedEstimateMinutes: null,
    breakEndedWhileAway: false,
  };
}

/**
 * Remaining ms in the current interval. In `idle` this is the length of the
 * block that *would* start, so the display has something honest to show.
 */
export function remainingMs(state: TimerState, now: number): number {
  const preset = getPreset(state.presetId);

  if (state.phase === "idle") return focusMsFor(preset);
  if (!state.running) {
    return state.remainingAtPause ?? 0;
  }
  if (state.targetAt === null) return 0;
  return Math.max(0, state.targetAt - now);
}

/** Total length of the interval currently in play, for progress rendering. */
export function intervalMs(state: TimerState): number {
  const preset = getPreset(state.presetId);
  if (state.phase === "break") {
    return breakMsFor(preset, state.completedFocusCount);
  }
  return focusMsFor(preset);
}

function servedThrough(state: TimerState, at: number): number {
  if (!state.running || state.runningSince === null) return state.servedMs;
  return state.servedMs + Math.max(0, at - state.runningSince);
}

function finishFocus(
  state: TimerState,
  endedAt: number,
  outcome: CompletedSession["outcome"],
): CompletedSession {
  const preset = getPreset(state.presetId);
  const served = servedThrough(state, endedAt);
  const pausedMs =
    state.pausedSince !== null
      ? state.pausedMs + Math.max(0, endedAt - state.pausedSince)
      : state.pausedMs;

  return {
    presetId: state.presetId,
    plannedFocusSeconds: Math.round(focusMsFor(preset) / 1000),
    // Served, not planned. A block stopped at 6 of 15 minutes is 6 minutes.
    servedSeconds: Math.round(served / 1000),
    pausedSeconds: Math.round(pausedMs / 1000),
    outcome,
    intention: state.intention,
    estimateMinutes: state.estimateMinutes,
    estimateSource: state.estimateSource,
    suggestedEstimateMinutes: state.suggestedEstimateMinutes,
    startedAt: state.focusStartedAt ?? endedAt,
    endedAt,
  };
}

/** Breaks auto-start. This is the only place that is true. */
function startBreak(state: TimerState, at: number): TimerState {
  const preset = getPreset(state.presetId);
  return {
    ...state,
    phase: "break",
    running: true,
    targetAt: at + breakMsFor(preset, state.completedFocusCount),
    remainingAtPause: null,
    focusStartedAt: null,
    runningSince: at,
    pausedSince: null,
    servedMs: 0,
    pausedMs: 0,
    breakEndedWhileAway: false,
  };
}

/**
 * Focus blocks do not auto-start. Landing here means "ready when you are",
 * never a running timer — a block you didn't choose to begin isn't a
 * commitment (break-mode.md §5).
 */
function toIdle(state: TimerState, breakEndedWhileAway = false): TimerState {
  return {
    ...state,
    phase: "idle",
    running: false,
    targetAt: null,
    remainingAtPause: null,
    focusStartedAt: null,
    runningSince: null,
    pausedSince: null,
    servedMs: 0,
    pausedMs: 0,
    breakEndedWhileAway,
  };
}

export function reduce(state: TimerState, event: TimerEvent): Transition {
  switch (event.type) {
    case "SET_PRESET": {
      // Refusing to move a deadline that is already running — changing the
      // preset mid-block would retarget a commitment the user already made.
      if (state.phase !== "idle") return { state };
      return { state: { ...state, presetId: event.presetId } };
    }

    case "SET_INTENTION":
      return { state: { ...state, intention: event.intention } };

    case "SET_ESTIMATE":
      return {
        state: {
          ...state,
          estimateMinutes: event.minutes,
          estimateSource: event.minutes === null ? null : event.source,
        },
      };

    case "SUGGEST_ESTIMATE":
      return { state: { ...state, suggestedEstimateMinutes: event.minutes } };

    case "START_FOCUS": {
      if (state.phase !== "idle") return { state };
      const preset = getPreset(state.presetId);
      return {
        state: {
          ...state,
          phase: "focus",
          running: true,
          targetAt: event.now + focusMsFor(preset),
          remainingAtPause: null,
          focusStartedAt: event.now,
          runningSince: event.now,
          pausedSince: null,
          servedMs: 0,
          pausedMs: 0,
          breakEndedWhileAway: false,
        },
      };
    }

    case "PAUSE": {
      // Breaks are not pausable: wall-clock is the truth for recovery time,
      // and a pausable break is just a stopped break.
      if (state.phase !== "focus" || !state.running) return { state };
      return {
        state: {
          ...state,
          running: false,
          servedMs: servedThrough(state, event.now),
          remainingAtPause: Math.max(
            0,
            (state.targetAt ?? event.now) - event.now,
          ),
          targetAt: null,
          runningSince: null,
          pausedSince: event.now,
        },
      };
    }

    case "RESUME": {
      if (state.phase !== "focus" || state.running) return { state };
      const remaining = state.remainingAtPause ?? 0;
      return {
        state: {
          ...state,
          running: true,
          targetAt: event.now + remaining,
          remainingAtPause: null,
          runningSince: event.now,
          pausedMs:
            state.pausedSince !== null
              ? state.pausedMs + Math.max(0, event.now - state.pausedSince)
              : state.pausedMs,
          pausedSince: null,
        },
      };
    }

    case "COMPLETE": {
      if (state.phase === "focus") {
        const completed = finishFocus(state, event.now, "completed");
        const advanced = {
          ...state,
          completedFocusCount: state.completedFocusCount + 1,
        };
        return { state: startBreak(advanced, event.now), completed };
      }
      if (state.phase === "break") {
        return { state: toIdle(state) };
      }
      return { state };
    }

    case "SKIP": {
      if (state.phase === "focus") {
        // Ended early by choice. Descriptive, not a judgement — and the served
        // duration is what makes it legible rather than a failure.
        const completed = finishFocus(state, event.now, "abandoned");
        return { state: toIdle(state), completed };
      }
      if (state.phase === "break") {
        // Break skip rate is the clearest single falsifier for the break
        // design (break-mode.md §10.3), so it is emitted, not swallowed.
        return {
          state: toIdle(state),
          breakSkipped: { remainingMs: remainingMs(state, event.now) },
        };
      }
      return { state };
    }

    case "RESET": {
      if (state.phase === "focus") {
        const completed = finishFocus(state, event.now, "skipped");
        return {
          state: { ...toIdle(state), completedFocusCount: 0 },
          completed,
        };
      }
      return { state: { ...toIdle(state), completedFocusCount: 0 } };
    }

    case "SYNC": {
      // The tab was hidden, the machine slept, or state was rehydrated from
      // storage. Wall-clock is the truth; catch up to it.
      if (!state.running || state.targetAt === null) return { state };
      if (event.now < state.targetAt) return { state };

      const preset = getPreset(state.presetId);

      if (state.phase === "focus") {
        // The block ran its full length. It ended when it ended, not now.
        const endedAt = state.targetAt;
        const completed = finishFocus(state, endedAt, "completed");
        const advanced = {
          ...state,
          completedFocusCount: state.completedFocusCount + 1,
        };
        const onBreak = startBreak(advanced, endedAt);

        // The break auto-started at that moment, so it may have expired too.
        if (onBreak.targetAt !== null && event.now >= onBreak.targetAt) {
          const breakLength = breakMsFor(preset, advanced.completedFocusCount);
          const overshoot = event.now - onBreak.targetAt;
          return {
            state: toIdle(onBreak, overshoot <= breakLength * 2),
            completed,
          };
        }
        return { state: onBreak, completed };
      }

      // A break that ran out while away. Do not snap into a running focus
      // block — the user has just context-switched, which is the worst possible
      // moment to be dropped into one (break-mode.md §10.2).
      const breakLength = breakMsFor(preset, state.completedFocusCount);
      const overshoot = event.now - state.targetAt;
      // Long gone means the cycle was abandoned; resuming a 4-hour-old break
      // is noise, so return to plain idle with no acknowledgement.
      return { state: toIdle(state, overshoot <= breakLength * 2) };
    }

    case "DISMISS_AWAY_NOTICE":
      return { state: { ...state, breakEndedWhileAway: false } };

    default:
      return { state };
  }
}
