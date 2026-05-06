// Engagement detector: highlights phrases like "I will send you the brief Friday"
// so we can offer a one-click reminder. Pure regex/heuristics in V1.

import type { Engagement } from '@/types';

const PROMISE_PATTERNS_FR = [
  // Apostrophe FR can be straight ' or curly ’; verb may glue directly (t'envoie) or have a space (te envoie).
  /(?:je|on|nous)\s+(?:t['’]?\s*|te\s+|vous\s+)?(?:envoie\w*|enverrai\w*|reviens|revient|repasse|rappelle|fais|tiens|tient|fournis|partage)[^.!?\n]{2,150}?(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain|cette\s+semaine|la\s+semaine\s+prochaine|d['’]ici|matin|midi|soir|après-midi|aprem|tout\s+à\s+l['’]heure)[^.!?\n]{0,40}/gi,
  /je\s+(?:te|vous)\s+(?:tiens|tient)\s+au\s+courant[^.!?\n]{0,40}/gi,
];

const PROMISE_PATTERNS_EN = [
  /i\s+(?:will|'ll)\s+(?:send|share|email|get back|reach out|follow up)[^.!?\n]{2,80}(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|this week|next week|by)[^.!?\n]{0,40}/gi,
  /(?:we|i)\s+(?:will|'ll)\s+(?:come back|circle back|update you)[^.!?\n]{0,80}/gi,
];

const ALL_PATTERNS = [...PROMISE_PATTERNS_FR, ...PROMISE_PATTERNS_EN];

export function detectEngagements(text: string): Engagement[] {
  const out: Engagement[] = [];
  for (const re of ALL_PATTERNS) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const surface = match[0].trim();
      if (surface.length < 8) continue;
      out.push({ text: surface, reminded: false });
      // Avoid runaway loops on zero-width matches.
      if (match.index === re.lastIndex) re.lastIndex += 1;
    }
  }
  // Deduplicate by lowercase text.
  const seen = new Set<string>();
  return out.filter((e) => {
    const k = e.text.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
