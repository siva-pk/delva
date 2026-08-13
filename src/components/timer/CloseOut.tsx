"use client";

/**
 * The close-out, shown once at the start of the break.
 *
 * There is no failure state here and no third option that means "I didn't
 * manage it". "Still going" is not an admission — it is the distraction-capture
 * mechanism: the intention carries into the next block, and the two blocks get
 * chained so calibration can see the real total (D-07, and the reason
 * `continued_from_session_id` exists).
 */
export function CloseOut({
  intention,
  onDone,
  onStillGoing,
}: {
  intention: string;
  onDone: () => void;
  onStillGoing: () => void;
}) {
  return (
    <div className="w-full rounded-lg bg-surface p-4">
      <p className="text-base text-text">
        {intention ? (
          <>
            Where did you get to with{" "}
            <span className="text-accent">{intention}</span>?
          </>
        ) : (
          "How did that go?"
        )}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Done
        </button>
        <button
          type="button"
          onClick={onStillGoing}
          className="rounded-lg bg-bg px-5 py-2.5 text-sm font-medium text-text focus-visible:ring-2 focus-visible:ring-accent"
        >
          Still going
        </button>
      </div>
    </div>
  );
}
