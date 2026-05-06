import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { searchMails } from '@/lib/search';

export function CommandPalette() {
  const open = useStore((s) => s.commandPaletteOpen);
  const close = useStore((s) => s.closeCommandPalette);
  const mails = useStore((s) => s.mails);
  const selectThread = useStore((s) => s.selectThread);
  const openCompose = useStore((s) => s.openCompose);
  const updatePrefs = useStore((s) => s.updatePrefs);

  const [q, setQ] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      setActiveIndex(0);
      // Focus on next tick so the modal mounts first
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!q.trim()) return [] as Array<{ kind: 'mail' | 'action'; label: string; sub?: string; run: () => void }>;
    const items: Array<{ kind: 'mail' | 'action'; label: string; sub?: string; run: () => void }> = [];

    // Actions
    const queryLower = q.toLowerCase();
    const actions: Array<{ label: string; run: () => void; keywords: string[] }> = [
      { label: 'Composer un nouveau mail', keywords: ['compose', 'new', 'écrire'], run: () => openCompose() },
      { label: 'Thème : clair', keywords: ['theme', 'clair', 'light'], run: () => updatePrefs({ theme: 'light' }) },
      { label: 'Thème : sombre', keywords: ['theme', 'sombre', 'dark'], run: () => updatePrefs({ theme: 'dark' }) },
      { label: 'Thème : nocturne', keywords: ['theme', 'nocturne'], run: () => updatePrefs({ theme: 'nocturne' }) },
      { label: 'Thème : sépia', keywords: ['theme', 'sepia', 'sépia'], run: () => updatePrefs({ theme: 'sepia' }) },
      { label: 'Densité : compact', keywords: ['density', 'compact'], run: () => updatePrefs({ density: 'compact' }) },
      { label: 'Densité : confortable', keywords: ['density', 'cozy'], run: () => updatePrefs({ density: 'cozy' }) },
      { label: 'Bloquer les traceurs : oui', keywords: ['tracker', 'block'], run: () => updatePrefs({ blockTrackers: true }) },
      { label: 'Bloquer les traceurs : non', keywords: ['tracker', 'allow'], run: () => updatePrefs({ blockTrackers: false }) },
    ];
    for (const a of actions) {
      if (a.label.toLowerCase().includes(queryLower) || a.keywords.some((k) => k.includes(queryLower))) {
        items.push({ kind: 'action', label: a.label, run: a.run });
      }
    }

    // Mails
    const found = searchMails(mails, q).slice(0, 8);
    for (const m of found) {
      items.push({
        kind: 'mail',
        label: m.subject,
        sub: m.from.name ?? m.from.email,
        run: () => selectThread(m.threadId),
      });
    }

    return items;
  }, [q, mails, openCompose, selectThread, updatePrefs]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = results[activeIndex];
        if (item) {
          item.run();
          close();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, activeIndex, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Palette de commandes"
    >
      <div
        className="w-[640px] max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Recherche, action, mail…   (essaie : from:anna, has:attachment, thème sombre)"
            className="w-full bg-transparent text-base outline-none"
          />
        </div>
        <ul className="max-h-[420px] overflow-y-auto">
          {results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted">Tape pour chercher…</li>
          )}
          {results.map((r, i) => (
            <li
              key={`${r.kind}_${i}`}
              className={[
                'px-4 py-2.5 cursor-pointer flex items-center justify-between gap-3',
                i === activeIndex ? 'bg-surface-2' : '',
              ].join(' ')}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => {
                r.run();
                close();
              }}
            >
              <div className="min-w-0">
                <div className="text-sm truncate">{r.label}</div>
                {r.sub && <div className="text-xs text-muted truncate">{r.sub}</div>}
              </div>
              <span className="text-[11px] uppercase tracking-wider text-muted">
                {r.kind === 'mail' ? 'mail' : 'action'}
              </span>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2 border-t border-border text-xs text-muted flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><span className="kbd">↑↓</span> naviguer</span>
            <span><span className="kbd">↵</span> ouvrir</span>
            <span><span className="kbd">Esc</span> fermer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
