import { useState } from 'react';
import { useStore } from '@/lib/store';
import { AddAccount } from './AddAccount';
import { Insights } from './Insights';
import { AccountsPanel } from './AccountsPanel';
import { DraftsPanel } from './DraftsPanel';
import { ScheduledPanel } from './ScheduledPanel';
import { Avatar } from './Avatar';

export function Sidebar() {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showScheduled, setShowScheduled] = useState(false);
  const draftsCount = useStore((s) => s.drafts.length);
  const scheduledCount = useStore((s) => s.scheduled.length);
  const accounts = useStore((s) => s.accounts);
  const folders = useStore((s) => s.folders);
  const savedViews = useStore((s) => s.savedViews);
  const selected = useStore((s) => s.selectedFolderId);
  const selectFolder = useStore((s) => s.selectFolder);
  const openCompose = useStore((s) => s.openCompose);
  const focusMode = useStore((s) => s.focusMode);
  const toggleFocus = useStore((s) => s.toggleFocusMode);
  const setSearch = useStore((s) => s.setSearchQuery);
  const pendingSnoozed = useStore((s) =>
    s.mails.filter((m) => m.snoozedUntil && new Date(m.snoozedUntil) > new Date()).length,
  );

  return (
    <aside className="w-60 shrink-0 bg-surface border-r border-border flex flex-col">
      <div className="p-4">
        <div className="text-base font-semibold tracking-tight">Teddy Mail</div>
        <div className="text-xs text-muted mt-0.5">calme · souverain · à toi</div>
      </div>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => openCompose()}
          className="w-full px-3 py-2 rounded bg-accent text-white text-sm font-medium hover:opacity-90 transition"
        >
          + Écrire un mail
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 text-sm">
        <SidebarItem
          label="Boîte unifiée"
          count={undefined}
          active={selected === 'unified-inbox'}
          onClick={() => {
            selectFolder('unified-inbox');
            setSearch('');
          }}
        />
        <SidebarItem
          label={focusMode ? 'Focus actif' : 'Focus'}
          count={undefined}
          active={focusMode}
          onClick={() => toggleFocus()}
          accent
        />
        <SidebarItem
          label="Snooze"
          count={pendingSnoozed || undefined}
          active={false}
          onClick={() => setSearch('is:snoozed')}
        />
        <SidebarItem
          label="Brouillons"
          count={draftsCount || undefined}
          active={false}
          onClick={() => setShowDrafts(true)}
        />
        <SidebarItem
          label="Programmés"
          count={scheduledCount || undefined}
          active={false}
          onClick={() => setShowScheduled(true)}
        />
        <SidebarItem
          label="Insights"
          count={undefined}
          active={false}
          onClick={() => setShowInsights(true)}
        />

        <SidebarSection label="Vues sauvegardées" />
        {savedViews.map((v) => (
          <SidebarItem
            key={v.id}
            label={v.name}
            count={undefined}
            active={false}
            onClick={() => setSearch(v.query)}
          />
        ))}

        {accounts.map((a) => (
          <div key={a.id} className="mt-4">
            <button
              type="button"
              onClick={() => setShowAccounts(true)}
              className="w-full flex items-center gap-2 px-2 mb-1 group hover:bg-surface-2 rounded py-1 transition"
              title="Modifier le profil et la signature"
            >
              <Avatar
                name={a.displayName}
                email={a.email}
                {...(a.photoUrl ? { photoUrl: a.photoUrl } : {})}
                size={18}
              />
              <span className="flex-1 min-w-0 text-[11px] uppercase tracking-wider text-muted truncate text-left group-hover:text-text">
                {a.email}
              </span>
              <span className="text-[11px] text-muted opacity-0 group-hover:opacity-100">⚙</span>
            </button>
            {folders
              .filter((f) => f.accountId === a.id)
              .map((f) => (
                <SidebarItem
                  key={f.id}
                  label={f.name}
                  count={f.unreadCount || undefined}
                  active={selected === f.id}
                  onClick={() => selectFolder(f.id)}
                />
              ))}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setShowAddAccount(true)}
          className="mt-6 w-full px-2 py-1.5 rounded text-left text-xs text-muted hover:bg-surface-2 hover:text-text transition"
        >
          + Ajouter un compte
        </button>
      </nav>

      {showAddAccount && <AddAccount onClose={() => setShowAddAccount(false)} />}
      {showInsights && <Insights onClose={() => setShowInsights(false)} />}
      {showAccounts && <AccountsPanel onClose={() => setShowAccounts(false)} />}
      {showDrafts && <DraftsPanel onClose={() => setShowDrafts(false)} />}
      {showScheduled && <ScheduledPanel onClose={() => setShowScheduled(false)} />}

      <div className="p-3 border-t border-border text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-success" />
          Connecté
        </div>
        <div className="mt-1">v0.1.0 · build local</div>
      </div>
    </aside>
  );
}

function SidebarItem({
  label,
  count,
  active,
  onClick,
  accent,
}: {
  label: string;
  count: number | undefined;
  active: boolean;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full flex items-center justify-between px-2 py-1.5 rounded text-left transition',
        active ? 'bg-surface-2 text-text font-medium' : 'text-muted hover:bg-surface-2 hover:text-text',
        accent ? 'text-accent' : '',
      ].join(' ')}
    >
      <span className="truncate">{label}</span>
      {count !== undefined && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-bg text-muted">{count}</span>
      )}
    </button>
  );
}

function SidebarSection({ label, swatch }: { label: string; swatch?: string }) {
  return (
    <div className="flex items-center gap-2 px-2 mt-3 mb-1 text-[11px] uppercase tracking-wider text-muted">
      {swatch && <span className="inline-block w-2 h-2 rounded-full" style={{ background: swatch }} />}
      <span className="truncate">{label}</span>
    </div>
  );
}
