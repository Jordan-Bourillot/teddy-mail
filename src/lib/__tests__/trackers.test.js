import { describe, it, expect } from 'vitest';
import { isTrackerUrl, neutralizeTrackers } from '../trackers';
describe('isTrackerUrl', () => {
    it('flags Mailchimp domains', () => {
        expect(isTrackerUrl('https://something.list-manage.com/track/click?u=1')).toBe(true);
    });
    it('flags pixel paths', () => {
        expect(isTrackerUrl('https://example.com/pixel?id=123')).toBe(true);
    });
    it('does not flag normal URLs', () => {
        expect(isTrackerUrl('https://github.com/triskell/pite')).toBe(false);
    });
    it('handles malformed URLs without throwing', () => {
        expect(isTrackerUrl('not a url')).toBe(false);
    });
});
describe('neutralizeTrackers', () => {
    it('strips 1x1 pixels', () => {
        const html = '<p>hi</p><img src="x" width="1" height="1"><p>bye</p>';
        const { sanitized, blocked } = neutralizeTrackers(html);
        expect(blocked).toBe(1);
        expect(sanitized).not.toContain('<img');
    });
    it('strips images on tracker domains even at normal sizes', () => {
        const html = '<img src="https://click.tracker.example/u/abc" width="500">';
        const { blocked } = neutralizeTrackers(html);
        expect(blocked).toBe(1);
    });
    it('keeps legitimate images', () => {
        const html = '<img src="https://github.com/banner.png" width="600">';
        const { blocked, sanitized } = neutralizeTrackers(html);
        expect(blocked).toBe(0);
        expect(sanitized).toContain('<img');
    });
});
