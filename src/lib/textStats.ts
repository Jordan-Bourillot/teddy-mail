// Tiny text statistics for the Composer footer.
// Counts characters, words, lines, estimated reading time.

export interface TextStats {
  chars: number;
  words: number;
  lines: number;
  /** Estimated reading time in seconds, based on 220 wpm. */
  readingSeconds: number;
}

export function computeTextStats(text: string): TextStats {
  const chars = text.length;
  const trimmed = text.trim();
  const words = trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  const lines = text === '' ? 0 : text.split('\n').length;
  const readingSeconds = Math.max(0, Math.round((words / 220) * 60));
  return { chars, words, lines, readingSeconds };
}

export function formatReadingTime(seconds: number): string {
  if (seconds < 5) return '< 5 s';
  if (seconds < 60) return `${seconds} s`;
  const m = Math.round(seconds / 60);
  return `${m} min`;
}
