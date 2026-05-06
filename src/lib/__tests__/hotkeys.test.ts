import { describe, it, expect } from 'vitest';
import { getProfile, matches, describeCombo } from '../hotkeys';

function ev(key: string, opts: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, ...opts });
}

describe('hotkeys', () => {
  it('pite profile maps compose to mod+n', () => {
    const p = getProfile('pite');
    expect(p.compose).toBe('mod+n');
  });

  it('matches respects modifier keys', () => {
    expect(matches(ev('k', { ctrlKey: true }), 'mod+k')).toBe(true);
    expect(matches(ev('k'), 'mod+k')).toBe(false);
    expect(matches(ev('k', { ctrlKey: true, shiftKey: true }), 'mod+k')).toBe(false);
  });

  it('matches plain keys without modifier', () => {
    expect(matches(ev('j'), 'j')).toBe(true);
  });

  it('describes combos for the user', () => {
    expect(describeCombo('mod+k')).toMatch(/(⌘|Ctrl)/);
    expect(describeCombo('shift+r')).toMatch(/r/i);
  });
});
