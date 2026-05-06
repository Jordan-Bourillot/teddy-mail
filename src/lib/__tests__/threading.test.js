import { describe, it, expect } from 'vitest';
import { buildThreads } from '../threading';
function m(id, subject, when, inReplyTo) {
    return {
        id,
        threadId: id,
        accountId: 'a',
        folder: 'f',
        labels: [],
        from: { email: 'x@y' },
        to: [],
        cc: [],
        bcc: [],
        subject,
        bodyText: '',
        receivedAt: new Date(when).toISOString(),
        read: false,
        starred: false,
        category: 'unsorted',
        priority: 'normal',
        trackersBlocked: 0,
        references: [],
        attachments: [],
        ...(inReplyTo ? { inReplyTo } : {}),
    };
}
describe('buildThreads', () => {
    it('groups by In-Reply-To', () => {
        const mails = [
            m('1', 'Hello', 1000),
            m('2', 'Re: Hello', 2000, '1'),
            m('3', 'Re: Hello', 3000, '2'),
        ];
        const threads = buildThreads(mails);
        expect(threads).toHaveLength(1);
        expect(threads[0]?.mailIds).toHaveLength(3);
    });
    it('falls back to subject grouping', () => {
        const mails = [
            m('1', 'Devis projet', 1000),
            m('2', 'Re: Devis projet', 2000),
        ];
        const threads = buildThreads(mails);
        expect(threads).toHaveLength(1);
        expect(threads[0]?.mailIds).toHaveLength(2);
    });
    it('keeps unrelated mails in separate threads', () => {
        const mails = [m('1', 'A', 1000), m('2', 'B', 2000)];
        const threads = buildThreads(mails);
        expect(threads).toHaveLength(2);
    });
});
