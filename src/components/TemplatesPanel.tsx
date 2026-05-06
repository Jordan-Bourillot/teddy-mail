import { useState } from 'react';
import { useStore } from '@/lib/store';
import { newTemplate } from '@/lib/templates';
import type { Template } from '@/types';

interface Props {
  onClose: () => void;
}

export function TemplatesPanel({ onClose }: Props) {
  const templates = useStore((s) => s.templates);
  const upsert = useStore((s) => s.upsertTemplate);
  const remove = useStore((s) => s.deleteTemplate);
  const [activeId, setActiveId] = useState<string>(templates[0]?.id ?? '');

  const active = templates.find((t) => t.id === activeId);

  const create = () => {
    const t = newTemplate();
    upsert(t);
    setActiveId(t.id);
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Modèles de mail"
    >
      <div
        className="w-[820px] max-w-[calc(100vw-2rem)] max-h-[85vh] flex bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="w-60 shrink-0 border-r border-border bg-surface-2 flex flex-col">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold">Modèles</h2>
            <p className="text-[11px] text-muted mt-0.5">Insertion via ⌘ /</p>
          </header>
          <ul className="flex-1 overflow-y-auto py-1">
            {templates.length === 0 && (
              <li className="px-4 py-3 text-xs text-muted">Aucun modèle.</li>
            )}
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setActiveId(t.id)}
                  className={[
                    'w-full text-left px-3 py-2 text-sm transition flex items-center gap-2',
                    activeId === t.id ? 'bg-bg' : 'hover:bg-bg/50',
                  ].join(' ')}
                >
                  <span className="flex-1 truncate font-medium">{t.name}</span>
                  {t.shortcut && (
                    <span className="text-[10px] text-muted font-mono">/{t.shortcut}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          <footer className="px-3 py-2 border-t border-border">
            <button
              onClick={create}
              className="w-full px-3 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition"
            >
              + Nouveau modèle
            </button>
          </footer>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <header className="px-5 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
            <h2 className="text-base font-semibold">{active?.name ?? 'Aucun modèle'}</h2>
            <button onClick={onClose} className="px-2 py-1 text-sm rounded hover:bg-surface-2">
              ✕
            </button>
          </header>
          {active ? (
            <Editor
              key={active.id}
              template={active}
              onChange={(patch) => upsert({ ...active, ...patch })}
              onDelete={() => {
                remove(active.id);
                setActiveId(templates.find((t) => t.id !== active.id)?.id ?? '');
              }}
            />
          ) : (
            <div className="p-8 text-center text-muted text-sm">
              Crée un modèle pour commencer.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Editor({
  template,
  onChange,
  onDelete,
}: {
  template: Template;
  onChange: (patch: Partial<Template>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-5 space-y-4">
      <Field label="Nom">
        <input
          type="text"
          value={template.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full px-3 py-2 rounded border border-border bg-bg text-sm outline-none focus:border-accent"
        />
      </Field>

      <Field label="Raccourci">
        <div className="flex items-center gap-2">
          <span className="text-muted text-sm">/</span>
          <input
            type="text"
            value={template.shortcut ?? ''}
            onChange={(e) => onChange({ shortcut: e.target.value.replace(/\s+/g, '') })}
            placeholder="dispo"
            className="flex-1 px-3 py-2 rounded border border-border bg-bg text-sm font-mono outline-none focus:border-accent"
          />
        </div>
        <div className="mt-1 text-[11px] text-muted">
          Optionnel. Affiché dans le sélecteur. Réservé pour la complétion automatique en V0.3.
        </div>
      </Field>

      <Field label="Corps">
        <textarea
          value={template.body}
          onChange={(e) => onChange({ body: e.target.value })}
          rows={12}
          placeholder={'Bonjour {{first_name}},\n\n…\n\n{{my_name}}'}
          className="w-full px-3 py-2 rounded border border-border bg-bg text-sm font-sans outline-none focus:border-accent resize-y"
        />
        <div className="mt-1 text-[11px] text-muted">
          Variables : <code>{'{{first_name}}'}</code> · <code>{'{{my_name}}'}</code> ·{' '}
          <code>{'{{my_email}}'}</code> · <code>{'{{date}}'}</code> · <code>{'{{time}}'}</code>
        </div>
      </Field>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-[11px] text-muted">
          {template.lastUsedAt
            ? `Dernière utilisation : ${new Date(template.lastUsedAt).toLocaleDateString('fr-FR')}`
            : 'Jamais utilisé'}
        </span>
        <button
          onClick={() => {
            if (window.confirm(`Supprimer le modèle "${template.name}" ?`)) {
              onDelete();
            }
          }}
          className="px-3 py-1.5 text-xs rounded border border-border hover:bg-danger/10 hover:text-danger hover:border-danger transition"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
