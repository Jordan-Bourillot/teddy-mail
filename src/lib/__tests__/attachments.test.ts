import { describe, it, expect } from 'vitest';
import {
  formatSize,
  validateAttachment,
  attachmentGlyph,
  MAX_ATTACHMENT_BYTES,
  MAX_TOTAL_BYTES,
} from '../attachments';
import type { AttachmentDraft } from '@/types';

function fakeFile(name: string, size: number, type = 'application/octet-stream'): File {
  const blob = new Blob([new Uint8Array(0)], { type });
  Object.defineProperty(blob, 'size', { value: size });
  Object.defineProperty(blob, 'name', { value: name });
  return blob as File;
}

describe('formatSize', () => {
  it('handles bytes', () => {
    expect(formatSize(0)).toBe('0 o');
    expect(formatSize(512)).toBe('512 o');
    expect(formatSize(1023)).toBe('1023 o');
  });
  it('handles KB', () => {
    expect(formatSize(1024)).toBe('1.0 ko');
    expect(formatSize(1536)).toBe('1.5 ko');
  });
  it('handles MB', () => {
    expect(formatSize(1024 * 1024)).toBe('1.0 Mo');
    expect(formatSize(2.5 * 1024 * 1024)).toBe('2.5 Mo');
  });
});

describe('validateAttachment', () => {
  it('accepts a normal file', () => {
    const r = validateAttachment(fakeFile('a.pdf', 100 * 1024), []);
    expect(r.ok).toBe(true);
  });

  it('rejects a single file over per-attachment limit', () => {
    const r = validateAttachment(fakeFile('big.bin', MAX_ATTACHMENT_BYTES + 1), []);
    expect(r.ok).toBe(false);
    expect(r.error).toContain('max');
  });

  it('rejects when total goes over the email limit', () => {
    const big: AttachmentDraft = {
      id: 'x',
      filename: 'a.bin',
      mimeType: 'x',
      sizeBytes: MAX_TOTAL_BYTES - 1024,
    };
    const r = validateAttachment(fakeFile('b.bin', 4096), [big]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain('Total');
  });
});

describe('attachmentGlyph', () => {
  it('picks image glyph', () => {
    expect(attachmentGlyph('image/png', 'a.png')).toBe('🖼');
  });
  it('picks pdf glyph from extension when MIME is generic', () => {
    expect(attachmentGlyph('application/octet-stream', 'doc.pdf')).toBe('📄');
  });
  it('picks zip glyph', () => {
    expect(attachmentGlyph('application/zip', 'a.zip')).toBe('🗜');
  });
  it('falls back to paperclip', () => {
    expect(attachmentGlyph('application/x-weird', 'thing.xyz')).toBe('📎');
  });
});
