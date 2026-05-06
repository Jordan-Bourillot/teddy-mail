// Mail search with a small DSL plus fuzzy fallback.
// Examples:
//   "from:anna meeting"
//   "has:attachment subject:devis"
//   "is:unread label:clients"
//   "before:2026-04-01 after:2026-01-01 trackers"
import Fuse from 'fuse.js';
const TOKEN_RE = /(\w+):("[^"]+"|\S+)/g;
export function parseQuery(input) {
    const filters = {};
    let rest = input;
    rest = rest.replace(TOKEN_RE, (_, keyRaw, valRaw) => {
        const key = keyRaw.toLowerCase();
        const val = valRaw.replace(/^"|"$/g, '').toLowerCase();
        switch (key) {
            case 'from':
                filters.from = val;
                break;
            case 'to':
                filters.to = val;
                break;
            case 'subject':
                filters.subject = val;
                break;
            case 'label':
                filters.label = val;
                break;
            case 'has':
                filters.has = val;
                break;
            case 'is':
                filters.is = val;
                break;
            case 'before': {
                const d = new Date(val);
                if (!Number.isNaN(d.getTime()))
                    filters.before = d;
                break;
            }
            case 'after': {
                const d = new Date(val);
                if (!Number.isNaN(d.getTime()))
                    filters.after = d;
                break;
            }
            default:
                return _;
        }
        return '';
    });
    const free = rest
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean);
    return { free, filters };
}
function applyFilters(mails, q) {
    return mails.filter((m) => {
        const f = q.filters;
        if (f.from && !`${m.from.name ?? ''} ${m.from.email}`.toLowerCase().includes(f.from))
            return false;
        if (f.to && !m.to.some((t) => `${t.name ?? ''} ${t.email}`.toLowerCase().includes(f.to)))
            return false;
        if (f.subject && !m.subject.toLowerCase().includes(f.subject))
            return false;
        if (f.label && !m.labels.some((l) => l.toLowerCase().includes(f.label)))
            return false;
        if (f.has === 'attachment' && m.attachments.length === 0)
            return false;
        if (f.has === 'trackers' && m.trackersBlocked === 0)
            return false;
        if (f.has === 'engagement' && (!m.engagements || m.engagements.length === 0))
            return false;
        if (f.is === 'unread' && m.read)
            return false;
        if (f.is === 'read' && !m.read)
            return false;
        if (f.is === 'starred' && !m.starred)
            return false;
        if (f.is === 'snoozed' && !m.snoozedUntil)
            return false;
        if (f.before && new Date(m.receivedAt) > f.before)
            return false;
        if (f.after && new Date(m.receivedAt) < f.after)
            return false;
        return true;
    });
}
/**
 * Run a query against the mail set. Returns mails sorted by relevance + recency.
 */
export function searchMails(mails, rawQuery) {
    const q = parseQuery(rawQuery);
    const filtered = applyFilters(mails, q);
    if (q.free.length === 0) {
        return [...filtered].sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt));
    }
    const fuse = new Fuse(filtered, {
        keys: [
            { name: 'subject', weight: 0.4 },
            { name: 'bodyText', weight: 0.3 },
            { name: 'from.name', weight: 0.15 },
            { name: 'from.email', weight: 0.15 },
        ],
        includeScore: true,
        threshold: 0.4,
        ignoreLocation: true,
    });
    const fuzzy = fuse.search(q.free.join(' '));
    return fuzzy.map((r) => r.item);
}
