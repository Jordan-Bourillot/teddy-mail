// Mail insights computed from the local store. Pure function, no side effects.
//
// Time-saved estimate: each tracker we neutralize saves ~3 seconds of attention,
// each archived mail saves ~5 seconds vs leaving it cluttering the inbox.

import type { Mail } from '@/types';

export interface Insights {
  mailsThisWeek: number;
  mailsLastWeek: number;
  trendPct: number; // weekly change vs last week
  totalTrackersBlocked: number;
  trackersThisWeek: number;
  unread: number;
  snoozed: number;
  starred: number;
  withAttachments: number;
  byCategory: Record<string, number>;
  topSenders: Array<{ name: string; email: string; count: number }>;
  timeSavedMinutes: number;
}

const WEEK_MS = 7 * 86_400_000;

export function computeInsights(mails: Mail[], now: Date = new Date()): Insights {
  const nowMs = now.getTime();
  const oneWeekAgo = nowMs - WEEK_MS;
  const twoWeeksAgo = nowMs - 2 * WEEK_MS;

  let mailsThisWeek = 0;
  let mailsLastWeek = 0;
  let totalTrackersBlocked = 0;
  let trackersThisWeek = 0;
  let unread = 0;
  let snoozed = 0;
  let starred = 0;
  let withAttachments = 0;
  const byCategory: Record<string, number> = {};
  const senderCounts = new Map<string, { name?: string; email: string; count: number }>();

  for (const m of mails) {
    const t = +new Date(m.receivedAt);
    if (t > oneWeekAgo) mailsThisWeek += 1;
    else if (t > twoWeeksAgo) mailsLastWeek += 1;

    totalTrackersBlocked += m.trackersBlocked;
    if (t > oneWeekAgo) trackersThisWeek += m.trackersBlocked;

    if (!m.read) unread += 1;
    if (m.snoozedUntil && new Date(m.snoozedUntil) > now) snoozed += 1;
    if (m.starred) starred += 1;
    if (m.attachments.length > 0) withAttachments += 1;

    byCategory[m.category] = (byCategory[m.category] ?? 0) + 1;

    const key = m.from.email.toLowerCase();
    const cur = senderCounts.get(key);
    if (cur) {
      cur.count += 1;
    } else {
      const entry: { name?: string; email: string; count: number } = { email: m.from.email, count: 1 };
      if (m.from.name !== undefined) entry.name = m.from.name;
      senderCounts.set(key, entry);
    }
  }

  const trendPct = mailsLastWeek === 0 ? 0 : Math.round(((mailsThisWeek - mailsLastWeek) / mailsLastWeek) * 100);

  const topSenders = Array.from(senderCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((s) => ({ name: s.name ?? s.email, email: s.email, count: s.count }));

  // 3s saved per tracker, 5s saved per read mail (skim avoidance).
  const totalReadMails = mails.filter((m) => m.read).length;
  const timeSavedSeconds = totalTrackersBlocked * 3 + totalReadMails * 5;
  const timeSavedMinutes = Math.round(timeSavedSeconds / 60);

  return {
    mailsThisWeek,
    mailsLastWeek,
    trendPct,
    totalTrackersBlocked,
    trackersThisWeek,
    unread,
    snoozed,
    starred,
    withAttachments,
    byCategory,
    topSenders,
    timeSavedMinutes,
  };
}
