import { useStore } from '@/lib/store';
import { formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar } from './Avatar';

interface Props {
  onClose: () => void;
}

export function DraftsPanel({ onClose }: Props) {
  const drafts = useStore((s) => s.drafts);
  const accounts = useStore((s) => s.accounts);
  const resume = useStore((s) => s.resumeDraft);
  const remove = useStore((s) => s.deleteDraft);

  const sorted = [...drafts].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Brouillons"
    >
      <div
        className="w-[680px] max-w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Brouillons</h2>
            <p className="text-xs text-muted">{drafts.length} en attente</p>
          </div>
          <button onClick={onClose} className="px-2 py-1 text-sm rounded hover:bg-surface-2">
            ✕
          </button>
        </header>

        {sorted.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted">
            <div className="text-3xl mb-2">·</div>
            Aucun brouillon. Ferme un compositeur sans envoyer pour en créer un.
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {sorted.map((d) => {
              const account = accounts.find((a) => a.id === d.accountId);
              const recipient = d.to[0];
              const preview = (d.body || '(corps vide)').split('\n').join(' ').slice(0, 140);
              return (
                <li key={d.id} className="border-b border-border last:border-0">
                  <div className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2 transition group">
                    <Avatar
                      name={account?.displayName ?? ''}
                      email={account?.email ?? ''}
                      {...(account?.photoUrl ? { photoUrl: account.photoUrl } : {})}
                      size={32}
                    />
                    <button
                      onClick={() => {
                        resume(d.id);
                        onClose();
                      }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium truncate">
                          {d.subject || <span className="text-muted italic">(sans objet)</span>}
                        </span>
                        <span className="text-xs text-muted shrink-0">
                          {formatDistanceToNowStrict(new Date(d.updatedAt), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                      <div className="text-xs text-muted truncate">
                        {recipient
                          ? `À ${recipient.name ?? recipient.email}`
                          : <span className="italic">aucun destinataire</span>}
                        {' · depuis '}
                        {account?.email ?? '?'}
                      </div>
                      <div className="text-xs text-muted truncate mt-0.5">{preview}</div>
                      {d.attachments.length > 0 && (
                        <div className="text-[11px] text-muted mt-1">
                          📎 {d.attachments.length} pièce(s) jointe(s)
                          <span className="text-warning ml-1">
                            (contenu perdu — à rejoindre avant envoi)
                          </span>
                        </div>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Supprimer ce brouillon ?')) {
                          remove(d.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-muted hover:text-danger transition shrink-0"
                      title="Supprimer"
                      aria-label="Supprimer le brouillon"
                    >
                      🗑
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="px-5 py-2 border-t border-border bg-surface-2 text-xs text-muted">
          Auto-sauvegardés à la fermeture du compositeur. Persistés localement (pas synchronisés).
        </footer>
      </div>
    </div>
  );
}
