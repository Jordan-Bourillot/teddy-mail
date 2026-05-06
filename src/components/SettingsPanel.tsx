import { useState } from 'react';
import { useStore } from '@/lib/store';
import { themeOptions, densityOptions } from '@/lib/themes';
import { playSound } from '@/lib/sounds';

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 text-sm rounded hover:bg-surface-2 transition"
        title="Préférences"
      >
        ⚙ Préférences
      </button>
      {open && <SettingsPanel onClose={() => setOpen(false)} />}
    </>
  );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const prefs = useStore((s) => s.prefs);
  const update = useStore((s) => s.updatePrefs);

  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Préférences"
    >
      <div
        className="w-[640px] max-h-[80vh] overflow-y-auto bg-surface border border-border rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-base font-semibold">Préférences</h2>
          <button onClick={onClose} className="px-2 py-1 text-sm rounded hover:bg-surface-2">
            ✕
          </button>
        </header>

        <div className="p-5 space-y-6">
          <Section title="Apparence">
            <Row label="Thème">
              <div className="flex flex-wrap gap-2">
                {themeOptions.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => update({ theme: t.value })}
                    className={[
                      'px-3 py-1.5 text-sm rounded border transition',
                      prefs.theme === t.value
                        ? 'border-accent bg-accent/10 text-text'
                        : 'border-border text-muted hover:text-text',
                    ].join(' ')}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Densité">
              <div className="flex gap-2">
                {densityOptions.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => update({ density: d.value })}
                    className={[
                      'px-3 py-1.5 text-sm rounded border transition',
                      prefs.density === d.value
                        ? 'border-accent bg-accent/10'
                        : 'border-border text-muted hover:text-text',
                    ].join(' ')}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Taille de police">
              <input
                type="range"
                min={12}
                max={18}
                value={prefs.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="w-48"
              />
              <span className="ml-2 text-sm text-muted">{prefs.fontSize}px</span>
            </Row>
          </Section>

          <Section title="Vie privée">
            <Toggle
              label="Bloquer les pixels traceurs"
              hint="Détecte et neutralise les pixels 1×1 et domaines connus."
              checked={prefs.blockTrackers}
              onChange={(v) => update({ blockTrackers: v })}
            />
            <Row label="Images distantes">
              <select
                value={prefs.blockRemoteImages}
                onChange={(e) =>
                  update({ blockRemoteImages: e.target.value as typeof prefs.blockRemoteImages })
                }
                className="bg-surface-2 px-2 py-1 rounded border border-border text-sm"
              >
                <option value="always">Toujours bloquer</option>
                <option value="trusted">Charger uniquement pour les expéditeurs de confiance</option>
                <option value="never">Toujours afficher</option>
              </select>
            </Row>
          </Section>

          <Section title="Envoi">
            <Row label="Annulation d'envoi">
              <div className="flex gap-2">
                {[0, 5, 10, 30].map((s) => (
                  <button
                    key={s}
                    onClick={() => update({ undoSendSeconds: s as 0 | 5 | 10 | 30 })}
                    className={[
                      'px-3 py-1.5 text-sm rounded border transition',
                      prefs.undoSendSeconds === s
                        ? 'border-accent bg-accent/10'
                        : 'border-border text-muted hover:text-text',
                    ].join(' ')}
                  >
                    {s === 0 ? 'Désactivé' : `${s}s`}
                  </button>
                ))}
              </div>
            </Row>
          </Section>

          <Section title="Clavier">
            <Row label="Profil de raccourcis">
              <select
                value={prefs.keyboardProfile}
                onChange={(e) =>
                  update({ keyboardProfile: e.target.value as typeof prefs.keyboardProfile })
                }
                className="bg-surface-2 px-2 py-1 rounded border border-border text-sm"
              >
                <option value="teddy">Teddy (par défaut)</option>
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="mutt">Mutt / Vim</option>
              </select>
            </Row>
          </Section>

          <Section title="Mouvement et son">
            <Row label="Animations">
              <select
                value={prefs.reducedMotion}
                onChange={(e) =>
                  update({ reducedMotion: e.target.value as typeof prefs.reducedMotion })
                }
                className="bg-surface-2 px-2 py-1 rounded border border-border text-sm"
              >
                <option value="auto">Auto (suit le système)</option>
                <option value="always">Toujours réduites</option>
                <option value="never">Toujours actives</option>
              </select>
            </Row>
            <Row label="Sons">
              <div className="flex gap-2">
                {(['off', 'subtle', 'crisp'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      update({ soundPack: s });
                      // Quick preview
                      if (s !== 'off') {
                        playSound('send', s);
                      }
                    }}
                    className={[
                      'px-3 py-1.5 text-sm rounded border transition',
                      prefs.soundPack === s
                        ? 'border-accent bg-accent/10'
                        : 'border-border text-muted hover:text-text',
                    ].join(' ')}
                  >
                    {s === 'off' ? 'Aucun' : s === 'subtle' ? 'Discrets' : 'Nets'}
                  </button>
                ))}
              </div>
            </Row>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs uppercase tracking-wider text-muted mb-3">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-40 shrink-0 text-sm text-muted">{label}</span>
      <div className="flex-1 flex items-center">{children}</div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-[rgb(var(--color-accent))]"
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}
