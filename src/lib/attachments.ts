// Attachment helpers used by the Composer.
//
// The "draft" attachment lives only in memory while the user is composing.
// On send, the SMTP/JMAP layer (V0.3) handles the actual file transfer.

import type { AttachmentDraft } from '@/types';

export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB per attachment
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB total per mail

const IMAGE_PREVIEW_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export function validateAttachment(
  file: File,
  existing: AttachmentDraft[],
): ValidationResult {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return {
      ok: false,
      error: `${file.name} fait ${formatSize(file.size)}, max ${formatSize(MAX_ATTACHMENT_BYTES)} par fichier`,
    };
  }
  const totalAfter = existing.reduce((s, a) => s + a.sizeBytes, 0) + file.size;
  if (totalAfter > MAX_TOTAL_BYTES) {
    return {
      ok: false,
      error: `Total de ${formatSize(totalAfter)} dépasse la limite de ${formatSize(MAX_TOTAL_BYTES)}`,
    };
  }
  return { ok: true };
}

/**
 * Convert a File into an AttachmentDraft. For images, also generate a data URL
 * for inline preview (capped to 1.5 MB to avoid bloating in-memory state).
 */
export async function fileToAttachment(file: File): Promise<AttachmentDraft> {
  const id = `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const base: AttachmentDraft = {
    id,
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  };
  if (IMAGE_PREVIEW_MIMES.includes(file.type) && file.size < 1.5 * 1024 * 1024) {
    base.dataUrl = await readAsDataUrl(file);
  }
  return base;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Could not read file'));
    r.readAsDataURL(file);
  });
}

/**
 * Heuristic icon for non-image attachments. A short emoji-like marker so the
 * UI doesn't depend on icon fonts.
 */
export function attachmentGlyph(mimeType: string, filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  if (mimeType.startsWith('image/')) return '🖼';
  if (mimeType === 'application/pdf' || ext === 'pdf') return '📄';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.startsWith('video/')) return '🎬';
  if (
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) ||
    mimeType.includes('zip') ||
    mimeType.includes('compressed')
  )
    return '🗜';
  if (['doc', 'docx', 'odt'].includes(ext)) return '📝';
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) return '📊';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return '📽';
  return '📎';
}
