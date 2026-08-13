export type Preset = {
  id: string;
  label: string;
  focusMinutes: number;
  breakMinutes: number;
};

/**
 * Deskflo's preset set, carried over. Deep 50/10 is the default — it was the
 * most-used preset by a clear margin (51 of 120 preset events, April 2026).
 *
 * TODO(B-01): deskflo shipped five presets; the archive names only three
 * (Deep 50/10, Sprint 15/3, Classic 25/5). The other two are unrecorded.
 * "Long" and "Short" below are reconstructions, not ports.
 */
export const PRESETS: Preset[] = [
  { id: "short", label: "Short", focusMinutes: 10, breakMinutes: 2 },
  { id: "sprint", label: "Sprint", focusMinutes: 15, breakMinutes: 3 },
  { id: "classic", label: "Classic", focusMinutes: 25, breakMinutes: 5 },
  { id: "deep", label: "Deep", focusMinutes: 50, breakMinutes: 10 },
  { id: "long", label: "Long", focusMinutes: 90, breakMinutes: 20 },
];

export const DEFAULT_PRESET_ID = "deep";

/** Every 4th break is long, and a long break is 2× the short one. */
export const LONG_BREAK_EVERY = 4;
export const LONG_BREAK_MULTIPLIER = 2;

export function getPreset(id: string): Preset {
  return (
    PRESETS.find((preset) => preset.id === id) ??
    PRESETS.find((preset) => preset.id === DEFAULT_PRESET_ID)!
  );
}

/**
 * Break length for the break that follows the Nth completed focus block
 * (1-indexed). Scaling off the preset is the property that matters — a long
 * break after a 90-minute block should not equal one after 15 minutes.
 */
export function breakMsFor(preset: Preset, completedFocusCount: number): number {
  const isLong =
    completedFocusCount > 0 && completedFocusCount % LONG_BREAK_EVERY === 0;
  const minutes =
    preset.breakMinutes * (isLong ? LONG_BREAK_MULTIPLIER : 1);
  return minutes * 60_000;
}

export function focusMsFor(preset: Preset): number {
  return preset.focusMinutes * 60_000;
}
