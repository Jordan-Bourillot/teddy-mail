import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { rankTemplates, expandTemplate } from '@/lib/templates';

interface Props {
  /**
   * Called when the user picks a template. Receives the expanded body
   * (variables substituted). Caller is responsible for inserting it.
   */
  onPick: (expandedBody: string) => void;
}

export function TemplatePicker({ onPick }: Props) {
  const open = useStore((s) => s.templatePickerOpen);
  const close = useStore((s) => s.closeTemplatePicker);
  const templates = useStore((s) => s.templates);
  const markUsed = useStore((s) => s.markTemplateUsed);
  const draft = useStore((s) => s.composeDraft);
  const accounts = useStore((s) => s.accounts);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const account = accounts.find((a) => a.id === draft?.accountId);
  const recipient = draft?.to[0];

  const ranked = useMemo(() => rankTemplates(templates, query), [templates, query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, ranked.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const tpl = ranked[activeIndex];
        if (!tpl) return;
        const expanded = expandTemplate(tpl.body, {
          ...(recipient?.name ? { recipientName: recipient.name } : {}),
          ...(recipient?.email ? { recipientEmail: recipient.email } : {}),
          ...(account?.displayName ? { myName: account.displayName } : {}),
          ...(account?.email ? { myEmail: account.email } : {}),
        });
        markUsed(tpl.id);
        onPick(expanded);
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, ranked, activeIndex, account, recipient, markUsed, onPick, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Insérer un modèle"
    >
      <div
        className="w-[560px] max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-border">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Filtrer les modèles…"
            className="w-full bg-transparent text-base outline-none"
          />
        </div>
        <ul className="max-h-[420px] overflow-y-auto">
          {ranked.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted">
              Aucun modèle. Crée-en depuis Préférences → Modèles.
            </li>
          )}
          {ranked.map((t, i) => (
            <li
              key={t.id}
              onClick={() => {
                const expanded = expandTemplate(t.body, {
                  ...(recipient?.name ? { recipientName: recipient.name } : {}),
                  ...(recipient?.email ? { recipientEmail: recipient.email } : {}),
                  ...(account?.displayName ? { myName: account.displayName } : {}),
                  ...(account?.email ? { myEmail: account.email } : {}),
                });
                markUsed(t.id);
                onPick(expanded);
                close();
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={[
                'px-4 py-2.5 cursor-pointer flex flex-col gap-0.5 border-b border-border last:border-0',
                i === activeIndex ? 'bg-surface-2' : '',
              ].join(' ')}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium truncate">{t.name}</span>
                {t.shortcut && (
                  <span className="text-[11px] text-muted font-mono">/{t.shortcut}</span>
                )}
              </div>
              <span className="text-xs text-muted truncate">
                {t.body.split('\n')[0] ?? ''}
              </span>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2 border-t border-border text-xs text-muted flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><span className="kbd">↑↓</span> naviguer</span>
            <span><span className="kbd">↵</span> insérer</span>
            <span><span className="kbd">Esc</span> fermer</span>
          </div>
          <span className="text-[10px]">Variables : {'{{first_name}}'} {'{{my_name}}'} {'{{date}}'}</span>
        </div>
      </div>
    </div>
  );
}
