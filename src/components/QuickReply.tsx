// Inline quick-reply box below a thread. Lighter than opening the full
// Composer modal: subject is implicit, attachments live elsewhere, just one
// textarea + send. Useful for short answers in long threads.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import type { Mail } from '@/types';
import { playSound } from '@/lib/sounds';
import { suggestReplies } from '@/lib/replySuggestions';

interface Props {
  /** The mail being replied to (last in the thread). */
  replyTo: Mail;
}

export function QuickReply({ replyTo }: Props) {
  const accounts = useStore((s) => s.accounts);
  const showToast = useStore((s) => s.showToast);
  const soundPack = useStore((s) => s.prefs.soundPack);
  const [body, setBody] = useState('');
  const [expanded, setExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const account = accounts.find((a) => a.id === replyTo.accountId);
  const suggestions = useMemo(() => suggestReplies(replyTo), [replyTo]);

  useEffect(() => {
    if (expanded) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [expanded]);

  const send = () => {
    if (!body.trim()) {
      showToast('Le message est vide');
      return;
    }
    // Mock send (wired to the real SMTP layer in V0.4)
    playSound('send', soundPack);
    showToast(`Réponse envoyée à ${replyTo.from.name ?? replyTo.from.email}`);
    setBody('');
    setExpanded(false);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 'Enter') {
      e.preventDefault();
      send();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setExpanded(false);
    }
  };

  const sendInstant = (replyBody: string) => {
    playSound('send', soundPack);
    showToast(`Réponse envoyée à ${replyTo.from.name ?? replyTo.from.email}`);
    void replyBody;
  };

  if (!expanded) {
    return (
      <div className="mt-6 print-hide">
        <button
          onClick={() => setExpanded(true)}
          className="w-full px-4 py-3 rounded border border-border bg-bg text-left text-sm text-muted hover:border-accent hover:text-text transition"
        >
          Répondre à {replyTo.from.name ?? replyTo.from.email}…
        </button>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s.label}
              onClick={() => sendInstant(s.body)}
              className="px-3 py-1 text-xs rounded-full border border-border bg-bg hover:border-accent hover:text-accent transition"
              title={s.body}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={() => setExpanded(true)}
            className="px-3 py-1 text-xs rounded-full text-muted hover:text-text"
          >
            Personnaliser…
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded border border-accent/40 bg-surface-2 print-hide">
      <header className="px-3 py-2 text-xs text-muted border-b border-border flex items-center justify-between">
        <span>
          Réponse à <span className="font-medium text-text">{replyTo.from.name ?? replyTo.from.email}</span>
          {' · '}
          depuis {account?.email ?? '?'}
        </span>
        <button
          onClick={() => setExpanded(false)}
          className="hover:text-text transition"
          aria-label="Fermer"
        >
          ✕
        </button>
      </header>
      {body.length === 0 && suggestions.length > 0 && (
        <div className="px-3 pt-2 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s.label}
              onClick={() => setBody(s.body)}
              className="px-2.5 py-0.5 text-[11px] rounded-full border border-border hover:border-accent hover:text-accent transition"
              title={s.body}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKey}
        rows={4}
        placeholder="Réponse rapide… (⌘+Entrée pour envoyer, Esc pour fermer)"
        className="w-full px-3 py-2 bg-transparent text-sm font-sans outline-none resize-y"
      />
      <footer className="px-3 py-2 border-t border-border flex items-center justify-between">
        <span className="text-[11px] text-muted">
          {body.trim().split(/\s+/).filter(Boolean).length} mot(s)
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(false)}
            className="px-3 py-1 text-xs rounded hover:bg-surface transition text-muted"
          >
            Annuler
          </button>
          <button
            onClick={send}
            disabled={!body.trim()}
            className="px-3 py-1 text-xs rounded bg-accent text-white font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            Envoyer
          </button>
        </div>
      </footer>
    </div>
  );
}
