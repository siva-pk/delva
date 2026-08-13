import { describe, expect, it } from "vitest";

import { estimateTakeUpRate, toLocalWallClock, type StoredSession } from "./sessions";

describe("toLocalWallClock", () => {
  it("records the clock on the wall, not UTC", () => {
    // 23:30 local on the 3rd. In any zone west of UTC this is the 4th in UTC,
    // and storing that would move the session to the wrong local day.
    const date = new Date(2026, 7, 3, 23, 30, 15);
    expect(toLocalWallClock(date)).toBe("2026-08-03T23:30:15");
    // The wall-clock string must not agree with the UTC one unless the machine
    // is actually on UTC.
    if (date.getTimezoneOffset() !== 0) {
      expect(toLocalWallClock(date)).not.toBe(date.toISOString().slice(0, 19));
    }
  });

  it("pads every component", () => {
    expect(toLocalWallClock(new Date(2026, 0, 5, 9, 7, 3))).toBe(
      "2026-01-05T09:07:03",
    );
  });
});

function session(overrides: Partial<StoredSession>): StoredSession {
  return {
    id: "id",
    presetId: "deep",
    plannedFocusSeconds: 3000,
    servedSeconds: 3000,
    pausedSeconds: 0,
    outcome: "completed",
    intention: "",
    estimateMinutes: null,
    estimateSource: null,
    suggestedEstimateMinutes: null,
    continuedFromSessionId: null,
    startedAt: "2026-08-03T12:00:00.000Z",
    endedAt: "2026-08-03T12:50:00.000Z",
    localTz: "America/Edmonton",
    localStartedAt: "2026-08-03T06:00:00",
    device: null,
    syncedAt: null,
    ...overrides,
  };
}

describe("estimateTakeUpRate", () => {
  it("is zero, not NaN, with no sessions", () => {
    expect(estimateTakeUpRate([]).rate).toBe(0);
  });

  it("counts only independent estimates", () => {
    const sessions = [
      session({ id: "a", estimateMinutes: 30, estimateSource: "chip" }),
      session({ id: "b", estimateMinutes: 45, estimateSource: "custom" }),
      // Accepted suggestion: not evidence the user would estimate unprompted.
      session({ id: "c", estimateMinutes: 60, estimateSource: "suggested" }),
      session({ id: "d" }),
    ];
    const { rate, withEstimate, total } = estimateTakeUpRate(sessions);
    expect(withEstimate).toBe(2);
    expect(total).toBe(4);
    expect(rate).toBe(0.5);
  });
});
