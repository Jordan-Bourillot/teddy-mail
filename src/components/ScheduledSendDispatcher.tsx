// Background watcher: every 30s, check the scheduled queue and "send" any
// item whose scheduledFor has passed. In V0.3 this would hand the draft to the
// real SMTP layer; for V0.2 it just plays the send sound and toasts.

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { playSound } from '@/lib/sounds';

const TICK_MS = 30 * 1000;

export function ScheduledSendDispatcher() {
  const scheduled = useStore((s) => s.scheduled);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const due = useStore.getState().scheduled.filter(
        (s) => new Date(s.scheduledFor).getTime() <= now,
      );
      if (due.length === 0) return;
      const remaining = useStore
        .getState()
        .scheduled.filter((s) => !due.find((d) => d.id === s.id));
      const pack = useStore.getState().prefs.soundPack;
      useStore.setState({ scheduled: remaining });
      // Persist via the action so localStorage stays in sync.
      due.forEach((d) => {
        useStore.getState().showToast(
          `Programmé envoyé : « ${d.draft.subject || 'sans objet'} »`,
        );
        playSound('send', pack);
      });
      // Force-save the trimmed list.
      try {
        localStorage.setItem('teddy-mail-scheduled-v1', JSON.stringify(remaining));
      } catch {
        /* ignore */
      }
    };
    // Run once at mount in case any items are already overdue (e.g. user came back after closing).
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [scheduled.length]);

  return null;
}
