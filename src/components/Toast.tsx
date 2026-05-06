import { useStore } from '@/lib/store';

export function Toast() {
  const toast = useStore((s) => s.toast);
  const dismiss = useStore((s) => s.dismissToast);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-surface border border-border rounded shadow-lg px-4 py-2 flex items-center gap-3 text-sm"
    >
      <span>{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.run();
            dismiss();
          }}
          className="text-accent font-medium hover:underline"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={dismiss}
        aria-label="Fermer la notification"
        className="text-muted hover:text-text"
      >
        ✕
      </button>
    </div>
  );
}
