import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { searchMails } from '@/lib/search';
export function CommandPalette() {
    const open = useStore((s) => s.commandPaletteOpen);
    const close = useStore((s) => s.closeCommandPalette);
    const mails = useStore((s) => s.mails);
    const selectThread = useStore((s) => s.selectThread);
    const openCompose = useStore((s) => s.openCompose);
    const updatePrefs = useStore((s) => s.updatePrefs);
    const [q, setQ] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef(null);
    useEffect(() => {
        if (open) {
            setQ('');
            setActiveIndex(0);
            // Focus on next tick so the modal mounts first
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);
    const results = useMemo(() => {
        if (!q.trim())
            return [];
        const items = [];
        // Actions
        const queryLower = q.toLowerCase();
        const actions = [
            { label: 'Composer un nouveau mail', keywords: ['compose', 'new', 'écrire'], run: () => openCompose() },
            { label: 'Thème : clair', keywords: ['theme', 'clair', 'light'], run: () => updatePrefs({ theme: 'light' }) },
            { label: 'Thème : sombre', keywords: ['theme', 'sombre', 'dark'], run: () => updatePrefs({ theme: 'dark' }) },
            { label: 'Thème : nocturne', keywords: ['theme', 'nocturne'], run: () => updatePrefs({ theme: 'nocturne' }) },
            { label: 'Thème : sépia', keywords: ['theme', 'sepia', 'sépia'], run: () => updatePrefs({ theme: 'sepia' }) },
            { label: 'Densité : compact', keywords: ['density', 'compact'], run: () => updatePrefs({ density: 'compact' }) },
            { label: 'Densité : confortable', keywords: ['density', 'cozy'], run: () => updatePrefs({ density: 'cozy' }) },
            { label: 'Bloquer les traceurs : oui', keywords: ['tracker', 'block'], run: () => updatePrefs({ blockTrackers: true }) },
            { label: 'Bloquer les traceurs : non', keywords: ['tracker', 'allow'], run: () => updatePrefs({ blockTrackers: false }) },
        ];
        for (const a of actions) {
            if (a.label.toLowerCase().includes(queryLower) || a.keywords.some((k) => k.includes(queryLower))) {
                items.push({ kind: 'action', label: a.label, run: a.run });
            }
        }
        // Mails
        const found = searchMails(mails, q).slice(0, 8);
        for (const m of found) {
            items.push({
                kind: 'mail',
                label: m.subject,
                sub: m.from.name ?? m.from.email,
                run: () => selectThread(m.threadId),
            });
        }
        return items;
    }, [q, mails, openCompose, selectThread, updatePrefs]);
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
            }
            else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
            }
            else if (e.key === 'Enter') {
                e.preventDefault();
                const item = results[activeIndex];
                if (item) {
                    item.run();
                    close();
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, results, activeIndex, close]);
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-[15vh]", onClick: close, role: "dialog", "aria-modal": "true", "aria-label": "Palette de commandes", children: _jsxs("div", { className: "w-[640px] max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-lg shadow-2xl overflow-hidden", onClick: (e) => e.stopPropagation(), children: [_jsx("div", { className: "px-4 py-3 border-b border-border", children: _jsx("input", { ref: inputRef, value: q, onChange: (e) => {
                            setQ(e.target.value);
                            setActiveIndex(0);
                        }, placeholder: "Recherche, action, mail\u2026   (essaie : from:anna, has:attachment, th\u00E8me sombre)", className: "w-full bg-transparent text-base outline-none" }) }), _jsxs("ul", { className: "max-h-[420px] overflow-y-auto", children: [results.length === 0 && (_jsx("li", { className: "px-4 py-6 text-center text-sm text-muted", children: "Tape pour chercher\u2026" })), results.map((r, i) => (_jsxs("li", { className: [
                                'px-4 py-2.5 cursor-pointer flex items-center justify-between gap-3',
                                i === activeIndex ? 'bg-surface-2' : '',
                            ].join(' '), onMouseEnter: () => setActiveIndex(i), onClick: () => {
                                r.run();
                                close();
                            }, children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm truncate", children: r.label }), r.sub && _jsx("div", { className: "text-xs text-muted truncate", children: r.sub })] }), _jsx("span", { className: "text-[11px] uppercase tracking-wider text-muted", children: r.kind === 'mail' ? 'mail' : 'action' })] }, `${r.kind}_${i}`)))] }), _jsx("div", { className: "px-4 py-2 border-t border-border text-xs text-muted flex items-center justify-between", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { children: [_jsx("span", { className: "kbd", children: "\u2191\u2193" }), " naviguer"] }), _jsxs("span", { children: [_jsx("span", { className: "kbd", children: "\u21B5" }), " ouvrir"] }), _jsxs("span", { children: [_jsx("span", { className: "kbd", children: "Esc" }), " fermer"] })] }) })] }) }));
}
