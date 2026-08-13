"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  CONTINUATION_MAX_AGE_MS,
  appendSession,
  listSessions,
  loadTimerSnapshot,
  saveTimerSnapshot,
  listSessionsOnServer,
  loadPresetId,
  localDayOf,
  newSessionId,
  savePresetId,
  setTaskCompleted,
  subscribeToSessions,
  toLocalWallClock,
  toStoredSession,
} from "@/lib/storage/sessions";
import {
  computeCalibration,
  describeCalibration,
  suggestEstimate,
} from "@/lib/calibration/engine";
import { behindOnHydration } from "@/lib/reminders/content";
import { raise, releaseForBreak, type Nudge } from "@/lib/reminders/queue";
import { PRESETS } from "@/lib/timer/presets";
import type { CompletedSession } from "@/lib/timer/types";
import { useTimer } from "@/lib/timer/useTimer";

import { BreakScreen } from "../break/BreakScreen";
import { CloseOut } from "./CloseOut";
import { EstimateChips } from "./EstimateChips";
import { IntentionField } from "./IntentionField";
import { TimeDisplay } from "./TimeDisplay";

const buttonBase =
  "rounded-lg px-6 py-3 text-base font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const DAILY_GOAL = 4;

/** 30 minutes was deskflo's most-chosen stretch interval. */
const STRETCH_INTERVAL_MS = 30 * 60 * 1000;

export function TimerScreen() {
  const sessions = useSyncExternalStore(
    subscribeToSessions,
    listSessions,
    listSessionsOnServer,
  );
  const [closeOutOpen, setCloseOutOpen] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  /** Set by "Still going" — the next block continues this one. */
  const [continuesFrom, setContinuesFrom] = useState<string | null>(null);

  /**
   * Latched when the restore has *completed*, and it gates both reading and
   * writing.
   *
   * Two mistakes are easy here and both silently lose a running block:
   *   * Gating the persist effect on anything set earlier than this — it then
   *     fires on the same commit the restore is scheduled on and overwrites
   *     the snapshot with the initial idle state before it is read.
   *   * Latching on "started" instead of "finished" — StrictMode mounts twice,
   *     the cleanup cancels the first scheduled read, and the second pass
   *     skips scheduling because the flag is already set, so the restore never
   *     runs at all.
   */
  const hydrated = useRef(false);

  const onSessionEnd = useCallback(
    (session: CompletedSession) => {
      const id = newSessionId();
      const stored = toStoredSession(session, {
        id,
        continuedFromSessionId: continuesFrom,
        device: null,
      });
      appendSession(stored);
      setLastSessionId(id);
      setContinuesFrom(null);
      // Only offer the close-out for a block that actually ran its course.
      if (session.outcome === "completed") setCloseOutOpen(true);
    },
    [continuesFrom],
  );

  const { state, dispatch, remainingMs, totalMs } = useTimer({ onSessionEnd });
  const now = () => Date.now();

  // Nudges raised during a focus block. Held, never shown mid-focus.
  const [pending, setPending] = useState<Nudge[]>([]);
  const [glasses, setGlasses] = useState(0);

  function logWater() {
    // Logging is always available, in every phase — it is a two-second
    // self-initiated act, not an interruption (§6). Only *prompting* is gated.
    setGlasses((count) => count + 1);
  }

  // A stretch reminder raises itself on an interval. It can only ever enqueue:
  // `raise` is a no-op outside a running cycle and never surfaces anything.
  useEffect(() => {
    if (state.phase !== "focus") return;
    const id = window.setInterval(
      () =>
        setPending(
          (current) =>
            raise({ pending: current, released: null }, "stretch", Date.now(), "focus")
              .pending,
        ),
      STRETCH_INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [state.phase]);

  // Clearing the estimate belongs here, not in the close-out. Every exit that
  // skipped the close-out — ended early, back to work early, navigated away —
  // used to leave the estimate set, so the next block recorded it a second
  // time. One estimate by the user became N independent estimates in storage,
  // inflating D-06's take-up rate and feeding D-09 duplicates.
  useEffect(() => {
    if (state.phase === "break") {
      dispatch({ type: "SET_ESTIMATE", minutes: null, source: null });
    }
  }, [state.phase, dispatch]);

  // Restore a block that was in flight when the page went away, then let
  // wall-clock decide what happened while it was gone.
  useEffect(() => {
    if (hydrated.current) return;

    // Deferred by a tick: localStorage is an external system being read, and
    // reading it in the effect body is a cascading render. Also keeps the
    // server and first client render identical, so there is nothing to
    // mismatch on hydration.
    const id = window.setTimeout(() => {
      const snapshot = loadTimerSnapshot();
      if (!snapshot) {
        const saved = loadPresetId();
        if (saved) dispatch({ type: "SET_PRESET", presetId: saved });
        hydrated.current = true;
        return;
      }

      dispatch({ type: "RESTORE", state: snapshot.timer as typeof state });
      dispatch({ type: "SYNC", now: Date.now() });
      setLastSessionId(snapshot.lastSessionId);
      setCloseOutOpen(snapshot.closeOutOpen);
      setContinuesFrom(
        Date.now() - snapshot.savedAt <= CONTINUATION_MAX_AGE_MS
          ? snapshot.continuesFrom
          : null,
      );
      hydrated.current = true;
    }, 0);

    return () => window.clearTimeout(id);
  }, [dispatch]);

  // Persist after every change, so the worst case is losing the last moment
  // rather than the whole block.
  useEffect(() => {
    if (!hydrated.current) return;
    saveTimerSnapshot({
      timer: state,
      continuesFrom,
      lastSessionId,
      closeOutOpen,
      savedAt: Date.now(),
    });
  }, [state, continuesFrom, lastSessionId, closeOutOpen]);

  /*
   * Derived, not stored. The nudge shown on a break is a pure function of what
   * was queued and when the break began — so it is computed, not written by an
   * effect. Anchoring it to the break's start rather than `Date.now()` also
   * makes it stable for the whole break: at most one nudge, and it does not
   * change under the user mid-break.
   */
  const breakStartedAt =
    state.phase === "break" && state.targetAt !== null
      ? state.targetAt - totalMs
      : 0;
  const releasedNudge =
    state.phase === "break"
      ? releaseForBreak({ pending, released: null }, breakStartedAt, {
          behindOnHydration: behindOnHydration(glasses, new Date().getHours()),
        }).released
      : null;

  const calibration = computeCalibration(sessions);
  const calibrationNote = describeCalibration(calibration);
  const suggested =
    state.estimateMinutes !== null
      ? suggestEstimate(calibration, state.estimateMinutes)
      : null;

  // What the block that just ended actually cost, against what was predicted.
  const lastSession = lastSessionId
    ? sessions.find((session) => session.id === lastSessionId)
    : undefined;

  const today = toLocalWallClock(new Date()).slice(0, 10);
  const doneToday = sessions.filter(
    (session) => localDayOf(session) === today && session.outcome === "completed",
  ).length;

  function choosePreset(presetId: string) {
    dispatch({ type: "SET_PRESET", presetId });
    savePresetId(presetId);
  }

  function finishCloseOut(stillGoing: boolean) {
    setCloseOutOpen(false);
    // Recorded against the block that just ended. Without it, calibration
    // cannot tell "took 20 minutes" from "gave up after 20 minutes".
    if (lastSessionId) setTaskCompleted(lastSessionId, !stillGoing);
    if (stillGoing) {
      setContinuesFrom(lastSessionId);
    } else {
      dispatch({ type: "SET_INTENTION", intention: "" });
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
      <p aria-live="polite" className="sr-only">
        {state.phase === "focus"
          ? "Focus block running"
          : state.phase === "break"
            ? "Break started"
            : "Ready"}
      </p>

      {state.breakEndedWhileAway ? (
        <p className="rounded-lg bg-surface px-4 py-3 text-sm text-text">
          Break&rsquo;s over — ready when you are.
        </p>
      ) : null}

      {state.phase === "idle" ? (
        <>
          <IntentionField
            value={state.intention}
            onChange={(intention) =>
              dispatch({ type: "SET_INTENTION", intention })
            }
            autoFocus={state.breakEndedWhileAway}
          />
          <EstimateChips
            value={state.estimateMinutes}
            suggested={suggested}
            onChange={(minutes, source) => {
              dispatch({ type: "SET_ESTIMATE", minutes, source });
              // Recorded whether or not it is taken, so "are our suggestions
              // any good?" stays answerable later.
              dispatch({ type: "SUGGEST_ESTIMATE", minutes: suggested });
            }}
          />

          {calibrationNote ? (
            <p className="w-full text-sm text-muted">{calibrationNote}</p>
          ) : null}
          <fieldset className="flex flex-wrap justify-center gap-2">
            <legend className="sr-only">Block length</legend>
            {PRESETS.map((preset) => {
              const selected = preset.id === state.presetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => choosePreset(preset.id)}
                  className={`rounded-full px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent ${
                    selected
                      ? "bg-accent text-bg"
                      : "bg-surface text-muted hover:text-text"
                  }`}
                >
                  {preset.label} {preset.focusMinutes}
                </button>
              );
            })}
          </fieldset>
        </>
      ) : null}

      {state.phase === "focus" && state.intention ? (
        <p className="text-center text-base text-muted">
          This session you&rsquo;ll{" "}
          <span className="text-text">{state.intention}</span>
        </p>
      ) : null}

      {state.phase === "break" ? (
        <BreakScreen
          remainingMs={remainingMs}
          nudge={releasedNudge}
          onLogWater={logWater}
          onBackToWork={() => dispatch({ type: "SKIP", now: now() })}
        >
          {closeOutOpen ? (
            <CloseOut
              intention={state.intention}
              onDone={() => finishCloseOut(false)}
              onStillGoing={() => finishCloseOut(true)}
            />
          ) : null}
        </BreakScreen>
      ) : (
        <TimeDisplay remainingMs={remainingMs} />
      )}

      {/* "You said 30. It took 55." — stated flatly, no judgement attached. */}
      {state.phase === "break" &&
      lastSession?.estimateMinutes != null &&
      lastSession.continuedFromSessionId === null ? (
        <p className="text-center text-base text-muted">
          You said {lastSession.estimateMinutes} min. It took{" "}
          <span className="text-text">
            {Math.max(1, Math.round(lastSession.servedSeconds / 60))} min
          </span>
          .
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {state.phase === "idle" ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "START_FOCUS", now: now() })}
            className={`${buttonBase} bg-accent text-bg`}
          >
            Start
          </button>
        ) : null}

        {state.phase === "focus" ? (
          <>
            <button
              type="button"
              onClick={() =>
                dispatch(
                  state.running
                    ? { type: "PAUSE", now: now() }
                    : { type: "RESUME", now: now() },
                )
              }
              className={`${buttonBase} bg-accent text-bg`}
            >
              {state.running ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "SKIP", now: now() })}
              className={`${buttonBase} bg-surface text-muted hover:text-text`}
            >
              End early
            </button>
          </>
        ) : null}

      </div>

      {/*
        Goal-relative, never a bare count. Zero is an invitation.

        Hidden during a break: break-mode.md §4 lists session counts among the
        things the break screen must not gain, because a progress panel is more
        directed attention during the one interval that exists to reduce it.
      */}
      {state.phase !== "break" ? (
        <p className="text-sm text-muted">
          {doneToday === 0
            ? "No blocks yet today — start when you're ready."
            : `${doneToday} of your ${DAILY_GOAL} today`}
        </p>
      ) : null}
    </div>
  );
}
