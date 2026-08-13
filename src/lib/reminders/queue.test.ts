import { describe, expect, it } from "vitest";

import {
  STALE_AFTER_MS,
  clearForFocus,
  emptyQueue,
  mayInterrupt,
  raise,
  releaseForBreak,
} from "./queue";

const T0 = 1_770_000_000_000;

describe("nothing interrupts a focus block", () => {
  it("refuses to interrupt during focus", () => {
    expect(mayInterrupt("focus")).toBe(false);
  });

  it("refuses to interrupt during a break too", () => {
    // The break screen shows its one nudge as part of its own content. A
    // separate popup on top of it is still an interruption.
    expect(mayInterrupt("break")).toBe(false);
  });

  it("allows it when idle", () => {
    expect(mayInterrupt("idle")).toBe(true);
  });

  it("queues rather than drops when raised mid-focus", () => {
    const state = raise(emptyQueue, "stretch", T0, "focus");
    expect(state.pending).toHaveLength(1);
    expect(state.released).toBeNull();
  });
});

describe("at most one nudge per break", () => {
  it("releases exactly one when several are queued", () => {
    let state = raise(emptyQueue, "stretch", T0, "focus");
    state = raise(state, "hydration", T0 + 1000, "focus");
    const released = releaseForBreak(state, T0 + 2000, {
      behindOnHydration: false,
    });
    expect(released.released).not.toBeNull();
    expect(released.pending).toHaveLength(0);
  });

  it("prefers hydration when the user is behind on it", () => {
    let state = raise(emptyQueue, "stretch", T0, "focus");
    state = raise(state, "hydration", T0 + 1000, "focus");
    expect(
      releaseForBreak(state, T0 + 2000, { behindOnHydration: true }).released
        ?.kind,
    ).toBe("hydration");
  });

  it("otherwise prefers stretch", () => {
    let state = raise(emptyQueue, "hydration", T0, "focus");
    state = raise(state, "stretch", T0 + 1000, "focus");
    expect(
      releaseForBreak(state, T0 + 2000, { behindOnHydration: false }).released
        ?.kind,
    ).toBe("stretch");
  });

  it("never stacks duplicates of one kind", () => {
    let state = raise(emptyQueue, "stretch", T0, "focus");
    state = raise(state, "stretch", T0 + 60_000, "focus");
    expect(state.pending).toHaveLength(1);
  });
});

describe("the queue holds intent, not history", () => {
  it("drops a nudge raised too long ago", () => {
    const state = raise(emptyQueue, "stretch", T0, "focus");
    const released = releaseForBreak(state, T0 + STALE_AFTER_MS + 1, {
      behindOnHydration: false,
    });
    expect(released.released).toBeNull();
  });

  it("is emptied at the start of the next focus block", () => {
    expect(clearForFocus()).toEqual(emptyQueue);
  });

  it("does not re-serve the same nudge at a second break", () => {
    // The failure this guards: `pending` was never cleared, so one stretch
    // reminder was released at break after break. Then it aged past
    // STALE_AFTER_MS, and because `raise` dedupes by kind it blocked every
    // replacement — stretch reminders stopped for good after ~90 minutes.
    const raised = raise(emptyQueue, "stretch", T0, "focus");

    const firstBreak = releaseForBreak(raised, T0 + 20 * 60_000, {
      behindOnHydration: false,
    });
    expect(firstBreak.released?.kind).toBe("stretch");

    // The app clears the queue when the next focus block starts, which is the
    // only way into `focus` — focus never auto-starts.
    const afterStart = clearForFocus();
    const secondBreak = releaseForBreak(afterStart, T0 + 60 * 60_000, {
      behindOnHydration: false,
    });
    expect(secondBreak.released).toBeNull();

    // And a fresh reminder can still be raised, rather than being blocked by a
    // stale resident entry.
    const later = raise(afterStart, "stretch", T0 + 70 * 60_000, "focus");
    expect(
      releaseForBreak(later, T0 + 80 * 60_000, { behindOnHydration: false })
        .released?.kind,
    ).toBe("stretch");
  });
});
