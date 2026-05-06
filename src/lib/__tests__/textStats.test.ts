import { describe, it, expect } from 'vitest';
import { computeTextStats, formatReadingTime } from '../textStats';

describe('computeTextStats', () => {
  it('returns zeroes on empty input', () => {
    const s = computeTextStats('');
    expect(s).toEqual({ chars: 0, words: 0, lines: 0, readingSeconds: 0 });
  });

  it('counts words separated by whitespace', () => {
    const s = computeTextStats('Hello world  from   teddy');
    expect(s.words).toBe(4);
  });

  it('counts lines including blank ones', () => {
    const s = computeTextStats('a\n\nb');
    expect(s.lines).toBe(3);
  });

  it('rounds reading time at 220 wpm', () => {
    // 220 words → exactly 60 s
    const text = 'word '.repeat(220).trim();
    const s = computeTextStats(text);
    expect(s.words).toBe(220);
    expect(s.readingSeconds).toBe(60);
  });
});

describe('formatReadingTime', () => {
  it('shows "< 5 s" under threshold', () => {
    expect(formatReadingTime(2)).toBe('< 5 s');
  });
  it('shows seconds under a minute', () => {
    expect(formatReadingTime(45)).toBe('45 s');
  });
  it('shows minutes after', () => {
    expect(formatReadingTime(120)).toBe('2 min');
  });
});
