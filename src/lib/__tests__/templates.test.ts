import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadTemplates,
  saveTemplates,
  rankTemplates,
  expandTemplate,
  newTemplate,
} from '../templates';
import type { Template } from '@/types';

describe('newTemplate', () => {
  it('produces a unique id and a default name', () => {
    const a = newTemplate();
    const b = newTemplate();
    expect(a.id).not.toBe(b.id);
    expect(a.body).toBe('');
    expect(a.name).toBeTruthy();
  });
});

describe('loadTemplates / saveTemplates', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults on empty storage', () => {
    const t = loadTemplates();
    expect(t.length).toBeGreaterThan(0);
    expect(t.some((x) => x.shortcut === 'dispo')).toBe(true);
  });

  it('persists round-trip', () => {
    const custom: Template[] = [
      { id: 'x', name: 'Custom', body: 'hello' },
    ];
    saveTemplates(custom);
    expect(loadTemplates()).toEqual(custom);
  });
});

describe('rankTemplates', () => {
  const templates: Template[] = [
    { id: 'a', name: 'Alpha', body: 'aaa' },
    { id: 'b', name: 'Beta', body: 'bbb', lastUsedAt: '2026-05-01T12:00:00Z' },
    { id: 'c', name: 'Gamma', body: 'ccc', lastUsedAt: '2026-05-06T12:00:00Z' },
    { id: 'd', name: 'Delta', body: 'shared keyword', shortcut: 'sh' },
  ];

  it('puts most recently used first', () => {
    const ranked = rankTemplates(templates, '');
    expect(ranked[0]?.id).toBe('c');
    expect(ranked[1]?.id).toBe('b');
  });

  it('alpha-sorts the unused ones after the used ones', () => {
    const ranked = rankTemplates(templates, '');
    // c, b first (used), then alpha-sort: Alpha, Delta
    expect(ranked.slice(2).map((t) => t.name)).toEqual(['Alpha', 'Delta']);
  });

  it('filters by name', () => {
    expect(rankTemplates(templates, 'gam').map((t) => t.id)).toEqual(['c']);
  });

  it('filters by shortcut', () => {
    expect(rankTemplates(templates, 'sh').map((t) => t.id)).toEqual(['d']);
  });

  it('filters by body content', () => {
    expect(rankTemplates(templates, 'shared').map((t) => t.id)).toEqual(['d']);
  });
});

describe('expandTemplate', () => {
  const fixedNow = new Date('2026-05-06T14:30:00');

  it('replaces first_name from recipient name', () => {
    const out = expandTemplate('Bonjour {{first_name}},', {
      recipientName: 'Anna Belmas',
      now: fixedNow,
    });
    expect(out).toBe('Bonjour Anna,');
  });

  it('falls back to email user-part when no name', () => {
    const out = expandTemplate('Bonjour {{first_name}},', {
      recipientEmail: 'lucas@example.com',
      now: fixedNow,
    });
    expect(out).toBe('Bonjour lucas,');
  });

  it('replaces my_name and my_email', () => {
    const out = expandTemplate('— {{my_name}} <{{my_email}}>', {
      myName: 'Jordan',
      myEmail: 'jordan@triskell.studio',
      now: fixedNow,
    });
    expect(out).toBe('— Jordan <jordan@triskell.studio>');
  });

  it('formats date in French', () => {
    const out = expandTemplate('Bonne {{date}}', { now: fixedNow });
    expect(out.toLowerCase()).toContain('mai');
  });

  it('formats time HH:MM', () => {
    const out = expandTemplate('À {{time}}', { now: fixedNow });
    expect(out).toBe('À 14:30');
  });

  it('leaves unrelated placeholders alone', () => {
    const out = expandTemplate('Hello {{unknown}}', { now: fixedNow });
    expect(out).toBe('Hello {{unknown}}');
  });
});
