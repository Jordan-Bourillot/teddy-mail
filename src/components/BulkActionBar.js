import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    if (count === 0)
        return null;
    return (_jsxs("div", { className: "px-4 py-2 border-b border-border bg-accent/10 flex items-center gap-2 text-sm", children: [_jsx("button", { onClick: clear, className: "w-5 h-5 rounded border border-accent bg-accent text-white flex items-center justify-center", "aria-label": "Tout d\u00E9s\u00E9lectionner", title: "Tout d\u00E9s\u00E9lectionner", children: "\u2713" }), _jsxs("span", { className: "font-medium", children: [count, " s\u00E9lectionn\u00E9", count > 1 ? 's' : ''] }), count < visibleCount && (_jsxs("button", { onClick: selectAll, className: "text-xs text-accent hover:underline", children: ["Tout s\u00E9lectionner (", visibleCount, ")"] })), _jsx("div", { className: "flex-1" }), _jsx("button", { onClick: archive, className: "px-2.5 py-1 rounded hover:bg-bg transition", title: "Archiver", children: "Archiver" }), _jsx("button", { onClick: () => markRead(true), className: "px-2.5 py-1 rounded hover:bg-bg transition", title: "Marquer comme lus", children: "Lus" }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowSnooze((v) => !v), className: "px-2.5 py-1 rounded hover:bg-bg transition", title: "Snooze", children: "Snooze" }), showSnooze && (_jsxs("div", { className: "absolute right-0 mt-1 z-20 w-64 bg-surface border border-border rounded shadow-lg p-1", children: [snoozePresets.map((p) => (_jsx("button", { onClick: () => {
                                    snooze(p.resolveAt().toISOString());
                                    setShowSnooze(false);
                                }, className: "w-full text-left px-3 py-1.5 text-sm rounded hover:bg-surface-2", children: p.label }, p.preset))), _jsx("div", { className: "my-1 border-t border-border" }), _jsxs("div", { className: "px-2 py-2", children: [_jsx("div", { className: "text-xs text-muted mb-1", children: "Date personnalis\u00E9e" }), _jsx("input", { type: "datetime-local", onChange: (e) => {
                                            const d = new Date(e.target.value);
                                            if (Number.isNaN(d.getTime()))
                                                return;
                                            snooze(d.toISOString());
                                            setShowSnooze(false);
                                        }, className: "w-full px-2 py-1 text-sm rounded border border-border bg-bg outline-none focus:border-accent" })] })] }))] }), _jsx("button", { onClick: trash, className: "px-2.5 py-1 rounded hover:bg-danger/10 hover:text-danger transition", title: "Supprimer", children: "Supprimer" }), _jsx("button", { onClick: clear, className: "px-2 py-1 rounded hover:bg-bg transition text-muted", title: "Annuler", children: "\u2715" })] }));
}
