"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import {
  appendSession,
  listSessions,
  listSessionsOnServer,
  loadPresetId,
  localDayOf,
  newSessionId,
  savePresetId,
  subscribeToSessions,
  toLocalWallClock,
  toStoredSession,
} from "@/lib/storage/sessions";
import { PRESETS } from "@/lib/timer/presets";
import type { CompletedSession } from "@/lib/timer/types";
import { useTimer } from "@/lib/timer/useTimer";

import { CloseOut } from "./CloseOut";
import { EstimateChips } from "./EstimateChips";
import { IntentionField } from "./IntentionField";
import { TimeDisplay } from "./TimeDisplay";

const buttonBase =
  "rounded-lg px-6 py-3 text-base font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

const DAILY_GOAL = 4;

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

  const { state, dispatch, remainingMs } = useTimer({ onSessionEnd });
  const now = () => Date.now();

  // The last-used preset is a better default than any picker default. Applied
  // once on mount, via dispatch rather than setState, so it is not a cascading
  // render.
  useEffect(() => {
    const saved = loadPresetId();
    if (saved) dispatch({ type: "SET_PRESET", presetId: saved });
  }, [dispatch]);

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
    // The estimate is never carried onto a continuation — the chain is what
    // relates them, and re-stating it would count the same estimate twice.
    dispatch({ type: "SET_ESTIMATE", minutes: null, source: null });
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
            suggested={state.suggestedEstimateMinutes}
            onChange={(minutes, source) =>
              dispatch({ type: "SET_ESTIMATE", minutes, source })
            }
          />
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

      <TimeDisplay remainingMs={remainingMs} muted={state.phase === "break"} />

      {state.phase === "break" && closeOutOpen ? (
        <CloseOut
          intention={state.intention}
          onDone={() => finishCloseOut(false)}
          onStillGoing={() => finishCloseOut(true)}
        />
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

        {state.phase === "break" ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "SKIP", now: now() })}
            className={`${buttonBase} bg-surface text-muted hover:text-text`}
          >
            Back to work early
          </button>
        ) : null}
      </div>

      {/* Goal-relative, never a bare count. Zero is an invitation. */}
      <p className="text-sm text-muted">
        {doneToday === 0
          ? "No blocks yet today — start when you're ready."
          : `${doneToday} of your ${DAILY_GOAL} today`}
      </p>
    </div>
  );
}
