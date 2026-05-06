import { useEffect, useRef, useState } from 'react';
import { useStore } from '@/lib/store';
import { fileToAttachment, validateAttachment, formatSize, attachmentGlyph } from '@/lib/attachments';
import { toggleWrap, toggleLinePrefix, insertLink } from '@/lib/markdown';

export function Composer() {
  const open = useStore((s) => s.composeOpen);
  const draft = useStore((s) => s.composeDraft);
  const accounts = useStore((s) => s.accounts);
  const update = useStore((s) => s.updateDraft);
  const close = useStore((s) => s.closeCompose);
  const send = useStore((s) => s.sendDraft);
  const addAttachment = useStore((s) => s.addAttachment);
  const removeAttachment = useStore((s) => s.removeAttachment);
  const showToast = useStore((s) => s.showToast);
  const undoSendSeconds = useStore((s) => s.prefs.undoSendSeconds);

  const subjectRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const lastSavedAtRef = useRef<string>('');
  const [dragActive, setDragActive] = useState(false);

  type FormatAction = 'bold' | 'italic' | 'code' | 'link' | 'ul' | 'ol' | 'quote';
  const applyFormat = (action: FormatAction) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const text = ta.value;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    let patch;
    switch (action) {
      case 'bold':
        patch = toggleWrap(text, start, end, '**', '**');
        break;
      case 'italic':
        patch = toggleWrap(text, start, end, '_', '_');
        break;
      case 'code':
        patch = toggleWrap(text, start, end, '`', '`');
        break;
      case 'ul':
        patch = toggleLinePrefix(text, start, end, '- ');
        break;
      case 'ol':
        patch = toggleLinePrefix(text, start, end, '1. ');
        break;
      case 'quote':
        patch = toggleLinePrefix(text, start, end, '> ');
        break;
      case 'link': {
        const url = window.prompt('URL du lien', 'https://');
        if (!url || url === 'https://') return;
        patch = insertLink(text, start, end, url);
        break;
      }
    }
    update({ body: patch.text });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(patch.selectionStart, patch.selectionEnd);
    });
  };

  useEffect(() => {
    if (open && draft) {
      lastSavedAtRef.current = draft.updatedAt;
    }
  }, [open, draft]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        send();
      }
      // Markdown shortcuts only fire when the body textarea has focus.
      const target = e.target as HTMLElement | null;
      if (target !== bodyRef.current) return;
      if (mod && !e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        applyFormat('bold');
      } else if (mod && !e.shiftKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        applyFormat('italic');
      } else if (mod && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        applyFormat('link');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, close, send]);

  if (!open || !draft) return null;

  const account = accounts.find((a) => a.id === draft.accountId);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const current = draft.attachments;
    let added = 0;
    for (const file of Array.from(files)) {
      const v = validateAttachment(file, current);
      if (!v.ok) {
        showToast(v.error ?? 'Pièce jointe refusée');
        continue;
      }
      const att = await fileToAttachment(file);
      addAttachment(att);
      added += 1;
    }
    if (added > 0) {
      showToast(`${added} pièce(s) jointe(s) ajoutée(s)`);
    }
  };

  // Detect "I attached..." in body without attachments → warn user.
  const mentionsAttachment = /joint|joins|attach|pièce jointe|pj|enclosed|attached/i.test(draft.body);
  const hasAttachments = draft.attachments.length > 0;
  const attachmentWarning = mentionsAttachment && !hasAttachments;
  const totalSize = draft.attachments.reduce((s, a) => s + a.sizeBytes, 0);

  return (
    <div
      ref={dropZoneRef}
      className={[
        'fixed bottom-4 right-4 w-[640px] max-w-[calc(100vw-2rem)] h-[560px] bg-surface border rounded-lg shadow-2xl flex flex-col z-30 transition',
        dragActive ? 'border-accent ring-2 ring-accent/40' : 'border-border',
      ].join(' ')}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragActive) setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only deactivate if leaving the wrapper itself (not children)
        const rect = dropZoneRef.current?.getBoundingClientRect();
        if (!rect || e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
          setDragActive(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        void handleFiles(e.dataTransfer.files);
      }}
    >
      {dragActive && (
        <div className="absolute inset-0 z-10 bg-accent/10 border-2 border-dashed border-accent rounded-lg flex items-center justify-center pointer-events-none">
          <div className="bg-surface px-4 py-2 rounded-lg shadow text-sm font-medium">
            Lâcher pour joindre
          </div>
        </div>
      )}
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-2 rounded-t-lg">
        <div className="text-sm font-medium">Nouveau message</div>
        <div className="flex items-center gap-1 text-muted">
          <button
            onClick={close}
            aria-label="Fermer"
            className="px-2 py-1 text-sm rounded hover:bg-surface transition"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="px-4 py-2 border-b border-border space-y-1.5 text-sm">
        <FieldRow label="De">
          <select
            value={draft.accountId}
            onChange={(e) => update({ accountId: e.target.value })}
            className="bg-transparent w-full outline-none"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.email}
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="À">
          <input
            type="email"
            value={draft.to.map((t) => t.email).join(', ')}
            onChange={(e) =>
              update({
                to: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((email) => ({ email })),
              })
            }
            className="bg-transparent w-full outline-none"
            placeholder="destinataire@exemple.fr"
          />
        </FieldRow>
        <FieldRow label="Sujet">
          <input
            ref={subjectRef}
            type="text"
            value={draft.subject}
            onChange={(e) => update({ subject: e.target.value })}
            className="bg-transparent w-full outline-none font-medium"
            placeholder="Sujet du mail"
          />
        </FieldRow>
      </div>

      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-border bg-bg/50">
        <ToolbarButton onClick={() => applyFormat('bold')} title="Gras (⌘B)" label="B" bold />
        <ToolbarButton onClick={() => applyFormat('italic')} title="Italique (⌘I)" label="I" italic />
        <ToolbarButton onClick={() => applyFormat('code')} title="Code" label="</>" mono />
        <Sep />
        <ToolbarButton onClick={() => applyFormat('ul')} title="Liste à puces" label="•—" />
        <ToolbarButton onClick={() => applyFormat('ol')} title="Liste numérotée" label="1." />
        <ToolbarButton onClick={() => applyFormat('quote')} title="Citation" label="❝" />
        <Sep />
        <ToolbarButton onClick={() => applyFormat('link')} title="Lien (⌘K)" label="🔗" />
        <span className="ml-auto text-[10px] text-muted px-2">Markdown</span>
      </div>
      <textarea
        ref={bodyRef}
        value={draft.body}
        onChange={(e) => update({ body: e.target.value })}
        className="flex-1 px-4 py-3 bg-transparent outline-none resize-none text-[15px] leading-relaxed font-sans"
        placeholder="Écris ton message…    **gras**    _italique_    `code`    [lien](url)    - liste"
      />

      {hasAttachments && (
        <div className="px-4 py-2 border-t border-border bg-bg/50 max-h-32 overflow-y-auto">
          <ul className="flex flex-wrap gap-1.5">
            {draft.attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 px-2 py-1 rounded border border-border bg-surface text-xs group"
              >
                {a.dataUrl ? (
                  <img src={a.dataUrl} alt="" className="w-5 h-5 rounded object-cover" />
                ) : (
                  <span aria-hidden>{attachmentGlyph(a.mimeType, a.filename)}</span>
                )}
                <span className="font-medium truncate max-w-[180px]" title={a.filename}>
                  {a.filename}
                </span>
                <span className="text-muted">{formatSize(a.sizeBytes)}</span>
                <button
                  onClick={() => removeAttachment(a.id)}
                  className="text-muted hover:text-danger px-1"
                  aria-label={`Retirer ${a.filename}`}
                  title="Retirer"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="text-[10px] text-muted mt-1">
            Total {formatSize(totalSize)} · {draft.attachments.length} fichier(s)
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          // Reset so the same file can be chosen again later.
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />

      {account?.signature?.trim() && (
        <div className="px-4 py-2 border-t border-border text-xs text-muted whitespace-pre-line">
          {account.signature}
        </div>
      )}
      {!account?.signature?.trim() && (
        <div className="px-4 py-2 border-t border-border text-xs text-muted/70">
          Pas de signature pour ce compte. <span className="italic">Sidebar → clique sur l'email du compte → Signature.</span>
        </div>
      )}

      <footer className="flex items-center justify-between px-4 py-2 border-t border-border bg-surface-2 rounded-b-lg">
        <div className="text-xs text-muted">
          Auto-save · {new Date(draft.updatedAt).toLocaleTimeString()}
          {attachmentWarning && (
            <span className="ml-3 text-warning">⚠ Tu as mentionné une pièce jointe absente</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 text-sm rounded hover:bg-surface transition"
            title="Joindre un fichier (ou glisse-dépose dans la fenêtre)"
          >
            📎 {hasAttachments ? draft.attachments.length : ''}
          </button>
          <button
            onClick={close}
            className="px-3 py-1.5 text-sm rounded hover:bg-surface transition"
          >
            Brouillon
          </button>
          <button
            onClick={send}
            className="px-4 py-1.5 text-sm rounded bg-accent text-white font-medium hover:opacity-90 transition"
            title={`Envoyer (Ctrl/Cmd+Entrée). Annulable pendant ${undoSendSeconds}s.`}
          >
            Envoyer
          </button>
        </div>
      </footer>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1 border-b border-border last:border-0">
      <span className="w-12 shrink-0 text-muted text-xs uppercase tracking-wider">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  label,
  bold,
  italic,
  mono,
}: {
  onClick: () => void;
  title: string;
  label: string;
  bold?: boolean;
  italic?: boolean;
  mono?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={[
        'w-7 h-7 rounded text-xs flex items-center justify-center hover:bg-surface-2 transition',
        bold ? 'font-bold' : '',
        italic ? 'italic' : '',
        mono ? 'font-mono' : '',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-border mx-1" />;
}
