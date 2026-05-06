import { describe, it, expect } from 'vitest';
import { parseQuery, searchMails } from '../search';
const baseMail = {
    id: 'm0',
    threadId: 't0',
    accountId: 'a',
    folder: 'f',
    labels: [],
    from: { email: 'x@y.fr' },
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    bodyText: '',
    receivedAt: new Date().toISOString(),
    read: true,
    starred: false,
    category: 'unsorted',
    priority: 'normal',
    trackersBlocked: 0,
    references: [],
    attachments: [],
};
describe('parseQuery', () => {
    it('splits filters and free terms', () => {
        const q = parseQuery('from:anna meeting friday');
        expect(q.filters.from).toBe('anna');
        expect(q.free).toEqual(['meeting', 'friday']);
    });
    it('parses dates', () => {
        const q = parseQuery('after:2026-01-01');
        expect(q.filters.after?.getFullYear()).toBe(2026);
    });
    it('handles quoted values', () => {
        const q = parseQuery('subject:"hello world" foo');
        expect(q.filters.subject).toBe('hello world');
        expect(q.free).toEqual(['foo']);
    });
});
describe('searchMails', () => {
    const mails = [
        { ...baseMail, id: '1', subject: 'Reunion mardi', from: { name: 'Anna', email: 'anna@x.fr' }, read: false },
        { ...baseMail, id: '2', subject: 'Devis projet Lune', bodyText: 'Pricing details', attachments: [{ id: 'a', filename: 'd.pdf', mimeType: 'application/pdf', sizeBytes: 1, contentHash: 'h' }] },
        { ...baseMail, id: '3', subject: 'Newsletter', trackersBlocked: 4 },
    ];
    it('filters by from', () => {
        const r = searchMails(mails, 'from:anna');
        expect(r.map((m) => m.id)).toEqual(['1']);
    });
    it('filters by has:attachment', () => {
        const r = searchMails(mails, 'has:attachment');
        expect(r.map((m) => m.id)).toEqual(['2']);
    });
    it('filters by has:trackers', () => {
        const r = searchMails(mails, 'has:trackers');
        expect(r.map((m) => m.id)).toEqual(['3']);
    });
    it('filters by is:unread', () => {
        const r = searchMails(mails, 'is:unread');
        expect(r.map((m) => m.id)).toEqual(['1']);
    });
    it('does fuzzy search on free text', () => {
        const r = searchMails(mails, 'devis');
        expect(r.map((m) => m.id)).toContain('2');
    });
});
