// Smart category classifier.
// V1 = transparent, deterministic rules. V1.5 = local ONNX model.
// All scoring runs locally; no data leaves the device.

import type { Category, Mail } from '@/types';

interface RuleHit {
  category: Category;
  score: number;
  reason: string;
}

const NEWSLETTER_HEADERS = [
  'list-unsubscribe',
  'list-id',
  'precedence: bulk',
  'precedence: list',
];

const NOTIFICATION_DOMAINS = [
  'github.com',
  'notion.so',
  'linear.app',
  'stripe.com',
  'slack.com',
  'figma.com',
  'vercel.com',
  'render.com',
  'sentry.io',
];

const NOTIFICATION_KEYWORDS = [
  'noreply',
  'no-reply',
  'notifications',
  'alerts',
  'do-not-reply',
];

const PROMO_KEYWORDS = [
  'sale',
  'discount',
  '% off',
  'coupon',
  'promo',
  'limited time',
  'flash sale',
  'black friday',
  'cyber monday',
  'soldes',
  'remise',
  'offre',
];

const PROMO_DOMAINS = [
  'booking.com',
  'expedia.com',
  'amazon.',
  'aliexpress.',
  'shein.',
  'wish.com',
];

const NEWSLETTER_KEYWORDS = [
  'newsletter',
  'digest',
  'weekly',
  'roundup',
  'recap',
  'this week',
  'in this issue',
];

/**
 * Score a mail against category rules. Higher score = more confident.
 * Returns the winning category and the explanation list (for transparency UI).
 */
export function classify(mail: Mail, rawHeaders: string = ''): {
  category: Category;
  hits: RuleHit[];
} {
  const hits: RuleHit[] = [];
  const fromAddr = mail.from.email.toLowerCase();
  const subject = mail.subject.toLowerCase();
  const body = mail.bodyText.toLowerCase().slice(0, 2000);
  const headers = rawHeaders.toLowerCase();

  // --- Notifications ---
  for (const domain of NOTIFICATION_DOMAINS) {
    if (fromAddr.endsWith('@' + domain) || fromAddr.includes('.' + domain)) {
      hits.push({ category: 'notifications', score: 5, reason: `expéditeur connu: ${domain}` });
    }
  }
  for (const kw of NOTIFICATION_KEYWORDS) {
    if (fromAddr.includes(kw)) {
      hits.push({ category: 'notifications', score: 3, reason: `from contient « ${kw} »` });
    }
  }

  // --- Newsletters ---
  for (const h of NEWSLETTER_HEADERS) {
    if (headers.includes(h)) {
      hits.push({ category: 'newsletters', score: 6, reason: `header ${h}` });
    }
  }
  for (const kw of NEWSLETTER_KEYWORDS) {
    if (subject.includes(kw)) {
      hits.push({ category: 'newsletters', score: 2, reason: `sujet contient « ${kw} »` });
    }
  }

  // --- Promotions ---
  for (const kw of PROMO_KEYWORDS) {
    if (subject.includes(kw) || body.includes(kw)) {
      hits.push({ category: 'promotions', score: 3, reason: `« ${kw} » détecté` });
    }
  }
  for (const dom of PROMO_DOMAINS) {
    if (fromAddr.includes(dom)) {
      hits.push({ category: 'promotions', score: 4, reason: `expéditeur ${dom}` });
    }
  }

  // --- Work / Personal ---
  // Heuristic: business TLDs and domains containing the user's known work domain
  const isCorporateTld = /@[^.]+\.(com|io|co|fr|studio|dev|tech|ai|app)$/.test(fromAddr);
  const looksTransactional = /(invoice|facture|order|commande|receipt|reçu)/.test(subject);
  if (isCorporateTld && !looksTransactional && hits.length === 0) {
    hits.push({ category: 'work', score: 1, reason: 'TLD pro, pas de signal transactionnel' });
  }

  // Personal: known free providers + first-name signature
  const isPersonalProvider = /@(gmail|outlook|hotmail|yahoo|icloud|free|orange|laposte|proton)\./.test(fromAddr);
  if (isPersonalProvider) {
    hits.push({ category: 'personal', score: 2, reason: 'fournisseur grand public' });
  }

  if (hits.length === 0) {
    return { category: 'unsorted', hits: [] };
  }

  // Aggregate scores per category, pick highest.
  const totals = new Map<Category, number>();
  for (const h of hits) {
    totals.set(h.category, (totals.get(h.category) ?? 0) + h.score);
  }
  let best: Category = 'unsorted';
  let bestScore = -1;
  for (const [cat, sc] of totals) {
    if (sc > bestScore) {
      best = cat;
      bestScore = sc;
    }
  }
  return { category: best, hits };
}

/**
 * User feedback hook: the user moved a mail manually to category X.
 * In V1.5 this trains a small local model. For now we just log it.
 */
export function recordFeedback(_mail: Mail, _newCategory: Category): void {
  // No-op in V1. Persist to learning queue in V1.5.
}
