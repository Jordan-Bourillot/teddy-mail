import { useState } from 'react';
import { useStore } from '@/lib/store';
import { themeOptions, applyTheme } from '@/lib/themes';
import { describeCombo, getProfile } from '@/lib/hotkeys';
import type { ThemeName } from '@/types';

const ONBOARDING_KEY = 'teddy-mail-onboarded-v1';

export function shouldShowOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) !== 'true';
  } catch {
    return false;
  }
}

function markDone(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } catch {
    /* ignore */
  }
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const prefs = useStore((s) => s.prefs);
  const updatePrefs = useStore((s) => s.updatePrefs);

  const finish = () => {
    markDone();
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg flex items-center justify-center">
      <div className="w-[640px] max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-lg shadow-xl overflow-hidden">
        <header className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold tracking-tight">Teddy Mail</div>
            <div className="text-xs text-muted">configuration en 90 secondes</div>
          </div>
          <Steps current={step} total={3} />
        </header>

        <div className="px-6 py-6 min-h-[360px]">
          {step === 0 && <StepTheme prefs={prefs} updatePrefs={updatePrefs} />}
          {step === 1 && <StepAccount />}
          {step === 2 && <StepShortcuts profile={prefs.keyboardProfile} />}
        </div>

        <footer className="px-6 py-3 border-t border-border bg-surface-2 flex items-center justify-between">
          <button
            onClick={finish}
            className="text-xs text-muted hover:text-text transition"
          >
            Passer la configuration
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-3 py-1.5 text-sm rounded hover:bg-surface transition"
              >
                Retour
              </button>
            )}
            {step < 2 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition"
              >
                Suivant
              </button>
            ) : (
              <button
                onClick={finish}
                className="px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition"
              >
                C'est parti
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={[
            'inline-block w-6 h-1 rounded-full transition',
            i <= current ? 'bg-accent' : 'bg-border',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

function StepTheme({
  prefs,
  updatePrefs,
}: {
  prefs: ReturnType<typeof useStore.getState>['prefs'];
  updatePrefs: (p: Partial<typeof prefs>) => void;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Choisis ton thème</h2>
      <p className="text-sm text-muted mb-5">
        Tu peux en changer plus tard via la palette ou les préférences. Le rendu est instantané.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {themeOptions.map((t) => (
          <button
            key={t.value}
            onClick={() => {
              updatePrefs({ theme: t.value });
              applyTheme(t.value, prefs.density, prefs.fontSize);
            }}
            className={[
              'group relative px-3 py-4 rounded border text-left transition',
              prefs.theme === t.value
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-muted',
            ].join(' ')}
          >
            <ThemePreviewSwatch theme={t.value} />
            <div className="mt-2 text-sm font-medium">{t.label}</div>
            <div className="text-xs text-muted">{t.hint}</div>
          </button>
        ))}
      </div>
      <div className="mt-5 text-xs text-muted">
        Densité actuelle : {prefs.density} · Taille : {prefs.fontSize}px (modifiable dans les préférences)
      </div>
    </div>
  );
}

function ThemePreviewSwatch({ theme }: { theme: ThemeName }) {
  // Force an isolated theme attribute on this scope so previews show the real palette.
  const wrapperStyle: React.CSSProperties = { containerType: 'inline-size' };
  return (
    <div data-theme={theme} className="rounded overflow-hidden border border-border" style={wrapperStyle}>
      <div className="bg-bg p-2.5 flex gap-2 items-center">
        <span className="inline-block w-2 h-2 rounded-full bg-danger" />
        <span className="inline-block w-2 h-2 rounded-full bg-warning" />
        <span className="inline-block w-2 h-2 rounded-full bg-success" />
        <span className="ml-auto inline-block w-8 h-1 bg-border rounded" />
      </div>
      <div className="bg-surface p-2.5">
        <div className="text-[10px] font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
          Anna Belmas
        </div>
        <div className="text-[9px]" style={{ color: 'rgb(var(--color-muted))' }}>
          Confirmation réunion jeudi 14h
        </div>
        <div
          className="mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] text-white"
          style={{ background: 'rgb(var(--color-accent))' }}
        >
          accent
        </div>
      </div>
    </div>
  );
}

function StepAccount() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Connecte un compte (optionnel)</h2>
      <p className="text-sm text-muted mb-5">
        Tu peux explorer l'app avec des données fictives, ou connecter un vrai compte tout de suite.
      </p>

      <div className="space-y-2">
        <ProviderTile
          name="Gmail"
          desc="OAuth 2.0 sécurisé · jamais ton mot de passe"
          icon="G"
          color="#ea4335"
          comingSoon
        />
        <ProviderTile
          name="Outlook / Microsoft 365"
          desc="OAuth 2.0 · personnel et pro"
          icon="O"
          color="#0078d4"
          comingSoon
        />
        <ProviderTile
          name="iCloud Mail"
          desc="OAuth 2.0 via Apple"
          icon=""
          color="#a1a1a6"
          comingSoon
        />
        <ProviderTile
          name="Autre (IMAP / SMTP)"
          desc="Tout serveur classique avec mot de passe d'application"
          icon="·"
          color="#6366f1"
          comingSoon
        />
      </div>

      <div className="mt-5 p-3 rounded border border-border bg-surface-2 text-xs text-muted">
        En mode prévisualisation, l'app utilise des données fictives. La connexion réelle des comptes
        sera disponible dès que le shell Tauri (en cours d'intégration) sera lancé.
      </div>
    </div>
  );
}

function ProviderTile({
  name,
  desc,
  icon,
  color,
  comingSoon,
}: {
  name: string;
  desc: string;
  icon: string;
  color: string;
  comingSoon?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={comingSoon}
      className="w-full flex items-center gap-3 p-3 rounded border border-border bg-surface hover:bg-surface-2 transition text-left disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <div
        className="w-9 h-9 rounded flex items-center justify-center text-white font-semibold text-sm shrink-0"
        style={{ background: color }}
        aria-hidden
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{name}</div>
        <div className="text-xs text-muted truncate">{desc}</div>
      </div>
      {comingSoon ? (
        <span className="text-[10px] uppercase tracking-wider text-muted px-2 py-0.5 rounded bg-surface-2 border border-border">
          bientôt
        </span>
      ) : (
        <span className="text-muted">→</span>
      )}
    </button>
  );
}

function StepShortcuts({ profile }: { profile: ReturnType<typeof useStore.getState>['prefs']['keyboardProfile'] }) {
  const p = getProfile(profile);
  const items: { combo: string; label: string }[] = [
    { combo: p.commandPalette, label: 'Palette de commandes (cherche tout)' },
    { combo: p.compose, label: 'Nouveau message' },
    { combo: p.archive, label: 'Archiver le mail courant' },
    { combo: p.snooze, label: 'Reporter (snooze)' },
    { combo: p.next, label: 'Mail suivant' },
    { combo: p.prev, label: 'Mail précédent' },
    { combo: p.toggleFocus, label: 'Mode focus (cache le bruit)' },
    { combo: p.undoSend, label: "Annuler l'envoi" },
  ];
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Quelques raccourcis</h2>
      <p className="text-sm text-muted mb-5">
        Tout est personnalisable dans les préférences. Profil actuel : <span className="font-mono">{profile}</span>.
      </p>

      <ul className="space-y-1.5">
        {items.map((it) => (
          <li
            key={it.combo + it.label}
            className="flex items-center justify-between px-3 py-1.5 rounded bg-surface-2"
          >
            <span className="text-sm">{it.label}</span>
            <span className="kbd">{describeCombo(it.combo)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 text-xs text-muted">
        Astuce : ouvre la palette à tout moment et tape ce que tu veux faire — elle sait
        chercher dans tes mails et exécuter des actions.
      </div>
    </div>
  );
}
