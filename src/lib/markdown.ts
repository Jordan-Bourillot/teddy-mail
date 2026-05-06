// Tiny markdown helpers. Goals:
//   1. Inline editing in the Composer: toggle bold, italic, code, link, list
//      around the current textarea selection.
//   2. Safe rendering in the MailReader for plain-text bodies (so received
//      plain mails with markdown-ish formatting still look pretty).
//
// We deliberately implement a small subset rather than depend on a heavy
// markdown lib. Sanitization is done by DOMPurify upstream, this module only
// produces escaped HTML.

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
}

/**
 * Render a small markdown subset to HTML:
 * - **bold**, __bold__
 * - *italic*, _italic_
 * - `code`
 * - [text](url)
 * - line starting with "- " → unordered list
 * - line starting with "1. " (or any digit) → ordered list
 * - line starting with "> " → blockquote
 * - blank line → paragraph break
 * - http(s)://... auto-linked
 *
 * Returns HTML that's safe to inject after DOMPurify pass.
 */
export function renderMarkdown(input: string): string {
  if (!input) return '';
  const escaped = escapeHtml(input);
  const lines = escaped.split('\n');
  const out: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let inQuote = false;

  const closeBlocks = () => {
    if (listType) {
      out.push(`</${listType}>`);
      listType = null;
    }
    if (inQuote) {
      out.push('</blockquote>');
      inQuote = false;
    }
  };

  for (const raw of lines) {
    const line = raw;
    const ulMatch = /^\s*[-*]\s+(.+)$/.exec(line);
    const olMatch = /^\s*\d+\.\s+(.+)$/.exec(line);
    const quoteMatch = /^\s*&gt;\s*(.*)$/.exec(line);

    if (ulMatch) {
      if (inQuote) {
        out.push('</blockquote>');
        inQuote = false;
      }
      if (listType !== 'ul') {
        if (listType) out.push(`</${listType}>`);
        out.push('<ul>');
        listType = 'ul';
      }
      out.push(`<li>${applyInline(ulMatch[1] ?? '')}</li>`);
    } else if (olMatch) {
      if (inQuote) {
        out.push('</blockquote>');
        inQuote = false;
      }
      if (listType !== 'ol') {
        if (listType) out.push(`</${listType}>`);
        out.push('<ol>');
        listType = 'ol';
      }
      out.push(`<li>${applyInline(olMatch[1] ?? '')}</li>`);
    } else if (quoteMatch) {
      if (listType) {
        out.push(`</${listType}>`);
        listType = null;
      }
      if (!inQuote) {
        out.push('<blockquote>');
        inQuote = true;
      }
      out.push(`<p>${applyInline(quoteMatch[1] ?? '')}</p>`);
    } else if (line.trim() === '') {
      closeBlocks();
      out.push('');
    } else {
      closeBlocks();
      out.push(`<p>${applyInline(line)}</p>`);
    }
  }
  closeBlocks();
  return out.join('\n');
}

function applyInline(text: string): string {
  // Order matters: code first to avoid mangling its contents.
  let s = text;
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Links [text](url) — url already escaped, but verify scheme.
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
    const safeUrl = sanitizeUrl(url);
    if (!safeUrl) return label;
    return `<a href="${safeUrl}" rel="noopener noreferrer" target="_blank">${label}</a>`;
  });
  // Bold and italic. Bold first so **a** wins over *a*.
  s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
  s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  s = s.replace(/(^|[\s])_([^_\n]+)_(?=$|[\s.,;:!?])/g, '$1<em>$2</em>');
  // Auto-link bare URLs that haven't been wrapped in a markdown link.
  s = s.replace(
    /(^|[\s>])(https?:\/\/[^\s<]+)(?=$|[\s.,;:!?])/g,
    (_, lead, url) => {
      const safe = sanitizeUrl(url);
      if (!safe) return `${lead}${url}`;
      return `${lead}<a href="${safe}" rel="noopener noreferrer" target="_blank">${url}</a>`;
    },
  );
  return s;
}

function sanitizeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:') {
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------- Inline editing helpers ----------------

export interface SelectionPatch {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

/**
 * Wrap (or unwrap) the current selection with `prefix`/`suffix`. If the
 * selection is empty, the cursor lands between the markers so the user can
 * type the inner content.
 */
export function toggleWrap(
  text: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string,
): SelectionPatch {
  const before = text.slice(0, start);
  const middle = text.slice(start, end);
  const after = text.slice(end);

  // Already wrapped → unwrap.
  if (
    middle.startsWith(prefix) &&
    middle.endsWith(suffix) &&
    middle.length >= prefix.length + suffix.length
  ) {
    const unwrapped = middle.slice(prefix.length, middle.length - suffix.length);
    return {
      text: before + unwrapped + after,
      selectionStart: start,
      selectionEnd: start + unwrapped.length,
    };
  }
  // Wrap.
  const next = before + prefix + middle + suffix + after;
  return {
    text: next,
    selectionStart: start + prefix.length,
    selectionEnd: end + prefix.length,
  };
}

/**
 * Toggle a per-line prefix for the lines covered by the selection.
 * Used for "- " (bullet), "1. " (ordered), "> " (quote).
 */
export function toggleLinePrefix(
  text: string,
  start: number,
  end: number,
  prefix: string,
): SelectionPatch {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1;
  const lineEndIdx = text.indexOf('\n', end);
  const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
  const block = text.slice(lineStart, lineEnd);

  const lines = block.split('\n');
  const allHavePrefix = lines.every((l) => l.startsWith(prefix));
  const updated = allHavePrefix
    ? lines.map((l) => l.slice(prefix.length))
    : lines.map((l) => prefix + l);
  const newBlock = updated.join('\n');
  const next = text.slice(0, lineStart) + newBlock + text.slice(lineEnd);
  const delta = newBlock.length - block.length;
  return {
    text: next,
    selectionStart: lineStart,
    selectionEnd: end + delta,
  };
}

/**
 * Insert a markdown link around the current selection. If selection is empty,
 * inserts `[label](url)` placeholder.
 */
export function insertLink(
  text: string,
  start: number,
  end: number,
  url: string,
): SelectionPatch {
  const middle = text.slice(start, end) || 'lien';
  const inserted = `[${middle}](${url})`;
  const before = text.slice(0, start);
  const after = text.slice(end);
  return {
    text: before + inserted + after,
    selectionStart: start + 1,
    selectionEnd: start + 1 + middle.length,
  };
}
