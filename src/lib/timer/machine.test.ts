import { describe, expect, it } from "vitest";

import { initialState, intervalMs, reduce, remainingMs } from "./machine";
import { breakMsFor, focusMsFor, getPreset } from "./presets";
import type { TimerState } from "./types";

const T0 = 1_770_000_000_000; // fixed epoch — no Date.now() anywhere in here
const MIN = 60_000;

const classic = getPreset("classic"); // 25 / 5
const focusLen = focusMsFor(classic); // 25 min
const breakLen = classic.breakMinutes * MIN; // 5 min

function idle(): TimerState {
  return initialState("classic");
}

function running(at = T0): TimerState {
  return reduce(idle(), { type: "START_FOCUS", now: at }).state;
}

describe("phase is not running-state", () => {
  it("keeps phase focus while paused", () => {
    const paused = reduce(running(), { type: "PAUSE", now: T0 + 5 * MIN }).state;
    expect(paused.phase).toBe("focus");
    expect(paused.running).toBe(false);
  });

  it("is already break before the break has visibly begun", () => {
    const done = reduce(running(), { type: "COMPLETE", now: T0 + focusLen });
    expect(done.state.phase).toBe("break");
  });
});

describe("remaining time derives from a target timestamp", () => {
  it("does not lose time when no ticks are delivered", () => {
    const state = running();
    // Simulate a fully throttled background tab: zero ticks for 10 minutes.
    expect(remainingMs(state, T0 + 10 * MIN)).toBe(focusLen - 10 * MIN);
  });

  it("never reports negative remaining", () => {
    expect(remainingMs(running(), T0 + 99 * MIN)).toBe(0);
  });

  it("holds remaining steady across a pause", () => {
    const paused = reduce(running(), { type: "PAUSE", now: T0 + 5 * MIN }).state;
    expect(remainingMs(paused, T0 + 5 * MIN)).toBe(focusLen - 5 * MIN);
    // An hour of real time passes while paused; remaining must not move.
    expect(remainingMs(paused, T0 + 65 * MIN)).toBe(focusLen - 5 * MIN);
  });

  it("resumes against a fresh target rather than the original one", () => {
    const paused = reduce(running(), { type: "PAUSE", now: T0 + 5 * MIN }).state;
    const resumed = reduce(paused, { type: "RESUME", now: T0 + 65 * MIN }).state;
    expect(resumed.targetAt).toBe(T0 + 65 * MIN + (focusLen - 5 * MIN));
    expect(remainingMs(resumed, T0 + 65 * MIN)).toBe(focusLen - 5 * MIN);
  });

  it("shows the length of the block that would start, when idle", () => {
    expect(remainingMs(idle(), T0)).toBe(focusLen);
  });
});

describe("durations are what was served, not the preset length", () => {
  it("records served time for a block ended early", () => {
    const { completed } = reduce(running(), { type: "SKIP", now: T0 + 6 * MIN });
    expect(completed?.servedSeconds).toBe(6 * 60);
    expect(completed?.plannedFocusSeconds).toBe(25 * 60);
    expect(completed?.outcome).toBe("abandoned");
  });

  it("excludes paused time from served time", () => {
    let state = running();
    state = reduce(state, { type: "PAUSE", now: T0 + 5 * MIN }).state;
    state = reduce(state, { type: "RESUME", now: T0 + 20 * MIN }).state;
    const { completed } = reduce(state, { type: "SKIP", now: T0 + 25 * MIN });
    // 5 min before the pause + 5 min after it. The 15-minute pause is not work.
    expect(completed?.servedSeconds).toBe(10 * 60);
    expect(completed?.pausedSeconds).toBe(15 * 60);
  });

  it("counts paused time that is still open when the block ends", () => {
    let state = running();
    state = reduce(state, { type: "PAUSE", now: T0 + 5 * MIN }).state;
    const { completed } = reduce(state, { type: "RESET", now: T0 + 12 * MIN });
    expect(completed?.servedSeconds).toBe(5 * 60);
    expect(completed?.pausedSeconds).toBe(7 * 60);
  });
});

describe("breaks auto-start; focus blocks do not", () => {
  it("starts the break running, without asking", () => {
    const { state } = reduce(running(), { type: "COMPLETE", now: T0 + focusLen });
    expect(state.phase).toBe("break");
    expect(state.running).toBe(true);
    expect(state.targetAt).toBe(T0 + focusLen + breakLen);
  });

  it("lands on a ready idle state after a break, not a running block", () => {
    let { state } = reduce(running(), { type: "COMPLETE", now: T0 + focusLen });
    state = reduce(state, {
      type: "COMPLETE",
      now: T0 + focusLen + breakLen,
    }).state;
    expect(state.phase).toBe("idle");
    expect(state.running).toBe(false);
  });
});

describe("long break every 4th", () => {
  it("doubles the break after the 4th completed focus block", () => {
    let state = idle();
    let now = T0;
    for (let i = 0; i < 4; i += 1) {
      state = reduce(state, { type: "START_FOCUS", now }).state;
      now += focusLen;
      state = reduce(state, { type: "COMPLETE", now }).state;
      if (i < 3) {
        now += breakMsFor(classic, state.completedFocusCount);
        state = reduce(state, { type: "COMPLETE", now }).state;
      }
    }
    expect(state.completedFocusCount).toBe(4);
    expect(intervalMs(state)).toBe(breakLen * 2);
  });
});

describe("a break that expired while the tab was hidden", () => {
  it("does not snap into a running focus block", () => {
    const { state } = reduce(running(), { type: "COMPLETE", now: T0 + focusLen });
    const synced = reduce(state, {
      type: "SYNC",
      now: T0 + focusLen + breakLen + 30_000,
    }).state;
    expect(synced.phase).toBe("idle");
    expect(synced.running).toBe(false);
    expect(synced.breakEndedWhileAway).toBe(true);
  });

  it("returns to plain idle when the break is long gone", () => {
    const { state } = reduce(running(), { type: "COMPLETE", now: T0 + focusLen });
    const synced = reduce(state, {
      // More than 2x the break length past its end.
      type: "SYNC",
      now: T0 + focusLen + breakLen + breakLen * 2 + 1,
    }).state;
    expect(synced.phase).toBe("idle");
    expect(synced.breakEndedWhileAway).toBe(false);
  });

  it("completes a focus block that expired while away, at its true end time", () => {
    const state = running();
    const { state: synced, completed } = reduce(state, {
      type: "SYNC",
      now: T0 + focusLen + 90 * MIN,
    });
    // Served the full block — not the 90 extra minutes the tab was hidden.
    expect(completed?.servedSeconds).toBe(25 * 60);
    expect(completed?.endedAt).toBe(T0 + focusLen);
    expect(completed?.outcome).toBe("completed");
    // Its break auto-started then, and has also long since run out.
    expect(synced.phase).toBe("idle");
  });

  it("leaves a still-running interval alone", () => {
    const state = running();
    const after = reduce(state, { type: "SYNC", now: T0 + 5 * MIN });
    expect(after.state).toBe(state);
    expect(after.completed).toBeUndefined();
  });
});

describe("guards", () => {
  it("refuses to retarget a deadline already running", () => {
    const state = running();
    const after = reduce(state, { type: "SET_PRESET", presetId: "deep" }).state;
    expect(after.presetId).toBe("classic");
  });

  it("ignores start while already running", () => {
    const state = running();
    expect(reduce(state, { type: "START_FOCUS", now: T0 + MIN }).state).toBe(
      state,
    );
  });

  it("does not pause a break", () => {
    const { state } = reduce(running(), { type: "COMPLETE", now: T0 + focusLen });
    const after = reduce(state, { type: "PAUSE", now: T0 + focusLen + MIN });
    expect(after.state.running).toBe(true);
  });

  it("clears the estimate source when the estimate is cleared", () => {
    let state = reduce(idle(), {
      type: "SET_ESTIMATE",
      minutes: 30,
      source: "chip",
    }).state;
    state = reduce(state, {
      type: "SET_ESTIMATE",
      minutes: null,
      source: "chip",
    }).state;
    expect(state.estimateSource).toBeNull();
  });
});

describe("break skips are surfaced, not swallowed", () => {
  it("reports how much of the break was left", () => {
    const { state } = reduce(running(), { type: "COMPLETE", now: T0 + focusLen });
    const { breakSkipped } = reduce(state, {
      type: "SKIP",
      now: T0 + focusLen + 60_000,
    });
    expect(breakSkipped?.remainingMs).toBe(breakLen - 60_000);
  });
});
