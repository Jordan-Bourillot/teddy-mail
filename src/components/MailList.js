import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@/lib/store';
import { Avatar } from './Avatar';
import { BulkActionBar } from './BulkActionBar';
import { formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';
export function MailList() {
    const threads = useStore(useShallow((s) => s.visibleThreads()));
    const mails = useStore((s) => s.mails);
    const selectedThreadId = useStore((s) => s.selectedThreadId);
    const selectThread = useStore((s) => s.selectThread);
    const searchQuery = useStore((s) => s.searchQuery);
    const setSearchQuery = useStore((s) => s.setSearchQuery);
    const saveCurrentSearch = useStore((s) => s.saveCurrentSearch);
    const checked = useStore((s) => s.selectedThreadIds);
    const toggleCheck = useStore((s) => s.toggleThreadCheck);
    const isCheckMode = checked.size > 0;
    return (_jsxs("div", { className: "flex-1 flex flex-col bg-bg border-r border-border min-w-0 md:min-w-[320px] md:max-w-[460px]", children: [_jsxs("header", { className: "h-12 px-4 flex items-center justify-between border-b border-border shrink-0 gap-2", children: [_jsx("h2", { className: "text-sm font-semibold truncate", children: searchQuery ? `Recherche : ${searchQuery}` : 'Boîte de réception' }), searchQuery && (_jsx("button", { onClick: () => {
                            const name = window.prompt('Nom de la vue ?', searchQuery.slice(0, 30));
                            if (name?.trim())
                                saveCurrentSearch(name.trim());
                        }, className: "text-xs px-2 py-0.5 rounded border border-border hover:border-accent hover:text-accent transition shrink-0", title: "Sauvegarder cette recherche dans la sidebar", children: "\u2605 Sauver" })), _jsx("span", { className: "text-xs text-muted shrink-0", children: threads.length })] }), _jsx(BulkActionBar, {}), _jsxs("ul", { className: "flex-1 overflow-y-auto", role: "list", children: [threads.length === 0 && (_jsxs("li", { className: "p-8 text-center text-muted", children: [_jsx("div", { className: "text-3xl mb-2", children: "\u00B7" }), _jsx("div", { className: "text-sm", children: searchQuery ? 'Aucun résultat.' : 'Boîte vide. Profite du calme.' }), searchQuery && (_jsx("button", { onClick: () => setSearchQuery(''), className: "mt-2 text-xs text-accent hover:underline", children: "Effacer la recherche" }))] })), threads.map((t) => {
                        const threadMails = mails.filter((m) => m.threadId === t.id);
                        const last = threadMails[threadMails.length - 1];
                        if (!last)
                            return null;
                        const unread = threadMails.some((m) => !m.read);
                        const isChecked = checked.has(t.id);
                        return (_jsx("li", { className: "border-b border-border", children: _jsxs("div", { className: [
                                    'w-full flex gap-3 px-4 py-3 transition cursor-pointer',
                                    selectedThreadId === t.id && !isCheckMode ? 'bg-surface-2' : '',
                                    isChecked ? 'bg-accent/10' : 'hover:bg-surface',
                                ].join(' '), onClick: () => {
                                    if (isCheckMode)
                                        toggleCheck(t.id);
                                    else
                                        selectThread(t.id);
                                }, role: "button", tabIndex: 0, onKeyDown: (e) => {
                                    if (e.key === 'Enter')
                                        selectThread(t.id);
                                    if (e.key === ' ') {
                                        e.preventDefault();
                                        toggleCheck(t.id);
                                    }
                                }, children: [_jsx(CheckOrAvatar, { isChecked: isChecked, onToggle: (e) => {
                                            e.stopPropagation();
                                            toggleCheck(t.id);
                                        }, name: last.from.name ?? '', email: last.from.email }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-baseline justify-between gap-2", children: [_jsx("span", { className: ['truncate', unread ? 'font-semibold text-text' : 'text-text'].join(' '), children: last.from.name ?? last.from.email }), _jsx("span", { className: "text-xs text-muted shrink-0", children: formatDistanceToNowStrict(new Date(last.receivedAt), { addSuffix: false, locale: fr }) })] }), _jsx("div", { className: ['truncate text-sm', unread ? 'text-text' : 'text-muted'].join(' '), children: last.subject }), _jsx("div", { className: "truncate text-xs text-muted mt-0.5", children: last.bodyText.split('\n').join(' ').slice(0, 120) }), _jsx(MailBadges, { starred: threadMails.some((m) => m.starred), trackers: threadMails.reduce((sum, m) => sum + m.trackersBlocked, 0), attachments: threadMails.reduce((sum, m) => sum + m.attachments.length, 0), category: t.category, count: threadMails.length })] }), unread && !isChecked && (_jsx("span", { "aria-label": "non lu", className: "self-center w-2 h-2 rounded-full bg-accent shrink-0" }))] }) }, t.id));
                    })] })] }));
}
function CheckOrAvatar({ isChecked, onToggle, name, email, }) {
    return (_jsxs("div", { className: "relative shrink-0 group", children: [_jsx("button", { type: "button", onClick: onToggle, "aria-label": isChecked ? 'Désélectionner' : 'Sélectionner', className: [
                    'w-9 h-9 rounded flex items-center justify-center transition',
                    isChecked
                        ? 'bg-accent text-white border-2 border-accent'
                        : 'opacity-0 group-hover:opacity-100 absolute inset-0 bg-surface-2 border-2 border-border hover:border-accent z-10',
                ].join(' '), children: isChecked && '✓' }), _jsx("div", { className: isChecked ? 'invisible' : 'group-hover:invisible', children: _jsx(Avatar, { name: name, email: email, size: 36 }) })] }));
}
function MailBadges({ starred, trackers, attachments, category, count, }) {
    return (_jsxs("div", { className: "flex items-center gap-2 mt-1 text-[11px] text-muted", children: [count > 1 && _jsx("span", { className: "px-1.5 py-0.5 rounded bg-surface-2", children: count }), starred && _jsx("span", { className: "text-warning", "aria-label": "favori", children: "\u2605" }), attachments > 0 && _jsxs("span", { "aria-label": `${attachments} pièces jointes`, children: ["\uD83D\uDCCE ", attachments] }), trackers > 0 && (_jsxs("span", { className: "text-success", "aria-label": `${trackers} traceurs bloqués`, children: ["\u2298 ", trackers] })), _jsx("span", { className: "ml-auto text-[10px] uppercase tracking-wider opacity-70", children: category })] }));
}
