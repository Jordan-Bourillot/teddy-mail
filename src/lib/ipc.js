// IPC bridge.
// In Tauri, calls go through `@tauri-apps/api/core` invoke. In a plain web
// build (npm run dev), we fall back to local mocks so the UI keeps working.
const tauriGlobal = () => {
    if (typeof window === 'undefined')
        return null;
    // Tauri 2.x exposes window.__TAURI_INTERNALS__.invoke; the official path is
    // dynamic import. We try both.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window;
    if (w.__TAURI_INTERNALS__?.invoke) {
        return { invoke: (cmd, args) => w.__TAURI_INTERNALS__.invoke(cmd, args) };
    }
    return null;
};
export const isTauri = () => tauriGlobal() !== null;
/**
 * Generic IPC call. Throws if running in web mode and no mock is registered
 * for the command.
 */
export async function invoke(cmd, args) {
    const t = tauriGlobal();
    if (t) {
        return (await t.invoke(cmd, args));
    }
    const mock = mocks[cmd];
    if (mock)
        return mock(args ?? {});
    throw new Error(`IPC command "${cmd}" called in web mode without a mock`);
}
export const ipc = {
    greet: () => invoke('greet'),
    openStore: (path, passphrase) => invoke('open_store', { path, passphrase }),
    isStoreOpen: () => invoke('is_store_open'),
    search: (query, limit) => invoke('search', { query, limit }),
    markRead: (mailId, read) => invoke('mark_read', { mailId, read }),
    snooze: (mailId, untilUnix) => invoke('snooze', { mailId, untilUnix }),
    startOAuth: (args) => invoke('start_oauth', { args }),
    completeOAuth: (args) => invoke('complete_oauth', { args }),
    listAccounts: () => invoke('list_accounts'),
};
// ---------------- mocks (web fallback) ----------------
const mocks = {
    greet: () => 'Pite Lafe Mail v0.1.0 (web preview)',
    is_store_open: () => true,
    list_accounts: () => [],
    search: ({ query }) => {
        // Web mode delegates to the in-memory store search; this stub is only hit
        // from places that try to call IPC directly. Returns empty so callers can
        // distinguish "no IPC backend" (this) from "no results".
        void query;
        return [];
    },
    mark_read: () => undefined,
    snooze: () => undefined,
    open_store: () => undefined,
    start_oauth: ({ args }) => {
        const a = args;
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
