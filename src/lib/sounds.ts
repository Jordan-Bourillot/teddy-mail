// Tiny sound engine using the WebAudio API. No external assets so the bundle
// stays small and there's nothing to host. Three ambiances: off, subtle, crisp.

import type { UserPreferences } from '@/types';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  try {
    const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

interface ToneSpec {
  frequency: number;
  durationMs: number;
  type?: OscillatorType;
  gain?: number;
}

function tone({ frequency, durationMs, type = 'sine', gain = 0.04 }: ToneSpec) {
  const c = getCtx();
  if (!c) return;
  // Resume on first user gesture if browser suspended it.
  if (c.state === 'suspended') c.resume().catch(() => undefined);

  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.connect(g);
  g.connect(c.destination);
  // Quick fade in/out to avoid click pop.
  const now = c.currentTime;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + 0.005);
  g.gain.linearRampToValueAtTime(0, now + durationMs / 1000);
  osc.start(now);
  osc.stop(now + durationMs / 1000 + 0.02);
}

export type SoundEvent = 'send' | 'archive' | 'error' | 'notify' | 'snooze';

export function playSound(event: SoundEvent, pack: UserPreferences['soundPack']): void {
  if (pack === 'off') return;
  const subtle = pack === 'subtle';
  switch (event) {
    case 'send':
      tone({ frequency: subtle ? 660 : 880, durationMs: subtle ? 80 : 120, type: 'sine', gain: subtle ? 0.025 : 0.05 });
      break;
    case 'archive':
      tone({ frequency: 440, durationMs: 60, type: 'triangle', gain: 0.02 });
      break;
    case 'snooze':
      tone({ frequency: 330, durationMs: 70, type: 'sine', gain: 0.02 });
      break;
    case 'error':
      tone({ frequency: 220, durationMs: 180, type: 'sawtooth', gain: 0.04 });
      break;
    case 'notify':
      tone({ frequency: 880, durationMs: 50, type: 'sine', gain: 0.03 });
      setTimeout(() => tone({ frequency: 1100, durationMs: 50, type: 'sine', gain: 0.03 }), 70);
      break;
  }
}

export function isReducedMotionActive(pref: UserPreferences['reducedMotion']): boolean {
  if (pref === 'always') return true;
  if (pref === 'never') return false;
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function applyReducedMotion(pref: UserPreferences['reducedMotion']): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(
    'data-reduce-motion',
    isReducedMotionActive(pref) ? 'on' : 'off',
  );
}
