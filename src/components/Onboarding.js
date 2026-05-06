import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { themeOptions, applyTheme } from '@/lib/themes';
import { describeCombo, getProfile } from '@/lib/hotkeys';
const ONBOARDING_KEY = 'pite-lafe-onboarded-v1';
export function shouldShowOnboarding() {
    try {
        return localStorage.getItem(ONBOARDING_KEY) !== 'true';
    }
    catch {
        return false;
    }
}
function markDone() {
    try {
        localStorage.setItem(ONBOARDING_KEY, 'true');
    }
    catch {
        /* ignore */
    }
}
export function Onboarding({ onDone }) {
    const [step, setStep] = useState(0);
    const prefs = useStore((s) => s.prefs);
    const updatePrefs = useStore((s) => s.updatePrefs);
    const finish = () => {
        markDone();
        onDone();
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 bg-bg flex items-center justify-center", children: _jsxs("div", { className: "w-[640px] max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-lg shadow-xl overflow-hidden", children: [_jsxs("header", { className: "px-6 py-4 border-b border-border flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold tracking-tight", children: "Pite Lafe Mail" }), _jsx("div", { className: "text-xs text-muted", children: "configuration en 90 secondes" })] }), _jsx(Steps, { current: step, total: 3 })] }), _jsxs("div", { className: "px-6 py-6 min-h-[360px]", children: [step === 0 && _jsx(StepTheme, { prefs: prefs, updatePrefs: updatePrefs }), step === 1 && _jsx(StepAccount, {}), step === 2 && _jsx(StepShortcuts, { profile: prefs.keyboardProfile })] }), _jsxs("footer", { className: "px-6 py-3 border-t border-border bg-surface-2 flex items-center justify-between", children: [_jsx("button", { onClick: finish, className: "text-xs text-muted hover:text-text transition", children: "Passer la configuration" }), _jsxs("div", { className: "flex items-center gap-2", children: [step > 0 && (_jsx("button", { onClick: () => setStep(step - 1), className: "px-3 py-1.5 text-sm rounded hover:bg-surface transition", children: "Retour" })), step < 2 ? (_jsx("button", { onClick: () => setStep(step + 1), className: "px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition", children: "Suivant" })) : (_jsx("button", { onClick: finish, className: "px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition", children: "C'est parti" }))] })] })] }) }));
}
function Steps({ current, total }) {
    return (_jsx("div", { className: "flex items-center gap-1.5", children: Array.from({ length: total }).map((_, i) => (_jsx("span", { className: [
                'inline-block w-6 h-1 rounded-full transition',
                i <= current ? 'bg-accent' : 'bg-border',
            ].join(' ') }, i))) }));
}
function StepTheme({ prefs, updatePrefs, }) {
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-1", children: "Choisis ton th\u00E8me" }), _jsx("p", { className: "text-sm text-muted mb-5", children: "Tu peux en changer plus tard via la palette ou les pr\u00E9f\u00E9rences. Le rendu est instantan\u00E9." }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: themeOptions.map((t) => (_jsxs("button", { onClick: () => {
                        updatePrefs({ theme: t.value });
                        applyTheme(t.value, prefs.density, prefs.fontSize);
                    }, className: [
                        'group relative px-3 py-4 rounded border text-left transition',
                        prefs.theme === t.value
                            ? 'border-accent bg-accent/10'
                            : 'border-border hover:border-muted',
                    ].join(' '), children: [_jsx(ThemePreviewSwatch, { theme: t.value }), _jsx("div", { className: "mt-2 text-sm font-medium", children: t.label }), _jsx("div", { className: "text-xs text-muted", children: t.hint })] }, t.value))) }), _jsxs("div", { className: "mt-5 text-xs text-muted", children: ["Densit\u00E9 actuelle : ", prefs.density, " \u00B7 Taille : ", prefs.fontSize, "px (modifiable dans les pr\u00E9f\u00E9rences)"] })] }));
}
function ThemePreviewSwatch({ theme }) {
    // Force an isolated theme attribute on this scope so previews show the real palette.
    const wrapperStyle = { containerType: 'inline-size' };
    return (_jsxs("div", { "data-theme": theme, className: "rounded overflow-hidden border border-border", style: wrapperStyle, children: [_jsxs("div", { className: "bg-bg p-2.5 flex gap-2 items-center", children: [_jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-danger" }), _jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-warning" }), _jsx("span", { className: "inline-block w-2 h-2 rounded-full bg-success" }), _jsx("span", { className: "ml-auto inline-block w-8 h-1 bg-border rounded" })] }), _jsxs("div", { className: "bg-surface p-2.5", children: [_jsx("div", { className: "text-[10px] font-semibold", style: { color: 'rgb(var(--color-text))' }, children: "Anna Belmas" }), _jsx("div", { className: "text-[9px]", style: { color: 'rgb(var(--color-muted))' }, children: "Confirmation r\u00E9union jeudi 14h" }), _jsx("div", { className: "mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] text-white", style: { background: 'rgb(var(--color-accent))' }, children: "accent" })] })] }));
}
function StepAccount() {
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-1", children: "Connecte un compte (optionnel)" }), _jsx("p", { className: "text-sm text-muted mb-5", children: "Tu peux explorer l'app avec des donn\u00E9es fictives, ou connecter un vrai compte tout de suite." }), _jsxs("div", { className: "space-y-2", children: [_jsx(ProviderTile, { name: "Gmail", desc: "OAuth 2.0 s\u00E9curis\u00E9 \u00B7 jamais ton mot de passe", icon: "G", color: "#ea4335", comingSoon: true }), _jsx(ProviderTile, { name: "Outlook / Microsoft 365", desc: "OAuth 2.0 \u00B7 personnel et pro", icon: "O", color: "#0078d4", comingSoon: true }), _jsx(ProviderTile, { name: "iCloud Mail", desc: "OAuth 2.0 via Apple", icon: "", color: "#a1a1a6", comingSoon: true }), _jsx(ProviderTile, { name: "Autre (IMAP / SMTP)", desc: "Tout serveur classique avec mot de passe d'application", icon: "\u00B7", color: "#6366f1", comingSoon: true })] }), _jsx("div", { className: "mt-5 p-3 rounded border border-border bg-surface-2 text-xs text-muted", children: "En mode pr\u00E9visualisation, l'app utilise des donn\u00E9es fictives. La connexion r\u00E9elle des comptes sera disponible d\u00E8s que le shell Tauri (en cours d'int\u00E9gration) sera lanc\u00E9." })] }));
}
function ProviderTile({ name, desc, icon, color, comingSoon, }) {
    return (_jsxs("button", { type: "button", disabled: comingSoon, className: "w-full flex items-center gap-3 p-3 rounded border border-border bg-surface hover:bg-surface-2 transition text-left disabled:opacity-60 disabled:cursor-not-allowed", children: [_jsx("div", { className: "w-9 h-9 rounded flex items-center justify-center text-white font-semibold text-sm shrink-0", style: { background: color }, "aria-hidden": true, children: icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-sm font-medium", children: name }), _jsx("div", { className: "text-xs text-muted truncate", children: desc })] }), comingSoon ? (_jsx("span", { className: "text-[10px] uppercase tracking-wider text-muted px-2 py-0.5 rounded bg-surface-2 border border-border", children: "bient\u00F4t" })) : (_jsx("span", { className: "text-muted", children: "\u2192" }))] }));
}
function StepShortcuts({ profile }) {
    const p = getProfile(profile);
    const items = [
        { combo: p.commandPalette, label: 'Palette de commandes (cherche tout)' },
        { combo: p.compose, label: 'Nouveau message' },
        { combo: p.archive, label: 'Archiver le mail courant' },
        { combo: p.snooze, label: 'Reporter (snooze)' },
        { combo: p.next, label: 'Mail suivant' },
        { combo: p.prev, label: 'Mail précédent' },
        { combo: p.toggleFocus, label: 'Mode focus (cache le bruit)' },
        { combo: p.undoSend, label: "Annuler l'envoi" },
    ];
    return (_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold mb-1", children: "Quelques raccourcis" }), _jsxs("p", { className: "text-sm text-muted mb-5", children: ["Tout est personnalisable dans les pr\u00E9f\u00E9rences. Profil actuel : ", _jsx("span", { className: "font-mono", children: profile }), "."] }), _jsx("ul", { className: "space-y-1.5", children: items.map((it) => (_jsxs("li", { className: "flex items-center justify-between px-3 py-1.5 rounded bg-surface-2", children: [_jsx("span", { className: "text-sm", children: it.label }), _jsx("span", { className: "kbd", children: describeCombo(it.combo) })] }, it.combo + it.label))) }), _jsx("div", { className: "mt-5 text-xs text-muted", children: "Astuce : ouvre la palette \u00E0 tout moment et tape ce que tu veux faire \u2014 elle sait chercher dans tes mails et ex\u00E9cuter des actions." })] }));
}
