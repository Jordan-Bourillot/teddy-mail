// Global app state via Zustand. Holds in-memory copy of mails, drafts,
// preferences, UI state. Mutations always go through this store so the
// component tree never owns persistent state.

import { create } from 'zustand';
import type {
  Account,
  AccountId,
  Category,
  Draft,
  Folder,
  FolderId,
  Label,
  Mail,
  MailId,
  PendingSend,
  SavedView,
  Thread,
  ThreadId,
  UserPreferences,
} from '@/types';
import { mockAccounts, mockFolders, mockLabels, mockMails } from './mockData';
import { buildThreads } from './threading';
import { searchMails } from './search';
import { applyTheme } from './themes';
import { playSound } from './sounds';
import { scheduleSend, cancel as cancelSend, listPending } from './undoSend';

const defaultPrefs: UserPreferences = {
  theme: 'light',
  density: 'cozy',
  fontSize: 14,
  unifiedInbox: true,
  blockTrackers: true,
  blockRemoteImages: 'trusted',
  undoSendSeconds: 10,
  swipeLeft: 'archive',
  swipeRight: 'snooze',
  notificationsEnabled: true,
  keyboardProfile: 'teddy',
  reducedMotion: 'auto',
  soundPack: 'off',
};

const defaultViews: SavedView[] = [
  { id: 'v_clients', name: 'Clients', query: 'label:clients' },
  { id: 'v_facturer', name: 'À facturer', query: 'label:facturer' },
  { id: 'v_unread', name: 'Non lus', query: 'is:unread' },
];

const PREFS_KEY = 'teddy-mail-prefs-v1';
const ACCOUNTS_KEY = 'teddy-mail-accounts-v1';

function loadPrefs(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...(JSON.parse(raw) as Partial<UserPreferences>) };
  } catch {
    return defaultPrefs;
  }
}

function savePrefs(p: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    // ignore quota errors, prefs revert to defaults next session
  }
}

function loadAccountOverrides(): Record<string, Partial<Account>> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Partial<Account>>;
  } catch {
    return {};
  }
}

function saveAccountOverrides(map: Record<string, Partial<Account>>): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(map));
  } catch {
    // Quota exceeded (large photo) — degrade silently.
  }
}

function applyOverrides(base: Account[]): Account[] {
  const overrides = loadAccountOverrides();
  return base.map((a) => ({ ...a, ...(overrides[a.id] ?? {}) }));
}

export interface AppState {
  // Data
  accounts: Account[];
  folders: Folder[];
  labels: Label[];
  mails: Mail[];
  threads: Thread[];
  drafts: Draft[];
  pendingSends: PendingSend[];

  // UI
  selectedFolderId: FolderId | 'unified-inbox';
  selectedThreadId: ThreadId | null;
  selectedThreadIds: Set<ThreadId>; // multi-select for bulk actions
  composeOpen: boolean;
  composeDraft: Draft | null;
  commandPaletteOpen: boolean;
  searchQuery: string;
  focusMode: boolean;
  cheatSheetOpen: boolean;
  toast: { id: string; message: string; action?: { label: string; run: () => void }; expiresAt: number } | null;

  // Settings
  prefs: UserPreferences;
  savedViews: SavedView[];

  // Actions: data
  addAccount: (account: Account) => void;
  updateAccount: (id: AccountId, patch: Partial<Account>) => void;
  selectFolder: (id: FolderId | 'unified-inbox') => void;
  selectThread: (id: ThreadId | null) => void;
  toggleThreadCheck: (id: ThreadId) => void;
  selectAllVisible: () => void;
  clearSelection: () => void;
  bulkArchive: () => void;
  bulkTrash: () => void;
  bulkSnooze: (untilIso: string) => void;
  bulkMarkRead: (read: boolean) => void;
  saveCurrentSearch: (name: string) => void;
  openCheatSheet: () => void;
  closeCheatSheet: () => void;
  archive: (mailIds: MailId[]) => void;
  trash: (mailIds: MailId[]) => void;
  toggleStar: (mailId: MailId) => void;
  markRead: (mailIds: MailId[], read: boolean) => void;
  moveCategory: (mailId: MailId, category: Category) => void;
  snooze: (mailIds: MailId[], untilIso: string) => void;
  unsnooze: (mailIds: MailId[]) => void;

  // Actions: compose
  openCompose: (replyTo?: Mail) => void;
  closeCompose: () => void;
  updateDraft: (patch: Partial<Draft>) => void;
  sendDraft: () => void;
  undoSend: () => void;

  // Actions: search and palette
  setSearchQuery: (q: string) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  // Actions: prefs
  updatePrefs: (patch: Partial<UserPreferences>) => void;
  toggleFocusMode: () => void;

  // Toast
  showToast: (message: string, action?: { label: string; run: () => void }, durationMs?: number) => void;
  dismissToast: () => void;

  // Selectors
  visibleMails: () => Mail[];
  visibleThreads: () => Thread[];
  threadMails: (threadId: ThreadId) => Mail[];
}

export const useStore = create<AppState>((set, get) => ({
  accounts: applyOverrides(mockAccounts),
  folders: mockFolders,
  labels: mockLabels,
  mails: mockMails,
  threads: buildThreads(mockMails),
  drafts: [],
  pendingSends: [],

  selectedFolderId: 'unified-inbox',
  selectedThreadId: null,
  selectedThreadIds: new Set(),
  composeOpen: false,
  composeDraft: null,
  commandPaletteOpen: false,
  searchQuery: '',
  focusMode: false,
  cheatSheetOpen: false,
  toast: null,

  prefs: loadPrefs(),
  savedViews: defaultViews,

  addAccount: (account) => {
    // Refuse silent duplicates so multiple onboardings don't pollute the list.
    if (get().accounts.some((a) => a.id === account.id || a.email === account.email)) return;
    const accounts = [...get().accounts, account];
    // Persist as full override so the account survives reload.
    const overrides = loadAccountOverrides();
    overrides[account.id] = account;
    saveAccountOverrides(overrides);
    const newFolders: Folder[] = [
      { id: `inbox_${account.id}`, accountId: account.id, name: 'Inbox', type: 'inbox', unreadCount: 0 },
      { id: `sent_${account.id}`, accountId: account.id, name: 'Envoyés', type: 'sent', unreadCount: 0 },
      { id: `drafts_${account.id}`, accountId: account.id, name: 'Brouillons', type: 'drafts', unreadCount: 0 },
      { id: `archive_${account.id}`, accountId: account.id, name: 'Archives', type: 'archive', unreadCount: 0 },
      { id: `trash_${account.id}`, accountId: account.id, name: 'Corbeille', type: 'trash', unreadCount: 0 },
    ];
    set({ accounts, folders: [...get().folders, ...newFolders] });
  },

  updateAccount: (id, patch) => {
    const accounts = get().accounts.map((a) => (a.id === id ? { ...a, ...patch } : a));
    set({ accounts });
    const overrides = loadAccountOverrides();
    overrides[id] = { ...(overrides[id] ?? {}), ...patch };
    saveAccountOverrides(overrides);
  },

  selectFolder: (id) =>
    set({ selectedFolderId: id, selectedThreadId: null, selectedThreadIds: new Set() }),

  toggleThreadCheck: (id) => {
    const cur = new Set(get().selectedThreadIds);
    if (cur.has(id)) cur.delete(id);
    else cur.add(id);
    set({ selectedThreadIds: cur });
  },

  selectAllVisible: () => {
    const ids = new Set(get().visibleThreads().map((t) => t.id));
    set({ selectedThreadIds: ids });
  },

  clearSelection: () => set({ selectedThreadIds: new Set() }),

  bulkArchive: () => {
    const ids = get().selectedThreadIds;
    if (ids.size === 0) return;
    const mailIds = get()
      .mails.filter((m) => ids.has(m.threadId))
      .map((m) => m.id);
    get().archive(mailIds);
    set({ selectedThreadIds: new Set() });
  },

  bulkTrash: () => {
    const ids = get().selectedThreadIds;
    if (ids.size === 0) return;
    const mailIds = get()
      .mails.filter((m) => ids.has(m.threadId))
      .map((m) => m.id);
    get().trash(mailIds);
    set({ selectedThreadIds: new Set() });
  },

  bulkSnooze: (untilIso) => {
    const ids = get().selectedThreadIds;
    if (ids.size === 0) return;
    const mailIds = get()
      .mails.filter((m) => ids.has(m.threadId))
      .map((m) => m.id);
    get().snooze(mailIds, untilIso);
    set({ selectedThreadIds: new Set() });
  },

  bulkMarkRead: (read) => {
    const ids = get().selectedThreadIds;
    if (ids.size === 0) return;
    const mailIds = get()
      .mails.filter((m) => ids.has(m.threadId))
      .map((m) => m.id);
    get().markRead(mailIds, read);
    set({ selectedThreadIds: new Set() });
  },

  saveCurrentSearch: (name) => {
    const q = get().searchQuery.trim();
    if (!q) {
      get().showToast('Tape une recherche avant de la sauvegarder');
      return;
    }
    if (get().savedViews.some((v) => v.query === q)) {
      get().showToast('Cette recherche est déjà sauvegardée');
      return;
    }
    const v = { id: `v_${Date.now().toString(36)}`, name, query: q };
    set({ savedViews: [...get().savedViews, v] });
    get().showToast(`Vue "${name}" enregistrée`);
  },

  openCheatSheet: () => set({ cheatSheetOpen: true }),
  closeCheatSheet: () => set({ cheatSheetOpen: false }),

  selectThread: (id) => {
    set({ selectedThreadId: id });
    if (id) {
      const mails = get().mails.map((m) =>
        m.threadId === id ? { ...m, read: true } : m,
      );
      set({ mails, threads: buildThreads(mails) });
    }
  },

  archive: (mailIds) => {
    const idset = new Set(mailIds);
    const mails = get().mails.map((m) =>
      idset.has(m.id)
        ? { ...m, folder: get().folders.find((f) => f.accountId === m.accountId && f.type === 'archive')?.id ?? m.folder }
        : m,
    );
    set({ mails, threads: buildThreads(mails) });
    playSound('archive', get().prefs.soundPack);
    get().showToast(
      mailIds.length === 1 ? 'Mail archivé' : `${mailIds.length} mails archivés`,
      { label: 'Annuler', run: () => set({ mails: get().mails }) },
    );
  },

  trash: (mailIds) => {
    const idset = new Set(mailIds);
    const mails = get().mails.map((m) =>
      idset.has(m.id)
        ? { ...m, folder: get().folders.find((f) => f.accountId === m.accountId && f.type === 'trash')?.id ?? m.folder }
        : m,
    );
    set({ mails, threads: buildThreads(mails) });
    get().showToast(`${mailIds.length} mail(s) supprimé(s)`, undefined, 8000);
  },

  toggleStar: (mailId) => {
    const mails = get().mails.map((m) => (m.id === mailId ? { ...m, starred: !m.starred } : m));
    set({ mails, threads: buildThreads(mails) });
  },

  markRead: (mailIds, read) => {
    const idset = new Set(mailIds);
    const mails = get().mails.map((m) => (idset.has(m.id) ? { ...m, read } : m));
    set({ mails, threads: buildThreads(mails) });
  },

  moveCategory: (mailId, category) => {
    const mails = get().mails.map((m) => (m.id === mailId ? { ...m, category } : m));
    set({ mails, threads: buildThreads(mails) });
  },

  snooze: (mailIds, untilIso) => {
    const idset = new Set(mailIds);
    const mails = get().mails.map((m) => (idset.has(m.id) ? { ...m, snoozedUntil: untilIso } : m));
    set({ mails, threads: buildThreads(mails), selectedThreadId: null });
    playSound('snooze', get().prefs.soundPack);
    get().showToast(`Reporté jusqu'à ${new Date(untilIso).toLocaleString()}`);
  },

  unsnooze: (mailIds) => {
    const idset = new Set(mailIds);
    const mails = get().mails.map((m) => {
      if (!idset.has(m.id)) return m;
      const { snoozedUntil: _omit, ...rest } = m;
      void _omit;
      return rest;
    });
    set({ mails, threads: buildThreads(mails) });
  },

  openCompose: (replyTo) => {
    const account = replyTo
      ? get().accounts.find((a) => a.id === replyTo.accountId) ?? get().accounts[0]
      : get().accounts[0];
    if (!account) return;
    const draft: Draft = {
      id: `draft_${Date.now()}`,
      accountId: account.id,
      to: replyTo ? [replyTo.from] : [],
      cc: [],
      bcc: [],
      subject: replyTo ? (replyTo.subject.startsWith('Re:') ? replyTo.subject : `Re: ${replyTo.subject}`) : '',
      body: replyTo ? `\n\n--- Le ${new Date(replyTo.receivedAt).toLocaleString()}, ${replyTo.from.name ?? replyTo.from.email} a écrit :\n> ${replyTo.bodyText.split('\n').join('\n> ')}` : '',
      ...(replyTo ? { inReplyTo: replyTo.id } : {}),
      updatedAt: new Date().toISOString(),
    };
    set({ composeOpen: true, composeDraft: draft });
  },

  closeCompose: () => {
    const draft = get().composeDraft;
    if (draft && (draft.subject.trim() || draft.body.trim())) {
      const drafts = [draft, ...get().drafts.filter((d) => d.id !== draft.id)];
      set({ drafts });
    }
    set({ composeOpen: false, composeDraft: null });
  },

  updateDraft: (patch) => {
    const cur = get().composeDraft;
    if (!cur) return;
    set({ composeDraft: { ...cur, ...patch, updatedAt: new Date().toISOString() } });
  },

  sendDraft: () => {
    const draft = get().composeDraft;
    if (!draft) return;
    const { undoSendSeconds } = get().prefs;
    set({ composeOpen: false, composeDraft: null });

    if (undoSendSeconds === 0) {
      // Immediate send path
      playSound('send', get().prefs.soundPack);
      get().showToast('Envoyé');
      return;
    }

    const req = scheduleSend(draft.id, draft, undoSendSeconds, async () => {
      // In real backend: hand to SMTP/JMAP layer.
      playSound('send', get().prefs.soundPack);
      get().showToast('Envoyé');
    });
    req.promise.catch(() => {
      /* user cancelled, already toasted */
    });
    set({ pendingSends: listPending() });
    get().showToast(
      `Envoi dans ${undoSendSeconds}s…`,
      {
        label: 'Annuler',
        run: () => {
          cancelSend(draft.id);
          set({ pendingSends: listPending(), composeOpen: true, composeDraft: draft });
        },
      },
      undoSendSeconds * 1000 + 200,
    );
  },

  undoSend: () => {
    const pending = listPending();
    const last = pending[pending.length - 1];
    if (!last) return;
    cancelSend(last.draftId);
    set({ pendingSends: listPending() });
    get().showToast('Envoi annulé');
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),

  updatePrefs: (patch) => {
    const next = { ...get().prefs, ...patch };
    set({ prefs: next });
    savePrefs(next);
    applyTheme(next.theme, next.density, next.fontSize);
  },

  toggleFocusMode: () => set({ focusMode: !get().focusMode }),

  showToast: (message, action, durationMs = 5000) => {
    const id = `toast_${Date.now()}`;
    const toast = action
      ? { id, message, action, expiresAt: Date.now() + durationMs }
      : { id, message, expiresAt: Date.now() + durationMs };
    set({ toast });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, durationMs);
  },

  dismissToast: () => set({ toast: null }),

  visibleMails: () => {
    const { mails, selectedFolderId, searchQuery, focusMode } = get();
    let pool = mails.filter((m) => !m.snoozedUntil || new Date(m.snoozedUntil) <= new Date());
    if (selectedFolderId === 'unified-inbox') {
      pool = pool.filter((m) => {
        const folder = get().folders.find((f) => f.id === m.folder);
        return folder?.type === 'inbox';
      });
    } else {
      pool = pool.filter((m) => m.folder === selectedFolderId);
    }
    if (focusMode) {
      pool = pool.filter((m) => m.category === 'work' || m.category === 'personal');
    }
    if (searchQuery.trim()) {
      return searchMails(pool, searchQuery);
    }
    return pool.sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt));
  },

  visibleThreads: () => {
    const visible = get().visibleMails();
    const threadIds = new Set(visible.map((m) => m.threadId));
    return get().threads.filter((t) => threadIds.has(t.id));
  },

  threadMails: (threadId) => {
    return get()
      .mails.filter((m) => m.threadId === threadId)
      .sort((a, b) => +new Date(a.receivedAt) - +new Date(b.receivedAt));
  },
}));
