"use client";

import { useEffect, useRef } from "react";

/**
 * "This session I'll ___"
 *
 * The framing IS the feature. Implementation intentions carry d = 0.65
 * (focus-science.md §3) *because* they are phrased as a commitment — an
 * if-then plan the person has stated. Reworded to "Task name" the field keeps
 * looking present while doing nothing at all.
 *
 * Do not rename this. It is the highest-effect-size thing in the product.
 */
export function IntentionField({
  value,
  onChange,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div className="w-full">
      <label
        htmlFor="intention"
        className="flex flex-wrap items-baseline gap-x-2 text-lg text-text"
      >
        <span>This session I&rsquo;ll</span>
        <input
          ref={ref}
          id="intention"
          type="text"
          value={value}
          maxLength={500}
          onChange={(event) => onChange(event.target.value)}
          // No placeholder text that reframes it as a task name.
          placeholder="…"
          autoComplete="off"
          className="min-w-0 flex-1 border-b border-surface bg-transparent pb-1 text-lg text-text outline-none placeholder:text-muted focus-visible:border-accent"
        />
      </label>
      <p className="mt-2 text-sm text-muted">Optional. It stays on this device.</p>
    </div>
  );
}
