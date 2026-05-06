// Mock new-mail arrival for demo purposes. Every 5 minutes (configurable),
// adds a synthetic mail to the inbox so the user gets a feel for how
// notifications and badges update. Will be replaced by the real IMAP IDLE
// stream in V0.4.
//
// Quiet hours respect the user's preference (no toast/sound during).

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { playSound } from '@/lib/sounds';
import type { Mail } from '@/types';

const INTERVAL_MS = 5 * 60 * 1000;
const FAKE_SENDERS: Array<{ name: string; email: string; subject: string; body: string; category: Mail['category'] }> = [
  {
    name: 'Marc Dupont',
    email: 'marc@studio-lune.com',
    subject: 'Question sur le devis',
    body: 'Bonjour,\n\nUne petite question sur le devis envoyé hier : peut-on inclure la phase de QA ?\n\nMarc',
    category: 'work',
  },
  {
    name: 'GitHub',
    email: 'noreply@github.com',
    subject: '[teddy/main] CI passed',
    body: "All checks have passed for the latest push to main.\n\n- lint: ok\n- tests: 111 passed\n- build: ok",
    category: 'notifications',
  },
  {
    name: 'Booking.com',
    email: 'noreply@booking.com',
    subject: 'Promo flash : -20% sur Lyon',
    body: 'Profitez de 20% de réduction sur tous les hôtels à Lyon ce week-end. Code FLASH20.',
    category: 'promotions',
  },
  {
    name: 'Notion',
    email: 'team@notion.so',
    subject: 'Build #143 — what shipped this week',
    body: "This week we shipped a new database view, faster search, and a redesigned share menu. Read more on the blog.",
    category: 'newsletters',
  },
];

function isInQuietHours(): boolean {
  const prefs = useStore.getState().prefs;
  if (!prefs.quietHours) return false;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = prefs.quietHours.start.split(':').map(Number);
  const [eh, em] = prefs.quietHours.end.split(':').map(Number);
  const start = (sh ?? 0) * 60 + (sm ?? 0);
  const end = (eh ?? 0) * 60 + (em ?? 0);
  if (start <= end) return cur >= start && cur < end;
  return cur >= start || cur < end; // crosses midnight
}

export function NewMailSimulator() {
  useEffect(() => {
    const tick = () => {
      const state = useStore.getState();
      if (!state.prefs.notificationsEnabled) return;
      const inboxAccount = state.accounts[0];
      if (!inboxAccount) return;
      const inboxFolder = state.folders.find(
        (f) => f.accountId === inboxAccount.id && f.type === 'inbox',
      );
      if (!inboxFolder) return;

      const fake = FAKE_SENDERS[Math.floor(Math.random() * FAKE_SENDERS.length)]!;
      const id = `m_sim_${Date.now()}`;
      const mail: Mail = {
        id,
        threadId: id,
        accountId: inboxAccount.id,
        folder: inboxFolder.id,
        labels: [],
        from: { name: fake.name, email: fake.email },
        to: [{ email: inboxAccount.email }],
        cc: [],
        bcc: [],
        subject: fake.subject,
        bodyText: fake.body,
        receivedAt: new Date().toISOString(),
        read: false,
        starred: false,
        category: fake.category,
        priority: 'normal',
        trackersBlocked: fake.category === 'newsletters' ? 3 : 0,
        references: [],
        attachments: [],
      };
      useStore.setState((s) => ({
        mails: [mail, ...s.mails],
        threads: [
          {
            id: mail.threadId,
            accountId: mail.accountId,
            subject: mail.subject,
            participants: [mail.from, ...mail.to],
            mailIds: [mail.id],
            lastReceivedAt: mail.receivedAt,
            hasUnread: true,
            category: mail.category,
          },
          ...s.threads,
        ],
      }));

      if (!isInQuietHours()) {
        const pack = useStore.getState().prefs.soundPack;
        playSound('notify', pack);
        useStore.getState().showToast(`Nouveau mail de ${fake.name}`);

        // Native browser notification if granted (will be desktop notification in Tauri build)
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            const n = new Notification(`Teddy Mail · ${fake.name}`, {
              body: fake.subject,
              icon: '/src-tauri/icons/icon.png',
              tag: 'teddy-new-mail',
            });
            n.onclick = () => {
              window.focus();
              useStore.getState().selectThread(mail.threadId);
              n.close();
            };
          } catch {
            /* permission may have been revoked */
          }
        }
      }
    };

    const id = setInterval(tick, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // On mount, ask for native notification permission once if the pref is on.
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    const want = useStore.getState().prefs.notificationsEnabled;
    if (want && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  return null;
}
