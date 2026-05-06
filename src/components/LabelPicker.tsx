// Compact label picker shown in the MailReader header so the user can toggle
// labels on the current thread.

import { useState } from 'react';
import { useStore } from '@/lib/store';
import type { Mail } from '@/types';

interface Props {
  mails: Mail[];
}

export function LabelPicker({ mails }: Props) {
  const labels = useStore((s) => s.labels);
  const toggle = useStore((s) => s.toggleLabelOnMail);
  const upsert = useStore((s) => s.upsertLabel);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const lastMail = mails[mails.length - 1];
  if (!lastMail) return null;

  // Aggregate: a label is "on" if every mail in the thread has it.
  const labelStates = new Map<string, boolean>();
  for (const l of labels) {
    labelStates.set(l.id, mails.every((m) => m.labels.includes(l.id)));
  }

  const colors = ['#22c55e', '#0ea5e9', '#f59e0b', '#ec4899', '#a855f7', '#10b981', '#ef4444', '#6366f1'];
  const createLabel = () => {
    if (!newName.trim()) return;
    const color = colors[labels.length % colors.length] ?? '#6366f1';
    const id = `lbl_${Date.now().toString(36)}`;
    upsert({ id, name: newName.trim(), color });
    // Apply to all mails in the thread.
    mails.forEach((m) => toggle(m.id, id));
    setNewName('');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition"
        title="Ajouter / retirer des labels"
      >
        🏷
      </button>
      {open && (
        <div
          className="absolute left-0 mt-1 z-20 w-64 bg-surface border border-border rounded shadow-lg p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-[11px] uppercase tracking-wider text-muted px-2 pt-2 pb-1">Labels</div>
          {labels.length === 0 && (
            <div className="text-xs text-muted px-3 py-2">Aucun label.</div>
          )}
          {labels.map((l) => {
            const checked = labelStates.get(l.id) ?? false;
            return (
              <button
                key={l.id}
                onClick={() => mails.forEach((m) => toggle(m.id, l.id))}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-2 text-left"
              >
                <span
                  className="w-5 h-5 rounded border flex items-center justify-center text-[10px] text-white"
                  style={{
                    background: checked ? l.color : 'transparent',
                    borderColor: l.color,
                  }}
                >
                  {checked ? '✓' : ''}
                </span>
                <span className="text-sm truncate flex-1">{l.name}</span>
              </button>
            );
          })}
          <div className="border-t border-border my-1" />
          <div className="px-2 py-2 flex gap-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createLabel();
              }}
              placeholder="Nouveau label"
              className="flex-1 px-2 py-1 text-xs rounded border border-border bg-bg outline-none focus:border-accent"
            />
            <button
              onClick={createLabel}
              disabled={!newName.trim()}
              className="px-2 py-1 text-xs rounded bg-accent text-white disabled:opacity-50"
            >
              +
            </button>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-full px-3 py-1 text-[11px] text-muted hover:text-text"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
