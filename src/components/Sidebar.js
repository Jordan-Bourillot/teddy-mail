import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { AddAccount } from './AddAccount';
import { Insights } from './Insights';
export function Sidebar() {
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [showInsights, setShowInsights] = useState(false);
    const accounts = useStore((s) => s.accounts);
    const folders = useStore((s) => s.folders);
    const savedViews = useStore((s) => s.savedViews);
    const selected = useStore((s) => s.selectedFolderId);
    const selectFolder = useStore((s) => s.selectFolder);
    const openCompose = useStore((s) => s.openCompose);
    const focusMode = useStore((s) => s.focusMode);
    const toggleFocus = useStore((s) => s.toggleFocusMode);
    const setSearch = useStore((s) => s.setSearchQuery);
    const pendingSnoozed = useStore((s) => s.mails.filter((m) => m.snoozedUntil && new Date(m.snoozedUntil) > new Date()).length);
    return (_jsxs("aside", { className: "w-60 shrink-0 bg-surface border-r border-border flex flex-col", children: [_jsxs("div", { className: "p-4", children: [_jsx("div", { className: "text-base font-semibold tracking-tight", children: "Pite Lafe Mail" }), _jsx("div", { className: "text-xs text-muted mt-0.5", children: "calme \u00B7 souverain \u00B7 \u00E0 toi" })] }), _jsx("div", { className: "px-3 pb-3", children: _jsx("button", { type: "button", onClick: () => openCompose(), className: "w-full px-3 py-2 rounded bg-accent text-white text-sm font-medium hover:opacity-90 transition", children: "+ \u00C9crire un mail" }) }), _jsxs("nav", { className: "flex-1 overflow-y-auto px-2 text-sm", children: [_jsx(SidebarItem, { label: "Bo\u00EEte unifi\u00E9e", count: undefined, active: selected === 'unified-inbox', onClick: () => {
                            selectFolder('unified-inbox');
                            setSearch('');
                        } }), _jsx(SidebarItem, { label: focusMode ? 'Focus actif' : 'Focus', count: undefined, active: focusMode, onClick: () => toggleFocus(), accent: true }), _jsx(SidebarItem, { label: "Snooze", count: pendingSnoozed || undefined, active: false, onClick: () => setSearch('is:snoozed') }), _jsx(SidebarItem, { label: "Insights", count: undefined, active: false, onClick: () => setShowInsights(true) }), _jsx(SidebarSection, { label: "Vues sauvegard\u00E9es" }), savedViews.map((v) => (_jsx(SidebarItem, { label: v.name, count: undefined, active: false, onClick: () => setSearch(v.query) }, v.id))), accounts.map((a) => (_jsxs("div", { className: "mt-4", children: [_jsx(SidebarSection, { label: a.email, swatch: a.color }), folders
                                .filter((f) => f.accountId === a.id)
                                .map((f) => (_jsx(SidebarItem, { label: f.name, count: f.unreadCount || undefined, active: selected === f.id, onClick: () => selectFolder(f.id) }, f.id)))] }, a.id))), _jsx("button", { type: "button", onClick: () => setShowAddAccount(true), className: "mt-6 w-full px-2 py-1.5 rounded text-left text-xs text-muted hover:bg-surface-2 hover:text-text transition", children: "+ Ajouter un compte" })] }), showAddAccount && _jsx(AddAccount, { onClose: () => setShowAddAccount(false) }), showInsights && _jsx(Insights, { onClose: () => setShowInsights(false) }), _jsxs("div", { className: "p-3 border-t border-border text-xs text-muted", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-success" }), "Connect\u00E9"] }), _jsx("div", { className: "mt-1", children: "v0.1.0 \u00B7 build local" })] })] }));
}
function SidebarItem({ label, count, active, onClick, accent, }) {
    return (_jsxs("button", { type: "button", onClick: onClick, className: [
            'w-full flex items-center justify-between px-2 py-1.5 rounded text-left transition',
            active ? 'bg-surface-2 text-text font-medium' : 'text-muted hover:bg-surface-2 hover:text-text',
            accent ? 'text-accent' : '',
        ].join(' '), children: [_jsx("span", { className: "truncate", children: label }), count !== undefined && (_jsx("span", { className: "text-xs px-1.5 py-0.5 rounded bg-bg text-muted", children: count }))] }));
}
function SidebarSection({ label, swatch }) {
    return (_jsxs("div", { className: "flex items-center gap-2 px-2 mt-3 mb-1 text-[11px] uppercase tracking-wider text-muted", children: [swatch && _jsx("span", { className: "inline-block w-2 h-2 rounded-full", style: { background: swatch } }), _jsx("span", { className: "truncate", children: label })] }));
}
