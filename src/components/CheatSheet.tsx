import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { describeCombo, getProfile, type HotkeyAction } from '@/lib/hotkeys';

interface ShortcutEntry {
  action: HotkeyAction | 'help';
  combo: string;
  label: string;
  group: 'Navigation' | 'Action mail' | 'Composition' | 'Recherche' | 'Sélection' | 'Aide';
}

export function CheatSheet() {
  const open = useStore((s) => s.cheatSheetOpen);
  const close = useStore((s) => s.closeCheatSheet);
  const profile = useStore((s) => s.prefs.keyboardProfile);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const entries: ShortcutEntry[] = useMemo(() => {
    const p = getProfile(profile);
    return [
      { action: 'commandPalette', combo: p.commandPalette, label: 'Palette de commandes', group: 'Recherche' },
      { action: 'search', combo: p.search, label: 'Recherche rapide', group: 'Recherche' },

      { action: 'next', combo: p.next, label: 'Mail suivant', group: 'Navigation' },
      { action: 'prev', combo: p.prev, label: 'Mail précédent', group: 'Navigation' },
      { action: 'cycleAccount', combo: p.cycleAccount, label: 'Compte suivant', group: 'Navigation' },
      { action: 'toggleFocus', combo: p.toggleFocus, label: 'Mode focus', group: 'Navigation' },

      { action: 'archive', combo: p.archive, label: 'Archiver', group: 'Action mail' },
      { action: 'delete', combo: p.delete, label: 'Supprimer', group: 'Action mail' },
      { action: 'snooze', combo: p.snooze, label: 'Snooze', group: 'Action mail' },
      { action: 'star', combo: p.star, label: 'Favori', group: 'Action mail' },
      { action: 'markRead', combo: p.markRead, label: 'Basculer lu / non lu', group: 'Action mail' },

      { action: 'compose', combo: p.compose, label: 'Nouveau message', group: 'Composition' },
      { action: 'reply', combo: p.reply, label: 'Répondre', group: 'Composition' },
      { action: 'replyAll', combo: p.replyAll, label: 'Répondre à tous', group: 'Composition' },
      { action: 'forward', combo: p.forward, label: 'Transférer', group: 'Composition' },
      { action: 'undoSend', combo: p.undoSend, label: "Annuler l'envoi", group: 'Composition' },

      { action: 'help', combo: '?', label: 'Afficher cette aide', group: 'Aide' },
      { action: 'help', combo: 'esc', label: 'Fermer la modale courante', group: 'Aide' },
    ];
  }, [profile]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return entries;
    return entries.filter((e) => e.label.toLowerCase().includes(f) || e.combo.includes(f));
  }, [entries, filter]);

  const grouped = useMemo(() => {
    const g: Record<string, ShortcutEntry[]> = {};
    for (const e of filtered) {
      g[e.group] = g[e.group] ?? [];
      g[e.group]!.push(e);
    }
    return g;
  }, [filtered]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-[10vh]"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Raccourcis clavier"
    >
      <div
        className="w-[680px] max-w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Raccourcis clavier</h2>
            <p className="text-xs text-muted">profil <span className="font-mono">{profile}</span> · personnalisable dans les préférences</p>
          </div>
          <button onClick={close} className="px-2 py-1 text-sm rounded hover:bg-surface-2">
            ✕
          </button>
        </header>

        <div className="px-5 py-3 border-b border-border">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrer (ex: archiver, snooze, ⌘…)"
            className="w-full bg-bg border border-border rounded px-3 py-1.5 text-sm outline-none focus:border-accent"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {Object.entries(grouped).length === 0 && (
            <div className="text-center text-sm text-muted py-8">Aucun raccourci ne correspond.</div>
          )}
          {Object.entries(grouped).map(([group, items]) => (
            <section key={group}>
              <h3 className="text-xs uppercase tracking-wider text-muted mb-2">{group}</h3>
              <ul className="space-y-1">
                {items.map((e) => (
                  <li
                    key={`${e.action}-${e.combo}`}
                    className="flex items-center justify-between px-3 py-1.5 rounded hover:bg-surface-2"
                  >
                    <span className="text-sm">{e.label}</span>
                    <span className="kbd">{describeCombo(e.combo)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <footer className="px-5 py-2 border-t border-border bg-surface-2 text-xs text-muted">
          Astuce : appuie sur <span className="kbd">?</span> à tout moment pour ouvrir cette aide.
        </footer>
      </div>
    </div>
  );
}
