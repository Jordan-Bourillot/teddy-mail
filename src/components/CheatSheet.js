import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { describeCombo, getProfile } from '@/lib/hotkeys';
export function CheatSheet() {
    const open = useStore((s) => s.cheatSheetOpen);
    const close = useStore((s) => s.closeCheatSheet);
    const profile = useStore((s) => s.prefs.keyboardProfile);
    const [filter, setFilter] = useState('');
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, close]);
    const entries = useMemo(() => {
        const p = getProfile(profile);
        return [
            { action: 'commandPalette', combo: p.commandPalette, label: 'Palette de commandes', group: 'Recherche' },
            { action: 'search', combo: p.search, label: 'Recherche rapide', group: 'Recherche' },
            { action: 'next', combo: p.next, label: 'Mail suivant', group: 'Navigation' },
            { action: 'prev', combo: p.prev, label: 'Mail précédent', group: 'Navigation' },
            { action: 'cycleAccount', combo: p.cycleAccount, label: 'Compte suivant', group: 'Navigation' },
            { action: 'toggleFocus', combo: p.toggleFocus, label: 'Mode focus', group: 'Navigation' },
            { action: 'archive', combo: p.archive, label: 'Archiver', group: 'Action mail' },
            { action: 'delete', combo: p.delete, label: 'Supprimer', group: 'Action mail' },
            { action: 'snooze', combo: p.snooze, label: 'Snooze', group: 'Action mail' },
            { action: 'star', combo: p.star, label: 'Favori', group: 'Action mail' },
            { action: 'markRead', combo: p.markRead, label: 'Basculer lu / non lu', group: 'Action mail' },
            { action: 'compose', combo: p.compose, label: 'Nouveau message', group: 'Composition' },
            { action: 'reply', combo: p.reply, label: 'Répondre', group: 'Composition' },
            { action: 'replyAll', combo: p.replyAll, label: 'Répondre à tous', group: 'Composition' },
            { action: 'forward', combo: p.forward, label: 'Transférer', group: 'Composition' },
            { action: 'undoSend', combo: p.undoSend, label: "Annuler l'envoi", group: 'Composition' },
            { action: 'help', combo: '?', label: 'Afficher cette aide', group: 'Aide' },
            { action: 'help', combo: 'esc', label: 'Fermer la modale courante', group: 'Aide' },
        ];
    }, [profile]);
    const filtered = useMemo(() => {
        const f = filter.trim().toLowerCase();
        if (!f)
            return entries;
        return entries.filter((e) => e.label.toLowerCase().includes(f) || e.combo.includes(f));
    }, [entries, filter]);
    const grouped = useMemo(() => {
        const g = {};
        for (const e of filtered) {
            g[e.group] = g[e.group] ?? [];
            g[e.group].push(e);
        }
        return g;
    }, [filtered]);
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-[10vh]", onClick: close, role: "dialog", "aria-modal": "true", "aria-label": "Raccourcis clavier", children: _jsxs("div", { className: "w-[680px] max-w-[calc(100vw-2rem)] max-h-[80vh] flex flex-col bg-surface border border-border rounded-lg shadow-2xl overflow-hidden", onClick: (e) => e.stopPropagation(), children: [_jsxs("header", { className: "px-5 py-3 border-b border-border flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-base font-semibold", children: "Raccourcis clavier" }), _jsxs("p", { className: "text-xs text-muted", children: ["profil ", _jsx("span", { className: "font-mono", children: profile }), " \u00B7 personnalisable dans les pr\u00E9f\u00E9rences"] })] }), _jsx("button", { onClick: close, className: "px-2 py-1 text-sm rounded hover:bg-surface-2", children: "\u2715" })] }), _jsx("div", { className: "px-5 py-3 border-b border-border", children: _jsx("input", { type: "text", value: filter, onChange: (e) => setFilter(e.target.value), placeholder: "Filtrer (ex: archiver, snooze, \u2318\u2026)", className: "w-full bg-bg border border-border rounded px-3 py-1.5 text-sm outline-none focus:border-accent", autoFocus: true }) }), _jsxs("div", { className: "flex-1 overflow-y-auto p-5 space-y-5", children: [Object.entries(grouped).length === 0 && (_jsx("div", { className: "text-center text-sm text-muted py-8", children: "Aucun raccourci ne correspond." })), Object.entries(grouped).map(([group, items]) => (_jsxs("section", { children: [_jsx("h3", { className: "text-xs uppercase tracking-wider text-muted mb-2", children: group }), _jsx("ul", { className: "space-y-1", children: items.map((e) => (_jsxs("li", { className: "flex items-center justify-between px-3 py-1.5 rounded hover:bg-surface-2", children: [_jsx("span", { className: "text-sm", children: e.label }), _jsx("span", { className: "kbd", children: describeCombo(e.combo) })] }, `${e.action}-${e.combo}`))) })] }, group)))] }), _jsxs("footer", { className: "px-5 py-2 border-t border-border bg-surface-2 text-xs text-muted", children: ["Astuce : appuie sur ", _jsx("span", { className: "kbd", children: "?" }), " \u00E0 tout moment pour ouvrir cette aide."] })] }) }));
}
