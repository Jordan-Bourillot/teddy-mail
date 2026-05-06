// Atelier view: an editorial, single-pane alternative to the 3-column classic
// layout. Goals:
//  - Visual hierarchy: the most important unread mail of the day is a hero
//    card with the headline, sender, and a generous preview.
//  - Clusters by category, each shown as a soft masonry of 3-5 cards.
//  - Category color tints the card background, so categories are felt rather
//    than read.
//  - Click a card to expand it inline (the body unfolds underneath).
//  - Hover-revealed actions: archive, snooze, star, reply.
//  - Time-of-day greeting in the header for ambient warmth.

import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@/lib/store';
import { Avatar } from './Avatar';
import { snoozePresets } from '@/lib/snooze';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Mail, Category } from '@/types';

const CATEGORY_META: Record<Category, { label: string; tint: string; accent: string; emoji: string }> = {
  work: {
    label: 'Travail',
    tint: 'rgb(14 165 233 / 0.06)',
    accent: '#0ea5e9',
    emoji: '💼',
  },
  personal: {
    label: 'Personnel',
    tint: 'rgb(34 197 94 / 0.06)',
    accent: '#22c55e',
    emoji: '🌿',
  },
  notifications: {
    label: 'Notifications',
    tint: 'rgb(245 158 11 / 0.06)',
    accent: '#f59e0b',
    emoji: '🔔',
  },
  newsletters: {
    label: 'Newsletters',
    tint: 'rgb(168 85 247 / 0.06)',
    accent: '#a855f7',
    emoji: '📰',
  },
  promotions: {
    label: 'Promotions',
    tint: 'rgb(236 72 153 / 0.06)',
    accent: '#ec4899',
    emoji: '🛍',
  },
  unsorted: {
    label: 'À trier',
    tint: 'rgb(148 163 184 / 0.06)',
    accent: '#94a3b8',
    emoji: '·',
  },
};

const CLUSTER_ORDER: Category[] = ['work', 'personal', 'notifications', 'newsletters', 'promotions', 'unsorted'];

function pickHero(mails: Mail[]): Mail | null {
  const candidates = mails.filter((m) => !m.read && (m.category === 'work' || m.category === 'personal'));
  if (candidates.length === 0) return mails.find((m) => !m.read) ?? null;
  // Most recent unread in personal/work
  return candidates
    .slice()
    .sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt))[0] ?? null;
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Encore là, oiseau de nuit';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  if (h < 22) return 'Bonsoir';
  return 'Belle nuit';
}

export function AtelierView() {
  const visible = useStore(useShallow((s) => s.visibleThreads()));
  const allMails = useStore((s) => s.mails);
  const accounts = useStore((s) => s.accounts);

  // Build the mail list shown: one representative mail per visible thread.
  const mails = useMemo(() => {
    return visible
      .map((t) => {
        const threadMails = allMails.filter((m) => m.threadId === t.id);
        return threadMails[threadMails.length - 1];
      })
      .filter((m): m is Mail => Boolean(m));
  }, [visible, allMails]);

  const hero = useMemo(() => pickHero(mails), [mails]);
  const clusters = useMemo(() => {
    const groups = new Map<Category, Mail[]>();
    for (const m of mails) {
      if (hero && m.id === hero.id) continue;
      const arr = groups.get(m.category) ?? [];
      arr.push(m);
      groups.set(m.category, arr);
    }
    return CLUSTER_ORDER.flatMap((cat) => {
      const arr = groups.get(cat);
      if (!arr || arr.length === 0) return [];
      return [{ category: cat, mails: arr.slice(0, 6) }];
    });
  }, [mails, hero]);

  const totalShown = (hero ? 1 : 0) + clusters.reduce((s, c) => s + c.mails.length, 0);
  const accountName = accounts[0]?.displayName?.split(/\s+/)[0] ?? '';

  return (
    <div className="flex-1 overflow-y-auto bg-bg">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            {timeGreeting()}
            {accountName ? `, ${accountName}` : ''}.
          </h1>
          <p className="text-sm text-muted mt-1">
            {totalShown === 0
              ? 'Boîte au calme. Profite.'
              : `${totalShown} chose${totalShown > 1 ? 's' : ''} à regarder, sans pression.`}
          </p>
        </header>

        {hero && <HeroCard mail={hero} />}

        {clusters.map((c) => (
          <Cluster key={c.category} category={c.category} mails={c.mails} />
        ))}

        {totalShown === 0 && <EmptyState />}
      </div>
    </div>
  );
}

function HeroCard({ mail }: { mail: Mail }) {
  const meta = CATEGORY_META[mail.category];
  const [expanded, setExpanded] = useState(true);
  const archive = useStore((s) => s.archive);
  const snooze = useStore((s) => s.snooze);
  const toggleStar = useStore((s) => s.toggleStar);
  const openCompose = useStore((s) => s.openCompose);

  return (
    <article
      className="rounded-2xl border border-border p-6 mb-8 transition shadow-sm hover:shadow-md"
      style={{ background: meta.tint }}
    >
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-[11px] uppercase tracking-wider font-medium" style={{ color: meta.accent }}>
          {meta.emoji} À regarder en premier · {meta.label}
        </span>
        <span className="text-[11px] text-muted ml-auto">
          {formatDistanceToNowStrict(new Date(mail.receivedAt), { addSuffix: true, locale: fr })}
        </span>
      </div>

      <header className="flex items-start gap-4 mb-4">
        <Avatar name={mail.from.name ?? ''} email={mail.from.email} size={56} />
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold leading-tight tracking-tight">{mail.subject}</h2>
          <p className="text-sm text-muted mt-1">
            <span className="font-medium text-text">{mail.from.name ?? mail.from.email}</span>
            {' · '}
            {mail.from.email}
          </p>
        </div>
      </header>

      {expanded ? (
        <div className="prose prose-sm max-w-none whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
          {mail.bodyText}
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="text-sm text-muted hover:text-text transition text-left"
        >
          {mail.bodyText.split('\n').join(' ').slice(0, 200)}…
          <span className="ml-1 underline">Lire</span>
        </button>
      )}

      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={() => openCompose(mail)}
          className="px-4 py-1.5 text-sm rounded-lg text-white font-medium transition"
          style={{ background: meta.accent }}
        >
          Répondre
        </button>
        <button
          onClick={() => archive([mail.id])}
          className="px-3 py-1.5 text-sm rounded-lg hover:bg-bg transition"
        >
          Archiver
        </button>
        <SnoozeQuickButton
          onPick={(iso) => snooze([mail.id], iso)}
        />
        <button
          onClick={() => toggleStar(mail.id)}
          className="ml-auto px-3 py-1.5 text-sm rounded-lg hover:bg-bg transition"
          aria-label="Favori"
        >
          {mail.starred ? '★' : '☆'}
        </button>
      </div>
    </article>
  );
}

function Cluster({ category, mails }: { category: Category; mails: Mail[] }) {
  const meta = CATEGORY_META[category];
  return (
    <section className="mb-10">
      <header className="flex items-baseline gap-2 mb-3">
        <h3 className="text-base font-semibold">
          <span className="mr-1.5">{meta.emoji}</span>
          {meta.label}
        </h3>
        <span className="text-xs text-muted">{mails.length}</span>
      </header>
      <ul className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {mails.map((m) => (
          <Card key={m.id} mail={m} />
        ))}
      </ul>
    </section>
  );
}

function Card({ mail }: { mail: Mail }) {
  const meta = CATEGORY_META[mail.category];
  const [expanded, setExpanded] = useState(false);
  const archive = useStore((s) => s.archive);
  const snooze = useStore((s) => s.snooze);
  const toggleStar = useStore((s) => s.toggleStar);
  const openCompose = useStore((s) => s.openCompose);

  return (
    <li>
      <article
        className="group relative rounded-xl border border-border p-4 transition hover:shadow-md cursor-pointer"
        style={{ background: meta.tint }}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <header className="flex items-start gap-3 mb-2">
          <Avatar name={mail.from.name ?? ''} email={mail.from.email} size={32} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {mail.from.name ?? mail.from.email}
            </div>
            <time className="text-[11px] text-muted">
              {format(new Date(mail.receivedAt), 'PPp', { locale: fr })}
            </time>
          </div>
          {!mail.read && (
            <span
              className="w-2 h-2 rounded-full mt-2"
              style={{ background: meta.accent }}
              aria-label="non lu"
            />
          )}
        </header>

        <h4 className={['text-[15px] leading-snug mb-2', mail.read ? 'text-text/80' : 'font-semibold'].join(' ')}>
          {mail.subject}
        </h4>

        {expanded ? (
          <div className="text-sm whitespace-pre-wrap leading-relaxed">{mail.bodyText}</div>
        ) : (
          <p className="text-xs text-muted line-clamp-3">{mail.bodyText.split('\n').join(' ')}</p>
        )}

        <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openCompose(mail);
            }}
            className="px-2 py-0.5 text-[11px] rounded hover:bg-bg"
          >
            Répondre
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              archive([mail.id]);
            }}
            className="px-2 py-0.5 text-[11px] rounded hover:bg-bg"
          >
            Archiver
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              snooze([mail.id], snoozePresets[1]!.resolveAt().toISOString());
            }}
            className="px-2 py-0.5 text-[11px] rounded hover:bg-bg"
            title="Snooze à demain matin"
          >
            Snooze
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleStar(mail.id);
            }}
            className="ml-auto px-2 py-0.5 text-[11px] rounded hover:bg-bg"
            aria-label="Favori"
          >
            {mail.starred ? '★' : '☆'}
          </button>
        </div>
      </article>
    </li>
  );
}

function SnoozeQuickButton({ onPick }: { onPick: (iso: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 text-sm rounded-lg hover:bg-bg transition"
      >
        Snooze
      </button>
      {open && (
        <div className="absolute left-0 mt-1 z-10 w-52 bg-surface border border-border rounded shadow-lg p-1">
          {snoozePresets.map((p) => (
            <button
              key={p.preset}
              onClick={() => {
                onPick(p.resolveAt().toISOString());
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-surface-2"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-muted">
      <div className="text-5xl mb-3">·</div>
      <p className="text-sm">Boîte vide. Le calme est précieux.</p>
    </div>
  );
}
