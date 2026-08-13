/**
 * Break content. Deliberately small and plain.
 *
 * No efficacy claims, no "boost your focus by X%", no medical framing. These
 * are suggestions for moving and drinking water, described as exactly that.
 */

export const STRETCHES = [
  "Roll your shoulders back a few times, slowly.",
  "Stand up and reach for the ceiling.",
  "Look at something far away — out a window if there is one.",
  "Turn your head slowly left, then right.",
  "Stand and let your arms hang. Nothing else.",
  "Open your hands wide, then make a loose fist. A few times.",
  "Walk to another room and come back.",
];

export const DEFAULT_BREAK_ACTION = "Look away from the screen for a moment.";

/**
 * Deterministic on the index rather than random, so "show another" moves
 * predictably through the list instead of re-offering what was just rejected.
 * deskflo's random picker produced a spike of people shuffling repeatedly.
 */
export function stretchAt(index: number): string {
  return STRETCHES[((index % STRETCHES.length) + STRETCHES.length) % STRETCHES.length];
}

export const HYDRATION_DAILY_GOAL = 8;

/** Behind pace if fewer glasses than the hours elapsed would suggest. */
export function behindOnHydration(
  glasses: number,
  hour: number,
  goal = HYDRATION_DAILY_GOAL,
): boolean {
  // Waking hours, roughly 8am to 8pm.
  const through = Math.min(1, Math.max(0, (hour - 8) / 12));
  return glasses < Math.floor(through * goal);
}
