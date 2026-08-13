import type { Phase } from "@/lib/timer/types";

/**
 * The reminder queue.
 *
 * The rule this exists to enforce: **nothing may interrupt a focus block.** Not
 * a modal, not a notification, not a toast. A reminder that fires during
 * `focus` is enqueued and released at the next break — and even then, at most
 * one (docs/design/break-mode.md §3).
 *
 * Suppression alone is not a design: a 50-minute block can accumulate several
 * nudges, and releasing them all at the boundary just relocates the
 * interruption to the one interval that exists to recover from interruption.
 */

export type NudgeKind = "hydration" | "stretch";

export type Nudge = {
  kind: NudgeKind;
  /** When it was raised, so stale intent can be dropped. */
  raisedAt: number;
};

export type QueueState = {
  pending: Nudge[];
  /** Released this break. At most one, ever. */
  released: Nudge | null;
};

export const emptyQueue: QueueState = { pending: [], released: null };

/**
 * A nudge raised more than one block ago is intent, not history — it is
 * dropped rather than shown late. §3.3.
 */
export const STALE_AFTER_MS = 90 * 60 * 1000;

export function raise(
  state: QueueState,
  kind: NudgeKind,
  now: number,
  phase: Phase,
): QueueState {
  // Outside focus and break there is nothing to protect, so the caller is free
  // to act immediately; queuing is only meaningful mid-cycle.
  if (phase === "idle") return state;

  // Never stack duplicates of the same kind — the second glass of water is not
  // a second reminder.
  if (state.pending.some((nudge) => nudge.kind === kind)) return state;

  return { ...state, pending: [...state.pending, { kind, raisedAt: now }] };
}

/**
 * Release at most one nudge for this break.
 *
 * Priority when both are queued: hydration if the user is behind their daily
 * pace, otherwise stretch. Hydration is the cheaper action and the stickier
 * behaviour — it was deskflo's single most-used feature by a wide margin
 * (392 logs across 38 sessions).
 */
export function releaseForBreak(
  state: QueueState,
  now: number,
  options: { behindOnHydration: boolean },
): QueueState {
  const fresh = state.pending.filter(
    (nudge) => now - nudge.raisedAt <= STALE_AFTER_MS,
  );
  if (fresh.length === 0) return { pending: [], released: null };

  const hydration = fresh.find((nudge) => nudge.kind === "hydration");
  const stretch = fresh.find((nudge) => nudge.kind === "stretch");

  const released =
    options.behindOnHydration && hydration ? hydration : (stretch ?? hydration!);

  return { pending: [], released };
}

/** Cleared at the start of the next focus block. The queue holds intent. */
export function clearForFocus(): QueueState {
  return emptyQueue;
}

/**
 * Whether a reminder may be shown to the user right now, at all.
 *
 * Every surface — modal, banner, browser notification — must ask this first.
 * The notification path especially: a notification escapes the tab, which is
 * worse than a modal, not better.
 */
export function mayInterrupt(phase: Phase): boolean {
  return phase === "idle";
}
