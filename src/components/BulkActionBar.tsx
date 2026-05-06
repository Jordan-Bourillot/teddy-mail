import { useState } from 'react';
import { useStore } from '@/lib/store';
import { snoozePresets } from '@/lib/snooze';

export function BulkActionBar() {
  const count = useStore((s) => s.selectedThreadIds.size);
  const clear = useStore((s) => s.clearSelection);
  const archive = useStore((s) => s.bulkArchive);
  const trash = useStore((s) => s.bulkTrash);
  const snooze = useStore((s) => s.bulkSnooze);
  const markRead = useStore((s) => s.bulkMarkRead);
  const selectAll = useStore((s) => s.selectAllVisible);
  const visibleCount = useStore((s) => s.visibleThreads().length);
  const [showSnooze, setShowSnooze] = useState(false);

  if (count === 0) return null;

  return (
    <div className="px-4 py-2 border-b border-border bg-accent/10 flex items-center gap-2 text-sm">
      <button
        onClick={clear}
        className="w-5 h-5 rounded border border-accent bg-accent text-white flex items-center justify-center"
        aria-label="Tout désélectionner"
        title="Tout désélectionner"
      >
        ✓
      </button>
      <span className="font-medium">
        {count} sélectionné{count > 1 ? 's' : ''}
      </span>
      {count < visibleCount && (
        <button onClick={selectAll} className="text-xs text-accent hover:underline">
          Tout sélectionner ({visibleCount})
        </button>
      )}

      <div className="flex-1" />

      <button
        onClick={archive}
        className="px-2.5 py-1 rounded hover:bg-bg transition"
        title="Archiver"
      >
        Archiver
      </button>
      <button
        onClick={() => markRead(true)}
        className="px-2.5 py-1 rounded hover:bg-bg transition"
        title="Marquer comme lus"
      >
        Lus
      </button>
      <div className="relative">
        <button
          onClick={() => setShowSnooze((v) => !v)}
          className="px-2.5 py-1 rounded hover:bg-bg transition"
          title="Snooze"
        >
          Snooze
        </button>
        {showSnooze && (
          <div className="absolute right-0 mt-1 z-20 w-64 bg-surface border border-border rounded shadow-lg p-1">
            {snoozePresets.map((p) => (
              <button
                key={p.preset}
                onClick={() => {
                  snooze(p.resolveAt().toISOString());
                  setShowSnooze(false);
                }}
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
                onChange={(e) => {
                  const d = new Date(e.target.value);
                  if (Number.isNaN(d.getTime())) return;
                  snooze(d.toISOString());
                  setShowSnooze(false);
                }}
                className="w-full px-2 py-1 text-sm rounded border border-border bg-bg outline-none focus:border-accent"
              />
            </div>
          </div>
        )}
      </div>
      <button
        onClick={trash}
        className="px-2.5 py-1 rounded hover:bg-danger/10 hover:text-danger transition"
        title="Supprimer"
      >
        Supprimer
      </button>
      <button
        onClick={clear}
        className="px-2 py-1 rounded hover:bg-bg transition text-muted"
        title="Annuler"
      >
        ✕
      </button>
    </div>
  );
}
