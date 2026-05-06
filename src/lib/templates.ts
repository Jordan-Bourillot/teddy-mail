// Template (canned response) helpers: storage, ranking, variable expansion.
//
// Variables supported in template bodies:
//   {{first_name}}    first name of the recipient (best-effort from "to[0].name")
//   {{my_name}}       display name of the active account
//   {{my_email}}      email of the active account
//   {{date}}          today, locale-formatted
//   {{time}}          current time, HH:MM

import type { Template } from '@/types';

const STORAGE_KEY = 'teddy-mail-templates-v1';

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'tpl_dispo',
    name: 'Disponibilités',
    shortcut: 'dispo',
    body:
      "Bonjour {{first_name}},\n\nVoici mes disponibilités cette semaine :\n- mardi 10h-12h\n- mercredi 14h-17h\n- jeudi 9h-11h\n\nDis-moi ce qui t'arrange.\n\n{{my_name}}",
  },
  {
    id: 'tpl_remerciement',
    name: 'Remerciement bref',
    shortcut: 'merci',
    body: "Bonjour {{first_name}},\n\nMerci pour ton message, je reviens vers toi rapidement.\n\n{{my_name}}",
  },
  {
    id: 'tpl_followup',
    name: 'Relance polie',
    shortcut: 'relance',
    body:
      "Bonjour {{first_name}},\n\nJe reviens vers toi concernant mon précédent message. As-tu eu l'occasion d'y jeter un œil ?\n\nBonne {{date}},\n\n{{my_name}}",
  },
];

export function loadTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TEMPLATES;
    const parsed = JSON.parse(raw) as Template[];
    return Array.isArray(parsed) ? parsed : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveTemplates(templates: Template[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    /* ignore */
  }
}

/**
 * Rank templates for picker display: most recently used first, then alpha.
 */
export function rankTemplates(templates: Template[], query: string): Template[] {
  const q = query.trim().toLowerCase();
  const filtered = !q
    ? templates
    : templates.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.shortcut?.toLowerCase().includes(q) ?? false) ||
          t.body.toLowerCase().includes(q),
      );
  return [...filtered].sort((a, b) => {
    const ax = a.lastUsedAt ? +new Date(a.lastUsedAt) : 0;
    const bx = b.lastUsedAt ? +new Date(b.lastUsedAt) : 0;
    if (ax !== bx) return bx - ax;
    return a.name.localeCompare(b.name);
  });
}

export interface ExpandContext {
  recipientName?: string | undefined;
  recipientEmail?: string | undefined;
  myName?: string | undefined;
  myEmail?: string | undefined;
  now?: Date;
}

export function expandTemplate(body: string, ctx: ExpandContext): string {
  const now = ctx.now ?? new Date();
  const firstName = (() => {
    if (ctx.recipientName) return ctx.recipientName.split(/\s+/)[0] ?? '';
    if (ctx.recipientEmail) return ctx.recipientEmail.split('@')[0] ?? '';
    return '';
  })();
  const replacements: Record<string, string> = {
    '{{first_name}}': firstName,
    '{{my_name}}': ctx.myName ?? '',
    '{{my_email}}': ctx.myEmail ?? '',
    '{{date}}': now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
    '{{time}}': `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  };
  let out = body;
  for (const [k, v] of Object.entries(replacements)) {
    out = out.split(k).join(v);
  }
  return out;
}

export function newTemplate(): Template {
  return {
    id: `tpl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: 'Nouveau modèle',
    body: '',
  };
}
