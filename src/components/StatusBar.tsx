import { useStore } from '@/lib/store';

export function StatusBar() {
  const pending = useStore((s) => s.pendingSends.length);
  const focusMode = useStore((s) => s.focusMode);
  const totalMails = useStore((s) => s.mails.length);
  const totalTrackers = useStore((s) =>
    s.mails.reduce((sum, m) => sum + m.trackersBlocked, 0),
  );
  const openPalette = useStore((s) => s.openCommandPalette);

  return (
    <footer className="h-7 px-4 flex items-center justify-between text-[11px] text-muted bg-surface border-t border-border shrink-0">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" />
          Connecté
        </span>
        {pending > 0 && (
          <span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning mr-1.5 align-middle" />
            {pending} envoi(s) en file
          </span>
        )}
        {focusMode && <span className="text-accent">Mode focus</span>}
      </div>
      <div className="flex items-center gap-4">
        <span>{totalMails} mails locaux</span>
        <span className="text-success">⊘ {totalTrackers} traceurs neutralisés</span>
        <button onClick={openPalette} className="hover:text-text transition">
          Recherche <span className="kbd">⌘K</span>
        </button>
      </div>
    </footer>
  );
}
