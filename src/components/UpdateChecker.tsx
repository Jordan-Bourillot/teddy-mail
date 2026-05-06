import { useEffect, useState } from 'react';
import { isTauri } from '@/lib/ipc';

interface UpdateInfo {
  version: string;
  date?: string;
  body?: string;
}

type State =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available'; info: UpdateInfo; downloadProgress?: number; ready: boolean }
  | { kind: 'error'; message: string };

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 h
const STORAGE_KEY = 'teddy-mail-last-update-check';

export function UpdateChecker() {
  const [state, setState] = useState<State>({ kind: 'idle' });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;
    const lastCheck = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    if (Date.now() - lastCheck < CHECK_INTERVAL_MS) return;
    void checkForUpdate(setState);
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }, []);

  if (state.kind !== 'available' || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-12 left-4 z-50 max-w-sm bg-surface border border-accent rounded-lg shadow-lg p-3"
    >
      <div className="flex items-start gap-3">
        <div className="text-accent text-lg leading-none">↑</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">
            Mise à jour disponible — v{state.info.version}
          </div>
          {state.info.body && (
            <div className="text-xs text-muted mt-0.5 line-clamp-2">{state.info.body}</div>
          )}
          {state.downloadProgress !== undefined && (
            <div className="mt-2 h-1 rounded-full bg-surface-2 overflow-hidden">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${state.downloadProgress}%` }}
              />
            </div>
          )}
          <div className="mt-2 flex gap-2">
            {!state.ready && state.downloadProgress === undefined && (
              <button
                onClick={() => void downloadAndInstall(state.info, setState)}
                className="px-3 py-1 text-xs rounded bg-accent text-white font-medium hover:opacity-90"
              >
                Installer
              </button>
            )}
            {state.ready && (
              <button
                onClick={() => void restartApp()}
                className="px-3 py-1 text-xs rounded bg-accent text-white font-medium hover:opacity-90"
              >
                Redémarrer
              </button>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1 text-xs rounded hover:bg-surface-2 text-muted"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function checkForUpdate(setState: (s: State) => void) {
  try {
    setState({ kind: 'checking' });
    const updaterMod = await import('@tauri-apps/plugin-updater');
    const update = await updaterMod.check();
    if (!update) {
      setState({ kind: 'idle' });
      return;
    }
    const info: UpdateInfo = { version: update.version };
    if (update.date) info.date = update.date;
    if (update.body) info.body = update.body;
    setState({ kind: 'available', info, ready: false });
    // Stash the update object on the window so the install handler can reuse it.
    (window as unknown as { __pendingUpdate?: unknown }).__pendingUpdate = update;
  } catch (e) {
    setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
  }
}

async function downloadAndInstall(info: UpdateInfo, setState: (s: State) => void) {
  try {
    const update = (window as unknown as { __pendingUpdate?: { downloadAndInstall: (cb: (p: { event: string; data?: { chunkLength?: number; contentLength?: number } }) => void) => Promise<void> } }).__pendingUpdate;
    if (!update) throw new Error('Update reference lost. Reload to retry.');
    let downloaded = 0;
    let total = 0;
    setState({ kind: 'available', info, downloadProgress: 0, ready: false });
    await update.downloadAndInstall((p: { event: string; data?: { chunkLength?: number; contentLength?: number } }) => {
      if (p.event === 'Started' && p.data?.contentLength) {
        total = p.data.contentLength;
      } else if (p.event === 'Progress' && p.data?.chunkLength) {
        downloaded += p.data.chunkLength;
        const pct = total > 0 ? Math.round((downloaded / total) * 100) : undefined;
        setState({ kind: 'available', info, ...(pct !== undefined ? { downloadProgress: pct } : {}), ready: false });
      } else if (p.event === 'Finished') {
        setState({ kind: 'available', info, downloadProgress: 100, ready: true });
      }
    });
  } catch (e) {
    setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
  }
}

async function restartApp() {
  const procMod = await import('@tauri-apps/plugin-process');
  await procMod.relaunch();
}
