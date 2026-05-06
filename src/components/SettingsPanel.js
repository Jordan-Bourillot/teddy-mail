import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { themeOptions, densityOptions } from '@/lib/themes';
import { playSound } from '@/lib/sounds';
export function SettingsButton() {
    const [open, setOpen] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsx("button", { onClick: () => setOpen(true), className: "px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition", title: "Pr\u00E9f\u00E9rences", children: "\u2699 Pr\u00E9f\u00E9rences" }), open && _jsx(SettingsPanel, { onClose: () => setOpen(false) })] }));
}
function SettingsPanel({ onClose }) {
    const prefs = useStore((s) => s.prefs);
    const update = useStore((s) => s.updatePrefs);
    return (_jsx("div", { className: "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center", onClick: onClose, role: "dialog", "aria-modal": "true", "aria-label": "Pr\u00E9f\u00E9rences", children: _jsxs("div", { className: "w-[640px] max-h-[80vh] overflow-y-auto bg-surface border border-border rounded-lg shadow-2xl", onClick: (e) => e.stopPropagation(), children: [_jsxs("header", { className: "px-5 py-3 border-b border-border flex items-center justify-between", children: [_jsx("h2", { className: "text-base font-semibold", children: "Pr\u00E9f\u00E9rences" }), _jsx("button", { onClick: onClose, className: "px-2 py-1 text-sm rounded hover:bg-surface-2", children: "\u2715" })] }), _jsxs("div", { className: "p-5 space-y-6", children: [_jsxs(Section, { title: "Apparence", children: [_jsx(Row, { label: "Th\u00E8me", children: _jsx("div", { className: "flex flex-wrap gap-2", children: themeOptions.map((t) => (_jsx("button", { onClick: () => update({ theme: t.value }), className: [
                                                'px-3 py-1.5 text-sm rounded border transition',
                                                prefs.theme === t.value
                                                    ? 'border-accent bg-accent/10 text-text'
                                                    : 'border-border text-muted hover:text-text',
                                            ].join(' '), children: t.label }, t.value))) }) }), _jsx(Row, { label: "Densit\u00E9", children: _jsx("div", { className: "flex gap-2", children: densityOptions.map((d) => (_jsx("button", { onClick: () => update({ density: d.value }), className: [
                                                'px-3 py-1.5 text-sm rounded border transition',
                                                prefs.density === d.value
                                                    ? 'border-accent bg-accent/10'
                                                    : 'border-border text-muted hover:text-text',
                                            ].join(' '), children: d.label }, d.value))) }) }), _jsxs(Row, { label: "Taille de police", children: [_jsx("input", { type: "range", min: 12, max: 18, value: prefs.fontSize, onChange: (e) => update({ fontSize: Number(e.target.value) }), className: "w-48" }), _jsxs("span", { className: "ml-2 text-sm text-muted", children: [prefs.fontSize, "px"] })] })] }), _jsxs(Section, { title: "Vie priv\u00E9e", children: [_jsx(Toggle, { label: "Bloquer les pixels traceurs", hint: "D\u00E9tecte et neutralise les pixels 1\u00D71 et domaines connus.", checked: prefs.blockTrackers, onChange: (v) => update({ blockTrackers: v }) }), _jsx(Row, { label: "Images distantes", children: _jsxs("select", { value: prefs.blockRemoteImages, onChange: (e) => update({ blockRemoteImages: e.target.value }), className: "bg-surface-2 px-2 py-1 rounded border border-border text-sm", children: [_jsx("option", { value: "always", children: "Toujours bloquer" }), _jsx("option", { value: "trusted", children: "Charger uniquement pour les exp\u00E9diteurs de confiance" }), _jsx("option", { value: "never", children: "Toujours afficher" })] }) })] }), _jsx(Section, { title: "Envoi", children: _jsx(Row, { label: "Annulation d'envoi", children: _jsx("div", { className: "flex gap-2", children: [0, 5, 10, 30].map((s) => (_jsx("button", { onClick: () => update({ undoSendSeconds: s }), className: [
                                            'px-3 py-1.5 text-sm rounded border transition',
                                            prefs.undoSendSeconds === s
                                                ? 'border-accent bg-accent/10'
                                                : 'border-border text-muted hover:text-text',
                                        ].join(' '), children: s === 0 ? 'Désactivé' : `${s}s` }, s))) }) }) }), _jsx(Section, { title: "Clavier", children: _jsx(Row, { label: "Profil de raccourcis", children: _jsxs("select", { value: prefs.keyboardProfile, onChange: (e) => update({ keyboardProfile: e.target.value }), className: "bg-surface-2 px-2 py-1 rounded border border-border text-sm", children: [_jsx("option", { value: "pite", children: "Pite Lafe (par d\u00E9faut)" }), _jsx("option", { value: "gmail", children: "Gmail" }), _jsx("option", { value: "outlook", children: "Outlook" }), _jsx("option", { value: "mutt", children: "Mutt / Vim" })] }) }) }), _jsxs(Section, { title: "Mouvement et son", children: [_jsx(Row, { label: "Animations", children: _jsxs("select", { value: prefs.reducedMotion, onChange: (e) => update({ reducedMotion: e.target.value }), className: "bg-surface-2 px-2 py-1 rounded border border-border text-sm", children: [_jsx("option", { value: "auto", children: "Auto (suit le syst\u00E8me)" }), _jsx("option", { value: "always", children: "Toujours r\u00E9duites" }), _jsx("option", { value: "never", children: "Toujours actives" })] }) }), _jsx(Row, { label: "Sons", children: _jsx("div", { className: "flex gap-2", children: ['off', 'subtle', 'crisp'].map((s) => (_jsx("button", { onClick: () => {
                                                update({ soundPack: s });
                                                // Quick preview
                                                if (s !== 'off') {
                                                    playSound('send', s);
                                                }
                                            }, className: [
                                                'px-3 py-1.5 text-sm rounded border transition',
                                                prefs.soundPack === s
                                                    ? 'border-accent bg-accent/10'
                                                    : 'border-border text-muted hover:text-text',
                                            ].join(' '), children: s === 'off' ? 'Aucun' : s === 'subtle' ? 'Discrets' : 'Nets' }, s))) }) })] })] })] }) }));
}
function Section({ title, children }) {
    return (_jsxs("section", { children: [_jsx("h3", { className: "text-xs uppercase tracking-wider text-muted mb-3", children: title }), _jsx("div", { className: "space-y-3", children: children })] }));
}
function Row({ label, children }) {
    return (_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: "w-40 shrink-0 text-sm text-muted", children: label }), _jsx("div", { className: "flex-1 flex items-center", children: children })] }));
}
function Toggle({ label, hint, checked, onChange, }) {
    return (_jsxs("label", { className: "flex items-start gap-3 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: checked, onChange: (e) => onChange(e.target.checked), className: "mt-1 accent-[rgb(var(--color-accent))]" }), _jsxs("span", { children: [_jsx("span", { className: "block text-sm font-medium", children: label }), hint && _jsx("span", { className: "block text-xs text-muted", children: hint })] })] }));
}
