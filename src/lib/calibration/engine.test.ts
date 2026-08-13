import { describe, expect, it } from "vitest";

import type { StoredSession } from "@/lib/storage/sessions";

import {
  MIN_SAMPLES,
  buildChains,
  calibrationSamples,
  computeCalibration,
  describeCalibration,
  suggestEstimate,
} from "./engine";

let seq = 0;

function session(overrides: Partial<StoredSession> = {}): StoredSession {
  seq += 1;
  return {
    id: `s${seq}`,
    presetId: "classic",
    plannedFocusSeconds: 1500,
    servedSeconds: 1500,
    pausedSeconds: 0,
    outcome: "completed",
    intention: "",
    estimateMinutes: null,
    estimateSource: null,
    suggestedEstimateMinutes: null,
    continuedFromSessionId: null,
    taskCompleted: null,
    startedAt: "2026-08-03T12:00:00.000Z",
    endedAt: "2026-08-03T12:25:00.000Z",
    localTz: "America/Edmonton",
    localStartedAt: "2026-08-03T06:00:00",
    device: null,
    syncedAt: null,
    ...overrides,
  };
}

/** One finished chain: estimated `est`, served `served` minutes in `blocks`. */
function chain(est: number, served: number, blocks = 1): StoredSession[] {
  const per = Math.round((served * 60) / blocks);
  const head = session({
    estimateMinutes: est,
    estimateSource: "chip",
    servedSeconds: per,
    taskCompleted: blocks === 1 ? true : false,
  });
  const rows = [head];
  for (let i = 1; i < blocks; i += 1) {
    rows.push(
      session({
        servedSeconds: per,
        continuedFromSessionId: rows[i - 1].id,
        taskCompleted: i === blocks - 1 ? true : false,
      }),
    );
  }
  return rows;
}

describe("chains are one piece of work", () => {
  it("sums served time across a chain against the head's estimate", () => {
    // The case that inverts the sign if you get it wrong: 30 estimated,
    // three 25-minute blocks. That is 75 served, not three tidy 25s.
    const rows = chain(30, 75, 3);
    const chains = buildChains(rows);
    expect(chains).toHaveLength(1);
    expect(chains[0].estimateMinutes).toBe(30);
    expect(chains[0].servedMinutes).toBe(75);
  });

  it("survives a cycle in corrupt data rather than hanging", () => {
    const a = session({ id: "a", continuedFromSessionId: "b" });
    const b = session({ id: "b", continuedFromSessionId: "a" });
    expect(() => buildChains([a, b])).not.toThrow();
  });
});

describe("what counts as a sample", () => {
  it("excludes work the user never finished", () => {
    const rows = chain(30, 20);
    rows[0].taskCompleted = false;
    expect(calibrationSamples(rows)).toHaveLength(0);
  });

  it("excludes estimates that came from our own suggestion", () => {
    const rows = chain(30, 45);
    rows[0].estimateSource = "suggested";
    expect(calibrationSamples(rows)).toHaveLength(0);
  });

  it("excludes sessions with no estimate at all", () => {
    const rows = chain(30, 45);
    rows[0].estimateMinutes = null;
    rows[0].estimateSource = null;
    expect(calibrationSamples(rows)).toHaveLength(0);
  });
});

describe("computeCalibration", () => {
  it("says nothing until there is enough history", () => {
    const rows = Array.from({ length: MIN_SAMPLES - 1 }, () =>
      chain(30, 45),
    ).flat();
    const result = computeCalibration(rows);
    expect(result.kind).toBe("insufficient");
    expect(describeCalibration(result)).toBeNull();
  });

  it("reports underestimation in the direction a human would say it", () => {
    const rows = Array.from({ length: MIN_SAMPLES }, () => chain(30, 45)).flat();
    const result = computeCalibration(rows);
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") return;
    expect(result.direction).toBe("under");
    expect(result.percent).toBe(50);
    expect(describeCalibration(result)).toContain("50% longer");
  });

  it("gets the sign right on the chained case", () => {
    // Estimated 30, actually took 75 across three blocks. If chains were
    // ignored this would look like consistent over-estimation instead.
    const rows = Array.from({ length: MIN_SAMPLES }, () =>
      chain(30, 75, 3),
    ).flat();
    const result = computeCalibration(rows);
    if (result.kind !== "ready") throw new Error("expected ready");
    expect(result.direction).toBe("under");
    expect(result.percent).toBe(150);
  });

  it("is not dragged by a single runaway session", () => {
    const rows = [
      ...Array.from({ length: MIN_SAMPLES }, () => chain(30, 33)).flat(),
      // Forgot to stop the timer: four hours on a 30-minute estimate.
      ...chain(30, 240),
    ];
    const result = computeCalibration(rows);
    if (result.kind !== "ready") throw new Error("expected ready");
    // A mean would be dragged well past 1.5 by that one row.
    expect(result.ratio).toBeLessThan(1.2);
  });

  it("calls near-accurate estimates accurate rather than inventing a bias", () => {
    const rows = Array.from({ length: MIN_SAMPLES }, () => chain(30, 31)).flat();
    const result = computeCalibration(rows);
    if (result.kind !== "ready") throw new Error("expected ready");
    expect(result.direction).toBe("accurate");
  });
});

describe("suggestEstimate", () => {
  it("offers nothing without enough history", () => {
    expect(
      suggestEstimate({ kind: "insufficient", samples: 3, needed: 10 }, 30),
    ).toBeNull();
  });

  it("snaps a corrected estimate to an offerable chip", () => {
    const calibration = {
      kind: "ready" as const,
      samples: 12,
      ratio: 1.5,
      direction: "under" as const,
      percent: 50,
    };
    expect(suggestEstimate(calibration, 30)).toBe(45);
  });

  it("offers nothing when the correction lands back on the same chip", () => {
    const calibration = {
      kind: "ready" as const,
      samples: 12,
      ratio: 1.05,
      direction: "accurate" as const,
      percent: 5,
    };
    expect(suggestEstimate(calibration, 30)).toBeNull();
  });
});
