import { describe, it, expect } from 'vitest';
import { computeInsights } from '../insights';
import type { Mail } from '@/types';

const now = new Date('2026-05-06T12:00:00Z');
const days = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString();

function m(overrides: Partial<Mail> = {}): Mail {
  return {
    id: 'm',
    threadId: 't',
    accountId: 'a',
    folder: 'f',
    labels: [],
    from: { email: 'x@y.fr' },
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    bodyText: '',
    receivedAt: now.toISOString(),
    read: true,
    starred: false,
    category: 'unsorted',
    priority: 'normal',
    trackersBlocked: 0,
    references: [],
    attachments: [],
    ...overrides,
  };
}

describe('computeInsights', () => {
  it('counts mails this week vs last week', () => {
    const mails = [
      m({ id: '1', receivedAt: days(2) }),
      m({ id: '2', receivedAt: days(5) }),
      m({ id: '3', receivedAt: days(10) }),
    ];
    const r = computeInsights(mails, now);
    expect(r.mailsThisWeek).toBe(2);
    expect(r.mailsLastWeek).toBe(1);
    expect(r.trendPct).toBe(100);
  });

  it('aggregates trackers blocked', () => {
    const mails = [m({ id: '1', trackersBlocked: 3 }), m({ id: '2', trackersBlocked: 5 })];
    expect(computeInsights(mails, now).totalTrackersBlocked).toBe(8);
  });

  it('ranks top senders', () => {
    const mails = [
      m({ id: '1', from: { name: 'Anna', email: 'anna@x' } }),
      m({ id: '2', from: { name: 'Anna', email: 'anna@x' } }),
      m({ id: '3', from: { name: 'Bob', email: 'bob@x' } }),
    ];
    const r = computeInsights(mails, now);
    expect(r.topSenders[0]?.email).toBe('anna@x');
    expect(r.topSenders[0]?.count).toBe(2);
  });

  it('counts unread, starred, snoozed, attachments', () => {
    const mails = [
      m({ id: '1', read: false }),
      m({ id: '2', starred: true }),
      m({ id: '3', snoozedUntil: days(-2) }),
      m({
        id: '4',
        attachments: [{ id: 'a', filename: 'f', mimeType: 't', sizeBytes: 1, contentHash: 'h' }],
      }),
    ];
    const r = computeInsights(mails, now);
    expect(r.unread).toBe(1);
    expect(r.starred).toBe(1);
    expect(r.snoozed).toBe(1);
    expect(r.withAttachments).toBe(1);
  });

  it('computes time saved estimate', () => {
    // 2 read mails (10s) + 6 trackers (18s) = 28s = 0 minutes (rounds down)
    const mails = [
      m({ id: '1', read: true, trackersBlocked: 3 }),
      m({ id: '2', read: true, trackersBlocked: 3 }),
    ];
    const r = computeInsights(mails, now);
    expect(r.timeSavedMinutes).toBeGreaterThanOrEqual(0);
    expect(r.timeSavedMinutes).toBeLessThan(2);
  });
});
