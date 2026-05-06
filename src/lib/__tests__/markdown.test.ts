import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  renderMarkdown,
  toggleWrap,
  toggleLinePrefix,
  insertLink,
} from '../markdown';

describe('escapeHtml', () => {
  it('escapes special chars', () => {
    expect(escapeHtml(`<a href="x">b</a> & 'c'`)).toBe(
      `&lt;a href=&quot;x&quot;&gt;b&lt;/a&gt; &amp; &#39;c&#39;`,
    );
  });
});

describe('renderMarkdown', () => {
  it('handles bold and italic', () => {
    const html = renderMarkdown('**bold** and _italic_ text');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  it('handles code', () => {
    expect(renderMarkdown('hello `world`')).toContain('<code>world</code>');
  });

  it('renders unordered list', () => {
    const html = renderMarkdown('- one\n- two\n- three');
    expect(html).toContain('<ul>');
    expect(html.match(/<li>/g)?.length).toBe(3);
  });

  it('renders ordered list', () => {
    const html = renderMarkdown('1. one\n2. two');
    expect(html).toContain('<ol>');
    expect(html.match(/<li>/g)?.length).toBe(2);
  });

  it('renders blockquote', () => {
    expect(renderMarkdown('> quoted line')).toContain('<blockquote>');
  });

  it('escapes html injection', () => {
    const html = renderMarkdown('hello <script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders safe links', () => {
    const html = renderMarkdown('see [here](https://example.com)');
    expect(html).toContain('href="https://example.com');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('rejects javascript: links', () => {
    const html = renderMarkdown('click [me](javascript:alert(1))');
    expect(html).not.toContain('javascript:');
  });

  it('auto-links bare URLs', () => {
    const html = renderMarkdown('go to https://example.fr');
    expect(html).toContain('<a href="https://example.fr');
  });

  it('handles empty input', () => {
    expect(renderMarkdown('')).toBe('');
  });

  it('returns paragraphs separated by blank line', () => {
    const html = renderMarkdown('line 1\n\nline 2');
    expect(html.match(/<p>/g)?.length).toBe(2);
  });
});

describe('toggleWrap', () => {
  it('wraps selection with delimiters', () => {
    const r = toggleWrap('hello world', 0, 5, '**', '**');
    expect(r.text).toBe('**hello** world');
    expect(r.selectionStart).toBe(2);
    expect(r.selectionEnd).toBe(7);
  });

  it('unwraps when already wrapped', () => {
    const r = toggleWrap('**hi**', 0, 6, '**', '**');
    expect(r.text).toBe('hi');
  });

  it('wraps empty selection', () => {
    const r = toggleWrap('abc', 1, 1, '**', '**');
    expect(r.text).toBe('a****bc');
    expect(r.selectionStart).toBe(3);
    expect(r.selectionEnd).toBe(3);
  });
});

describe('toggleLinePrefix', () => {
  it('adds prefix to single line', () => {
    const r = toggleLinePrefix('hello', 2, 2, '- ');
    expect(r.text).toBe('- hello');
  });

  it('adds prefix to multiple lines', () => {
    const r = toggleLinePrefix('a\nb\nc', 0, 5, '- ');
    expect(r.text).toBe('- a\n- b\n- c');
  });

  it('removes prefix when all lines have it', () => {
    const r = toggleLinePrefix('- a\n- b', 0, 7, '- ');
    expect(r.text).toBe('a\nb');
  });
});

describe('insertLink', () => {
  it('wraps selection in markdown link syntax', () => {
    const r = insertLink('see here', 4, 8, 'https://x.fr');
    expect(r.text).toBe('see [here](https://x.fr)');
  });

  it('inserts placeholder for empty selection', () => {
    const r = insertLink('see ', 4, 4, 'https://x.fr');
    expect(r.text).toBe('see [lien](https://x.fr)');
  });
});
