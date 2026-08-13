import type { StoredSession } from "@/lib/storage/sessions";

/**
 * Estimate vs actual, as plain local statistics. No model, no server, no
 * inference — just what the user said against what happened.
 *
 * The number this produces is the moat, so the rules about when *not* to
 * produce one matter more than the arithmetic.
 */

/** Below this, say nothing. A confident wrong number is worse than silence. */
export const MIN_SAMPLES = 10;

export type Chain = {
  headId: string;
  estimateMinutes: number;
  servedMinutes: number;
  finished: boolean;
};

export type Calibration =
  | { kind: "insufficient"; samples: number; needed: number }
  | {
      kind: "ready";
      samples: number;
      /** Median served ÷ estimated. 1.45 means work takes 45% longer. */
      ratio: number;
      direction: "under" | "over" | "accurate";
      /** Percent to state in copy, always positive. */
      percent: number;
    };

/**
 * Rebuilds chains of blocks joined by "Still going".
 *
 * A chain is one piece of work: the estimate lives on its head and the served
 * time is the sum of every block in it. Treating the blocks separately is the
 * specific error that inverts the sign of the result — three 25-minute blocks
 * against one 30-minute estimate is a 150% underestimate, not three sessions
 * that each came in comfortably early.
 */
export function buildChains(sessions: StoredSession[]): Chain[] {
  const byId = new Map(sessions.map((session) => [session.id, session]));
  const continuationOf = new Map<string, StoredSession[]>();

  for (const session of sessions) {
    const parent = session.continuedFromSessionId;
    if (!parent) continue;
    const existing = continuationOf.get(parent);
    if (existing) existing.push(session);
    else continuationOf.set(parent, [session]);
  }

  const heads = sessions.filter(
    (session) =>
      session.continuedFromSessionId === null ||
      !byId.has(session.continuedFromSessionId),
  );

  const chains: Chain[] = [];

  for (const head of heads) {
    let servedSeconds = 0;
    let last = head;
    const seen = new Set<string>();

    // Walk the chain. `seen` guards against a cycle in corrupt data — an
    // infinite loop here would hang the page that renders it.
    let current: StoredSession | undefined = head;
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      servedSeconds += current.servedSeconds;
      last = current;
      current = continuationOf.get(current.id)?.[0];
    }

    chains.push({
      headId: head.id,
      estimateMinutes: head.estimateMinutes ?? 0,
      servedMinutes: servedSeconds / 60,
      // Only a chain the user actually finished measures estimation error. One
      // they gave up on served less than estimated and would read as
      // over-estimation.
      finished: last.taskCompleted === true,
    });
  }

  return chains;
}

/**
 * Chains eligible to inform the bias number.
 *
 * Excluded: unfinished work, chains with no estimate, and estimates that came
 * from Delva's own suggestion — accepting a suggestion is not an independent
 * guess, and feeding it back would make calibration converge on its own output.
 */
export function calibrationSamples(sessions: StoredSession[]): Chain[] {
  const byId = new Map(sessions.map((session) => [session.id, session]));
  return buildChains(sessions).filter((chain) => {
    const head = byId.get(chain.headId);
    if (!head || head.estimateMinutes === null) return false;
    if (head.estimateSource === "suggested") return false;
    if (!chain.finished) return false;
    return chain.servedMinutes > 0;
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

/**
 * Median rather than mean, deliberately. One session that ran four hours long
 * because the user forgot to stop the timer would drag a mean badly, and with
 * ten samples there is no room to absorb that.
 */
export function computeCalibration(sessions: StoredSession[]): Calibration {
  const samples = calibrationSamples(sessions);

  if (samples.length < MIN_SAMPLES) {
    return {
      kind: "insufficient",
      samples: samples.length,
      needed: MIN_SAMPLES,
    };
  }

  const ratio = median(
    samples.map((chain) => chain.servedMinutes / chain.estimateMinutes),
  );

  // Within 10% either way is not a bias worth naming.
  const direction =
    ratio > 1.1 ? "under" : ratio < 0.9 ? "over" : "accurate";
  const percent = Math.round(Math.abs(ratio - 1) * 100);

  return { kind: "ready", samples: samples.length, ratio, direction, percent };
}

const CHIPS = [15, 30, 45, 60, 90];

/**
 * A corrected estimate, offered as a default the user can override — never an
 * imposition, and never silently substituted for what they said.
 */
export function suggestEstimate(
  calibration: Calibration,
  ownEstimateMinutes: number,
): number | null {
  if (calibration.kind !== "ready") return null;
  if (calibration.direction === "accurate") return null;

  const corrected = ownEstimateMinutes * calibration.ratio;
  const snapped = CHIPS.reduce((best, chip) =>
    Math.abs(chip - corrected) < Math.abs(best - corrected) ? chip : best,
  );
  return snapped === ownEstimateMinutes ? null : snapped;
}

/** Plain-language phrasing. Descriptive, never a scolding. */
export function describeCalibration(calibration: Calibration): string | null {
  if (calibration.kind === "insufficient") return null;
  if (calibration.direction === "accurate") {
    return "Your estimates are landing close to reality.";
  }
  return calibration.direction === "under"
    ? `Work tends to take you about ${calibration.percent}% longer than you expect.`
    : `You tend to finish in about ${calibration.percent}% less time than you expect.`;
}
