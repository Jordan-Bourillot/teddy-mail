import { useStore } from '@/lib/store';

export function StatusBar() {
  const pending = useStore((s) => s.pendingSends.length);
  const focusMode = useStore((s) => s.focusMode);
  const vacation = useStore((s) => s.prefs.vacation);
  const vacationActive = (() => {
    if (!vacation?.enabled) return false;
    const now = Date.now();
    if (vacation.from && new Date(vacation.from).getTime() > now) return false;
    if (vacation.until && new Date(vacation.until).getTime() + 86_400_000 < now) return false;
    return true;
  })();
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
        {vacationActive && (
          <span className="text-warning" title="Réponse automatique d'absence active">
            🌴 Absence
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>{totalMails} mails locaux</span>
        <span className="text-success">⊘ {totalTrackers} traceurs neutralisés</span>
        <button onClick={openPalette} className="hover:text-text transition">
          Recherche <span className="kbd">⌘K</span>
        </button>
        <TriskellLink />
      </div>
    </footer>
  );
}

function TriskellLink() {
  const open = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = 'https://triskell.studio';
    // In Tauri desktop, prefer the system browser; in web, open a tab.
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (w.__TAURI_INTERNALS__) {
        import('@tauri-apps/plugin-shell').then((m) => m.open(url));
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  return (
    <a
      href="https://triskell.studio"
      onClick={open}
      title="Une création Triskell Studio"
      className="flex items-center gap-1.5 hover:text-text transition group"
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{
          background:
            'linear-gradient(135deg, #6366f1 0%, #a78bfa 50%, #f97316 100%)',
        }}
        aria-hidden
      />
      <span className="group-hover:underline">Triskell Studio</span>
    </a>
  );
}
