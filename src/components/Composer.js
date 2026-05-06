import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
export function Composer() {
    const open = useStore((s) => s.composeOpen);
    const draft = useStore((s) => s.composeDraft);
    const accounts = useStore((s) => s.accounts);
    const update = useStore((s) => s.updateDraft);
    const close = useStore((s) => s.closeCompose);
    const send = useStore((s) => s.sendDraft);
    const undoSendSeconds = useStore((s) => s.prefs.undoSendSeconds);
    const subjectRef = useRef(null);
    const lastSavedAtRef = useRef('');
    useEffect(() => {
        if (open && draft) {
            lastSavedAtRef.current = draft.updatedAt;
        }
    }, [open, draft]);
    useEffect(() => {
        if (!open)
            return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                close();
            }
            const mod = e.ctrlKey || e.metaKey;
            if (mod && e.key === 'Enter') {
                e.preventDefault();
                send();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, close, send]);
    if (!open || !draft)
        return null;
    const account = accounts.find((a) => a.id === draft.accountId);
    // Detect "I attached..." in body without attachments → warn user.
    const mentionsAttachment = /joint|joins|attach|pièce jointe|pj|enclosed|attached/i.test(draft.body);
    const hasAttachments = false; // wired in V1.5
    const attachmentWarning = mentionsAttachment && !hasAttachments;
    return (_jsxs("div", { className: "fixed bottom-4 right-4 w-[640px] max-w-[calc(100vw-2rem)] h-[560px] bg-surface border border-border rounded-lg shadow-2xl flex flex-col z-30", children: [_jsxs("header", { className: "flex items-center justify-between px-4 py-2 border-b border-border bg-surface-2 rounded-t-lg", children: [_jsx("div", { className: "text-sm font-medium", children: "Nouveau message" }), _jsx("div", { className: "flex items-center gap-1 text-muted", children: _jsx("button", { onClick: close, "aria-label": "Fermer", className: "px-2 py-1 text-sm rounded hover:bg-surface transition", children: "\u2715" }) })] }), _jsxs("div", { className: "px-4 py-2 border-b border-border space-y-1.5 text-sm", children: [_jsx(FieldRow, { label: "De", children: _jsx("select", { value: draft.accountId, onChange: (e) => update({ accountId: e.target.value }), className: "bg-transparent w-full outline-none", children: accounts.map((a) => (_jsx("option", { value: a.id, children: a.email }, a.id))) }) }), _jsx(FieldRow, { label: "\u00C0", children: _jsx("input", { type: "email", value: draft.to.map((t) => t.email).join(', '), onChange: (e) => update({
                                to: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean)
                                    .map((email) => ({ email })),
                            }), className: "bg-transparent w-full outline-none", placeholder: "destinataire@exemple.fr" }) }), _jsx(FieldRow, { label: "Sujet", children: _jsx("input", { ref: subjectRef, type: "text", value: draft.subject, onChange: (e) => update({ subject: e.target.value }), className: "bg-transparent w-full outline-none font-medium", placeholder: "Sujet du mail" }) })] }), _jsx("textarea", { value: draft.body, onChange: (e) => update({ body: e.target.value }), className: "flex-1 px-4 py-3 bg-transparent outline-none resize-none text-[15px] leading-relaxed font-sans", placeholder: "\u00C9cris ton message\u2026" }), account?.signature && (_jsx("div", { className: "px-4 py-2 border-t border-border text-xs text-muted whitespace-pre-line", children: account.signature })), _jsxs("footer", { className: "flex items-center justify-between px-4 py-2 border-t border-border bg-surface-2 rounded-b-lg", children: [_jsxs("div", { className: "text-xs text-muted", children: ["Auto-save \u00B7 ", new Date(draft.updatedAt).toLocaleTimeString(), attachmentWarning && (_jsx("span", { className: "ml-3 text-warning", children: "\u26A0 Tu as mentionn\u00E9 une pi\u00E8ce jointe absente" }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: close, className: "px-3 py-1.5 text-sm rounded hover:bg-surface transition", children: "Brouillon" }), _jsx("button", { onClick: send, className: "px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition", title: `Envoyer (Ctrl/Cmd+Entrée). Annulable pendant ${undoSendSeconds}s.`, children: "Envoyer" })] })] })] }));
}
function FieldRow({ label, children }) {
    return (_jsxs("div", { className: "flex items-center gap-2 py-1 border-b border-border last:border-0", children: [_jsx("span", { className: "w-12 shrink-0 text-muted text-xs uppercase tracking-wider", children: label }), _jsx("div", { className: "flex-1 min-w-0", children: children })] }));
}
