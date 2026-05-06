// Snooze presets and resolution.
// All times are computed in the local timezone.
function setHours(d, h, m = 0) {
    const out = new Date(d);
    out.setHours(h, m, 0, 0);
    return out;
}
function nextWeekday(from, weekday) {
    const out = new Date(from);
    const diff = (weekday + 7 - out.getDay()) % 7 || 7;
    out.setDate(out.getDate() + diff);
    return setHours(out, 8);
}
export const snoozePresets = [
    {
        preset: 'tonight',
        label: 'Ce soir 18h',
        resolveAt: () => setHours(new Date(), 18),
    },
    {
        preset: 'tomorrow',
        label: 'Demain matin 8h',
        resolveAt: () => {
            const t = new Date();
            t.setDate(t.getDate() + 1);
            return setHours(t, 8);
        },
    },
    {
        preset: 'weekend',
        label: 'Ce week-end (samedi 9h)',
        resolveAt: () => nextWeekday(new Date(), 6),
    },
    {
        preset: 'next-monday',
        label: 'Lundi prochain 8h',
        resolveAt: () => nextWeekday(new Date(), 1),
    },
    {
        preset: 'next-week',
        label: 'Dans une semaine',
        resolveAt: () => {
            const t = new Date();
            t.setDate(t.getDate() + 7);
            return setHours(t, 8);
        },
    },
    {
        preset: 'someday',
        label: 'Un jour (dans 1 mois)',
        resolveAt: () => {
            const t = new Date();
            t.setMonth(t.getMonth() + 1);
            return setHours(t, 8);
        },
    },
];
export function isSnoozeReady(snoozedUntilIso, now = new Date()) {
    if (!snoozedUntilIso)
        return false;
    return new Date(snoozedUntilIso).getTime() <= now.getTime();
}
