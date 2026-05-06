import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@/lib/store';
import { Avatar } from './Avatar';
import { snoozePresets } from '@/lib/snooze';
import { neutralizeTrackers } from '@/lib/trackers';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
export function MailReader() {
    const threadId = useStore((s) => s.selectedThreadId);
    const mails = useStore(useShallow((s) => (threadId ? s.threadMails(threadId) : [])));
    const archive = useStore((s) => s.archive);
    const trash = useStore((s) => s.trash);
    const toggleStar = useStore((s) => s.toggleStar);
    const snooze = useStore((s) => s.snooze);
    const openCompose = useStore((s) => s.openCompose);
    const blockTrackers = useStore((s) => s.prefs.blockTrackers);
    const [showSnooze, setShowSnooze] = useState(false);
    if (!threadId || mails.length === 0) {
        return (_jsx("div", { className: "flex-1 flex items-center justify-center text-muted bg-bg", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-4xl mb-2", children: "\u00B7" }), _jsx("div", { className: "text-sm", children: "S\u00E9lectionne un mail." })] }) }));
    }
    const last = mails[mails.length - 1];
    if (!last)
        return null;
    const earlier = mails.slice(0, -1);
    const onArchive = () => archive(mails.map((m) => m.id));
    const onTrash = () => trash(mails.map((m) => m.id));
    const onReply = () => openCompose(last);
    return (_jsxs("div", { className: "flex-1 flex flex-col bg-surface min-w-0 md:min-w-[420px]", children: [_jsxs("header", { className: "h-12 px-4 flex items-center gap-2 border-b border-border shrink-0", children: [_jsx("button", { onClick: onArchive, className: "px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition", title: "Archiver (E)", children: "Archiver" }), _jsx("button", { onClick: onTrash, className: "px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition", title: "Supprimer (#)", children: "Supprimer" }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowSnooze((v) => !v), className: "px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition", title: "Snooze (H)", children: "Snooze" }), showSnooze && (_jsx(SnoozeMenu, { onPick: (iso) => {
                                    snooze(mails.map((m) => m.id), iso);
                                    setShowSnooze(false);
                                }, onClose: () => setShowSnooze(false) }))] }), _jsx("button", { onClick: () => toggleStar(last.id), className: "px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition", title: "Favori (S)", children: last.starred ? '★ Favori' : '☆ Favori' }), _jsx("div", { className: "ml-auto flex items-center gap-2", children: _jsx("button", { onClick: onReply, className: "px-3 py-1 text-sm rounded bg-accent text-white hover:opacity-90 transition", title: "R\u00E9pondre (R)", children: "R\u00E9pondre" }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto", children: _jsxs("div", { className: "max-w-3xl mx-auto px-6 py-6", children: [_jsx("h1", { className: "text-xl font-semibold mb-3 leading-snug", children: last.subject }), earlier.length > 0 && (_jsxs("details", { className: "mb-4", children: [_jsxs("summary", { className: "text-sm text-muted cursor-pointer hover:text-text", children: ["+ ", earlier.length, " message", earlier.length > 1 ? 's' : '', " pr\u00E9c\u00E9dent", earlier.length > 1 ? 's' : ''] }), _jsx("div", { className: "mt-2 space-y-3", children: earlier.map((m) => (_jsx(SingleMail, { mail: m, blockTrackers: blockTrackers, compact: true }, m.id))) })] })), _jsx(SingleMail, { mail: last, blockTrackers: blockTrackers }), last.engagements && last.engagements.length > 0 && (_jsxs("aside", { className: "mt-6 p-3 rounded border border-border bg-surface-2", children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-muted mb-2", children: "Engagements d\u00E9tect\u00E9s" }), _jsx("ul", { className: "space-y-1 text-sm", children: last.engagements.map((e, i) => (_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-warning shrink-0", children: "\u2691" }), _jsx("span", { children: e.text })] }, i))) })] }))] }) })] }));
}
function SnoozeMenu({ onPick, onClose }) {
    const [custom, setCustom] = useState('');
    // Default to tomorrow 09:00 in local time
    const defaultLocal = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(9, 0, 0, 0);
        return toLocalInputValue(d);
    }, []);
    return (_jsxs("div", { className: "absolute left-0 mt-1 z-20 w-64 bg-surface border border-border rounded shadow-lg p-1", onClick: (e) => e.stopPropagation(), children: [snoozePresets.map((p) => (_jsx("button", { onClick: () => onPick(p.resolveAt().toISOString()), className: "w-full text-left px-3 py-1.5 text-sm rounded hover:bg-surface-2", children: p.label }, p.preset))), _jsx("div", { className: "my-1 border-t border-border" }), _jsxs("div", { className: "px-2 py-2", children: [_jsx("div", { className: "text-xs text-muted mb-1", children: "Date personnalis\u00E9e" }), _jsx("input", { type: "datetime-local", value: custom || defaultLocal, onChange: (e) => setCustom(e.target.value), className: "w-full px-2 py-1 text-sm rounded border border-border bg-bg outline-none focus:border-accent" }), _jsxs("div", { className: "flex gap-2 mt-2", children: [_jsx("button", { onClick: onClose, className: "flex-1 px-2 py-1 text-xs rounded hover:bg-surface-2", children: "Annuler" }), _jsx("button", { onClick: () => {
                                    const v = custom || defaultLocal;
                                    const d = new Date(v);
                                    if (Number.isNaN(d.getTime()))
                                        return;
                                    onPick(d.toISOString());
                                }, className: "flex-1 px-2 py-1 text-xs rounded bg-accent text-white hover:opacity-90", children: "Reporter" })] })] })] }));
}
function toLocalInputValue(d) {
    // datetime-local expects "YYYY-MM-DDTHH:MM" in local TZ.
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function SingleMail({ mail, blockTrackers, compact = false, }) {
    const safeHtml = useMemo(() => {
        if (!mail.bodyHtml)
            return null;
        const cleaned = blockTrackers ? neutralizeTrackers(mail.bodyHtml).sanitized : mail.bodyHtml;
        return DOMPurify.sanitize(cleaned, {
            ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'style', 'class'],
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
        });
    }, [mail.bodyHtml, blockTrackers]);
    return (_jsxs("article", { className: compact ? 'pb-3 border-b border-border last:border-0' : '', children: [_jsxs("header", { className: "flex items-start gap-3 mb-3", children: [_jsx(Avatar, { name: mail.from.name ?? '', email: mail.from.email, size: compact ? 28 : 40 }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-baseline justify-between gap-2", children: [_jsxs("span", { className: "font-medium truncate", children: [mail.from.name ?? mail.from.email, _jsxs("span", { className: "text-muted font-normal text-sm ml-1", children: ["<", mail.from.email, ">"] })] }), _jsx("time", { className: "text-xs text-muted shrink-0", children: format(new Date(mail.receivedAt), 'PPpp', { locale: fr }) })] }), _jsxs("div", { className: "text-xs text-muted", children: ["\u00E0 ", mail.to.map((t) => t.email).join(', '), mail.trackersBlocked > 0 && (_jsxs("span", { className: "ml-2 text-success", children: ["\u2298 ", mail.trackersBlocked, " traceur(s) bloqu\u00E9(s)"] }))] })] })] }), safeHtml ? (_jsx("div", { className: "prose prose-sm max-w-none", 
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML: { __html: safeHtml } })) : (_jsx("pre", { className: "whitespace-pre-wrap font-sans text-[15px] leading-relaxed", children: mail.bodyText })), mail.attachments.length > 0 && (_jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: mail.attachments.map((a) => (_jsxs("div", { className: "px-3 py-2 rounded border border-border bg-surface-2 text-sm flex items-center gap-2", children: [_jsx("span", { "aria-hidden": true, children: "\uD83D\uDCCE" }), _jsx("span", { className: "font-medium", children: a.filename }), _jsxs("span", { className: "text-xs text-muted", children: [(a.sizeBytes / 1024).toFixed(0), " ko"] })] }, a.id))) }))] }));
}
