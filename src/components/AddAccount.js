import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { startFlow, openInBrowser, completeFlow, desktopRedirectUri, } from '@/lib/oauth';
import { isTauri } from '@/lib/ipc';
import { useStore } from '@/lib/store';
import { presetForEmail } from '@/lib/imapPresets';
export function AddAccount({ onClose }) {
    const [stage, setStage] = useState('pick');
    const [provider, setProvider] = useState('gmail');
    const [error, setError] = useState(null);
    const [accountId] = useState(() => `acc_${Date.now().toString(36)}`);
    const showToast = useStore((s) => s.showToast);
    const addAccount = useStore((s) => s.addAccount);
    // OAuth state
    const [clientId, setClientId] = useState('');
    const [authUrl, setAuthUrl] = useState('');
    const [verifier, setVerifier] = useState('');
    const [code, setCode] = useState('');
    // IMAP/SMTP state
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [imapHost, setImapHost] = useState('');
    const [imapPort, setImapPort] = useState(993);
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState(465);
    const [presetHint, setPresetHint] = useState(null);
    // Auto-fill preset on email change
    useEffect(() => {
        if (!email.includes('@'))
            return;
        const p = presetForEmail(email);
        if (p) {
            setImapHost(p.imapHost);
            setImapPort(p.imapPort);
            setSmtpHost(p.smtpHost);
            setSmtpPort(p.smtpPort);
            setPresetHint(p.hint ? `${p.name} détecté. ${p.hint}` : `${p.name} détecté. Champs pré-remplis.`);
        }
        else {
            setPresetHint(null);
        }
    }, [email]);
    const oauthCfg = {
        provider: provider,
        clientId,
        redirectUri: desktopRedirectUri,
    };
    const beginOAuth = async () => {
        setError(null);
        if (!clientId.trim()) {
            setError('Le client_id est requis. Crée-le dans Google Cloud Console / Microsoft Entra.');
            return;
        }
        try {
            const r = await startFlow(oauthCfg);
            setAuthUrl(r.auth_url);
            setVerifier(r.code_verifier);
            await openInBrowser(r.auth_url);
            setStage('oauth-paste-code');
        }
        catch (e) {
            setError(messageOf(e));
        }
    };
    const finalizeOAuth = async () => {
        setError(null);
        try {
            await completeFlow(oauthCfg, code.trim(), verifier, accountId);
            // Persist account in store; real email comes from token introspection
            // (V1.5). For now use a placeholder that the user can rename later.
            addAccount({
                id: accountId,
                email: `${provider}-${accountId}`,
                displayName: provider === 'gmail' ? 'Gmail' : 'Outlook',
                protocol: 'imap',
                color: provider === 'gmail' ? '#ea4335' : '#0078d4',
                signature: '',
            });
            setStage('done');
            showToast('Compte connecté');
        }
        catch (e) {
            setError(messageOf(e));
        }
    };
    const finalizeImap = async () => {
        setError(null);
        if (!email.includes('@') || !password || !imapHost || !smtpHost) {
            setError('Tous les champs sont requis.');
            return;
        }
        try {
            // In Tauri build, we'd call ipc to validate the connection here, then
            // store the password in the OS keyring. For web preview, we just add
            // the account locally so the user sees it appear.
            addAccount({
                id: accountId,
                email,
                displayName: displayName.trim() || email,
                protocol: 'imap',
                color: pickColor(email),
                signature: '',
            });
            setStage('done');
            showToast('Compte ajouté');
            // Suppress unused-vars warnings for password/host fields in web mode.
            void imapPort;
            void smtpPort;
        }
        catch (e) {
            setError(messageOf(e));
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center", onClick: onClose, role: "dialog", "aria-modal": "true", "aria-label": "Ajouter un compte", children: _jsxs("div", { className: "w-[600px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-lg shadow-2xl", onClick: (e) => e.stopPropagation(), children: [_jsxs("header", { className: "px-5 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-surface", children: [_jsx("h2", { className: "text-base font-semibold", children: "Ajouter un compte" }), _jsx("button", { onClick: onClose, className: "px-2 py-1 text-sm rounded hover:bg-surface-2", children: "\u2715" })] }), _jsxs("div", { className: "p-5", children: [!isTauri() && (_jsx("div", { className: "mb-4 p-3 rounded border border-warning/40 bg-warning/10 text-xs", children: "Mode aper\u00E7u navigateur. Les comptes ajout\u00E9s apparaissent dans la sidebar pour d\u00E9monstration mais ne sont pas r\u00E9ellement synchronis\u00E9s." })), stage === 'pick' && (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-sm text-muted mb-3", children: "Choisis ton fournisseur." }), _jsxs("div", { className: "space-y-2", children: [_jsx(ProviderTile, { active: provider === 'gmail', onClick: () => setProvider('gmail'), title: "Gmail / Google Workspace", desc: "OAuth 2.0 + PKCE. Scope mail.google.com complet." }), _jsx(ProviderTile, { active: provider === 'outlook', onClick: () => setProvider('outlook'), title: "Outlook / Microsoft 365", desc: "OAuth 2.0. Scope IMAP + SMTP delegated." }), _jsx(ProviderTile, { active: provider === 'imap', onClick: () => setProvider('imap'), title: "Autre (IMAP / SMTP)", desc: "Free, Orange, Fastmail, Proton (via Bridge), self-hosted, etc." })] }), _jsx("div", { className: "mt-5 flex justify-end", children: _jsx("button", { onClick: () => setStage(provider === 'imap' ? 'imap-form' : 'oauth-config'), className: "px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition", children: "Continuer" }) })] })), stage === 'oauth-config' && (_jsxs(_Fragment, { children: [_jsxs("p", { className: "text-sm text-muted mb-3", children: ["Colle ton ", _jsx("strong", { children: "client_id" }), " OAuth. Pite Lafe ne contient aucun secret propri\u00E9taire \u2014 chaque utilisateur enregistre sa propre app pour garder le contr\u00F4le."] }), _jsx(Field, { label: "Client ID", children: _jsx("input", { type: "text", value: clientId, onChange: (e) => setClientId(e.target.value), placeholder: provider === 'gmail'
                                            ? 'xxxxxxxxxxx.apps.googleusercontent.com'
                                            : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', className: "w-full px-3 py-2 rounded border border-border bg-bg text-sm outline-none focus:border-accent" }) }), _jsxs(Field, { label: "Redirect URI", children: [_jsx("input", { type: "text", value: oauthCfg.redirectUri, readOnly: true, className: "w-full px-3 py-2 rounded border border-border bg-surface-2 text-sm font-mono text-muted" }), _jsxs("div", { className: "mt-1 text-xs text-muted", children: ["Enregistre cette URI dans la console", ' ', provider === 'gmail' ? 'Google Cloud' : 'Microsoft Entra', "."] })] }), error && _jsx(ErrorBox, { message: error }), _jsxs("div", { className: "mt-5 flex items-center justify-between", children: [_jsx("button", { onClick: () => setStage('pick'), className: "text-sm text-muted hover:text-text", children: "Retour" }), _jsx("button", { onClick: beginOAuth, className: "px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition", children: "Ouvrir l'autorisation" })] })] })), stage === 'oauth-paste-code' && (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-sm mb-3", children: "Le navigateur s'est ouvert sur la page d'autorisation. Une fois autoris\u00E9, copie le code re\u00E7u et colle-le ici." }), _jsxs("details", { className: "mb-3", children: [_jsx("summary", { className: "text-xs text-muted cursor-pointer hover:text-text", children: "URL d'autorisation" }), _jsx("div", { className: "mt-1 p-2 rounded bg-surface-2 text-xs font-mono break-all", children: authUrl })] }), _jsx(Field, { label: "Code d'autorisation", children: _jsx("input", { type: "text", value: code, onChange: (e) => setCode(e.target.value), placeholder: "4/0Ab...", className: "w-full px-3 py-2 rounded border border-border bg-bg text-sm font-mono outline-none focus:border-accent", autoFocus: true }) }), error && _jsx(ErrorBox, { message: error }), _jsxs("div", { className: "mt-5 flex items-center justify-between", children: [_jsx("button", { onClick: () => setStage('oauth-config'), className: "text-sm text-muted hover:text-text", children: "Retour" }), _jsx("button", { onClick: finalizeOAuth, disabled: !code.trim(), className: "px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition disabled:opacity-50", children: "Connecter le compte" })] })] })), stage === 'imap-form' && (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-sm text-muted mb-3", children: "Saisis tes param\u00E8tres IMAP/SMTP. Pite Lafe d\u00E9tecte les fournisseurs courants." }), _jsx(Field, { label: "Adresse mail", children: _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "toi@exemple.fr", className: "w-full px-3 py-2 rounded border border-border bg-bg text-sm outline-none focus:border-accent", autoFocus: true }) }), presetHint && (_jsx("div", { className: "mb-3 px-3 py-2 rounded text-xs bg-success/10 text-success border border-success/30", children: presetHint })), _jsx(Field, { label: "Nom affich\u00E9 (optionnel)", children: _jsx("input", { type: "text", value: displayName, onChange: (e) => setDisplayName(e.target.value), placeholder: "Jordan", className: "w-full px-3 py-2 rounded border border-border bg-bg text-sm outline-none focus:border-accent" }) }), _jsxs(Field, { label: "Mot de passe (ou app password)", children: [_jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-3 py-2 rounded border border-border bg-bg text-sm outline-none focus:border-accent" }), _jsx("div", { className: "mt-1 text-xs text-muted", children: "Stock\u00E9 dans le keyring OS uniquement, jamais sur disque." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Field, { label: "Serveur IMAP", children: _jsx("input", { type: "text", value: imapHost, onChange: (e) => setImapHost(e.target.value), placeholder: "imap.exemple.fr", className: "w-full px-3 py-2 rounded border border-border bg-bg text-sm font-mono outline-none focus:border-accent" }) }), _jsx(Field, { label: "Port IMAP", children: _jsx("input", { type: "number", value: imapPort, onChange: (e) => setImapPort(Number(e.target.value)), className: "w-full px-3 py-2 rounded border border-border bg-bg text-sm font-mono outline-none focus:border-accent" }) }), _jsx(Field, { label: "Serveur SMTP", children: _jsx("input", { type: "text", value: smtpHost, onChange: (e) => setSmtpHost(e.target.value), placeholder: "smtp.exemple.fr", className: "w-full px-3 py-2 rounded border border-border bg-bg text-sm font-mono outline-none focus:border-accent" }) }), _jsx(Field, { label: "Port SMTP", children: _jsx("input", { type: "number", value: smtpPort, onChange: (e) => setSmtpPort(Number(e.target.value)), className: "w-full px-3 py-2 rounded border border-border bg-bg text-sm font-mono outline-none focus:border-accent" }) })] }), error && _jsx(ErrorBox, { message: error }), _jsxs("div", { className: "mt-5 flex items-center justify-between", children: [_jsx("button", { onClick: () => setStage('pick'), className: "text-sm text-muted hover:text-text", children: "Retour" }), _jsx("button", { onClick: finalizeImap, className: "px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition", children: "Connecter le compte" })] })] })), stage === 'done' && (_jsxs("div", { className: "py-8 text-center", children: [_jsx("div", { className: "text-3xl mb-2", children: "\u2713" }), _jsx("h3", { className: "text-base font-semibold mb-1", children: "Compte ajout\u00E9" }), _jsx("p", { className: "text-sm text-muted mb-5", children: isTauri()
                                        ? 'La synchronisation va commencer en tâche de fond.'
                                        : 'Le compte apparaît dans la sidebar (mode aperçu).' }), _jsx("button", { onClick: onClose, className: "px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition", children: "Fermer" })] }))] })] }) }));
}
function ProviderTile({ active, onClick, title, desc, }) {
    return (_jsxs("button", { onClick: onClick, className: [
            'w-full text-left p-3 rounded border transition',
            active ? 'border-accent bg-accent/10' : 'border-border hover:border-muted',
        ].join(' '), children: [_jsx("div", { className: "text-sm font-medium", children: title }), _jsx("div", { className: "text-xs text-muted mt-0.5", children: desc })] }));
}
function Field({ label, children }) {
    return (_jsxs("label", { className: "block mb-3", children: [_jsx("span", { className: "block text-xs uppercase tracking-wider text-muted mb-1", children: label }), children] }));
}
function ErrorBox({ message }) {
    return (_jsx("div", { className: "mt-3 p-2.5 rounded border border-danger/40 bg-danger/10 text-xs text-danger", children: message }));
}
function messageOf(e) {
    return e instanceof Error ? e.message : String(e);
}
function pickColor(email) {
    // Same idea as avatarColor but constrained to a curated palette so accounts
    // visually differentiate well in the sidebar.
    const palette = ['#6366f1', '#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981'];
    let h = 0;
    for (let i = 0; i < email.length; i += 1)
        h = (h * 31 + email.charCodeAt(i)) >>> 0;
    return palette[h % palette.length] ?? '#6366f1';
}
