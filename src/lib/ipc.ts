// IPC bridge.
// In Tauri, calls go through `@tauri-apps/api/core` invoke. In a plain web
// build (npm run dev), we fall back to local mocks so the UI keeps working.

type AnyArgs = Record<string, unknown>;

const tauriGlobal = (): { invoke: (cmd: string, args?: AnyArgs) => Promise<unknown> } | null => {
  if (typeof window === 'undefined') return null;
  // Tauri 2.x exposes window.__TAURI_INTERNALS__.invoke; the official path is
  // dynamic import. We try both.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  if (w.__TAURI_INTERNALS__?.invoke) {
    return { invoke: (cmd, args) => w.__TAURI_INTERNALS__.invoke(cmd, args) };
  }
  return null;
};

export const isTauri = (): boolean => tauriGlobal() !== null;

/**
 * Generic IPC call. Throws if running in web mode and no mock is registered
 * for the command.
 */
export async function invoke<T = unknown>(cmd: string, args?: AnyArgs): Promise<T> {
  const t = tauriGlobal();
  if (t) {
    return (await t.invoke(cmd, args)) as T;
  }
  const mock = mocks[cmd];
  if (mock) return mock(args ?? {}) as T;
  throw new Error(`IPC command "${cmd}" called in web mode without a mock`);
}

// ---------------- typed wrappers ----------------

export interface OAuthStartArgs {
  provider: 'gmail' | 'outlook';
  client_id: string;
  redirect_uri: string;
}
export interface OAuthStartResult {
  auth_url: string;
  state_token: string;
  code_verifier: string;
}
export interface OAuthCompleteArgs extends OAuthStartArgs {
  code: string;
  code_verifier: string;
  account_id: string;
}

export const ipc = {
  greet: () => invoke<string>('greet'),
  openStore: (path: string, passphrase: string) =>
    invoke<void>('open_store', { path, passphrase }),
  isStoreOpen: () => invoke<boolean>('is_store_open'),
  search: (query: string, limit: number) => invoke<string[]>('search', { query, limit }),
  markRead: (mailId: string, read: boolean) =>
    invoke<void>('mark_read', { mailId, read }),
  snooze: (mailId: string, untilUnix: number) =>
    invoke<void>('snooze', { mailId, untilUnix }),
  startOAuth: (args: OAuthStartArgs) => invoke<OAuthStartResult>('start_oauth', { args }),
  completeOAuth: (args: OAuthCompleteArgs) => invoke<void>('complete_oauth', { args }),
  listAccounts: () =>
    invoke<{ id: string; email: string; provider: string }[]>('list_accounts'),
};

// ---------------- mocks (web fallback) ----------------

const mocks: Record<string, (args: AnyArgs) => unknown> = {
  greet: () => 'Pite Lafe Mail v0.1.0 (web preview)',
  is_store_open: () => true,
  list_accounts: () => [],
  search: ({ query }: AnyArgs) => {
    // Web mode delegates to the in-memory store search; this stub is only hit
    // from places that try to call IPC directly. Returns empty so callers can
    // distinguish "no IPC backend" (this) from "no results".
    void query;
    return [];
  },
  mark_read: () => undefined,
  snooze: () => undefined,
  open_store: () => undefined,
  start_oauth: ({ args }: AnyArgs) => {
    const a = args as OAuthStartArgs;
    // In web mode, fake a non-functional URL so the UI can still walk the flow
    // and tell the user "this requires the desktop build".
    return {
      auth_url: `https://example.invalid/oauth/${a.provider}?client_id=${a.client_id}`,
      state_token: 'web-mock-state',
      code_verifier: 'web-mock-verifier',
    };
  },
  complete_oauth: () => {
    throw new Error('OAuth completion only works in the desktop build');
  },
};
