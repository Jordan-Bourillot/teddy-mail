// Theme application. Switching is instant: we set data-theme on <html>
// and the CSS variables in index.css take care of the cascade.
export const themeOptions = [
    { value: 'light', label: 'Clair', hint: 'lecture longue, journée' },
    { value: 'dark', label: 'Sombre', hint: 'soirée, peu de lumière' },
    { value: 'sepia', label: 'Sépia', hint: 'lecture confortable' },
    { value: 'solarized', label: 'Solarized', hint: 'palette équilibrée' },
    { value: 'contrast', label: 'Contraste élevé', hint: 'accessibilité' },
    { value: 'nocturne', label: 'Nocturne', hint: 'mode profond OLED' },
];
export const densityOptions = [
    { value: 'compact', label: 'Compact' },
    { value: 'cozy', label: 'Confortable' },
    { value: 'spacious', label: 'Spacieux' },
];
export function applyTheme(theme, density, fontSize) {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-density', density);
    root.style.fontSize = `${fontSize}px`;
}
/**
 * Generate a deterministic color for an avatar from an email address.
 * Uses HSL so the result lands on a palette that always has decent contrast.
 */
export function avatarColor(email) {
    let h = 0;
    for (let i = 0; i < email.length; i += 1) {
        h = (h * 31 + email.charCodeAt(i)) >>> 0;
    }
    const hue = h % 360;
    return `hsl(${hue} 55% 50%)`;
}
export function initials(name, email) {
    const source = (name ?? email).trim();
    if (!source)
        return '·';
    const parts = source.split(/\s+/);
    if (parts.length === 1) {
        const first = parts[0] ?? '';
        return (first.slice(0, 2) || '·').toUpperCase();
    }
    const first = parts[0]?.[0] ?? '';
    const last = parts[parts.length - 1]?.[0] ?? '';
    return (first + last).toUpperCase();
}
