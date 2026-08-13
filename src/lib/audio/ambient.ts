/**
 * Ambient sound and chimes, synthesised in the browser.
 *
 * Zero audio files: nothing to host, nothing to license, nothing to load. Every
 * sound here is noise or oscillators shaped by filters.
 *
 * **No efficacy claims anywhere.** The evidence on focus sounds is genuinely
 * mixed (CLAUDE.md), so these are described as what they are — background
 * noise some people like — and never as something that improves focus.
 */

export type AmbientId = "deep-hum" | "white-noise" | "rain" | "cafe" | "fireplace";

export const AMBIENTS: { id: AmbientId; label: string; description: string }[] = [
  { id: "deep-hum", label: "Deep hum", description: "A low, steady drone." },
  { id: "white-noise", label: "White noise", description: "Flat, even hiss." },
  { id: "rain", label: "Rain", description: "Filtered noise, like rain on a window." },
  { id: "cafe", label: "Café", description: "Muffled room tone." },
  { id: "fireplace", label: "Fireplace", description: "Low crackle and rumble." },
];

/**
 * One player for the whole app.
 *
 * The chime at a phase boundary and the ambient loop have to share an
 * AudioContext — browsers cap how many a page may create, and a second one per
 * component would eventually just fail to start.
 */
let shared: AmbientPlayer | null = null;

export function ambientPlayer(): AmbientPlayer {
  shared ??= new AmbientPlayer();
  return shared;
}

/** Noise buffer, generated once and looped. Two seconds is enough to not tile audibly. */
function noiseBuffer(context: AudioContext): AudioBuffer {
  const length = context.sampleRate * 2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

type Voice = { stop: () => void };

function playNoise(
  context: AudioContext,
  destination: AudioNode,
  shape: (filter: BiquadFilterNode) => void,
): Voice {
  const source = context.createBufferSource();
  source.buffer = noiseBuffer(context);
  source.loop = true;

  const filter = context.createBiquadFilter();
  shape(filter);

  source.connect(filter).connect(destination);
  source.start();
  return { stop: () => source.stop() };
}

function buildVoice(
  context: AudioContext,
  destination: AudioNode,
  id: AmbientId,
): Voice {
  switch (id) {
    case "white-noise":
      return playNoise(context, destination, (filter) => {
        filter.type = "highpass";
        filter.frequency.value = 20;
      });

    case "rain":
      return playNoise(context, destination, (filter) => {
        filter.type = "bandpass";
        filter.frequency.value = 1200;
        filter.Q.value = 0.6;
      });

    case "cafe":
      return playNoise(context, destination, (filter) => {
        filter.type = "lowpass";
        filter.frequency.value = 700;
      });

    case "fireplace":
      return playNoise(context, destination, (filter) => {
        filter.type = "lowpass";
        filter.frequency.value = 380;
      });

    case "deep-hum":
    default: {
      // Two detuned oscillators — the slight offset is what stops it sounding
      // like a test tone.
      const a = context.createOscillator();
      const b = context.createOscillator();
      a.type = "sine";
      b.type = "sine";
      a.frequency.value = 55;
      b.frequency.value = 55.4;

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 220;

      a.connect(filter);
      b.connect(filter);
      filter.connect(destination);
      a.start();
      b.start();
      return {
        stop: () => {
          a.stop();
          b.stop();
        },
      };
    }
  }
}

/**
 * Owns the single AudioContext and whatever is currently playing.
 *
 * A class rather than hooks because audio outlives React state deliberately:
 * ambient sound continues uninterrupted across the focus/break boundary. It is
 * the one support feature that doesn't demand attention (break-mode.md §4).
 */
export class AmbientPlayer {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private voice: Voice | null = null;
  private current: AmbientId | null = null;

  /** Must be called from a user gesture — browsers refuse otherwise. */
  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.context) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      this.context = new Ctor();
      this.gain = this.context.createGain();
      this.gain.gain.value = 0.15;
      this.gain.connect(this.context.destination);
    }
    void this.context.resume();
    return this.context;
  }

  playing(): AmbientId | null {
    return this.current;
  }

  toggle(id: AmbientId): AmbientId | null {
    if (this.current === id) {
      this.stop();
      return null;
    }
    const context = this.ensureContext();
    if (!context || !this.gain) return this.current;

    this.voice?.stop();
    this.voice = buildVoice(context, this.gain, id);
    this.current = id;
    return id;
  }

  setVolume(value: number) {
    if (this.gain) this.gain.gain.value = Math.min(1, Math.max(0, value));
  }

  stop() {
    this.voice?.stop();
    this.voice = null;
    this.current = null;
  }

  /**
   * The phase-boundary chime. Short, soft, and never a klaxon — this marks a
   * transition, it does not demand anything.
   */
  chime(kind: "focus-end" | "break-end" = "focus-end") {
    const context = this.ensureContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = kind === "focus-end" ? 660 : 440;

    const now = context.currentTime;
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.2, now + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    oscillator.connect(envelope).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 1.3);
  }
}
