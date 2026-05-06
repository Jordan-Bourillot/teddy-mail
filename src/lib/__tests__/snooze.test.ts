import { describe, it, expect } from 'vitest';
import { snoozePresets, isSnoozeReady } from '../snooze';

describe('snoozePresets', () => {
  it('all presets resolve to a future date', () => {
    const now = new Date();
    for (const p of snoozePresets) {
      const d = p.resolveAt();
      expect(d.getTime()).toBeGreaterThan(now.getTime());
    }
  });
});

describe('isSnoozeReady', () => {
  it('false for future', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isSnoozeReady(future)).toBe(false);
  });
  it('true for past', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isSnoozeReady(past)).toBe(true);
  });
  it('false for undefined', () => {
    expect(isSnoozeReady(undefined)).toBe(false);
  });
});
