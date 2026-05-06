// JWZ-inspired email threading.
// Builds a tree from In-Reply-To and References headers, falls back to
// normalized-subject grouping when headers are missing.
const subjectStripRe = /^(\s*(re|fwd?|tr|aw)\s*[:\[\(].*?[:\]\)]?\s*)+/gi;
function normalizeSubject(s) {
    return s.replace(subjectStripRe, '').trim().toLowerCase();
}
/**
 * Group mails into threads. Pure function: same input -> same output.
 */
export function buildThreads(mails) {
    const byMessageId = new Map();
    const orphans = [];
    // Seed nodes
    for (const m of mails) {
        byMessageId.set(m.id, { mail: m, parent: null, children: [] });
    }
    // Link by In-Reply-To / References
    for (const node of byMessageId.values()) {
        const parentId = node.mail.inReplyTo ?? node.mail.references[node.mail.references.length - 1];
        if (parentId) {
            const parent = byMessageId.get(parentId);
            if (parent) {
                parent.children.push(node);
                node.parent = parent;
                continue;
            }
        }
        orphans.push(node);
    }
    // Subject-based fallback for orphans sharing a normalized subject within 7 days.
    const bySubject = new Map();
    for (const o of orphans) {
        const key = `${o.mail.accountId}::${normalizeSubject(o.mail.subject)}`;
        if (!key.endsWith('::')) {
            const arr = bySubject.get(key) ?? [];
            arr.push(o);
            bySubject.set(key, arr);
        }
    }
    // Roots: orphans grouped by subject if any group exists, else each orphan its own root.
    const roots = [];
    const claimed = new Set();
    for (const group of bySubject.values()) {
        if (group.length > 1) {
            group.sort((a, b) => +new Date(a.mail.receivedAt) - +new Date(b.mail.receivedAt));
            roots.push(group);
            for (const n of group)
                claimed.add(n);
        }
    }
    for (const o of orphans) {
        if (!claimed.has(o))
            roots.push([o]);
    }
    return roots.map((group) => buildThreadFromGroup(group));
}
function buildThreadFromGroup(nodes) {
    // Walk the tree to collect all mails; for orphan groups, just the list as-is.
    const allMails = [];
    const visit = (n) => {
        allMails.push(n.mail);
        for (const c of n.children)
            visit(c);
    };
    for (const n of nodes)
        visit(n);
    allMails.sort((a, b) => +new Date(a.receivedAt) - +new Date(b.receivedAt));
    const first = allMails[0];
    if (!first)
        throw new Error('threading: empty group');
    const last = allMails[allMails.length - 1];
    if (!last)
        throw new Error('threading: empty group');
    const id = first.threadId || `thread_${first.id}`;
    const participantsMap = new Map();
    for (const m of allMails) {
        participantsMap.set(m.from.email, m.from);
        for (const t of m.to)
            participantsMap.set(t.email, t);
    }
    return {
        id,
        accountId: first.accountId,
        subject: normalizeSubject(first.subject) || '(sans objet)',
        participants: Array.from(participantsMap.values()),
        mailIds: allMails.map((m) => m.id),
        lastReceivedAt: last.receivedAt,
        hasUnread: allMails.some((m) => !m.read),
        category: last.category,
    };
}
