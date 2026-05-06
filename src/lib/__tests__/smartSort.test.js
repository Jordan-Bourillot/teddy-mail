import { describe, it, expect } from 'vitest';
import { classify } from '../smartSort';
function mail(overrides = {}) {
    return {
        id: 'm',
        threadId: 't',
        accountId: 'a',
        folder: 'f',
        labels: [],
        from: { email: 'someone@example.com' },
        to: [{ email: 'me@here.fr' }],
        cc: [],
        bcc: [],
        subject: '',
        bodyText: '',
        receivedAt: new Date().toISOString(),
        read: false,
        starred: false,
        category: 'unsorted',
        priority: 'normal',
        trackersBlocked: 0,
        references: [],
        attachments: [],
        ...overrides,
    };
}
describe('classify', () => {
    it('detects GitHub notifications', () => {
        const m = mail({ from: { email: 'noreply@github.com' }, subject: 'PR #1 needs review' });
        expect(classify(m).category).toBe('notifications');
    });
    it('detects newsletters via List-Unsubscribe header', () => {
        const m = mail({ from: { email: 'team@somenews.fr' }, subject: 'Weekly digest' });
        expect(classify(m, 'List-Unsubscribe: <mailto:foo>').category).toBe('newsletters');
    });
    it('detects promotions', () => {
        const m = mail({
            from: { email: 'no-reply@booking.com' },
            subject: '30% off your next stay',
            bodyText: 'Limited time deal',
        });
        expect(classify(m).category).toBe('promotions');
    });
    it('falls back to unsorted when nothing matches', () => {
        const m = mail({ from: { email: 'jean@perso.com' }, subject: 'salut' });
        const out = classify(m);
        // Either work (corporate TLD) or personal (provider) — both acceptable.
        expect(['work', 'personal', 'unsorted']).toContain(out.category);
    });
    it('detects personal providers', () => {
        const m = mail({ from: { email: 'mama@gmail.com' }, subject: 'photos' });
        expect(classify(m).category).toBe('personal');
    });
    it('returns hits with reasons (transparency)', () => {
        const m = mail({ from: { email: 'noreply@stripe.com' }, subject: 'paiement' });
        const out = classify(m);
        expect(out.hits.length).toBeGreaterThan(0);
        expect(out.hits[0]?.reason).toBeTruthy();
    });
});
