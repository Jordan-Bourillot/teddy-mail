import { describe, it, expect } from 'vitest';
import { presetForEmail } from '../imapPresets';
describe('presetForEmail', () => {
    it('returns Free for free.fr', () => {
        expect(presetForEmail('jordan@free.fr')?.imapHost).toBe('imap.free.fr');
    });
    it('returns Fastmail with hint', () => {
        const p = presetForEmail('me@fastmail.com');
        expect(p?.smtpHost).toBe('smtp.fastmail.com');
        expect(p?.hint).toContain("d'application");
    });
    it('returns null for unknown domain', () => {
        expect(presetForEmail('me@unknown-corp.zz')).toBe(null);
    });
    it('handles missing @', () => {
        expect(presetForEmail('plain-string')).toBe(null);
    });
    it('is case insensitive on domain', () => {
        expect(presetForEmail('Foo@FREE.FR')?.imapHost).toBe('imap.free.fr');
    });
});
