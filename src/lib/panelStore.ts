// Tiny event bus for panels that live inside the Sidebar (Drafts, Scheduled,
// Insights, Accounts). The Sidebar owns the open/close state; the App-level
// keyboard handler dispatches via this bus.

type PanelKey = 'drafts' | 'scheduled' | 'insights' | 'accounts' | 'add-account';
type Listener = (key: PanelKey) => void;

const listeners: Set<Listener> = new Set();

export function emitOpenPanel(key: PanelKey): void {
  listeners.forEach((l) => l(key));
}

export function onOpenPanel(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export type { PanelKey };
