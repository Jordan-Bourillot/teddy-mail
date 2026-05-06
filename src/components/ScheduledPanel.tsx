import { useStore } from '@/lib/store';
import { formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Avatar } from './Avatar';

interface Props {
  onClose: () => void;
}

export function ScheduledPanel({ onClose }: Props) {
  const scheduled = useStore((s) => s.scheduled);
  const accounts = useStore((s) => s.accounts);
  const cancel = useStore((s) => s.cancelScheduled);
  const showToast = useStore((s) => s.showToast);

  const sorted = [...scheduled].sort(
    (a, b) => +new Date(a.scheduledFor) - +new Date(b.scheduledFor),
  );

  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Envois programmés"
    >
      <div
        className="w-[680px] max-w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">Envois programmés</h2>
            <p className="text-xs text-muted">{scheduled.length} en attente</p>
          </div>
          <button onClick={onClose} className="px-2 py-1 text-sm rounded hover:bg-surface-2">
            ✕
          </button>
        </header>

        {sorted.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted">
            <div className="text-3xl mb-2">·</div>
            Rien de programmé. Compose un mail puis clique sur ▾ à côté de Envoyer pour planifier l'envoi.
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto">
            {sorted.map((item) => {
              const acc = accounts.find((a) => a.id === item.draft.accountId);
              const recipient = item.draft.to[0];
              const target = new Date(item.scheduledFor);
              return (
                <li key={item.id} className="border-b border-border last:border-0">
                  <div className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2 transition group">
                    <Avatar
                      name={acc?.displayName ?? ''}
                      email={acc?.email ?? ''}
                      {...(acc?.photoUrl ? { photoUrl: acc.photoUrl } : {})}
                      size={32}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium truncate">
                          {item.draft.subject || <span className="italic text-muted">(sans objet)</span>}
                        </span>
                        <span className="text-xs text-warning shrink-0">
                          dans {formatDistanceToNowStrict(target, { locale: fr })}
                        </span>
                      </div>
                      <div className="text-xs text-muted truncate">
                        {recipient
                          ? `À ${recipient.name ?? recipient.email}`
                          : <span className="italic">aucun destinataire</span>}
                        {' · '}
                        depuis {acc?.email ?? '?'}
                      </div>
                      <div className="text-xs text-muted truncate mt-0.5">
                        Cible : {target.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Annuler cet envoi programmé ?')) {
                          cancel(item.id);
                          showToast('Envoi programmé annulé');
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-muted hover:text-danger transition shrink-0"
                      title="Annuler"
                      aria-label="Annuler l'envoi"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <footer className="px-5 py-2 border-t border-border bg-surface-2 text-xs text-muted">
          Persistés localement. La vérification s'exécute toutes les 30s ; en V0.3 desktop le worker Rust gère les déclenchements précis.
        </footer>
      </div>
    </div>
  );
}
