import { describe, expect, it } from "vitest";

import type { StoredSession } from "@/lib/storage/sessions";

import { MIN_TOTAL_SESSIONS, partOfDay, weeklyInsight } from "./patterns";

let seq = 0;

function at(
  localStartedAt: string,
  outcome: StoredSession["outcome"] = "completed",
): StoredSession {
  seq += 1;
  return {
    id: `p${seq}`,
    presetId: "classic",
    plannedFocusSeconds: 1500,
    servedSeconds: 1500,
    pausedSeconds: 0,
    outcome,
    intention: "",
    estimateMinutes: null,
    estimateSource: null,
    suggestedEstimateMinutes: null,
    continuedFromSessionId: null,
    taskCompleted: null,
    startedAt: "2026-08-03T12:00:00.000Z",
    endedAt: "2026-08-03T12:25:00.000Z",
    localTz: "America/Edmonton",
    localStartedAt,
    device: null,
    syncedAt: null,
  };
}

describe("partOfDay", () => {
  it("splits at noon and 5pm", () => {
    expect(partOfDay(11)).toBe("morning");
    expect(partOfDay(12)).toBe("afternoon");
    expect(partOfDay(16)).toBe("afternoon");
    expect(partOfDay(17)).toBe("evening");
  });
});

describe("weeklyInsight", () => {
  it("stays quiet without enough history", () => {
    const sessions = Array.from({ length: MIN_TOTAL_SESSIONS - 1 }, () =>
      at("2026-08-03T09:00:00"),
    );
    expect(weeklyInsight(sessions).kind).toBe("not-enough");
  });

  it("says nothing stands out when nothing does", () => {
    // 2026-08-03 is a Monday; 2026-08-04 a Tuesday.
    const sessions = [
      ...Array.from({ length: 8 }, () => at("2026-08-03T09:00:00")),
      ...Array.from({ length: 8 }, () => at("2026-08-04T14:00:00")),
    ];
    expect(weeklyInsight(sessions).kind).toBe("nothing-stands-out");
  });

  it("names the worst bucket in the user's own wall-clock terms", () => {
    const sessions = [
      // Monday mornings: 8 of 8 complete.
      ...Array.from({ length: 8 }, () => at("2026-08-03T09:00:00")),
      // Tuesday afternoons: 1 of 8 complete.
      at("2026-08-04T14:00:00"),
      ...Array.from({ length: 7 }, () => at("2026-08-04T14:00:00", "abandoned")),
    ];
    const insight = weeklyInsight(sessions);
    expect(insight.kind).toBe("pattern");
    if (insight.kind !== "pattern") return;
    expect(insight.worst.label).toBe("Tuesday afternoons");
    expect(insight.text).toContain("Tuesday afternoons");
  });

  it("ignores buckets too thin to mean anything", () => {
    const sessions = [
      ...Array.from({ length: 12 }, () => at("2026-08-03T09:00:00")),
      // A single bad Friday evening is not a pattern.
      at("2026-08-07T19:00:00", "abandoned"),
    ];
    expect(weeklyInsight(sessions).kind).toBe("nothing-stands-out");
  });
});
