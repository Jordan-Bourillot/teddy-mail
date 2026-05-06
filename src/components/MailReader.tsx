import { useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@/lib/store';
import { renderMarkdown } from '@/lib/markdown';
import { Avatar } from './Avatar';
import { QuickReply } from './QuickReply';
import { FindInMail } from './FindInMail';
import { snoozePresets } from '@/lib/snooze';
import { neutralizeTrackers } from '@/lib/trackers';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function MailReader() {
  const threadId = useStore((s) => s.selectedThreadId);
  const mails = useStore(useShallow((s) => (threadId ? s.threadMails(threadId) : [])));
  const archive = useStore((s) => s.archive);
  const trash = useStore((s) => s.trash);
  const toggleStar = useStore((s) => s.toggleStar);
  const snooze = useStore((s) => s.snooze);
  const openCompose = useStore((s) => s.openCompose);
  const openForward = useStore((s) => s.openForward);
  const blockTrackers = useStore((s) => s.prefs.blockTrackers);

  const [showSnooze, setShowSnooze] = useState(false);
  const [showFind, setShowFind] = useState(false);

  // Cmd/Ctrl+F opens the find bar (only when a thread is open)
  useEffect(() => {
    if (!threadId) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
        const target = e.target as HTMLElement | null;
        if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
        e.preventDefault();
        setShowFind(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [threadId]);

  if (!threadId || mails.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted bg-bg">
        <div className="text-center">
          <div className="text-4xl mb-2">·</div>
          <div className="text-sm">Sélectionne un mail.</div>
        </div>
      </div>
    );
  }

  const last = mails[mails.length - 1];
  if (!last) return null;
  const earlier = mails.slice(0, -1);

  const onArchive = () => archive(mails.map((m) => m.id));
  const onTrash = () => trash(mails.map((m) => m.id));
  const onReply = () => openCompose(last);
  const onForward = () => openForward(last);

  return (
    <div className="flex-1 flex flex-col bg-surface min-w-0 md:min-w-[420px] relative">
      <header className="h-12 px-4 flex items-center gap-2 border-b border-border shrink-0 print-hide">
        <button onClick={onArchive} className="px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition" title="Archiver (E)">
          Archiver
        </button>
        <button onClick={onTrash} className="px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition" title="Supprimer (#)">
          Supprimer
        </button>
        <div className="relative">
          <button
            onClick={() => setShowSnooze((v) => !v)}
            className="px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition"
            title="Snooze (H)"
          >
            Snooze
          </button>
          {showSnooze && (
            <SnoozeMenu
              onPick={(iso) => {
                snooze(mails.map((m) => m.id), iso);
                setShowSnooze(false);
              }}
              onClose={() => setShowSnooze(false)}
            />
          )}
        </div>
        <button
          onClick={() => toggleStar(last.id)}
          className="px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition"
          title="Favori (S)"
        >
          {last.starred ? '★ Favori' : '☆ Favori'}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition"
            title="Imprimer ce thread (Ctrl/Cmd+P)"
          >
            🖨
          </button>
          <button
            onClick={onForward}
            className="px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition"
            title="Transférer (F)"
          >
            Transférer
          </button>
          <button onClick={onReply} className="px-3 py-1 text-sm rounded bg-accent text-white hover:opacity-90 transition" title="Répondre (R)">
            Répondre
          </button>
        </div>
      </header>

      <FindInMail
        scopeSelector='[data-find-scope="reader"]'
        open={showFind}
        onClose={() => setShowFind(false)}
      />
      <div data-find-scope="reader" className="flex-1 overflow-y-auto print-region">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <h1 className="text-xl font-semibold mb-3 leading-snug">{last.subject}</h1>

          {earlier.length > 0 && (
            <details className="mb-4">
              <summary className="text-sm text-muted cursor-pointer hover:text-text">
                + {earlier.length} message{earlier.length > 1 ? 's' : ''} précédent{earlier.length > 1 ? 's' : ''}
              </summary>
              <div className="mt-2 space-y-3">
                {earlier.map((m) => (
                  <SingleMail key={m.id} mail={m} blockTrackers={blockTrackers} compact />
                ))}
              </div>
            </details>
          )}

          <SingleMail mail={last} blockTrackers={blockTrackers} />

          {last.engagements && last.engagements.length > 0 && (
            <aside className="mt-6 p-3 rounded border border-border bg-surface-2">
              <div className="text-xs uppercase tracking-wider text-muted mb-2">Engagements détectés</div>
              <ul className="space-y-1 text-sm">
                {last.engagements.map((e, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-warning shrink-0">⚑</span>
                    <span>{e.text}</span>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <QuickReply replyTo={last} />
        </div>
      </div>
    </div>
  );
}

function SnoozeMenu({ onPick, onClose }: { onPick: (iso: string) => void; onClose: () => void }) {
  const [custom, setCustom] = useState('');
  // Default to tomorrow 09:00 in local time
  const defaultLocal = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return toLocalInputValue(d);
  }, []);

  return (
    <div
      className="absolute left-0 mt-1 z-20 w-64 bg-surface border border-border rounded shadow-lg p-1"
      onClick={(e) => e.stopPropagation()}
    >
      {snoozePresets.map((p) => (
        <button
          key={p.preset}
          onClick={() => onPick(p.resolveAt().toISOString())}
          className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-surface-2"
        >
          {p.label}
        </button>
      ))}
      <div className="my-1 border-t border-border" />
      <div className="px-2 py-2">
        <div className="text-xs text-muted mb-1">Date personnalisée</div>
        <input
          type="datetime-local"
          value={custom || defaultLocal}
          onChange={(e) => setCustom(e.target.value)}
          className="w-full px-2 py-1 text-sm rounded border border-border bg-bg outline-none focus:border-accent"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={onClose}
            className="flex-1 px-2 py-1 text-xs rounded hover:bg-surface-2"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              const v = custom || defaultLocal;
              const d = new Date(v);
              if (Number.isNaN(d.getTime())) return;
              onPick(d.toISOString());
            }}
            className="flex-1 px-2 py-1 text-xs rounded bg-accent text-white hover:opacity-90"
          >
            Reporter
          </button>
        </div>
      </div>
    </div>
  );
}

function PlainBodyMarkdown({ body }: { body: string }) {
  const html = useMemo(() => {
    const raw = renderMarkdown(body);
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'a', 'ul', 'ol', 'li', 'blockquote'],
      ALLOWED_ATTR: ['href', 'rel', 'target'],
    });
  }, [body]);
  return (
    <div
      className="text-[15px] leading-relaxed font-sans [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:ml-4 [&_ul]:list-disc [&_ol]:list-decimal [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted [&_blockquote]:my-2 [&_a]:text-accent [&_a]:underline [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function toLocalInputValue(d: Date): string {
  // datetime-local expects "YYYY-MM-DDTHH:MM" in local TZ.
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SingleMail({
  mail,
  blockTrackers,
  compact = false,
}: {
  mail: ReturnType<NonNullable<ReturnType<typeof useStore.getState>['threadMails']>>[number];
  blockTrackers: boolean;
  compact?: boolean;
}) {
  const safeHtml = useMemo(() => {
    if (!mail.bodyHtml) return null;
    const cleaned = blockTrackers ? neutralizeTrackers(mail.bodyHtml).sanitized : mail.bodyHtml;
    return DOMPurify.sanitize(cleaned, {
      ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'style', 'class'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
    });
  }, [mail.bodyHtml, blockTrackers]);

  return (
    <article className={compact ? 'pb-3 border-b border-border last:border-0' : ''}>
      <header className="flex items-start gap-3 mb-3">
        <Avatar name={mail.from.name ?? ''} email={mail.from.email} size={compact ? 28 : 40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium truncate">
              {mail.from.name ?? mail.from.email}
              <span className="text-muted font-normal text-sm ml-1">&lt;{mail.from.email}&gt;</span>
            </span>
            <time className="text-xs text-muted shrink-0">
              {format(new Date(mail.receivedAt), 'PPpp', { locale: fr })}
            </time>
          </div>
          <div className="text-xs text-muted">
            à {mail.to.map((t) => t.email).join(', ')}
            {mail.trackersBlocked > 0 && (
              <span className="ml-2 text-success">⊘ {mail.trackersBlocked} traceur(s) bloqué(s)</span>
            )}
          </div>
        </div>
      </header>

      {safeHtml ? (
        <div
          className="prose prose-sm max-w-none"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : (
        <PlainBodyMarkdown body={mail.bodyText} />
      )}

      {mail.attachments.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {mail.attachments.map((a) => (
            <div
              key={a.id}
              className="px-3 py-2 rounded border border-border bg-surface-2 text-sm flex items-center gap-2"
            >
              <span aria-hidden>📎</span>
              <span className="font-medium">{a.filename}</span>
              <span className="text-xs text-muted">{(a.sizeBytes / 1024).toFixed(0)} ko</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
