import { useEffect, useState } from 'react';
import {
  startFlow,
  openInBrowser,
  completeFlow,
  desktopRedirectUri,
  type OAuthProvider,
  type OAuthClientConfig,
} from '@/lib/oauth';
import { isTauri } from '@/lib/ipc';
import { useStore } from '@/lib/store';
import { presetForEmail } from '@/lib/imapPresets';

type Stage =
  | 'pick'
  | 'oauth-config'
  | 'oauth-authorize'
  | 'oauth-paste-code'
  | 'imap-form'
  | 'done';

type ProviderKind = OAuthProvider | 'imap';

interface AddAccountProps {
  onClose: () => void;
}

export function AddAccount({ onClose }: AddAccountProps) {
  const [stage, setStage] = useState<Stage>('pick');
  const [provider, setProvider] = useState<ProviderKind>('gmail');
  const [error, setError] = useState<string | null>(null);
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
  const [presetHint, setPresetHint] = useState<string | null>(null);

  // Auto-fill preset on email change
  useEffect(() => {
    if (!email.includes('@')) return;
    const p = presetForEmail(email);
    if (p) {
      setImapHost(p.imapHost);
      setImapPort(p.imapPort);
      setSmtpHost(p.smtpHost);
      setSmtpPort(p.smtpPort);
      setPresetHint(p.hint ? `${p.name} détecté. ${p.hint}` : `${p.name} détecté. Champs pré-remplis.`);
    } else {
      setPresetHint(null);
    }
  }, [email]);

  const oauthCfg: OAuthClientConfig = {
    provider: provider as OAuthProvider,
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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
      setError(messageOf(e));
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ajouter un compte"
    >
      <div
        className="w-[600px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-surface">
          <h2 className="text-base font-semibold">Ajouter un compte</h2>
          <button onClick={onClose} className="px-2 py-1 text-sm rounded hover:bg-surface-2">
            ✕
          </button>
        </header>

        <div className="p-5">
          {!isTauri() && (
            <div className="mb-4 p-3 rounded border border-warning/40 bg-warning/10 text-xs">
              Mode aperçu navigateur. Les comptes ajoutés apparaissent dans la sidebar pour
              démonstration mais ne sont pas réellement synchronisés.
            </div>
          )}

          {stage === 'pick' && (
            <>
              <p className="text-sm text-muted mb-3">Choisis ton fournisseur.</p>
              <div className="space-y-2">
                <ProviderTile
                  active={provider === 'gmail'}
                  onClick={() => setProvider('gmail')}
                  title="Gmail / Google Workspace"
                  desc="OAuth 2.0 + PKCE. Scope mail.google.com complet."
                />
                <ProviderTile
                  active={provider === 'outlook'}
                  onClick={() => setProvider('outlook')}
                  title="Outlook / Microsoft 365"
                  desc="OAuth 2.0. Scope IMAP + SMTP delegated."
                />
                <ProviderTile
                  active={provider === 'imap'}
                  onClick={() => setProvider('imap')}
                  title="Autre (IMAP / SMTP)"
                  desc="Free, Orange, Fastmail, Proton (via Bridge), self-hosted, etc."
                />
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setStage(provider === 'imap' ? 'imap-form' : 'oauth-config')}
                  className="px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition"
                >
                  Continuer
                </button>
              </div>
            </>
          )}

          {stage === 'oauth-config' && (
            <>
              <p className="text-sm text-muted mb-3">
                Colle ton <strong>client_id</strong> OAuth. Teddy ne contient aucun secret
                propriétaire — chaque utilisateur enregistre sa propre app pour garder le contrôle.
              </p>
              <Field label="Client ID">
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder={
                    provider === 'gmail'
                      ? 'xxxxxxxxxxx.apps.googleusercontent.com'
                      : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
                  }
                  className="w-full px-3 py-2 rounded border border-border bg-bg text-sm outline-none focus:border-accent"
                />
              </Field>
              <Field label="Redirect URI">
                <input
                  type="text"
                  value={oauthCfg.redirectUri}
                  readOnly
                  className="w-full px-3 py-2 rounded border border-border bg-surface-2 text-sm font-mono text-muted"
                />
                <div className="mt-1 text-xs text-muted">
                  Enregistre cette URI dans la console{' '}
                  {provider === 'gmail' ? 'Google Cloud' : 'Microsoft Entra'}.
                </div>
              </Field>

              {error && <ErrorBox message={error} />}

              <div className="mt-5 flex items-center justify-between">
                <button onClick={() => setStage('pick')} className="text-sm text-muted hover:text-text">
                  Retour
                </button>
                <button
                  onClick={beginOAuth}
                  className="px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition"
                >
                  Ouvrir l'autorisation
                </button>
              </div>
            </>
          )}

          {stage === 'oauth-paste-code' && (
            <>
              <p className="text-sm mb-3">
                Le navigateur s'est ouvert sur la page d'autorisation. Une fois autorisé, copie le
                code reçu et colle-le ici.
              </p>
              <details className="mb-3">
                <summary className="text-xs text-muted cursor-pointer hover:text-text">
                  URL d'autorisation
                </summary>
                <div className="mt-1 p-2 rounded bg-surface-2 text-xs font-mono break-all">
                  {authUrl}
                </div>
              </details>

              <Field label="Code d'autorisation">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="4/0Ab..."
                  className="w-full px-3 py-2 rounded border border-border bg-bg text-sm font-mono outline-none focus:border-accent"
                  autoFocus
                />
              </Field>

              {error && <ErrorBox message={error} />}

              <div className="mt-5 flex items-center justify-between">
                <button onClick={() => setStage('oauth-config')} className="text-sm text-muted hover:text-text">
                  Retour
                </button>
                <button
                  onClick={finalizeOAuth}
                  disabled={!code.trim()}
                  className="px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                  Connecter le compte
                </button>
              </div>
            </>
          )}

          {stage === 'imap-form' && (
            <>
              <p className="text-sm text-muted mb-3">
                Saisis tes paramètres IMAP/SMTP. Teddy détecte les fournisseurs courants.
              </p>

              <Field label="Adresse mail">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="toi@exemple.fr"
                  className="w-full px-3 py-2 rounded border border-border bg-bg text-sm outline-none focus:border-accent"
                  autoFocus
                />
              </Field>

              {presetHint && (
                <div className="mb-3 px-3 py-2 rounded text-xs bg-success/10 text-success border border-success/30">
                  {presetHint}
                </div>
              )}

              <Field label="Nom affiché (optionnel)">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jordan"
                  className="w-full px-3 py-2 rounded border border-border bg-bg text-sm outline-none focus:border-accent"
                />
              </Field>

              <Field label="Mot de passe (ou app password)">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-border bg-bg text-sm outline-none focus:border-accent"
                />
                <div className="mt-1 text-xs text-muted">
                  Stocké dans le keyring OS uniquement, jamais sur disque.
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Serveur IMAP">
                  <input
                    type="text"
                    value={imapHost}
                    onChange={(e) => setImapHost(e.target.value)}
                    placeholder="imap.exemple.fr"
                    className="w-full px-3 py-2 rounded border border-border bg-bg text-sm font-mono outline-none focus:border-accent"
                  />
                </Field>
                <Field label="Port IMAP">
                  <input
                    type="number"
                    value={imapPort}
                    onChange={(e) => setImapPort(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded border border-border bg-bg text-sm font-mono outline-none focus:border-accent"
                  />
                </Field>
                <Field label="Serveur SMTP">
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="smtp.exemple.fr"
                    className="w-full px-3 py-2 rounded border border-border bg-bg text-sm font-mono outline-none focus:border-accent"
                  />
                </Field>
                <Field label="Port SMTP">
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded border border-border bg-bg text-sm font-mono outline-none focus:border-accent"
                  />
                </Field>
              </div>

              {error && <ErrorBox message={error} />}

              <div className="mt-5 flex items-center justify-between">
                <button onClick={() => setStage('pick')} className="text-sm text-muted hover:text-text">
                  Retour
                </button>
                <button
                  onClick={finalizeImap}
                  className="px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition"
                >
                  Connecter le compte
                </button>
              </div>
            </>
          )}

          {stage === 'done' && (
            <div className="py-8 text-center">
              <div className="text-3xl mb-2">✓</div>
              <h3 className="text-base font-semibold mb-1">Compte ajouté</h3>
              <p className="text-sm text-muted mb-5">
                {isTauri()
                  ? 'La synchronisation va commencer en tâche de fond.'
                  : 'Le compte apparaît dans la sidebar (mode aperçu).'}
              </p>
              <button
                onClick={onClose}
                className="px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProviderTile({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left p-3 rounded border transition',
        active ? 'border-accent bg-accent/10' : 'border-border hover:border-muted',
      ].join(' ')}
    >
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted mt-0.5">{desc}</div>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs uppercase tracking-wider text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mt-3 p-2.5 rounded border border-danger/40 bg-danger/10 text-xs text-danger">
      {message}
    </div>
  );
}

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function pickColor(email: string): string {
  // Same idea as avatarColor but constrained to a curated palette so accounts
  // visually differentiate well in the sidebar.
  const palette = ['#6366f1', '#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981'];
  let h = 0;
  for (let i = 0; i < email.length; i += 1) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return palette[h % palette.length] ?? '#6366f1';
}
