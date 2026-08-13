"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { initialState, intervalMs, reduce, remainingMs } from "./machine";
import { DEFAULT_PRESET_ID } from "./presets";
import type { CompletedSession, TimerEvent, TimerState } from "./types";

type Handlers = {
  onSessionEnd?: (session: CompletedSession) => void;
  onBreakSkip?: (remainingMs: number) => void;
};

/**
 * Emissions live in state, not in a ref written from the reducer.
 *
 * The reducer has to stay pure: React may invoke it twice for the same event
 * (StrictMode, and again on replay), and a reducer that pushed onto a ref would
 * report the same finished block twice — writing a duplicate row into the data
 * the whole moat is built on. Parking them in state and draining them in an
 * effect makes double invocation harmless.
 */
type Store = {
  timer: TimerState;
  outbox: {
    completed: CompletedSession[];
    skips: number[];
  };
};

type StoreEvent = TimerEvent | { type: "DRAIN" };

function storeReducer(store: Store, event: StoreEvent): Store {
  if (event.type === "DRAIN") {
    if (!store.outbox.completed.length && !store.outbox.skips.length) {
      return store;
    }
    return { ...store, outbox: { completed: [], skips: [] } };
  }

  const { state, completed, breakSkipped } = reduce(store.timer, event);
  if (state === store.timer && !completed && !breakSkipped) return store;

  return {
    timer: state,
    outbox:
      completed || breakSkipped
        ? {
            completed: completed
              ? [...store.outbox.completed, completed]
              : store.outbox.completed,
            skips: breakSkipped
              ? [...store.outbox.skips, breakSkipped.remainingMs]
              : store.outbox.skips,
          }
        : store.outbox,
  };
}

/**
 * Remaining time before the clock is known — i.e. on the server and on the
 * very first client render. Reading `Date.now()` during render would produce a
 * hydration mismatch as well as an impure render, and there is nothing to
 * mismatch about: a block only ever starts from a user interaction, so the
 * pre-hydration state is always the full, unstarted interval.
 */
function staticRemainingMs(state: TimerState): number {
  if (state.phase === "idle") return intervalMs(state);
  if (!state.running) return state.remainingAtPause ?? 0;
  return intervalMs(state);
}

export function useTimer(handlers: Handlers = {}) {
  const [store, dispatch] = useReducer(storeReducer, undefined, () => ({
    timer: initialState(DEFAULT_PRESET_ID),
    outbox: { completed: [], skips: [] },
  }));

  const { timer } = store;

  // 0 means "clock not yet known" — see staticRemainingMs.
  const [now, setNow] = useState(0);

  const handlersRef = useRef<Handlers>(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const sync = useCallback(() => {
    const at = Date.now();
    setNow(at);
    dispatch({ type: "SYNC", now: at });
  }, []);

  useEffect(() => {
    const { completed, skips } = store.outbox;
    if (!completed.length && !skips.length) return;
    for (const session of completed) handlersRef.current.onSessionEnd?.(session);
    for (const remaining of skips) handlersRef.current.onBreakSkip?.(remaining);
    dispatch({ type: "DRAIN" });
  }, [store.outbox]);

  // Establish the clock once mounted, then keep the display fresh. This only
  // ever moves the *display*: remaining time is recomputed from `targetAt`, so
  // a throttled tab loses frames, never time.
  useEffect(() => {
    let interval: number | undefined;
    // Deferred rather than set synchronously: the clock is an external system
    // being read, and reading it during the effect body is a cascading render.
    const start = window.setTimeout(() => {
      setNow(Date.now());
      if (timer.running) {
        interval = window.setInterval(() => setNow(Date.now()), 250);
      }
    }, 0);

    return () => {
      window.clearTimeout(start);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [timer.running]);

  // Expiry and catch-up. SYNC is a no-op unless the interval has actually run
  // out, so it is safe to fire liberally.
  useEffect(() => {
    if (!timer.running || timer.targetAt === null) return;

    const id = window.setTimeout(sync, Math.max(0, timer.targetAt - Date.now()) + 50);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") sync();
    };
    // Not gated on visibilityState. If the window has focus the user is here,
    // whatever the visibility API claims — and SYNC is a no-op unless the
    // interval has actually expired, so an extra call costs nothing.
    const onFocus = () => sync();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearTimeout(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [timer.running, timer.targetAt, sync]);

  const remaining = now > 0 ? remainingMs(timer, now) : staticRemainingMs(timer);
  const total = intervalMs(timer);

  return {
    state: timer,
    dispatch: dispatch as (event: TimerEvent) => void,
    remainingMs: remaining,
    totalMs: total,
    progress: total > 0 ? 1 - remaining / total : 0,
  };
}
