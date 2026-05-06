import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStore } from '@/lib/store';
export function StatusBar() {
    const pending = useStore((s) => s.pendingSends.length);
    const focusMode = useStore((s) => s.focusMode);
    const totalMails = useStore((s) => s.mails.length);
    const totalTrackers = useStore((s) => s.mails.reduce((sum, m) => sum + m.trackersBlocked, 0));
    const openPalette = useStore((s) => s.openCommandPalette);
    return (_jsxs("footer", { className: "h-7 px-4 flex items-center justify-between text-[11px] text-muted bg-surface border-t border-border shrink-0", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "inline-block w-1.5 h-1.5 rounded-full bg-success" }), "Connect\u00E9"] }), pending > 0 && (_jsxs("span", { children: [_jsx("span", { className: "inline-block w-1.5 h-1.5 rounded-full bg-warning mr-1.5 align-middle" }), pending, " envoi(s) en file"] })), focusMode && _jsx("span", { className: "text-accent", children: "Mode focus" })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("span", { children: [totalMails, " mails locaux"] }), _jsxs("span", { className: "text-success", children: ["\u2298 ", totalTrackers, " traceurs neutralis\u00E9s"] }), _jsxs("button", { onClick: openPalette, className: "hover:text-text transition", children: ["Recherche ", _jsx("span", { className: "kbd", children: "\u2318K" })] })] })] }));
}
