export function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** Spoken form, for the one-shot announcements that do get read out. */
export function speakRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.round(total / 60);
  if (minutes < 1) return "less than a minute";
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function TimeDisplay({
  remainingMs,
  muted = false,
}: {
  remainingMs: number;
  muted?: boolean;
}) {
  return (
    <div
      // role="timer" without aria-live: announcing a countdown every second is
      // an accessibility failure, not a feature (break-mode.md §8).
      role="timer"
      aria-live="off"
      className={`font-mono text-7xl tabular-nums sm:text-8xl ${
        muted ? "text-muted" : "text-text"
      }`}
    >
      {formatRemaining(remainingMs)}
    </div>
  );
}
