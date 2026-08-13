"use client";

import { useSyncExternalStore } from "react";

import {
  estimateTakeUpRate,
  listSessions,
  listSessionsOnServer,
  localDayOf,
  subscribeToSessions,
  type StoredSession,
} from "@/lib/storage/sessions";

function formatServed(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

function formatDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(localStartedAt: string): string {
  const [, time] = localStartedAt.split("T");
  const [hour, minute] = time.split(":").map(Number);
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupByLocalDay(sessions: StoredSession[]) {
  const groups = new Map<string, StoredSession[]>();
  for (const session of sessions) {
    const day = localDayOf(session);
    const existing = groups.get(day);
    if (existing) existing.push(session);
    else groups.set(day, [session]);
  }
  return [...groups.entries()];
}

export function HistoryList() {
  const sessions = useSyncExternalStore(
    subscribeToSessions,
    listSessions,
    listSessionsOnServer,
  );

  if (sessions.length === 0) {
    // Not a cold zero. Nothing here is framed as a shortfall.
    return (
      <p className="text-base text-muted">
        Nothing here yet. Your finished blocks will collect here, grouped by
        day.
      </p>
    );
  }

  const days = groupByLocalDay(sessions);
  const takeUp = estimateTakeUpRate(sessions);

  return (
    <div className="flex flex-col gap-10">
      {/*
        D-06's instrumentation, made observable. Capturing the fields is a
        precondition for instrumenting take-up, not instrumentation — the
        number has to be readable by someone. Local, no analytics call, and not
        blocked by Gate 0.
      */}
      <p className="text-sm text-muted">
        You put a time on {takeUp.withEstimate} of your last {takeUp.total}{" "}
        blocks.
      </p>

      {days.map(([day, daySessions]) => {
        const served = daySessions.reduce(
          (total, session) => total + session.servedSeconds,
          0,
        );
        return (
          <section key={day}>
            <h2 className="text-sm font-medium text-muted">{formatDay(day)}</h2>
            <p className="mt-1 text-base text-text">{formatServed(served)}</p>

            <ul className="mt-4 flex flex-col gap-3">
              {daySessions.map((session) => (
                <li
                  key={session.id}
                  className="rounded-lg bg-surface px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    {/*
                      React escapes this. The note in BUILD-PLAN D-08 still
                      holds — local is not the same as trusted — so this must
                      never become dangerouslySetInnerHTML for any reason.
                    */}
                    <span className="text-base text-text">
                      {session.intention || "No intention set"}
                    </span>
                    <span className="font-mono text-sm text-muted">
                      {formatTime(session.localStartedAt)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-muted">
                    {/* Served, never the preset length. */}
                    {formatServed(session.servedSeconds)} served
                    {session.estimateMinutes !== null
                      ? ` · you said ${session.estimateMinutes} min`
                      : ""}
                    {session.continuedFromSessionId ? " · continued" : ""}
                    {session.outcome === "abandoned" ? " · ended early" : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
