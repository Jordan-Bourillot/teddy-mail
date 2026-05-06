// Centralized hotkey registry. Profiles map a logical action to a key combo.
// The UI binds via React effect; combos are stored as platform-neutral strings
// ("mod" = Cmd on macOS, Ctrl elsewhere).

export type HotkeyAction =
  | 'compose'
  | 'reply'
  | 'replyAll'
  | 'forward'
  | 'archive'
  | 'delete'
  | 'snooze'
  | 'star'
  | 'markRead'
  | 'next'
  | 'prev'
  | 'search'
  | 'commandPalette'
  | 'undoSend'
  | 'toggleFocus'
  | 'cycleAccount';

export type KeyboardProfile = 'teddy' | 'gmail' | 'outlook' | 'mutt';

const profiles: Record<KeyboardProfile, Record<HotkeyAction, string>> = {
  teddy: {
    compose: 'mod+n',
    reply: 'r',
    replyAll: 'shift+r',
    forward: 'f',
    archive: 'e',
    delete: '#',
    snooze: 'h',
    star: 's',
    markRead: 'shift+i',
    next: 'j',
    prev: 'k',
    search: '/',
    commandPalette: 'mod+k',
    undoSend: 'mod+z',
    toggleFocus: 'mod+shift+f',
    cycleAccount: 'mod+]',
  },
  gmail: {
    compose: 'c',
    reply: 'r',
    replyAll: 'a',
    forward: 'f',
    archive: 'e',
    delete: '#',
    snooze: 'b',
    star: 's',
    markRead: 'shift+i',
    next: 'j',
    prev: 'k',
    search: '/',
    commandPalette: 'g+k',
    undoSend: 'z',
    toggleFocus: 'mod+shift+f',
    cycleAccount: 'mod+]',
  },
  outlook: {
    compose: 'mod+n',
    reply: 'mod+r',
    replyAll: 'mod+shift+r',
    forward: 'mod+f',
    archive: 'backspace',
    delete: 'delete',
    snooze: 'mod+h',
    star: 'mod+shift+g',
    markRead: 'mod+u',
    next: 'arrowdown',
    prev: 'arrowup',
    search: 'mod+e',
    commandPalette: 'mod+k',
    undoSend: 'mod+z',
    toggleFocus: 'mod+shift+f',
    cycleAccount: 'mod+]',
  },
  mutt: {
    compose: 'm',
    reply: 'r',
    replyAll: 'g',
    forward: 'f',
    archive: 's',
    delete: 'd',
    snooze: 'z',
    star: 'shift+f',
    markRead: 'n',
    next: 'j',
    prev: 'k',
    search: '/',
    commandPalette: ':',
    undoSend: 'u',
    toggleFocus: 'mod+shift+f',
    cycleAccount: 'tab',
  },
};

export function getProfile(p: KeyboardProfile): Record<HotkeyAction, string> {
  return profiles[p];
}

export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || '');
}

/**
 * Match a KeyboardEvent against a combo string ("mod+shift+k").
 */
export function matches(event: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split('+');
  const wantMod = parts.includes('mod');
  const wantShift = parts.includes('shift');
  const wantAlt = parts.includes('alt') || parts.includes('option');
  const key = parts[parts.length - 1] ?? '';

  const mod = isMac() ? event.metaKey : event.ctrlKey;
  if (Boolean(mod) !== wantMod) return false;
  if (event.shiftKey !== wantShift) return false;
  if (event.altKey !== wantAlt) return false;

  const evKey = event.key.toLowerCase();
  return evKey === key || (key === '#' && evKey === '#');
}

export function describeCombo(combo: string): string {
  const parts = combo.split('+');
  return parts
    .map((p) => {
      switch (p.toLowerCase()) {
        case 'mod':
          return isMac() ? '⌘' : 'Ctrl';
        case 'shift':
          return isMac() ? '⇧' : 'Shift';
        case 'alt':
        case 'option':
          return isMac() ? '⌥' : 'Alt';
        case 'arrowdown':
          return '↓';
        case 'arrowup':
          return '↑';
        default:
          return p.length === 1 ? p.toUpperCase() : p;
      }
    })
    .join(isMac() ? '' : '+');
}
