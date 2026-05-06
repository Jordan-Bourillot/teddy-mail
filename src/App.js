import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@/lib/store';
import { Onboarding, shouldShowOnboarding } from './components/Onboarding';
import { Sidebar } from './components/Sidebar';
import { MailList } from './components/MailList';
import { MailReader } from './components/MailReader';
import { Composer } from './components/Composer';
import { CommandPalette } from './components/CommandPalette';
import { StatusBar } from './components/StatusBar';
import { Toast } from './components/Toast';
import { CheatSheet } from './components/CheatSheet';
import { SettingsButton } from './components/SettingsPanel';
import { applyTheme } from '@/lib/themes';
import { applyReducedMotion } from '@/lib/sounds';
import { getProfile, matches } from '@/lib/hotkeys';
import { useIsNarrow } from '@/lib/useMediaQuery';
export function App() {
    const [showOnboarding, setShowOnboarding] = useState(() => shouldShowOnboarding());
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isNarrow = useIsNarrow();
    const prefs = useStore((s) => s.prefs);
    const openCompose = useStore((s) => s.openCompose);
    const openPalette = useStore((s) => s.openCommandPalette);
    const setSearch = useStore((s) => s.setSearchQuery);
    const searchQuery = useStore((s) => s.searchQuery);
    const selectedThreadId = useStore((s) => s.selectedThreadId);
    const visibleThreads = useStore(useShallow((s) => s.visibleThreads()));
    const selectThread = useStore((s) => s.selectThread);
    const archive = useStore((s) => s.archive);
    const trash = useStore((s) => s.trash);
    const toggleStar = useStore((s) => s.toggleStar);
    const undoSend = useStore((s) => s.undoSend);
    const toggleFocus = useStore((s) => s.toggleFocusMode);
    const openCheat = useStore((s) => s.openCheatSheet);
    const bulkArchive = useStore((s) => s.bulkArchive);
    const bulkTrash = useStore((s) => s.bulkTrash);
    const clearSelection = useStore((s) => s.clearSelection);
    const selectAllVisible = useStore((s) => s.selectAllVisible);
    const hasSelection = useStore((s) => s.selectedThreadIds.size > 0);
    // Apply theme/density on mount and whenever prefs change
    useEffect(() => {
        applyTheme(prefs.theme, prefs.density, prefs.fontSize);
    }, [prefs.theme, prefs.density, prefs.fontSize]);
    // Apply reduced motion preference, listen to OS changes when "auto"
    useEffect(() => {
        applyReducedMotion(prefs.reducedMotion);
        if (prefs.reducedMotion !== 'auto')
            return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const handler = () => applyReducedMotion(prefs.reducedMotion);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [prefs.reducedMotion]);
    // Global keyboard shortcuts
    useEffect(() => {
        const profile = getProfile(prefs.keyboardProfile);
        const onKey = (e) => {
            // Ignore typing in inputs and textareas, except for explicit mod combos.
            const target = e.target;
            const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
            const hasMod = e.ctrlKey || e.metaKey;
            if (isTyping && !hasMod)
                return;
            // ? opens the cheat sheet (no modifier, not in input)
            if (e.key === '?' && !hasMod) {
                e.preventDefault();
                openCheat();
                return;
            }
            // Esc clears selection if any, before any other handler
            if (e.key === 'Escape' && hasSelection) {
                e.preventDefault();
                clearSelection();
                return;
            }
            // Cmd/Ctrl+A inside the list = select all visible
            if (hasMod && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                selectAllVisible();
                return;
            }
            // Bulk actions when there's an active selection
            if (hasSelection) {
                if (matches(e, profile.archive)) {
                    e.preventDefault();
                    bulkArchive();
                    return;
                }
                if (matches(e, profile.delete)) {
                    e.preventDefault();
                    bulkTrash();
                    return;
                }
            }
            if (matches(e, profile.commandPalette)) {
                e.preventDefault();
                openPalette();
                return;
            }
            if (matches(e, profile.compose)) {
                e.preventDefault();
                openCompose();
                return;
            }
            if (matches(e, profile.search)) {
                e.preventDefault();
                openPalette();
                return;
            }
            if (matches(e, profile.undoSend)) {
                e.preventDefault();
                undoSend();
                return;
            }
            if (matches(e, profile.toggleFocus)) {
                e.preventDefault();
                toggleFocus();
                return;
            }
            if (selectedThreadId) {
                if (matches(e, profile.archive)) {
                    e.preventDefault();
                    const ids = useStore.getState().threadMails(selectedThreadId).map((m) => m.id);
                    archive(ids);
                    return;
                }
                if (matches(e, profile.delete)) {
                    e.preventDefault();
                    const ids = useStore.getState().threadMails(selectedThreadId).map((m) => m.id);
                    trash(ids);
                    return;
                }
                if (matches(e, profile.reply)) {
                    e.preventDefault();
                    const last = useStore.getState().threadMails(selectedThreadId).slice(-1)[0];
                    if (last)
                        openCompose(last);
                    return;
                }
                if (matches(e, profile.star)) {
                    e.preventDefault();
                    const last = useStore.getState().threadMails(selectedThreadId).slice(-1)[0];
                    if (last)
                        toggleStar(last.id);
                    return;
                }
            }
            if (matches(e, profile.next)) {
                e.preventDefault();
                const idx = visibleThreads.findIndex((t) => t.id === selectedThreadId);
                const next = visibleThreads[Math.min(idx + 1, visibleThreads.length - 1)];
                if (next)
                    selectThread(next.id);
                return;
            }
            if (matches(e, profile.prev)) {
                e.preventDefault();
                const idx = visibleThreads.findIndex((t) => t.id === selectedThreadId);
                const prev = visibleThreads[Math.max(idx - 1, 0)];
                if (prev)
                    selectThread(prev.id);
                return;
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [
        prefs.keyboardProfile,
        openCompose,
        openPalette,
        openCheat,
        undoSend,
        selectedThreadId,
        archive,
        trash,
        toggleStar,
        visibleThreads,
        selectThread,
        toggleFocus,
        bulkArchive,
        bulkTrash,
        clearSelection,
        selectAllVisible,
        hasSelection,
    ]);
    return (_jsxs("div", { className: "h-full flex flex-col", children: [_jsxs("header", { className: "h-12 px-3 flex items-center gap-2 bg-surface border-b border-border shrink-0", children: [isNarrow && (_jsx("button", { onClick: () => setSidebarOpen(true), className: "px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition", "aria-label": "Ouvrir le menu", title: "Menu", children: "\u2630" })), isNarrow && selectedThreadId && (_jsx("button", { onClick: () => selectThread(null), className: "px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition", "aria-label": "Retour \u00E0 la liste", title: "Retour", children: "\u2190" })), _jsx("button", { onClick: openPalette, className: "flex-1 max-w-md text-left px-3 py-1.5 text-sm rounded border border-border bg-bg hover:bg-surface-2 text-muted transition", children: searchQuery ? _jsx("span", { className: "text-text", children: searchQuery }) : 'Rechercher · ⌘K' }), searchQuery && (_jsx("button", { onClick: () => setSearch(''), className: "px-2 py-1 text-sm rounded hover:bg-surface-2 transition", children: "Effacer" })), _jsxs("div", { className: "ml-auto flex items-center gap-1", children: [_jsx("button", { onClick: openCheat, title: "Raccourcis clavier (?)", "aria-label": "Raccourcis clavier", className: "px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition", children: "?" }), _jsx(SettingsButton, {})] })] }), _jsxs("div", { className: "flex-1 flex min-h-0 relative", children: [!isNarrow && _jsx(Sidebar, {}), isNarrow && sidebarOpen && (_jsxs(_Fragment, { children: [_jsx("div", { className: "fixed inset-0 z-30 bg-black/40", onClick: () => setSidebarOpen(false), "aria-hidden": true }), _jsx("div", { className: "fixed left-0 top-0 bottom-0 z-40 shadow-2xl", onClick: () => setSidebarOpen(false), children: _jsx("div", { onClick: (e) => e.stopPropagation(), children: _jsx(Sidebar, {}) }) })] })), isNarrow ? (selectedThreadId ? (_jsx(MailReader, {})) : (_jsx(MailList, {}))) : (_jsxs(_Fragment, { children: [_jsx(MailList, {}), _jsx(MailReader, {})] }))] }), _jsx(StatusBar, {}), _jsx(Composer, {}), _jsx(CommandPalette, {}), _jsx(CheatSheet, {}), _jsx(Toast, {}), showOnboarding && _jsx(Onboarding, { onDone: () => setShowOnboarding(false) })] }));
}
