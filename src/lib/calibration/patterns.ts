import type { StoredSession } from "@/lib/storage/sessions";

/**
 * "Your Tuesday afternoons are your worst."
 *
 * This is the reason `local_tz` and `local_started_at` are in the schema — the
 * question is about the clock on the user's wall, and a UTC timestamp cannot
 * answer it after the fact.
 *
 * Quiet and honest by construction: a bucket needs real evidence before it is
 * named, and if nothing stands out the answer is that nothing stands out.
 */

/** A named bucket needs at least this many sessions before it is worth stating. */
export const MIN_BUCKET_SESSIONS = 4;
/** And the whole week needs this much before any comparison is meaningful. */
export const MIN_TOTAL_SESSIONS = 12;

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type PartOfDay = "morning" | "afternoon" | "evening";

export type Bucket = {
  day: number;
  part: PartOfDay;
  label: string;
  sessions: number;
  completionRate: number;
};

export function partOfDay(hour: number): PartOfDay {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function bucketOf(session: StoredSession) {
  // Parsed as local components deliberately — `new Date(string)` on a bare
  // wall-clock string is implementation-defined, and getting it wrong would
  // silently shift sessions into the neighbouring bucket.
  const [datePart, timePart] = session.localStartedAt.split("T");
  const [year, month, date] = datePart.split("-").map(Number);
  const hour = Number(timePart.slice(0, 2));
  const day = new Date(year, month - 1, date).getDay();
  return { day, part: partOfDay(hour) };
}

export function buildBuckets(sessions: StoredSession[]): Bucket[] {
  const map = new Map<string, { day: number; part: PartOfDay; total: number; completed: number }>();

  for (const session of sessions) {
    const { day, part } = bucketOf(session);
    const key = `${day}-${part}`;
    const entry = map.get(key) ?? { day, part, total: 0, completed: 0 };
    entry.total += 1;
    if (session.outcome === "completed") entry.completed += 1;
    map.set(key, entry);
  }

  return [...map.values()].map((entry) => ({
    day: entry.day,
    part: entry.part,
    label: `${DAYS[entry.day]} ${entry.part}s`,
    sessions: entry.total,
    completionRate: entry.completed / entry.total,
  }));
}

export type Insight =
  | { kind: "not-enough"; sessions: number; needed: number }
  | { kind: "nothing-stands-out" }
  | { kind: "pattern"; worst: Bucket; overall: number; text: string };

/**
 * The weekly insight, or an honest statement that there isn't one.
 *
 * Only the *worst* bucket is reported, and only when it is clearly worse than
 * the user's own baseline. There is no ranking against anyone else, and no
 * score — that is a guardrail, not an omission.
 */
export function weeklyInsight(sessions: StoredSession[]): Insight {
  if (sessions.length < MIN_TOTAL_SESSIONS) {
    return {
      kind: "not-enough",
      sessions: sessions.length,
      needed: MIN_TOTAL_SESSIONS,
    };
  }

  const overall =
    sessions.filter((session) => session.outcome === "completed").length /
    sessions.length;

  const candidates = buildBuckets(sessions).filter(
    (bucket) => bucket.sessions >= MIN_BUCKET_SESSIONS,
  );
  if (candidates.length < 2) return { kind: "nothing-stands-out" };

  const worst = candidates.reduce((lowest, bucket) =>
    bucket.completionRate < lowest.completionRate ? bucket : lowest,
  );

  // A bucket has to be meaningfully below the user's own baseline before it is
  // worth telling them about. 15 points is a judgement call, not a result.
  if (worst.completionRate > overall - 0.15) {
    return { kind: "nothing-stands-out" };
  }

  return {
    kind: "pattern",
    worst,
    overall,
    text: `${worst.label} are where your blocks are least likely to run their course — ${Math.round(
      worst.completionRate * 100,
    )}% against your usual ${Math.round(overall * 100)}%.`,
  };
}
