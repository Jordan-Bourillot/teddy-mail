// Cmd+F find-in-thread bar. Highlights matches in the visible reader pane
// and lets the user jump between them.

import { useEffect, useRef, useState } from 'react';

interface Props {
  /** CSS selector for the container to search within. */
  scopeSelector: string;
  open: boolean;
  onClose: () => void;
}

const HIGHLIGHT_CLASS = 'teddy-find-hit';
const ACTIVE_CLASS = 'teddy-find-hit-active';

export function FindInMail({ scopeSelector, open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      clearHighlights(scopeSelector);
    }
  }, [open, scopeSelector]);

  useEffect(() => {
    clearHighlights(scopeSelector);
    if (!query.trim()) {
      setMatchCount(0);
      setActiveIndex(0);
      return;
    }
    const count = highlightMatches(scopeSelector, query);
    setMatchCount(count);
    setActiveIndex(count > 0 ? 0 : -1);
    if (count > 0) setActive(scopeSelector, 0);
  }, [query, scopeSelector]);

  useEffect(() => {
    if (matchCount > 0 && activeIndex >= 0) {
      setActive(scopeSelector, activeIndex);
    }
  }, [activeIndex, matchCount, scopeSelector]);

  if (!open) return null;

  const next = () => {
    if (matchCount === 0) return;
    setActiveIndex((i) => (i + 1) % matchCount);
  };
  const prev = () => {
    if (matchCount === 0) return;
    setActiveIndex((i) => (i - 1 + matchCount) % matchCount);
  };

  return (
    <div
      className="absolute top-12 right-4 z-30 bg-surface border border-border rounded-lg shadow-lg flex items-center gap-1 px-2 py-1.5 print-hide"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (e.shiftKey) prev();
          else next();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher dans le mail…"
        className="px-2 py-1 text-sm bg-bg rounded outline-none focus:ring-1 ring-accent w-64"
      />
      <span className="text-xs text-muted px-2 min-w-[60px] text-center">
        {matchCount > 0 ? `${activeIndex + 1} / ${matchCount}` : query ? '0' : ''}
      </span>
      <button
        onClick={prev}
        disabled={matchCount === 0}
        title="Précédent (Shift+Entrée)"
        className="px-2 py-1 text-sm rounded hover:bg-surface-2 disabled:opacity-40"
      >
        ↑
      </button>
      <button
        onClick={next}
        disabled={matchCount === 0}
        title="Suivant (Entrée)"
        className="px-2 py-1 text-sm rounded hover:bg-surface-2 disabled:opacity-40"
      >
        ↓
      </button>
      <button
        onClick={onClose}
        title="Fermer (Esc)"
        className="px-2 py-1 text-sm rounded hover:bg-surface-2"
      >
        ✕
      </button>
    </div>
  );
}

function clearHighlights(scopeSelector: string) {
  const scope = document.querySelector(scopeSelector);
  if (!scope) return;
  scope.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    parent.replaceChild(document.createTextNode(el.textContent ?? ''), el);
    parent.normalize();
  });
}

function highlightMatches(scopeSelector: string, query: string): number {
  const scope = document.querySelector(scopeSelector);
  if (!scope) return 0;
  const re = new RegExp(escapeRegExp(query), 'gi');
  let count = 0;

  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Skip empty text nodes and nodes inside our own highlight spans
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.classList.contains(HIGHLIGHT_CLASS)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (node.parentElement?.tagName === 'SCRIPT' || node.parentElement?.tagName === 'STYLE') {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodesToProcess: Text[] = [];
  let n: Node | null = walker.nextNode();
  while (n) {
    nodesToProcess.push(n as Text);
    n = walker.nextNode();
  }

  for (const textNode of nodesToProcess) {
    const text = textNode.textContent ?? '';
    re.lastIndex = 0;
    if (!re.test(text)) continue;
    re.lastIndex = 0;
    const frag = document.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      const span = document.createElement('span');
      span.className = HIGHLIGHT_CLASS;
      span.textContent = match[0];
      frag.appendChild(span);
      count += 1;
      lastIndex = match.index + match[0].length;
      if (match[0].length === 0) re.lastIndex += 1;
    }
    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    textNode.parentNode?.replaceChild(frag, textNode);
  }
  return count;
}

function setActive(scopeSelector: string, index: number) {
  const scope = document.querySelector(scopeSelector);
  if (!scope) return;
  const all = scope.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
  all.forEach((el, i) => {
    el.classList.toggle(ACTIVE_CLASS, i === index);
  });
  const target = all[index] as HTMLElement | undefined;
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
