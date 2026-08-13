"use client";

import { useState } from "react";

import { AMBIENTS, ambientPlayer, type AmbientId } from "@/lib/audio/ambient";

/**
 * Described honestly. These are background sounds; the evidence that any of
 * them improves focus is mixed, so nothing here claims that they do.
 */
export function AmbientControls() {
  // Seeded from the player, not from null. This component unmounts and
  // remounts across phase changes while the sound keeps going, and starting
  // from null would show nothing selected while something was audibly playing.
  const [playing, setPlaying] = useState<AmbientId | null>(() =>
    typeof window === "undefined" ? null : ambientPlayer().playing(),
  );

  function toggle(id: AmbientId) {
    // Resolved inside the click: the AudioContext underneath can only start
    // from a user gesture.
    setPlaying(ambientPlayer().toggle(id));
  }

  return (
    <div className="w-full">
      <p id="ambient-label" className="text-sm text-muted">
        Background sound
      </p>
      <div
        role="group"
        aria-labelledby="ambient-label"
        className="mt-3 flex flex-wrap gap-2"
      >
        {AMBIENTS.map((ambient) => {
          const active = playing === ambient.id;
          return (
            <button
              key={ambient.id}
              type="button"
              aria-pressed={active}
              title={ambient.description}
              onClick={() => toggle(ambient.id)}
              className={`rounded-full px-4 py-2 text-sm focus-visible:ring-2 focus-visible:ring-accent ${
                active
                  ? "bg-accent text-bg"
                  : "bg-surface text-muted hover:text-text"
              }`}
            >
              {ambient.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
