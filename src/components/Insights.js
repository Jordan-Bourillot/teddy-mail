import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { computeInsights } from '@/lib/insights';
export function Insights({ onClose }) {
    const mails = useStore((s) => s.mails);
    const data = useMemo(() => computeInsights(mails), [mails]);
    return (_jsx("div", { className: "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center", onClick: onClose, role: "dialog", "aria-modal": "true", "aria-label": "Insights", children: _jsxs("div", { className: "w-[720px] max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto bg-surface border border-border rounded-lg shadow-2xl", onClick: (e) => e.stopPropagation(), children: [_jsxs("header", { className: "px-5 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-base font-semibold", children: "Insights" }), _jsx("p", { className: "text-xs text-muted", children: "stats locales \u00B7 rien n'est envoy\u00E9" })] }), _jsx("button", { onClick: onClose, className: "px-2 py-1 text-sm rounded hover:bg-surface-2", children: "\u2715" })] }), _jsxs("div", { className: "p-5 space-y-6", children: [_jsxs("section", { className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [_jsx(Stat, { label: "Cette semaine", value: data.mailsThisWeek, hint: data.trendPct === 0
                                        ? 'aucun changement'
                                        : data.trendPct > 0
                                            ? `+${data.trendPct}% vs semaine -1`
                                            : `${data.trendPct}% vs semaine -1`, trend: data.trendPct }), _jsx(Stat, { label: "Traceurs neutralis\u00E9s", value: data.totalTrackersBlocked, hint: `${data.trackersThisWeek} cette semaine`, positive: true }), _jsx(Stat, { label: "Temps gagn\u00E9", value: `${data.timeSavedMinutes} min`, hint: "estimation cumul\u00E9e", positive: true }), _jsx(Stat, { label: "Non lus", value: data.unread, hint: data.unread === 0
                                        ? "boîte au calme"
                                        : `${data.starred} étoilés · ${data.snoozed} reportés` })] }), _jsxs("section", { children: [_jsx("h3", { className: "text-xs uppercase tracking-wider text-muted mb-2", children: "R\u00E9partition par cat\u00E9gorie" }), _jsx(CategoryBars, { byCategory: data.byCategory, total: Object.values(data.byCategory).reduce((s, v) => s + v, 0) })] }), _jsxs("section", { children: [_jsx("h3", { className: "text-xs uppercase tracking-wider text-muted mb-2", children: "Top exp\u00E9diteurs" }), data.topSenders.length === 0 ? (_jsx("div", { className: "text-sm text-muted", children: "Pas assez de donn\u00E9es." })) : (_jsx("ul", { className: "space-y-1.5", children: data.topSenders.map((s) => (_jsxs("li", { className: "flex items-center justify-between px-3 py-2 rounded bg-surface-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-medium truncate", children: s.name }), _jsx("div", { className: "text-xs text-muted truncate", children: s.email })] }), _jsx("span", { className: "text-sm font-mono text-muted shrink-0 ml-3", children: s.count })] }, s.email))) }))] }), _jsxs("section", { className: "text-xs text-muted leading-relaxed border-t border-border pt-4", children: [_jsx("strong", { children: "M\u00E9thode" }), " \u00B7 Temps gagn\u00E9 = 3s par traceur neutralis\u00E9 + 5s par mail lu (\u00E9vitement de scroll). Aucune donn\u00E9e ne quitte ton appareil."] })] })] }) }));
}
function Stat({ label, value, hint, trend, positive, }) {
    const trendColor = trend === undefined
        ? 'text-muted'
        : trend > 0
            ? positive
                ? 'text-success'
                : 'text-warning'
            : trend < 0
                ? positive
                    ? 'text-warning'
                    : 'text-success'
                : 'text-muted';
    return (_jsxs("div", { className: "p-3 rounded border border-border bg-surface-2", children: [_jsx("div", { className: "text-[11px] uppercase tracking-wider text-muted", children: label }), _jsx("div", { className: ['text-2xl font-semibold mt-0.5', positive ? 'text-success' : 'text-text'].join(' '), children: value }), hint && _jsx("div", { className: ['text-xs mt-0.5', trendColor].join(' '), children: hint })] }));
}
function CategoryBars({ byCategory, total }) {
    if (total === 0)
        return _jsx("div", { className: "text-sm text-muted", children: "Bo\u00EEte vide." });
    const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const colorFor = {
        work: '#0ea5e9',
        personal: '#22c55e',
        notifications: '#f59e0b',
        newsletters: '#a855f7',
        promotions: '#ec4899',
        unsorted: '#94a3b8',
    };
    return (_jsxs("div", { children: [_jsx("div", { className: "flex h-2 rounded overflow-hidden bg-surface-2 border border-border", children: entries.map(([cat, count]) => (_jsx("div", { className: "h-full", style: {
                        width: `${(count / total) * 100}%`,
                        background: colorFor[cat] ?? '#94a3b8',
                    }, title: `${cat}: ${count}` }, cat))) }), _jsx("ul", { className: "mt-2 grid grid-cols-2 md:grid-cols-3 gap-1.5 text-xs", children: entries.map(([cat, count]) => (_jsxs("li", { className: "flex items-center gap-2", children: [_jsx("span", { className: "inline-block w-2.5 h-2.5 rounded-sm", style: { background: colorFor[cat] ?? '#94a3b8' } }), _jsx("span", { className: "capitalize", children: cat }), _jsx("span", { className: "text-muted ml-auto", children: count })] }, cat))) })] }));
}
