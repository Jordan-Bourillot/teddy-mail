// Common IMAP/SMTP presets, matched by email domain.
// Saves the user from looking up server settings for the most common providers.
const PRESETS = {
    'free.fr': {
        name: 'Free',
        imapHost: 'imap.free.fr',
        imapPort: 993,
        smtpHost: 'smtp.free.fr',
        smtpPort: 465,
    },
    'orange.fr': {
        name: 'Orange',
        imapHost: 'imap.orange.fr',
        imapPort: 993,
        smtpHost: 'smtp.orange.fr',
        smtpPort: 465,
    },
    'sfr.fr': {
        name: 'SFR',
        imapHost: 'imap.sfr.fr',
        imapPort: 993,
        smtpHost: 'smtp.sfr.fr',
        smtpPort: 465,
    },
    'laposte.net': {
        name: 'La Poste',
        imapHost: 'imap.laposte.net',
        imapPort: 993,
        smtpHost: 'smtp.laposte.net',
        smtpPort: 465,
    },
    'proton.me': {
        name: 'Proton',
        imapHost: '127.0.0.1',
        imapPort: 1143,
        smtpHost: '127.0.0.1',
        smtpPort: 1025,
        hint: 'Proton requiert le Proton Mail Bridge installé localement.',
    },
    'protonmail.com': {
        name: 'Proton',
        imapHost: '127.0.0.1',
        imapPort: 1143,
        smtpHost: '127.0.0.1',
        smtpPort: 1025,
        hint: 'Proton requiert le Proton Mail Bridge installé localement.',
    },
    'fastmail.com': {
        name: 'Fastmail',
        imapHost: 'imap.fastmail.com',
        imapPort: 993,
        smtpHost: 'smtp.fastmail.com',
        smtpPort: 465,
        hint: "Fastmail utilise des mots de passe d'application générés depuis ton compte.",
    },
    'mailbox.org': {
        name: 'Mailbox.org',
        imapHost: 'imap.mailbox.org',
        imapPort: 993,
        smtpHost: 'smtp.mailbox.org',
        smtpPort: 465,
    },
};
export function presetForEmail(email) {
    const at = email.lastIndexOf('@');
    if (at < 0)
        return null;
    const domain = email.slice(at + 1).toLowerCase();
    return PRESETS[domain] ?? null;
}
