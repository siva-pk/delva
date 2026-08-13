import type { CompletedSession, EstimateSource, SessionOutcome } from "@/lib/timer/types";

const KEY = "delva.sessions.v1";
const PRESET_KEY = "delva.preset.v1";

/**
 * A stored session. Deliberately mirrors the `sessions` table column for
 * column, so syncing is a rename and never a reshape — a local record that
 * cannot round-trip to the row is a record that quietly loses a field.
 */
export type StoredSession = {
  id: string;
  presetId: string;
  plannedFocusSeconds: number;
  servedSeconds: number;
  pausedSeconds: number;
  outcome: SessionOutcome;
  intention: string;
  estimateMinutes: number | null;
  estimateSource: EstimateSource | null;
  suggestedEstimateMinutes: number | null;
  continuedFromSessionId: string | null;
  /** "Done" = true, "Still going" = false, never answered = null. */
  taskCompleted: boolean | null;
  /** ISO 8601, UTC. */
  startedAt: string;
  endedAt: string;
  /** IANA zone name, never an offset. */
  localTz: string;
  /** Wall-clock as the user experienced it: YYYY-MM-DDTHH:mm:ss, no zone. */
  localStartedAt: string;
  device: string | null;
  syncedAt: string | null;
};

function pad(value: number, width = 2) {
  return String(value).padStart(width, "0");
}

/**
 * Wall-clock time in the local zone, with no offset attached.
 *
 * Not `toISOString()` — that converts to UTC, which is the one thing this
 * field must not be. "Your Tuesday afternoons" is a question about the clock on
 * the user's wall, and a UTC timestamp cannot answer it after the fact.
 */
export function toLocalWallClock(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** The local day a session belongs to, for grouping history (D-08). */
export function localDayOf(session: StoredSession): string {
  return session.localStartedAt.slice(0, 10);
}

export function toStoredSession(
  session: CompletedSession,
  options: { id: string; continuedFromSessionId: string | null; device: string | null },
): StoredSession {
  const started = new Date(session.startedAt);
  return {
    id: options.id,
    presetId: session.presetId,
    plannedFocusSeconds: session.plannedFocusSeconds,
    servedSeconds: session.servedSeconds,
    pausedSeconds: session.pausedSeconds,
    outcome: session.outcome,
    intention: session.intention,
    estimateMinutes: session.estimateMinutes,
    estimateSource: session.estimateSource,
    suggestedEstimateMinutes: session.suggestedEstimateMinutes,
    continuedFromSessionId: options.continuedFromSessionId,
    taskCompleted: null,
    startedAt: started.toISOString(),
    endedAt: new Date(session.endedAt).toISOString(),
    localTz: localTimezone(),
    localStartedAt: toLocalWallClock(started),
    device: options.device,
    syncedAt: null,
  };
}

function read(): StoredSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredSession[]) : [];
  } catch {
    // Corrupt or unavailable storage must not take the timer down. The user
    // loses history, not the ability to work.
    return [];
  }
}

function write(sessions: StoredSession[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sessions));
  } catch {
    // Quota exceeded or storage disabled (private mode). Same reasoning.
  }
}

/**
 * A tiny external store so React can read localStorage through
 * `useSyncExternalStore` — the supported way to subscribe to something outside
 * React without a cascading setState-in-effect on mount, and with an honest
 * empty snapshot on the server.
 *
 * `getSnapshot` must return a stable reference or React re-renders forever, so
 * the sorted array is cached and only rebuilt on write.
 */
const EMPTY: StoredSession[] = [];
let cache: StoredSession[] | null = null;
const listeners = new Set<() => void>();

function sorted(sessions: StoredSession[]) {
  return [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function subscribeToSessions(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function listSessions(): StoredSession[] {
  if (typeof window === "undefined") return EMPTY;
  cache ??= sorted(read());
  return cache;
}

export function listSessionsOnServer(): StoredSession[] {
  return EMPTY;
}

export function appendSession(session: StoredSession): StoredSession[] {
  const all = read();
  // Idempotent on id, so a double-emit can never duplicate a row.
  if (all.some((existing) => existing.id === session.id)) return listSessions();
  const next = [...all, session];
  write(next);
  cache = sorted(next);
  for (const listener of listeners) listener();
  return cache;
}

/** Records the close-out answer against a session already written. */
export function setTaskCompleted(id: string, taskCompleted: boolean) {
  const all = read();
  const index = all.findIndex((session) => session.id === id);
  if (index === -1) return listSessions();
  const next = [...all];
  next[index] = { ...next[index], taskCompleted };
  write(next);
  cache = sorted(next);
  for (const listener of listeners) listener();
  return cache;
}

export function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const TIMER_KEY = "delva.timer.v1";

/**
 * Everything about a block in flight that would otherwise die with the React
 * tree — which it did, on any refresh or click through to another page, taking
 * the served minutes and the "Still going" link with it.
 */
export type TimerSnapshot = {
  timer: unknown;
  continuesFrom: string | null;
  lastSessionId: string | null;
  closeOutOpen: boolean;
  /** When this was written, so a stale chain link can be expired. */
  savedAt: number;
};

export function saveTimerSnapshot(snapshot: TimerSnapshot) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TIMER_KEY, JSON.stringify(snapshot));
  } catch {
    // Non-fatal: the block keeps running, it just won't survive a reload.
  }
}

export function loadTimerSnapshot(): TimerSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TIMER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TimerSnapshot;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * A "Still going" link is only meaningful for as long as the work plausibly
 * continues. Tap it, walk away, and start something unrelated the next
 * morning, and without this the new block is chained to yesterday's task.
 */
export const CONTINUATION_MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function loadPresetId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PRESET_KEY);
  } catch {
    return null;
  }
}

export function savePresetId(presetId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PRESET_KEY, presetId);
  } catch {
    // Non-fatal.
  }
}

/**
 * Share of sessions carrying an independent estimate — the D-06 take-up rate,
 * and the number that decides whether Phase C is worth having at all.
 *
 * Accepted suggestions are excluded: once Delva proposes a number, taking it is
 * not evidence the user would have estimated unprompted.
 */
export function estimateTakeUpRate(sessions: StoredSession[]): {
  rate: number;
  withEstimate: number;
  total: number;
} {
  const total = sessions.length;
  const withEstimate = sessions.filter(
    (session) =>
      session.estimateMinutes !== null && session.estimateSource !== "suggested",
  ).length;
  return { rate: total === 0 ? 0 : withEstimate / total, withEstimate, total };
}
