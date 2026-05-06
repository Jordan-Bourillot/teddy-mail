import { describe, it, expect } from 'vitest';
import { detectEngagements } from '../engagements';

describe('detectEngagements', () => {
  it('detects FR promise', () => {
    const txt = "Je t'envoie le brief lundi matin pour qu'on soit aligné.";
    const out = detectEngagements(txt);
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]?.text.toLowerCase()).toContain('lundi');
  });

  it('detects EN promise', () => {
    const txt = 'I will send you the report on Friday morning.';
    const out = detectEngagements(txt);
    expect(out.length).toBeGreaterThan(0);
  });

  it('returns empty when no promise', () => {
    expect(detectEngagements('Hello, just saying hi.').length).toBe(0);
  });

  it('deduplicates', () => {
    const txt = "Je t'envoie ça lundi. Je t'envoie ça lundi.";
    const out = detectEngagements(txt);
    expect(out.length).toBe(1);
  });
});
