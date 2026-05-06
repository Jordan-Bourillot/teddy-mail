import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@/lib/store';
import { Avatar } from './Avatar';
import { BulkActionBar } from './BulkActionBar';
import { formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';

export function MailList() {
  const threads = useStore(useShallow((s) => s.visibleThreads()));
  const mails = useStore((s) => s.mails);
  const selectedThreadId = useStore((s) => s.selectedThreadId);
  const selectThread = useStore((s) => s.selectThread);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const saveCurrentSearch = useStore((s) => s.saveCurrentSearch);
  const checked = useStore((s) => s.selectedThreadIds);
  const toggleCheck = useStore((s) => s.toggleThreadCheck);
  const labelsList = useStore((s) => s.labels);
  const isCheckMode = checked.size > 0;

  return (
    <div className="flex-1 flex flex-col bg-bg border-r border-border min-w-0 md:min-w-[320px] md:max-w-[460px]">
      <header className="h-12 px-4 flex items-center justify-between border-b border-border shrink-0 gap-2">
        <h2 className="text-sm font-semibold truncate">
          {searchQuery ? `Recherche : ${searchQuery}` : 'Boîte de réception'}
        </h2>
        {searchQuery && (
          <button
            onClick={() => {
              const name = window.prompt('Nom de la vue ?', searchQuery.slice(0, 30));
              if (name?.trim()) saveCurrentSearch(name.trim());
            }}
            className="text-xs px-2 py-0.5 rounded border border-border hover:border-accent hover:text-accent transition shrink-0"
            title="Sauvegarder cette recherche dans la sidebar"
          >
            ★ Sauver
          </button>
        )}
        <span className="text-xs text-muted shrink-0">{threads.length}</span>
      </header>

      <BulkActionBar />

      <ul className="flex-1 overflow-y-auto" role="list">
        {threads.length === 0 && (
          <li className="p-8 text-center text-muted">
            <div className="text-3xl mb-2">·</div>
            <div className="text-sm">
              {searchQuery ? 'Aucun résultat.' : 'Boîte vide. Profite du calme.'}
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-xs text-accent hover:underline"
              >
                Effacer la recherche
              </button>
            )}
          </li>
        )}
        {threads.map((t) => {
          const threadMails = mails.filter((m) => m.threadId === t.id);
          const last = threadMails[threadMails.length - 1];
          if (!last) return null;
          const unread = threadMails.some((m) => !m.read);
          const isChecked = checked.has(t.id);
          return (
            <li key={t.id} className="border-b border-border">
              <div
                className={[
                  'w-full flex gap-3 px-4 py-3 transition cursor-pointer',
                  selectedThreadId === t.id && !isCheckMode ? 'bg-surface-2' : '',
                  isChecked ? 'bg-accent/10' : 'hover:bg-surface',
                ].join(' ')}
                onClick={() => {
                  if (isCheckMode) toggleCheck(t.id);
                  else selectThread(t.id);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') selectThread(t.id);
                  if (e.key === ' ') {
                    e.preventDefault();
                    toggleCheck(t.id);
                  }
                }}
              >
                <CheckOrAvatar
                  isChecked={isChecked}
                  onToggle={(e) => {
                    e.stopPropagation();
                    toggleCheck(t.id);
                  }}
                  name={last.from.name ?? ''}
                  email={last.from.email}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={['truncate', unread ? 'font-semibold text-text' : 'text-text'].join(' ')}>
                      {last.from.name ?? last.from.email}
                    </span>
                    <span className="text-xs text-muted shrink-0">
                      {formatDistanceToNowStrict(new Date(last.receivedAt), { addSuffix: false, locale: fr })}
                    </span>
                  </div>
                  <div className={['truncate text-sm', unread ? 'text-text' : 'text-muted'].join(' ')}>
                    {last.subject}
                  </div>
                  <div className="truncate text-xs text-muted mt-0.5">
                    {last.bodyText.split('\n').join(' ').slice(0, 120)}
                  </div>
                  {(() => {
                    const ids = Array.from(new Set(threadMails.flatMap((m) => m.labels)));
                    if (ids.length === 0) return null;
                    return (
                      <div className="flex gap-1 mt-1">
                        {ids.slice(0, 3).map((id) => {
                          const lbl = labelsList.find((l) => l.id === id);
                          if (!lbl) return null;
                          return (
                            <span
                              key={id}
                              className="text-[10px] px-1.5 py-0.5 rounded text-white"
                              style={{ background: lbl.color }}
                            >
                              {lbl.name}
                            </span>
                          );
                        })}
                      </div>
                    );
                  })()}
                  <MailBadges
                    starred={threadMails.some((m) => m.starred)}
                    trackers={threadMails.reduce((sum, m) => sum + m.trackersBlocked, 0)}
                    attachments={threadMails.reduce((sum, m) => sum + m.attachments.length, 0)}
                    category={t.category}
                    count={threadMails.length}
                    {...(threadMails.find((m) => m.snoozedUntil)?.snoozedUntil
                      ? { snoozedUntil: threadMails.find((m) => m.snoozedUntil)!.snoozedUntil }
                      : {})}
                  />
                </div>
                {unread && !isChecked && (
                  <span
                    aria-label="non lu"
                    className="self-center w-2 h-2 rounded-full bg-accent shrink-0"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CheckOrAvatar({
  isChecked,
  onToggle,
  name,
  email,
}: {
  isChecked: boolean;
  onToggle: (e: React.MouseEvent) => void;
  name: string;
  email: string;
}) {
  return (
    <div className="relative shrink-0 group">
      <button
        type="button"
        onClick={onToggle}
        aria-label={isChecked ? 'Désélectionner' : 'Sélectionner'}
        className={[
          'w-9 h-9 rounded flex items-center justify-center transition',
          isChecked
            ? 'bg-accent text-white border-2 border-accent'
            : 'opacity-0 group-hover:opacity-100 absolute inset-0 bg-surface-2 border-2 border-border hover:border-accent z-10',
        ].join(' ')}
      >
        {isChecked && '✓'}
      </button>
      <div className={isChecked ? 'invisible' : 'group-hover:invisible'}>
        <Avatar name={name} email={email} size={36} />
      </div>
    </div>
  );
}

function MailBadges({
  starred,
  trackers,
  attachments,
  category,
  count,
  snoozedUntil,
}: {
  starred: boolean;
  trackers: number;
  attachments: number;
  category: string;
  count: number;
  snoozedUntil?: string | undefined;
}) {
  return (
    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted">
      {count > 1 && <span className="px-1.5 py-0.5 rounded bg-surface-2">{count}</span>}
      {starred && <span className="text-warning" aria-label="favori">★</span>}
      {attachments > 0 && <span aria-label={`${attachments} pièces jointes`}>📎 {attachments}</span>}
      {trackers > 0 && (
        <span className="text-success" aria-label={`${trackers} traceurs bloqués`}>
          ⊘ {trackers}
        </span>
      )}
      {snoozedUntil && (() => {
        const ms = new Date(snoozedUntil).getTime() - Date.now();
        if (ms <= 0) return null;
        const label = formatCountdown(ms);
        return (
          <span className="text-warning" aria-label={`Reporté, réveil dans ${label}`}>
            🌙 {label}
          </span>
        );
      })()}
      <span className="ml-auto text-[10px] uppercase tracking-wider opacity-70">{category}</span>
    </div>
  );
}

function formatCountdown(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  return `${days} j`;
}
