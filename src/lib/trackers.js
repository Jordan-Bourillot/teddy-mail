// Tracker pixel and link detector.
// Used both at parse time (to populate trackersBlocked count) and at render
// time (to neutralize the HTML before showing it in a sandboxed iframe).
const KNOWN_TRACKER_DOMAINS = [
    'mailchimp.com',
    'list-manage.com',
    'mandrillapp.com',
    'sendgrid.net',
    'mailgun.org',
    'amazonses.com',
    'sparkpostmail.com',
    'tracking.',
    'click.',
    'open.',
    'mail.',
    'links.',
    'em.',
    'cmail',
    'mkt.',
    'ablink.',
    'pixel.',
    'beacon.',
];
const KNOWN_TRACKER_PATHS = [
    '/open',
    '/track',
    '/pixel',
    '/beacon',
    '/o/',
    '/wf/open',
];
/**
 * Returns true if the URL looks like a tracking pixel or click-through tracker.
 * False positives are acceptable here: blocking a tracker never breaks legit
 * content because we only act on transparent 1x1 images and on link rewriting.
 */
export function isTrackerUrl(url) {
    let u;
    try {
        u = new URL(url);
    }
    catch {
        return false;
    }
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    for (const domain of KNOWN_TRACKER_DOMAINS) {
        if (host.includes(domain))
            return true;
    }
    for (const p of KNOWN_TRACKER_PATHS) {
        if (path.includes(p))
            return true;
    }
    // Long random path with single-letter query keys is suspicious.
    if (/^\/[a-z0-9_-]{20,}$/i.test(path) && /[?&]([a-z]=)/i.test(u.search)) {
        return true;
    }
    return false;
}
/**
 * Detect tracker pixels in raw HTML. Returns a count plus a sanitized HTML
 * string with pixels stripped. Caller is responsible for additional sanitizing
 * with DOMPurify before injecting into a sandboxed iframe.
 */
export function neutralizeTrackers(html) {
    let blocked = 0;
    // Strip tiny images (typical tracker pixel signatures).
    const sanitized = html.replace(/<img\b[^>]*?(?:width\s*=\s*["']?1["']?|height\s*=\s*["']?1["']?|style\s*=\s*["'][^"']*?(?:width\s*:\s*1px|height\s*:\s*1px))[^>]*>/gi, () => {
        blocked += 1;
        return '<!-- tracker blocked -->';
    });
    // Strip images whose src looks like a known tracker even at normal sizes.
    const sanitized2 = sanitized.replace(/<img\b[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi, (match, src) => {
        if (typeof src === 'string' && isTrackerUrl(src)) {
            blocked += 1;
            return '<!-- tracker blocked -->';
        }
        return match;
    });
    return { sanitized: sanitized2, blocked };
}
