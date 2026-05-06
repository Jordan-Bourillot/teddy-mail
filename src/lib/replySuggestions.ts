// Quick reply suggestions: 3 contextual chips shown below the inline reply
// box. Pure heuristics: scan the mail body for question marks, intent keywords,
// time references, and pick the most natural responses.
//
// Goal: cover ~80% of "I read it, here's a 1-line answer" cases without
// actually predicting LLM-style. Deterministic, transparent, no API call.

import type { Mail } from '@/types';

export interface ReplySuggestion {
  /** Chip label (short, fits in ~20 chars). */
  label: string;
  /** Body inserted on click. */
  body: string;
}

const GENERIC: ReplySuggestion[] = [
  { label: 'Merci !', body: 'Merci !' },
  { label: 'Bien noté', body: 'Bien noté, merci !' },
  { label: 'Je reviens vers toi', body: 'Je reviens vers toi rapidement.' },
];

const QUESTION: ReplySuggestion[] = [
  { label: 'Oui ✓', body: 'Oui, ça marche pour moi.' },
  { label: 'Pas dispo', body: 'Pas dispo cette semaine, on peut décaler ?' },
  { label: 'Je regarde', body: 'Je regarde ça aujourd\'hui et je reviens vers toi.' },
];

const MEETING: ReplySuggestion[] = [
  { label: 'Confirmé', body: 'Confirmé, à mardi.' },
  { label: 'Décaler ?', body: 'Petit imprévu, peut-on décaler d\'une heure ?' },
  { label: 'Lien Meet ?', body: 'Tu peux m\'envoyer le lien de la réunion ?' },
];

const REQUEST: ReplySuggestion[] = [
  { label: 'C\'est parti', body: 'C\'est parti, je m\'en occupe.' },
  { label: 'Plus tard', body: 'Pas dispo cette semaine, plutôt la semaine prochaine ?' },
  { label: 'Détails ?', body: 'Tu peux me donner un peu plus de détails ?' },
];

const THANKS: ReplySuggestion[] = [
  { label: 'Avec plaisir', body: 'Avec plaisir 🙂' },
  { label: 'De rien', body: 'De rien, à très vite.' },
  { label: 'Merci à toi', body: 'Merci à toi pour le retour !' },
];

export function suggestReplies(mail: Mail): ReplySuggestion[] {
  const body = mail.bodyText.toLowerCase();
  const subject = mail.subject.toLowerCase();
  const has = (s: string) => body.includes(s) || subject.includes(s);

  // Order matters: most specific signal wins.
  if (has('rendez-vous') || has('rdv') || has('réunion') || has('meeting') || has('appel')) {
    return MEETING;
  }
  if (has('merci') || has('bravo') || has('félicitations')) {
    return THANKS;
  }
  if (has('peux-tu') || has('pourrais-tu') || has('could you') || has('would you')) {
    return REQUEST;
  }
  if (body.includes('?') || subject.includes('?')) {
    return QUESTION;
  }
  return GENERIC;
}
