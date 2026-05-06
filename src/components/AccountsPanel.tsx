import { useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { Avatar } from './Avatar';
import type { Account } from '@/types';

interface Props {
  onClose: () => void;
}

const MAX_PHOTO_BYTES = 250 * 1024; // 250 KB after compression — fits localStorage budgets

export function AccountsPanel({ onClose }: Props) {
  const accounts = useStore((s) => s.accounts);
  const [activeId, setActiveId] = useState<string>(accounts[0]?.id ?? '');
  const active = accounts.find((a) => a.id === activeId);

  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Comptes et profil"
    >
      <div
        className="w-[820px] max-w-[calc(100vw-2rem)] max-h-[85vh] flex bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <aside className="w-56 shrink-0 border-r border-border bg-surface-2">
          <header className="px-4 py-3 border-b border-border">
            <h2 className="text-base font-semibold">Comptes</h2>
          </header>
          <ul className="py-1">
            {accounts.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => setActiveId(a.id)}
                  className={[
                    'w-full flex items-center gap-2 px-3 py-2 text-left transition',
                    activeId === a.id ? 'bg-bg' : 'hover:bg-bg/50',
                  ].join(' ')}
                >
                  <Avatar
                    name={a.displayName}
                    email={a.email}
                    {...(a.photoUrl ? { photoUrl: a.photoUrl } : {})}
                    size={26}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{a.displayName}</div>
                    <div className="text-xs text-muted truncate">{a.email}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <header className="px-5 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
            <h2 className="text-base font-semibold">{active?.email ?? 'Aucun compte'}</h2>
            <button onClick={onClose} className="px-2 py-1 text-sm rounded hover:bg-surface-2">
              ✕
            </button>
          </header>
          {active ? <AccountEditor account={active} /> : <EmptyState />}
        </main>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-8 text-center text-sm text-muted">
      Aucun compte. Ajoute-en un depuis la sidebar.
    </div>
  );
}

function AccountEditor({ account }: { account: Account }) {
  const update = useStore((s) => s.updateAccount);
  const showToast = useStore((s) => s.showToast);
  const fileInput = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const onPickPhoto = () => fileInput.current?.click();

  const onPhotoChosen = async (file: File | null) => {
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith('image/')) {
      setPhotoError('Le fichier doit être une image (PNG, JPG, WebP).');
      return;
    }
    try {
      const compressed = await compressImage(file, 320);
      if (compressed.length > MAX_PHOTO_BYTES) {
        setPhotoError(`Photo trop grosse (${Math.round(compressed.length / 1024)} ko). Choisis une image plus petite.`);
        return;
      }
      update(account.id, { photoUrl: compressed });
      showToast('Photo mise à jour');
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : String(e));
    }
  };

  const removePhoto = () => {
    update(account.id, { photoUrl: undefined });
    showToast('Photo retirée');
  };

  return (
    <div className="p-5 space-y-6">
      <Section title="Profil">
        <div className="flex items-center gap-4">
          <Avatar
            name={account.displayName}
            email={account.email}
            {...(account.photoUrl ? { photoUrl: account.photoUrl } : {})}
            size={72}
          />
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <button
                onClick={onPickPhoto}
                className="px-3 py-1.5 text-sm rounded border border-border hover:bg-surface-2 transition"
              >
                {account.photoUrl ? 'Changer la photo' : 'Ajouter une photo'}
              </button>
              {account.photoUrl && (
                <button
                  onClick={removePhoto}
                  className="px-3 py-1.5 text-sm rounded border border-border hover:bg-danger/10 hover:text-danger hover:border-danger transition"
                >
                  Retirer
                </button>
              )}
            </div>
            <div className="text-xs text-muted">
              JPG, PNG ou WebP. Compressée automatiquement à 320px, max 250 ko.
            </div>
            {photoError && <div className="text-xs text-danger">{photoError}</div>}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPhotoChosen(e.target.files?.[0] ?? null)}
          />
        </div>

        <Field label="Nom affiché">
          <input
            type="text"
            value={account.displayName}
            onChange={(e) => update(account.id, { displayName: e.target.value })}
            className="w-full px-3 py-2 rounded border border-border bg-bg text-sm outline-none focus:border-accent"
            placeholder="Jordan Lafe"
          />
          <div className="mt-1 text-xs text-muted">Ce nom apparaît dans le champ « De » des mails envoyés.</div>
        </Field>

        <Field label="Adresse mail">
          <input
            type="email"
            value={account.email}
            disabled
            className="w-full px-3 py-2 rounded border border-border bg-surface-2 text-sm font-mono text-muted cursor-not-allowed"
          />
          <div className="mt-1 text-xs text-muted">L'adresse n'est pas modifiable, supprime puis réajoute le compte si besoin.</div>
        </Field>

        <Field label="Couleur d'accent">
          <input
            type="color"
            value={account.color}
            onChange={(e) => update(account.id, { color: e.target.value })}
            className="h-8 w-16 cursor-pointer rounded border border-border bg-bg"
          />
          <div className="mt-1 text-xs text-muted">Pastille à côté du compte dans la sidebar.</div>
        </Field>
      </Section>

      <Section title="Signature">
        <textarea
          value={account.signature}
          onChange={(e) => update(account.id, { signature: e.target.value })}
          rows={6}
          placeholder={'Jordan Lafe\nProduct designer · https://triskell.studio'}
          className="w-full px-3 py-2 rounded border border-border bg-bg text-sm font-sans outline-none focus:border-accent resize-y"
        />
        <div className="mt-1 flex items-center justify-between">
          <div className="text-xs text-muted">Ajoutée automatiquement en bas de chaque mail envoyé depuis ce compte.</div>
          <div className="text-xs text-muted">{account.signature.length} caractères</div>
        </div>

        <SignaturePreview signature={account.signature} />
      </Section>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

function SignaturePreview({ signature }: { signature: string }) {
  if (!signature.trim()) return null;
  return (
    <div className="mt-3 px-3 py-2 rounded border border-border bg-surface-2 text-xs">
      <div className="text-[10px] uppercase tracking-wider text-muted mb-1">Aperçu</div>
      <pre className="whitespace-pre-wrap font-sans text-text">{signature}</pre>
    </div>
  );
}

/**
 * Resize an image file to fit within maxSize x maxSize while preserving
 * aspect ratio, then return a JPEG data URL. JPEG quality 0.85 is a sweet
 * spot for avatar use.
 */
async function compressImage(file: File, maxSize: number): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Lecture du fichier échouée'));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Image non lisible'));
    i.src = dataUrl;
  });
  const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas indisponible');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.85);
}
