"use client";

import { PRESETS } from "@/lib/timer/presets";
import { useTimer } from "@/lib/timer/useTimer";

import { TimeDisplay } from "./TimeDisplay";

const buttonBase =
  "rounded-lg px-6 py-3 text-base font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg";

export function TimerScreen() {
  const { state, dispatch, remainingMs } = useTimer();
  const now = () => Date.now();

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-8">
      {/*
        Phase changes are announced once, politely. This is the element that
        speaks — never the countdown.
      */}
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
        <fieldset className="flex flex-wrap justify-center gap-2">
          <legend className="sr-only">Block length</legend>
          {PRESETS.map((preset) => {
            const selected = preset.id === state.presetId;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  dispatch({ type: "SET_PRESET", presetId: preset.id })
                }
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
      ) : null}

      <TimeDisplay remainingMs={remainingMs} muted={state.phase === "break"} />

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
        {state.completedFocusCount === 0
          ? "No blocks yet today — start when you're ready."
          : `${state.completedFocusCount} of your 4 today`}
      </p>
    </div>
  );
}
