import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStore } from '@/lib/store';
export function Toast() {
    const toast = useStore((s) => s.toast);
    const dismiss = useStore((s) => s.dismissToast);
    if (!toast)
        return null;
    return (_jsxs("div", { role: "status", "aria-live": "polite", className: "fixed bottom-12 left-1/2 -translate-x-1/2 z-50 bg-surface border border-border rounded shadow-lg px-4 py-2 flex items-center gap-3 text-sm", children: [_jsx("span", { children: toast.message }), toast.action && (_jsx("button", { onClick: () => {
                    toast.action?.run();
                    dismiss();
                }, className: "text-accent font-medium hover:underline", children: toast.action.label })), _jsx("button", { onClick: dismiss, "aria-label": "Fermer la notification", className: "text-muted hover:text-text", children: "\u2715" })] }));
}
