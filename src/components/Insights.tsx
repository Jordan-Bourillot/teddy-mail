import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { computeInsights } from '@/lib/insights';

interface InsightsProps {
  onClose: () => void;
}

export function Insights({ onClose }: InsightsProps) {
  const mails = useStore((s) => s.mails);
  const data = useMemo(() => computeInsights(mails), [mails]);

  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Insights"
    >
      <div
        className="w-[720px] max-w-[calc(100vw-2rem)] max-h-[85vh] overflow-y-auto bg-surface border border-border rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
          <div>
            <h2 className="text-base font-semibold">Insights</h2>
            <p className="text-xs text-muted">stats locales · rien n'est envoyé</p>
          </div>
          <button onClick={onClose} className="px-2 py-1 text-sm rounded hover:bg-surface-2">
            ✕
          </button>
        </header>

        <div className="p-5 space-y-6">
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              label="Cette semaine"
              value={data.mailsThisWeek}
              hint={
                data.trendPct === 0
                  ? 'aucun changement'
                  : data.trendPct > 0
                    ? `+${data.trendPct}% vs semaine -1`
                    : `${data.trendPct}% vs semaine -1`
              }
              trend={data.trendPct}
            />
            <Stat
              label="Traceurs neutralisés"
              value={data.totalTrackersBlocked}
              hint={`${data.trackersThisWeek} cette semaine`}
              positive
            />
            <Stat
              label="Temps gagné"
              value={`${data.timeSavedMinutes} min`}
              hint="estimation cumulée"
              positive
            />
            <Stat
              label="Non lus"
              value={data.unread}
              hint={
                data.unread === 0
                  ? "boîte au calme"
                  : `${data.starred} étoilés · ${data.snoozed} reportés`
              }
            />
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-wider text-muted mb-2">Répartition par catégorie</h3>
            <CategoryBars byCategory={data.byCategory} total={Object.values(data.byCategory).reduce((s, v) => s + v, 0)} />
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-wider text-muted mb-2">Top expéditeurs</h3>
            {data.topSenders.length === 0 ? (
              <div className="text-sm text-muted">Pas assez de données.</div>
            ) : (
              <ul className="space-y-1.5">
                {data.topSenders.map((s) => (
                  <li
                    key={s.email}
                    className="flex items-center justify-between px-3 py-2 rounded bg-surface-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-xs text-muted truncate">{s.email}</div>
                    </div>
                    <span className="text-sm font-mono text-muted shrink-0 ml-3">{s.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="text-xs text-muted leading-relaxed border-t border-border pt-4">
            <strong>Méthode</strong> · Temps gagné = 3s par traceur neutralisé + 5s par mail lu (évitement
            de scroll). Aucune donnée ne quitte ton appareil.
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  trend,
  positive,
}: {
  label: string;
  value: number | string;
  hint?: string;
  trend?: number;
  positive?: boolean;
}) {
  const trendColor =
    trend === undefined
      ? 'text-muted'
      : trend > 0
        ? positive
          ? 'text-success'
          : 'text-warning'
        : trend < 0
          ? positive
            ? 'text-warning'
            : 'text-success'
          : 'text-muted';
  return (
    <div className="p-3 rounded border border-border bg-surface-2">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className={['text-2xl font-semibold mt-0.5', positive ? 'text-success' : 'text-text'].join(' ')}>
        {value}
      </div>
      {hint && <div className={['text-xs mt-0.5', trendColor].join(' ')}>{hint}</div>}
    </div>
  );
}

function CategoryBars({ byCategory, total }: { byCategory: Record<string, number>; total: number }) {
  if (total === 0) return <div className="text-sm text-muted">Boîte vide.</div>;
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const colorFor: Record<string, string> = {
    work: '#0ea5e9',
    personal: '#22c55e',
    notifications: '#f59e0b',
    newsletters: '#a855f7',
    promotions: '#ec4899',
    unsorted: '#94a3b8',
  };
  return (
    <div>
      <div className="flex h-2 rounded overflow-hidden bg-surface-2 border border-border">
        {entries.map(([cat, count]) => (
          <div
            key={cat}
            className="h-full"
            style={{
              width: `${(count / total) * 100}%`,
              background: colorFor[cat] ?? '#94a3b8',
            }}
            title={`${cat}: ${count}`}
          />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-1.5 text-xs">
        {entries.map(([cat, count]) => (
          <li key={cat} className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: colorFor[cat] ?? '#94a3b8' }}
            />
            <span className="capitalize">{cat}</span>
            <span className="text-muted ml-auto">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
